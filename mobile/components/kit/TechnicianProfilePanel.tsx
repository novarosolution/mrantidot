import { router } from 'expo-router';
import { safeGoBack } from '@/lib/routes';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Briefcase, CheckCircle2, Clock, IndianRupee, ShieldCheck, Star } from 'lucide-react-native';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AnalyticsStatGrid, type AnalyticsStatItem } from '@/components/kit/AnalyticsStatGrid';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { formatRupee } from '@/components/kit/format';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { KpiCard } from '@/components/kit/KpiCard';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import { TechCheckInCard, TechOffDutyCard, TechOnDutyCard, TechSectionTitle } from '@/components/kit/TechPageKit';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { Button } from '@/components/ui/Button';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { localDateKey } from '@/lib/dates';
import type { Booking, BookingCopyConfig, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, spacing } from '@/constants/theme';

const TAB_BAR_PAD = 96;

export function TechnicianProfilePanel({
  copy,
  stats,
  bookings,
  attendance,
  calendar,
  month,
  todayStatus,
  checkingIn,
  refreshing,
  onRefresh,
  onMonthChange,
  onCheckIn,
  onMarkAbsent,
}: {
  copy: BookingCopyConfig;
  stats: TechnicianStats | null;
  bookings: Booking[];
  attendance: Record<string, DayAttendanceStatus>;
  calendar: Record<string, number>;
  month: string;
  todayStatus: DayAttendanceStatus;
  checkingIn: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onMonthChange: (month: string) => void;
  onCheckIn: () => void;
  onMarkAbsent: () => void;
}) {
  const today = localDateKey();
  const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');

  const statItems: AnalyticsStatItem[] = stats
    ? [
        {
          key: 'assigned',
          label: 'Assigned',
          value: String(stats.assigned),
          icon: Briefcase,
          iconBg: colors.blueBg,
          iconColor: colors.blue,
          onPress: () => safeGoBack('/(tech)'),
        },
        {
          key: 'active',
          label: 'Active',
          value: String(stats.inProgress),
          icon: Clock,
          iconBg: colors.amberBg,
          iconColor: colors.amberInk,
          onPress: () => activeJob && router.push(`/(tech)/job/${activeJob.id}`),
        },
        {
          key: 'verify',
          label: 'Verify',
          value: String(stats.awaitingVerification ?? 0),
          icon: ShieldCheck,
          iconBg: colors.secondarySoft,
          iconColor: colors.secondaryDark,
          onPress: () => verifyJob && router.push(`/(tech)/job/${verifyJob.id}`),
        },
        {
          key: 'done',
          label: 'Completed',
          value: String(stats.completed),
          icon: CheckCircle2,
          iconBg: colors.soft,
          iconColor: colors.green,
        },
        {
          key: 'earnings',
          label: 'Earnings',
          value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
          icon: IndianRupee,
          iconBg: colors.soft,
          iconColor: colors.green,
        },
        {
          key: 'rating',
          label: 'Rating',
          value: `★${stats.rating}`,
          icon: Star,
          iconBg: colors.amberBg,
          iconColor: colors.amberInk,
        },
      ]
    : [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
      }
      showsVerticalScrollIndicator={false}
    >
      <UserAccountCard compact />

      {todayStatus === 'pending' ? (
        <TechCheckInCard
          title={copy.techCheckInTitle}
          subtitle={copy.techCheckInSubtitle}
          onDutyLabel={copy.techOnDutyButton}
          offDutyLabel={copy.techOffDutyButton}
          onCheckIn={onCheckIn}
          onMarkAbsent={onMarkAbsent}
          loading={checkingIn}
        />
      ) : todayStatus === 'came' ? (
        <TechOnDutyCard
          badgeLabel={copy.techOnDutyBadge}
          markOffLabel={copy.techOffDutyButton}
          onMarkOff={onMarkAbsent}
          loading={checkingIn}
        />
      ) : (
        <TechOffDutyCard
          badgeLabel={copy.techOffDutyBadge}
          hint={copy.techOffDutyHint}
          backOnDutyLabel={copy.techBackOnDutyButton}
          onGoOnDuty={onCheckIn}
          loading={checkingIn}
        />
      )}

      {stats ? (
        <>
          <AdminStatStrip
            items={[
              {
                label: 'Attendance',
                value: stats.analytics ? `${stats.analytics.attendanceRate}%` : '—',
              },
              {
                label: 'Completion',
                value: stats.analytics ? `${stats.analytics.completionRate}%` : '—',
                color: colors.green,
              },
              {
                label: 'Earnings',
                value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
              },
              { label: 'Jobs done', value: stats.jobsDone ?? stats.completed },
            ]}
          />
          <View style={styles.block}>
            <TechSectionTitle title={copy.techPerformanceTitle} hint="Tap a metric for details" />
            <AnalyticsStatGrid items={statItems} />
          </View>
          <View style={styles.earningsRow}>
            <KpiCard
              icon={IndianRupee}
              value={stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
              label="Total earnings"
              iconBg={colors.soft}
              iconColor={colors.green}
            />
            <KpiCard
              icon={CheckCircle2}
              value={String(stats.jobsDone ?? stats.completed)}
              label="Jobs done (all time)"
              iconBg={colors.blueBg}
              iconColor={colors.blue}
            />
          </View>
        </>
      ) : null}

      {stats?.analytics ? (
        <View style={styles.block}>
          <TechSectionTitle title="Attendance & visits" hint="This month's operational stats" />
          <AttendanceAnalyticsCard analytics={stats.analytics} />
        </View>
      ) : null}

      {(stats?.jobVisits?.length ?? 0) > 0 ? (
        <View style={styles.block}>
          <TechSectionTitle title={`${copy.techJobVisitsTitle} (${month})`} hint="Tap to open job" />
          {stats!.jobVisits!.map((visit) => {
            const booking = bookings.find((b) => b.id === visit.bookingId);
            if (!booking) return null;
            return (
              <JobVisitCard
                key={visit.bookingId}
                booking={booking}
                today={today}
                onPress={() => router.push(`/(tech)/job/${visit.bookingId}`)}
              />
            );
          })}
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

      <View style={styles.footer}>
        <Button title="View all jobs" variant="secondary" onPress={() => safeGoBack('/(tech)')} />
      </View>
    </ScrollView>
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
  container: { paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_PAD },
  block: { marginBottom: spacing.md },
  earningsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.md },
  footer: { marginTop: spacing.sm, marginBottom: spacing.md },
});
