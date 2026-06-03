import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BugMark } from '@/components/BugMark';
import { Button } from '@/components/ui/Button';
import { setOnboardingDone } from '@/lib/onboarding';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

const FALLBACK_SLIDES = [
  { title: 'Complete Hygiene Management', subtitle: 'Protect your home from pests with science-backed, eco-friendly treatments.' },
  { title: 'Book in Minutes', subtitle: 'Choose a service, pick a slot, and track your technician live.' },
  { title: 'Photo-Verified Jobs', subtitle: 'Every step is captured on camera with GPS for your peace of mind.' },
];

export default function OnboardingScreen() {
  const { content } = useAppContent();
  const slides = content.onboarding.slides.length > 0 ? content.onboarding.slides : FALLBACK_SLIDES;
  const chips = content.onboarding.trustChips.length > 0 ? content.onboarding.trustChips : ['Eco-Safe', 'Certified', '24/7'];
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, slides.length - 1);
  const slide = slides[safeIdx]!;

  async function finish() {
    await setOnboardingDone();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[...gradients.premiumHero]} style={styles.hero}>
        <View style={styles.logo}>
          <BugMark size={46} />
        </View>
        <View style={styles.chips}>
          {chips.map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
      <View style={styles.body}>
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
          <Button title="Get Started" variant="premium" onPress={() => void finish()} style={{ marginTop: spacing.lg }} />
        )}
        <Pressable onPress={() => void finish()} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: design.screenBg },
  hero: {
    height: 300,
    borderBottomLeftRadius: premium.radiusCard,
    borderBottomRightRadius: premium.radiusCard,
    ...shadows.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: colors.white,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', gap: 7, position: 'absolute', bottom: 22 },
  chip: { backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { color: colors.white, fontSize: 10, fontFamily: fonts.bodySemi },
  body: { flex: 1, padding: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 28, backgroundColor: colors.secondaryDark },
  title: { fontFamily: fonts.displayExtra, fontSize: 24, textAlign: 'center', color: colors.ink, lineHeight: 30 },
  p: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', color: colors.muted, marginTop: 14, lineHeight: 22 },
  skip: { marginTop: spacing.md, alignSelf: 'center' },
  skipText: { fontFamily: fonts.bodySemi, color: colors.secondaryDark, fontSize: 13 },
});
