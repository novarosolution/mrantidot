import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Trash2 } from 'lucide-react-native';
import { AdminDataTable, TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { SegmentedToggle } from '@/components/admin/AdminFilterBar';
import { csvSections, shareCsv } from '@/components/admin/csv';
import {
  DateRangePicker,
  formatRangeLabel,
  formatRangeSummary,
  istTodayKey,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { PayAdjustmentSheet, RecordPayoutSheet, dayKeyLabel } from '@/components/admin/PayrollSheets';
import { formatINR, formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminEntrance, AdminListShell, AdminSectionTitle, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { formatDayKey, initials, plural } from '@/components/kit/format';
import { GlassPanel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { colors, fonts, premium, radii, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { appToast } from '@/lib/toast';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWebWideContent, useWideWebLayout } from '@/lib/webAdmin';
import type { PayrollJob } from '@/types/adminLists';
import {
  PAYOUT_METHODS,
  type PayoutMethod,
  type PayrollAdjustment,
  type PayrollLedgerPage,
  type PayrollLedgerRow,
  type PayrollPayout,
} from '@/types/adminOps';

type Mode = 'month' | 'range';
type Tab = 'jobs' | 'payouts' | 'adjustments';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const webPointer: ViewStyle | null = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

function monthTitle(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-11-12 12:45" in IST for the CSV. */
function istDateTime(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t + 330 * 60_000).toISOString().slice(0, 16).replace('T', ' ');
}

/** "24 Nov" from an ISO time, in IST. */
function istDay(iso?: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return formatDayKey(new Date(t + 330 * 60_000).toISOString().slice(0, 10));
}

const methodLabel = (m: PayoutMethod) => PAYOUT_METHODS.find((x) => x.key === m)?.label ?? m;

function signedINR(n: number): string {
  if (n === 0) return formatINR(0);
  return `${n > 0 ? '+' : '−'}${formatINR(Math.abs(n))}`;
}

/** Due / paid / overpaid at a glance. */
function DueBadge({ row }: { row: PayrollLedgerRow }) {
  const owed = row.earnings + row.adjustments;
  const look =
    row.due > 0
      ? { bg: colors.amberBg, fg: colors.amberInk, text: `${formatINR(row.due)} due` }
      : row.due < 0
        ? { bg: colors.blueBg, fg: colors.blue, text: `${formatINR(-row.due)} overpaid` }
        : owed > 0
          ? { bg: colors.soft, fg: colors.forest, text: 'Paid' }
          : { bg: colors.greyBg, fg: ui.textSecondary, text: 'Nothing due' };
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }]} accessibilityLabel={look.text}>
      <Text style={[styles.badgeText, { color: look.fg }]} numberOfLines={1}>
        {look.text}
      </Text>
    </View>
  );
}

