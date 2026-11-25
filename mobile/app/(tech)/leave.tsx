import { ArrowRight, CalendarDays } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { formatDayKey } from '@/components/kit/format';
import { TECH_TAB_BAR_PAD, TechScreen, TechScreenScroll } from '@/components/kit/TechScreenKit';
import { TechChoiceChip } from '@/components/tech/TechChoiceChip';
import { TechConfirmSheet } from '@/components/tech/TechConfirmSheet';
import { TechDateRangeSheet } from '@/components/tech/TechDateRangeSheet';
import { addDaysKey, daysInclusive } from '@/components/tech/TechMonthGrid';
import { TechLeaveSkeleton } from '@/components/tech/TechSkeletons';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { fillCopy } from '@/constants/customerUiCopy';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { haptic, stagger } from '@/lib/motion';
import { techGoBack, techRoutes } from '@/lib/routes';
import { activeLeaveTypes, leaveTypeLabel } from '@/lib/settingsLabels';
import { useTechLeave } from '@/lib/techData';
import { dayCount, leaveStatusLabel, techErrorText } from '@/lib/techLabels';
import { appToast } from '@/lib/toast';
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

/** How far ahead leave can be requested. */
const MAX_DAYS_AHEAD = 180;

const STATUS_TONE: Record<LeaveStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

function rangeLabel(from: string, to: string): string {
  return from === to ? formatDayKey(from) : `${formatDayKey(from)} – ${formatDayKey(to)}`;
}

