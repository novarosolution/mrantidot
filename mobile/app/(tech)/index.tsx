import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { LogOut } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AnalyticsStatGrid } from '@/components/kit/AnalyticsStatGrid';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { formatRupee } from '@/components/kit/format';
import { TechCheckInCard, TechOffDutyCard, TechOnDutyCard, TechSectionTitle } from '@/components/kit/TechPageKit';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { useTechCopy } from '@/lib/tech-copy';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, design, fonts, spacing } from '@/constants/theme';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Star,
} from 'lucide-react-native';

type Section = { key: string; title: string; data: Booking[] };

const TAB_BAR_PAD = 88;

export default function TechDashboard() {
  const copy = useTechCopy();
  const { logout, user, refreshMe } = useAuth();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    setLoadError(null);
    const cacheOpts = opts?.skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.stats };
    const listCache = opts?.skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.bookingsList };
    const [statsRes, bookingsRes, attRes] = await Promise.all([
      api.get<TechnicianStats>('/stats/technician', { ...screenLoadConfig, ...cacheOpts }),
      api.get<{ bookings: Booking[] }>('/bookings', { ...screenLoadConfig, ...listCache }),
      api.get<{ todayStatus: DayAttendanceStatus }>('/attendance/me', {
        ...screenLoadConfig,
        ...cacheOpts,
      }).catch(() => ({
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
      Toast.show({ type: 'success', text1: copy.techOnDutyBadge.replace('● ', '') });
      await Promise.all([load({ skipCache: true }), refreshMe({ silent: true })]);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not check in') });
    } finally {
      setCheckingIn(false);
    }
  }

  async function markOffToday() {
    setCheckingIn(true);
    try {
      await api.post('/attendance/mark-absent');
      Toast.show({ type: 'success', text1: copy.techOffDutyBadge });
      await Promise.all([load({ skipCache: true }), refreshMe({ silent: true })]);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update attendance') });
    } finally {
      setCheckingIn(false);
    }
  }

  const confirmMarkOff = useCallback(() => {
    Alert.alert(copy.techOffDutyButton, copy.techOffDutyHint, [
      { text: 'Cancel', style: 'cancel' },
      { text: copy.techOffDutyButton, style: 'destructive', onPress: () => void markOffToday() },
    ]);
  }, [copy.techOffDutyButton, copy.techOffDutyHint]);

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
    const todayJobs = active.filter((b) => bookingVisitDate(b) === today);
    const upcoming = active.filter((b) => bookingVisitDate(b) > today);
    const result: Section[] = [];
    if (todayJobs.length) {
      result.push({ key: 'today', title: `Today (${todayJobs.length})`, data: todayJobs });
    }
    if (upcoming.length) {
      result.push({ key: 'upcoming', title: `Upcoming (${upcoming.length})`, data: upcoming });
    }
    if (!todayJobs.length && !upcoming.length && active.length) {
      result.push({ key: 'assigned', title: `Assigned (${active.length})`, data: active });
    }
    if (past.length) {
      result.push({ key: 'past', title: `Past (${past.length})`, data: past });
    }
    return result;
  }, [bookings, today]);

  const flatData = useMemo(
    () =>
      sections.flatMap((s) => [
        { type: 'header' as const, section: s },
        ...s.data.map((b) => ({ type: 'job' as const, booking: b })),
      ]),
    [sections],
  );

  const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');

  const statItems = stats
    ? [
        {
          key: 'assigned',
          label: 'Assigned',
          value: String(stats.assigned),
          icon: Briefcase,
          iconBg: colors.blueBg,
          iconColor: colors.blue,
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
          label: 'Done',
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
          iconColor: colors.forest,
          onPress: () => router.push('/(tech)/profile'),
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

  const headerBar = (
    <CustomerPageHeader
      variant="premium"
      title={copy.techJobsTitle}
      subtitle={`Hi, ${(user?.name?.trim() || 'Technician').split(' ')[0]}`}
      rightAction={
        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <LogOut size={18} color={colors.white} />
        </Pressable>
      }
    />
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
              try {
                await load({ skipCache: true });
              } catch (err) {
                Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not refresh') });
              } finally {
                setRefreshing(false);
              }
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
              <TechCheckInCard
                title={copy.techCheckInTitle}
                subtitle={copy.techCheckInSubtitle}
                onDutyLabel={copy.techOnDutyButton}
                offDutyLabel={copy.techOffDutyButton}
                onCheckIn={() => void checkInToday()}
                onMarkAbsent={confirmMarkOff}
                loading={checkingIn}
              />
            ) : todayStatus === 'came' ? (
              <TechOnDutyCard
                badgeLabel={copy.techOnDutyBadge}
                markOffLabel={copy.techOffDutyButton}
                onMarkOff={confirmMarkOff}
                loading={checkingIn}
              />
            ) : (
              <TechOffDutyCard
                badgeLabel={copy.techOffDutyBadge}
                hint={copy.techOffDutyHint}
                backOnDutyLabel={copy.techBackOnDutyButton}
                onGoOnDuty={() => void checkInToday()}
                loading={checkingIn}
              />
            )}

            {stats ? (
              <>
                <AdminStatStrip
                  items={[
                    { label: 'Assigned', value: stats.assigned },
                    { label: 'Active', value: stats.inProgress, color: colors.amberInk },
                    {
                      label: 'Earnings',
                      value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
                    },
                    { label: 'Rating', value: `★${stats.rating}`, color: colors.forest },
                  ]}
                />
                <View style={styles.statsBlock}>
                  <TechSectionTitle title={copy.techPerformanceTitle} hint="Tap a tile for job details" />
                  <AnalyticsStatGrid items={statItems} />
                </View>
              </>
            ) : null}

            {sections.length > 0 ? (
              <TechSectionTitle title="Your schedule" hint="Today, upcoming & completed jobs" />
            ) : null}
          </View>
        }
        contentContainerStyle={[
          bookings.length === 0 && sections.length === 0 ? styles.empty : styles.list,
          { paddingBottom: TAB_BAR_PAD },
        ]}
        ListEmptyComponent={
          <EmptyState title={copy.techEmptyJobsTitle} message={copy.techEmptyJobsMessage} />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.section.title}</Text>;
          }
          return (
            <BookingListCard
              booking={item.booking}
              hideAmount
              showCustomer
              onPress={() => router.push(`/(tech)/job/${item.booking.id}`)}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountWrap: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  statsBlock: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.forest,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  list: { paddingHorizontal: spacing.md },
  empty: { flexGrow: 1, paddingHorizontal: spacing.md },
});
