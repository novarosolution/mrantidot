import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, ChevronRight } from 'lucide-react-native';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  isBookingLive,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';

/** Pulsing "live" dot while a technician is on site. */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.liveDotWrap}>
      <Animated.View
        style={[
          styles.liveHalo,
          { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.5, 0] }) },
        ]}
      />
      <View style={styles.liveDot} />
    </View>
  );
}

/** "Your next visit" — the customer's soonest active booking, one tap from home. */
export function HomeNextVisitCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const service =
    booking.service && typeof booking.service === 'object'
      ? booking.service
      : { iconKey: bookingServiceIconKey(booking), serviceTypes: undefined };
  const live = isBookingLive(booking.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Your next visit: ${bookingServiceName(booking)}, ${bookingScheduleDisplay(booking)}`}
    >
      <View style={styles.top}>
        <ServiceThumb service={service} width={54} radius={16} iconSize={28} />
        <View style={styles.body}>
          <View style={styles.eyebrowRow}>
            {live ? <LiveDot /> : null}
            <Text style={[styles.eyebrow, live && styles.eyebrowLive]}>{live ? 'Happening now' : 'Your next visit'}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {bookingServiceName(booking)}
          </Text>
          <View style={styles.whenRow}>
            <CalendarClock size={13} color={ui.textSecondary} strokeWidth={2.1} />
            <Text style={styles.when} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <StatusPill status={booking.status} />
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{live ? 'Track live' : 'View details'}</Text>
          <ChevronRight size={16} color={ui.brand} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  body: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  eyebrowLive: { color: ui.brand },
  name: {
    marginTop: 3,
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: ui.text,
  },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  when: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
  liveDotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveHalo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
});
