import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  DashCard,
  LeaderboardCard,
  PaymentsCard,
  RevenueCard,
  StatusCard,
  TopServicesCard,
} from '@/components/admin/DashboardBlocks';
import { csvSections, shareCsv, type CsvValue } from '@/components/admin/csv';
import {
  DateRangePicker,
  addDaysKey,
  daysInclusive,
  formatRangeLabel,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { formatINR, formatINRCompact, formatIndianNumber, formatPctDelta, pctChangeOf } from '@/components/charts/chartFormat';
import { AnalyticsStatGrid } from '@/components/kit/AnalyticsStatGrid';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminReportsSkeleton } from '@/components/kit/AdminSkeletons';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { KpiCard } from '@/components/kit/KpiCard';
import { ReportsInsightGrid, ReportsRankList, ReportsTeamCard } from '@/components/kit/ReportsPageKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { DashboardStats, TeamAttendanceRange } from '@/types/adminLists';

/** Team attendance is computed per day — the API caps it at a year. */
const ATTENDANCE_MAX_DAYS = 366;

function deltaPoints(current: number, previous: number): string | undefined {
  const diff = Math.round((current - previous) * 10) / 10;
  if (!previous && !current) return undefined;
  if (diff === 0) return '0%';
  return `${diff > 0 ? '+' : '-'}${Math.abs(diff)}`;
}

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const wide = useWideWebLayout();
  const [rangeValue, setRangeValue] = useState<DateRangeValue>({ preset: '30d' });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [team, setTeam] = useState<TeamAttendanceRange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const requestId = useRef(0);

  const range = resolveDateRange(rangeValue);

  const load = useCallback(
    async (opts: { skipCache?: boolean } = {}) => {
      const id = ++requestId.current;
      setUpdating(true);
      const params = range ? { from: range.from, to: range.to } : undefined;
      // Attendance: the same range, trimmed to the last year when longer.
      const teamParams =
        range && daysInclusive(range.from, range.to) > ATTENDANCE_MAX_DAYS
          ? { from: addDaysKey(range.to, -(ATTENDANCE_MAX_DAYS - 1)), to: range.to }
          : params;
      const cache = opts.skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.stats };
      try {
        const [statsRes, teamRes] = await Promise.all([
          api.get<DashboardStats>('/stats/admin', { ...screenLoadConfig, params, ...cache }),
          api
            .get<TeamAttendanceRange>('/stats/admin/team-attendance', { ...screenLoadConfig, params: teamParams, ...cache })
            .catch(() => null),
        ]);
        if (id !== requestId.current) return;
        setStats(statsRes.data);
        setTeam(teamRes?.data ?? null);
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(getApiErrorMessage(err, 'Could not load reports'));
      } finally {
        if (id === requestId.current) setUpdating(false);
      }
    },
    [range?.from, range?.to],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useStaleFocusRefresh(() => load({ skipCache: true }), 15_000);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ skipCache: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const exportCsv = useCallback(async () => {
    if (!stats || exporting) return;
    setExporting(true);
    try {
      const { revenue, bookings, people, reviews } = stats;
      const label = formatRangeLabel({ from: stats.range.from, to: stats.range.to });
      const previous = formatRangeLabel({ from: stats.range.previousFrom, to: stats.range.previousTo });
      const metric = (name: string, current: number, prev: number | null, pct?: number | null): CsvValue[] => [
        name,
        current,
        prev ?? '',
        pct === undefined ? (prev === null ? '' : (pctChangeOf(current, prev) ?? '')) : (pct ?? ''),
      ];
      const content = csvSections([
        {
          title: `Mr Antidot report · ${label} (${stats.range.days} days, IST) vs ${previous}`,
          headers: ['Metric', 'This range', 'Previous range', 'Change %'],
          rows: [
            metric('Revenue incl. GST (INR)', revenue.total, revenue.previous.total, revenue.delta.total),
            metric('Net revenue excl. GST (INR)', revenue.net, revenue.previous.net, revenue.delta.net),
            metric('GST (INR)', revenue.gst, revenue.previous.gst),
            metric('Coupon discounts (INR)', revenue.coupon, null),
            metric('Completed jobs', revenue.jobs, revenue.previous.jobs, revenue.delta.jobs),
            metric('Average order value (INR)', revenue.avgOrderValue, revenue.previous.avgOrderValue, revenue.delta.avgOrderValue),
            metric('Bookings made', bookings.created, bookings.previous, bookings.delta),
            metric('Completion rate of bookings made (%)', bookings.completionRate, null),
            metric('Cancellation rate of bookings made (%)', bookings.cancellationRate, bookings.previousCancellationRate),
            metric('New customers', people.newCustomers, people.previousNewCustomers, people.delta),
            metric('Reviews', reviews.count, reviews.previousCount),
            metric('Average rating', reviews.average, reviews.previousAverage),
          ],
        },
        {
          title: stats.range.bucket === 'day' ? 'Revenue by day (completion date)' : 'Revenue by month (completion date)',
          headers: [stats.range.bucket === 'day' ? 'Date' : 'Month', 'Revenue incl. GST (INR)', 'Net (INR)', 'GST (INR)', 'Completed jobs', 'Bookings made'],
          rows: stats.series.map((p) => [p.key, p.revenue, p.net, p.gst, p.jobs, p.bookings]),
        },
        {
          title: 'Bookings made in this range, by current status',
          headers: ['Status', 'Bookings'],
          rows: bookings.byStatus.map((s) => [bookingStatusLabel(s.status), s.count]),
        },
        {
          title: 'Top services (completed jobs)',
          headers: ['Service', 'Completed jobs', 'Revenue (INR)'],
          rows: stats.topServices.map((s) => [s.name, s.jobs, s.revenue]),
        },
        {
          title: 'Technicians (completed jobs)',
          headers: ['Technician', 'Phone', 'Completed jobs', 'Revenue (INR)', 'Public rating', 'Reviews in range', 'Average in range'],
          rows: stats.leaderboard.map((t) => [t.name, t.phone ?? '', t.jobs, t.revenue, t.rating || '', t.reviewsInRange, t.ratingInRange ?? '']),
        },
        {
          title: 'Top customers (completed jobs)',
          headers: ['Customer', 'Phone', 'Completed jobs', 'Spend (INR)'],
          rows: stats.topCustomers.map((c) => [c.name, c.phone ?? '', c.jobs, c.spend]),
        },
        {
          title: 'Payments (completed jobs)',
          headers: ['Group', 'Name', 'Jobs', 'Amount (INR)'],
          rows: [
            ...stats.payments.methods.map((m) => ['Method', m.label, m.count, m.amount]),
            ...stats.payments.statuses.map((s) => ['Status', s.label, s.count, s.amount]),
          ],
        },
        ...(team
          ? [
              {
                title: `Team attendance · ${formatRangeLabel({ from: team.from, to: team.to })}`,
                headers: ['Technician', 'Present days', 'Absent days', 'Leave days', 'Attendance %'],
                rows: team.technicians.map((t) => [t.name, t.present, t.absent, t.leave, t.rate]),
              },
            ]
          : []),
      ]);
      const result = await shareCsv(`mrantidot-report-${stats.range.from}_to_${stats.range.to}.csv`, content, 'Mr Antidot report');
      haptic('success');
      if (result === 'downloaded') Toast.show({ type: 'success', text1: 'Report CSV downloaded' });
    } catch {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Could not export the report' });
    } finally {
      setExporting(false);
    }
  }, [stats, team, exporting]);

  const header = (
    <AdminScreenHeader
      title="Analytics"
      subtitle={stats ? `${formatRangeLabel({ from: stats.range.from, to: stats.range.to })} · revenue, pipeline & team` : 'Revenue, pipeline & team'}
      eyebrow="INSIGHTS"
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
        <AdminReportsSkeleton />
      </AdminTabScreen>
    );
  }

  const { revenue, bookings, people, reviews, catalog } = stats;
  const from = stats.range.from;
  const to = stats.range.to;

  const statusCard = (
    <StatusCard
      stats={stats}
      onStatusPress={(status) => appPush({ pathname: adminRoutes.bookings, params: { status, from, to, dateField: 'created' } })}
    />
  );
  const servicesCard = (
    <TopServicesCard
      stats={stats}
      limit={8}
      onServicePress={(serviceId) =>
        appPush({ pathname: adminRoutes.bookings, params: { serviceId, status: 'completed', from, to, dateField: 'completed' } })
      }
    />
  );
  const leaderCard = (
    <LeaderboardCard stats={stats} limit={10} onTechPress={(id) => appPush(adminRoutes.technician(id))} />
  );
  const customersCard = (
    <DashCard title="Top customers" hint="Highest spend on completed jobs">
      <ReportsRankList
        flush
        items={stats.topCustomers.map((c) => ({
          key: c.id,
          title: c.name,
          subtitle: `${c.jobs} ${c.jobs === 1 ? 'job' : 'jobs'} · ${formatINR(c.spend)}`,
          value: c.spend,
          onPress: () => appPush(adminRoutes.customer(c.id)),
        }))}
        emptyMessage="No completed jobs in this range yet."
      />
    </DashCard>
  );
  const teamCard = team ? (
    <DashCard
      title="Team attendance"
      hint={`${formatRangeLabel({ from: team.from, to: team.to })}${team.from !== from ? ' · last 12 months of the range' : ''}`}
      actionLabel="Team"
      onAction={() => appPush(adminRoutes.technicians)}
    >
      <ReportsTeamCard
        checkedInToday={team.checkedInToday}
        totalTechnicians={team.totalTechnicians}
        averageRate={team.averageAttendanceRate}
        lowAttendance={team.lowAttendance}
        onTechPress={(id) => appPush(adminRoutes.technician(id))}
        flush
      />
    </DashCard>
  ) : null;

  return (
    <AdminTabScreen
      header={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.green} />}
    >
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <View style={styles.periodWrap}>
          <GlassPanel padded={false} intensity={42} style={styles.periodGlass}>
            <View style={styles.periodInner}>
              <View style={styles.periodHead}>
                <View style={styles.periodText}>
                  <Text style={styles.periodEyebrow}>PERIOD</Text>
                  <Text style={styles.periodTitle} numberOfLines={1}>
                    Compare with the {stats.range.days} days before
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.exportBtn, (pressed || exporting) && styles.pressed]}
                  onPress={() => void exportCsv()}
                  disabled={exporting}
                  accessibilityRole="button"
                  accessibilityLabel="Export report as CSV"
                >
                  <Download size={15} color={colors.forest} strokeWidth={2.4} />
                  <Text style={styles.exportText}>{exporting ? 'Preparing…' : 'CSV'}</Text>
                </Pressable>
              </View>
              <DateRangePicker value={rangeValue} onChange={(v) => setRangeValue(v)} inset maxDays={3650} />
              {updating ? (
                <View style={styles.updating}>
                  <Spinner />
                  <Text style={styles.updatingText}>Updating…</Text>
                </View>
              ) : null}
            </View>
          </GlassPanel>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        <View style={styles.grid}>
          <KpiCard
            icon={AppIcons.ui.rupee}
            value={formatINRCompact(revenue.total)}
            label="Revenue · incl. GST"
            delta={formatPctDelta(revenue.delta.total)}
            iconBg={colors.soft}
            iconColor={colors.green}
          />
          <KpiCard
            icon={AppIcons.ui.pay}
            value={formatINRCompact(revenue.net)}
            label={`Net · GST ${formatINRCompact(revenue.gst)}`}
            delta={formatPctDelta(revenue.delta.net)}
            iconBg={colors.soft}
            iconColor={colors.forest}
          />
          <KpiCard
            icon={AppIcons.trust.verified}
            value={formatIndianNumber(revenue.jobs)}
            label="Completed jobs"
            delta={formatPctDelta(revenue.delta.jobs)}
            iconBg={colors.soft}
            iconColor={colors.forest}
            onPress={() => appPush({ pathname: adminRoutes.bookings, params: { status: 'completed', from, to, dateField: 'completed' } })}
          />
          <KpiCard
            icon={AppIcons.ui.wallet}
            value={formatINR(revenue.avgOrderValue)}
            label="Avg order value"
            delta={formatPctDelta(revenue.delta.avgOrderValue)}
            iconBg={colors.soft}
            iconColor={colors.forest}
          />
          <KpiCard
            icon={AppIcons.ui.calendarCheck}
            value={formatIndianNumber(bookings.created)}
            label="Bookings made"
            delta={formatPctDelta(bookings.delta)}
            iconBg={colors.soft}
            iconColor={colors.forest}
            onPress={() => appPush({ pathname: adminRoutes.bookings, params: { from, to, dateField: 'created' } })}
          />
          <KpiCard
            icon={AppIcons.adminKpi.customers}
            value={formatIndianNumber(people.newCustomers)}
            label="New customers"
            delta={formatPctDelta(people.delta)}
            iconBg={colors.soft}
            iconColor={colors.green}
            onPress={() => appPush(adminRoutes.customers)}
          />
          <KpiCard
            icon={AppIcons.ui.star}
            value={reviews.count ? `${reviews.average.toFixed(1)}★` : '—'}
            label={`Rating · ${formatIndianNumber(reviews.count)} reviews`}
            delta={reviews.count && reviews.previousCount ? deltaPoints(reviews.average, reviews.previousAverage) : undefined}
            iconBg={colors.soft}
            iconColor={colors.forest}
            onPress={() => appPush(adminRoutes.reviews)}
          />
          <KpiCard
            icon={AppIcons.ui.alert}
            value={`${bookings.cancellationRate}%`}
            label="Cancelled of booked"
            iconBg={bookings.cancellationRate > 10 ? colors.errorBg : colors.soft}
            iconColor={bookings.cancellationRate > 10 ? colors.error : colors.forest}
            onPress={() => appPush({ pathname: adminRoutes.bookings, params: { status: 'cancelled', from, to, dateField: 'created' } })}
          />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(2)} slideFrom={14}>
        <View style={styles.block}>
          <RevenueCard stats={stats} />
        </View>
      </FadeSlideIn>

      {wide ? (
        <>
          <View style={styles.row}>
            <View style={styles.col}>{statusCard}</View>
            <View style={styles.col}>{servicesCard}</View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>{leaderCard}</View>
            <View style={styles.col}>{customersCard}</View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <PaymentsCard stats={stats} />
            </View>
            <View style={styles.col}>{teamCard}</View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.block}>{statusCard}</View>
          <View style={styles.block}>{servicesCard}</View>
          <View style={styles.block}>
            <PaymentsCard stats={stats} />
          </View>
          <View style={styles.block}>{leaderCard}</View>
          <View style={styles.block}>{customersCard}</View>
          {teamCard ? <View style={styles.block}>{teamCard}</View> : null}
        </>
      )}

      <View style={styles.block}>
        <DashCard title="Reviews, offers & catalog" hint="Satisfaction and what is live right now">
          <ReportsInsightGrid
            items={[
              { key: 'reviews', label: 'Reviews in range', value: formatIndianNumber(reviews.count), hint: `${reviews.allTimeCount} all time` },
              { key: 'rating', label: 'All-time rating', value: reviews.allTimeCount ? `${reviews.allTimeAverage}★` : '—', accent: colors.forest },
              { key: 'low', label: '1–2★ in range', value: formatIndianNumber(reviews.lowRatings), accent: reviews.lowRatings ? colors.error : colors.forest },
              { key: 'offers', label: 'Live offers', value: `${catalog.activeOffers}/${catalog.offers}`, hint: `${formatIndianNumber(catalog.offerRedemptions)} redemptions` },
              { key: 'coupons', label: 'Coupon jobs', value: formatIndianNumber(revenue.couponJobs), hint: `${formatINR(revenue.coupon)} off` },
              { key: 'services', label: 'Active services', value: `${catalog.activeServices}/${catalog.services}` },
            ]}
          />
        </DashCard>
      </View>

      <View style={styles.block}>
        <AnalyticsStatGrid
          glass
          items={[
            { key: 'customers', label: 'Customers', value: formatIndianNumber(people.totalCustomers), icon: AppIcons.adminKpi.customers, iconBg: colors.soft, iconColor: colors.green, onPress: () => appPush(adminRoutes.customers) },
            { key: 'techs', label: 'Technicians', value: `${people.activeTechnicians}/${people.totalTechnicians}`, icon: AppIcons.adminQuick.addTech, iconBg: colors.soft, iconColor: colors.forest, onPress: () => appPush(adminRoutes.technicians) },
            { key: 'payroll', label: 'Payroll', value: 'Open', icon: AppIcons.ui.wallet, iconBg: colors.soft, iconColor: colors.forest, onPress: () => appPush(adminRoutes.payroll) },
          ]}
        />
      </View>

      <View style={styles.exportWrap}>
        <PressableScale onPress={() => appPush(adminRoutes.dataExport)} accessibilityRole="button" accessibilityLabel="Open data export">
          <GlassPanel>
            <View style={styles.exportRow}>
              <View style={styles.exportCopy}>
                <Text style={styles.exportTitle} numberOfLines={1}>
                  Export raw data
                </Text>
                <Text style={styles.exportHint} numberOfLines={1}>
                  Pick datasets and dates · CSV or JSON
                </Text>
              </View>
              <View style={styles.exportIcon}>
                <PremiumIcon icon={AppIcons.ui.download} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
              </View>
            </View>
          </GlassPanel>
        </PressableScale>
      </View>
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  periodWrap: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  periodGlass: { borderColor: ui.hairline },
  periodInner: { paddingTop: spacing.md, paddingBottom: spacing.xs, gap: spacing.sm },
  periodHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, gap: 12 },
  periodText: { flex: 1, minWidth: 0 },
  periodEyebrow: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.3, color: colors.forest, textTransform: 'uppercase' },
  periodTitle: { fontFamily: fonts.display, fontSize: 16, letterSpacing: -0.3, color: colors.ink, marginTop: 2 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: ui.border,
  },
  exportText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.forest },
  updating: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, marginTop: -4 },
  updatingText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.md, marginTop: spacing.md, width: '100%' },
  block: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md, paddingHorizontal: spacing.md, marginTop: spacing.md },
  col: { flex: 1, minWidth: 0 },
  exportWrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportCopy: { flex: 1, minWidth: 0 },
  exportTitle: { fontFamily: fonts.display, fontSize: 15, letterSpacing: -0.2, color: colors.ink },
  exportHint: { marginTop: 3, fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: ui.border,
  },
});
