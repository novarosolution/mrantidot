import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassBackdrop } from '@/components/kit/GlassScreenKit';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { homeShadow } from '@/components/kit/homeUi';
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
import type { AttendanceRecord, Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, headerTopPad, spacing, surfaces } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';
import { formatRupee } from '@/components/kit/format';

type Section = { key: string; title: string; data: Booking[] };

export default function TechDashboard() {
  const copy = useTechCopy();
  const insets = useSafeAreaInsets();
  const { refreshMe, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
  const [onDuty, setOnDuty] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    setLoadError(null);
    const cacheOpts = opts?.skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.stats };
    const listCache = opts?.skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.bookingsList };
    const [bookingsRes, attRes, statsRes] = await Promise.all([
      api.get<{ bookings: Booking[] }>('/bookings', { ...screenLoadConfig, ...listCache }),
      api
        .get<{
          todayStatus: DayAttendanceStatus;
          onDuty?: boolean;
          todayRecord?: AttendanceRecord | null;
        }>('/attendance/me', {
          ...screenLoadConfig,
          ...cacheOpts,
        })
        .catch(() => {
          Toast.show({ type: 'info', text1: 'Could not load attendance status' });
          return null;
        }),
      api
        .get<TechnicianStats>('/stats/technician', {
          ...screenLoadConfig,
          ...cacheOpts,
        })
        .catch(() => {
          Toast.show({ type: 'info', text1: 'Could not load earnings stats' });
          return null;
        }),
    ]);
    setBookings(bookingsRes.data.bookings);
    if (attRes?.data) {
      setTodayStatus(attRes.data.todayStatus ?? 'pending');
      setOnDuty(Boolean(attRes.data.onDuty));
      setTodayRecord(attRes.data.todayRecord ?? null);
    }
    if (statsRes?.data) {
      setStats(statsRes.data);
    }
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

  async function checkOutToday() {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      Toast.show({ type: 'success', text1: 'Checked out — off duty' });
      await Promise.all([load({ skipCache: true }), refreshMe({ silent: true })]);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not check out') });
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
    Alert.alert('Mark day absent?', 'Use this for sick / full day off. To end duty after working, use Check out.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark absent', style: 'destructive', onPress: () => void markOffToday() },
    ]);
  }, [copy.techOffDutyBadge]);

  const confirmCheckOut = useCallback(() => {
    Alert.alert('Check out?', 'You will go off duty. Today still counts as present.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check out', onPress: () => void checkOutToday() },
    ]);
  }, []);

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
    if (overdue.length) result.push({ key: 'overdue', title: `Overdue (${overdue.length})`, data: overdue });
    if (todayJobs.length) result.push({ key: 'today', title: `Today (${todayJobs.length})`, data: todayJobs });
    if (upcoming.length) result.push({ key: 'upcoming', title: `Upcoming (${upcoming.length})`, data: upcoming });
    if (!overdue.length && !todayJobs.length && !upcoming.length && active.length) {
      result.push({ key: 'assigned', title: `Assigned (${active.length})`, data: active });
    }
    if (past.length) result.push({ key: 'past', title: `Past (${past.length})`, data: past });
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

  const activeCount = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length;
  const firstName = (user?.name?.trim() || 'Technician').split(' ')[0];
  const dutyLabel =
    todayStatus === 'leave'
      ? 'On leave'
      : onDuty
        ? 'On duty'
        : todayStatus === 'came'
          ? 'Checked out'
          : todayStatus === 'not_came'
            ? 'Absent'
            : 'Check in';

  const hero = (
    <HeroDarkSlice
      style={styles.heroShell}
      sliceHeight={20}
      contentStyle={[styles.heroContent, { paddingTop: headerTopPad(insets.top) }]}
    >
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <View style={styles.eyebrowRow}>
            <LinearGradient
              colors={['#C8F07A', '#8FD03C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eyebrowBar}
            />
            <Text style={styles.eyebrow}>FIELD WORK</Text>
          </View>
          <Text style={styles.heroTitle}>{copy.techJobsTitle}</Text>
          <Text style={styles.heroSub}>
            Hi {firstName} · {activeCount} active
            {stats
              ? ` · ${stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`} earned`
              : ''}
          </Text>
        </View>
        <View
          style={[
            styles.dutyPill,
            todayStatus === 'leave'
              ? styles.dutyLeave
              : todayStatus === 'came' && onDuty
                ? styles.dutyOn
                : todayStatus === 'came'
                  ? styles.dutyCheckedOut
                  : todayStatus === 'not_came'
                    ? styles.dutyOff
                    : styles.dutyPending,
          ]}
        >
          <View
            style={[
              styles.dutyDot,
              todayStatus === 'leave'
                ? styles.dutyDotLeave
                : todayStatus === 'came' && onDuty
                  ? styles.dutyDotOn
                  : todayStatus === 'not_came'
                    ? styles.dutyDotOff
                    : styles.dutyDotPending,
            ]}
          />
          <Text style={styles.dutyText}>{dutyLabel}</Text>
        </View>
      </View>
    </HeroDarkSlice>
  );

  if (loading) {
    return (
      <View style={styles.rootShell}><GlassBackdrop /><SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {hero}
        <View style={styles.loadingBody}>
          <Spinner />
        </View>
      </SafeAreaView></View>
    );
  }

  if (loadError && bookings.length === 0) {
    return (
      <View style={styles.rootShell}><GlassBackdrop /><SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {hero}
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
      </SafeAreaView></View>
    );
  }

  return (
    <View style={styles.rootShell}><GlassBackdrop /><SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <TechScreenList
        data={flatData}
        {...CUSTOMER_LIST_PERF}
        empty={flatData.length === 0}
        keyExtractor={(item) => (item.type === 'header' ? `h-${item.section.key}` : item.booking.id)}
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
            {hero}
            <TechScreenGutter style={styles.headerGutter}>
              {stats ? (
                <Pressable
                  style={styles.earnStrip}
                  onPress={() => appPush(techRoutes.profile)}
                  accessibilityRole="button"
                >
                  <View>
                    <Text style={styles.earnLabel}>Your earnings</Text>
                    <Text style={styles.earnValue}>
                      {stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
                    </Text>
                    {stats.paySummary ? (
                      <Text style={styles.earnHint}>{stats.paySummary}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.earnLink}>Profile</Text>
                </Pressable>
              ) : null}

              <TechPriorityBanner overdueJobs={verifyJob ? [] : overdueJobs} verifyJob={verifyJob} flush />

              {todayStatus !== 'pending' ? (
                <TechJobQuickBar
                  activeJobId={activeJob?.id}
                  verifyJobId={verifyJob?.id}
                  verifyCount={bookings.filter((b) => b.status === 'awaiting_verification').length}
                />
              ) : null}

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
              ) : todayStatus === 'leave' ? (
                <TechOffDutyCard
                  badgeLabel="On leave"
                  hint="Approved leave for today. Contact admin if you need to return early."
                  showAction={false}
                  tone="leave"
                  flush
                />
              ) : todayStatus === 'came' && onDuty ? (
                <TechOnDutyCard
                  badgeLabel={copy.techOnDutyBadge}
                  checkedInAt={todayRecord?.checkedInAt}
                  onCheckOut={confirmCheckOut}
                  onMarkAbsent={confirmMarkOff}
                  loading={checkingIn}
                  flush
                />
              ) : todayStatus === 'came' ? (
                <TechOffDutyCard
                  badgeLabel="Checked out"
                  hint="You were present today. Tap below to go back on duty."
                  backOnDutyLabel={copy.techBackOnDutyButton}
                  onGoOnDuty={() => void checkInToday()}
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
          </View>
        }
        ListEmptyComponent={
          <TechScreenGutter style={techScreenStyles.scrollEmpty}>
            <EmptyState title={copy.techEmptyJobsTitle} message={copy.techEmptyJobsMessage} />
          </TechScreenGutter>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            const isOverdue = item.section.key === 'overdue';
            return (
              <TechScreenGutter style={styles.sectionHeadWrap}>
                <View style={styles.sectionHead}>
                  <LinearGradient
                    colors={isOverdue ? ['#C15B31', '#9E3F1C'] : ['#8FD03C', '#27A747']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sectionAccent}
                  />
                  <Text style={[styles.sectionHeader, isOverdue && styles.sectionHeaderWarn]}>
                    {item.section.title}
                  </Text>
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
                onPress={() => appPush(techRoutes.job(item.booking.id))}
              />
            </TechScreenGutter>
          );
        }}
      />
    </SafeAreaView></View>
  );
}

const styles = StyleSheet.create({
  rootShell: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1, backgroundColor: 'transparent' },
  loadingBody: { flex: 1, justifyContent: 'center' },
  heroShell: { marginBottom: -4 },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1, paddingRight: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.92)',
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  heroSub: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.86)',
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  dutyOn: {
    backgroundColor: 'rgba(143,208,60,0.22)',
    borderColor: 'rgba(200,240,122,0.5)',
  },
  dutyCheckedOut: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  dutyLeave: {
    backgroundColor: 'rgba(59,130,246,0.28)',
    borderColor: 'rgba(147,197,253,0.5)',
  },
  dutyOff: {
    backgroundColor: 'rgba(193,91,49,0.28)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  dutyPending: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  dutyDot: { width: 7, height: 7, borderRadius: 4 },
  dutyDotOn: { backgroundColor: '#C8F07A' },
  dutyDotOff: { backgroundColor: '#FCA5A5' },
  dutyDotLeave: { backgroundColor: '#93C5FD' },
  dutyDotPending: { backgroundColor: 'rgba(255,255,255,0.85)' },
  dutyText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: '#FFFFFF' },
  headerGutter: { marginTop: 14 },
  earnStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    marginBottom: spacing.sm,
    ...homeShadow.card,
  },
  earnLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  earnValue: {
    marginTop: 2,
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  earnHint: { marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  earnLink: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  onDutyCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    marginBottom: spacing.sm,
    ...homeShadow.soft,
  },
  onDutyCompactText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  onDutyCompactLink: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#9E3F1C',
  },
  onDutyCompactDisabled: { opacity: 0.5 },
  sectionHeadWrap: { paddingTop: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    letterSpacing: 0.15,
    color: colors.ink,
  },
  sectionHeaderWarn: { color: '#9E3F1C' },
});
