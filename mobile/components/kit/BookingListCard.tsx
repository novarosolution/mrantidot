import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronRight, MapPin } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingCustomerName,
  isSchedulePending,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors, typography } from '@/constants/theme';

function stepProgress(booking: Booking): number | null {
  const steps = booking.steps ?? [];
  if (steps.length === 0) return null;
  return steps.filter((s) => s.status === 'done').length / steps.length;
}

export const BookingListCard = memo(function BookingListCard({
  booking,
  onPress,
  showCustomer,
  hideAmount,
  hint,
  compact,
}: {
  booking: Booking;
  onPress?: () => void;
  showCustomer?: boolean;
  hideAmount?: boolean;
  hint?: string;
  compact?: boolean;
}) {
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking);
  const customer = showCustomer ? bookingCustomerName(booking) : null;
  const accent = statusColors[booking.status]?.text ?? colors.green;
  const accentBg = statusColors[booking.status]?.bg ?? colors.soft;
  const schedulePending = isSchedulePending(booking);
  const progress = stepProgress(booking);
  const isLive = booking.status === 'in_progress' || booking.status === 'awaiting_verification';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: accentBg }]}>
          <ServiceIcon iconKey={iconKey} size={22} color={accent} />
          {isLive ? <View style={[styles.liveDot, { backgroundColor: accent }]} /> : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
              {name}
            </Text>
            <StatusPill status={booking.status} />
          </View>

          {customer ? <Text style={styles.customer}>{customer}</Text> : null}

          <View style={styles.metaRow}>
            <Calendar size={12} color={colors.forest} />
            <Text style={styles.meta} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>

          {!compact ? (
            <View style={styles.metaRow}>
              <MapPin size={12} color={colors.muted} />
              <Text style={styles.addr} numberOfLines={1}>
                {booking.address}
              </Text>
            </View>
          ) : null}

          {progress !== null && isLive ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accent }]} />
            </View>
          ) : null}

          {schedulePending ? (
            <View style={[styles.callout, { backgroundColor: accentBg }]}>
              <Text style={[styles.calloutText, { color: accent }]}>Pending schedule</Text>
            </View>
          ) : null}
          {hint ? (
            <View style={[styles.callout, { backgroundColor: accentBg }]}>
              <Text style={[styles.calloutText, { color: accent }]}>{hint}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
            {!hideAmount && booking.amount ? (
              <Text style={styles.total}>₹{booking.amount.total}</Text>
            ) : null}
          </View>
        </View>

        <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 20,
  },
  customer: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  meta: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, flex: 1 },
  addr: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, flex: 1 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  callout: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  calloutText: { fontFamily: fonts.bodySemi, fontSize: 10 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ref: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, letterSpacing: 0.3 },
  total: { ...typography.price, fontSize: 16 },
});
