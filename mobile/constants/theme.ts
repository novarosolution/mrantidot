import type { BookingStatus } from '@/types/api';
import type { TextStyle, ViewStyle } from 'react-native';

/** Mr Antidot HTML UI kit tokens */
export const colors = {
  deep: '#02180C',
  green: '#27A747',
  forest: '#0A6423',
  lime: '#E9F8E3',
  bg: '#FAFCF8',
  ink: '#071A0E',
  muted: '#3F6B48',
  border: '#CDE8C0',
  card: '#F5FBF2',
  soft: '#EAF6E3',
  amber: '#F5B82E',
  white: '#FFFFFF',
  /** Brand secondary — sage teal (pairs with forest green + lime) */
  secondary: '#2F8578',
  secondaryDark: '#22685E',
  secondarySoft: '#E8F4F1',
  secondaryInk: '#184F46',
  sky: '#2F8578',
  skyDeep: '#22685E',
  skySoft: '#E8F4F1',
  skyInk: '#184F46',
  error: '#B33F28',
  errorBg: '#FBE7E1',
  blue: '#2E569E',
  blueBg: '#E5EEFB',
  amberBg: '#FFF4DC',
  amberInk: '#9A6F12',
  greyBg: '#EEF2EE',
  // aliases
  primary: '#27A747',
  primaryDark: '#0A6423',
  primaryLight: '#EAF6E3',
  accent: '#E9F8E3',
  background: '#FAFCF8',
  surface: '#FFFFFF',
  text: '#071A0E',
  textMuted: '#3F6B48',
  success: '#27A747',
  warning: '#9A6F12',
};

export const fonts = {
  /** Brand wordmark — Plus Jakarta ExtraBold */
  brand: 'PlusJakartaSans_800ExtraBold',
  brandSub: 'PlusJakartaSans_700Bold',
  /** Display — geometric premium headlines */
  displayExtra: 'PlusJakartaSans_800ExtraBold',
  display: 'PlusJakartaSans_700Bold',
  displaySemi: 'PlusJakartaSans_600SemiBold',
  /** Body — same family for a cohesive premium system */
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.9,
  } as TextStyle,
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  } as TextStyle,
  h3: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.35,
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    letterSpacing: -0.05,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.04,
  } as TextStyle,
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.02,
  } as TextStyle,
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } as TextStyle,
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: '#1A8734',
  } as TextStyle,
  tabLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.15,
  } as TextStyle,
};

/** Semantic premium text styles — use across screens for consistent hierarchy. */
export const premiumType = {
  brandHero: {
    fontFamily: fonts.brand,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.7,
  } as TextStyle,
  brandTitle: {
    fontFamily: fonts.brand,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.45,
  } as TextStyle,
  brandSub: {
    fontFamily: fonts.brandSub,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.05,
  } as TextStyle,
  screenTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: colors.ink,
  } as TextStyle,
  screenTitleLight: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: colors.white,
  } as TextStyle,
  navTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.45,
    color: colors.ink,
  } as TextStyle,
  navTitleLight: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.45,
    color: colors.white,
  } as TextStyle,
  sectionTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.5,
    color: colors.ink,
  } as TextStyle,
  cardTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.22,
    color: colors.ink,
  } as TextStyle,
  heroEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.75,
    textTransform: 'uppercase',
  } as TextStyle,
  heroName: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  } as TextStyle,
  stat: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.forest,
  } as TextStyle,
  price: typography.price,
  kicker: typography.overline,
  button: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.35,
  } as TextStyle,
  buttonAlt: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.22,
  } as TextStyle,
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
    color: colors.ink,
  } as TextStyle,
  caption: typography.caption,
  body: typography.body,
  label: typography.label,
  tab: typography.tabLabel,
} as const;

