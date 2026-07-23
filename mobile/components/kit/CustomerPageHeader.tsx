import { LinearGradient } from 'expo-linear-gradient';
import { adminGoBack, safeGoBack } from '@/lib/routes';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  classic,
  customerType,
  gradients,
  headerTopPad,
  premium,
  radius,
  spacing,
  surfaces,
} from '@/constants/theme';

type Variant = 'gradient' | 'light' | 'premium';

export function CustomerPageHeader({
  title,
  subtitle,
  showBack,
  variant = 'premium',
  rightAction,
  overlapReserve,
  backFallback,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  variant?: Variant;
  rightAction?: ReactNode;
  /** Extra bottom padding so a floating panel can overlap the hero. */
  overlapReserve?: boolean;
  /** When set, back uses admin/custom fallback instead of customer home. */
  backFallback?: string;
  onBack?: () => void;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const padTop = headerTopPad(insets.top);
  const onDark = variant === 'gradient' || variant === 'premium';

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (backFallback) {
      adminGoBack(backFallback);
      return;
    }
    safeGoBack();
  }

  const content = (
    <View style={[styles.row, { paddingTop: padTop }]}>
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            onDark ? styles.backBtnOnDark : styles.backBtnLight,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <PremiumIcon
            icon={AppIcons.ui.chevronLeft}
            variant="plain"
            color={onDark ? colors.white : colors.forest}
            size={20}
            strokeWidth={2.4}
          />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <View style={styles.textCol}>
        <Text
          style={[styles.title, onDark ? styles.titleOnDark : styles.titleLight]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.sub, onDark ? styles.subOnDark : styles.subLight]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ?? <View style={styles.backSpacer} />}
    </View>
  );

  if (variant === 'premium') {
    return (
      <HeroDarkSlice
        style={styles.premiumShell}
        contentStyle={[
          styles.premiumContent,
          { paddingBottom: overlapReserve ? spacing.xl + 28 : spacing.md + 10 },
        ]}
        sliceHeight={22}
      >
        {content}
        {children}
        <View style={styles.classicRule}>
          <View style={styles.classicRuleGold} />
          <View style={styles.classicRuleLine} />
        </View>
      </HeroDarkSlice>
    );
  }

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={[...gradients.header]}
        style={[
          styles.gradientWrap,
          { paddingBottom: overlapReserve ? spacing.xl + 28 : spacing.md + 6 },
        ]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        {content}
        {children}
        <View style={styles.classicRule}>
          <View style={styles.classicRuleGold} />
          <View style={styles.classicRuleLine} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.lightWrap,
        { paddingBottom: overlapReserve ? spacing.xl + 20 : spacing.sm + 4 },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.86)', 'rgba(247,250,244,0.62)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {content}
      {children}
      <LinearGradient
        colors={['#8FD03C', '#27A747']}
        style={styles.lightEdge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  premiumShell: {
    overflow: 'hidden',
  },
  premiumContent: {
    paddingHorizontal: spacing.md,
  },
  gradientWrap: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  lightWrap: {
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
    overflow: 'hidden',
    backgroundColor: surfaces.glass,
  },
  lightEdge: {
    height: 2.5,
    marginTop: spacing.sm,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnLight: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  backBtnOnDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  backSpacer: { width: 42 },
  textCol: { flex: 1, minWidth: 0 },
  title: { ...customerType.pageTitleCompact },
  titleLight: { color: colors.ink, fontSize: 22 },
  titleOnDark: { color: colors.white, fontSize: 22, letterSpacing: -0.45 },
  sub: { marginTop: 2 },
  subLight: { ...customerType.pageSubtitleMuted },
  subOnDark: { ...customerType.pageSubtitle },
  classicRule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  classicRuleGold: {
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: premium.accentGold,
  },
  classicRuleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: classic.headerGoldLine,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
});
