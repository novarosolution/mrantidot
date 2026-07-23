import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { useAppContent } from '@/context/AppContentContext';
import { setOnboardingDone } from '@/lib/onboarding';
import { colors, customerType, fonts, premium, spacing, surfaces } from '@/constants/theme';
import { authRoutes, appReplace } from '@/lib/routes';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FALLBACK_SLIDES = [
  {
    title: 'Pest control made simple',
    subtitle: 'Book trusted professionals for your home or business in seconds.',
    icon: 'spray',
  },
  {
    title: 'Track every step',
    subtitle: 'Follow your technician live from visit start to photo proof.',
    icon: 'map',
  },
  {
    title: 'Guaranteed results',
    subtitle: 'Eco-safe treatments backed by our satisfaction promise.',
    icon: 'shield',
  },
];

const SLIDE_ICONS: Record<string, LucideIcon> = {
  spray: AppIcons.ui.bug,
  map: AppIcons.ui.mapPin,
  shield: AppIcons.ui.shieldCheck,
  sparkles: AppIcons.ui.sparkles,
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { content } = useAppContent();
  const slides = content.onboarding.slides.length > 0 ? content.onboarding.slides : FALLBACK_SLIDES;
  const brandName = content.branding?.name || 'Mr Antidot';

  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, slides.length - 1);
  const slide = slides[safeIdx]!;
  const Icon = SLIDE_ICONS[slide.icon ?? 'spray'] ?? AppIcons.ui.bug;

  const drift = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(1)).current;
  const heroEnter = useRef(new Animated.Value(0)).current;
  const markPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroEnter, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(markPulse, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(markPulse, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [drift, heroEnter, markPulse]);

  useEffect(() => {
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [safeIdx, contentAnim]);

  const orbA = useMemo(
    () => ({
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
      ],
    }),
    [drift],
  );
  const orbB = useMemo(
    () => ({
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
      ],
    }),
    [drift],
  );

  async function finish() {
    await setOnboardingDone();
    appReplace(authRoutes.login);
  }

  function next() {
    if (safeIdx < slides.length - 1) setIdx((i) => i + 1);
    else void finish();
  }

  const heroOpacity = {
    opacity: heroEnter,
    transform: [{ translateY: heroEnter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
  const sheetOpacity = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#146B2E', '#0A6423', '#032910']}
        locations={[0, 0.5, 1]}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      >
        <Animated.View style={[styles.glowA, orbA]} />
        <Animated.View style={[styles.glowB, orbB]} />
        <View style={styles.beam} />

        <Animated.View style={[styles.heroInner, heroOpacity]}>
          <Animated.View
            style={{
              transform: [
                { scale: markPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
              ],
            }}
          >
            <LinearGradient
              colors={['rgba(143,208,60,0.55)', 'rgba(48,184,79,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoRing}
            >
              <View style={styles.logoInner}>
                <BrandLogo size={88} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.brand}>{brandName}</Text>
          <Text style={styles.brandTag}>Premium pest control & home care</Text>
        </Animated.View>
      </LinearGradient>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + spacing.md }]}>
        <View style={styles.handle} />

        <Animated.View style={[styles.sheetBody, sheetOpacity]}>
          <View style={styles.visualWrap}>
            <View style={styles.visualCard}>
              <PremiumIcon
                icon={Icon}
                variant="ring"
                size={30}
                color={colors.forest}
                strokeWidth={2.1}
                boxSize={72}
              />
              <Text style={styles.stepLabel}>
                Step {safeIdx + 1} of {slides.length}
              </Text>
            </View>
          </View>

          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === safeIdx && styles.dotActive]} />
            ))}
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        <View style={styles.actions}>
          <Button
            title={safeIdx < slides.length - 1 ? 'Next' : 'Get started'}
            variant="premium"
            onPress={next}
          />
          <Pressable onPress={() => void finish()} style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#032910' },
  hero: {
    minHeight: SCREEN_H * 0.4,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowA: {
    position: 'absolute',
    top: -SCREEN_H * 0.05,
    right: -SCREEN_W * 0.14,
    width: SCREEN_W * 0.58,
    height: SCREEN_W * 0.58,
    borderRadius: SCREEN_W * 0.29,
    backgroundColor: 'rgba(143,208,60,0.18)',
  },
  glowB: {
    position: 'absolute',
    bottom: SCREEN_H * 0.01,
    left: -SCREEN_W * 0.18,
    width: SCREEN_W * 0.48,
    height: SCREEN_W * 0.48,
    borderRadius: SCREEN_W * 0.24,
    backgroundColor: 'rgba(48,184,79,0.14)',
  },
  beam: {
    position: 'absolute',
    top: SCREEN_H * 0.08,
    left: SCREEN_W * 0.18,
    width: SCREEN_W * 0.42,
    height: SCREEN_H * 0.22,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ rotate: '16deg' }],
  },
  heroInner: { alignItems: 'center', width: '100%', gap: 12 },
  logoRing: {
    width: 118,
    height: 118,
    borderRadius: 36,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoInner: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fonts.brand,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: colors.white,
    textAlign: 'center',
  },
  brandTag: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -30,
    backgroundColor: surfaces.glassSheet,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg + 2,
    paddingTop: spacing.sm + 2,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: surfaces.glassBorderStrong,
    ...premium.shadowSoft,
    shadowOffset: { width: 0, height: -8 },
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(143,208,60,0.45)',
    marginBottom: spacing.md + 2,
  },
  sheetBody: { flex: 1 },
  visualWrap: { marginBottom: spacing.md + 2 },
  visualCard: {
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    backgroundColor: surfaces.glassInput,
    paddingVertical: spacing.lg + 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 132,
  },
  stepLabel: {
    ...customerType.kicker,
    color: colors.forest,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: surfaces.glassBorderStrong,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.green,
  },
  title: {
    ...customerType.sectionTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...customerType.sectionSubtitle,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: spacing.sm,
  },
  actions: {
    gap: 12,
    paddingTop: spacing.md,
  },
  skip: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 },
  skipPressed: { opacity: 0.7 },
  skipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.forest,
  },
});