/** Customer app typography — unified hierarchy for home, bookings, profile, offers. */
export const customerType = {
  pageTitle: {
    ...premiumType.screenTitleLight,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  } as TextStyle,
  pageTitleCompact: {
    ...premiumType.screenTitleLight,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
  } as TextStyle,
  pageSubtitle: {
    ...premiumType.caption,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.12,
    color: colors.lime,
  } as TextStyle,
  pageSubtitleMuted: {
    ...premiumType.caption,
    marginTop: 2,
  } as TextStyle,
  heroEyebrow: {
    ...premiumType.heroEyebrow,
    letterSpacing: 0.85,
  } as TextStyle,
  heroGreeting: {
    ...premiumType.heroName,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.55,
  } as TextStyle,
  searchInput: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.08,
    color: colors.ink,
  } as TextStyle,
  locationChip: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.92)',
  } as TextStyle,
  trustChip: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.94)',
  } as TextStyle,
  sectionTitle: {
    ...premiumType.sectionTitle,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.5,
  } as TextStyle,
  sectionTitleCompact: {
    ...premiumType.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.48,
  } as TextStyle,
  sectionSubtitle: {
    ...premiumType.caption,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  } as TextStyle,
  sectionLink: {
    ...premiumType.buttonAlt,
    fontSize: 13,
    color: colors.forest,
  } as TextStyle,
  cardTitle: {
    ...premiumType.cardTitle,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.28,
  } as TextStyle,
  cardTitleLight: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.32,
    color: colors.white,
  } as TextStyle,
  serviceGridTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    color: colors.ink,
  } as TextStyle,
  listMeta: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.12,
    color: colors.forest,
  } as TextStyle,
  listMetaMuted: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.08,
    color: colors.muted,
  } as TextStyle,
  listRef: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  listPrice: {
    ...typography.price,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.35,
  } as TextStyle,
  listPriceHero: {
    ...typography.price,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.55,
  } as TextStyle,
  profileName: {
    ...premiumType.brandTitle,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.38,
    textAlign: 'center',
    alignSelf: 'stretch',
    color: colors.ink,
  } as TextStyle,
  menuLabel: {
    ...premiumType.cardTitle,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.26,
  } as TextStyle,
  menuDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.06,
    color: colors.muted,
    marginTop: 3,
  } as TextStyle,
  accountName: {
    ...premiumType.cardTitle,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.3,
  } as TextStyle,
  accountMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.06,
    color: colors.muted,
    marginTop: 2,
  } as TextStyle,
  pillLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  } as TextStyle,
  statValue: {
    ...premiumType.stat,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.35,
  } as TextStyle,
  statLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.62,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  quickActionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.18,
    color: colors.ink,
    textAlign: 'center',
  } as TextStyle,
  offerSaveLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
  } as TextStyle,
  offerSaveValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.25,
    color: colors.lime,
    textAlign: 'center',
  } as TextStyle,
  offerCode: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.55,
    color: colors.forest,
  } as TextStyle,
  offerDesc: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.06,
    color: colors.muted,
  } as TextStyle,
  promoTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.28,
    color: colors.ink,
  } as TextStyle,
  emptyTitle: {
    ...premiumType.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.35,
    textAlign: 'center',
    alignSelf: 'stretch',
  } as TextStyle,
  emptyBody: {
    ...premiumType.caption,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.08,
    textAlign: 'center',
    alignSelf: 'stretch',
    color: colors.muted,
  } as TextStyle,
  badgeCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.white,
  } as TextStyle,
  kicker: {
    ...premiumType.kicker,
    fontSize: 10,
    letterSpacing: 0.55,
  } as TextStyle,
} as const;

/** Admin app typography & surfaces — forest hero + ivory glass body. */
export const adminType = {
  screenTitle: {
    ...premiumType.screenTitleLight,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  } as TextStyle,
  screenSubtitle: {
    ...premiumType.brandSub,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.86)',
  } as TextStyle,
  sectionTitle: {
    ...premiumType.sectionTitle,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.42,
  } as TextStyle,
  sectionHint: {
    ...premiumType.caption,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  } as TextStyle,
  sectionLink: {
    ...premiumType.buttonAlt,
    fontSize: 13,
    color: colors.forest,
  } as TextStyle,
  hubLabel: {
    ...premiumType.cardTitle,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.26,
  } as TextStyle,
  hubDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 2,
  } as TextStyle,
  quickLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.15,
    color: colors.ink,
    textAlign: 'center',
  } as TextStyle,
  statValue: {
    ...premiumType.stat,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.35,
  } as TextStyle,
  statLabel: {
    ...premiumType.kicker,
    fontSize: 9,
    letterSpacing: 0.55,
  } as TextStyle,
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  } as TextStyle,
  listTitle: {
    ...premiumType.cardTitle,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.22,
  } as TextStyle,
  listMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 2,
  } as TextStyle,
  listRef: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    letterSpacing: 0.35,
  } as TextStyle,
  listPrice: {
    fontFamily: fonts.displayExtra,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: colors.green,
  } as TextStyle,
  formTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: colors.ink,
  } as TextStyle,
  formSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 2,
  } as TextStyle,
  badgeCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.white,
  } as TextStyle,
} as const;

export const adminSurfaces = {
  card: 'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(180,220,165,0.92)',
  cardBorderStrong: '#B4DCA5',
  panelTint: 'rgba(255,255,255,0.48)',
  chipBg: 'rgba(255,255,255,0.78)',
  chipBorder: 'rgba(180,220,165,0.95)',
} as const;

