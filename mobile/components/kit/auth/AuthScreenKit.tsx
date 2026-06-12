import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
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
import { ChevronLeft, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { safeGoBack } from '@/lib/routes';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

function useSplashEnter() {
  const logo = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const meta = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(logo, { toValue: 1, duration: 750, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(title, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(meta, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.15, duration: 0, useNativeDriver: false }),
      ]),
    ).start();
  }, [logo, title, meta, pulse, progress]);

  const fadeUp = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  });

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['15%', '92%'] });

  return { logo: fadeUp(logo), title: fadeUp(title), meta: fadeUp(meta), pulse, progressWidth };
}

function useLoginEnter() {
  const hero = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(hero, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(sheet, { toValue: 1, friction: 9, tension: 55, useNativeDriver: true }),
    ]).start();
  }, [hero, sheet]);

  return {
    hero: {
      opacity: hero,
      transform: [
        { scale: hero.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      ],
    },
    sheet: {
      opacity: sheet,
    },
  };
}

/** Optional subtle entrance — no transform so focus/keyboard stays stable. */
export function AuthAnimatedField({ children }: { index?: number; children: ReactNode }) {
  return <View>{children}</View>;
}

/** Full-screen branded splash (app open + boot). */
export function AuthSplashLayout({
  brandName,
  tagline,
  trustBadges,
  footer,
  logoSize = 112,
}: {
  brandName: string;
  tagline?: string;
  trustBadges?: string[];
  footer?: ReactNode;
  logoSize?: number;
}) {
  const insets = useSafeAreaInsets();
  const enter = useSplashEnter();
  const chips = trustBadges?.length ? trustBadges : ['Eco-safe', 'Certified', 'Verified'];

  return (
    <View style={styles.splashRoot}>
      <LinearGradient
        colors={['#2BB563', '#14532D', '#0E3A20']}
        style={[styles.splashGradient, { paddingTop: insets.top + spacing.lg }]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        <View style={styles.splashGlowA} />
        <View style={styles.splashGlowB} />
        <View style={[styles.orb, { top: SCREEN_H * 0.18, left: SCREEN_W * 0.08 }]} />
        <View style={[styles.orb, styles.orbSmall, { top: SCREEN_H * 0.55, right: SCREEN_W * 0.12 }]} />

        <View style={styles.splashCenter}>
          <Animated.View style={enter.logo}>
            <Animated.View style={{ transform: [{ scale: enter.pulse }] }}>
              <View style={styles.logoRing}>
                <View style={styles.logoRingInner}>
                  <BrandLogo size={logoSize} />
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          <Animated.View style={enter.title}>
            <Text style={styles.splashBrand}>{brandName}</Text>
            {tagline ? <Text style={styles.splashTag}>{tagline}</Text> : null}
          </Animated.View>

          <Animated.View style={[styles.trustRow, enter.meta]}>
            {chips.slice(0, 4).map((t) => (
              <View key={t} style={styles.trustChip}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>{t}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {footer ? (
          <Animated.View style={[styles.splashFooter, enter.meta, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: enter.progressWidth }]} />
            </View>
            {footer}
          </Animated.View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

/** Login / register / OTP — gradient hero + animated bottom sheet. */
export function AuthLoginShell({
  title,
  subtitle,
  tagline,
  trustBadges,
  guaranteeText,
  showBack,
  children,
}: {
  title: string;
  subtitle?: string;
  tagline?: string;
  trustBadges?: string[];
  guaranteeText?: string;
  showBack?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const enter = useLoginEnter();
  const chips = trustBadges?.length ? trustBadges.slice(0, 3) : ['Verified pros', 'Secure login', '24/7 support'];

  return (
    <KeyboardAvoidingView
      style={styles.loginRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={[styles.loginHeroBlock, { paddingTop: insets.top + spacing.sm }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loginGlow} pointerEvents="none" />
        <View style={styles.loginGlowB} pointerEvents="none" />
        {showBack ? (
          <Pressable style={styles.backBtn} onPress={() => safeGoBack('/(auth)/login')} hitSlop={12}>
            <ChevronLeft size={22} color={colors.white} />
          </Pressable>
        ) : null}
        <Animated.View style={[styles.loginHeroInner, enter.hero]} pointerEvents="box-none">
          <View style={styles.loginLogoWrap}>
            <BrandLogo size={56} />
          </View>
          <Text style={styles.loginTitle}>{title}</Text>
          {subtitle ? <Text style={styles.loginSub}>{subtitle}</Text> : null}
          {tagline ? <Text style={styles.loginTagline}>{tagline}</Text> : null}
          <View style={styles.loginTrustRow}>
            {chips.map((t) => (
              <View key={t} style={styles.loginTrustChip}>
                <Text style={styles.loginTrustText}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.sheetWrap}>
        <Animated.View style={[styles.sheet, enter.sheet]}>
          <View style={styles.sheetGoldLine} pointerEvents="none" />
          <View style={styles.sheetHandle} pointerEvents="none" />
          <ScrollView
            style={styles.sheetScrollView}
            contentContainerStyle={[styles.sheetScroll, { paddingBottom: insets.bottom + spacing.xl }]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {children}
            {guaranteeText ? (
              <View style={styles.guaranteeBox}>
                <Text style={styles.guaranteeText}>{guaranteeText}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function AuthFormSection({ children }: { children: ReactNode }) {
  return <View style={styles.formSection}>{children}</View>;
}

export function AuthSecureNote({ text = '256-bit secure sign-in' }: { text?: string }) {
  return (
    <View style={styles.secureRow}>
      <View style={styles.secureIcon}>
        <Lock size={12} color={colors.forest} />
      </View>
      <Text style={styles.secureText}>{text}</Text>
    </View>
  );
}

export function AuthLinkRow({ children }: { children: ReactNode }) {
  return <View style={styles.linkRow}>{children}</View>;
}

export function AuthFooterText({ children }: { children: ReactNode }) {
  return <Text style={styles.footerText}>{children}</Text>;
}

const styles = StyleSheet.create({
  splashRoot: { flex: 1 },
  splashGradient: { flex: 1 },
  splashGlowA: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  splashGlowB: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orb: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168,224,78,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.15)',
  },
  orbSmall: { width: 40, height: 40, borderRadius: 20 },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(182,132,28,0.45)',
  },
  logoRingInner: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  splashBrand: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  splashTag: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  trustDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime },
  trustText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white },
  splashFooter: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: premium.accentGold,
  },

  loginRoot: { flex: 1, backgroundColor: colors.bg },
  loginHeroBlock: {
    overflow: 'hidden',
    paddingBottom: spacing.lg + 4,
  },
  loginGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,224,78,0.1)',
  },
  loginGlowB: {
    position: 'absolute',
    bottom: 40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(182,132,28,0.08)',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  loginHeroInner: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  loginLogoWrap: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.25)',
  },
  loginTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.white,
    marginTop: spacing.sm,
    letterSpacing: -0.4,
  },
  loginSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.lime,
    marginTop: 6,
    textAlign: 'center',
  },
  loginTagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  loginTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  loginTrustChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  loginTrustText: { fontFamily: fonts.bodySemi, fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  sheetWrap: { flex: 1, marginTop: -20 },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadows.floating,
  },
  sheetGoldLine: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    height: 3,
    borderRadius: 2,
    backgroundColor: premium.accentGold,
    zIndex: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  sheetScrollView: { flex: 1 },
  sheetScroll: {
    paddingHorizontal: spacing.lg,
  },
  formSection: { gap: 0 },
  guaranteeBox: {
    marginTop: spacing.md,
    padding: spacing.sm + 4,
    borderRadius: 14,
    backgroundColor: premium.accentGoldBg,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.2)',
  },
  guaranteeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: premium.accentGold,
    textAlign: 'center',
    lineHeight: 17,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  secureIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  linkRow: { marginTop: spacing.md, alignItems: 'center' },
  footerText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
});

/** @deprecated use AuthTrustStrip inline in splash */
export function AuthTrustStrip() {
  return null;
}
