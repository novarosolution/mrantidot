import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingCustomerName,
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceName,
} from '@/lib/booking-helpers';
import {
  formatBookingDuration,
  formatVisitTime,
  jobVisitStatus,
  visitBadgeTone,
  visitStatusLabel,
} from '@/lib/job-visit-helpers';
import { localDateKey } from '@/lib/dates';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

function visitAccent(tone: BadgeTone): string {
  const map: Partial<Record<BadgeTone, string>> = {
    success: colors.green,
    info: colors.blue,
    warning: colors.amberInk,
    danger: colors.error,
    neutral: colors.muted,
  };
  return map[tone] ?? colors.green;
}

export function JobVisitCard({
  booking,
  onPress,
  today = localDateKey(),
}: {
  booking: Booking;
  onPress?: () => void;
  today?: string;
}) {
  const visitStatus = jobVisitStatus(booking, today);
  const tone = visitBadgeTone(visitStatus) as BadgeTone;
  const duration = formatBookingDuration(booking);

  const startedLabel =
    booking.workStartedAt ? formatVisitTime(booking.workStartedAt) : 'Not started';
  const stoppedLabel = booking.workCompletedAt
    ? formatVisitTime(booking.workCompletedAt)
    : visitStatus === 'in_progress'
      ? 'In progress'
      : '—';

  const content = (
    <View style={styles.cardWrap}>
      <View style={[styles.accent, { backgroundColor: visitAccent(tone) }]} />
      <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
        <View style={styles.badges}>
          <StatusBadge label={visitStatusLabel(visitStatus)} tone={tone} />
          <StatusPill status={booking.status} />
        </View>
      </View>
      <Text style={styles.svc}>{bookingServiceName(booking)}</Text>
      <Text style={styles.meta}>
        {bookingCustomerName(booking)} · {bookingScheduleDisplay(booking)}
      </Text>
      <View style={styles.times}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Came to job</Text>
          <Text style={styles.timeVal}>{startedLabel}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Stopped job</Text>
          <Text style={styles.timeVal}>{stoppedLabel}</Text>
        </View>
        {duration ? (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={styles.timeVal}>{duration}</Text>
          </View>
        ) : null}
      </View>
      {booking.address ? (
        <Text style={styles.addr} numberOfLines={1}>
          {booking.address}
        </Text>
      ) : null}
      </Card>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.wrap}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  cardWrap: { flexDirection: 'row', borderRadius: premium.radiusCard, overflow: 'hidden', ...shadows.floating },
  accent: { width: 4 },
  card: { flex: 1, padding: spacing.md, borderRadius: 0, shadowOpacity: 0, elevation: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  ref: { fontFamily: fonts.displayExtra, fontSize: 11, color: colors.secondaryDark },
  svc: { fontFamily: fonts.display, fontSize: 14, marginTop: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  times: { marginTop: spacing.sm, gap: 6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  timeLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  timeVal: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, flex: 1, textAlign: 'right' },
  addr: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 8 },
});
