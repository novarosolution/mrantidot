import { router } from 'expo-router';
import { safeGoBack } from '@/lib/routes';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AnalyticsStatGrid, type AnalyticsStatItem } from '@/components/kit/AnalyticsStatGrid';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { formatRupee } from '@/components/kit/format';
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
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function TechnicianProfilePanel({
  copy,
  user,
  stats,
  bookings,
  attendance,
  calendar,
  month,
  todayStatus,
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
          iconBg: colors.blueBg,
          iconColor: colors.blue,
          onPress: () => safeGoBack('/(tech)'),
        },
        {
          key: 'active',
          label: 'Active',
          value: String(stats.inProgress),
          icon: AppIcons.techStats.active,
          iconBg: colors.amberBg,
          iconColor: colors.amberInk,
          onPress: () => activeJob && router.push(`/(tech)/job/${activeJob.id}`),
        },
        {
          key: 'verify',
          label: 'Verify',
          value: String(stats.awaitingVerification ?? 0),
          icon: AppIcons.techStats.verify,
          iconBg: colors.secondarySoft,
          iconColor: colors.secondaryDark,
          onPress: () => verifyJob && router.push(`/(tech)/job/${verifyJob.id}`),
        },
        {
          key: 'done',
          label: 'Completed',
          value: String(stats.completed),
          icon: AppIcons.techStats.done,
          iconBg: colors.soft,
          iconColor: colors.green,
        },
        {
          key: 'earnings',
          label: 'Earnings',
          value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
          icon: AppIcons.techStats.earnings,
          iconBg: colors.soft,
          iconColor: colors.green,
        },
        {
          key: 'rating',
          label: 'Rating',
          value: `★${stats.rating}`,
          icon: AppIcons.techStats.rating,
          iconBg: colors.amberBg,
          iconColor: colors.amberInk,
        },
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
        showStats={false}
        name={displayUserName(user)}
        phone={user?.phone}
        city={user?.city}
        stats={stats}
        todayStatus={todayStatus}
      />

      {stats ? (
        <View style={styles.block}>
          <TechSectionTitle title={copy.techPerformanceTitle} hint="Tap a metric to open related job" />
          <AnalyticsStatGrid items={statItems} />
        </View>
      ) : null}

      {stats?.analytics ? (
        <View style={styles.block}>
          <TechSectionTitle title="Attendance & visits" hint="This month's operational stats" />
          <AttendanceAnalyticsCard analytics={stats.analytics} />
        </View>
      ) : null}

      <View style={styles.block}>
        <TechSectionTitle title={copy.techScheduleTitle} hint="Tap a day to view jobs" />
        <TechnicianDayCalendar
          calendar={calendar}
          attendance={attendance}
          bookings={bookings}
          onPressBooking={(id) => router.push(`/(tech)/job/${id}`)}
          monthKey={month}
          onMonthChange={onMonthChange}
        />
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
    api.get<{ attendance: Record<string, DayAttendanceStatus>; todayStatus: DayAttendanceStatus }>(
      '/attendance/me',
      { ...screenLoadConfig, params: { month } },
    ),
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
    borderColor: 'rgba(192,73,46,0.2)',
    ...shadows.card,
  },
  logoutPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  logoutText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.error },
});
