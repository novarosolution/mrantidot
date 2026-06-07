import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Download, Clock, IndianRupee, Receipt } from 'lucide-react-native';
import { StatusPipelineCard } from '@/components/kit/StatusPipelineCard';
import { AdminListShell, adminStyles } from '@/components/kit/AdminListShell';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { formatRupee } from '@/components/kit/format';
import { KpiCard } from '@/components/kit/KpiCard';
import { RevenueBarChart } from '@/components/kit/RevenueBarChart';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AdminStats, TeamAttendanceStats } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

const PERIODS = ['Week', 'Month', 'Quarter', 'Year'];

export default function AdminReportsScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendanceStats | null>(null);
  const [period, setPeriod] = useState('Month');
  const { loading, error, runLoad, reload } = useScreenLoad();

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
    const avgOrder = Math.round(stats.revenueCompleted / Math.max(1, stats.totalBookings));
    const lines = [
      `Mr Antidot — ${period} report`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      `Revenue (completed): ${formatRupee(stats.revenueCompleted)}`,
      `Total bookings: ${stats.totalBookings}`,
      `Average order value: ₹${avgOrder}`,
      `Customers: ${stats.customers}`,
      `Pending (all time): ${stats.byStatus.pending ?? 0}`,
      `Pending this ${period.toLowerCase()}: ${stats.periodPending ?? 0}`,
      '',
      'Booking pipeline:',
      ...(stats.statusBreakdown ?? []).map(
        (s) => `  ${s.status}: ${s.count} total, ${s.periodCount} this period`,
      ),
      '',
      'Top services:',
      ...stats.topServices.map((s, i) => `  ${i + 1}. ${s.name} — ${s.count} bookings`),
    ];
    try {
      await Share.share({ message: lines.join('\n'), title: `Mr Antidot report (${period})` });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not share report' });
    }
  }

  const headerExtra = (
    <View style={styles.periods}>
      {PERIODS.map((p) => (
        <Chip key={p} label={p} selected={period === p} onPress={() => !loading && setPeriod(p)} />
      ))}
    </View>
  );

  const exportBtn = (
    <Pressable style={styles.dl} onPress={() => void exportReport()} accessibilityLabel="Export report">
      <Download size={18} color={colors.lime} />
    </Pressable>
  );

  if (loading && !stats) return <Spinner fullScreen />;

  if (error && !stats) {
    return (
      <AdminListShell title="Reports" subtitle="Analytics" rightAction={exportBtn} headerExtra={headerExtra}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  if (!stats) return <Spinner fullScreen />;

  const maxCount = Math.max(1, ...stats.topServices.map((s) => s.count));
  const months = stats.revenueByMonth ?? [];
  const avgOrder = Math.round(stats.revenueCompleted / Math.max(1, stats.totalBookings));

  return (
    <AdminListShell
      title="Reports"
      subtitle={`${period} overview`}
      showBack={false}
      rightAction={exportBtn}
      headerExtra={headerExtra}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingRow}>
            <Spinner />
            <Text style={styles.loadingText}>Updating {period.toLowerCase()} data…</Text>
          </View>
        ) : null}
        <View style={styles.grid}>
          <KpiCard
            icon={Clock}
            value={String(stats.periodPending ?? stats.byStatus.pending ?? 0)}
            label={`Pending (${period})`}
            delta={stats.deltas?.pending}
            iconBg={colors.amberBg}
            iconColor={colors.amberInk}
            onPress={() => router.push('/(admin)/bookings?status=pending')}
          />
          <KpiCard
            icon={IndianRupee}
            value={formatRupee(stats.periodRevenue ?? stats.revenueCompleted)}
            label={`Revenue (${period})`}
            delta={stats.deltas?.revenue}
            iconBg={colors.soft}
            iconColor={colors.green}
          />
          <KpiCard
            icon={Receipt}
            value={`₹${avgOrder}`}
            label="Avg order"
            iconBg={colors.blueBg}
            iconColor={colors.blue}
          />
        </View>

        {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
          <StatusPipelineCard
            items={stats.statusBreakdown}
            periodLabel={`New bookings in ${period.toLowerCase()} shown per status`}
            onStatusPress={(status) => router.push(`/(admin)/bookings?status=${status}`)}
          />
        ) : null}

        <View style={styles.chartWrap}>
          <RevenueBarChart title="Revenue trend" data={months} />
        </View>

        {teamAttendance ? (
          <Card variant="premium" style={styles.teamCard}>
            <Text style={styles.chartTitle}>Team attendance</Text>
            <Text style={styles.teamMeta}>
              {teamAttendance.checkedInToday} of {teamAttendance.totalTechnicians} checked in today
            </Text>
            <Text style={styles.teamMeta}>
              Average attendance ({period.toLowerCase()}): {teamAttendance.averageAttendanceRate}%
            </Text>
            {teamAttendance.lowAttendance.length > 0 ? (
              <>
                <Text style={styles.teamSub}>Needs attention</Text>
                {teamAttendance.lowAttendance.map((t) => (
                  <Pressable
                    key={t.id}
                    style={styles.teamRow}
                    onPress={() => router.push(`/(admin)/technician/${t.id}`)}
                  >
                    <Text style={styles.teamName}>{t.name}</Text>
                    <Text style={styles.teamRate}>{t.rate}%</Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <Text style={styles.empty}>All technicians above 80% attendance.</Text>
            )}
          </Card>
        ) : null}

        <Card variant="premium" style={styles.topSvc}>
          <Text style={styles.chartTitle}>Top Services</Text>
          {stats.topServices.length === 0 ? (
            <Text style={styles.empty}>No bookings in this period yet.</Text>
          ) : (
            stats.topServices.map((s) => (
              <Pressable
                key={String(s.serviceId)}
                style={styles.svcRow}
                onPress={() => router.push(`/(admin)/bookings?serviceId=${s.serviceId}`)}
              >
                <View style={styles.svcHead}>
                  <Text style={styles.svcName}>{s.name}</Text>
                  <Text style={styles.svcVal}>{s.count} bookings</Text>
                </View>
                <View style={styles.svcTrack}>
                  <View style={[styles.svcFill, { width: `${(s.count / maxCount) * 100}%` }]} />
                </View>
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: adminStyles.content,
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dl: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: spacing.md },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chartWrap: { marginTop: spacing.md, marginHorizontal: -spacing.md },
  teamCard: { marginTop: spacing.md, padding: 16 },
  teamMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 4 },
  teamSub: { fontFamily: fonts.display, fontSize: 13, marginTop: 12, marginBottom: 8 },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  teamName: { fontFamily: fonts.bodySemi, fontSize: 13 },
  teamRate: { fontFamily: fonts.displayExtra, fontSize: 13, color: surfaces.tintDangerInk },
  chartTitle: { fontFamily: fonts.display, fontSize: 15, marginBottom: 14 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  topSvc: { marginTop: spacing.md, padding: 16 },
  svcRow: { marginBottom: 13 },
  svcHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  svcName: { fontFamily: fonts.bodySemi, fontSize: 12 },
  svcVal: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
  svcTrack: { height: 8, backgroundColor: colors.bg, borderRadius: 5, overflow: 'hidden' },
  svcFill: { height: '100%', backgroundColor: colors.green, borderRadius: 5 },
});
