import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
} from '@/lib/booking-helpers';
import { formatTimeAgo } from '@/lib/time-ago';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function PendingAnalyticsRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const isCustom = booking.scheduleMode === 'custom';
  const age = formatTimeAgo(booking.createdAt);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.icon}>
        <Clock size={16} color={colors.amberInk} />
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.service} numberOfLines={1}>
            {bookingServiceName(booking)}
          </Text>
          {age ? <Text style={styles.age}>{age}</Text> : null}
        </View>
        <Text style={styles.customer} numberOfLines={1}>
          {bookingCustomerName(booking)}
        </Text>
        <Text style={styles.schedule} numberOfLines={1}>
          {bookingScheduleDisplay(booking)}
        </Text>
        <View style={styles.badges}>
          <Text style={styles.badge}>{isCustom ? 'Custom time' : 'Standard window'}</Text>
          <Text style={styles.badgeConfirm}>Confirm schedule</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  service: { fontFamily: fonts.display, fontSize: 13.5, color: colors.ink, flex: 1 },
  age: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted },
  customer: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, marginTop: 2 },
  schedule: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    color: colors.amberInk,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeConfirm: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    color: colors.secondaryInk,
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
