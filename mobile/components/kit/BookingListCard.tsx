import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import { bookingCustomerName, bookingRef, bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName, isSchedulePending } from '@/lib/booking-helpers';
import type { Booking, BookingStatus } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors, typography } from '@/constants/theme';

function statusAccent(status: BookingStatus): string {
  return statusColors[status]?.text ?? colors.green;
}

export function BookingListCard({
  booking,
  onPress,
  showCustomer,
  hideAmount,
  hint,
}: {
  booking: Booking;
  onPress?: () => void;
  showCustomer?: boolean;
  /** Technician view — hide pricing (customer billing). */
  hideAmount?: boolean;
  hint?: string;
}) {
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking);
  const customer = showCustomer ? bookingCustomerName(booking) : null;

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: statusAccent(booking.status) }]} />
        <View style={styles.cardInner}>
        <View style={styles.topRow}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={iconKey} size={21} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            {customer ? <Text style={styles.customer}>{customer}</Text> : null}
            <Text style={styles.meta}>{bookingScheduleDisplay(booking)}</Text>
            {isSchedulePending(booking) ? (
              <Text style={styles.hint}>Awaiting schedule confirmation</Text>
            ) : null}
            <Text style={styles.addr} numberOfLines={1}>
              {booking.address}
            </Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            {booking.status === 'awaiting_verification' && !hint ? (
              <Text style={styles.hint}>Tap to verify photos</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.pillRow}>
          <StatusPill status={booking.status} />
        </View>
        <View style={styles.footer}>
          <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
          {!hideAmount && booking.amount ? (
            <Text style={styles.total}>₹{booking.amount.total}</Text>
          ) : null}
        </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    ...shadows.floating,
  },
  accent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  customer: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  addr: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted, marginTop: 3 },
  hint: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.secondaryDark, marginTop: 4 },
  pillRow: { marginTop: 10, alignSelf: 'flex-start' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ref: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  total: { ...typography.price, fontSize: 16 },
});
