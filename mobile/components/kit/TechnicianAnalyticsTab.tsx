import { router } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Clock, Download } from 'lucide-react-native';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { AttendanceTrendChart } from '@/components/kit/AttendanceTrendChart';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { KpiCard } from '@/components/kit/KpiCard';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { StatusPipelineCard } from '@/components/kit/StatusPipelineCard';
import { WeeklyBarChart } from '@/components/kit/WeeklyBarChart';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatMonthLabel, statusKeyToMetric } from '@/lib/technician-metrics';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type {
  BookingStatus,
  Review,
  TechnicianDetailResponse,
  TechnicianMetricKey,
} from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const SECTION = {
  pending: 'Pending schedule queue',
  pipeline: 'Job pipeline',
  operations: 'Operational metrics',
  trends: 'Weekly trends',
  visits: 'Job visit log',
  reviews: 'Recent reviews',
} as const;

function monthOptions(current: string): string[] {
  const [y, m] = current.split('-').map(Number);
  const opts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(y, m - 1 - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return opts;
}

function monthChipLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en', { month: 'short', year: '2-digit' });
}

export function TechnicianAnalyticsTab({
  detail,
  month,
  today,
  onMonthChange,
  onMetricPress,
  onOpenBooking,
}: {
  detail: TechnicianDetailResponse;
  month: string;
  today: string;
  onMonthChange: (month: string) => void;
  onMetricPress: (key: TechnicianMetricKey, weekIndex?: number) => void;
  onOpenBooking: (bookingId: string) => void;
}) {
  const {
    technician,
    stats,
    analytics,
    reviews,
    bookings,
    jobVisits = [],
    globalPending,
    statusBreakdown = [],
    attendanceTrend = [],
    jobsTrend = [],
  } = detail;

  const monthLabel = formatMonthLabel(month);
  const months = monthOptions(month);

  async function exportReport() {
    const lines = [
      `Mr Antidot — ${technician.name} report`,
      `Period: ${monthLabel}`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      `Attendance: ${analytics?.attendanceRate ?? 0}%`,
      `Days came: ${analytics?.daysPresent ?? 0}`,
      `Days absent: ${analytics?.daysAbsent ?? 0}`,
      `Job completion: ${analytics?.completionRate ?? 0}%`,
      `Jobs started: ${analytics?.jobsStarted ?? 0}`,
      `No-shows: ${analytics?.jobsNoShow ?? 0}`,
      `Earnings: ₹${stats.earnings}`,
      `Completed jobs: ${stats.completedJobs}`,
      `Active jobs: ${stats.activeJobs}`,
      '',
      `Global pending (all time): ${globalPending?.count ?? 0}`,
      `Global pending this month: ${globalPending?.periodCount ?? 0}`,
      '',
      'Status pipeline:',
      ...statusBreakdown.map(
        (s) => `  ${bookingStatusLabel(s.status as BookingStatus)}: ${s.count} total, ${s.periodCount} in month`,
      ),
    ];
    try {
      await Share.share({
        message: lines.join('\n'),
        title: `${technician.name} — ${monthLabel}`,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not share report' });
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <View style={styles.monthRow}>
          {months.map((m) => (
            <Chip
              key={m}
              label={monthChipLabel(m)}
              selected={m === month}
              onPress={() => onMonthChange(m)}
            />
          ))}
        </View>
        <Pressable style={styles.exportBtn} onPress={() => void exportReport()} accessibilityLabel="Export report">
          <Download size={16} color={colors.secondaryDark} />
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{SECTION.pending}</Text>
        <Pressable onPress={() => router.push('/(admin)/bookings?status=pending')}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.kpiRow}>
        <KpiCard
          icon={Clock}
          value={String(globalPending?.count ?? 0)}
          label="Pending (all)"
          iconBg={colors.amberBg}
          iconColor={colors.amberInk}
          onPress={() => onMetricPress('pending_global')}
        />
        <KpiCard
          icon={Clock}
          value={String(globalPending?.periodCount ?? 0)}
          label={`Pending (${monthChipLabel(month)})`}
          iconBg={colors.amberBg}
          iconColor={colors.amberInk}
          onPress={() => onMetricPress('pending_global')}
        />
      </View>
      {(globalPending?.bookings ?? []).slice(0, 5).map((b) => (
        <PendingAnalyticsRow key={b.id} booking={b} onPress={() => onOpenBooking(b.id)} />
      ))}
      {(globalPending?.bookings?.length ?? 0) === 0 ? (
        <Text style={styles.emptyHint}>No bookings awaiting schedule confirmation.</Text>
      ) : null}

      {statusBreakdown.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>{SECTION.pipeline}</Text>
          <StatusPipelineCard
            items={statusBreakdown}
            periodLabel={`${monthLabel} · this technician`}
            onStatusPress={(status) => onMetricPress(statusKeyToMetric(status))}
          />
        </>
      ) : null}

      <Text style={styles.sectionTitle}>{SECTION.operations}</Text>
      {analytics ? (
        <AttendanceAnalyticsCard
          analytics={analytics}
          stats={stats}
          onMetricPress={onMetricPress}
        />
      ) : (
        <EmptyState
          title="No analytics yet"
          message="Attendance data will appear once this technician checks in."
        />
      )}

      <Text style={styles.sectionTitle}>{SECTION.trends}</Text>
      <WeeklyBarChart
        title="Jobs completed"
        subtitle={monthLabel}
        data={jobsTrend.map((b) => ({ label: b.label, value: b.completed, key: b.label }))}
        onBarPress={(index) => onMetricPress('week_jobs', index)}
      />
      <WeeklyBarChart
        title="Weekly earnings"
        subtitle={monthLabel}
        data={jobsTrend.map((b) => ({ label: b.label, value: b.earnings, key: b.label }))}
        valuePrefix="₹"
        onBarPress={(index) => onMetricPress('week_earnings', index)}
      />
      <AttendanceTrendChart
        title="Attendance by week"
        subtitle={monthLabel}
        data={attendanceTrend}
        onBarPress={(index) => onMetricPress('week_attendance', index)}
      />

      {jobVisits.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{SECTION.visits}</Text>
          {jobVisits.map((visit) => {
            const booking = bookings.find((b) => b.id === visit.bookingId);
            if (!booking) return null;
            return (
              <JobVisitCard
                key={visit.bookingId}
                booking={booking}
                today={today}
                onPress={() => onOpenBooking(booking.id)}
              />
            );
          })}
        </View>
      ) : null}

      {reviews.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{SECTION.reviews}</Text>
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <RatingStars value={review.stars} size={16} />
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      {review.tags.length > 0 ? (
        <Text style={styles.reviewTags}>{review.tags.join(' · ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  toolbar: { marginBottom: spacing.sm },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.secondarySoft,
  },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.secondaryDark },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  link: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.secondaryDark },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  block: { marginTop: spacing.sm },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 6 },
  reviewTags: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
});
