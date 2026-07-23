import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import { bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName } from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import type { Booking } from '@/types/api';
import { colors, customerType, gradients, premium, spacing } from '@/constants/theme';

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
        colors={[...gradients.premiumHero]}
        style={styles.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.orb} pointerEvents="none" />
        <View style={styles.orbB} pointerEvents="none" />
        <LinearGradient
          colors={['rgba(143,208,60,0.22)', 'transparent']}
          style={styles.topSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.top}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{copy.listNextVisitLabel}</Text>
          </View>
          <View style={styles.schedulePill}>
            <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size={11} color="#8FD03C" strokeWidth={2.2} />
            <Text style={styles.schedulePillText} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>
              {bookingServiceName(booking)}
            </Text>
            <Text style={styles.hint}>Tap to view live status & details</Text>
          </View>
          <LinearGradient colors={[...gradients.goldBar]} style={styles.cta}>
            <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={16} color="#043813" strokeWidth={2.5} />
          </LinearGradient>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.985 }] },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(143,208,60,0.22)',
    ...premium.shadowSoft,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
  orb: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(143,208,60,0.16)',
  },
  orbB: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(143,208,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(143,208,60,0.32)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...customerType.pillLabel,
    color: '#8FD03C',
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    maxWidth: '58%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  schedulePillText: {
    ...customerType.trustChip,
    fontSize: 11,
    flexShrink: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: {
    ...customerType.cardTitleLight,
    fontSize: 16,
    lineHeight: 21,
  },
  hint: {
    ...customerType.pageSubtitleMuted,
    marginTop: 4,
    color: 'rgba(255,255,255,0.62)',
  },
  cta: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
