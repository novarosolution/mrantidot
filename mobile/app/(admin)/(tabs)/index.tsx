import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  LeaderboardCard,
  PendingActionsCard,
  RevenueCard,
  StatusCard,
  TodayScheduleStrip,
  TopServicesCard,
  type PendingAction,
} from '@/components/admin/DashboardBlocks';
import { DateRangePicker, addDaysKey, resolveDateRange, type DateRangeValue } from '@/components/admin/DateRangePicker';
import { formatINRCompact, formatIndianNumber, formatPctDelta } from '@/components/charts/chartFormat';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AdminQuickGrid } from '@/components/kit/AdminPageKit';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminDashboardSkeleton } from '@/components/kit/AdminSkeletons';
import { KpiCard } from '@/components/kit/KpiCard';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { AppIconImages } from '@/constants/appImageIcons';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { stagger } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { DashboardStats } from '@/types/adminLists';

const QUICK_ACTIONS = [
  { key: 'bookings', icon: AppIcons.adminQuick.bookings, image: AppIconImages.adminQuick.bookings, label: 'Bookings' },
  { key: 'services', icon: AppIcons.adminQuick.services, image: AppIconImages.adminQuick.services, label: 'Services' },
  { key: 'content', icon: AppIcons.adminHub.homeContent, image: AppIconImages.adminHub.homeContent, label: 'Content' },
  { key: 'offers', icon: AppIcons.adminHub.offers, image: AppIconImages.adminHub.offers, label: 'Offers' },
];

const QUICK_ROUTES: Record<string, string> = {
  bookings: adminRoutes.bookings,
  services: adminRoutes.services,
  content: adminRoutes.content,
  offers: adminRoutes.offers,
};

