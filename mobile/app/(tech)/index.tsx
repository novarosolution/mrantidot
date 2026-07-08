import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassBackdrop } from '@/components/kit/GlassScreenKit';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { TechCheckInCard, TechOffDutyCard, TechOnDutyCard } from '@/components/kit/TechPageKit';
import { TechJobQuickBar } from '@/components/kit/TechJobQuickBar';
import { TechPriorityBanner } from '@/components/kit/TechPriorityBanner';
import { TechScreenGutter, TechScreenList, techScreenStyles } from '@/components/kit/TechScreenKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { useTechCopy } from '@/lib/tech-copy';
import type { Booking, DayAttendanceStatus } from '@/types/api';
import { colors, premiumType, spacing, surfaces } from '@/constants/theme';

type Section = { key: string; title: string; data: Booking[] };

export default function TechDashboard() {
  const copy = useTechCopy();
  const { refreshMe, user } = useAuth();
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
    const [bookingsRes, attRes] = await Promise.all([
      api.get<{ bookings: Booking[] }>('/bookings', { ...screenLoadConfig, ...listCache }),
      api.get<{ todayStatus: DayAttendanceStatus }>('/attendance/me', {
        ...screenLoadConfig,
        ...cacheOpts,
      }).catch(() => ({
        data: { todayStatus: 'pending' as DayAttendanceStatus },
      })),
    ]);
    setBookings(bookingsRes.data.bookings);
    setTodayStatus(attRes.data.todayStatus ?? 'pending');
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

  const today = localDateKey();

  const sections = useMemo((): Section[] => {
    const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
    const past = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));
    const overdue = active.filter((b) => {
      const visitDate = bookingVisitDate(b);
      return visitDate && visitDate < today;
    });
    const todayJobs = active.filter((b) => bookingVisitDate(b) === today);
    const upcoming = active.filter((b) => bookingVisitDate(b) > today);
    const result: Section[] = [];
    if (overdue.length) {
      result.push({ key: 'overdue', title: `Overdue (${overdue.length})`, data: overdue });
    }
    if (todayJobs.length) {
      result.push({ key: 'today', title: `Today (${todayJobs.length})`, data: todayJobs });
    }
    if (upcoming.length) {
      result.push({ key: 'upcoming', title: `Upcoming (${upcoming.length})`, data: upcoming });
    }
    if (!overdue.length && !todayJobs.length && !upcoming.length && active.length) {
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
        ...s.data.map((b) => ({ type: 'job' as const, booking: b, sectionKey: s.key })),
      ]),
    [sections],
  );

  const verifyJob = bookings.find((b) => b.status === 'awaiting_verification');
  const activeJob = bookings.find((b) => b.status === 'in_progress');
  const overdueJobs = useMemo(
    () =>
      bookings.filter((b) => {
        if (['completed', 'cancelled'].includes(b.status)) return false;
        const visitDate = bookingVisitDate(b);
        return visitDate && visitDate < today;
      }),
    [bookings, today],
  );

  const headerBar = (
    <CustomerPageHeader
      variant="premium"
      title={copy.techJobsTitle}
      subtitle={`Hi, ${(user?.name?.trim() || 'Technician').split(' ')[0]}`}
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
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TechScreenList
        data={flatData}
        {...CUSTOMER_LIST_PERF}
        empty={flatData.length === 0}
        keyExtractor={(item) =>
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
          <TechScreenGutter>
            {headerBar}

            <TechPriorityBanner overdueJobs={verifyJob ? [] : overdueJobs} verifyJob={verifyJob} flush />

            <TechJobQuickBar
              activeJobId={activeJob?.id}
              verifyJobId={verifyJob?.id}
              verifyCount={bookings.filter((b) => b.status === 'awaiting_verification').length}
            />

            {todayStatus === 'pending' ? (
              <TechCheckInCard
                title={copy.techCheckInTitle}
                subtitle={copy.techCheckInSubtitle}
                onDutyLabel={copy.techOnDutyButton}
                offDutyLabel={copy.techOffDutyButton}
                onCheckIn={() => void checkInToday()}
                onMarkAbsent={confirmMarkOff}
                loading={checkingIn}
                flush
              />
            ) : todayStatus === 'came' ? (
              <TechOnDutyCard
                badgeLabel={copy.techOnDutyBadge}
                markOffLabel={copy.techOffDutyButton}
                onMarkOff={confirmMarkOff}
                loading={checkingIn}
                flush
              />
            ) : (
              <TechOffDutyCard
                badgeLabel={copy.techOffDutyBadge}
                hint={copy.techOffDutyHint}
                backOnDutyLabel={copy.techBackOnDutyButton}
                onGoOnDuty={() => void checkInToday()}
                loading={checkingIn}
                flush
              />
            )}

          </TechScreenGutter>
        }
        ListEmptyComponent={
          <TechScreenGutter style={techScreenStyles.scrollEmpty}>
            <EmptyState title={copy.techEmptyJobsTitle} message={copy.techEmptyJobsMessage} />
          </TechScreenGutter>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <TechScreenGutter style={styles.sectionHeadWrap}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionHeader}>{item.section.title}</Text>
                </View>
              </TechScreenGutter>
            );
          }
          return (
            <TechScreenGutter>
              <BookingListCard
                booking={item.booking}
                hideAmount
                showCustomer
                hint={
                  item.type === 'job' &&
                  item.sectionKey === 'overdue' &&
                  (verifyJob || overdueJobs.length === 0)
                    ? 'Past visit date — action needed'
                    : undefined
                }
                onPress={() => router.push(`/(tech)/job/${item.booking.id}`)}
              />
            </TechScreenGutter>
          );
        }}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1 },
  sectionHeadWrap: { paddingTop: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.amberInk,
  },
  sectionHeader: { ...premiumType.cardTitle, fontSize: 14, color: colors.forest },
});
