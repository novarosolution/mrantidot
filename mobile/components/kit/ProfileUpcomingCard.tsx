import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName, bookingStatusLabel } from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors } from '@/constants/theme';

export function ProfileUpcomingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const statusColor = statusColors[booking.status]?.text ?? colors.lime;

  return (
    <Pressable style={({ pressed }) => [styles.wrap, pressed && styles.pressed]} onPress={onPress}>
      <LinearGradient colors={['#14532D', '#0E3A20']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.glow} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Calendar size={14} color={colors.lime} />
            <Text style={styles.headerLabel}>Upcoming visit</Text>
          </View>
          <View style={[styles.statusPill, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{bookingStatusLabel(booking.status)}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={26} color={colors.lime} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {bookingServiceName(booking)}
            </Text>
            <Text style={styles.schedule}>{bookingScheduleDisplay(booking)}</Text>
            <Text style={styles.address} numberOfLines={1}>
              {booking.address}
            </Text>
          </View>
          <View style={styles.cta}>
            <ChevronRight size={18} color={colors.forest} strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168,224,78,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime, letterSpacing: 0.4, textTransform: 'uppercase' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 10 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.white, lineHeight: 21 },
  schedule: { fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  address: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  cta: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
