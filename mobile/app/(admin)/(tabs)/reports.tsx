import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { StatusPipelineCard } from '@/components/kit/StatusPipelineCard';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AnalyticsStatGrid } from '@/components/kit/AnalyticsStatGrid';
import { formatRupee } from '@/components/kit/format';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { KpiCard } from '@/components/kit/KpiCard';
import { RevenueBarChart } from '@/components/kit/RevenueBarChart';
import {
  BookingsTrendChart,
  ReportsInsightGrid,
  ReportsRankList,
  ReportsSectionCard,
  ReportsTeamCard,
} from '@/components/kit/ReportsPageKit';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { appPush, adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import type { AdminStats, TeamAttendanceStats } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

const PERIODS = ['Week', 'Month', 'Quarter', 'Year'];

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendanceStats | null>(null);
  const [period, setPeriod] = useState('Month');
  const { loading, error, refreshing, runLoad, refresh, reload } = useScreenLoad();

  const load = useCallback(async () => {
    const periodKey = period.toLowerCase();
    const [statsRes, teamRes] = await Promise.all([
      api.get<AdminStats>('/stats/admin', { ...screenLoadConfig, params: { period: periodKey } }),
      api.get<TeamAttendanceStats>('/stats/admin/team-attendance', {
        ...screenLoadConfig,
        params: { period: periodKey },
      }),
    ]);
    setStats(statsRes.data);
    setTeamAttendance(teamRes.data);
  }, [period]);

  useEffect(() => {
    void runLoad(load, 'Could not load reports');
  }, [load, runLoad]);

  async function exportReport() {
    if (!stats) return;
    const a = stats.analytics;
    const avgOrder = a?.performance.avgOrderValue ?? Math.round(stats.revenueCompleted / Math.max(1, stats.totalBookings));
    const lines = [
      `Mr Antidot — ${period} analytics report`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      '— Revenue & bookings —',
      `Revenue (${period}): ${formatRupee(stats.periodRevenue ?? stats.revenueCompleted)}`,
      `Bookings (${period}): ${stats.periodBookings ?? stats.totalBookings}`,
      `Completion rate: ${a?.performance.completionRate ?? 0}%`,
      `Cancellation rate: ${a?.performance.cancellationRate ?? 0}%`,
      `Avg order value: ₹${avgOrder}`,
      '',
      '— People —',
      `Customers: ${stats.customers}`,
      `Technicians: ${stats.technicians}`,
      `Pending (${period}): ${stats.periodPending ?? 0}`,
      '',
      '— Reviews & offers —',
      `Reviews: ${a?.reviews.total ?? 0} (avg ${a?.reviews.averageRating ?? 0}★)`,
      `Active offers: ${a?.offers.active ?? 0}/${a?.offers.total ?? 0}`,
      `Coupon bookings (${period}): ${a?.performance.couponBookings ?? 0}`,
      '',
      'Booking pipeline:',
      ...(stats.statusBreakdown ?? []).map(
        (s) => `  ${s.status}: ${s.count} total, ${s.periodCount} this period`,
      ),
      '',
      'Top services:',
      ...stats.topServices.map((s, i) => `  ${i + 1}. ${s.name} — ${s.count} bookings`),
      '',
      'Top technicians:',
      ...(a?.topTechnicians ?? []).map((t, i) => `  ${i + 1}. ${t.name} — ${t.jobs} jobs, ${formatRupee(t.revenue)}`),
    ];
    try {
      await Share.share({ message: lines.join('\n'), title: `Mr Antidot report (${period})` });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not share report' });
    }
  }

  const analyticsGrid = useMemo(() => {
    if (!stats) return [];
    const a = stats.analytics;
    return [
      {
        key: 'bookings',
        label: `Bookings (${period})`,
        value: String(stats.periodBookings ?? 0),
        icon: AppIcons.ui.calendarCheck,
        iconBg: colors.soft,
        iconColor: colors.forest,
        onPress: () => appPush(adminRoutes.bookings),
      },
      {
        key: 'customers',
        label: 'Customers',
        value: String(stats.customers),
        icon: AppIcons.adminKpi.customers,
        iconBg: colors.soft,
        iconColor: colors.green,
        onPress: () => appPush(adminRoutes.customers),
      },
      {
        key: 'techs',
        label: 'Technicians',
        value: String(stats.technicians),
        icon: AppIcons.adminQuick.addTech,
        iconBg: colors.soft,
        iconColor: colors.forest,
        onPress: () => appPush(adminRoutes.technicians),
      },
      {
        key: 'reviews',
        label: 'Avg rating',
        value: a ? `${a.reviews.averageRating}★` : '—',
        icon: AppIcons.ui.star,
        iconBg: colors.soft,
        iconColor: colors.forest,
        onPress: () => appPush(adminRoutes.reviews),
      },
      {
        key: 'completion',
        label: 'Completion',
        value: a ? `${a.performance.completionRate}%` : '—',
        icon: AppIcons.trust.verified,
        iconBg: colors.soft,
        iconColor: colors.forest,
      },
      {
        key: 'offers',
        label: 'Active offers',
        value: a ? `${a.offers.active}` : '—',
        icon: AppIcons.ui.percent,
        iconBg: colors.soft,
        iconColor: colors.forest,
        onPress: () => appPush(adminRoutes.offers),
      },
    ];
  }, [stats, period]);

  const initial = userInitial(user?.name);
  const header = (
    <AdminScreenHeader
      title="Analytics"
      subtitle={`${period} · revenue, pipeline & team`}
      eyebrow="INSIGHTS"
      userInitial={initial}
      unreadCount={unreadCount}
    />
  );

  if (loading && !stats) return <Spinner fullScreen />;

  if (error && !stats) {
    return (
      <AdminTabScreen header={header}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminTabScreen>
    );
  }

  if (!stats) return <Spinner fullScreen />;

  const a = stats.analytics;
  const months = stats.revenueByMonth ?? [];
  const avgOrder = a?.performance.avgOrderValue ?? Math.round(stats.revenueCompleted / Math.max(1, stats.totalBookings));
  const paymentTotal = (a?.paymentSplit.upi_card ?? 0) + (a?.paymentSplit.pay_after ?? 0);

  return (
    <AdminTabScreen
      header={header}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
      }
    >
      <View style={styles.periodWrap}>
        <GlassPanel padded={false} intensity={42} style={styles.periodGlass}>
          <View style={styles.periodInner}>
            <View style={styles.periodHead}>
              <View style={styles.periodText}>
                <Text style={styles.periodEyebrow}>PERIOD</Text>
                <Text style={styles.periodTitle}>Compare performance</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
                onPress={() => void exportReport()}
                accessibilityRole="button"
                accessibilityLabel="Export report"
              >
                <PremiumIcon icon={AppIcons.ui.download} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
              </Pressable>
            </View>
            <AdminFilterChips
              chips={PERIODS.map((p) => ({ key: p, label: p }))}
              selected={period}
              onSelect={(p) => !loading && setPeriod(p)}
            />
          </View>
        </GlassPanel>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <Spinner />
          <Text style={styles.loadingText}>Updating {period.toLowerCase()} data…</Text>
        </View>
      ) : null}

      <AdminSectionTitle title="Key metrics" hint={`${period} snapshot`} />
      <View style={styles.grid}>
        <KpiCard
          icon={AppIcons.ui.rupee}
          value={formatRupee(stats.periodRevenue ?? stats.revenueCompleted)}
          label={`Revenue (${period})`}
          delta={stats.deltas?.revenue}
          iconBg={colors.soft}
          iconColor={colors.green}
          glass
        />
        <KpiCard
          icon={AppIcons.ui.calendarCheck}
          value={String(stats.periodBookings ?? 0)}
          label={`Bookings (${period})`}
          delta={stats.deltas?.bookings}
          iconBg={colors.soft}
          iconColor={colors.forest}
          onPress={() => appPush(adminRoutes.bookings)}
          glass
        />
        <KpiCard
          icon={AppIcons.ui.pay}
          value={`₹${avgOrder}`}
          label="Avg order"
          iconBg={colors.soft}
          iconColor={colors.forest}
          glass
        />
        <KpiCard
          icon={AppIcons.adminKpi.pending}
          value={String(stats.periodPending ?? stats.byStatus.pending ?? 0)}
          label={`Pending (${period})`}
          delta={stats.deltas?.pending}
          iconBg={colors.soft}
          iconColor={colors.forest}
          onPress={() => appPush(adminRoutes.bookingsFiltered({ status: 'pending' }))}
          glass
        />
      </View>

      {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
        <ReportsSectionCard
          title="Booking pipeline"
          hint={`All-time totals · +N = new in ${period.toLowerCase()}`}
          actionLabel="View all"
          onAction={() => appPush(adminRoutes.bookings)}
          glass
        >
          <StatusPipelineCard
            hideTitle
            flush
            items={stats.statusBreakdown}
            periodLabel={`New bookings in ${period.toLowerCase()} shown per status`}
            onStatusPress={(status) => appPush(adminRoutes.bookingsFiltered({ status: status }))}
          />
        </ReportsSectionCard>
      ) : null}

      <ReportsSectionCard title="Revenue" hint="Completed job revenue — last 7 months" glass>
        <View style={styles.chartFlush}>
          <RevenueBarChart title="Monthly revenue" data={months} flush />
        </View>
      </ReportsSectionCard>

      {a?.bookingsTrend && a.bookingsTrend.length > 0 ? (
        <ReportsSectionCard title="Daily bookings" hint="New bookings created each day" glass>
          <BookingsTrendChart data={a.bookingsTrend} flush />
        </ReportsSectionCard>
      ) : null}

      {teamAttendance ? (
        <ReportsSectionCard
          title="Team attendance"
          hint={`Field team performance · ${period.toLowerCase()}`}
          actionLabel="Team"
          onAction={() => appPush(adminRoutes.technicians)}
          glass
        >
          <ReportsTeamCard
            checkedInToday={teamAttendance.checkedInToday}
            totalTechnicians={teamAttendance.totalTechnicians}
            averageRate={teamAttendance.averageAttendanceRate}
            lowAttendance={teamAttendance.lowAttendance}
            onTechPress={(id) => appPush(adminRoutes.technician(id))}
            flush
          />
        </ReportsSectionCard>
      ) : null}

      {a && a.topTechnicians.length > 0 ? (
        <ReportsSectionCard title="Top technicians" hint={`Completed jobs in ${period.toLowerCase()}`} glass>
          <ReportsRankList
            flush
            items={a.topTechnicians.map((t) => ({
              key: t.id,
              title: t.name,
              subtitle: `${t.jobs} jobs · ${formatRupee(t.revenue)}`,
              value: t.jobs,
              onPress: () => appPush(adminRoutes.technician(t.id)),
            }))}
          />
        </ReportsSectionCard>
      ) : null}

      <ReportsSectionCard
        title="Top services"
        hint={`Most booked in ${period.toLowerCase()}`}
        actionLabel="Catalog"
        onAction={() => appPush(adminRoutes.services)}
        glass
      >
        <ReportsRankList
          flush
          items={stats.topServices.map((s) => ({
            key: String(s.serviceId),
            title: s.name,
            subtitle: `${s.count} bookings`,
            value: s.count,
            onPress: () => appPush(adminRoutes.bookingsFiltered({ serviceId: s.serviceId })),
          }))}
          emptyMessage="No bookings in this period yet."
        />
      </ReportsSectionCard>

      {a && a.topCustomers.length > 0 ? (
        <ReportsSectionCard title="Top customers" hint={`Highest spend in ${period.toLowerCase()}`} glass>
          <ReportsRankList
            flush
            items={a.topCustomers.map((c) => ({
              key: c.id,
              title: c.name,
              subtitle: `${c.bookings} bookings · ${formatRupee(c.spend)}`,
              value: c.spend,
              onPress: () => appPush(adminRoutes.customer(c.id)),
            }))}
          />
        </ReportsSectionCard>
      ) : null}

      <ReportsSectionCard title="Quick links" hint="Jump into people, catalog & reviews" glass>
        <AnalyticsStatGrid items={analyticsGrid} glass />
      </ReportsSectionCard>

      {a ? (
        <ReportsSectionCard title="Reviews, offers & payments" hint="Satisfaction, offers & how customers pay" glass>
          <ReportsInsightGrid
            glass
            items={[
              {
                key: 'reviews',
                label: 'Total reviews',
                value: String(a.reviews.total),
                hint: `${a.reviews.periodCount} new this period`,
              },
              {
                key: 'rating',
                label: 'Average rating',
                value: `${a.reviews.averageRating}★`,
                accent: colors.forest,
              },
              {
                key: 'offers',
                label: 'Active offers',
                value: `${a.offers.active}/${a.offers.total}`,
                hint: `${a.offers.totalRedemptions} total redemptions`,
              },
              {
                key: 'services',
                label: 'Active services',
                value: `${a.catalog.activeServices}/${a.catalog.totalServices}`,
              },
              {
                key: 'coupons',
                label: 'Coupon bookings',
                value: String(a.performance.couponBookings),
                hint: `In ${period.toLowerCase()}`,
              },
              {
                key: 'cancel',
                label: 'Cancellation rate',
                value: `${a.performance.cancellationRate}%`,
                accent: a.performance.cancellationRate > 10 ? '#C15B31' : colors.forest,
              },
              {
                key: 'upi',
                label: 'Pay now (UPI/card)',
                value: paymentTotal > 0 ? `${Math.round((a.paymentSplit.upi_card / paymentTotal) * 100)}%` : '—',
                hint: `${a.paymentSplit.upi_card} bookings`,
              },
              {
                key: 'later',
                label: 'Pay after service',
                value: paymentTotal > 0 ? `${Math.round((a.paymentSplit.pay_after / paymentTotal) * 100)}%` : '—',
                hint: `${a.paymentSplit.pay_after} bookings`,
              },
            ]}
          />
        </ReportsSectionCard>
      ) : null}
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  periodWrap: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  periodGlass: { borderColor: surfaces.glassBorderStrong },
  periodInner: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  periodHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  periodText: { flex: 1, minWidth: 0 },
  periodEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.3,
    color: colors.forest,
    textTransform: 'uppercase',
  },
  periodTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: -0.3,
    color: colors.ink,
    marginTop: 2,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: '#8FD03C',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  chartFlush: { marginHorizontal: -spacing.sm },
});
