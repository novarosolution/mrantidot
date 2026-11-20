import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, BadgeCheck, Camera, CircleCheckBig, Clock3, Leaf, MapPin, ShieldCheck, UserCheck } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { FloatingPest } from '@/components/kit/auth/AuthBrandArt';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { setOnboardingDone } from '@/lib/onboarding';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { authRoutes, appReplace } from '@/lib/routes';
import type { LucideIcon } from 'lucide-react-native';

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

const ART_KEYS = ['spray', 'map', 'shield'] as const;
type ArtKey = (typeof ART_KEYS)[number];

/** CMS slide icon → illustration (unknown icons fall back by position). */
function artFor(icon: string | undefined, index: number): ArtKey {
  if (icon === 'map' || icon === 'shield' || icon === 'spray') return icon;
  if (icon === 'sparkles') return 'shield';
  return ART_KEYS[index % ART_KEYS.length]!;
}

/** Small white pill floating over the art — "Technician assigned ✓". */
function FloatChip({ icon: Icon, label, style }: { icon: LucideIcon; label: string; style: object }) {
  return (
    <View style={[styles.chip, style]}>
      <View style={styles.chipIcon}>
        <Icon size={13} color={ui.brand} strokeWidth={2.4} />
      </View>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

/** Pulsing brand disc with an icon — centre of the tracking / guarantee art. */
function CenterBadge({ icon: Icon }: { icon: LucideIcon }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.badgeWrap}>
      <Animated.View
        style={[
          styles.badgePulse,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
          },
        ]}
      />
      <View style={styles.badge}>
        <Icon size={46} color={colors.white} strokeWidth={1.9} />
      </View>
    </View>
  );
}

function SlideArt({ art, size }: { art: ArtKey; size: number }) {
  const copy = useCustomerUiCopy();
  const r = size / 2;
  if (art === 'spray') {
    return (
      <View style={[styles.artCircle, { width: size, height: size, borderRadius: r }]}>
        <FloatingPest source={SERVICE_TYPE_IMAGES.general} size={size * 0.52} style={styles.centerPest} delay={0} />
        <FloatingPest source={SERVICE_TYPE_IMAGES.cockroach} size={size * 0.26} delay={120} tilt={-14} style={[styles.pestDisc, { top: 6, left: 2 }]} />
        <FloatingPest source={SERVICE_TYPE_IMAGES.mosquito} size={size * 0.24} delay={240} tilt={10} style={[styles.pestDisc, { top: 18, right: -4 }]} />
        <FloatingPest source={SERVICE_TYPE_IMAGES.termite} size={size * 0.24} delay={360} tilt={-6} style={[styles.pestDisc, { bottom: 10, left: -6 }]} />
        <FloatingPest source={SERVICE_TYPE_IMAGES.rodent} size={size * 0.26} delay={480} tilt={8} style={[styles.pestDisc, { bottom: 0, right: 6 }]} />
      </View>
    );
  }
  if (art === 'map') {
    return (
      <View style={[styles.artCircle, { width: size, height: size, borderRadius: r }]}>
        <View style={[styles.ring, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36 }]} />
        <CenterBadge icon={MapPin} />
        <FloatChip icon={UserCheck} label={copy.onboardChipExpert} style={{ top: size * 0.08, left: -18 }} />
        <FloatChip icon={Clock3} label={copy.onboardChipArriving} style={{ top: size * 0.44, right: -26 }} />
        <FloatChip icon={Camera} label={copy.onboardChipPhoto} style={{ bottom: size * 0.06, left: 0 }} />
      </View>
    );
  }
  return (
    <View style={[styles.artCircle, { width: size, height: size, borderRadius: r }]}>
      <View style={[styles.ring, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36 }]} />
      <CenterBadge icon={ShieldCheck} />
      <FloatChip icon={Leaf} label={copy.onboardChipEco} style={{ top: size * 0.1, right: -14 }} />
      <FloatChip icon={BadgeCheck} label={copy.onboardChipVerified} style={{ top: size * 0.42, left: -26 }} />
      <FloatChip icon={CircleCheckBig} label={copy.onboardChipGuarantee} style={{ bottom: size * 0.06, right: -8 }} />
    </View>
  );
}

/** First-run intro — swipeable illustrated slides on white (Urban-style onboarding). */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const slides = content.onboarding.slides.length > 0 ? content.onboarding.slides : FALLBACK_SLIDES;
  const brandName = content.branding?.name || 'Mr Antidot';
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [idx, setIdx] = useState(0);
  const last = idx >= slides.length - 1;
  const artSize = Math.min(width - 96, height * 0.36, 300);

  async function finish() {
    await setOnboardingDone();
    appReplace(authRoutes.login);
  }

  function next() {
    if (last) {
      void finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (idx + 1) * width, animated: true });
    setIdx(idx + 1);
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx) setIdx(Math.max(0, Math.min(slides.length - 1, i)));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      <FocusStatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={30} animate={false} />
          <Text style={styles.brandName}>{brandName}</Text>
        </View>
        {!last ? (
          <Pressable onPress={() => void finish()} hitSlop={12} accessibilityRole="button" style={({ pressed }) => [styles.skip, pressed && styles.pressedLight]}>
            <Text style={styles.skipText}>{copy.onboardSkip}</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {slides.map((slide, i) => (
          <View key={`${slide.title}-${i}`} style={[styles.page, { width }]}>
            <View style={styles.artArea}>
              <SlideArt art={artFor(slide.icon, i)} size={artSize} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: scrollX.interpolate({ inputRange, outputRange: [8, 26, 8], extrapolate: 'clamp' }),
                  backgroundColor: scrollX.interpolate({
                    inputRange,
                    outputRange: [ui.border, ui.brand, ui.border],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
        >
          <Text style={styles.primaryText}>{last ? copy.onboardGetStarted : copy.onboardNext}</Text>
          <ArrowRight size={18} color={colors.white} strokeWidth={2.4} />
        </Pressable>
        <Pressable onPress={() => void finish()} hitSlop={8} accessibilityRole="button" style={styles.signInRow}>
          <Text style={styles.signInText}>
            {copy.authHaveAccount} <Text style={styles.signInLink}>{copy.authSignInLink}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontFamily: fonts.brand, fontSize: 18, letterSpacing: -0.4, color: ui.text },
  skip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: ui.surfaceMuted },
  skipText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  pressedLight: { opacity: 0.7 },
  pager: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  artArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  artCircle: { backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center' },
  centerPest: { position: 'relative', backgroundColor: colors.white, borderColor: colors.white },
  pestDisc: { backgroundColor: colors.white, borderColor: colors.white, ...ui.shadow, shadowOpacity: 0.1 },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(10,100,35,0.12)', borderStyle: 'dashed' },
  badgeWrap: { alignItems: 'center', justifyContent: 'center' },
  badgePulse: { position: 'absolute', width: 104, height: 104, borderRadius: 52, backgroundColor: ui.brand },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ui.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.white,
    ...ui.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: ui.text },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: ui.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: ui.textSecondary,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 20 },
  dot: { height: 8, borderRadius: 4 },
  actions: { paddingHorizontal: spacing.lg, gap: 14 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: ui.brand,
    shadowColor: ui.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryPressed: { opacity: 0.9 },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },
  signInRow: { alignSelf: 'center', paddingVertical: 4 },
  signInText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.textSecondary },
  signInLink: { fontFamily: fonts.bodyBold, color: ui.brand },
});
