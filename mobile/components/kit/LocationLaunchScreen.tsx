import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, MapPin, Navigation } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

type Phase = 'detecting' | 'found' | 'denied';

export function LocationLaunchScreen({
  brandName,
  cityLabel,
  areaLabel,
  phase,
  onContinue,
}: {
  brandName: string;
  cityLabel?: string;
  areaLabel?: string;
  phase: Phase;
  onContinue?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const mapDrift = useRef(new Animated.Value(0)).current;
  const pinDrop = useRef(new Animated.Value(0)).current;
  const pinBounce = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const statusFade = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mapDrift, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(mapDrift, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [mapDrift]);

  useEffect(() => {
    Animated.spring(pinDrop, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinBounce, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pinBounce, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pinBounce, pinDrop]);

  useEffect(() => {
    function pulseLoop(v: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    }
    pulseLoop(pulse1, 0).start();
    pulseLoop(pulse2, 400).start();
    pulseLoop(pulse3, 800).start();
  }, [pulse1, pulse2, pulse3]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(statusFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(statusFade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [phase, cityLabel, statusFade]);

  useEffect(() => {
    if (phase === 'found') {
      Animated.spring(checkScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    } else {
      checkScale.setValue(0);
    }
  }, [checkScale, phase]);

  const driftX = mapDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const driftY = mapDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const pinY = pinDrop.interpolate({ inputRange: [0, 1], outputRange: [-72, 0] });
  const pinLift = pinBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  function ringStyle(v: Animated.Value) {
    const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 2.4] });
    const opacity = v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.45, 0.28, 0] });
    return { transform: [{ scale }], opacity };
  }

  const headline =
    phase === 'found' && cityLabel
      ? `Serving ${cityLabel}`
      : phase === 'denied'
        ? 'Location access off'
        : 'Finding your location…';

  const subline =
    phase === 'found'
      ? areaLabel || (cityLabel ? `Home services in ${cityLabel}` : 'Services near you')
      : phase === 'denied'
        ? 'You can still browse — we will use your saved city when available'
        : 'Pinpointing services near you';

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.mapLayer, { transform: [{ translateX: driftX }, { translateY: driftY }] }]}>
        <View style={styles.mapBase} />
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridH, { top: i * 56 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridV, { left: i * 64 }]} />
        ))}
        <View style={[styles.road, styles.roadA]} />
        <View style={[styles.road, styles.roadB]} />
      </Animated.View>

      <LinearGradient
        colors={['rgba(14,58,32,0.05)', 'rgba(14,58,32,0.55)', 'rgba(14,58,32,0.92)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.brandRow}>
          <BrandLogo size={40} />
          <Text style={styles.brand}>{brandName}</Text>
        </View>

        <View style={styles.mapFocus}>
          {[pulse1, pulse2, pulse3].map((p, i) => (
            <Animated.View key={i} style={[styles.pulseRing, ringStyle(p)]} />
          ))}
          <View style={styles.pinShadow} />
          <Animated.View style={{ transform: [{ translateY: pinY }, { translateY: pinLift }] }}>
            <View style={[styles.pinBubble, phase === 'found' && styles.pinBubbleFound]}>
              {phase === 'found' ? (
                <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                  <Check size={28} color={colors.forest} strokeWidth={3} />
                </Animated.View>
              ) : phase === 'denied' ? (
                <Navigation size={26} color={colors.white} strokeWidth={2.2} />
              ) : (
                <MapPin size={28} color={colors.white} fill={colors.forest} strokeWidth={1.5} />
              )}
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.statusBlock, { opacity: statusFade }]}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subline}>{subline}</Text>
          {phase === 'found' && cityLabel ? (
            <View style={styles.foundPill}>
              <MapPin size={12} color={colors.lime} />
              <Text style={styles.foundPillText}>{areaLabel ? `${areaLabel} · ${cityLabel}` : cityLabel}</Text>
            </View>
          ) : null}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, (phase === 'found' || phase === 'denied') && i === 2 && styles.dotActive]} />
            ))}
          </View>
          {phase === 'denied' && onContinue ? (
            <Pressable style={({ pressed }) => [styles.continueBtn, pressed && styles.continuePressed]} onPress={onContinue}>
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={styles.bottomGlow}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#DDE8E0', overflow: 'hidden' },
  mapLayer: { ...StyleSheet.absoluteFill },
  mapBase: { ...StyleSheet.absoluteFill, backgroundColor: '#E4EBE6' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(20,83,45,0.06)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(20,83,45,0.06)' },
  road: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 2 },
  roadA: { width: '120%', height: 10, top: '38%', left: '-10%', transform: [{ rotate: '-12deg' }] },
  roadB: { width: 10, height: '70%', left: '62%', top: '10%', transform: [{ rotate: '8deg' }] },
  content: { flex: 1, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  brand: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.white, letterSpacing: -0.3 },
  mapFocus: { alignSelf: 'center', width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(168,224,78,0.55)',
    backgroundColor: 'rgba(168,224,78,0.08)',
  },
  pinShadow: {
    position: 'absolute',
    bottom: 58,
    width: 36,
    height: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(14,58,32,0.22)',
  },
  pinBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  pinBubbleFound: { backgroundColor: colors.lime },
  statusBlock: { paddingHorizontal: spacing.xl, alignItems: 'center', gap: 8 },
  headline: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  foundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.35)',
  },
  foundPillText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lime },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: colors.lime, width: 18 },
  continueBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.lime,
  },
  continuePressed: { opacity: 0.9 },
  continueText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.forest },
  bottomGlow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', opacity: 0.35 },
});
