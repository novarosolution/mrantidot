import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/Button';
import { setOnboardingDone } from '@/lib/onboarding';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, gradients, spacing } from '@/constants/theme';

const FALLBACK_SLIDES = [
  { title: 'Pest-free home', subtitle: 'Professional treatments for your space.' },
  { title: 'Book in minutes', subtitle: 'Pick a service and schedule online.' },
  { title: 'Verified visits', subtitle: 'Track every job with photo proof.' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { content } = useAppContent();
  const slides = content.onboarding.slides.length > 0 ? content.onboarding.slides : FALLBACK_SLIDES;
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, slides.length - 1);
  const slide = slides[safeIdx]!;

  async function finish() {
    await setOnboardingDone();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glow} />
        <BrandLogo size={88} />
      </LinearGradient>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === safeIdx && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.p}>{slide.subtitle}</Text>
        {safeIdx < slides.length - 1 ? (
          <Button title="Next" variant="premium" onPress={() => setIdx((i) => i + 1)} style={{ marginTop: spacing.lg }} />
        ) : (
          <Button title="Get started" variant="premium" onPress={() => void finish()} style={{ marginTop: spacing.lg }} />
        )}
        <Pressable onPress={() => void finish()} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: design.screenBg },
  hero: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,224,78,0.1)',
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 28, backgroundColor: colors.green },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    textAlign: 'center',
    color: colors.ink,
    lineHeight: 30,
  },
  p: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    color: colors.muted,
    marginTop: 14,
    lineHeight: 22,
  },
  skip: { marginTop: spacing.md, alignSelf: 'center' },
  skipText: { fontFamily: fonts.bodySemi, color: colors.forest, fontSize: 13 },
});