/** Earned / adjustments / paid / due for one technician. */
function LedgerStrip({ row }: { row: PayrollLedgerRow }) {
  const cells = [
    { label: 'Earned', value: formatINR(row.earnings), sub: plural(row.jobsCompleted, 'job') },
    { label: 'Adjustments', value: signedINR(row.adjustments), sub: plural(row.adjustmentCount, 'entry') },
    { label: 'Paid', value: formatINR(row.paid), sub: plural(row.payoutCount, 'payout') },
    { label: row.due < 0 ? 'Overpaid' : 'Due', value: formatINR(Math.abs(row.due)), sub: row.lastPaidAt ? `Last paid ${istDay(row.lastPaidAt)}` : 'Not paid yet', strong: true },
  ];
  return (
    <View style={styles.strip}>
      {cells.map((c) => (
        <View key={c.label} style={[styles.stripCell, c.strong && styles.stripCellStrong]}>
          <Text style={styles.stripLabel}>{c.label}</Text>
          <Text style={[styles.stripValue, c.strong && styles.stripValueStrong]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {c.value}
          </Text>
          <Text style={styles.stripSub} numberOfLines={1}>
            {c.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

function JobRow({ job }: { job: PayrollJob }) {
  return (
    <Pressable
      onPress={() => appPush(adminRoutes.booking(job.bookingId))}
      style={({ pressed }) => [styles.listRow, webPointer, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${job.ref}, ${job.serviceName}, ${formatINR(job.earning)}. Open booking`}
    >
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {job.serviceName}
          {job.option ? ` · ${job.option}` : ''}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatDayKey(job.date)} · {job.ref} · {job.customerName}
        </Text>
      </View>
      <View style={styles.money}>
        <Text style={styles.moneyMain}>{formatINR(job.earning)}</Text>
        <Text style={styles.moneySub}>of {formatINR(job.jobValue)}</Text>
      </View>
    </Pressable>
  );
}

function DeleteButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={10}
      style={({ pressed }) => [styles.deleteBtn, webPointer, (pressed || busy) && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Trash2 size={16} color={busy ? ui.textTertiary : colors.error} strokeWidth={2.2} />
    </Pressable>
  );
}

function PayoutRow({ p, busy, onDelete }: { p: PayrollPayout; busy: boolean; onDelete: () => void }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {formatINR(p.amount)} · {methodLabel(p.method)}
          {p.reference ? ` · ${p.reference}` : ''}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={2}>
          Paid {istDay(p.paidAt)} · for {formatRangeLabel({ from: p.periodFrom, to: p.periodTo })} · by {p.createdBy.name}
          {p.note ? ` · ${p.note}` : ''}
        </Text>
        {p.counted === false ? <Text style={styles.notCounted}>Covers dates outside this period — not counted here</Text> : null}
      </View>
      <DeleteButton label={`Delete the ${formatINR(p.amount)} payout`} busy={busy} onPress={onDelete} />
    </View>
  );
}

function AdjustmentRow({ a, busy, onDelete }: { a: PayrollAdjustment; busy: boolean; onDelete: () => void }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {a.reason}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {a.amount > 0 ? 'Bonus' : 'Deduction'} · {formatDayKey(a.date)} · by {a.createdBy.name}
        </Text>
      </View>
      <Text style={[styles.moneyMain, a.amount < 0 && styles.moneyNegative]}>{signedINR(a.amount)}</Text>
      <DeleteButton label={`Delete the ${a.amount > 0 ? 'bonus' : 'deduction'} of ${formatINR(Math.abs(a.amount))}`} busy={busy} onPress={onDelete} />
    </View>
  );
}

export default function AdminPayrollScreen() {
  const wide = useWideWebLayout();
  useWebWideContent(wide);
  const today = istTodayKey();
  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [rangeValue, setRangeValue] = useState<DateRangeValue>({ preset: 'lastMonth' });
  const [data, setData] = useState<PayrollLedgerPage | null>(null);
  const [payouts, setPayouts] = useState<PayrollPayout[]>([]);
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('jobs');
  const [exporting, setExporting] = useState(false);
  const [payFor, setPayFor] = useState<PayrollLedgerRow | null>(null);
  const [adjustFor, setAdjustFor] = useState<PayrollLedgerRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { loading, error, refreshing, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const range = mode === 'range' ? resolveDateRange(rangeValue) : null;
  const params = useMemo(
    () => (range ? { from: range.from, to: range.to } : { month }),
    [range?.from, range?.to, month],
  );

  const load = useCallback(async () => {
    const opts = { ...screenLoadConfig, skipCache: true };
    const [pay, po, adj] = await Promise.all([
      api.get<PayrollLedgerPage>('/admin/payroll', { ...opts, params: { ...params, includeJobs: 1 } }),
      api.get<{ payouts: PayrollPayout[] }>('/admin/payroll/payouts', { ...opts, params: { ...params, limit: 500 } }),
      api.get<{ adjustments: PayrollAdjustment[] }>('/admin/payroll/adjustments', { ...opts, params: { ...params, limit: 500 } }),
    ]);
    setData(pay.data);
    setPayouts(po.data.payouts);
    setAdjustments(adj.data.adjustments);
    setSelected((cur) =>
      cur && pay.data.technicians.some((t) => t.technicianId === cur)
        ? cur
        : (pay.data.technicians.find((t) => t.jobsCompleted > 0 || t.due !== 0)?.technicianId ?? null),
    );
  }, [params]);

  useEffect(() => {
    void reload(load, 'Could not load payroll');
  }, [load, reload]);

  useStaleFocusRefresh(() => refresh(load), 15_000);

  const rows = data?.technicians ?? [];
  const selectedRow = rows.find((r) => r.technicianId === selected) ?? null;
  const period = data ? { from: data.from, to: data.to } : null;
  const periodLabel = period ? formatRangeSummary(period) : '';

  const payoutsByTech = useMemo(() => {
    const map = new Map<string, PayrollPayout[]>();
    for (const p of payouts) map.set(p.technicianId, [...(map.get(p.technicianId) ?? []), p]);
    return map;
  }, [payouts]);
  const adjustmentsByTech = useMemo(() => {
    const map = new Map<string, PayrollAdjustment[]>();
    for (const a of adjustments) map.set(a.technicianId, [...(map.get(a.technicianId) ?? []), a]);
    return map;
  }, [adjustments]);

  async function afterChange() {
    try {
      await load();
    } catch {
      appToast({ type: 'error', title: 'Saved — but the list could not refresh', message: 'Pull to refresh.' });
    }
  }

  async function deletePayout(p: PayrollPayout) {
    const ok = await confirmAsync({
      title: `Delete the ${formatINR(p.amount)} payout?`,
      message: `${p.technicianName ?? 'Technician'} · ${methodLabel(p.method)}${p.reference ? ` · ${p.reference}` : ''} · paid ${istDay(
        p.paidAt,
      )}. It comes off “paid” and the due amount goes up again. The activity log keeps a record.`,
      confirmLabel: 'Delete payout',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(p.id);
    try {
      await api.delete(`/admin/payroll/payouts/${p.id}`);
      haptic('success');
      appToast({ type: 'success', title: 'Payout deleted' });
      await afterChange();
    } catch {
      haptic('error');
    } finally {
      setDeleting(null);
    }
  }

  async function deleteAdjustment(a: PayrollAdjustment) {
    const kind = a.amount > 0 ? 'bonus' : 'deduction';
    const ok = await confirmAsync({
      title: `Delete this ${kind}?`,
      message: `${signedINR(a.amount)} for ${a.technicianName ?? 'the technician'} on ${dayKeyLabel(a.date)} — “${a.reason}”. The due amount is recalculated.`,
      confirmLabel: `Delete ${kind}`,
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(a.id);
    try {
      await api.delete(`/admin/payroll/adjustments/${a.id}`);
      haptic('success');
      appToast({ type: 'success', title: kind === 'bonus' ? 'Bonus deleted' : 'Deduction deleted' });
      await afterChange();
    } catch {
      haptic('error');
    } finally {
      setDeleting(null);
    }
  }

  const exportCsv = useCallback(async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      const summaryRows = data.technicians.map((t) => [
        t.name,
        t.phone ?? '',
        t.paySummary,
        t.jobsCompleted,
        t.jobValue,
        t.earnings,
        t.adjustments,
        t.paid,
        t.due,
      ]);
      summaryRows.push([
        'TOTAL',
        '',
        '',
        data.totalJobs,
        data.totalJobValue,
        data.totalEarnings,
        data.totalAdjustments,
        data.totalPaid,
        data.totalDue - data.totalOverpaid,
      ]);
      const jobRows = data.technicians.flatMap((t) =>
        (t.jobs ?? []).map((j) => [
          t.name,
          j.ref,
          j.date,
          j.slot,
          j.serviceName,
          j.option ?? '',
          j.customerName,
          j.customerPhone ?? '',
          j.jobValue,
          j.earning,
          j.locked ? 'Locked at completion' : 'From current pay rule',
          istDateTime(j.completedAt),
        ]),
      );
      const payoutRows = payouts.map((p) => [
        p.technicianName ?? '',
        istDateTime(p.paidAt),
        p.amount,
        methodLabel(p.method),
        p.reference ?? '',
        p.periodFrom,
        p.periodTo,
        p.counted === false ? 'No (period reaches outside this range)' : 'Yes',
        p.note ?? '',
        p.createdBy.name,
      ]);
      const adjustmentRows = adjustments.map((a) => [
        a.technicianName ?? '',
        a.date,
        a.amount > 0 ? 'Bonus' : 'Deduction',
        a.amount,
        a.reason,
        a.createdBy.name,
      ]);
      const content = csvSections([
        {
          title: `Mr Antidot payroll · ${formatRangeLabel({ from: data.from, to: data.to })} (completed jobs by visit date; due = take-home + adjustments − paid)`,
          headers: ['Technician', 'Phone', 'Pay rule', 'Jobs', 'Job value (INR)', 'Take-home (INR)', 'Adjustments (INR)', 'Paid (INR)', 'Due (INR)'],
          rows: summaryRows,
        },
        {
          title: 'Jobs',
          headers: [
            'Technician',
            'Booking',
            'Visit date',
            'Slot',
            'Service',
            'Size',
            'Customer',
            'Customer phone',
            'Job value (INR)',
            'Take-home (INR)',
            'Take-home basis',
            'Completed at (IST)',
          ],
          rows: jobRows,
        },
        {
          title: 'Payouts',
          headers: ['Technician', 'Paid at (IST)', 'Amount (INR)', 'Method', 'Reference', 'Period from', 'Period to', 'Counted in this range', 'Note', 'Recorded by'],
          rows: payoutRows,
        },
        {
          title: 'Adjustments',
          headers: ['Technician', 'Date', 'Type', 'Amount (INR)', 'Reason', 'Added by'],
          rows: adjustmentRows,
        },
      ]);
      const suffix = mode === 'month' ? data.month : `${data.from}_to_${data.to}`;
      const result = await shareCsv(`mrantidot-payroll-${suffix}.csv`, content, 'Payroll CSV');
      haptic('success');
      if (result === 'downloaded') appToast({ type: 'success', title: 'Payroll CSV downloaded' });
    } catch {
      haptic('error');
      appToast({ type: 'error', title: 'Could not export payroll' });
    } finally {
      setExporting(false);
    }
  }, [data, payouts, adjustments, exporting, mode]);

  const techColumns = useMemo<AdminTableColumn<PayrollLedgerRow>[]>(
    () => [
      {
        key: 'name',
        title: 'Technician',
        flex: 1.5,
        minWidth: 200,
        render: (r) => (
          <TableTwoLine
            title={r.name}
            sub={[r.paySummary, r.disabled ? 'Disabled' : r.available ? '' : 'Off duty'].filter(Boolean).join(' · ')}
          />
        ),
      },
      { key: 'jobs', title: 'Jobs', width: 70, align: 'right', render: (r) => <TableText strong>{r.jobsCompleted}</TableText> },
      {
        key: 'earn',
        title: 'Take-home',
        width: 118,
        align: 'right',
        render: (r) => (
          <TableText strong color={r.technicianId === selected ? colors.forest : undefined}>
            {formatINR(r.earnings)}
          </TableText>
        ),
      },
      {
        key: 'adj',
        title: 'Adjustments',
        width: 118,
        align: 'right',
        render: (r) => (
          <TableText muted={r.adjustments === 0} color={r.adjustments < 0 ? colors.error : undefined}>
            {r.adjustments === 0 ? '—' : signedINR(r.adjustments)}
          </TableText>
        ),
      },
      { key: 'paid', title: 'Paid', width: 112, align: 'right', render: (r) => <TableText muted={r.paid === 0}>{r.paid === 0 ? '—' : formatINR(r.paid)}</TableText> },
      { key: 'due', title: 'Status', width: 150, align: 'right', render: (r) => <DueBadge row={r} /> },
    ],
    [selected],
  );

  const jobColumns = useMemo<AdminTableColumn<PayrollJob>[]>(
    () => [
      { key: 'ref', title: 'Booking', width: 112, render: (j) => <TableText strong>{j.ref}</TableText> },
      { key: 'date', title: 'Visit', width: 128, render: (j) => <TableTwoLine title={formatDayKey(j.date)} sub={j.slot} strong={false} /> },
      { key: 'service', title: 'Service', flex: 1.3, minWidth: 160, render: (j) => <TableTwoLine title={j.serviceName} sub={j.option} /> },
      {
        key: 'customer',
        title: 'Customer',
        flex: 1,
        minWidth: 140,
        render: (j) => <TableTwoLine title={j.customerName} sub={j.customerPhone} strong={false} />,
      },
      { key: 'value', title: 'Job value', width: 112, align: 'right', render: (j) => <TableText>{formatINR(j.jobValue)}</TableText> },
      {
        key: 'earn',
        title: 'Take-home',
        width: 120,
        align: 'right',
        render: (j) => <TableTwoLine title={formatINR(j.earning)} sub={j.locked ? 'Locked' : 'Current rule'} />,
      },
    ],
    [],
  );

  // Not memoised: the delete buttons must always call the current `load` (period).
  const payoutColumns: AdminTableColumn<PayrollPayout>[] = [
    { key: 'paid', title: 'Paid on', width: 110, render: (p) => <TableTwoLine title={istDay(p.paidAt)} sub={p.createdBy.name} strong={false} /> },
    {
      key: 'amount',
      title: 'Amount',
      width: 120,
      align: 'right',
      render: (p) => <TableTwoLine title={formatINR(p.amount)} sub={p.counted === false ? 'Not counted' : undefined} />,
    },
    { key: 'method', title: 'Method', flex: 1, minWidth: 150, render: (p) => <TableTwoLine title={methodLabel(p.method)} sub={p.reference} strong={false} /> },
    {
      key: 'period',
      title: 'For',
      flex: 1,
      minWidth: 150,
      render: (p) => <TableTwoLine title={formatRangeLabel({ from: p.periodFrom, to: p.periodTo })} sub={p.note} strong={false} />,
    },
    {
      key: 'delete',
      title: '',
      width: 56,
      align: 'center',
      render: (p) => (
        <DeleteButton label={`Delete the ${formatINR(p.amount)} payout`} busy={deleting === p.id} onPress={() => void deletePayout(p)} />
      ),
    },
  ];

  const adjustmentColumns: AdminTableColumn<PayrollAdjustment>[] = [
    { key: 'date', title: 'Date', width: 110, render: (a) => <TableTwoLine title={formatDayKey(a.date)} sub={a.createdBy.name} strong={false} /> },
    {
      key: 'amount',
      title: 'Amount',
      width: 130,
      align: 'right',
      render: (a) => (
        <TableTwoLine
          title={<Text style={a.amount < 0 ? styles.moneyNegative : undefined}>{signedINR(a.amount)}</Text>}
          sub={a.amount > 0 ? 'Bonus' : 'Deduction'}
        />
      ),
    },
    { key: 'reason', title: 'Reason', flex: 1.6, minWidth: 200, render: (a) => <TableText lines={2}>{a.reason}</TableText> },
    {
      key: 'delete',
      title: '',
      width: 56,
      align: 'center',
      render: (a) => (
        <DeleteButton
          label={`Delete the ${a.amount > 0 ? 'bonus' : 'deduction'} of ${formatINR(Math.abs(a.amount))}`}
          busy={deleting === a.id}
          onPress={() => void deleteAdjustment(a)}
        />
      ),
    },
  ];

  const periodControls = (
    <View style={styles.controls}>
      <SegmentedToggle<Mode>
        options={[
          { value: 'month', label: 'Month' },
          { value: 'range', label: 'Custom range' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'month' ? (
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setMonth((m) => shiftMonth(m, -1))}
            style={({ pressed }) => [styles.stepBtn, webPointer, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={18} color={ui.text} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.stepLabel}>{monthTitle(month)}</Text>
          <Pressable
            onPress={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={month >= today.slice(0, 7)}
            style={({ pressed }) => [styles.stepBtn, month >= today.slice(0, 7) && styles.stepBtnOff, webPointer, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <ChevronRight size={18} color={month >= today.slice(0, 7) ? ui.textTertiary : ui.text} strokeWidth={2.4} />
          </Pressable>
          {month !== today.slice(0, 7) ? (
            <Pressable onPress={() => setMonth(today.slice(0, 7))} hitSlop={8} accessibilityRole="button">
              <Text style={styles.reset}>This month</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <DateRangePicker
          value={rangeValue}
          onChange={(v) => setRangeValue(v)}
          presets={['thisMonth', 'lastMonth', '30d', 'custom']}
          maxDays={366}
        />
      )}
    </View>
  );

  const owedTechs = rows.filter((r) => r.due > 0).length;
  const summary = data ? (
    <View style={styles.summaryShell}>
      <LinearGradient
        colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
        style={styles.summary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryTop}>
          <Text style={styles.period}>{periodLabel}</Text>
          <Pressable
            onPress={() => void exportCsv()}
            disabled={exporting}
            style={({ pressed }) => [styles.exportBtn, webPointer, (pressed || exporting) && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Export payroll as CSV"
          >
            <Download size={15} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.exportText}>{exporting ? 'Preparing…' : 'Export CSV'}</Text>
          </Pressable>
        </View>
        <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatINR(data.totalDue)}
        </Text>
        <Text style={styles.sub}>
          {data.totalDue > 0 ? `Still to pay · ${plural(owedTechs, 'technician')}` : 'Nothing left to pay for this period'}
          {data.totalOverpaid > 0 ? ` · ${formatINR(data.totalOverpaid)} paid in advance` : ''}
        </Text>
        <View style={styles.heroStats}>
          <HeroStat label="Take-home" value={formatINR(data.totalEarnings)} sub={plural(data.totalJobs, 'job')} />
          <HeroStat label="Adjustments" value={signedINR(data.totalAdjustments)} />
          <HeroStat label="Paid" value={formatINR(data.totalPaid)} />
        </View>
      </LinearGradient>
    </View>
  ) : null;

  function ledgerTabs(row: PayrollLedgerRow) {
    const jobs = row.jobs ?? [];
    const pays = payoutsByTech.get(row.technicianId) ?? [];
    const adjs = adjustmentsByTech.get(row.technicianId) ?? [];
    return {
      jobs,
      pays,
      adjs,
      toggle: (
        <SegmentedToggle<Tab>
          options={[
            { value: 'jobs', label: `Jobs · ${jobs.length}` },
            { value: 'payouts', label: `Payouts · ${pays.length}` },
            { value: 'adjustments', label: `Adjustments · ${adjs.length}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      ),
    };
  }

  function ledgerActions(row: PayrollLedgerRow) {
    return (
      <View style={styles.actions}>
        <Button
          title={row.due > 0 ? `Record payout · ${formatINR(row.due)}` : 'Record payout'}
          variant="premium"
          size="sm"
          fullWidth={false}
          onPress={() => setPayFor(row)}
          style={styles.actionBtn}
        />
        <Button title="Add adjustment" variant="secondary" size="sm" fullWidth={false} onPress={() => setAdjustFor(row)} style={styles.actionBtn} />
      </View>
    );
  }

  const overlapNote = (row: PayrollLedgerRow) =>
    row.overlapPayouts > 0 ? (
      <Text style={styles.footnote}>
        {`${plural(row.overlapPayouts, 'payout')} (${formatINR(row.overlapPaid)}) cover dates outside this period, so they aren’t counted here — view the period they were recorded for.`}
      </Text>
    ) : null;

  const body = () => {
    if (loading && !data) return <AdminListSkeleton variant="payroll" rows={4} strip />;
    if (error && !data) return <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />;
    if (!data) return null;

    if (wide) {
      const t = selectedRow ? ledgerTabs(selectedRow) : null;
      return (
        <ScrollView contentContainerStyle={styles.deskContent}>
          {periodControls}
          {summary}
          <AdminSectionTitle title="Technicians" hint="Select a technician to pay them, adjust their pay or see the history" flush />
          <AdminDataTable
            columns={techColumns}
            rows={rows}
            keyExtractor={(r) => r.technicianId}
            onRowPress={(r) => setSelected(r.technicianId)}
            rowLabel={(r) => `${r.name}, ${formatINR(r.due)} due. Show details`}
            loading={loading}
            emptyTitle="No technicians yet"
            emptyMessage="Earnings show here once technicians complete jobs."
          />
          {selectedRow && t ? (
            <>
              <AdminSectionTitle
                title={selectedRow.name}
                hint={`${selectedRow.paySummary} · ${formatRangeLabel(period)}`}
                actionLabel="Profile"
                onAction={() => appPush(adminRoutes.technician(selectedRow.technicianId))}
                flush
              />
              <View style={styles.deskLedgerHead}>
                <View style={styles.flex}>
                  <LedgerStrip row={selectedRow} />
                </View>
                {ledgerActions(selectedRow)}
              </View>
              {t.toggle}
              {tab === 'jobs' ? (
                <AdminDataTable
                  columns={jobColumns}
                  rows={t.jobs}
                  keyExtractor={(j) => j.bookingId}
                  onRowPress={(j) => appPush(adminRoutes.booking(j.bookingId))}
                  rowLabel={(j) => `${j.ref}, ${j.serviceName}. Open booking`}
                  emptyTitle="No completed jobs"
                  emptyMessage="Nothing completed in this period."
                />
              ) : tab === 'payouts' ? (
                <AdminDataTable
                  columns={payoutColumns}
                  rows={t.pays}
                  keyExtractor={(p) => p.id}
                  emptyTitle="No payouts yet"
                  emptyMessage={`Record what you pay ${selectedRow.name} and the due amount updates.`}
                />
              ) : (
                <AdminDataTable
                  columns={adjustmentColumns}
                  rows={t.adjs}
                  keyExtractor={(a) => a.id}
                  emptyTitle="No bonuses or deductions"
                  emptyMessage="Add one to change what this technician is owed for the period."
                />
              )}
              {overlapNote(selectedRow)}
            </>
          ) : null}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={[adminListShellStyles.scroll, styles.content]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.forest} />}
        {...customerScrollProps}
      >
        {periodControls}
        {summary}
        {rows.length === 0 ? <EmptyState title="No technicians yet" message="Earnings show here once technicians complete jobs." /> : null}
        {rows.map((r, i) => {
          const open = selected === r.technicianId;
          const t = open ? ledgerTabs(r) : null;
          return (
            <AdminEntrance key={r.technicianId} index={i + 1} play={entrance(i)}>
              <GlassPanel goldEdge tone="light" style={styles.card}>
                <Pressable
                  onPress={() => {
                    haptic('select');
                    setSelected(open ? null : r.technicianId);
                  }}
                  style={styles.rowTop}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${r.name}, ${r.due > 0 ? `${formatINR(r.due)} due` : 'nothing due'}. ${open ? 'Hide' : 'Show'} details`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(r.name)}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {plural(r.jobsCompleted, 'job')} · {formatINR(r.earnings)} earned · {r.paySummary}
                      {r.disabled ? ' · Disabled' : r.available ? '' : ' · Off duty'}
                    </Text>
                  </View>
                  <View style={styles.earnCol}>
                    <DueBadge row={r} />
                    {open ? (
                      <ChevronUp size={16} color={ui.textTertiary} strokeWidth={2.4} />
                    ) : (
                      <ChevronDown size={16} color={ui.textTertiary} strokeWidth={2.4} />
                    )}
                  </View>
                </Pressable>
                {open && t ? (
                  <View style={styles.detail}>
                    <LedgerStrip row={r} />
                    {ledgerActions(r)}
                    {t.toggle}
                    {tab === 'jobs' ? (
                      t.jobs.length === 0 ? (
                        <Text style={styles.empty}>No completed jobs in this period.</Text>
                      ) : (
                        t.jobs.map((j) => <JobRow key={j.bookingId} job={j} />)
                      )
                    ) : tab === 'payouts' ? (
                      t.pays.length === 0 ? (
                        <Text style={styles.empty}>No payouts recorded for this period yet.</Text>
                      ) : (
                        t.pays.map((p) => <PayoutRow key={p.id} p={p} busy={deleting === p.id} onDelete={() => void deletePayout(p)} />)
                      )
                    ) : t.adjs.length === 0 ? (
                      <Text style={styles.empty}>No bonuses or deductions in this period.</Text>
                    ) : (
                      t.adjs.map((a) => <AdjustmentRow key={a.id} a={a} busy={deleting === a.id} onDelete={() => void deleteAdjustment(a)} />)
                    )}
                    {overlapNote(r)}
                    <Pressable
                      onPress={() => appPush(adminRoutes.technician(r.technicianId))}
                      style={({ pressed }) => [styles.profileLink, pressed && styles.pressed]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.profileText}>Open profile</Text>
                    </Pressable>
                  </View>
                ) : null}
              </GlassPanel>
            </AdminEntrance>
          );
        })}
        <Text style={styles.footnote}>
          Completed jobs count by visit date; take-home is locked when a job completes. Due = take-home + bonuses − deductions − payouts
          recorded for this period.
        </Text>
      </ScrollView>
    );
  };

  return (
    <AdminListShell
      title="Payroll"
      subtitle={data ? `${formatIndianNumber(data.days)} days · ${formatINR(data.totalDue)} to pay` : 'Technician pay'}
      backFallback={adminRoutes.team}
    >
      {body()}
      {period ? (
        <>
          <RecordPayoutSheet
            visible={payFor !== null}
            technician={payFor ? { id: payFor.technicianId, name: payFor.name } : null}
            due={payFor?.due ?? 0}
            period={period}
            onClose={() => setPayFor(null)}
            onSaved={async () => {
              setTab('payouts');
              await afterChange();
            }}
          />
          <PayAdjustmentSheet
            visible={adjustFor !== null}
            technician={adjustFor ? { id: adjustFor.technicianId, name: adjustFor.name } : null}
            period={period}
            onClose={() => setAdjustFor(null)}
            onSaved={async () => {
              setTab('adjustments');
              await afterChange();
            }}
          />
        </>
      ) : null}
    </AdminListShell>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
      {sub ? <Text style={styles.heroStatSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  content: { gap: 12 },
  deskContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  controls: { gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  stepBtnOff: { backgroundColor: ui.surfaceMuted },
  stepLabel: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: ui.text, minWidth: 128, textAlign: 'center' },
  reset: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  summaryShell: { borderRadius: premium.radiusCard, marginBottom: 4, ...ui.shadowFloat },
  summary: { borderRadius: premium.radiusCard, padding: 18, paddingTop: 18, overflow: 'hidden' },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  period: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.white },
  total: { marginTop: 8, fontFamily: fonts.displayExtra, fontSize: 28, color: colors.white, letterSpacing: -0.5 },
  sub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  heroStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroStatLabel: { fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' },
  heroStatValue: { marginTop: 2, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
  heroStatSub: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  card: { borderRadius: premium.radiusCard },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  meta: { marginTop: 3, fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  earnCol: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, maxWidth: 160 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  detail: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, paddingTop: 12, gap: 10 },
  deskLedgerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stripCell: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
  },
  stripCellStrong: { backgroundColor: colors.mint },
  stripLabel: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: ui.textTertiary },
  stripValue: { marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text },
  stripValueStrong: { color: colors.forest },
  stripSub: { marginTop: 1, fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { minWidth: 150 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.hairline,
  },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  notCounted: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.amberInk, marginTop: 3 },
  money: { alignItems: 'flex-end' },
  moneyMain: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.forest },
  moneyNegative: { color: colors.error },
  moneySub: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary },
  deleteBtn: { padding: 6, borderRadius: 8 },
  empty: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textTertiary, paddingVertical: 12 },
  profileLink: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 4 },
  profileText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  footnote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textTertiary, marginTop: spacing.xs },
});
