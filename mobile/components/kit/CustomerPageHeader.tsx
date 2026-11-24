import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { adminGoBack, safeGoBack } from '@/lib/routes';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { AppIcons } from '@/constants/appIcons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  colors,
  customerType,
  headerTopPad,
  radii,
  spacing,
  surfaces,
  typeScale,
  ui,
} from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

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
  const copy = useCustomerUiCopy();
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
          accessibilityRole="button"
          accessibilityLabel={copy.navBack}
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
          accessibilityRole="header"
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

  if (variant === 'premium' || variant === 'gradient') {
    // Urban-style white header — flat, dark type, plain back arrow; status bar flips to dark while focused.
    return (
      <View
        style={[
          styles.whiteWrap,
          { paddingTop: insets.top + 6, paddingBottom: overlapReserve ? spacing.xl + 24 : spacing.sm + 4 },
        ]}
      >
        <FocusStatusBar style="dark" />
        <PremiumAurora tone="light" base={false} />
        <View style={styles.whiteRow}>
          {showBack ? (
            <PressableScale
              scaleTo={0.92}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={copy.navBack}
              hitSlop={8}
            >
              <GlassSurface style={styles.whiteBack} intensity={30} tintOpacity={0.8}>
                <ArrowLeft size={20} color={ui.text} strokeWidth={2.2} />
              </GlassSurface>
            </PressableScale>
          ) : null}
          <View style={styles.textCol}>
            <Text style={showBack ? styles.whiteTitle : styles.whiteTitleLarge} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.whiteSub} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {rightAction ?? null}
        </View>
        {children}
        {/* Brand-green accent that fades out at both ends — replaces the flat hairline. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(21,148,71,0)', 'rgba(21,148,71,0.45)', 'rgba(143,208,60,0.45)', 'rgba(143,208,60,0)']}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.whiteAccent}
        />
      </View>
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
        colors={[colors.limeBright, colors.green]}
        style={styles.lightEdge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  whiteWrap: {
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.hairline,
  },
  whiteAccent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1.5 },
  whiteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  whiteBack: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Pushed screens: the title step; tab-level pages (no back button): the display step. */
  whiteTitle: { ...typeScale.title, color: ui.text },
  whiteTitleLarge: { ...typeScale.display, color: ui.text },
  whiteSub: { ...typeScale.caption, marginTop: 2, color: ui.textSecondary },
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
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.limeBright,
  },
  classicRuleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200,240,122,0.35)',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
});
