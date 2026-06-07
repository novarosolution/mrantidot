import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, ChevronRight, Home } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useAuth } from '@/context/AuthContext';
import { useBookingCopy } from '@/lib/schedule-copy';
import { bookingDetailPath } from '@/lib/routes';
import { colors, fonts, premium, spacing } from '@/constants/theme';

type ConfettiSpec = {
  left: `${number}%`;
  delay: number;
  color: string;
  w: number;
  h: number;
};

const CONFETTI: ConfettiSpec[] = [
  { left: '8%', delay: 0, color: colors.lime, w: 7, h: 10 },
  { left: '18%', delay: 80, color: '#FFD166', w: 6, h: 9 },
  { left: '28%', delay: 40, color: colors.green, w: 8, h: 11 },
  { left: '38%', delay: 120, color: colors.white, w: 5, h: 8 },
  { left: '48%', delay: 20, color: colors.lime, w: 7, h: 10 },
  { left: '58%', delay: 100, color: '#FFD166', w: 6, h: 9 },
  { left: '68%', delay: 60, color: colors.green, w: 8, h: 12 },
  { left: '78%', delay: 140, color: colors.white, w: 5, h: 8 },
  { left: '88%', delay: 30, color: colors.lime, w: 7, h: 10 },
  { left: '14%', delay: 160, color: colors.green, w: 6, h: 9 },
  { left: '44%', delay: 180, color: '#FFD166', w: 7, h: 10 },
  { left: '74%', delay: 200, color: colors.lime, w: 6, h: 9 },
] as const;

function ConfettiPiece({
  left,
  delay,
  color,
  w,
  h,
}: ConfettiSpec) {
  const fall = useRef(new Animated.Value(-24)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(fall, {
          toValue: 520,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(spin, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          delay: 1900,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, drift, fall, opacity, spin]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        {
          left,
          width: w,
          height: h,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY: fall },
            {
              translateX: drift.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [-12, 14, -8],
              }),
            },
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '280deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function SuccessCheckHero() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const circle = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(circle, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.timing(check, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    function pulse(v: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    }
    pulse(ring1, 200).start();
    pulse(ring2, 500).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [check, circle, glow, ring1, ring2]);

  function ringStyle(v: Animated.Value) {
    return {
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
      transform: [
        {
          scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] }),
        },
      ],
    };
  }

  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.ring, ringStyle(ring1)]} />
      <Animated.View style={[styles.ring, styles.ring2, ringStyle(ring2)]} />
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
            transform: [
              {
                scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.checkCircle,
          {
            transform: [
              {
                scale: circle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
              },
            ],
          },
        ]}
      >
        <LinearGradient colors={[colors.lime, '#C5F066']} style={styles.checkGradient}>
          <Animated.View style={{ opacity: check, transform: [{ scale: check }] }}>
            <Check size={42} color={colors.forest} strokeWidth={3.2} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function BookingSuccessScreen({
  bookingId,
  serviceName,
  schedule,
  total,
  paymentLabel,
}: {
  bookingId: string;
  serviceName: string;
  schedule: string;
  total: number;
  paymentLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const bookingCopy = useBookingCopy();

  const refLabel = useMemo(() => {
    const tail = bookingId.replace(/-/g, '').slice(-6).toUpperCase();
    return `#${tail}`;
  }, [bookingId]);

  function viewBooking() {
    router.replace(bookingDetailPath(user?.role, bookingId) as never);
  }

  function goHome() {
    router.replace('/(customer)/' as never);
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F3D22', '#14532D', '#1A6B3C']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={styles.confettiLayer} pointerEvents="none">
        {CONFETTI.map((piece, index) => (
          <ConfettiPiece key={index} {...piece} />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['left', 'right', 'top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <SuccessCheckHero />

          <FadeSlideIn delay={180} slideFrom={16}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{bookingCopy.requestSubmittedToast}</Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={320} slideFrom={20}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Booking summary</Text>
              <SummaryRow label="Reference" value={refLabel} />
              <SummaryRow label="Service" value={serviceName} />
              <SummaryRow label="Requested visit" value={schedule} />
              {paymentLabel ? <SummaryRow label="Payment" value={paymentLabel} /> : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          </FadeSlideIn>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button title="View booking" onPress={viewBooking} variant="gold" />
          <Pressable style={({ pressed }) => [styles.homeBtn, pressed && styles.pressed]} onPress={goHome}>
            <Home size={16} color={colors.lime} />
            <Text style={styles.homeText}>Back to home</Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.forest },
  safe: { flex: 1 },
  confettiLayer: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  confetti: { position: 'absolute', top: 0, borderRadius: 2 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 168,
    marginBottom: spacing.sm,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(168,224,78,0.35)',
  },
  ring2: { width: 148, height: 148, borderRadius: 74 },
  glow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(168,224,78,0.22)',
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    ...premium.shadowSoft,
  },
  checkGradient: {
    flex: 1,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  titleBlock: { alignItems: 'center', marginBottom: spacing.lg },
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...premium.shadowSoft,
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,83,45,0.07)',
  },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, flex: 0.9 },
  summaryValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: colors.ink,
    flex: 1.2,
    textAlign: 'right',
    lineHeight: 19,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.forest },
  totalValue: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.forest },
  nextCard: {
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  nextTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  nextStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  nextIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.88)',
    flex: 1,
    lineHeight: 20,
    paddingTop: 6,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(15,61,34,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  homeText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.lime },
  pressed: { opacity: 0.88 },
});
