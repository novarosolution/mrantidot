import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  CalendarCheck,
  ClipboardList,
  Download,
  HardHat,
  IndianRupee,
  MessageSquare,
  Percent,
  Receipt,
  SprayCan,
  Star,
  Tag,
  Users,
} from 'lucide-react-native';
import { StatusPipelineCard } from '@/components/kit/StatusPipelineCard';
import { AdminListShell, adminStyles } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AnalyticsStatGrid } from '@/components/kit/AnalyticsStatGrid';
import { formatRupee } from '@/components/kit/format';
import { KpiCard } from '@/components/kit/KpiCard';
import { RevenueBarChart } from '@/components/kit/RevenueBarChart';
import {
  BookingsTrendChart,
  ReportsInsightGrid,
  ReportsManageGrid,
  ReportsRankList,
  ReportsSectionCard,
  ReportsTeamCard,
} from '@/components/kit/ReportsPageKit';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AdminStats, TeamAttendanceStats } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const PERIODS = ['Week', 'Month', 'Quarter', 'Year'];

const MANAGE_ITEMS = [
  { key: 'bookings', icon: ClipboardList, label: 'Bookings', desc: 'Assign & track jobs' },
  { key: 'services', icon: SprayCan, label: 'Services', desc: 'Catalog & pricing' },
  { key: 'offers', icon: Tag, label: 'Offers', desc: 'Promo codes & deals' },
  { key: 'reviews', icon: MessageSquare, label: 'Reviews', desc: 'Customer feedback' },
  { key: 'content', icon: AppIcons.adminQuick.content, label: 'App content', desc: 'Copy & home screen' },
  { key: 'team', icon: HardHat, label: 'Team', desc: 'Technicians & users' },
];

function manageRoute(key: string) {
  switch (key) {
    case 'bookings':
      return router.push('/(admin)/bookings');
    case 'services':
      return router.push('/(admin)/services');
    case 'offers':
      return router.push('/(admin)/offers');
    case 'reviews':
      return router.push('/(admin)/reviews');
    case 'content':
      return router.push('/(admin)/content');
    case 'team':
      return router.push('/(admin)/team');
    default:
      break;
  }
}

