import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
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
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PremiumMeshBg } from '@/components/kit/PremiumMeshBg';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, spacing } from '@/constants/theme';

type Phase = 'detecting' | 'found' | 'denied';

const { height: H } = Dimensions.get('window');
const LIME = colors.limeBright;
const FALLBACK_TRUST = ['Verified pros', 'Eco-safe', 'On-time'];

export function LocationLaunchScreen({
  brandName,
  tagline = 'Trusted pest control & home services',
  trustChips,
  cityLabel,
  areaLabel,
  phase,
  onContinue,
}: {
  brandName: string;
  tagline?: string;
  trustChips?: string[];
  cityLabel?: string;
  areaLabel?: string;
  phase: Phase;
  onContinue?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const trustLine = (trustChips?.length ? trustChips : FALLBACK_TRUST).slice(0, 3).join('  ·  ');

  const stageIn = useRef(new Animated.Value(0)).current;
  const brandIn = useRef(new Animated.Value(0)).current;
  const lineIn = useRef(new Animated.Value(0)).current;
  const footIn = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0.16)).current;
  const statusFade = useRef(new Animated.Value(1)).current;
  const progressLoop = useRef<Animated.CompositeAnimation | null>(null);
  const ringLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(stageIn, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(120, [
        Animated.timing(brandIn, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lineIn, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(footIn, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [brandIn, breathe, footIn, lineIn, stageIn]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(statusFade, { toValue: 0.28, duration: 90, useNativeDriver: true }),
      Animated.timing(statusFade, { toValue: 1, duration: 340, useNativeDriver: true }),
    ]).start();

    progressLoop.current?.stop();
    ringLoop.current?.stop();
    ringPulse.setValue(0);

    if (phase === 'detecting') {
      progressLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 0.78,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0.26,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );
      progressLoop.current.start();

      ringLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringPulse, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      ringLoop.current.start();
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }

    return () => {
      progressLoop.current?.stop();
      ringLoop.current?.stop();
    };
  }, [phase, progress, ringPulse, statusFade]);

  const sheenStyle = useMemo(
    () => ({
      opacity: stageIn.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    }),
    [stageIn],
  );

  const markStyle = {
    opacity: brandIn,
    transform: [
      { translateY: brandIn.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.022] }) },
    ],
  };
  const titleStyle = {
    opacity: lineIn,
    transform: [{ translateY: lineIn.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
  const footStyle = {
    opacity: footIn,
    transform: [{ translateY: footIn.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  };
  const pulseRingStyle = {
    opacity: ringPulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.45, 0.28, 0] }),
    transform: [{ scale: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.38] }) }],
  };
  const progressW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const statusTitle =
    phase === 'found' && cityLabel
      ? cityLabel
      : phase === 'denied'
        ? 'Continue without GPS'
        : 'Finding your area';

  const statusBody =
    phase === 'found'
      ? areaLabel || 'Trusted technicians ready nearby'
      : phase === 'denied'
        ? 'Choose your city anytime from home'
        : 'Matching eco-safe services near you';

  const StatusIcon =
    phase === 'found' ? AppIcons.ui.mapPin : phase === 'denied' ? AppIcons.ui.shieldCheck : AppIcons.ui.sparkles;

  return (
    <View style={styles.root}>
      <PremiumMeshBg variant="hero" />

      <Animated.View style={[styles.topSheen, sheenStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(2,24,12,0)', 'rgba(2,24,12,0.22)', 'rgba(2,24,12,0.62)']}
        locations={[0.28, 0.68, 1]}
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
            {phase === 'detecting' ? (
              <Animated.View style={[styles.pulseRing, pulseRingStyle]} pointerEvents="none" />
            ) : null}
            <View style={styles.halo} />
            <LinearGradient
              colors={['rgba(255,255,255,0.5)', 'rgba(143,208,60,0.62)', 'rgba(48,184,79,0.2)']}
              locations={[0, 0.48, 1]}
              start={{ x: 0.12, y: 0 }}
              end={{ x: 0.92, y: 1 }}
              style={styles.markRing}
            >
              <View style={styles.markInner}>
                <LinearGradient
                  colors={[colors.white, '#F3FAEE']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <BrandLogo size={118} animate={false} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.brandBlock, titleStyle]}>
            <Text style={styles.brand}>{brandName}</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>{tagline}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, footStyle]}>
          <Animated.View style={[styles.statusBlock, { opacity: statusFade }]}>
            <View style={styles.statusKickerRow}>
              <PremiumIcon
                icon={StatusIcon}
                variant="plain"
                size={13}
                color={LIME}
                strokeWidth={2.3}
              />
              <Text style={styles.statusKicker}>
                {phase === 'found' ? 'SERVING' : phase === 'denied' ? 'READY WHEN YOU ARE' : 'LOCATING'}
              </Text>
            </View>
            <Text style={styles.statusTitle} numberOfLines={1}>
              {statusTitle}
            </Text>
            <Text style={styles.statusBody} numberOfLines={2}>
              {statusBody}
            </Text>
          </Animated.View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressW }]}>
              <LinearGradient
                colors={['#C8F07A', LIME, colors.green]}
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
                colors={['#B4E85A', LIME, colors.green]}
                locations={[0, 0.42, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueBtn}
              >
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Text style={styles.trustLine}>{trustLine}</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.deep, overflow: 'hidden' },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.28,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.46,
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
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  markWrap: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: 'rgba(143,208,60,0.55)',
  },
  halo: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(143,208,60,0.14)',
  },
  markRing: {
    width: 156,
    height: 156,
    borderRadius: 44,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInner: {
    width: 148,
    height: 148,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.36,
    shadowRadius: 28,
    elevation: 16,
  },
  brandBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: 12,
  },
  brand: {
    fontFamily: fonts.brand,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.5,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 16,
  },
  brandRule: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: LIME,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    gap: 16,
    paddingBottom: 2,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 6,
  },
  statusKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: LIME,
  },
  statusTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: colors.white,
    textAlign: 'center',
  },
  statusBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(234,246,227,0.7)',
    textAlign: 'center',
    maxWidth: 300,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trustLine: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.46)',
    textAlign: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },
  continueBtn: {
    borderRadius: premium.radiusButton,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: LIME,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  continueText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.15,
    color: colors.white,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