/** Semantic tinted surfaces for status banners, chips, calendar cells */
export const surfaces = {
  /** Primary frosted card fill (pair with BlurView via GlassPanel). */
  glass: 'rgba(255,255,255,0.58)',
  glassSoft: 'rgba(255,255,255,0.42)',
  glassSheet: 'rgba(246,250,242,0.72)',
  glassBorder: 'rgba(255,255,255,0.68)',
  glassBorderStrong: 'rgba(180,220,165,0.95)',
  glassDark: 'rgba(14,58,32,0.16)',
  glassScreenBase: '#FAFCF8',
  glassPanelTint: 'rgba(255,255,255,0.48)',
  glassTabTint: 'rgba(255,255,255,0.58)',
  glassInput: 'rgba(255,255,255,0.72)',
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

export const shadows: {
  card: ViewStyle;
  elevated: ViewStyle;
  floating: ViewStyle;
  hero: ViewStyle;
  soft: ViewStyle;
} = {
  soft: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  },
  elevated: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  floating: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 12,
  },
  hero: {
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 28,
    elevation: 14,
  },
};

export const gradients = {
  primary: ['#30B84F', '#25A443'] as const,
  header: ['#1B873E', '#064D1B'] as const,
  headerDark: ['#0A6423', '#043813'] as const,
  premiumHero: ['#0A6423', '#064D1B', '#043813'] as const,
  bookHero: ['#0A6423', '#064D1B', '#043813'] as const,
  goldCta: ['#30B84F', '#25A443', '#1A8734'] as const,
  goldBar: ['#8FD03C', '#27A747'] as const,
  otp: ['#68D03C', '#25A443'] as const,
  secondary: ['#6BB5A8', '#3A9688', '#2A756A'] as const,
  sky: ['#6BB5A8', '#3A9688', '#2A756A'] as const,
  avatarRing: ['#FFFFFF', '#68D03C'] as const,
};

/** Premium booking flow tokens */
export const premium = {
  surfaceElevated: '#FFFFFF',
  accentGold: '#27A747',
  accentGoldBg: '#F2FAEE',
  radiusCard: 22,
  radiusButton: 18,
  radiusInput: 18,
  shadowSoft: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  } as ViewStyle,
  shadowFocus: {
    shadowColor: '#1F9A3E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
};

/** Shared form control sizing — used by Input, IconInput, Button. */
export const formField = {
  height: 56,
  minHeight: 56,
  radius: 18,
  borderWidth: 1.5,
  borderColor: surfaces.glassBorderStrong,
  borderFocus: colors.forest,
  /** Frosted glass fill — pairs with mesh / GlassPanel screens. */
  bg: surfaces.glassInput,
  bgMuted: 'rgba(246,251,242,0.78)',
  bgFocus: 'rgba(255,255,255,0.88)',
  labelSize: 12,
  inputSize: 15,
};

/** Button sizing & shape — used by Button component app-wide. */
export const buttonTokens = {
  radius: 16,
  radiusSm: 14,
  heightLg: 54,
  heightMd: 48,
  heightSm: 42,
  borderWidth: 1.5,
};

/** Classic ivory + forest + gold palette */
export const classic = {
  screenBg: '#FAFCF8',
  screenBgAlt: '#F3F8EE',
  cardBorder: 'rgba(26,135,52,0.08)',
  cardBorderGold: 'rgba(48,184,79,0.25)',
  headerGoldLine: 'rgba(48,184,79,0.5)',
  subtlePattern: 'rgba(26,135,52,0.03)',
};

/** App-wide premium design system */
export const design = {
  screenBg: classic.screenBg,
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
    letterSpacing: -0.38,
    color: colors.ink,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.1,
    color: colors.muted,
  } as TextStyle,
  ctaGold: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.25,
    color: premium.accentGold,
  } as TextStyle,
  linkColor: colors.secondaryDark,
  tabBarActive: colors.forest,
  tabBar: {
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    height: 82,
    paddingBottom: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    borderTopWidth: 3,
    borderTopColor: premium.accentGold,
    ...premium.shadowSoft,
  } as ViewStyle,
};

export const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: '#EEF8E6', text: colors.forest },
  confirmed: { bg: colors.soft, text: colors.green },
  in_progress: { bg: '#EEF8E6', text: colors.forest },
  awaiting_verification: { bg: '#EEF8E6', text: colors.forest },
  completed: { bg: colors.greyBg, text: colors.muted },
  cancelled: { bg: colors.errorBg, text: colors.error },
};

export const headerStyle = {
  headerStyle: { backgroundColor: colors.forest },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontFamily: fonts.displaySemi, fontSize: 17, letterSpacing: -0.25 },
};

