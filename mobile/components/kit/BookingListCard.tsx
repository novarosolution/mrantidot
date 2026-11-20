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
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { formatRupeeFull } from '@/components/kit/format';
import { colors, fonts, statusColors, ui } from '@/constants/theme';

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
  hintTone = 'status',
  compact,
}: {
  booking: Booking;
  onPress?: () => void;
  showCustomer?: boolean;
  hideAmount?: boolean;
  hint?: string;
  /** 'warning' paints the hint amber when it needs the customer's action. */
  hintTone?: 'status' | 'warning';
  compact?: boolean;
}) {
  const labels = useCustomerUiCopy();
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking);
  const customer = showCustomer ? bookingCustomerName(booking) : null;
  const accent = statusColors[booking.status]?.text ?? ui.brand;
  const accentBg = statusColors[booking.status]?.bg ?? colors.soft;
  const schedulePending = isSchedulePending(booking);
  const progress = stepProgress(booking);
  const isLive = booking.status === 'in_progress' || booking.status === 'awaiting_verification';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${bookingScheduleDisplay(booking)}`}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <ServiceIcon iconKey={iconKey} size={28} variant="premium" boxSize={52} />
            {isLive ? <View style={styles.liveDot} /> : null}
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
                {name}
              </Text>
              <StatusPill status={booking.status} />
            </View>

            {customer ? (
              <Text style={styles.customer} numberOfLines={1}>
                {customer}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Calendar size={12} color={ui.brand} strokeWidth={2.2} />
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {bookingScheduleDisplay(booking)}
              </Text>
            </View>

            {!compact && booking.address ? (
              <View style={styles.metaRow}>
                <View style={styles.metaIconMuted}>
                  <MapPin size={12} color={ui.textTertiary} strokeWidth={2.2} />
                </View>
                <Text style={styles.addr} numberOfLines={1}>
                  {booking.address}
                </Text>
              </View>
            ) : null}

            {progress !== null && isLive ? (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%`, backgroundColor: accent },
                  ]}
                />
              </View>
            ) : null}

            {schedulePending && !hint ? (
              <View style={[styles.callout, { backgroundColor: accentBg }]}>
                <Text style={[styles.calloutText, { color: accent }]}>{labels.bookingsTimeConfirming}</Text>
              </View>
            ) : null}
            {hint ? (
              <View style={[styles.callout, { backgroundColor: hintTone === 'warning' ? colors.amberBg : accentBg }]}>
                <Text style={[styles.calloutText, { color: hintTone === 'warning' ? colors.warning : accent }]}>{hint}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
          <View style={styles.footerRight}>
            {!hideAmount && booking.amount ? (
              <Text style={styles.total}>{formatRupeeFull(booking.amount.total)}</Text>
            ) : hideAmount && booking.techEarning != null ? (
              <Text style={styles.total}>{formatRupeeFull(booking.techEarning)}</Text>
            ) : null}
            <View style={styles.chevron}>
              <ChevronRight size={16} color={ui.brand} strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  inner: { minWidth: 0 },
  top: { flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 12 },
  iconWrap: { position: 'relative' },
  liveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.limeBright,
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
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: ui.text,
  },
  customer: {
    marginTop: 3,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: ui.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaIconMuted: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: ui.text,
  },
  addr: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: ui.textSecondary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: ui.surfaceMuted,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  callout: {
    marginTop: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  calloutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    backgroundColor: ui.surfaceMuted,
  },
  ref: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    letterSpacing: 0.3,
    color: ui.textTertiary,
  },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  total: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    letterSpacing: -0.35,
    color: ui.brand,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
