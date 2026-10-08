import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import {
  BadgeCheck,
  CalendarCheck,
  CircleX,
  Clock3,
  KeyRound,
  SprayCan,
  type LucideIcon,
} from 'lucide-react-native';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import {
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingStatusLabel,
} from '@/lib/booking-helpers';
import type { Booking, BookingStatus } from '@/types/api';
import { colors, fonts, spacing, surfaces, ui } from '@/constants/theme';

/** Status visual — icon + tint per stage (same palette as StatusPill). */
const STATUS_VISUAL: Record<BookingStatus, { icon: LucideIcon; bg: string; ink: string }> = {
  pending: { icon: Clock3, bg: colors.amberBg, ink: colors.amberInk },
  confirmed: { icon: CalendarCheck, bg: colors.blueBg, ink: colors.blue },
  in_progress: { icon: SprayCan, bg: colors.soft, ink: colors.forest },
  awaiting_verification: { icon: KeyRound, bg: surfaces.tintInfo, ink: colors.secondaryInk },
  completed: { icon: BadgeCheck, bg: colors.soft, ink: colors.forest },
  cancelled: { icon: CircleX, bg: colors.errorBg, ink: colors.error },
};

function formatAmount(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Booking status card — what is happening now and what comes next,
 * live treatment progress, and the service at a glance. Visit / address details live
 * in the "Booking details" section below so nothing is repeated.
 */
export function BookingDetailHero({
  booking,
  live,
  guidance,
  progress,
}: {
  booking: Booking;
  live?: boolean;
  guidance?: string;
  /** Treatment steps done / total — shown as a progress bar while the visit is live. */
  progress?: { done: number; total: number } | null;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const visual = STATUS_VISUAL[booking.status] ?? STATUS_VISUAL.pending;
  const StatusIcon = visual.icon;
  const hint = guidance?.trim();
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
  const service =
    booking.service && typeof booking.service === 'object'
      ? booking.service
      : { iconKey: bookingServiceIconKey(booking), serviceTypes: undefined };

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View style={styles.statusRow}>
        <View style={[styles.statusIcon, { backgroundColor: visual.bg }]}>
          <StatusIcon size={22} color={visual.ink} strokeWidth={2} />
        </View>
        <View style={styles.statusText}>
          <View style={styles.eyebrowRow}>
            {live ? (
              <View style={styles.liveDotWrap}>
                <Animated.View
                  style={[
                    styles.liveHalo,
                    {
                      transform: [{ scale: pulse }],
                      opacity: pulse.interpolate({ inputRange: [1, 1.7], outputRange: [0.45, 0] }),
                    },
                  ]}
                />
                <View style={styles.liveDot} />
              </View>
            ) : null}
            <Text style={[styles.eyebrow, live && styles.eyebrowLive]}>{live ? 'Happening now' : 'Booking status'}</Text>
          </View>
          <Text style={styles.statusTitle}>{bookingStatusLabel(booking.status)}</Text>
        </View>
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {pct != null && progress ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(pct, 4)}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              {progress.done} of {progress.total} treatment steps
            </Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.serviceRow}>
        <ServiceThumb service={service} width={52} radius={16} iconSize={26} />
        <View style={styles.serviceText}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {bookingServiceName(booking)}
          </Text>
          <Text style={styles.serviceMeta} numberOfLines={1}>
            {bookingScheduleDisplay(booking)}
          </Text>
        </View>
        {booking.amount?.total ? (
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amount}>{formatAmount(booking.amount.total)}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  eyebrowLive: { color: ui.brand },
  statusTitle: {
    marginTop: 2,
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.45,
    color: ui.text,
  },
  hint: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: ui.textSecondary,
  },
  progressBlock: { marginTop: 14 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: ui.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: ui.brand },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  progressPct: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: ui.brand },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  serviceText: { flex: 1, minWidth: 0 },
  serviceName: {
    fontFamily: fonts.display,
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: ui.text,
  },
  serviceMeta: { marginTop: 3, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  amountCol: { alignItems: 'flex-end' },
  amountLabel: { fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 0.6, color: ui.textTertiary },
  amount: { marginTop: 1, fontFamily: fonts.displayExtra, fontSize: 17, color: ui.text },
  liveDotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveHalo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
});
