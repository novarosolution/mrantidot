import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
} from '@/lib/booking-helpers';
import { formatTimeAgo } from '@/lib/time-ago';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function PendingAnalyticsRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
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
        <Text style={styles.meta} numberOfLines={1}>
          {bookingCustomerName(booking)} · {bookingScheduleDisplay(booking)}
        </Text>
        <Text style={styles.badge}>Needs confirmation</Text>
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
    borderColor: 'rgba(20,83,45,0.07)',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  pressed: { opacity: 0.88 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  service: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, flex: 1 },
  age: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.amberInk,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
});
