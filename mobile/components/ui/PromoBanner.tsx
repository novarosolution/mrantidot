import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BugMark } from '@/components/BugMark';
import type { HomePromo } from '@/types/api';
import { colors, fonts, gradients, premium, radius, shadows, spacing } from '@/constants/theme';

const DEFAULT_PROMO: HomePromo = {
  badge: 'MR ANTIDOT · TRUSTED SERVICE',
  title: 'Book pest control & home services',
  ctaLabel: 'Book Now →',
  active: true,
};

export function PromoBanner({
  promo,
  onPress,
}: {
  promo?: HomePromo | null;
  onPress?: () => void;
}) {
  const p = promo?.active !== false ? { ...DEFAULT_PROMO, ...promo, active: true } : null;
  if (!p) return null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glow} />
        <View style={styles.content}>
          <Text style={styles.badge}>{p.badge}</Text>
          <Text style={styles.title}>{p.title}</Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{p.ctaLabel}</Text>
          </View>
        </View>
        <View style={styles.mark}>
          <BugMark size={56} color={colors.lime} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    overflow: 'hidden',
    minHeight: 132,
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  content: { maxWidth: '65%' },
  badge: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime, letterSpacing: 0.6 },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.white, marginTop: 8, lineHeight: 26 },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: premium.accentGoldBg,
    borderWidth: 1.5,
    borderColor: 'rgba(182,132,28,0.4)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 14,
    ...shadows.card,
  },
  ctaText: { fontFamily: fonts.display, fontSize: 13, color: premium.accentGold },
  mark: { position: 'absolute', right: 12, bottom: 8, opacity: 0.92 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});
