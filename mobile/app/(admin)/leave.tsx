import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow, FilterSummary } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import {
  DateRangePicker,
  FILTER_RANGE_PRESETS,
  formatRangeLabel,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField } from '@/components/kit/AdminPageKit';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { formatDayKey } from '@/components/kit/format';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { colors, fonts, premium, spacing, typeScale, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { leaveTypeLabel } from '@/lib/settingsLabels';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AdminLeavePage, AdminLeaveRow, LeaveStatusFilter } from '@/types/adminLists';

const FILTERS: { key: LeaveStatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Not approved',
  cancelled: 'Cancelled by technician',
};

const NOTE_MAX = 500;

function leaveDates(l: AdminLeaveRow): string {
  const range = formatRangeLabel({ from: l.from, to: l.to });
  return `${range} · ${l.days} ${l.days === 1 ? 'day' : 'days'}`;
}

function decidedLine(l: AdminLeaveRow): string | null {
  if (l.status !== 'approved' && l.status !== 'rejected') return null;
  const who = l.decidedByName ? ` by ${l.decidedByName}` : '';
  const when = l.decidedAt ? ` on ${formatDayKey(l.decidedAt.slice(0, 10))}` : '';
  return `${l.status === 'approved' ? 'Approved' : 'Not approved'}${who}${when}`;
}

