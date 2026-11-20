import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AdminBookingRow } from '@/components/kit/AdminBookingRow';
import { AdminFilterChips, AdminQuickGrid } from '@/components/kit/AdminPageKit';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { KpiCard } from '@/components/kit/KpiCard';
import { AdminDashboardSkeleton } from '@/components/kit/AdminSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { AppIcons } from '@/constants/appIcons';
import { AppIconImages } from '@/constants/appImageIcons';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import { stagger } from '@/lib/motion';
import type { AdminStats, BookingStatus } from '@/types/api';
import { colors, spacing, ui } from '@/constants/theme';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

const QUICK_ACTIONS = [
  { key: 'bookings', icon: AppIcons.adminQuick.bookings, image: AppIconImages.adminQuick.bookings, label: 'Bookings' },
  { key: 'services', icon: AppIcons.adminQuick.services, image: AppIconImages.adminQuick.services, label: 'Services' },
  { key: 'content', icon: AppIcons.adminHub.homeContent, image: AppIconImages.adminHub.homeContent, label: 'Content' },
  { key: 'offers', icon: AppIcons.adminHub.offers, image: AppIconImages.adminHub.offers, label: 'Offers' },
];

function quickRoute(key: string) {
  switch (key) {
    case 'bookings':
      return appPush(adminRoutes.bookings);
    case 'services':
      return appPush(adminRoutes.services);
    case 'tech':
      return appPush({
        pathname: adminRoutes.userEdit,
        params: { role: 'technician', returnTo: adminRoutes.home },
      });
    case 'offers':
      return appPush(adminRoutes.offers);
    case 'content':
      return appPush(adminRoutes.content);
    case 'team':
      return appPush(adminRoutes.team);
    default:
      break;
  }
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { loading, error, refreshing, runLoad, refresh, reload } = useScreenLoad();

  const { unreadCount } = useUnreadNotifications();

  const load = useCallback(async () => {
    const { data } = await api.get<AdminStats>('/stats/admin', {
      ...screenLoadConfig,
      params: { period: 'month' },
    });
    setStats(data);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load dashboard');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

  const initial = userInitial(user?.name);
  const firstName = (user?.name?.trim() || 'Admin').split(' ')[0];

  const header = (
    <AdminScreenHeader
      title={`Hi, ${firstName}`}
      subtitle="Today’s command center"
      eyebrow="DASHBOARD"
      userInitial={initial}
      unreadCount={unreadCount}
    />
  );

  if (!stats) {
    if (error && !loading) {
      return (
        <AdminTabScreen header={header}>
          <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
        </AdminTabScreen>
      );
    }
    return (
      <AdminTabScreen header={header} scroll={false}>
        <AdminDashboardSkeleton />
      </AdminTabScreen>
    );
  }

  const activeJobs =
    (stats.byStatus.in_progress ?? 0) + (stats.byStatus.pending ?? 0) + (stats.byStatus.confirmed ?? 0);

  const statusChips =
    stats.statusBreakdown?.map((item) => ({
      key: item.status,
      label: `${bookingStatusLabel(item.status as BookingStatus)} ${item.count}`,
    })) ?? [];

  const pending = stats.pendingBookings ?? [];
  const recent = stats.recentBookings.slice(0, 3);

  return (
    <AdminTabScreen
      header={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
    >
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <AdminSectionTitle title="Quick actions" hint="Jump straight into daily operations" />
      </FadeSlideIn>
      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        <AdminQuickGrid items={QUICK_ACTIONS} onPress={quickRoute} />
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(2)} slideFrom={14}>
        <AdminSectionTitle title="Overview" hint="This month at a glance" />
      </FadeSlideIn>
      <FadeSlideIn delay={stagger(3)} slideFrom={14}>
        <View style={styles.grid}>
          <KpiCard
            icon={AppIcons.adminKpi.pending}
            image={AppIconImages.adminKpi.pending}
            value={String(stats.byStatus.pending ?? 0)}
            label="Pending"
            iconBg={colors.mint}
            iconColor={colors.forest}
            onPress={() => appPush(adminRoutes.bookingsFiltered({ status: 'pending' }))}
          />
          <KpiCard
            icon={AppIcons.adminKpi.bookings}
            image={AppIconImages.adminKpi.bookings}
            value={String(stats.periodBookings ?? stats.totalBookings)}
            label="Bookings"
            delta={stats.deltas?.bookings}
            iconBg={colors.soft}
            iconColor={colors.forest}
            onPress={() => appPush(adminRoutes.bookings)}
          />
          <KpiCard
            icon={AppIcons.adminKpi.active}
            image={AppIconImages.adminKpi.active}
            value={String(activeJobs)}
            label="Active jobs"
            delta={stats.deltas?.activeJobs}
            iconBg={ui.brandSoft}
            iconColor={colors.forest}
            onPress={() => appPush(adminRoutes.bookingsFiltered({ status: 'active' }))}
          />
          <KpiCard
            icon={AppIcons.adminKpi.customers}
            image={AppIconImages.adminKpi.customers}
            value={String(stats.customers)}
            label="Customers"
            delta={stats.deltas?.customers}
            iconBg={colors.soft}
            iconColor={colors.green}
            onPress={() => appPush(adminRoutes.customers)}
          />
        </View>
      </FadeSlideIn>

      {statusChips.length > 0 ? (
        <FadeSlideIn delay={stagger(4)} slideFrom={14}>
          <View style={styles.statusWrap}>
            <AdminFilterChips
              chips={statusChips}
              selected=""
              onSelect={(key) => appPush(adminRoutes.bookingsFiltered({ status: key }))}
            />
          </View>
        </FadeSlideIn>
      ) : null}

      {pending.length > 0 ? (
        <FadeSlideIn delay={stagger(5)} slideFrom={14}>
          <AdminSectionTitle
            title="Pending queue"
            hint="Needs your attention"
            actionLabel="All"
            onAction={() => appPush(adminRoutes.bookingsFiltered({ status: 'pending' }))}
          />
          <View style={[styles.bookingWrap, styles.afterTitle]}>
            {pending.slice(0, 5).map((b) => (
              <PendingAnalyticsRow key={b.id} booking={b} onPress={() => appPush(adminRoutes.booking(b.id))} />
            ))}
          </View>
        </FadeSlideIn>
      ) : null}

      <FadeSlideIn delay={stagger(6)} slideFrom={14}>
        <AdminSectionTitle title="Recent" hint="Latest bookings across all statuses" actionLabel="All" onAction={() => appPush(adminRoutes.bookings)} />
        {recent.length === 0 ? (
          <View style={[styles.bookingWrap, styles.afterTitle]}>
            <EmptyState title="No bookings yet" message="New bookings appear here." />
          </View>
        ) : (
          <View style={[styles.bookingWrap, styles.afterTitle, styles.recentList]}>
            {recent.map((b) => (
              <AdminBookingRow key={b.id} booking={b} onPress={() => appPush(adminRoutes.booking(b.id))} />
            ))}
          </View>
        )}
      </FadeSlideIn>
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  statusWrap: { marginTop: spacing.sm, marginBottom: spacing.xs, paddingHorizontal: spacing.md },
  bookingWrap: { paddingHorizontal: spacing.md },
  /** Section title + rows share one entrance wrapper; restore the screen's 8pt gap between them. */
  afterTitle: { marginTop: spacing.sm },
  recentList: { gap: spacing.sm },
});
