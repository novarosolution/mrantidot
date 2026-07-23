import { safeGoBack, techRoutes, appPush } from '@/lib/routes';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AnalyticsStatGrid, type AnalyticsStatItem } from '@/components/kit/AnalyticsStatGrid';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import { TechSectionTitle } from '@/components/kit/TechPageKit';
import { TechProfileHero } from '@/components/kit/TechProfileHero';
import { TechScreenScroll, techScreenStyles } from '@/components/kit/TechScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { displayUserName } from '@/lib/profile-display';
import type { Booking, BookingCopyConfig, DayAttendanceStatus, TechnicianStats, User } from '@/types/api';
import { homeShadow } from '@/components/kit/homeUi';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

export function TechnicianProfilePanel({
  copy,
  user,
  stats,
  bookings,
  attendance,
  calendar,
  month,
  todayStatus,
  onDuty = false,
  refreshing,
  onRefresh,
  onMonthChange,
  onLogout,
}: {
  copy: BookingCopyConfig;
  user: User | null;
  stats: TechnicianStats | null;
  bookings: Booking[];
  attendance: Record<string, DayAttendanceStatus>;
  calendar: Record<string, number>;
  month: string;
  todayStatus: DayAttendanceStatus;
  onDuty?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onMonthChange: (month: string) => void;
  onLogout?: () => void;
}) {
  const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');

  const statItems: AnalyticsStatItem[] = stats
    ? [
        {
          key: 'assigned',
          label: 'Assigned',
          value: String(stats.assigned),
          icon: AppIcons.techStats.assigned,
          iconBg: colors.soft,
          iconColor: colors.forest,
          onPress: () => safeGoBack(techRoutes.home),
        },
        {
          key: 'active',
          label: 'Active',
          value: String(stats.inProgress),
          icon: AppIcons.techStats.active,
          iconBg: '#EEF8E6',
          iconColor: colors.green,
          onPress: () => activeJob && appPush(techRoutes.job(activeJob.id)),
        },
        {
          key: 'verify',
          label: 'Verify',
          value: String(stats.awaitingVerification ?? 0),
          icon: AppIcons.techStats.verify,
          iconBg: '#E8F5EC',
          iconColor: colors.forest,
          onPress: () => verifyJob && appPush(techRoutes.job(verifyJob.id)),
        }
      ]
    : [];

  return (
    <TechScreenScroll
      contentContainerStyle={techScreenStyles.scrollEmpty}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
      }
    >
      <TechProfileHero
        compact
        showStats={true}
        name={displayUserName(user)}
        phone={user?.phone}
        city={user?.city}
        stats={stats}
        todayStatus={todayStatus}
        onDuty={onDuty}
      />

      {stats?.paySummary ? (
        <View style={styles.block}>
          <View style={styles.payShell}>
            <View style={styles.payCard}>
              <Text style={styles.payLabel}>Pay rule</Text>
              <Text style={styles.payValue}>{stats.paySummary}</Text>
              <Text style={styles.payHint}>Set by admin · applied when a job is completed</Text>
            </View>
          </View>
        </View>
      ) : null}

      {stats ? (
        <View style={styles.block}>
          <TechSectionTitle title={copy.techPerformanceTitle} hint="Tap a metric to open related work" />
          <AnalyticsStatGrid items={statItems} />
        </View>
      ) : null}

      {stats?.analytics ? (
        <View style={styles.block}>
          <TechSectionTitle title="Attendance & visits" hint="Presence and visit performance" />
          <AttendanceAnalyticsCard analytics={stats.analytics} />
        </View>
      ) : null}

      <View style={styles.block}>
        <TechSectionTitle title={copy.techScheduleTitle} hint="Assigned visits this month" />
        <TechnicianDayCalendar
          calendar={calendar}
          attendance={attendance}
          bookings={bookings}
          onPressBooking={(id) => appPush(techRoutes.job(id))}
          monthKey={month}
          onMonthChange={onMonthChange}
        />
      </View>

      <View style={styles.block}>
        <Pressable
          style={({ pressed }) => [styles.leaveLink, pressed && styles.logoutPressed]}
          onPress={() => appPush(techRoutes.leave)}
        >
          <PremiumIcon
            icon={AppIcons.ui.calendar}
            variant="soft"
            size="md"
            color={colors.forest}
            bg={colors.soft}
            boxSize={38}
          />
          <View style={styles.leaveCopy}>
            <Text style={styles.leaveTitle}>Leave</Text>
            <Text style={styles.leaveSub}>Request time off for admin approval</Text>
          </View>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={16} color={colors.muted} />
        </Pressable>
      </View>

      {onLogout ? (
        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]} onPress={onLogout}>
          <PremiumIcon
            icon={AppIcons.techProfile.logout}
            variant="soft"
            size="md"
            color={colors.error}
            bg={colors.errorBg}
            boxSize={38}
          />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      ) : null}
    </TechScreenScroll>
  );
}

export async function loadTechnicianProfileData(month: string) {
  const [statsRes, bookingsRes, attRes] = await Promise.all([
    api.get<TechnicianStats>('/stats/technician', { ...screenLoadConfig, params: { month } }),
    api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig),
    api.get<{
      attendance: Record<string, DayAttendanceStatus>;
      todayStatus: DayAttendanceStatus;
      onDuty?: boolean;
    }>('/attendance/me', { ...screenLoadConfig, params: { month } }),
  ]);

  const cal: Record<string, number> = {};
  for (const b of bookingsRes.data.bookings) {
    const d = bookingVisitDate(b);
    if (!d) continue;
    cal[d] = (cal[d] ?? 0) + 1;
  }

  return {
    stats: statsRes.data,
    bookings: bookingsRes.data.bookings,
    attendance: attRes.data.attendance,
    todayStatus: attRes.data.todayStatus ?? statsRes.data.todayStatus ?? ('pending' as DayAttendanceStatus),
    onDuty: Boolean(attRes.data.onDuty),
    calendar: cal,
  };
}

export async function checkInTechnician(copy: Pick<BookingCopyConfig, 'techOnDutyBadge'>) {
  try {
    await api.post('/attendance/check-in');
    Toast.show({ type: 'success', text1: copy.techOnDutyBadge.replace('● ', '') });
  } catch (err) {
    Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not check in') });
    throw err;
  }
}

export async function markTechnicianAbsent(copy: Pick<BookingCopyConfig, 'techOffDutyBadge'>) {
  try {
    await api.post('/attendance/mark-absent');
    Toast.show({ type: 'success', text1: copy.techOffDutyBadge });
  } catch (err) {
    Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update attendance') });
    throw err;
  }
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  payShell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  payCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    padding: spacing.md,
  },
  payLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  payValue: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.forest,
    letterSpacing: -0.2,
  },
  payHint: { marginTop: 4, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  logout: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#F0D0C8',
    ...homeShadow.soft,
  },
  leaveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...homeShadow.soft,
  },
  leaveCopy: { flex: 1, minWidth: 0 },
  leaveTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  leaveSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  logoutPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  logoutText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.error },
});
