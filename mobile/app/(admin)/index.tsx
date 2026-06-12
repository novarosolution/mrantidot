import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminBookingRow } from '@/components/kit/AdminBookingRow';
import { AdminFilterChips, AdminQuickGrid } from '@/components/kit/AdminPageKit';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { KpiCard } from '@/components/kit/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type { AdminStats, BookingStatus } from '@/types/api';
import { colors, design, spacing } from '@/constants/theme';

const QUICK_ACTIONS = [
  { key: 'bookings', icon: AppIcons.adminQuick.bookings, label: 'Bookings' },
  { key: 'services', icon: AppIcons.adminQuick.services, label: 'Services' },
  { key: 'tech', icon: AppIcons.adminQuick.addTech, label: 'Add tech' },
  { key: 'offers', icon: AppIcons.adminQuick.offers, label: 'Offers' },
  { key: 'content', icon: AppIcons.adminQuick.content, label: 'Content' },
  { key: 'team', icon: AppIcons.adminQuick.team, label: 'Team' },
];

function quickRoute(key: string) {
  switch (key) {
    case 'bookings':
      return router.push('/(admin)/bookings');
    case 'services':
      return router.push('/(admin)/services');
    case 'tech':
      return router.push({ pathname: '/(admin)/user-edit', params: { role: 'technician' } });
    case 'offers':
      return router.push('/(admin)/offers');
    case 'content':
      return router.push('/(admin)/content');
    case 'team':
      return router.push('/(admin)/team');
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
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <AdminScreenHeader title={`Hi, ${firstName}`} subtitle="Dashboard" userInitial={initial} unreadCount={unreadCount} />
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </SafeAreaView>
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
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        <AdminScreenHeader
          title={`Hi, ${firstName}`}
          subtitle="Dashboard"
          userInitial={initial}
          unreadCount={unreadCount}
        />

        <AdminSectionTitle title="Quick actions" hint="Jump to common admin tasks" />
        <AdminQuickGrid items={QUICK_ACTIONS} onPress={quickRoute} />

        <AdminSectionTitle title="Overview" hint="Tap a card to drill into bookings or customers" />
        <View style={styles.grid}>
          <KpiCard
            icon={AppIcons.adminKpi.pending}
            value={String(stats.byStatus.pending ?? 0)}
            label="Pending"
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => router.push('/(admin)/bookings?status=pending')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.bookings}
            value={String(stats.periodBookings ?? stats.totalBookings)}
            label="Bookings"
            delta={stats.deltas?.bookings}
            iconBg={colors.blueBg}
            iconColor={colors.blue}
            onPress={() => router.push('/(admin)/bookings')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.active}
            value={String(activeJobs)}
            label="Active"
            delta={stats.deltas?.activeJobs}
            iconBg={colors.secondarySoft}
            iconColor={colors.secondaryDark}
            onPress={() => router.push('/(admin)/bookings?status=active')}
          />
          <KpiCard
            icon={AppIcons.adminKpi.customers}
            value={String(stats.customers)}
            label="Customers"
            delta={stats.deltas?.customers}
            iconBg={colors.soft}
            iconColor={colors.green}
            onPress={() => router.push('/(admin)/customers')}
          />
        </View>

        {statusChips.length > 0 ? (
          <View style={styles.statusWrap}>
            <AdminFilterChips
              chips={statusChips}
              selected=""
              onSelect={(key) => router.push(`/(admin)/bookings?status=${key}`)}
            />
          </View>
        ) : null}

        {(stats.pendingBookings?.length ?? 0) > 0 ? (
          <>
            <AdminSectionTitle
              title="Pending queue"
              hint="Needs your attention"
              actionLabel="All"
              onAction={() => router.push('/(admin)/bookings?status=pending')}
            />
            <View style={styles.bookingWrap}>
              {stats.pendingBookings!.slice(0, 5).map((b) => (
                <PendingAnalyticsRow
                  key={b.id}
                  booking={b}
                  onPress={() => router.push(`/(admin)/booking/${b.id}`)}
                />
              ))}
            </View>
          </>
        ) : null}

        <AdminSectionTitle title="Recent" hint="Latest bookings across all statuses" actionLabel="All" onAction={() => router.push('/(admin)/bookings')} />

        {stats.recentBookings.length === 0 ? (
          <View style={styles.bookingWrap}>
            <EmptyState title="No bookings yet" message="New bookings appear here." />
          </View>
        ) : (
          stats.recentBookings.slice(0, 3).map((b) => (
            <View key={b.id} style={styles.bookingWrap}>
              <AdminBookingRow booking={b} onPress={() => router.push(`/(admin)/booking/${b.id}`)} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  statusWrap: { marginTop: spacing.sm, marginBottom: spacing.xs },
  bookingWrap: { paddingHorizontal: spacing.md },
});
