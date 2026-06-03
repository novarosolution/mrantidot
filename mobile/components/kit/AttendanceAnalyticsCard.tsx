import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { formatDuration } from '@/lib/job-visit-helpers';
import type { TechnicianAnalytics, TechnicianDetailStats, TechnicianMetricKey } from '@/types/api';
import { colors, fonts, spacing, typography } from '@/constants/theme';

type MetricDef = { key: TechnicianMetricKey; label: string; value: string };

export function AttendanceAnalyticsCard({
  analytics,
  stats,
  onMetricPress,
}: {
  analytics: TechnicianAnalytics;
  stats?: Pick<TechnicianDetailStats, 'earnings' | 'reviewCount' | 'totalJobs'>;
  onMetricPress?: (key: TechnicianMetricKey) => void;
}) {
  const avgVisit =
    analytics.avgVisitMinutes != null && analytics.avgVisitMinutes > 0
      ? formatDuration(analytics.avgVisitMinutes)
      : '—';

  const attendanceMetrics: MetricDef[] = [
    { key: 'attendance_rate', label: 'Attendance', value: `${analytics.attendanceRate}%` },
    { key: 'days_present', label: 'Days came', value: String(analytics.daysPresent) },
    { key: 'days_absent', label: 'Did not come', value: String(analytics.daysAbsent) },
    { key: 'completion_rate', label: 'Job completion', value: `${analytics.completionRate}%` },
  ];

  const visitMetrics: MetricDef[] = [
    { key: 'jobs_started', label: 'Jobs started', value: String(analytics.jobsStarted ?? 0) },
    { key: 'jobs_completed', label: 'Jobs stopped', value: String(analytics.jobsCompleted) },
    { key: 'jobs_no_show', label: 'No-shows', value: String(analytics.jobsNoShow ?? 0) },
    { key: 'avg_visit', label: 'Avg visit', value: avgVisit },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Daily attendance</Text>
      <View style={styles.grid}>
        {attendanceMetrics.map((m) => (
          <MetricStat key={m.key} metric={m} onPress={onMetricPress} />
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Job visits</Text>
      <View style={styles.grid}>
        {visitMetrics.map((m) => (
          <MetricStat key={m.key} metric={m} onPress={onMetricPress} />
        ))}
      </View>

      <Text style={styles.meta}>
        {analytics.jobsCompleted} of {analytics.jobsScheduled} jobs completed
        {analytics.daysPending > 0 ? ` · ${analytics.daysPending} day(s) pending today` : ''}
        {stats ? ` · ₹${stats.earnings} earned` : ''}
        {stats?.reviewCount ? ` · ${stats.reviewCount} reviews` : ''}
      </Text>
    </View>
  );
}

function MetricStat({
  metric,
  onPress,
}: {
  metric: MetricDef;
  onPress?: (key: TechnicianMetricKey) => void;
}) {
  const inner = (
    <>
      <Text style={styles.val}>{metric.value}</Text>
      <Text style={styles.label}>{metric.label}</Text>
      {onPress ? <ChevronRight size={14} color={colors.muted} style={styles.chevron} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => onPress(metric.key)}>
        <Card variant="premium" style={styles.stat}>
          {inner}
        </Card>
      </Pressable>
    );
  }

  return (
    <Card variant="premium" style={styles.stat}>
      {inner}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  sectionTitle: { ...typography.overline, marginTop: spacing.sm, marginBottom: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flex: 1, minWidth: '45%', padding: spacing.md, alignItems: 'center', position: 'relative' },
  val: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
  chevron: { position: 'absolute', top: 8, right: 8 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, paddingHorizontal: 2, marginTop: spacing.sm },
});
