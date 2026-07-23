import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/BrandLogo';
import { fonts, spacing } from '@/constants/theme';

type Phase = 'detecting' | 'found' | 'denied';

const { width: W, height: H } = Dimensions.get('window');
const DEEP = '#02180C';
const FOREST = '#0A6423';
const LIME = '#8FD03C';

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

  const stageIn = useRef(new Animated.Value(0)).current;
  const brandIn = useRef(new Animated.Value(0)).current;
  const lineIn = useRef(new Animated.Value(0)).current;
  const footIn = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const ray = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0.18)).current;
  const statusFade = useRef(new Animated.Value(1)).current;
  const progressLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(stageIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(110, [
        Animated.timing(brandIn, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lineIn, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(footIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 6800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 6800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(ray, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ).start();
  }, [brandIn, breathe, drift, footIn, lineIn, ray, stageIn]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(statusFade, { toValue: 0.35, duration: 100, useNativeDriver: true }),
      Animated.timing(statusFade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();

    progressLoop.current?.stop();

    if (phase === 'detecting') {
      progressLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 0.72,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0.28,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );
      progressLoop.current.start();
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }

    return () => {
      progressLoop.current?.stop();
    };
  }, [phase, progress, statusFade]);

  const markStyle = {
    opacity: brandIn,
    transform: [
      { translateY: brandIn.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) },
      { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.028] }) },
    ],
  };
  const titleStyle = {
    opacity: lineIn,
    transform: [{ translateY: lineIn.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  };
  const footStyle = {
    opacity: footIn,
    transform: [{ translateY: footIn.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  };
  const orbA = {
    opacity: stageIn,
    transform: [
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
      { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
    ],
  };
  const orbB = {
    opacity: stageIn,
    transform: [
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
    ],
  };
  const orbC = {
    opacity: stageIn.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
    transform: [
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) },
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-6, 10] }) },
    ],
  };
  const rayStyle = {
    opacity: ray.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.22, 0.08] }),
    transform: [
      { translateX: ray.interpolate({ inputRange: [0, 1], outputRange: [-W * 0.28, W * 0.2] }) },
      { rotate: '22deg' },
    ],
  };
  const progressW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const statusTitle =
    phase === 'found' && cityLabel
      ? `Ready in ${cityLabel}`
      : phase === 'denied'
        ? 'Continue without GPS'
        : 'Finding your area';

  const statusBody =
    phase === 'found'
      ? areaLabel || 'Trusted technicians near you'
      : phase === 'denied'
        ? 'Set your city anytime from home'
        : 'Matching eco-safe services nearby';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A8734', FOREST, '#053A18', DEEP]}
        locations={[0, 0.28, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <Animated.View style={[styles.orbTop, orbA]} pointerEvents="none" />
      <Animated.View style={[styles.orbMid, orbC]} pointerEvents="none" />
      <Animated.View style={[styles.orbBottom, orbB]} pointerEvents="none" />
      <Animated.View style={[styles.ray, rayStyle]} pointerEvents="none" />

      <LinearGradient
        colors={['rgba(2,24,12,0)', 'rgba(2,24,12,0.18)', 'rgba(2,24,12,0.55)']}
        locations={[0.35, 0.7, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View
        style={[
          styles.stage,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
          },
        ]}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.markWrap, markStyle]}>
            <View style={styles.haloOuter} />
            <View style={styles.haloInner} />
            <LinearGradient
              colors={['rgba(255,255,255,0.42)', 'rgba(143,208,60,0.55)', 'rgba(48,184,79,0.18)']}
              locations={[0, 0.45, 1]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.markRing}
            >
              <View style={styles.markInner}>
                <LinearGradient
                  colors={['#FFFFFF', '#F4FBF0']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <BrandLogo size={124} animate={false} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.brandBlock, titleStyle]}>
            <Text style={styles.brand}>{brandName}</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>Premium pest control for home & business</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, footStyle]}>
          <Animated.View style={{ opacity: statusFade }}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            <Text style={styles.statusBody}>{statusBody}</Text>
          </Animated.View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressW }]}>
              <LinearGradient
                colors={['#B8E86A', LIME, '#27A747']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {phase === 'denied' && onContinue ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={({ pressed }) => [pressed && styles.pressed]}
              onPress={onContinue}
            >
              <LinearGradient
                colors={['#A8E04A', LIME, '#27A747']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueBtn}
              >
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Text style={styles.footNote}>Secure · Eco-safe · Verified technicians</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DEEP, overflow: 'hidden' },
  orbTop: {
    position: 'absolute',
    top: -H * 0.12,
    right: -W * 0.28,
    width: W * 0.9,
    height: W * 0.9,
    borderRadius: W * 0.45,
    backgroundColor: 'rgba(143,208,60,0.22)',
  },
  orbMid: {
    position: 'absolute',
    top: H * 0.28,
    left: -W * 0.35,
    width: W * 0.7,
    height: W * 0.7,
    borderRadius: W * 0.35,
    backgroundColor: 'rgba(48,184,79,0.14)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -H * 0.05,
    right: -W * 0.15,
    width: W * 0.78,
    height: W * 0.78,
    borderRadius: W * 0.39,
    backgroundColor: 'rgba(8,90,34,0.55)',
  },
  ray: {
    position: 'absolute',
    top: H * 0.08,
    left: W * 0.05,
    width: W * 0.48,
    height: H * 0.55,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.42,
  },
  stage: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl + 4,
    paddingBottom: spacing.lg,
  },
  markWrap: {
    width: 188,
    height: 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(143,208,60,0.16)',
  },
  haloInner: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  markRing: {
    width: 158,
    height: 158,
    borderRadius: 46,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInner: {
    width: 150,
    height: 150,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.38,
    shadowRadius: 32,
    elevation: 16,
  },
  brandBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 14,
  },
  brand: {
    fontFamily: fonts.brand,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 18,
  },
  brandRule: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: LIME,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.74)',
    textAlign: 'center',
    maxWidth: 290,
  },
  footer: {
    gap: 16,
    paddingBottom: 2,
  },
  statusTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.4,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusBody: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(234,246,227,0.72)',
    textAlign: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  footNote: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.35,
    color: 'rgba(255,255,255,0.48)',
    textAlign: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },
  continueBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: LIME,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  continueText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
