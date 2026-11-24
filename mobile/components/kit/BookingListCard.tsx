import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react-native';
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
import { fillCopy } from '@/constants/customerUiCopy';
import { formatRupeeFull } from '@/components/kit/format';
import { colors, fonts, radii, statusColors, typeScale, ui } from '@/constants/theme';

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
  /** Receives the booking, so a list can pass one stable callback and keep cards memoised. */
  onPress?: (booking: Booking) => void;
  showCustomer?: boolean;
  hideAmount?: boolean;
  hint?: string;
  /** 'warning' paints the hint amber when it needs the customer's action. */
  hintTone?: 'status' | 'warning';
  compact?: boolean;
}) {
  const labels = useCustomerUiCopy();
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking, labels);
  const when = bookingScheduleDisplay(booking, labels);
  const customer = showCustomer ? bookingCustomerName(booking) : null;
  const accent = statusColors[booking.status]?.text ?? ui.brand;
  const accentBg = statusColors[booking.status]?.bg ?? colors.soft;
  const schedulePending = isSchedulePending(booking);
  const progress = stepProgress(booking);
  const isLive = booking.status === 'in_progress' || booking.status === 'awaiting_verification';

  return (
    <PressableScale
      onPress={onPress ? () => onPress(booking) : undefined}
      disabled={!onPress}
      scaleTo={0.985}
      containerStyle={styles.cardWrap}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${when}`}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <ServiceIcon iconKey={iconKey} size={36} variant="premium" boxSize={56} />
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
                {when}
              </Text>
            </View>

            {booking.visitContact ? (
              <View style={styles.forChip}>
                <Users size={11} color={ui.brand} strokeWidth={2.4} />
                <Text style={styles.forChipText} numberOfLines={1}>
                  {fillCopy(labels.bookingForChip, { name: booking.visitContact.name })}
                </Text>
              </View>
            ) : null}

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
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  cardWrap: { marginBottom: 12 },
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
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
  name: { ...typeScale.rowTitleLg, flex: 1, fontFamily: fonts.display, color: ui.text },
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
  forChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  forChipText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.brand },
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
