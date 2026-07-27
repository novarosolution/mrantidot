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
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { safeGoBack, authRoutes } from '@/lib/routes';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, premium, premiumType, spacing, surfaces } from '@/constants/theme';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const H = SCREEN_H;
const W = SCREEN_W;

function useSplashEnter() {
  const logo = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const meta = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.timing(logo, { toValue: 1, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(title, { toValue: 1, duration: 640, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(meta, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.15, duration: 0, useNativeDriver: false }),
      ]),
    ).start();
  }, [drift, logo, title, meta, pulse, progress]);

  const fadeUp = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['15%', '92%'] });

  return {
    logo: fadeUp(logo),
    title: fadeUp(title),
    meta: fadeUp(meta),
    pulse,
    progressWidth,
    driftA: {
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
      ],
    },
    driftB: {
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
      ],
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
  logoSize = 124,
}: {
  brandName: string;
  tagline?: string;
  trustBadges?: string[];
  footer?: ReactNode;
  logoSize?: number;
}) {
  const insets = useSafeAreaInsets();
  const enter = useSplashEnter();
  const trustLine = (trustBadges?.length ? trustBadges : ['Secure', 'Eco-safe', 'Verified']).slice(0, 3).join(' · ');

  return (
    <View style={styles.splashRoot}>
      <LinearGradient
        colors={['#1A8734', '#0A6423', '#053A18', '#02180C']}
        locations={[0, 0.28, 0.62, 1]}
        style={[styles.splashGradient, { paddingTop: insets.top + spacing.lg }]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        <Animated.View style={[styles.splashGlowA, enter.driftA]} pointerEvents="none" />
        <Animated.View style={[styles.splashGlowB, enter.driftB]} pointerEvents="none" />
        <View style={styles.splashBeam} pointerEvents="none" />
        <LinearGradient
          colors={['rgba(2,24,12,0)', 'rgba(2,24,12,0.2)', 'rgba(2,24,12,0.55)']}
          locations={[0.35, 0.7, 1]}
          style={styles.splashBottomFade}
          pointerEvents="none"
        />

        <View style={styles.splashCenter}>
          <Animated.View style={enter.logo}>
            <Animated.View
              style={{
                transform: [
                  { scale: enter.pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
                ],
              }}
            >
              <View style={styles.logoHalo} />
              <LinearGradient
                colors={['rgba(255,255,255,0.42)', 'rgba(143,208,60,0.55)', 'rgba(48,184,79,0.18)']}
                locations={[0, 0.45, 1]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.logoRing}
              >
                <View style={styles.logoRingInner}>
                  <BrandLogo size={logoSize} animate={false} />
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.splashTitleBlock, enter.title]}>
            <Text style={styles.splashBrand}>{brandName}</Text>
            <View style={styles.splashBrandRule} />
            {tagline ? <Text style={styles.splashTag}>{tagline}</Text> : null}
          </Animated.View>
        </View>

        <Animated.View style={[styles.splashFooter, enter.meta, { paddingBottom: insets.bottom + spacing.lg }]}>
          {footer ? (
            footer
          ) : (
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: enter.progressWidth }]} />
            </View>
          )}
          <Text style={styles.splashTrustLine}>{trustLine}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function useLoginEnter() {
  const hero = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hero, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [hero, drift]);

  return {
    hero: {
      opacity: hero,
      transform: [{ translateY: hero.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    },
    driftA: {
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
      ],
    },
    driftB: {
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
      ],
    },
  };
}

