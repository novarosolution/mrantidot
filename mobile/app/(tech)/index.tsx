import { CheckCircle2, ChevronRight, Play } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { TechPriorityBanner } from '@/components/kit/TechPriorityBanner';
import { TechScreen, TechScreenGutter, TechScreenList, techScreenStyles } from '@/components/kit/TechScreenKit';
import { TechConfirmSheet } from '@/components/tech/TechConfirmSheet';
import { TechDutyCard, type DutyAction } from '@/components/tech/TechDutyCard';
import { TechBellButton } from '@/components/tech/TechBellButton';
import { TechDutyPill } from '@/components/tech/TechDutyPill';
import { TechEarningsCard } from '@/components/tech/TechEarningsCard';
import { TechInlineNotice } from '@/components/tech/TechInlineNotice';
import { TechDutySkeleton, TechEarningsSkeleton, TechJobsSkeleton } from '@/components/tech/TechSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { bookingVisitDate, isTerminalBookingStatus } from '@/lib/booking-helpers';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { haptic, stagger } from '@/lib/motion';
import { appPush, techRoutes } from '@/lib/routes';
import { useTechCopy } from '@/lib/tech-copy';
import { techCurrentMonth, useTechAttendance, useTechJobs, useTechStats } from '@/lib/techData';
import { dutyState, techErrorText } from '@/lib/techLabels';
import { appToast } from '@/lib/toast';
import type { Booking, CustomerUiCopy } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

type SectionKey = 'overdue' | 'today' | 'upcoming' | 'assigned' | 'past';

type Row =
  | { type: 'header'; key: SectionKey; count: number }
  | { type: 'job'; booking: Booking; section: SectionKey; index: number };

const DUTY_PATH: Record<DutyAction, string> = {
  checkIn: '/attendance/check-in',
  checkOut: '/attendance/check-out',
  absent: '/attendance/mark-absent',
};

function sectionTitle(copy: CustomerUiCopy, key: SectionKey): string {
  switch (key) {
    case 'overdue':
      return copy.techSectionOverdue;
    case 'today':
      return copy.techSectionToday;
    case 'upcoming':
      return copy.techSectionUpcoming;
    case 'assigned':
      return copy.techSectionAssigned;
    default:
      return copy.techSectionPast;
  }
}

/** Jobs grouped the way a technician works through them: overdue, today, upcoming, then past. */
function buildRows(bookings: Booking[], today: string): Row[] {
  const active = bookings.filter((b) => !isTerminalBookingStatus(b.status));
  const past = bookings.filter((b) => isTerminalBookingStatus(b.status));
  const overdue = active.filter((b) => {
    const d = bookingVisitDate(b);
    return Boolean(d) && d < today;
  });
  const todayJobs = active.filter((b) => bookingVisitDate(b) === today);
  const upcoming = active.filter((b) => bookingVisitDate(b) > today);
  const groups: [SectionKey, Booking[]][] = [
    ['overdue', overdue],
    ['today', todayJobs],
    ['upcoming', upcoming],
  ];
  // Jobs without a visit date yet still need a home.
  if (!overdue.length && !todayJobs.length && !upcoming.length && active.length) groups.push(['assigned', active]);
  groups.push(['past', past]);

  const rows: Row[] = [];
  let index = 0;
  for (const [key, list] of groups) {
    if (!list.length) continue;
    rows.push({ type: 'header', key, count: list.length });
    for (const booking of list) rows.push({ type: 'job', booking, section: key, index: index++ });
  }
  return rows;
}

