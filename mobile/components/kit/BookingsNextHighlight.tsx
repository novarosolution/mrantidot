import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName } from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function BookingsNextHighlight({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress?: () => void;
}) {
  const copy = useBookingCopy();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={['#14532D', '#1A6B3C']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.badge}>{copy.listNextVisitLabel}</Text>
        <View style={styles.row}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={22} color={colors.lime} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {bookingServiceName(booking)}
            </Text>
            <Text style={styles.schedule} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>
          <View style={styles.cta}>
            <ChevronRight size={18} color={colors.lime} strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 15, color: colors.white },
  schedule: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  cta: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
