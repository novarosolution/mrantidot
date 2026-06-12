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
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, typography } from '@/constants/theme';

export function BookingDetailHero({
  booking,
  live,
  overlap,
  guidance,
}: {
  booking: Booking;
  live?: boolean;
  overlap?: boolean;
  guidance?: string;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const isDark = Boolean(live);

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

  const statusLabel = bookingStatusLabel(booking.status);
  const hint = guidance?.trim();

  const topRow = (
    <View style={styles.top}>
      <View style={[styles.icon, !isDark && styles.iconLight]}>
        <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={28} color={isDark ? colors.lime : colors.lime} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.service, !isDark && styles.serviceLight]} numberOfLines={2}>
          {bookingServiceName(booking)}
        </Text>
        <Text style={[styles.ref, !isDark && styles.refLight]}>{bookingRef(booking.id)}</Text>
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
  );

  const detailRow = (
    <View style={[styles.detailRow, !isDark && styles.detailRowLight]}>
      <View style={styles.detailItem}>
        <Text style={[styles.detailLabel, !isDark && styles.detailLabelLight]}>Visit</Text>
        <Text style={[styles.schedule, !isDark && styles.scheduleLight]}>{bookingScheduleDisplay(booking)}</Text>
      </View>
      {booking.amount?.total ? (
        <View style={[styles.amountChip, !isDark && styles.amountChipLight]}>
          <IndianRupee size={12} color={isDark ? colors.lime : colors.forest} />
          <Text style={[styles.amount, !isDark && styles.amountLight]}>{booking.amount.total}</Text>
        </View>
      ) : null}
    </View>
  );

  const addressRow = (
    <View style={styles.addressRow}>
      <MapPin size={13} color={isDark ? 'rgba(255,255,255,0.55)' : colors.muted} />
      <Text style={[styles.address, !isDark && styles.addressLight]} numberOfLines={2}>
        {booking.address}
      </Text>
    </View>
  );

  const statusBanner = hint ? (
    <View style={[styles.statusBanner, isDark ? styles.statusBannerDark : styles.statusBannerLight]}>
      <Text style={[styles.statusLabel, isDark ? styles.statusLabelDark : styles.statusLabelLight]}>{statusLabel}</Text>
      <Text style={[styles.statusHint, isDark ? styles.statusHintDark : styles.statusHintLight]}>{hint}</Text>
    </View>
  ) : null;

  return (
    <View style={[styles.wrap, overlap && styles.wrapOverlap]}>
      <Animated.View style={cardStyle}>
        {isDark ? (
          <LinearGradient
            colors={['#14532D', '#0E3A20']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.glow} />
            <View style={styles.goldLine} />
            {topRow}
            {detailRow}
            {addressRow}
            {statusBanner}
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#FFFFFF', '#F6FAF7']}
            style={[styles.card, styles.cardLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            {topRow}
            {detailRow}
            {addressRow}
            {statusBanner}
          </LinearGradient>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  wrapOverlap: {
    marginTop: -28,
    zIndex: 2,
  },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.hero,
  },
  cardLight: {
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.floating,
  },
  goldBar: {
    height: 3,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
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
  iconLight: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  info: { flex: 1, minWidth: 0 },
  service: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.white,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  serviceLight: { color: colors.ink },
  ref: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  refLight: { color: colors.muted },
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
  detailRowLight: { borderTopColor: colors.border },
  detailItem: { flex: 1 },
  detailLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailLabelLight: { color: colors.muted },
  schedule: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.lime,
    marginTop: 4,
  },
  scheduleLight: { color: colors.forest },
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
  amountChipLight: {
    backgroundColor: colors.soft,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  amount: {
    ...typography.price,
    fontSize: 16,
    color: colors.lime,
  },
  amountLight: { color: colors.forest },
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
  addressLight: { color: colors.muted },
  statusBanner: {
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 14,
  },
  statusBannerDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusBannerLight: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
  },
  statusLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  statusLabelDark: { color: colors.lime },
  statusLabelLight: { color: colors.forest },
  statusHint: { fontFamily: fonts.body, fontSize: 12, marginTop: 4, lineHeight: 17 },
  statusHintDark: { color: 'rgba(255,255,255,0.85)' },
  statusHintLight: { color: colors.muted },
});
