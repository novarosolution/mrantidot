import type { BookingStatus } from '@/types/api';
import type { TextStyle, ViewStyle } from 'react-native';

/** Mr Antidot HTML UI kit tokens */
export const colors = {
  deep: '#0E3A20',
  green: '#1E8E4E',
  forest: '#14532D',
  lime: '#A8E04E',
  bg: '#F2F6F9',
  ink: '#13211A',
  muted: '#6E8075',
  border: '#E7EDE5',
  card: '#F7FAF6',
  soft: '#E7F3E9',
  amber: '#F5B82E',
  white: '#FFFFFF',
  /** Brand secondary — sage teal (pairs with forest green + lime) */
  secondary: '#3A9688',
  secondaryDark: '#2A756A',
  secondarySoft: '#E8F4F1',
  secondaryInk: '#1D5C52',
  sky: '#3A9688',
  skyDeep: '#2A756A',
  skySoft: '#E8F4F1',
  skyInk: '#1D5C52',
  error: '#C0492E',
  errorBg: '#FBE7E1',
  blue: '#3461B6',
  blueBg: '#E5EEFB',
  amberBg: '#FFF4DC',
  amberInk: '#B6841C',
  greyBg: '#EEF2EE',
  // aliases
  primary: '#1E8E4E',
  primaryDark: '#14532D',
  primaryLight: '#E7F3E9',
  accent: '#A8E04E',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#13211A',
  textMuted: '#6E8075',
  success: '#1E8E4E',
  warning: '#B6841C',
};

export const fonts = {
  display: 'Sora_700Bold',
  displayExtra: 'Sora_800ExtraBold',
  body: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const typography = {
  h1: { fontFamily: fonts.displayExtra, fontSize: 28, lineHeight: 34 } as TextStyle,
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 } as TextStyle,
  h3: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 } as TextStyle,
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 } as TextStyle,
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 } as TextStyle,
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16 } as TextStyle,
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    color: '#B6841C',
  } as TextStyle,
};

/** Semantic tinted surfaces for status banners, chips, calendar cells */
export const surfaces = {
  glass: 'rgba(255,255,255,0.88)',
  glassBorder: 'rgba(255,255,255,0.35)',
  glassDark: 'rgba(14,58,32,0.12)',
  tintSuccess: '#DCFCE7',
  tintSuccessInk: colors.forest,
  tintWarning: '#FEF3C7',
  tintWarningInk: colors.amberInk,
  tintDanger: '#FEE2E2',
  tintDangerInk: '#B91C1C',
  tintInfo: colors.secondarySoft,
  tintInfoInk: colors.secondaryInk,
  cameraBg: '#1d3b2a',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 };

/** Consistent top padding for gradient hero headers so they bleed under the status bar with uniform breathing room. */
export const headerTopPad = (insetTop: number) => Math.max(insetTop, 12) + 8;

export const shadows: { card: ViewStyle; elevated: ViewStyle; floating: ViewStyle; hero: ViewStyle } = {
  card: {
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  floating: {
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  hero: {
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const gradients = {
  primary: ['#23a45b', '#1b8048'] as const,
  header: ['#1E8E4E', '#14532D'] as const,
  headerDark: ['#14532D', '#0E3A20'] as const,
  premiumHero: ['#1E8E4E', '#14532D', '#0E3A20'] as const,
  bookHero: ['#14532D', '#0E3A20', '#0E3A20'] as const,
  goldCta: ['#D4A017', '#B6841C', '#8B6914'] as const,
  otp: ['#4AAD9A', '#1E8E4E'] as const,
  secondary: ['#6BB5A8', '#3A9688', '#2A756A'] as const,
  sky: ['#6BB5A8', '#3A9688', '#2A756A'] as const,
  avatarRing: ['#A8E04E', '#1E8E4E'] as const,
};

/** Premium booking flow tokens */
export const premium = {
  surfaceElevated: '#FFFFFF',
  accentGold: '#B6841C',
  accentGoldBg: '#FFF8E8',
  radiusCard: 22,
  shadowSoft: {
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  } as ViewStyle,
};

/** App-wide premium design system */
export const design = {
  screenBg: colors.bg,
  surface: premium.surfaceElevated,
  radiusLg: premium.radiusCard,
  radiusXl: 24,
  screenPaddingHorizontal: spacing.md,
  screenPadding: spacing.md,
  cardGap: spacing.sm,
  listGap: spacing.sm,
  headerPremium: gradients.headerDark,
  sectionTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  } as TextStyle,
  ctaGold: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    color: premium.accentGold,
  } as TextStyle,
  linkColor: colors.secondaryDark,
  tabBarActive: colors.secondaryDark,
  tabBar: {
    backgroundColor: surfaces.glass,
    borderTopColor: 'rgba(20,83,45,0.08)',
    height: 82,
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    ...premium.shadowSoft,
  } as ViewStyle,
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  modalCard: {
    backgroundColor: premium.surfaceElevated,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  } as ViewStyle,
};

export const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: colors.amberBg, text: colors.amberInk },
  confirmed: { bg: colors.soft, text: colors.green },
  in_progress: { bg: colors.blueBg, text: colors.blue },
  awaiting_verification: { bg: colors.secondarySoft, text: colors.secondaryInk },
  completed: { bg: colors.greyBg, text: colors.muted },
  cancelled: { bg: colors.errorBg, text: colors.error },
};

export const headerStyle = {
  headerStyle: { backgroundColor: colors.forest },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: fonts.display, fontWeight: '600' as const },
};

/** Lucide icon key mapping for services */
export const SERVICE_ICON_KEYS: Record<string, string> = {
  spray: 'spray',
  bug: 'spray',
  mosq: 'mosq',
  mouse: 'mouse',
  bed: 'bed',
  termite: 'termite',
  clean: 'clean',
  bird: 'bird',
  wrench: 'spray',
  snowflake: 'clean',
  droplets: 'clean',
  zap: 'spray',
  sparkles: 'clean',
  pipe: 'spray',
};