/** About ten years back — "every past date" for the overdue shortcut (the bookings list needs both ends). */
const OVERDUE_LOOKBACK_DAYS = 3650;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const wide = useWideWebLayout();
  const [rangeValue, setRangeValue] = useState<DateRangeValue>({ preset: '30d' });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const range = resolveDateRange(rangeValue);

  const load = useCallback(
    async (opts: { skipCache?: boolean } = {}) => {
      const id = ++requestId.current;
      setUpdating(true);
      try {
        const { data } = await api.get<DashboardStats>('/stats/admin', {
          ...screenLoadConfig,
          params: range ? { from: range.from, to: range.to } : undefined,
          ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.stats }),
        });
        if (id !== requestId.current) return;
        setStats(data);
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(getApiErrorMessage(err, 'Could not load dashboard'));
      } finally {
        if (id === requestId.current) setUpdating(false);
      }
    },
    [range?.from, range?.to],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useStaleFocusRefresh(() => load({ skipCache: true }), 3_000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ skipCache: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const firstName = (user?.name?.trim() || 'Admin').split(' ')[0];
  const header = (
    <AdminScreenHeader
      title={`Hi, ${firstName}`}
      subtitle="Today’s command center"
      eyebrow="DASHBOARD"
      userInitial={userInitial(user?.name)}
      unreadCount={unreadCount}
    />
  );

  if (!stats) {
    if (error) {
      return (
        <AdminTabScreen header={header}>
          <ListEmptyRetry message={error} onRetry={() => void load({ skipCache: true })} />
        </AdminTabScreen>
      );
    }
    return (
      <AdminTabScreen header={header} scroll={false}>
        <AdminDashboardSkeleton />
      </AdminTabScreen>
    );
  }

  const { revenue, bookings, people, snapshot, pendingQueue } = stats;
  const from = stats.range.from;
  const to = stats.range.to;
  const pq = pendingQueue.counts;
  const yesterday = addDaysKey(stats.today, -1);

  const actions: PendingAction[] = [
    {
      key: 'pending',
      count: pq.pending,
      label: pq.pending === 1 ? 'booking to confirm' : 'bookings to confirm',
      tone: 'warn',
      onPress: () => appPush(adminRoutes.bookingsFiltered({ status: 'pending' })),
    },
    {
      key: 'unassigned',
      count: pq.unassigned,
      label: pq.unassigned === 1 ? 'open job without a technician' : 'open jobs without a technician',
      tone: 'warn',
      onPress: () => appPush(adminRoutes.bookingsFiltered({ status: 'active', technicianId: 'unassigned' })),
    },
    {
      key: 'overdue',
      count: pq.overdue,
      label: pq.overdue === 1 ? 'visit past its date, not started' : 'visits past their date, not started',
      tone: 'warn',
      onPress: () =>
        appPush(
          adminRoutes.bookingsFiltered({
            status: 'pending,confirmed',
            from: addDaysKey(stats.today, -OVERDUE_LOOKBACK_DAYS),
            to: yesterday,
          }),
        ),
    },
    {
      key: 'verify',
      count: pq.awaitingVerification,
      label: pq.awaitingVerification === 1 ? 'job waiting for the completion code' : 'jobs waiting for the completion code',
      onPress: () => appPush(adminRoutes.bookingsFiltered({ status: 'awaiting_verification' })),
    },
    {
      key: 'leave',
      count: pq.leaveRequests,
      label: pq.leaveRequests === 1 ? 'leave request to decide' : 'leave requests to decide',
      onPress: () => appPush(adminRoutes.leave),
    },
    {
      key: 'reviews',
      count: pq.lowRatings,
      label: pq.lowRatings === 1 ? '1–2★ review in this range' : '1–2★ reviews in this range',
      onPress: () => appPush({ pathname: adminRoutes.reviews, params: { rating: '1,2' } }),
    },
  ];

  const kpis = (
    <View style={styles.grid}>
      <KpiCard
        icon={AppIcons.ui.rupee}
        value={formatINRCompact(revenue.total)}
        label="Revenue · incl. GST"
        delta={formatPctDelta(revenue.delta.total)}
        iconBg={colors.soft}
        iconColor={colors.green}
        onPress={() => appPush(adminRoutes.reports)}
      />
      <KpiCard
        icon={AppIcons.adminKpi.bookings}
        image={AppIconImages.adminKpi.bookings}
        value={formatIndianNumber(bookings.created)}
        label="Bookings made"
        delta={formatPctDelta(bookings.delta)}
        iconBg={colors.soft}
        iconColor={colors.forest}
        onPress={() => appPush({ pathname: adminRoutes.bookings, params: { from, to, dateField: 'created' } })}
      />
      <KpiCard
        icon={AppIcons.adminKpi.customers}
        image={AppIconImages.adminKpi.customers}
        value={formatIndianNumber(people.newCustomers)}
        label="New customers"
        delta={formatPctDelta(people.delta)}
        iconBg={colors.soft}
        iconColor={colors.green}
        onPress={() => appPush(adminRoutes.customers)}
      />
      <KpiCard
        icon={AppIcons.adminKpi.active}
        image={AppIconImages.adminKpi.active}
        value={formatIndianNumber(snapshot.activeJobs)}
        label={snapshot.inProgress ? `Active now · ${snapshot.inProgress} on site` : 'Active jobs now'}
        iconBg={ui.brandSoft}
        iconColor={colors.forest}
        onPress={() => appPush(adminRoutes.bookingsFiltered({ status: 'active' }))}
      />
    </View>
  );

  const pendingCard = (
    <PendingActionsCard
      actions={actions}
      footer={
        pendingQueue.bookings.length > 0 ? (
          <View style={styles.queue}>
            <Text style={styles.queueTitle}>Latest to confirm</Text>
            {pendingQueue.bookings.slice(0, 3).map((b) => (
              <PendingAnalyticsRow key={b.id} booking={b} onPress={() => appPush(adminRoutes.booking(b.id))} />
            ))}
          </View>
        ) : null
      }
    />
  );

  const todayCard = (
    <TodayScheduleStrip
      bookings={stats.todaySchedule}
      onOpen={(id) => appPush(adminRoutes.booking(id))}
      onAll={() => appPush(adminRoutes.bookingsFiltered({ from: stats.today, to: stats.today }))}
    />
  );
  const revenueCard = <RevenueCard stats={stats} onOpen={() => appPush(adminRoutes.reports)} />;
  const statusCard = (
    <StatusCard
      stats={stats}
      onStatusPress={(status) => appPush({ pathname: adminRoutes.bookings, params: { status, from, to, dateField: 'created' } })}
    />
  );
  const servicesCard = (
    <TopServicesCard
      stats={stats}
      onServicePress={(serviceId) =>
        appPush({ pathname: adminRoutes.bookings, params: { serviceId, status: 'completed', from, to, dateField: 'completed' } })
      }
    />
  );
  const leaderCard = (
    <LeaderboardCard
      stats={stats}
      onTechPress={(id) => appPush(adminRoutes.technician(id))}
      actionLabel="Team"
      onAction={() => appPush(adminRoutes.technicians)}
    />
  );

  return (
    <AdminTabScreen
      header={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.green} />}
    >
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <View style={styles.rangeWrap}>
          <DateRangePicker value={rangeValue} onChange={(v) => setRangeValue(v)} inset />
          {updating ? (
            <View style={styles.updating}>
              <Spinner />
              <Text style={styles.updatingText}>Updating…</Text>
            </View>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        {kpis}
        <Text style={styles.compare}>
          Change vs the previous {stats.range.days} {stats.range.days === 1 ? 'day' : 'days'} · active jobs are a live count
        </Text>
      </FadeSlideIn>

      {wide ? (
        <>
          <FadeSlideIn delay={stagger(2)} slideFrom={14}>
            <View style={styles.row}>
              <View style={styles.col2}>{revenueCard}</View>
              <View style={styles.col1}>{pendingCard}</View>
            </View>
          </FadeSlideIn>
          <FadeSlideIn delay={stagger(3)} slideFrom={14}>
            <View style={styles.row}>
              <View style={styles.col1}>{statusCard}</View>
              <View style={styles.col1}>{servicesCard}</View>
              <View style={styles.col1}>{leaderCard}</View>
            </View>
          </FadeSlideIn>
          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
            <View style={styles.block}>{todayCard}</View>
          </FadeSlideIn>
        </>
      ) : (
        <>
          <FadeSlideIn delay={stagger(2)} slideFrom={14}>
            <View style={styles.block}>{pendingCard}</View>
          </FadeSlideIn>
          <FadeSlideIn delay={stagger(3)} slideFrom={14}>
            <View style={styles.block}>{todayCard}</View>
          </FadeSlideIn>
          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
            <View style={styles.block}>{revenueCard}</View>
          </FadeSlideIn>
          <View style={styles.block}>{statusCard}</View>
          <View style={styles.block}>{servicesCard}</View>
          <View style={styles.block}>{leaderCard}</View>
          <AdminSectionTitle title="Quick actions" hint="Jump straight into daily operations" />
          <AdminQuickGrid items={QUICK_ACTIONS} onPress={(key) => QUICK_ROUTES[key] && appPush(QUICK_ROUTES[key])} />
        </>
      )}
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  rangeWrap: { marginTop: spacing.sm },
  updating: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, marginTop: -2 },
  updatingText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.error, paddingHorizontal: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  compare: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: ui.textTertiary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  block: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md, paddingHorizontal: spacing.md, marginTop: spacing.md },
  col1: { flex: 1, minWidth: 0 },
  col2: { flex: 2, minWidth: 0 },
  queue: { marginTop: spacing.sm, gap: spacing.sm },
  queueTitle: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary, marginTop: spacing.xs },
});