export default function TechJobsScreen() {
  const booking = useTechCopy();
  const copy = useCustomerUiCopy();
  const { refreshMe, user } = useAuth();
  const month = techCurrentMonth();
  const jobs = useTechJobs();
  const attendance = useTechAttendance(month);
  const stats = useTechStats(month);
  const [pulling, setPulling] = useState(false);
  const [dutyBusy, setDutyBusy] = useState<DutyAction | null>(null);
  const [confirm, setConfirm] = useState<'checkOut' | 'absent' | null>(null);

  const today = localDateKey();
  const bookings = useMemo(() => jobs.data ?? [], [jobs.data]);
  const rows = useMemo(() => buildRows(bookings, today), [bookings, today]);
  const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');
  const overdueJobs = useMemo(
    () =>
      bookings.filter((b) => {
        if (isTerminalBookingStatus(b.status)) return false;
        const d = bookingVisitDate(b);
        return Boolean(d) && d < today;
      }),
    [bookings, today],
  );
  const activeCount = bookings.filter((b) => !isTerminalBookingStatus(b.status)).length;

  const att = attendance.data;
  const duty = att ? dutyState(att.todayStatus, att.onDuty) : null;

  async function runDuty(action: DutyAction) {
    if (dutyBusy) return;
    setDutyBusy(action);
    try {
      await api.post(DUTY_PATH[action], undefined, { skipErrorToast: true });
      haptic('success');
      appToast.success(
        action === 'checkIn' ? copy.techOnDutyTitle : action === 'checkOut' ? copy.techToastCheckedOut : copy.techToastAbsent,
      );
      await Promise.all([
        attendance.reload(true),
        stats.reload(true),
        refreshMe({ silent: true }).catch(() => undefined),
      ]);
    } catch (err) {
      haptic('error');
      appToast.error(
        action === 'checkIn'
          ? copy.techCheckInError
          : action === 'checkOut'
            ? copy.techCheckOutError
            : copy.techAttendanceUpdateError,
        techErrorText(copy, err),
      );
    } finally {
      setDutyBusy(null);
      setConfirm(null);
    }
  }

  async function onPull() {
    setPulling(true);
    try {
      await Promise.all([jobs.reload(true), attendance.reload(true), stats.reload(true)]);
    } finally {
      setPulling(false);
    }
  }

  const firstName = (user?.name?.trim() || copy.techNameFallback).split(/\s+/)[0];
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const hero = (
    <PremiumAppHeader
      eyebrow={copy.techJobsEyebrow}
      title={booking.techJobsTitle}
      subtitle={fillCopy(copy.techJobsGreeting, { name: firstName, date: dateLabel })}
      right={
        <View style={styles.headerRight}>
          {duty ? <TechDutyPill state={duty} /> : null}
          <TechBellButton />
        </View>
      }
    />
  );

  if (jobs.loading) {
    return (
      <TechScreen header={hero}>
        <TechJobsSkeleton />
      </TechScreen>
    );
  }

  if (!jobs.data) {
    return (
      <TechScreen header={hero}>
        <ListEmptyRetry
          title={copy.techJobsLoadError}
          message={jobs.error ?? undefined}
          retryLabel={copy.techRetry}
          onRetry={() => void jobs.refresh()}
        />
      </TechScreen>
    );
  }

  let block = 0;
  const enter = () => stagger(block++);

  const header = (
    <View>
      {hero}
      <TechScreenGutter style={styles.headerGutter}>
        {jobs.error ? (
          <TechInlineNotice
            message={copy.techJobsRefreshError}
            actionLabel={copy.techRetry}
            onAction={() => void jobs.refresh()}
            busy={jobs.refreshing}
          />
        ) : null}

        <FadeSlideIn delay={enter()} slideFrom={14}>
          {stats.data ? (
            <TechEarningsCard stats={stats.data} activeCount={activeCount} onPress={() => appPush(techRoutes.profile)} />
          ) : stats.loading ? (
            <View style={styles.blockGap}>
              <TechEarningsSkeleton />
            </View>
          ) : (
            <TechInlineNotice
              message={copy.techStatsLoadError}
              actionLabel={copy.techRetry}
              onAction={() => void stats.refresh()}
              busy={stats.refreshing}
            />
          )}
        </FadeSlideIn>

        {verifyJob || overdueJobs.length ? (
          <FadeSlideIn delay={enter()} slideFrom={14}>
            <TechPriorityBanner overdueJobs={verifyJob ? [] : overdueJobs} verifyJob={verifyJob} flush />
          </FadeSlideIn>
        ) : null}

        {activeJob && duty !== 'pending' ? (
          <FadeSlideIn delay={enter()} slideFrom={14}>
            <PressableScale
              haptic="tap"
              onPress={() => appPush(techRoutes.job(activeJob.id))}
              containerStyle={styles.blockGap}
              style={styles.continue}
              accessibilityRole="button"
              accessibilityLabel={copy.techContinueActiveJob}
            >
              <View style={styles.continueIcon}>
                <Play size={16} color={colors.white} strokeWidth={2.6} fill={colors.white} />
              </View>
              <Text style={styles.continueText} numberOfLines={1}>
                {copy.techContinueActiveJob}
              </Text>
              <ChevronRight size={18} color={ui.brand} strokeWidth={2.4} />
            </PressableScale>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={enter()} slideFrom={14}>
          {att && duty ? (
            <TechDutyCard
              state={duty}
              checkedInAt={att.todayRecord?.checkedInAt}
              busy={dutyBusy}
              onCheckIn={() => void runDuty('checkIn')}
              onCheckOut={() => setConfirm('checkOut')}
              onMarkAbsent={() => setConfirm('absent')}
            />
          ) : attendance.loading ? (
            <TechDutySkeleton />
          ) : (
            <TechInlineNotice
              message={copy.techAttendanceLoadError}
              actionLabel={copy.techRetry}
              onAction={() => void attendance.refresh()}
              busy={attendance.refreshing}
            />
          )}
        </FadeSlideIn>

        {activeCount === 0 && bookings.length > 0 ? (
          <FadeSlideIn delay={enter()} slideFrom={14}>
            <View style={styles.idleCard}>
              <View style={styles.idleIcon}>
                <CheckCircle2 size={22} color={ui.brand} strokeWidth={2.2} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.idleTitle}>{copy.techAllCaughtUpTitle}</Text>
                <Text style={styles.idleSub}>{copy.techAllCaughtUpText}</Text>
              </View>
            </View>
          </FadeSlideIn>
        ) : null}
      </TechScreenGutter>
    </View>
  );

  const rowsBase = block;

  return (
    <TechScreen>
      <TechScreenList
        data={rows}
        {...CUSTOMER_LIST_PERF}
        empty={rows.length === 0}
        keyExtractor={(row) => (row.type === 'header' ? `h-${row.key}` : row.booking.id)}
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={() => void onPull()} tintColor={ui.brand} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <TechScreenGutter style={techScreenStyles.scrollEmpty}>
            <EmptyState title={booking.techEmptyJobsTitle} message={booking.techEmptyJobsMessage} />
          </TechScreenGutter>
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const overdue = row.key === 'overdue';
            return (
              <TechScreenGutter style={styles.sectionHeadWrap}>
                <View style={styles.sectionHead} accessible accessibilityRole="header">
                  <Text style={[styles.sectionTitle, overdue && styles.sectionTitleWarn]}>
                    {sectionTitle(copy, row.key)}
                  </Text>
                  <View style={[styles.countPill, overdue && styles.countPillWarn]}>
                    <Text style={[styles.countText, overdue && styles.countTextWarn]}>{row.count}</Text>
                  </View>
                </View>
              </TechScreenGutter>
            );
          }
          return (
            <TechScreenGutter>
              <FadeSlideIn delay={stagger(rowsBase + row.index)} slideFrom={12} disabled={row.index > 6}>
                <BookingListCard
                  booking={row.booking}
                  hideAmount
                  showCustomer
                  hint={row.section === 'overdue' && verifyJob ? copy.techOverdueHint : undefined}
                  hintTone="warning"
                  onPress={() => appPush(techRoutes.job(row.booking.id))}
                />
              </FadeSlideIn>
            </TechScreenGutter>
          );
        }}
      />

      <TechConfirmSheet
        visible={confirm !== null}
        title={confirm === 'checkOut' ? copy.techCheckOutConfirmTitle : copy.techAbsentConfirmTitle}
        message={confirm === 'checkOut' ? copy.techCheckOutConfirmText : copy.techAbsentConfirmText}
        confirmLabel={confirm === 'checkOut' ? copy.techCheckOutButton : copy.techMarkAbsentButton}
        cancelLabel={copy.techCancel}
        destructive={confirm === 'absent'}
        loading={dutyBusy !== null}
        onConfirm={() => {
          if (confirm) void runDuty(confirm);
        }}
        onClose={() => setConfirm(null)}
      />
    </TechScreen>
  );
}

const styles = StyleSheet.create({
  /** Duty pill + inbox bell, centred on each other. */
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerGutter: { marginTop: 10 },
  blockGap: { marginBottom: spacing.sm },
  flex: { flex: 1 },
  continue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  continueIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  idleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    marginTop: spacing.sm,
    ...ui.shadow,
  },
  idleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  idleSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  sectionHeadWrap: { paddingTop: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: -0.1, color: ui.text },
  sectionTitleWarn: { color: colors.error },
  countPill: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillWarn: { backgroundColor: colors.errorBg },
  countText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  countTextWarn: { color: colors.error },
});
