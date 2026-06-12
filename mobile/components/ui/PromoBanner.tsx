import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import type { HomePromo } from '@/types/api';
import { colors, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

const DEFAULT_PROMO: HomePromo = {
  badge: 'Limited offer',
  title: 'Book pest control today',
  ctaLabel: 'Explore',
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
  if (!p?.title?.trim()) return null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient colors={[...gradients.premiumHero]} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.glow} />
        <View style={styles.content}>
          {p.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{p.badge}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{p.title}</Text>
          {p.ctaLabel ? (
            <View style={styles.ctaRow}>
              <Text style={styles.ctaLabel}>{p.ctaLabel}</Text>
              <View style={styles.ctaIcon}>
                <ArrowRight size={14} color={colors.forest} strokeWidth={2.5} />
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.mark}>
          <BrandLogo size={56} animate={false} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  banner: {
    borderRadius: premium.radiusCard,
    padding: spacing.md + 4,
    paddingRight: 92,
    overflow: 'hidden',
    minHeight: 112,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.15)',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168,224,78,0.15)',
  },
  content: { zIndex: 1, gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: premium.accentGoldBg,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.35)',
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: premium.accentGold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 25,
    color: colors.white,
    letterSpacing: -0.3,
    maxWidth: '92%',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ctaLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.lime,
  },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -30,
    opacity: 0.95,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
});
