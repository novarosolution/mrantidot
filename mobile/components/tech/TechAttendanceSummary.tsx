import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { fillCopy } from '@/constants/customerUiCopy';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { formatDuration } from '@/lib/job-visit-helpers';
import { motion } from '@/lib/motion';
import type { TechnicianAnalytics } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

function Metric({ value, label, tint }: { value: string; label: string; tint?: string }) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label}, ${value}`}>
      <Text style={[styles.metricValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.metricLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/** Month attendance (rate bar + day counts) and visit performance, for the technician profile. */
export function TechAttendanceSummary({ analytics }: { analytics: TechnicianAnalytics }) {
  const copy = useCustomerUiCopy();
  const reduced = useReducedMotion();
  const rate = Math.max(0, Math.min(100, Math.round(analytics.attendanceRate || 0)));
  const fill = useRef(new Animated.Value(reduced ? rate / 100 : 0)).current;

  useEffect(() => {
    if (reduced) {
      fill.setValue(rate / 100);
      return;
    }
    const anim = Animated.spring(fill, { toValue: rate / 100, ...motion.spring, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [fill, rate, reduced]);

  const avgVisit =
    analytics.avgVisitMinutes != null && analytics.avgVisitMinutes > 0 ? formatDuration(analytics.avgVisitMinutes) : '—';
  const onTime = analytics.onTimeRate != null ? `${analytics.onTimeRate}%` : '—';

  return (
    <View style={styles.card}>
      <View style={styles.rateRow} accessible accessibilityLabel={`${copy.techAttRate}, ${rate}%`}>
        <Text style={styles.rateLabel}>{copy.techAttRate}</Text>
        <Text style={styles.rateValue}>{rate}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { transform: [{ scaleX: fill }] }]} />
      </View>

      <View style={styles.grid}>
        <Metric value={String(analytics.daysPresent)} label={copy.techAttPresent} tint={ui.brand} />
        <Metric value={String(analytics.daysAbsent)} label={copy.techDutyAbsent} tint={colors.error} />
        <Metric value={String(analytics.daysLeave ?? 0)} label={copy.techAttLeave} tint={colors.blue} />
      </View>

      <View style={styles.divider} />

      <View style={styles.grid}>
        <Metric value={String(analytics.jobsStarted ?? 0)} label={copy.techAttStarted} />
        <Metric value={String(analytics.jobsCompleted)} label={copy.techAttCompleted} />
        <Metric value={onTime} label={copy.techAttOnTime} />
        <Metric value={avgVisit} label={copy.techAttAvgVisit} />
      </View>

      <Text style={styles.meta}>
        {fillCopy(copy.techAttSummary, { done: analytics.jobsCompleted, scheduled: analytics.jobsScheduled })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rateLabel: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: ui.textTertiary },
  rateValue: { fontFamily: fonts.displayExtra, fontSize: 26, letterSpacing: -0.5, color: ui.brand },
  track: { height: 8, marginTop: 8, borderRadius: 4, backgroundColor: ui.brandSoft, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: ui.brand, transformOrigin: 'left' },
  grid: { flexDirection: 'row', marginTop: spacing.md },
  metric: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  metricValue: { fontFamily: fonts.displayExtra, fontSize: 18, color: ui.text },
  metricLabel: { marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, lineHeight: 15, textAlign: 'center', color: ui.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border, marginTop: spacing.md },
  meta: { marginTop: spacing.md, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, textAlign: 'center' },
});