/**
 * Auth hero — brand-first forest gradient + mint glass sheet.
 * The sheet is intentionally a plain View: animated ancestors break TextInput focus.
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
  /** Tighter hero for login — brand + title only. */
  compact?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const enter = useLoginEnter();
  const tag = brandTag?.trim();

  return (
    <KeyboardAvoidingView
      style={styles.loginRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#1F9A42', '#0A6423', '#043A16', '#02180C']}
        locations={[0, 0.38, 0.72, 1]}
        style={[
          styles.loginHeroBlock,
          compact && styles.loginHeroCompact,
          { paddingTop: insets.top + (compact ? 6 : spacing.sm) },
        ]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
      >
        <Animated.View style={[styles.heroGlowA, enter.driftA]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(184,232,106,0.42)', 'rgba(143,208,60,0)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <Animated.View style={[styles.heroGlowB, enter.driftB]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
          style={styles.heroSheen}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {showBack ? (
          <Pressable style={styles.backBtn} onPress={() => safeGoBack(authRoutes.login)} hitSlop={12}>
            <PremiumIcon icon={AppIcons.ui.chevronLeft} variant="plain" size={22} color={colors.white} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <Animated.View style={[styles.heroInner, enter.hero]} pointerEvents="box-none">
          <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
            <LinearGradient
              colors={['#FFFFFF', '#F4FBF0']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.brandTile, compact && styles.brandTileCompact]}
            >
              <BrandLogo size={compact ? 32 : 36} animate={false} />
            </LinearGradient>
            <View style={styles.brandInfo}>
              <Text style={[styles.brandName, compact && styles.brandNameCompact]} numberOfLines={1}>
                {brandName}
              </Text>
              <View style={styles.brandRule} />
              {tag && !compact ? (
                <Text style={styles.brandSub} numberOfLines={1}>
                  {tag}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>{title}</Text>
          {subtitle && !compact ? <Text style={styles.heroDesc}>{subtitle}</Text> : null}
        </Animated.View>

        <LinearGradient
          colors={['#B8E86A', '#8FD03C', '#27A747', 'transparent']}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.heroEdgeBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
      </LinearGradient>

      <View style={[styles.sheetWrap, compact && styles.sheetWrapCompact]}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#FBFEF9', '#F4FAEF', '#EAF6E3']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.sheetHandle} pointerEvents="none" />
          <ScrollView
            style={styles.sheetScrollView}
            contentContainerStyle={[styles.sheetScroll, { paddingBottom: insets.bottom + spacing.xl + 4 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </View>
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
        <PremiumIcon icon={AppIcons.ui.lock} variant="plain" size={12} color="#1A8734" />
      </View>
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
  splashRoot: { flex: 1 },
  splashGradient: { flex: 1 },
  splashGlowA: {
    position: 'absolute',
    top: -H * 0.12,
    right: -W * 0.28,
    width: W * 0.9,
    height: W * 0.9,
    borderRadius: W * 0.45,
    backgroundColor: 'rgba(143,208,60,0.22)',
  },
  splashGlowB: {
    position: 'absolute',
    bottom: -H * 0.05,
    left: -W * 0.2,
    width: W * 0.78,
    height: W * 0.78,
    borderRadius: W * 0.39,
    backgroundColor: 'rgba(8,90,34,0.5)',
  },
  splashBeam: {
    position: 'absolute',
    top: H * 0.08,
    left: W * 0.05,
    width: W * 0.48,
    height: H * 0.55,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '22deg' }],
  },
  splashBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: H * 0.42,
  },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  logoHalo: {
    position: 'absolute',
    alignSelf: 'center',
    top: -15,
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(143,208,60,0.16)',
  },
  logoRing: {
    width: 158,
    height: 158,
    borderRadius: 46,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingInner: {
    width: 150,
    height: 150,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.38,
    shadowRadius: 32,
    elevation: 16,
  },
  splashTitleBlock: {
    alignItems: 'center',
    gap: 14,
  },
  splashBrand: {
    fontFamily: fonts.brand,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 18,
  },
  splashBrandRule: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#8FD03C',
  },
  splashTag: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.74)',
    textAlign: 'center',
    maxWidth: 290,
  },
  splashTrustLine: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.35,
    color: 'rgba(255,255,255,0.48)',
    textAlign: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  trustDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8FD03C' },
  trustText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.white },
  splashFooter: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8FD03C',
  },

  loginRoot: { flex: 1, backgroundColor: '#02180C' },
  loginHeroBlock: {
    overflow: 'hidden',
    paddingBottom: spacing.xl + 36,
  },
  loginHeroCompact: {
    paddingBottom: spacing.lg + 28,
  },
  heroGlowA: {
    position: 'absolute',
    top: -100,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -40,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
  },
  heroRay: {
    position: 'absolute',
    top: -20,
    left: W * 0.08,
    width: W * 0.42,
    height: 220,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '18deg' }],
  },
  heroSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginLeft: spacing.lg,
    marginBottom: spacing.xs,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backSpacer: {
    height: 8,
  },
  heroInner: {
    paddingHorizontal: spacing.lg + 6,
    paddingTop: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.lg + 6,
  },
  brandRowCompact: {
    marginBottom: spacing.md,
    gap: 12,
  },
  brandTile: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  brandTileCompact: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  brandInfo: { flex: 1, minWidth: 0, gap: 5 },
  brandName: {
    fontFamily: fonts.brand,
    fontSize: 27,
    letterSpacing: -0.7,
    color: '#FFFFFF',
    lineHeight: 31,
  },
  brandNameCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  brandRule: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#8FD03C',
  },
  brandSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    letterSpacing: 0.15,
    color: 'rgba(255,255,255,0.68)',
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 14,
  },
  heroTitleCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  heroDesc: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.68)',
    marginTop: 10,
    maxWidth: 310,
  },
  heroEdge: {
    position: 'absolute',
    left: spacing.lg + 4,
    right: spacing.lg + 4,
    bottom: 22,
  },
  heroEdgeBar: {
    position: 'absolute',
    left: spacing.lg + 6,
    right: spacing.lg + 6,
    bottom: 28,
    height: 3,
    borderRadius: 2,
  },
  sheetWrap: { flex: 1, marginTop: -34 },
  sheetWrapCompact: { marginTop: -28 },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    ...premium.shadowSoft,
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.26,
    shadowRadius: 28,
    elevation: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(26,135,52,0.28)',
    marginTop: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  sheetScrollView: { flex: 1 },
  sheetScroll: {
    paddingHorizontal: spacing.lg + 4,
    paddingTop: spacing.xs,
  },
  formSection: { gap: 2, paddingTop: spacing.xs },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md + 2,
  },
  secureIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: { ...premiumType.caption, fontSize: 11.5, color: colors.muted },
  linkRow: { marginTop: spacing.md, alignItems: 'center' },
  footerText: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: 4,
  },
});

/** @deprecated use AuthTrustStrip inline in splash */
export function AuthTrustStrip() {
  return null;
}