export default function AdminLeaveScreen() {
  const settings = useBusinessSettings();
  const [status, setStatus] = useState<LeaveStatusFilter>('pending');
  const [type, setType] = useState<string>('');
  const [dateValue, setDateValue] = useState<DateRangeValue>({ preset: 'all' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [typeOpen, setTypeOpen] = useState(false);
  const [decision, setDecision] = useState<{ leave: AdminLeaveRow; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const range = resolveDateRange(dateValue);
  const query = useMemo(
    () => ({
      status,
      type: type || undefined,
      from: range?.from,
      to: range?.to,
      q: debouncedSearch.trim() || undefined,
      sort: 'created',
      order: status === 'pending' ? 'asc' : 'desc',
    }),
    [status, type, range?.from, range?.to, debouncedSearch],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number) => {
      const { data } = await api.get<AdminLeavePage>('/leave', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
      });
      return { items: data.leaves, meta: data, extra: data.counts };
    },
    [query],
  );

  const list = useAdminPagedList<AdminLeaveRow, AdminLeavePage['counts']>({
    fetchPage,
    deps: [query],
    keyOf: (l) => l.id,
    errorMessage: 'Could not load leave requests',
  });

  useStaleFocusRefresh(() => list.refresh(), 15_000);
  const counts = list.extra;

  const openDecision = useCallback((leave: AdminLeaveRow, action: 'approve' | 'reject') => {
    haptic('tap');
    setNote('');
    setDecision({ leave, action });
  }, []);

  const submitDecision = useCallback(async () => {
    if (!decision || busy) return;
    setBusy(true);
    try {
      const trimmed = note.trim();
      await api.post(`/leave/${decision.leave.id}/${decision.action}`, trimmed ? { adminNote: trimmed } : {});
      haptic('success');
      Toast.show({
        type: 'success',
        text1: decision.action === 'approve' ? 'Leave approved' : 'Leave not approved',
        text2: 'The technician has been notified.',
      });
      setDecision(null);
      await list.refresh();
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update leave') });
    } finally {
      setBusy(false);
    }
  }, [decision, busy, note, list]);

  const typeOptions: ActionSheetOption[] = [
    { key: 'any', label: 'Any type', onPress: () => setType('') },
    ...settings.lists.leaveTypes.map((t) => ({
      key: t.key,
      label: t.label,
      subtitle: t.active ? undefined : 'Switched off for new requests',
      onPress: () => setType(t.key),
    })),
  ];

  const clearAll = useCallback(() => {
    setType('');
    setDateValue({ preset: 'all' });
    setSearch('');
  }, []);

  const summaryParts = [
    type ? leaveTypeLabel(type, settings) : '',
    range ? `Overlapping ${formatRangeLabel(range)}` : '',
    debouncedSearch.trim() ? `“${debouncedSearch.trim()}”` : '',
  ].filter(Boolean);

  const decisionButtons = (l: AdminLeaveRow, compact: boolean) =>
    l.status === 'pending' ? (
      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <Button
          title="Approve"
          variant="premium"
          size={compact ? 'sm' : 'md'}
          fullWidth={false}
          style={compact ? undefined : styles.actionBtn}
          onPress={() => openDecision(l, 'approve')}
        />
        <Button
          title="Reject"
          variant="dangerOutline"
          size={compact ? 'sm' : 'md'}
          fullWidth={false}
          style={compact ? undefined : styles.actionBtn}
          onPress={() => openDecision(l, 'reject')}
        />
      </View>
    ) : null;

  const columns = useMemo<AdminTableColumn<AdminLeaveRow>[]>(
    () => [
      {
        key: 'tech',
        title: 'Technician',
        flex: 1.2,
        minWidth: 160,
        render: (l) => <TableTwoLine title={l.technicianName || 'Technician'} sub={l.technicianPhone} />,
      },
      {
        key: 'from',
        title: 'Dates',
        width: 188,
        render: (l) => <TableText>{leaveDates(l)}</TableText>,
      },
      { key: 'type', title: 'Type', width: 112, render: (l) => <TableText>{leaveTypeLabel(l.type, settings)}</TableText> },
      {
        key: 'reason',
        title: 'Reason & note',
        flex: 1.8,
        minWidth: 200,
        render: (l) => (
          <View style={styles.reasonCell}>
            <TableText lines={2} muted={!l.reason}>
              {l.reason || 'No reason given'}
            </TableText>
            {l.adminNote ? <TableText muted lines={2}>{`Note: ${l.adminNote}`}</TableText> : null}
          </View>
        ),
      },
      {
        key: 'created',
        title: 'Requested',
        width: 104,
        render: (l) => <TableText muted>{l.createdAt ? formatDayKey(l.createdAt.slice(0, 10)) : '—'}</TableText>,
      },
      {
        key: 'status',
        title: 'Status',
        width: 210,
        align: 'right',
        render: (l) =>
          l.status === 'pending' ? (
            decisionButtons(l, true)
          ) : (
            <View style={styles.statusCell}>
              <StatusBadge label={STATUS_LABEL[l.status] ?? l.status} tone={STATUS_TONE[l.status] ?? 'neutral'} />
              {decidedLine(l) ? <TableText muted>{decidedLine(l)}</TableText> : null}
            </View>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, openDecision],
  );

  const header = (
    <View style={styles.header}>
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search technician name or phone" />
      <AdminFilterChips
        chips={FILTERS.map((f) => ({ key: f.key, label: counts ? `${f.label} ${counts[f.key] ?? 0}` : f.label }))}
        selected={status}
        onSelect={(key) => setStatus(key as LeaveStatusFilter)}
      />
      <DateRangePicker value={dateValue} onChange={(v) => setDateValue(v)} presets={FILTER_RANGE_PRESETS} allowFuture caption={false} />
      <FilterRow>
        <FilterButton
          label="Type"
          value={type ? leaveTypeLabel(type, settings) : null}
          onPress={() => setTypeOpen(true)}
          onClear={() => setType('')}
        />
      </FilterRow>
      <FilterSummary parts={summaryParts} onClear={clearAll} />
    </View>
  );

  const d = decision?.leave;
  return (
    <AdminListShell
      title="Leave requests"
      subtitle={counts ? `${counts.pending} waiting · approve technician time off` : 'Approve technician time off'}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(l) => l.id}
        header={header}
        noun="requests"
        emptyTitle={status === 'all' ? 'No leave requests' : `No ${status} requests`}
        emptyMessage={status === 'pending' ? 'New time-off requests from technicians show up here.' : undefined}
        skeletonVariant="leave"
        renderCard={(l) => (
          <GlassPanel goldEdge tone="light" style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.name} numberOfLines={1}>
                {l.technicianName || 'Technician'}
              </Text>
              <StatusBadge label={STATUS_LABEL[l.status] ?? l.status} tone={STATUS_TONE[l.status] ?? 'neutral'} />
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {leaveDates(l)} · {leaveTypeLabel(l.type, settings)}
            </Text>
            {l.reason ? <Text style={styles.reason}>{l.reason}</Text> : null}
            {l.adminNote ? <Text style={styles.note}>Note: {l.adminNote}</Text> : null}
            {decidedLine(l) ? <Text style={styles.decided}>{decidedLine(l)}</Text> : null}
            {decisionButtons(l, false)}
          </GlassPanel>
        )}
      />

      <AdminActionSheet visible={typeOpen} title="Leave type" options={typeOptions} onClose={() => setTypeOpen(false)} />

      <SheetModal
        visible={decision !== null}
        onClose={() => (busy ? undefined : setDecision(null))}
        dialogWidth={480}
        keyboardAvoiding
        header={
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{decision?.action === 'approve' ? 'Approve leave?' : 'Reject leave?'}</Text>
            {d ? (
              <Text style={styles.sheetSub}>
                {d.technicianName || 'Technician'} · {leaveDates(d)} · {leaveTypeLabel(d.type, settings)}
              </Text>
            ) : null}
          </View>
        }
      >
        <View style={styles.sheetBody}>
          {d?.reason ? <Text style={styles.sheetReason}>“{d.reason}”</Text> : null}
          <Text style={styles.label}>Note to the technician (optional)</Text>
          <TextInput
            value={note}
            onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
            placeholder={decision?.action === 'approve' ? 'e.g. Enjoy your time off' : 'e.g. We are short-staffed that week'}
            placeholderTextColor={ui.textTertiary}
            style={styles.noteInput}
            multiline
            maxLength={NOTE_MAX}
            accessibilityLabel="Note to the technician"
          />
          <Text style={styles.helper}>
            {decision?.action === 'approve'
              ? 'Attendance is marked as leave for these dates. The technician gets a notification.'
              : 'The technician gets a notification with your note.'}
          </Text>
          <View style={styles.sheetActions}>
            <Button title="Cancel" variant="outline" size="md" fullWidth={false} style={styles.sheetBtn} disabled={busy} onPress={() => setDecision(null)} />
            <Button
              title={decision?.action === 'approve' ? 'Approve' : 'Reject'}
              variant={decision?.action === 'approve' ? 'premium' : 'danger'}
              size="md"
              fullWidth={false}
              style={styles.sheetBtn}
              loading={busy}
              onPress={() => void submitDecision()}
            />
          </View>
        </View>
      </SheetModal>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  card: { borderRadius: premium.radiusCard, marginBottom: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
  reason: { marginTop: 8, fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 18 },
  note: { marginTop: 8, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.forest, lineHeight: 17 },
  decided: { marginTop: 6, fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionsCompact: { marginTop: 0, gap: 8, justifyContent: 'flex-end' },
  actionBtn: { flex: 1 },
  reasonCell: { gap: 2, maxWidth: '100%' },
  statusCell: { alignItems: 'flex-end', gap: 4 },
  sheetHead: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  sheetTitle: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sheetSub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  sheetReason: { ...typeScale.body, color: ui.text, marginBottom: spacing.md, fontStyle: 'italic' },
  label: { ...typeScale.captionStrong, color: ui.text, marginBottom: 6 },
  noteInput: {
    minHeight: 92,
    maxHeight: 180,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: ui.text,
    textAlignVertical: 'top',
  },
  helper: { ...typeScale.caption, color: ui.textSecondary, marginTop: 8 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  sheetBtn: { minWidth: 120 },
});
