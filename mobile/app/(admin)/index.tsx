import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, FileText, Gift, LayoutGrid, Truck, UserPlus, Users, Wrench } from 'lucide-react-native';
import { AdminBookingRow } from '@/components/kit/AdminBookingRow';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { KpiCard } from '@/components/kit/KpiCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type { AdminStats, BookingStatus } from '@/types/api';
import { colors, design, fonts, premium, spacing } from '@/constants/theme';

const QUICK_ACTIONS = [
  { icon: LayoutGrid, label: 'Bookings', href: '/(admin)/bookings' as const },
  { icon: Wrench, label: 'Add service', href: '/(admin)/service-edit' as const },
  { icon: UserPlus, label: 'Add tech', href: { pathname: '/(admin)/user-edit' as const, params: { role: 'technician' } } },
  { icon: Gift, label: 'Offers', href: '/(admin)/offers' as const },
  { icon: FileText, label: 'Content', href: '/(admin)/content' as const },
  { icon: Users, label: 'Team', href: '/(admin)/team' as const },
];

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

  if (loading && !stats) return <Spinner fullScreen />;

  if (error && !stats) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <AdminScreenHeader
          title={`Hi, ${(user?.name?.trim() || 'Admin').split(' ')[0]}`}
          subtitle="Owner · Mr Antidot"
          userInitial={initial}
          unreadCount={unreadCount}
        />
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </SafeAreaView>
    );
  }

  if (!stats) return <Spinner fullScreen />;

  const activeJobs =
    (stats.byStatus.in_progress ?? 0) + (stats.byStatus.pending ?? 0) + (stats.byStatus.confirmed ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
      >
        <AdminScreenHeader
          title={`Hi, ${(user?.name?.trim() || 'Admin').split(' ')[0]}`}
          subtitle="Owner · Mr Antidot"
          userInitial={initial}
          unreadCount={unreadCount}
        />
        <UserAccountCard compact onPress={() => router.push('/(admin)/settings')} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickRow}>
          {QUICK_ACTIONS.map((q) => (
            <Pressable key={q.label} style={styles.quick} onPress={() => router.push(q.href)}>
              <q.icon size={15} color={colors.green} />
              <Text style={styles.quickText}>{q.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          <KpiCard
            icon={Clock}
            value={String(stats.byStatus.pending ?? 0)}
            label="Pending"
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => router.push('/(admin)/bookings?status=pending')}
          />
          <KpiCard
            icon={Calendar}
            value={String(stats.periodBookings ?? stats.totalBookings)}
            label="Bookings"
            delta={stats.deltas?.bookings}
            iconBg={colors.blueBg}
            iconColor={colors.blue}
            onPress={() => router.push('/(admin)/bookings')}
          />
          <KpiCard
            icon={Truck}
            value={String(activeJobs)}
            label="Active Jobs"
            delta={stats.deltas?.activeJobs}
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => router.push('/(admin)/bookings?status=active')}
          />
          <KpiCard
            icon={Users}
            value={String(stats.customers)}
            label="Customers"
            delta={stats.deltas?.customers}
            iconBg={colors.soft}
            iconColor={colors.green}
            onPress={() => router.push('/(admin)/customers')}
          />
        </View>

        {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusStrip}
          >
            {stats.statusBreakdown.map((item) => (
              <Chip
                key={item.status}
                label={`${bookingStatusLabel(item.status as BookingStatus)} ${item.count}`}
                selected={false}
                onPress={() => router.push(`/(admin)/bookings?status=${item.status}`)}
              />
            ))}
          </ScrollView>
        ) : null}

        {(stats.pendingBookings?.length ?? 0) > 0 ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>Pending schedule queue</Text>
              <Pressable onPress={() => router.push('/(admin)/bookings?status=pending')}>
                <Text style={styles.link}>View all</Text>
              </Pressable>
            </View>
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

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recent Bookings</Text>
          <Pressable onPress={() => router.push('/(admin)/bookings')}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>

        {stats.recentBookings.length === 0 ? (
          <View style={styles.bookingWrap}>
            <EmptyState title="No bookings yet" message="New bookings will appear here." />
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
  content: { paddingBottom: spacing.xl },
  quickScroll: { marginTop: spacing.sm },
  quickRow: { paddingHorizontal: spacing.md, gap: 8 },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  quickText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: spacing.md,
    marginTop: -4,
  },
  statusStrip: { paddingHorizontal: spacing.md, gap: 8, paddingBottom: spacing.sm },
  kpiWrap: { width: '47%' },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  section: { ...design.sectionTitle },
  link: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.secondaryDark },
  bookingWrap: { paddingHorizontal: spacing.md },
});
