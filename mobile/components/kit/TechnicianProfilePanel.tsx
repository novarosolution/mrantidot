import { LogOut } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AnalyticsStatGrid, type AnalyticsStatItem } from '@/components/kit/AnalyticsStatGrid';
import { TechSectionTitle } from '@/components/kit/TechPageKit';
import { TechProfileHero } from '@/components/kit/TechProfileHero';
import { TECH_TAB_BAR_PAD, TechScreenScroll } from '@/components/kit/TechScreenKit';
import { TechAttendanceCalendar } from '@/components/tech/TechAttendanceCalendar';
import { TechAttendanceSummary } from '@/components/tech/TechAttendanceSummary';
import { TechQuickActions } from '@/components/tech/TechQuickActions';
import { TechBlockSkeleton } from '@/components/tech/TechSkeletons';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { stagger } from '@/lib/motion';
import { formatPhoneDisplay } from '@/lib/profile-display';
import { appPush, techRoutes } from '@/lib/routes';
import { useTechCopy } from '@/lib/tech-copy';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

/**
 * Technician profile body: identity + key stats, shortcuts, pay rule, performance, the month's
 * attendance and visits, the attendance calendar and sign out. Sections enter one after another.
 */
export function TechnicianProfilePanel({
  name,
  phone,
  city,
  stats,
  monthStats,
  monthStatsLoading,
  bookings,
  attendance,
  month,
  todayStatus,
  onDuty,
  notice,
  refreshing,
  onRefresh,
  onMonthChange,
  onLogout,
}: {
  name: string;
  phone?: string;
  city?: string;
  /** Current-month stats: hero, performance tiles, pay rule. */
  stats: TechnicianStats | null;
  /** Stats for the month shown in the calendar (attendance & visits). */
  monthStats: TechnicianStats | null;
  monthStatsLoading: boolean;
  bookings: Booking[];
  attendance: Record<string, DayAttendanceStatus>;
  month: string;
  todayStatus: DayAttendanceStatus;
  onDuty: boolean;
  /** Inline notice when jobs / attendance could not be refreshed. */
  notice?: ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  onMonthChange: (month: string) => void;
  onLogout: () => void;
}) {
  const booking = useTechCopy();
  const copy = useCustomerUiCopy();
  const verifyJobs = bookings.filter((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');
  const openCount = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length;

  const statItems: AnalyticsStatItem[] = stats
    ? [
        {
          key: 'assigned',
          label: copy.techStatAssigned,
          value: String(stats.assigned),
          icon: AppIcons.techStats.assigned,
          iconBg: ui.brandSoft,
          iconColor: ui.brand,
          onPress: () => appPush(techRoutes.home),
        },
        {
          key: 'active',
          label: copy.techStatActive,
          value: String(stats.inProgress),
          icon: AppIcons.techStats.active,
          iconBg: colors.mint,
          iconColor: colors.green,
          onPress: activeJob ? () => appPush(techRoutes.job(activeJob.id)) : undefined,
        },
        {
          key: 'verify',
          label: copy.techActionVerify,
          value: String(stats.awaitingVerification ?? 0),
          icon: AppIcons.techStats.verify,
          iconBg: ui.brandSoft,
          iconColor: ui.brand,
          onPress: verifyJobs[0] ? () => appPush(techRoutes.job(verifyJobs[0].id)) : undefined,
        },
        {
          key: 'done',
          label: copy.techStatCompleted,
          value: String(stats.completed),
          icon: AppIcons.techStats.done,
          iconBg: ui.brandSoft,
          iconColor: ui.brand,
        },
      ]
    : [];

  let section = 0;
  const enter = () => stagger(section++);

  return (
    <TechScreenScroll
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />}
    >
      <FadeSlideIn delay={enter()} slideFrom={14}>
        <TechProfileHero
          name={name}
          phone={formatPhoneDisplay(phone)}
          city={city}
          stats={stats}
          todayStatus={todayStatus}
          onDuty={onDuty}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
        <Text style={styles.kicker}>{copy.techQuickActionsTitle}</Text>
        <TechQuickActions
          activeJobId={activeJob?.id}
          verifyJobId={verifyJobs[0]?.id}
          verifyCount={verifyJobs.length}
          openCount={openCount}
        />
      </FadeSlideIn>

      {stats?.paySummary ? (
        <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
          <View style={styles.payCard}>
            <Text style={styles.kickerFlat}>{copy.techPayRuleTitle}</Text>
            <Text style={styles.payValue}>{stats.paySummary}</Text>
            <Text style={styles.payHint}>{copy.techPayRuleHint}</Text>
          </View>
        </FadeSlideIn>
      ) : null}

      {stats ? (
        <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
          <TechSectionTitle title={booking.techPerformanceTitle} hint={copy.techPerformanceHint} flush />
          <AnalyticsStatGrid items={statItems} />
        </FadeSlideIn>
      ) : null}

      {monthStatsLoading || monthStats?.analytics ? (
        <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
          <TechSectionTitle title={copy.techAttendanceTitle} hint={copy.techAttendanceHint} flush />
          {monthStats?.analytics && !monthStatsLoading ? (
            <TechAttendanceSummary analytics={monthStats.analytics} />
          ) : (
            <TechBlockSkeleton height={196} />
          )}
        </FadeSlideIn>
      ) : null}

      <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
        <TechSectionTitle title={booking.techScheduleTitle} hint={copy.techScheduleHint} flush />
        {notice}
        <TechAttendanceCalendar
          month={month}
          onMonthChange={onMonthChange}
          attendance={attendance}
          bookings={bookings}
          onPressJob={(id) => appPush(techRoutes.job(id))}
        />
      </FadeSlideIn>

      <FadeSlideIn delay={enter()} slideFrom={14} style={styles.block}>
        <PressableScale
          onPress={onLogout}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel={copy.techSignOut}
        >
          <LogOut size={18} color={colors.error} strokeWidth={2.2} />
          <Text style={styles.logoutText}>{copy.techSignOut}</Text>
        </PressableScale>
      </FadeSlideIn>
    </TechScreenScroll>
  );
}

const styles = StyleSheet.create({
  /** Clear the docked tab bar (design rule: every tab scroll ends with the tab-bar pad). */
  content: { paddingBottom: TECH_TAB_BAR_PAD + spacing.md },
  block: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  kicker: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  kickerFlat: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  payCard: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  payValue: { marginTop: 4, fontFamily: fonts.displayExtra, fontSize: 17, letterSpacing: -0.2, color: ui.brand },
  payHint: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.error },
});
