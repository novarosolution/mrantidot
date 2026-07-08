import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AdminBookingRow } from '@/components/kit/AdminBookingRow';
import { AdminFilterChips, AdminQuickGrid } from '@/components/kit/AdminPageKit';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { KpiCard } from '@/components/kit/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type { AdminStats, BookingStatus } from '@/types/api';
import { colors, spacing } from '@/constants/theme';

const QUICK_ACTIONS = [
  { key: 'bookings', icon: AppIcons.adminQuick.bookings, label: 'Bookings' },
  { key: 'services', icon: AppIcons.adminQuick.services, label: 'Services' },
  { key: 'tech', icon: AppIcons.adminQuick.addTech, label: 'Add tech' },
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

  const initial = userInitial(user?.name);
  const firstName = (user?.name?.trim() || 'Admin').split(' ')[0];

  if (loading && !stats) return <Spinner fullScreen />;

  if (error && !stats) {
    return (
      <AdminTabScreen
        header={
          <AdminScreenHeader title={`Hi, ${firstName}`} subtitle="Dashboard" userInitial={initial} unreadCount={unreadCount} />
        }
      >
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminTabScreen>
    );
  }

  if (!stats) return <Spinner fullScreen />;

  const activeJobs =
    (stats.byStatus.in_progress ?? 0) + (stats.byStatus.pending ?? 0) + (stats.byStatus.confirmed ?? 0);

  const statusChips =
    stats.statusBreakdown?.map((item) => ({
      key: item.status,
      label: `${bookingStatusLabel(item.status as BookingStatus)} ${item.count}`,
    })) ?? [];

  return (
    <AdminTabScreen
      header={
        <AdminScreenHeader
          title={`Hi, ${firstName}`}
          subtitle="Dashboard"
          userInitial={initial}
          unreadCount={unreadCount}
        />
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
    >
        <AdminSectionTitle title="Quick actions" hint="Common tasks · see Manage tab for more" />
        <AdminQuickGrid items={QUICK_ACTIONS} onPress={quickRoute} />

        <AdminSectionTitle title="Overview" hint="Tap a card to drill into bookings or customers" />
        <View style={styles.grid}>
          <KpiCard
            icon={AppIcons.adminKpi.pending}
            value={String(stats.byStatus.pending ?? 0)}
            label="Pending"
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => appPush('/(admin)/bookings?status=pending')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.bookings}
            value={String(stats.periodBookings ?? stats.totalBookings)}
            label="Bookings"
            delta={stats.deltas?.bookings}
            iconBg={colors.blueBg}
            iconColor={colors.blue}
            onPress={() => appPush('/(admin)/bookings')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.active}
            value={String(activeJobs)}
            label="Active"
            delta={stats.deltas?.activeJobs}
            iconBg={colors.secondarySoft}
            iconColor={colors.secondaryDark}
            onPress={() => appPush('/(admin)/bookings?status=active')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.customers}
            value={String(stats.customers)}
            label="Customers"
            delta={stats.deltas?.customers}
            iconBg={colors.soft}
            iconColor={colors.green}
            onPress={() => appPush('/(admin)/customers')}
          />
        </View>

        {statusChips.length > 0 ? (
          <View style={styles.statusWrap}>
            <AdminFilterChips
              chips={statusChips}
              selected=""
              onSelect={(key) => appPush(`/(admin)/bookings?status=${key}`)}
            />
          </View>
        ) : null}

        {(stats.pendingBookings?.length ?? 0) > 0 ? (
          <>
            <AdminSectionTitle
              title="Pending queue"
              hint="Needs your attention"
              actionLabel="All"
              onAction={() => appPush('/(admin)/bookings?status=pending')}
            />
            <View style={styles.bookingWrap}>
              {stats.pendingBookings!.slice(0, 5).map((b) => (
                <PendingAnalyticsRow
                  key={b.id}
                  booking={b}
                  onPress={() => appPush(`/(admin)/booking/${b.id}`)}
                />
              ))}
            </View>
          </>
        ) : null}

        <AdminSectionTitle title="Recent" hint="Latest bookings across all statuses" actionLabel="All" onAction={() => appPush('/(admin)/bookings')} />

        {stats.recentBookings.length === 0 ? (
          <View style={styles.bookingWrap}>
            <EmptyState title="No bookings yet" message="New bookings appear here." />
          </View>
        ) : (
          stats.recentBookings.slice(0, 3).map((b) => (
            <View key={b.id} style={styles.bookingWrap}>
              <AdminBookingRow booking={b} onPress={() => appPush(`/(admin)/booking/${b.id}`)} />
            </View>
          ))
        )}
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
  statusWrap: { marginTop: spacing.sm, marginBottom: spacing.xs },
  bookingWrap: { paddingHorizontal: spacing.md },
});
