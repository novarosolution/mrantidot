import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
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
import { formatINR, formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminEntrance, AdminListShell, AdminSectionTitle, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { formatDayKey, initials, plural } from '@/components/kit/format';
import { GlassPanel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWebWideContent, useWideWebLayout } from '@/lib/webAdmin';
import type { PayrollJob, PayrollPage, PayrollTechRow } from '@/types/adminLists';

type Mode = 'month' | 'range';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

function JobRow({ job }: { job: PayrollJob }) {
  return (
    <Pressable
      onPress={() => appPush(adminRoutes.booking(job.bookingId))}
      style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${job.ref}, ${job.serviceName}, ${formatINR(job.earning)}. Open booking`}
    >
      <View style={styles.flex}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.serviceName}
          {job.option ? ` · ${job.option}` : ''}
        </Text>
        <Text style={styles.jobMeta} numberOfLines={1}>
          {formatDayKey(job.date)} · {job.ref} · {job.customerName}
        </Text>
      </View>
      <View style={styles.jobMoney}>
        <Text style={styles.jobEarn}>{formatINR(job.earning)}</Text>
        <Text style={styles.jobValue}>of {formatINR(job.jobValue)}</Text>
      </View>
    </Pressable>
  );
}

export default function AdminPayrollScreen() {
  const wide = useWideWebLayout();
  useWebWideContent(wide);
  const today = istTodayKey();
  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [rangeValue, setRangeValue] = useState<DateRangeValue>({ preset: 'lastMonth' });
  const [data, setData] = useState<PayrollPage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { loading, error, refreshing, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const range = mode === 'range' ? resolveDateRange(rangeValue) : null;
  const params = useMemo(
    () => (range ? { from: range.from, to: range.to, includeJobs: 1 } : { month, includeJobs: 1 }),
    [range?.from, range?.to, month],
  );

  const load = useCallback(async () => {
    const res = await api.get<PayrollPage>('/admin/payroll', { ...screenLoadConfig, params, skipCache: true });
    setData(res.data);
    setSelected((cur) =>
      cur && res.data.technicians.some((t) => t.technicianId === cur)
        ? cur
        : (res.data.technicians.find((t) => t.jobsCompleted > 0)?.technicianId ?? null),
    );
  }, [params]);

  useEffect(() => {
    void reload(load, 'Could not load payroll');
  }, [load, reload]);

  useStaleFocusRefresh(() => refresh(load), 15_000);

  const rows = data?.technicians ?? [];
  const selectedRow = rows.find((r) => r.technicianId === selected) ?? null;
  const periodLabel = data ? formatRangeSummary({ from: data.from, to: data.to }) : '';

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
      ]);
      summaryRows.push(['TOTAL', '', '', data.totalJobs, data.totalJobValue, data.totalEarnings]);
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
      const content = csvSections([
        {
          title: `Mr Antidot payroll · ${formatRangeLabel({ from: data.from, to: data.to })} (completed jobs by visit date)`,
          headers: ['Technician', 'Phone', 'Pay rule', 'Jobs', 'Job value (INR)', 'Take-home (INR)'],
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
      ]);
      const suffix = mode === 'month' ? data.month : `${data.from}_to_${data.to}`;
      const result = await shareCsv(`mrantidot-payroll-${suffix}.csv`, content, 'Payroll CSV');
      haptic('success');
      if (result === 'downloaded') Toast.show({ type: 'success', text1: 'Payroll CSV downloaded' });
    } catch {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Could not export payroll' });
    } finally {
      setExporting(false);
    }
  }, [data, exporting, mode]);

  const techColumns = useMemo<AdminTableColumn<PayrollTechRow>[]>(
    () => [
      {
        key: 'name',
        title: 'Technician',
        flex: 1.4,
        minWidth: 180,
        render: (r) => (
          <TableTwoLine
            title={r.name}
            sub={[r.phone, r.disabled ? 'Disabled' : r.available ? '' : 'Off duty'].filter(Boolean).join(' · ')}
          />
        ),
      },
      { key: 'rule', title: 'Pay rule', flex: 1, minWidth: 140, render: (r) => <TableText muted>{r.paySummary}</TableText> },
      { key: 'jobs', title: 'Jobs', width: 80, align: 'right', render: (r) => <TableText strong>{r.jobsCompleted}</TableText> },
      { key: 'value', title: 'Job value', width: 120, align: 'right', render: (r) => <TableText>{formatINR(r.jobValue)}</TableText> },
      {
        key: 'earn',
        title: 'Take-home',
        width: 128,
        align: 'right',
        render: (r) => (
          <TableText strong color={r.technicianId === selected ? colors.forest : undefined}>
            {formatINR(r.earnings)}
          </TableText>
        ),
      },
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
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={18} color={ui.text} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.stepLabel}>{monthTitle(month)}</Text>
          <Pressable
            onPress={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={month >= today.slice(0, 7)}
            style={({ pressed }) => [styles.stepBtn, month >= today.slice(0, 7) && styles.stepBtnOff, pressed && styles.pressed]}
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
            style={({ pressed }) => [styles.exportBtn, (pressed || exporting) && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Export payroll as CSV"
          >
            <Download size={15} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.exportText}>{exporting ? 'Preparing…' : 'Export CSV'}</Text>
          </Pressable>
        </View>
        <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatINR(data.totalEarnings)}
        </Text>
        <Text style={styles.sub}>
          Take-home · {plural(data.totalJobs, 'completed job')} · job value {formatINR(data.totalJobValue)}
        </Text>
      </LinearGradient>
    </View>
  ) : null;

  const body = () => {
    if (loading && !data) return <AdminListSkeleton variant="payroll" rows={4} />;
    if (error && !data) return <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />;
    if (!data) return null;

    if (wide) {
      return (
        <ScrollView contentContainerStyle={styles.deskContent}>
          {periodControls}
          {summary}
          <AdminSectionTitle title="Technicians" hint="Select a technician to see their jobs" flush />
          <AdminDataTable
            columns={techColumns}
            rows={rows}
            keyExtractor={(r) => r.technicianId}
            onRowPress={(r) => setSelected(r.technicianId)}
            rowLabel={(r) => `${r.name}, ${formatINR(r.earnings)}. Show jobs`}
            loading={loading}
            emptyTitle="No technicians yet"
            emptyMessage="Earnings show here once technicians complete jobs."
          />
          {selectedRow ? (
            <>
              <AdminSectionTitle
                title={`Jobs · ${selectedRow.name}`}
                hint={`${plural(selectedRow.jobsCompleted, 'completed job')} · ${formatINR(selectedRow.earnings)} take-home`}
                actionLabel="Profile"
                onAction={() => appPush(adminRoutes.technician(selectedRow.technicianId))}
                flush
              />
              <AdminDataTable
                columns={jobColumns}
                rows={selectedRow.jobs ?? []}
                keyExtractor={(j) => j.bookingId}
                onRowPress={(j) => appPush(adminRoutes.booking(j.bookingId))}
                rowLabel={(j) => `${j.ref}, ${j.serviceName}. Open booking`}
                emptyTitle="No completed jobs"
                emptyMessage="Nothing completed in this period."
              />
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
          const open = expanded(r.technicianId);
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
                  accessibilityLabel={`${r.name}, ${formatINR(r.earnings)}. ${open ? 'Hide' : 'Show'} jobs`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(r.name)}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {plural(r.jobsCompleted, 'job')} · {r.paySummary}
                      {r.disabled ? ' · Disabled' : r.available ? '' : ' · Off duty'}
                    </Text>
                  </View>
                  <View style={styles.earnCol}>
                    <Text style={styles.earn} numberOfLines={1}>
                      {formatINR(r.earnings)}
                    </Text>
                    {open ? (
                      <ChevronUp size={16} color={ui.textTertiary} strokeWidth={2.4} />
                    ) : (
                      <ChevronDown size={16} color={ui.textTertiary} strokeWidth={2.4} />
                    )}
                  </View>
                </Pressable>
                {open ? (
                  <View style={styles.jobs}>
                    {(r.jobs ?? []).length === 0 ? (
                      <Text style={styles.noJobs}>No completed jobs in this period.</Text>
                    ) : (
                      (r.jobs ?? []).map((j) => <JobRow key={j.bookingId} job={j} />)
                    )}
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
          Completed jobs counted by visit date. Take-home is locked when a job completes; older jobs use the current pay rule.
        </Text>
      </ScrollView>
    );
  };

  function expanded(id: string) {
    return selected === id;
  }

  return (
    <AdminListShell
      title="Payroll"
      subtitle={data ? `${formatIndianNumber(data.days)} days · technician earnings` : 'Technician earnings'}
      backFallback={adminRoutes.team}
    >
      {body()}
    </AdminListShell>
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
  earnCol: { alignItems: 'flex-end', gap: 2 },
  earn: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.forest },
  jobs: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, paddingTop: 4 },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.hairline,
  },
  jobTitle: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  jobMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  jobMoney: { alignItems: 'flex-end' },
  jobEarn: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.forest },
  jobValue: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary },
  noJobs: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textTertiary, paddingVertical: 12 },
  profileLink: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 4 },
  profileText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  footnote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textTertiary, marginTop: spacing.xs },
});
