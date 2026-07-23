import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
} from '@/lib/booking-helpers';
import { formatTimeAgo } from '@/lib/time-ago';
import type { Booking } from '@/types/api';
import { adminSurfaces, colors, fonts, premium, spacing } from '@/constants/theme';

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
      <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.edge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={styles.icon}>
        <PremiumIcon icon={AppIcons.ui.clock} variant="mint" size="sm" color={colors.forest} boxSize={40} />
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
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="md" color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    backgroundColor: adminSurfaces.card,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
  },
  pressed: { opacity: 0.88 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EEF8E6',
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  service: { fontFamily: fonts.displayExtra, fontSize: 14, color: '#0B2213', flex: 1, letterSpacing: -0.2 },
  age: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.forest,
    backgroundColor: '#EEF8E6',
    borderWidth: 1,
    borderColor: '#D8EDC8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
});
