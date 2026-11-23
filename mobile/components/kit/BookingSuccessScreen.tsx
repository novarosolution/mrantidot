import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { formatRupeeFull } from '@/components/kit/format';
import { getReducedMotion, useAmbientLoop } from '@/lib/a11yPrefs';
import { PressableScale } from '@/components/ui/PressableScale';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useAuth } from '@/context/AuthContext';
import { getCustomerTrackingSteps, useBookingCopy } from '@/lib/schedule-copy';
import { bookingDetailPath, customerRoutes, appReplace } from '@/lib/routes';
import { colors, fonts, premium, radii, spacing, typeScale, ui } from '@/constants/theme';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { haptic } from '@/lib/motion';

type ConfettiSpec = {
  left: `${number}%`;
  delay: number;
  color: string;
  w: number;
  h: number;
};

const CONFETTI: ConfettiSpec[] = [
  { left: '8%', delay: 0, color: colors.green, w: 7, h: 10 },
  { left: '18%', delay: 80, color: colors.amber, w: 6, h: 9 },
  { left: '28%', delay: 40, color: colors.green, w: 8, h: 11 },
  { left: '38%', delay: 120, color: colors.limeOnDark, w: 5, h: 8 },
  { left: '48%', delay: 20, color: colors.green, w: 7, h: 10 },
  { left: '58%', delay: 100, color: colors.amber, w: 6, h: 9 },
  { left: '68%', delay: 60, color: colors.green, w: 8, h: 12 },
  { left: '78%', delay: 140, color: colors.amber, w: 5, h: 8 },
  { left: '88%', delay: 30, color: colors.green, w: 7, h: 10 },
  { left: '14%', delay: 160, color: colors.limeOnDark, w: 6, h: 9 },
  { left: '44%', delay: 180, color: colors.green, w: 7, h: 10 },
  { left: '74%', delay: 200, color: colors.amber, w: 6, h: 9 },
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
    if (getReducedMotion()) return;
    const anim = Animated.sequence([
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
    ]);
    anim.start();
    return () => anim.stop();
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

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Check stroke inside the 96 pt disc; its length drives the draw (dasharray = length). */
const CHECK_PATH = 'M29 50 L42 63 L68 35';
const CHECK_LEN = 58;

/**
 * Success mark: the disc springs in, then the check is drawn stroke by stroke (react-native-svg
 * dash offset), then two soft rings pulse while the screen is visible. Reduce Motion shows it drawn.
 */
function SuccessCheckHero() {
  const reduced = getReducedMotion();
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const circle = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const draw = useRef(new Animated.Value(reduced ? 0 : CHECK_LEN)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (getReducedMotion()) return;
    const anim = Animated.sequence([
      Animated.spring(circle, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      // Dash offset is an SVG prop — not on the native driver, but it is a one-off 380 ms draw.
      Animated.timing(draw, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [circle, draw]);

  const pulse = (v: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
  useAmbientLoop(() => pulse(ring1, 600), [ring1]);
  useAmbientLoop(() => pulse(ring2, 900), [ring2]);
  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    [glow],
  );

  function ringStyle(v: Animated.Value) {
    return {
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] }) }],
    };
  }

  return (
    <View style={styles.heroWrap} accessible accessibilityRole="image">
      <Animated.View style={[styles.ring, ringStyle(ring1)]} />
      <Animated.View style={[styles.ring, styles.ring2, ringStyle(ring2)]} />
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
          },
        ]}
      />
      <Animated.View
        style={[styles.checkCircle, { transform: [{ scale: circle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] }]}
      >
        <View style={styles.checkGradient}>
          <Svg width={96} height={96} viewBox="0 0 96 96">
            <AnimatedPath
              d={CHECK_PATH}
              stroke={colors.white}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
              strokeDashoffset={draw}
            />
          </Svg>
        </View>
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

  // The check draws in ~350 ms — land the success haptic with it.
  useEffect(() => {
    const t = setTimeout(() => haptic('success'), 320);
    return () => clearTimeout(t);
  }, []);

  const refLabel = useMemo(() => {
    const tail = bookingId.replace(/-/g, '').slice(-6).toUpperCase();
    return `#${tail}`;
  }, [bookingId]);

  // The three steps after "request received" — same (admin-editable) labels as the booking timeline.
  const nextSteps = useMemo(
    () => getCustomerTrackingSteps('pending', false, bookingCopy).slice(1, 4),
    [bookingCopy],
  );

  function viewBooking() {
    appReplace(bookingDetailPath(user?.role, bookingId));
  }

  function goHome() {
    appReplace(customerRoutes.home);
  }

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <LinearGradient
        colors={[ui.brandSoft, 'rgba(234,244,236,0)']}
        style={styles.wash}
        pointerEvents="none"
      />
      {getReducedMotion() ? null : (
        <View style={styles.confettiLayer} pointerEvents="none">
          {CONFETTI.map((piece, index) => (
            <ConfettiPiece key={index} {...piece} />
          ))}
        </View>
      )}

      <SafeAreaView style={styles.safe} edges={['left', 'right', 'top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <SuccessCheckHero />

          <FadeSlideIn delay={180} slideFrom={16}>
            <View style={styles.titleBlock}>
              <Text style={styles.title} accessibilityRole="header">
                {bookingCopy.requestSubmittedToast}
              </Text>
              <Text style={styles.subtitle}>{bookingCopy.pendingCustomerHint}</Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={320} slideFrom={20}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{bookingCopy.successSummaryTitle}</Text>
              <SummaryRow label={bookingCopy.successLabelReference} value={refLabel} />
              <SummaryRow label={bookingCopy.successLabelService} value={serviceName} />
              <SummaryRow label={bookingCopy.successLabelVisit} value={schedule} />
              {paymentLabel ? <SummaryRow label={bookingCopy.successLabelPayment} value={paymentLabel} /> : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{bookingCopy.successLabelTotal}</Text>
                <Text style={styles.totalValue}>{formatRupeeFull(total)}</Text>
              </View>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={440} slideFrom={20}>
            <View style={[styles.card, styles.nextCard]}>
              <Text style={styles.cardTitle}>{bookingCopy.wizardNextStepsTitle}</Text>
              {nextSteps.map((st, i) => (
                <View key={st.title} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={[styles.stepDot, i === 0 && styles.stepDotNow]}>
                      <Text style={[styles.stepNum, i === 0 && styles.stepNumNow]}>{i + 1}</Text>
                    </View>
                    {i < nextSteps.length - 1 ? <View style={styles.stepLine} /> : null}
                  </View>
                  <Text style={[styles.stepText, i === 0 && styles.stepTextNow]}>{st.title}</Text>
                </View>
              ))}
            </View>
          </FadeSlideIn>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PressableScale style={styles.primary} onPress={viewBooking} haptic="tap" accessibilityRole="button">
            <Text style={styles.primaryText}>{bookingCopy.successViewBookingButton}</Text>
            <View style={styles.primaryArrow}>
              <ArrowRight size={15} color={ui.brand} strokeWidth={2.6} />
            </View>
          </PressableScale>
          <PressableScale style={styles.homeBtn} onPress={goHome} haptic="tap" accessibilityRole="button">
            <Text style={styles.homeText}>{bookingCopy.successHomeButton}</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  nextCard: { marginTop: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 40 },
  stepRail: { alignItems: 'center', width: 26 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotNow: { backgroundColor: ui.brand, borderColor: ui.brand },
  stepNum: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.textSecondary },
  stepNumNow: { color: colors.white },
  stepLine: { flex: 1, width: 2, minHeight: 14, marginVertical: 2, borderRadius: 1, backgroundColor: ui.border },
  stepText: { flex: 1, paddingTop: 3, fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.textSecondary },
  stepTextNow: { fontFamily: fonts.bodyBold, color: ui.text },
  primary: {
    height: 54,
    paddingLeft: 22,
    paddingRight: 8,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: ui.brand,
    ...ui.shadowFloat,
  },
  primaryText: { ...typeScale.button, color: colors.white },
  primaryArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    borderColor: ui.brand,
  },
  ring2: { width: 148, height: 148, borderRadius: 74 },
  glow: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: ui.brandSoft,
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
    backgroundColor: ui.brand,
  },
  titleBlock: { alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typeScale.title, color: ui.text, textAlign: 'center' },
  subtitle: {
    ...typeScale.body,
    color: ui.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.md + 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: ui.border,
  },
  cardTitle: { ...typeScale.label, color: ui.textTertiary, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ui.hairline,
  },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary },
  summaryValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: ui.text,
    flex: 1,
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
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  totalValue: { ...typeScale.priceLg, color: ui.text },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
  },
  homeText: { ...typeScale.button, fontSize: 14.5, color: ui.brand },
});
