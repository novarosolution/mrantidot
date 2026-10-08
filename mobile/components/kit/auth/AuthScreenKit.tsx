import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { safeGoBack, authRoutes } from '@/lib/routes';
import { BrandLogo } from '@/components/BrandLogo';
import { AUTH_HERO_GRADIENT, AuthHeroBackdrop } from '@/components/kit/auth/AuthBrandArt';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/* ─── Splash ───────────────────────────────────────────────────────── */

function useSplashEnter() {
  const logo = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const meta = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.spring(logo, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(title, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(meta, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [logo, meta, title]);

  return {
    logo: {
      opacity: logo,
      transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
    },
    title: {
      opacity: title,
      transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    },
    meta: {
      opacity: meta,
      transform: [{ translateY: meta.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    },
  };
}

/** Logo on a white rounded tile with a soft halo — shared by boot + launch splash. */
export function SplashMark({ size = 104 }: { size?: number }) {
  const tile = size + 36;
  return (
    <View style={[styles.markHalo, { width: tile + 36, height: tile + 36, borderRadius: (tile + 36) / 2 }]}>
      <View style={[styles.markTile, { width: tile, height: tile, borderRadius: tile * 0.3 }]}>
        <BrandLogo size={size} animate={false} />
      </View>
    </View>
  );
}

/** Brand splash — forest gradient, centred mark + wordmark, footer slot (progress / status). */
export function AuthSplashLayout({
  brandName,
  tagline,
  trustBadges,
  footer,
  logoSize = 104,
}: {
  brandName: string;
  tagline?: string;
  trustBadges?: string[];
  footer?: ReactNode;
  logoSize?: number;
}) {
  const insets = useSafeAreaInsets();
  const enter = useSplashEnter();
  const chips = (trustBadges?.length ? trustBadges : ['Verified pros', 'Eco-safe', 'On-time']).slice(0, 3);

  return (
    <View style={styles.splashRoot}>
      <LinearGradient
        colors={[...AUTH_HERO_GRADIENT]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.splashGlow, styles.splashGlowA]} pointerEvents="none" />
      <View style={[styles.splashGlow, styles.splashGlowB]} pointerEvents="none" />

      <View style={[styles.splashStage, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.splashCenter}>
          <Animated.View style={enter.logo}>
            <SplashMark size={logoSize} />
          </Animated.View>
          <Animated.View style={[styles.splashTitleBlock, enter.title]}>
            <Text style={styles.splashBrand}>{brandName}</Text>
            {tagline ? <Text style={styles.splashTag}>{tagline}</Text> : null}
          </Animated.View>
        </View>

        <Animated.View style={[styles.splashFooter, enter.meta]}>
          {footer}
          {/* One Text run — separate Text siblings in a wrapping row get their last glyph clipped on iOS. */}
          <Text style={styles.splashChipText} numberOfLines={2}>
            {chips.map((chip, i) => (
              <Text key={chip}>
                {i > 0 ? <Text style={styles.splashDot}>{'   •   '}</Text> : null}
                {chip}
              </Text>
            ))}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/* ─── Login / register / OTP shell ─────────────────────────────────── */

const HERO_H = 248;
const HERO_H_COMPACT = 232;

/**
 * Auth shell — illustrated forest hero with the brand, then a white sheet that holds the
 * title and form. The sheet is a plain View: animated ancestors break TextInput focus.
 */
export function AuthLoginShell({
  title,
  subtitle,
  brandName = 'Mr Antidot',
  brandTag,
  showBack,
  compact,
  children,
}: {
  title: string;
  subtitle?: string;
  brandName?: string;
  brandTag?: string;
  /** Unused legacy props kept for compatibility. */
  tagline?: string;
  trustBadges?: string[];
  guaranteeText?: string;
  showBack?: boolean;
  /** Slightly shorter hero (login). */
  compact?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const heroH = insets.top + (compact ? HERO_H_COMPACT : HERO_H);
  const tag = brandTag?.trim();

  return (
    <KeyboardAvoidingView style={styles.loginRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FocusStatusBar style="light" />
      <View style={[styles.hero, { height: heroH, paddingTop: insets.top + 2 }]}>
        <AuthHeroBackdrop height={heroH} dense={!compact} />

        {showBack ? (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
            onPress={() => safeGoBack(authRoutes.login)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.white} strokeWidth={2.3} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.brandBlock}>
          <View style={styles.brandTile}>
            <BrandLogo size={40} animate={false} />
          </View>
          <Text style={styles.brandName} numberOfLines={1}>
            {brandName}
          </Text>
          {tag ? (
            <Text style={styles.brandSub} numberOfLines={2}>
              {tag}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          style={styles.sheetScrollView}
          contentContainerStyle={[styles.sheetScroll, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* CMS titles were written for the old two-line hero ("Create\naccount") — show them on one line. */}
          <Text style={styles.title}>{title.replace(/\s*\n\s*/g, ' ')}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export function AuthFormSection({ children }: { children: ReactNode }) {
  return <View style={styles.formSection}>{children}</View>;
}

export function AuthSecureNote({ text = 'Secure sign-in · your details stay private' }: { text?: string }) {
  return (
    <View style={styles.secureRow}>
      <Lock size={12} color={ui.textTertiary} strokeWidth={2.2} />
      <Text style={styles.secureText}>{text}</Text>
    </View>
  );
}

export function AuthLinkRow({ children }: { children: ReactNode }) {
  return <View style={styles.linkRow}>{children}</View>;
}

export function AuthFooterText({ children }: { children: ReactNode }) {
  return <View style={styles.footerText}>{children}</View>;
}

const styles = StyleSheet.create({
  /* splash */
  splashRoot: { flex: 1, backgroundColor: AUTH_HERO_GRADIENT[1] },
  splashGlow: { position: 'absolute', borderRadius: 999 },
  splashGlowA: { width: 360, height: 360, top: -140, right: -120, backgroundColor: 'rgba(185,229,138,0.14)' },
  splashGlowB: { width: 300, height: 300, bottom: -120, left: -120, backgroundColor: 'rgba(255,255,255,0.06)' },
  splashStage: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  markHalo: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  markTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#011A0A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 14,
  },
  splashTitleBlock: { alignItems: 'center', gap: 8 },
  splashBrand: {
    fontFamily: fonts.brand,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: colors.white,
    textAlign: 'center',
  },
  splashTag: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    maxWidth: 300,
  },
  splashFooter: { alignItems: 'center', gap: 18 },
  splashDot: { color: colors.limeOnDark },
  splashChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },

  /* shell */
  loginRoot: { flex: 1, backgroundColor: colors.white },
  hero: { paddingHorizontal: spacing.lg, overflow: 'hidden' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  backPressed: { backgroundColor: 'rgba(255,255,255,0.28)' },
  backSpacer: { height: 40 },
  brandBlock: { marginTop: 10, alignItems: 'flex-start' },
  brandTile: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: 12,
    shadowColor: '#011A0A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontFamily: fonts.brand,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
    color: colors.white,
    maxWidth: '64%',
  },
  brandSub: {
    marginTop: 3,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: '58%',
  },
  sheet: {
    flex: 1,
    marginTop: -26,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  sheetScrollView: { flex: 1 },
  sheetScroll: { paddingHorizontal: spacing.lg, paddingTop: 26 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: ui.text,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: ui.textSecondary,
  },
  formSection: { paddingTop: 22 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  secureText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textTertiary },
  linkRow: { marginTop: spacing.md, alignItems: 'center' },
  footerText: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
