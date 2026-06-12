import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Clock, Download, IndianRupee, SprayCan, Star } from 'lucide-react-native';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AttendanceAnalyticsCard } from '@/components/kit/AttendanceAnalyticsCard';
import { AttendanceTrendChart } from '@/components/kit/AttendanceTrendChart';
import { formatRupee } from '@/components/kit/format';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { KpiCard } from '@/components/kit/KpiCard';
import { PendingAnalyticsRow } from '@/components/kit/PendingAnalyticsRow';
import { ReportsSectionCard } from '@/components/kit/ReportsPageKit';
import { StatusPipelineCard } from '@/components/kit/StatusPipelineCard';
import { TechnicianReviewCard } from '@/components/kit/TechnicianProfileKit';
import { WeeklyBarChart } from '@/components/kit/WeeklyBarChart';
import { Chip } from '@/components/ui/Chip';
import { formatMonthLabel, statusKeyToMetric } from '@/lib/technician-metrics';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type {
  BookingStatus,
  TechnicianDetailResponse,
  TechnicianMetricKey,
} from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
      <View style={styles.toolbarCard}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.toolbarGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <Text style={styles.toolbarTitle}>Period · {monthLabel}</Text>
        <View style={styles.monthRow}>
          {months.map((m) => (
            <Chip key={m} label={monthChipLabel(m)} selected={m === month} onPress={() => onMonthChange(m)} compact />
          ))}
        </View>
        <Pressable style={styles.exportBtn} onPress={() => void exportReport()} accessibilityLabel="Export report">
          <Download size={16} color={colors.lime} />
          <Text style={styles.exportText}>Export report</Text>
        </Pressable>
      </View>

      <AdminStatStrip
        items={[
          {
            label: 'Attendance',
            value: analytics ? `${analytics.attendanceRate}%` : '—',
            color: colors.forest,
          },
          {
            label: 'Completion',
            value: analytics ? `${analytics.completionRate}%` : '—',
            color: colors.green,
          },
          {
            label: 'Earnings',
            value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
          },
          { label: 'Active', value: stats.activeJobs, color: colors.amberInk },
        ]}
      />

      <View style={styles.kpiRow}>
        <KpiCard
          icon={SprayCan}
          value={String(stats.completedJobs)}
          label="Completed"
          iconBg={colors.soft}
          iconColor={colors.green}
          onPress={() => onMetricPress('completed')}
        />
        <KpiCard
          icon={IndianRupee}
          value={stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
          label="Total earned"
          iconBg={colors.blueBg}
          iconColor={colors.blue}
          onPress={() => onMetricPress('earnings')}
        />
        <KpiCard
          icon={Star}
          value={stats.reviewCount > 0 ? String(stats.reviewCount) : '—'}
          label="Reviews"
          iconBg={colors.amberBg}
          iconColor={colors.amberInk}
        />
        <KpiCard
          icon={Clock}
          value={String(stats.activeJobs)}
          label="Active now"
          iconBg={colors.secondarySoft}
          iconColor={colors.secondaryDark}
          onPress={() => onMetricPress('active')}
        />
      </View>

      <ReportsSectionCard title="Operational metrics" hint="Attendance, visits & job completion · tap for details">
        {analytics ? (
          <AttendanceAnalyticsCard analytics={analytics} stats={stats} onMetricPress={onMetricPress} />
        ) : (
          <Text style={styles.emptyHint}>Attendance data will appear once this technician checks in.</Text>
        )}
      </ReportsSectionCard>

      <ReportsSectionCard title="Weekly trends" hint={`Jobs, earnings & attendance · ${monthLabel}`}>
        {jobsTrend.length > 0 ? (
          <>
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
          </>
        ) : (
          <Text style={styles.emptyHint}>No completed jobs in {monthLabel} yet.</Text>
        )}
        {attendanceTrend.length > 0 ? (
          <AttendanceTrendChart
            title="Attendance by week"
            subtitle={monthLabel}
            data={attendanceTrend}
            onBarPress={(index) => onMetricPress('week_attendance', index)}
          />
        ) : null}
      </ReportsSectionCard>

      {statusBreakdown.length > 0 ? (
        <ReportsSectionCard title="Job pipeline" hint={`${monthLabel} · this technician's bookings`}>
          <StatusPipelineCard
            hideTitle
            items={statusBreakdown}
            periodLabel={`Counts for ${monthLabel}`}
            onStatusPress={(status) => onMetricPress(statusKeyToMetric(status))}
          />
        </ReportsSectionCard>
      ) : null}

      {jobVisits.length > 0 ? (
        <ReportsSectionCard title="Job visit log" hint="Scheduled and completed visits">
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
        </ReportsSectionCard>
      ) : null}

      {reviews.length > 0 ? (
        <ReportsSectionCard title="Recent reviews" hint="Customer ratings and comments">
          {reviews.map((r) => (
            <TechnicianReviewCard key={r.id} stars={r.stars} comment={r.comment} tags={r.tags} />
          ))}
        </ReportsSectionCard>
      ) : null}

      <ReportsSectionCard
        title="Pending schedule queue"
        hint="All bookings awaiting admin confirmation (company-wide)"
        actionLabel="View all"
        onAction={() => router.push('/(admin)/bookings?status=pending')}
      >
        <View style={styles.pendingKpiRow}>
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
            label={`This month`}
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
      </ReportsSectionCard>
    </View>
  );
}

const TAB_BAR_PAD = 96;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: TAB_BAR_PAD },
  toolbarCard: {
    marginHorizontal: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...shadows.card,
  },
  toolbarGold: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  toolbarTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.forest,
  },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  pendingKpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
});
