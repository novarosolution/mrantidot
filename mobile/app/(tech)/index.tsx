import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { LogOut } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { localDateKey } from '@/lib/dates';
import { jobVisitHint } from '@/lib/job-visit-helpers';
import { bookingServiceName } from '@/lib/booking-helpers';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, design, fonts, spacing, surfaces } from '@/constants/theme';

type Section = { key: string; title: string; data: Booking[]; empty: string };

export default function TechDashboard() {
  const { logout, user } = useAuth();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const [statsRes, bookingsRes, attRes] = await Promise.all([
      api.get<TechnicianStats>('/stats/technician', screenLoadConfig),
      api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig),
      api.get<{ todayStatus: DayAttendanceStatus }>('/attendance/me', screenLoadConfig).catch(() => ({
        data: { todayStatus: 'pending' as DayAttendanceStatus },
      })),
    ]);
    setStats(statsRes.data);
    setBookings(bookingsRes.data.bookings);
    setTodayStatus(attRes.data.todayStatus ?? statsRes.data.todayStatus ?? 'pending');
  }, []);

  async function checkInToday() {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in');
      Toast.show({ type: 'success', text1: 'You are on duty today' });
      await load();
    } finally {
      setCheckingIn(false);
    }
  }

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load jobs'));
      } finally {
        setLoading(false);
      }
    });
  }, [load]);

  const confirmLogout = useCallback(() => {
    Alert.alert('Sign out?', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [logout]);

  const today = localDateKey();

  const sections = useMemo((): Section[] => {
    const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
    const past = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));
    const todayJobs = active.filter((b) => b.schedule.date === today);
    const upcoming = active.filter((b) => b.schedule.date > today);
    const result: Section[] = [];
    if (todayJobs.length) {
      result.push({ key: 'today', title: `Today (${todayJobs.length})`, data: todayJobs, empty: 'No jobs scheduled for today' });
    }
    if (upcoming.length) {
      result.push({ key: 'upcoming', title: `Upcoming (${upcoming.length})`, data: upcoming, empty: 'No upcoming jobs' });
    }
    if (!todayJobs.length && !upcoming.length && active.length) {
      result.push({ key: 'assigned', title: 'Assigned', data: active, empty: 'No active jobs' });
    }
    if (past.length) {
      result.push({ key: 'past', title: `Past (${past.length})`, data: past, empty: 'No completed jobs yet' });
    }
    return result;
  }, [bookings, today]);

  const flatData = useMemo(
    () => sections.flatMap((s) => [{ type: 'header' as const, section: s }, ...s.data.map((b) => ({ type: 'job' as const, booking: b }))]),
    [sections],
  );

  const headerBar = (
    <CustomerPageHeader
      variant="premium"
      title="My Jobs"
      subtitle={`${user?.name?.trim() || 'Technician'} · ${bookings.length} job${bookings.length === 1 ? '' : 's'}`}
      rightAction={
        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <LogOut size={18} color={colors.white} />
        </Pressable>
      }
    >
      <Pressable onPress={() => router.push('/(tech)/profile')}>
        <Text style={styles.analyticsLink}>My profile →</Text>
      </Pressable>
    </CustomerPageHeader>
  );

  if (loading) return <Spinner fullScreen />;

  if (loadError && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {headerBar}
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <FlatList
        data={flatData}
        {...CUSTOMER_LIST_PERF}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `h-${item.section.key}` : item.booking.id
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.green}
          />
        }
        ListHeaderComponent={
          <View>
            {headerBar}
            <View style={styles.accountWrap}>
              <UserAccountCard compact onPress={() => router.push('/(tech)/profile')} />
            </View>
            {todayStatus === 'pending' ? (
              <Card variant="premium" style={styles.checkInCard}>
                <Text style={styles.checkInTitle}>Mark yourself on duty</Text>
                <Button title="Check in for today" onPress={() => void checkInToday()} loading={checkingIn} />
              </Card>
            ) : todayStatus === 'came' ? (
              <View style={styles.onDutyChip}>
                <Text style={styles.onDutyChipText}>● On duty today</Text>
              </View>
            ) : null}
            {stats && (
              <View style={styles.statsRow}>
                <Stat label="Assigned" value={stats.assigned} />
                <Stat label="Active" value={stats.inProgress} />
                <Stat
                  label="Verify"
                  value={stats.awaitingVerification ?? 0}
                  onPress={() => {
                    const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
                    if (verifyJob) router.push(`/(tech)/job/${verifyJob.id}`);
                  }}
                />
                <Stat label="Done" value={stats.completed} />
                <Stat
                  label="Earnings"
                  value={`₹${stats.earnings}`}
                  onPress={() => router.push('/(tech)/profile')}
                />
                <Stat label="Rating" value={`★${stats.rating}`} />
              </View>
            )}
          </View>
        }
        contentContainerStyle={bookings.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <EmptyState title="No jobs assigned" message="New jobs from admin will appear here" />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.section}>{item.section.title}</Text>;
          }
          const b = item.booking;
          const done = b.steps.filter((s) => s.status === 'done').length;
          const total = b.steps.length || 1;
          return (
            <View>
              <BookingListCard
                booking={b}
                hideAmount
                showCustomer
                onPress={() => router.push(`/(tech)/job/${b.id}`)}
              />
              <Text style={styles.visitHint}>{jobVisitHint(b, today)}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(done / total) * 100}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {bookingServiceName(b)} · {done}/{total} steps
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number | string;
  onPress?: () => void;
}) {
  const content = (
    <Card variant="premium" style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
  if (onPress) {
    return (
      <Pressable style={styles.statWrap} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.statWrap}>{content}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.white },
  headerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.lime, marginTop: 4 },
  analyticsLink: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.secondaryDark, marginTop: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  accountWrap: { paddingHorizontal: spacing.md, marginTop: -4 },
  checkInCard: { marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.md },
  checkInTitle: { fontFamily: fonts.display, fontSize: 14, marginBottom: spacing.sm },
  onDutyChip: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: surfaces.tintSuccess,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  onDutyChipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: spacing.md, marginTop: -8 },
  statWrap: { width: '30%', flexGrow: 1, minWidth: '28%' },
  stat: { alignItems: 'center', paddingVertical: 14 },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.green },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  section: {
    ...design.sectionTitle,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  visitHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: -4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  progressRow: { marginTop: -6, marginBottom: spacing.sm, paddingHorizontal: 4 },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', backgroundColor: colors.green },
  progressLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
});
