import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { IndianRupee, MapPin } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingStatusLabel,
  bookingStatusMessage,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors, typography } from '@/constants/theme';

export function BookingDetailHero({
  booking,
  live,
}: {
  booking: Booking;
  live?: boolean;
}) {
  const palette = statusColors[booking.status] ?? statusColors.pending;
  const guidance = bookingStatusMessage(booking.status);
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);

  const cardStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={cardStyle}>
        <LinearGradient
          colors={['#14532D', '#0E3A20']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.glow} />
          <View style={styles.goldLine} />
          <View style={styles.top}>
            <View style={styles.icon}>
              <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={28} color={colors.lime} />
            </View>
            <View style={styles.info}>
              <Text style={styles.service} numberOfLines={2}>
                {bookingServiceName(booking)}
              </Text>
              <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
            </View>
            {live ? (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            ) : (
              <StatusPill status={booking.status} />
            )}
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Visit</Text>
              <Text style={styles.schedule}>{bookingScheduleDisplay(booking)}</Text>
            </View>
            {booking.amount?.total ? (
              <View style={styles.amountChip}>
                <IndianRupee size={12} color={colors.lime} />
                <Text style={styles.amount}>{booking.amount.total}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.addressRow}>
            <MapPin size={13} color="rgba(255,255,255,0.55)" />
            <Text style={styles.address} numberOfLines={2}>
              {booking.address}
            </Text>
          </View>

          <View style={[styles.statusBanner, { backgroundColor: palette.bg }]}>
            <Text style={[styles.statusLabel, { color: palette.text }]}>{bookingStatusLabel(booking.status)}</Text>
            {guidance ? <Text style={[styles.statusHint, { color: palette.text }]}>{guidance}</Text> : null}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: 'rgba(182,132,28,0.5)',
    borderRadius: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  info: { flex: 1, minWidth: 0 },
  service: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.white,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  ref: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(168,224,78,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.35)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  liveText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailItem: { flex: 1 },
  detailLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  schedule: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.lime,
    marginTop: 4,
  },
  amountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.25)',
  },
  amount: {
    ...typography.price,
    fontSize: 16,
    color: colors.lime,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
  },
  address: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
  },
  statusBanner: {
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 14,
  },
  statusLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  statusHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
    lineHeight: 17,
  },
});