export default function TechLeaveScreen() {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const leaveTypes = useMemo(() => activeLeaveTypes(settings), [settings]);
  const leave = useTechLeave();
  const today = localDateKey();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [type, setType] = useState<LeaveType>('casual');
  const [reason, setReason] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Keep the picked type valid when admin turns leave types on or off.
  useEffect(() => {
    if (leaveTypes.length && !leaveTypes.some((t) => t.key === type)) setType(leaveTypes[0].key as LeaveType);
  }, [leaveTypes, type]);

  function pickRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    setDateError(null);
  }

  async function submit() {
    if (saving) return;
    if (to < from) {
      haptic('warning');
      setDateError(copy.techLeaveEndBeforeStart);
      return;
    }
    setSaving(true);
    try {
      await api.post(
        '/leave',
        { from, to, ...(leaveTypes.length ? { type } : {}), reason: reason.trim() || undefined },
        { skipErrorToast: true },
      );
      haptic('success');
      appToast.success(copy.techLeaveRequestedToast);
      setReason('');
      await leave.reload(true);
    } catch (err) {
      haptic('error');
      appToast.error(copy.techLeaveRequestError, techErrorText(copy, err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelId || cancelling) return;
    setCancelling(true);
    try {
      await api.post(`/leave/${cancelId}/cancel`, undefined, { skipErrorToast: true });
      haptic('success');
      appToast.success(copy.techLeaveCancelledToast);
      await leave.reload(true);
    } catch (err) {
      haptic('error');
      appToast.error(copy.techLeaveCancelError, techErrorText(copy, err));
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  }

  const header = (
    <CustomerPageHeader
      variant="premium"
      title={copy.techLeaveTitle}
      subtitle={copy.techLeaveSubtitle}
      showBack
      onBack={() => techGoBack(techRoutes.home)}
    />
  );

  const sheets = (
    <>
      <TechDateRangeSheet
        visible={pickerOpen}
        from={from}
        to={to}
        minDate={today}
        maxDate={addDaysKey(today, MAX_DAYS_AHEAD)}
        onClose={() => setPickerOpen(false)}
        onApply={(f, t) => {
          pickRange(f, t);
          setPickerOpen(false);
        }}
      />
      <TechConfirmSheet
        visible={cancelId !== null}
        title={copy.techLeaveCancelTitle}
        message={copy.techLeaveCancelText}
        confirmLabel={copy.techLeaveCancelAction}
        cancelLabel={copy.techLeaveKeep}
        destructive
        loading={cancelling}
        onConfirm={() => void confirmCancel()}
        onClose={() => setCancelId(null)}
      />
    </>
  );

  if (leave.loading) {
    return (
      <TechScreen header={header}>
        <TechLeaveSkeleton />
      </TechScreen>
    );
  }

  if (!leave.data) {
    return (
      <TechScreen header={header}>
        <ListEmptyRetry
          title={copy.techLeaveLoadError}
          message={leave.error ?? undefined}
          retryLabel={copy.techRetry}
          onRetry={() => void leave.refresh()}
        />
      </TechScreen>
    );
  }

  const leaves = leave.data;
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const listHint = leaves.length
    ? [
        fillCopy(copy.techLeaveListCount, { total: leaves.length }),
        pendingCount ? fillCopy(copy.techLeaveListPending, { count: pendingCount }) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const presets = [
    { key: 'today', label: copy.techLeaveToday, from: today, to: today },
    { key: 'tomorrow', label: copy.techLeaveTomorrow, from: addDaysKey(today, 1), to: addDaysKey(today, 1) },
    { key: '3d', label: dayCount(copy, 3), from: today, to: addDaysKey(today, 2) },
    { key: 'week', label: copy.techLeaveWeek, from: today, to: addDaysKey(today, 6) },
  ];

  return (
    <TechScreen header={header}>
      <TechScreenScroll
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={leave.refreshing} onRefresh={() => void leave.refresh()} tintColor={ui.brand} />}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{copy.techLeaveFormTitle}</Text>
            <Text style={styles.cardHint}>{copy.techLeaveFormHint}</Text>

            <View style={styles.labelRow}>
              <Text style={styles.label}>{copy.techLeaveWhen}</Text>
              <View style={styles.daysPill}>
                <Text style={styles.daysText}>{dayCount(copy, daysInclusive(from, to))}</Text>
              </View>
            </View>
            <PressableScale
              onPress={() => setPickerOpen(true)}
              haptic="tap"
              style={[styles.range, dateError && styles.rangeError]}
              accessibilityRole="button"
              accessibilityLabel={fillCopy(copy.techLeaveDatesA11y, { from: formatDayKey(from), to: formatDayKey(to) })}
            >
              <View style={styles.rangeCell}>
                <Text style={styles.rangeLabel}>{copy.techLeaveFrom}</Text>
                <Text style={styles.rangeValue}>{formatDayKey(from)}</Text>
              </View>
              <ArrowRight size={16} color={ui.textTertiary} strokeWidth={2.2} />
              <View style={styles.rangeCell}>
                <Text style={styles.rangeLabel}>{copy.techLeaveTo}</Text>
                <Text style={styles.rangeValue}>{formatDayKey(to)}</Text>
              </View>
              <View style={styles.rangeIcon}>
                <CalendarDays size={18} color={ui.brand} strokeWidth={2.2} />
              </View>
            </PressableScale>
            {dateError ? <Text style={styles.error}>{dateError}</Text> : null}
            <View style={styles.chips}>
              {presets.map((p) => (
                <TechChoiceChip
                  key={p.key}
                  label={p.label}
                  selected={from === p.from && to === p.to}
                  onPress={() => pickRange(p.from, p.to)}
                />
              ))}
            </View>

            {leaveTypes.length ? (
              <>
                <Text style={[styles.label, styles.labelSpaced]}>{copy.techLeaveType}</Text>
                <View style={styles.chips}>
                  {leaveTypes.map((t) => (
                    <TechChoiceChip
                      key={t.key}
                      label={t.label}
                      selected={type === t.key}
                      onPress={() => setType(t.key as LeaveType)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Input
              label={copy.techLeaveReason}
              value={reason}
              onChangeText={setReason}
              placeholder={copy.techLeaveReasonPlaceholder}
              multiline
              maxLength={500}
              containerStyle={styles.reason}
            />
            <Button title={copy.techLeaveSubmit} onPress={() => void submit()} loading={saving} />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <View style={styles.listHead}>
            <Text style={styles.listTitle} accessibilityRole="header">
              {copy.techLeaveListTitle}
            </Text>
            {listHint ? <Text style={styles.listHint}>{listHint}</Text> : null}
          </View>
        </FadeSlideIn>

        {leaves.length === 0 ? (
          <FadeSlideIn delay={stagger(2)} slideFrom={14}>
            <View style={[styles.card, styles.empty]}>
              <Text style={styles.emptyTitle}>{copy.techLeaveEmptyTitle}</Text>
              <Text style={styles.emptyText}>{copy.techLeaveEmptyText}</Text>
            </View>
          </FadeSlideIn>
        ) : (
          leaves.map((l, i) => (
            <FadeSlideIn key={l.id} delay={stagger(i + 2)} slideFrom={12} disabled={i > 6}>
              <LeaveRow leave={l} onCancel={() => setCancelId(l.id)} />
            </FadeSlideIn>
          ))
        )}
      </TechScreenScroll>
      {sheets}
    </TechScreen>
  );
}

function LeaveRow({ leave, onCancel }: { leave: LeaveRequest; onCancel: () => void }) {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const details = [leaveTypeLabel(leave.type, settings), dayCount(copy, daysInclusive(leave.from, leave.to)), leave.reason]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={[styles.card, styles.row]}>
      <View style={styles.rowMain}>
        <View style={styles.rowIcon}>
          <CalendarDays size={18} color={ui.brand} strokeWidth={2.1} />
        </View>
        <View style={styles.flex}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {rangeLabel(leave.from, leave.to)}
            </Text>
            <StatusBadge label={leaveStatusLabel(copy, leave.status)} tone={STATUS_TONE[leave.status] ?? 'neutral'} />
          </View>
          <Text style={styles.rowSub}>{details}</Text>
          {leave.adminNote ? (
            <Text style={styles.adminNote}>{fillCopy(copy.techLeaveAdminNote, { note: leave.adminNote })}</Text>
          ) : null}
        </View>
      </View>
      {leave.status === 'pending' ? (
        <Button title={copy.techLeaveCancelAction} variant="dangerOutline" size="md" onPress={onCancel} style={styles.rowCancel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: TECH_TAB_BAR_PAD + spacing.lg },
  flex: { flex: 1, minWidth: 0 },
  card: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  cardTitle: { fontFamily: fonts.displayExtra, fontSize: 18, letterSpacing: -0.35, color: ui.text },
  cardHint: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: ui.textSecondary },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  labelSpaced: { marginTop: spacing.md },
  daysPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: ui.brandSoft },
  daysText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  range: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.control,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ui.surfaceMuted,
  },
  rangeError: { borderColor: colors.error, backgroundColor: colors.errorBg },
  rangeCell: { flex: 1 },
  rangeLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textTertiary },
  rangeValue: { marginTop: 2, fontFamily: fonts.displayExtra, fontSize: 17, letterSpacing: -0.2, color: ui.text },
  rangeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { marginTop: 6, fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.error },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  reason: { marginTop: spacing.md },
  listHead: { marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: 2 },
  listTitle: { fontFamily: fonts.displayExtra, fontSize: 17, letterSpacing: -0.35, color: ui.text },
  listHint: { marginTop: 3, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text, textAlign: 'center' },
  emptyText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary, textAlign: 'center' },
  row: { marginBottom: spacing.sm, padding: 14 },
  rowMain: { flexDirection: 'row', gap: 12 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  rowSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  adminNote: { marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.brand },
  rowCancel: { marginTop: 12 },
});
