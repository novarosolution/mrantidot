import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Briefcase, CheckCircle2, Clock, IndianRupee, ShieldCheck, Star } from 'lucide-react-native';
import { AnalyticsStatGrid, type AnalyticsStatItem } from '@/components/kit/AnalyticsStatGrid';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { KpiCard } from '@/components/kit/KpiCard';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { localDateKey } from '@/lib/dates';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

export function TechnicianProfilePanel({
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
          onPress: () => router.back(),
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
          iconBg: surfaces.tintWarning,
          iconColor: colors.amberInk,
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
          value: `₹${stats.earnings}`,
          icon: IndianRupee,
          iconBg: colors.soft,
          iconColor: colors.green,
        },
        {
          key: 'rating',
          label: 'Rating',
          value: `★${stats.rating}`,
          icon: Star,
          iconBg: colors.secondarySoft,
          iconColor: colors.secondaryDark,
        },
      ]
    : [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
      }
    >
      <UserAccountCard compact />

      {todayStatus === 'pending' ? (
        <Card variant="premium" style={styles.banner}>
          <Text style={styles.bannerTitle}>Mark yourself on duty</Text>
          <Text style={styles.bannerSub}>Check in when you start your work day.</Text>
          <View style={styles.bannerActions}>
            <Button title="On duty today" variant="premium" fullWidth={false} onPress={onCheckIn} loading={checkingIn} style={styles.bannerBtn} />
            <Button title="Off today" variant="secondary" fullWidth={false} onPress={onMarkAbsent} loading={checkingIn} style={styles.bannerBtn} />
          </View>
        </Card>
      ) : todayStatus === 'came' ? (
        <Card variant="premium" style={styles.onDuty}>
          <Text style={styles.onDutyText}>On duty today</Text>
        </Card>
      ) : (
        <Card variant="premium" style={styles.offDuty}>
          <Text style={styles.offDutyText}>Marked off duty today</Text>
        </Card>
      )}

      {statItems.length > 0 ? (
        <View style={styles.statsBlock}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <AnalyticsStatGrid items={statItems} />
        </View>
      ) : null}

      {stats?.analytics ? (
        <View style={styles.statsBlock}>
          <AttendanceAnalyticsCard analytics={stats.analytics} />
        </View>
      ) : null}

      {stats ? (
        <View style={styles.earningsRow}>
          <KpiCard
            icon={IndianRupee}
            value={`₹${stats.earnings}`}
            label={`Total earnings`}
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
      ) : null}

      {(stats?.jobVisits?.length ?? 0) > 0 ? (
        <View style={styles.statsBlock}>
          <Text style={styles.sectionTitle}>Job visits ({month})</Text>
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

      <View style={styles.statsBlock}>
        <Text style={styles.sectionTitle}>Schedule calendar</Text>
        <TechnicianDayCalendar
          calendar={calendar}
          attendance={attendance}
          bookings={bookings}
          onPressBooking={(id) => router.push(`/(tech)/job/${id}`)}
          monthKey={month}
          onMonthChange={onMonthChange}
        />
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

export async function checkInTechnician() {
  try {
    await api.post('/attendance/check-in');
    Toast.show({ type: 'success', text1: 'You are on duty today' });
  } catch (err) {
    Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not check in') });
    throw err;
  }
}

export async function markTechnicianAbsent() {
  try {
    await api.post('/attendance/mark-absent');
    Toast.show({ type: 'success', text1: 'Marked off duty for today' });
  } catch (err) {
    Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update attendance') });
    throw err;
  }
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  banner: { padding: spacing.md, marginBottom: spacing.md, marginTop: spacing.sm },
  bannerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  bannerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
  bannerActions: { flexDirection: 'row', gap: spacing.sm },
  bannerBtn: { flex: 1 },
  onDuty: { padding: spacing.md, marginBottom: spacing.md, backgroundColor: surfaces.tintSuccess },
  onDutyText: { fontFamily: fonts.bodySemi, fontSize: 14, color: surfaces.tintSuccessInk },
  offDuty: { padding: spacing.md, marginBottom: spacing.md, backgroundColor: surfaces.tintDanger },
  offDutyText: { fontFamily: fonts.bodySemi, fontSize: 14, color: surfaces.tintDangerInk },
  statsBlock: { marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  earningsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.md },
});
