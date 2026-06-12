import { LinearGradient } from 'expo-linear-gradient';
import { safeGoBack } from '@/lib/routes';
import { ChevronLeft } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, classic, fonts, gradients, headerTopPad, premium, radius, shadows, spacing, surfaces } from '@/constants/theme';

type Variant = 'gradient' | 'light' | 'premium';

export function CustomerPageHeader({
  title,
  subtitle,
  showBack,
  variant = 'light',
  rightAction,
  overlapReserve,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  variant?: Variant;
  rightAction?: ReactNode;
  /** Extra bottom padding so a floating panel can overlap the hero. */
  overlapReserve?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const padTop = headerTopPad(insets.top);

  const content = (
    <View style={[styles.row, { paddingTop: padTop }]}>
      {showBack ? (
        <Pressable
          onPress={() => safeGoBack()}
          style={[styles.backBtn, (variant === 'gradient' || variant === 'premium') && styles.backBtnOnGradient]}
        >
          <ChevronLeft color={variant === 'gradient' || variant === 'premium' ? colors.white : colors.ink} size={20} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.textCol}>
        <Text style={[styles.title, (variant === 'gradient' || variant === 'premium') && styles.titleOnGradient, variant === 'premium' && styles.titlePremium]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, (variant === 'gradient' || variant === 'premium') && styles.subOnGradient]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightAction ?? <View style={styles.backSpacer} />}
    </View>
  );

  if (variant === 'gradient' || variant === 'premium') {
    return (
      <LinearGradient
        colors={variant === 'premium' ? [...gradients.premiumHero] : [...gradients.header]}
        style={[
          styles.gradientWrap,
          variant === 'premium' && styles.premiumWrap,
          { paddingBottom: overlapReserve ? spacing.xl + 24 : spacing.md },
        ]}
      >
        {variant === 'premium' ? <View style={styles.heroGlow} /> : null}
        {content}
        {children}
        {variant === 'premium' ? <View style={styles.classicRule}><View style={styles.classicRuleGold} /><View style={styles.classicRuleLine} /></View> : null}
      </LinearGradient>
    );
  }

  return (
    <View style={styles.lightWrap}>
      {content}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientWrap: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
  },
  premiumWrap: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.hero,
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168,224,78,0.1)',
  },
  lightWrap: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  backBtnOnGradient: {
    backgroundColor: surfaces.glassDark,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  backSpacer: { width: 40 },
  textCol: { flex: 1 },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.ink },
  titlePremium: { fontSize: 22 },
  titleOnGradient: { color: colors.white },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  subOnGradient: { color: colors.lime },
  classicRule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  classicRuleGold: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: premium.accentGold,
  },
  classicRuleLine: {
    flex: 1,
    height: 1,
    backgroundColor: classic.headerGoldLine,
  },
});