export default function AdminReportsScreen() {
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

  const headerExtra = (
    <AdminFilterChips
      chips={PERIODS.map((p) => ({ key: p, label: p }))}
      selected={period}
      onSelect={(p) => !loading && setPeriod(p)}
    />
  );

  const exportBtn = (
    <Pressable style={styles.dl} onPress={() => void exportReport()} accessibilityLabel="Export report">
      <Download size={18} color={colors.lime} />
    </Pressable>
  );

  const analyticsGrid = useMemo(() => {
    if (!stats) return [];
    const a = stats.analytics;
    return [
      {
        key: 'bookings',
        label: `Bookings (${period})`,
        value: String(stats.periodBookings ?? 0),
        icon: CalendarCheck,
        iconBg: colors.blueBg,
        iconColor: colors.blue,
        onPress: () => router.push('/(admin)/bookings'),
      },
      {
        key: 'customers',
        label: 'Customers',
        value: String(stats.customers),
        icon: Users,
        iconBg: colors.soft,
        iconColor: colors.green,
        onPress: () => router.push('/(admin)/customers'),
      },
      {
        key: 'techs',
        label: 'Technicians',
        value: String(stats.technicians),
        icon: HardHat,
        iconBg: colors.secondarySoft,
        iconColor: colors.secondaryDark,
        onPress: () => router.push('/(admin)/technicians'),
      },
      {
        key: 'reviews',
        label: 'Avg rating',
        value: a ? `${a.reviews.averageRating}★` : '—',
        icon: Star,
        iconBg: colors.amberBg,
        iconColor: colors.amberInk,
        onPress: () => router.push('/(admin)/reviews'),
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
        icon: Percent,
        iconBg: colors.secondarySoft,
        iconColor: colors.secondaryInk,
        onPress: () => router.push('/(admin)/offers'),
      },
    ];
  }, [stats, period]);

  if (loading && !stats) return <Spinner fullScreen />;

  if (error && !stats) {
    return (
      <AdminListShell title="Analytics" subtitle="Reports" rightAction={exportBtn} headerExtra={headerExtra}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  if (!stats) return <Spinner fullScreen />;

  const a = stats.analytics;
  const months = stats.revenueByMonth ?? [];
  const avgOrder = a?.performance.avgOrderValue ?? Math.round(stats.revenueCompleted / Math.max(1, stats.totalBookings));
  const paymentTotal = (a?.paymentSplit.upi_card ?? 0) + (a?.paymentSplit.pay_after ?? 0);

  return (
    <AdminListShell
      title="Analytics"
      subtitle={`${period} business overview`}
      showBack={false}
      rightAction={exportBtn}
      headerExtra={headerExtra}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <Spinner />
            <Text style={styles.loadingText}>Updating {period.toLowerCase()} data…</Text>
          </View>
        ) : null}

        <AdminStatStrip
          items={[
            { label: 'Revenue', value: formatRupee(stats.periodRevenue ?? stats.revenueCompleted) },
            { label: 'Bookings', value: stats.periodBookings ?? 0 },
            { label: 'Customers', value: stats.customers },
            {
              label: 'Complete',
              value: a ? `${a.performance.completionRate}%` : '—',
              color: colors.green,
            },
          ]}
        />

        <View style={styles.grid}>
          <KpiCard
            icon={IndianRupee}
            value={formatRupee(stats.periodRevenue ?? stats.revenueCompleted)}
            label={`Revenue (${period})`}
            delta={stats.deltas?.revenue}
            iconBg={colors.soft}
            iconColor={colors.green}
          />
          <KpiCard
            icon={CalendarCheck}
            value={String(stats.periodBookings ?? 0)}
            label={`Bookings (${period})`}
            delta={stats.deltas?.bookings}
            iconBg={colors.blueBg}
            iconColor={colors.blue}
            onPress={() => router.push('/(admin)/bookings')}
          />
          <KpiCard
            icon={Receipt}
            value={`₹${avgOrder}`}
            label="Avg order"
            iconBg={colors.secondarySoft}
            iconColor={colors.secondaryDark}
          />
          <KpiCard
            icon={AppIcons.adminKpi.pending}
            value={String(stats.periodPending ?? stats.byStatus.pending ?? 0)}
            label={`Pending (${period})`}
            delta={stats.deltas?.pending}
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => router.push('/(admin)/bookings?status=pending')}
          />
        </View>

        <ReportsSectionCard title="Entity metrics" hint="Tap a tile to open that section">
          <AnalyticsStatGrid items={analyticsGrid} />
        </ReportsSectionCard>

        {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
          <ReportsSectionCard
            title="Booking pipeline"
            hint={`All-time totals · +N = new in ${period.toLowerCase()}`}
            actionLabel="View all"
            onAction={() => router.push('/(admin)/bookings')}
          >
            <StatusPipelineCard
              hideTitle
              items={stats.statusBreakdown}
              periodLabel={`New bookings in ${period.toLowerCase()} shown per status`}
              onStatusPress={(status) => router.push(`/(admin)/bookings?status=${status}`)}
            />
          </ReportsSectionCard>
        ) : null}

        <ReportsSectionCard title="Revenue trend" hint="Completed job revenue — last 7 months">
          <View style={styles.chartFlush}>
            <RevenueBarChart title="Monthly revenue" data={months} />
          </View>
        </ReportsSectionCard>

        {a?.bookingsTrend && a.bookingsTrend.length > 0 ? (
          <ReportsSectionCard title="Booking volume" hint="New bookings created each day">
            <BookingsTrendChart data={a.bookingsTrend} />
          </ReportsSectionCard>
        ) : null}

        {teamAttendance ? (
          <ReportsSectionCard
            title="Team attendance"
            hint={`Field team performance · ${period.toLowerCase()}`}
            actionLabel="Team"
            onAction={() => router.push('/(admin)/technicians')}
          >
            <ReportsTeamCard
              checkedInToday={teamAttendance.checkedInToday}
              totalTechnicians={teamAttendance.totalTechnicians}
              averageRate={teamAttendance.averageAttendanceRate}
              lowAttendance={teamAttendance.lowAttendance}
              onTechPress={(id) => router.push(`/(admin)/technician/${id}`)}
            />
          </ReportsSectionCard>
        ) : null}

        {a && a.topTechnicians.length > 0 ? (
          <ReportsSectionCard title="Top technicians" hint={`Completed jobs in ${period.toLowerCase()}`}>
            <ReportsRankList
              items={a.topTechnicians.map((t) => ({
                key: t.id,
                title: t.name,
                subtitle: `${t.jobs} jobs · ${formatRupee(t.revenue)}`,
                value: t.jobs,
                onPress: () => router.push(`/(admin)/technician/${t.id}`),
              }))}
            />
          </ReportsSectionCard>
        ) : null}

        <ReportsSectionCard
          title="Top services"
          hint={`Most booked in ${period.toLowerCase()}`}
          actionLabel="Catalog"
          onAction={() => router.push('/(admin)/services')}
        >
          <ReportsRankList
            items={stats.topServices.map((s) => ({
              key: String(s.serviceId),
              title: s.name,
              subtitle: `${s.count} bookings`,
              value: s.count,
              onPress: () => router.push(`/(admin)/bookings?serviceId=${s.serviceId}`),
            }))}
            emptyMessage="No bookings in this period yet."
          />
        </ReportsSectionCard>

        {a && a.topCustomers.length > 0 ? (
          <ReportsSectionCard title="Top customers" hint={`Highest spend in ${period.toLowerCase()}`}>
            <ReportsRankList
              items={a.topCustomers.map((c) => ({
                key: c.id,
                title: c.name,
                subtitle: `${c.bookings} bookings · ${formatRupee(c.spend)}`,
                value: c.spend,
                onPress: () => router.push(`/(admin)/customer/${c.id}`),
              }))}
            />
          </ReportsSectionCard>
        ) : null}

        {a ? (
          <ReportsSectionCard title="Reviews, offers & payments" hint="Customer satisfaction and catalog health">
            <ReportsInsightGrid
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
                  accent: colors.amberInk,
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
                  accent: a.performance.cancellationRate > 10 ? colors.amberInk : colors.forest,
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

        <ReportsSectionCard title="Manage data" hint="Jump to admin screens to update content & records">
          <ReportsManageGrid items={MANAGE_ITEMS} onPress={manageRoute} />
        </ReportsSectionCard>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { ...adminStyles.content, paddingTop: spacing.sm },
  dl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  chartFlush: { marginHorizontal: -spacing.md },
});
