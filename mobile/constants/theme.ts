import type { BookingStatus } from '@/types/api';
import type { TextStyle, ViewStyle } from 'react-native';

/** Mr Antidot HTML UI kit tokens */
export const colors = {
  deep: '#02180C',
  green: '#159447',
  forest: '#087B35',
  /** Mid forest used in CTAs / price — same as gradients.goldCta[2] */
  forestMid: '#159447',
  /** Header green — same as gradients.header[0] */
  headerGreen: '#0F8A3D',
  /** Bright lime accent — same as gradients.goldBar[0] */
  limeBright: '#8FD03C',
  /** Primary gradient start — same as gradients.primary[0] */
  greenBright: '#30B84F',
  /** Deepest green in premium heroes — same as gradients.premiumHero[2] */
  forestDeep: '#054A23',
  /** Header gradient end — same as gradients.header[1] */
  headerDeep: '#075C2B',
  /** Lime on dark heroes / kickers */
  limeOnDark: '#B9E58A',
  /** Default shadow ink — same as shadows.*.shadowColor */
  shadow: '#03170B',
  /** Soft status mint — same as statusColors.pending.bg */
  mint: '#EEF8E6',
  lime: '#E9F8E3',
  /** Clean white screen — premium Urban-style canvas; greens stay as accents. */
  bg: '#FFFFFF',
  ink: '#111A15',
  /** Neutral secondary text — reads premium on white (was green-tinted). */
  muted: '#6B756E',
  border: '#E7ECE8',
  card: '#FFFFFF',
  soft: '#EAF4EC',
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
  primary: '#159447',
  primaryDark: '#087B35',
  primaryLight: '#EAF4EC',
  accent: '#E9F8E3',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111A15',
  textMuted: '#6B756E',
  success: '#159447',
  warning: '#9A6F12',
};

export const fonts = {
  /** Brand wordmark — Inter Bold */
  brand: 'Inter_700Bold',
  brandSub: 'Inter_600SemiBold',
  /** Headings — Inter Bold (700); home section titles step down to SemiBold via `displaySemi`. */
  displayExtra: 'Inter_700Bold',
  display: 'Inter_700Bold',
  displaySemi: 'Inter_600SemiBold',
  /** Body & subheadings — Inter Regular / Medium (500) */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  /** Calligraphic accent (home sign-off) — Dancing Script SemiBold */
  script: 'DancingScript_600SemiBold',
  /** Editorial serif italic accent (curation cards) — Instrument Serif Italic */
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
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
    color: colors.forestMid,
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
    letterSpacing: -0.6,
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
    letterSpacing: -0.6,
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
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0,
    textTransform: 'none',
    color: '#5D6661',
  } as TextStyle,
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: '#0E1511',
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
  card: '#FFFFFF',
  cardBorder: '#E3E6E3',
  cardBorderStrong: '#D5DAD5',
  panelTint: '#F5F6F5',
  chipBg: '#FFFFFF',
  chipBorder: '#E3E6E3',
} as const;

/** Semantic tinted surfaces for status banners, chips, calendar cells */
export const surfaces = {
  /** Primary frosted card fill (pair with BlurView via GlassPanel). */
  glass: '#FFFFFF',
  glassSoft: '#FFFFFF',
  glassSheet: '#FFFFFF',
  glassBorder: '#ECEEEC',
  glassBorderStrong: '#E3E6E3',
  glassDark: 'rgba(14,58,32,0.16)',
  glassScreenBase: '#FFFFFF',
  glassPanelTint: 'rgba(255,255,255,0)',
  glassTabTint: '#FFFFFF',
  glassInput: '#FFFFFF',
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

/**
 * Urban-style premium neutrals — white canvas, hairlines, quiet greys.
 * Brand greens are reserved for actions, prices and active states.
 */
export const ui = {
  /** MR ANTIDOT premium palette — sage canvas, white cards, one confident green. */
  bg: '#FFFFFF',
  /** The one light-grey page canvas behind white cards (stacks, tabs, loading and error states). */
  canvas: '#F7F9F7',
  surfaceMuted: '#F7F9F7',
  /** 8 px band between page sections, and the sticky search strip on Home. */
  band: '#F2F3F2',
  hairline: '#EEF2EF',
  border: '#E7ECE8',
  text: '#111A15',
  /** Brief asks for #737D76; nudged to #6B756E so 12–13px text keeps WCAG AA (4.7:1 on white). */
  textSecondary: '#6B756E',
  textTertiary: '#8A938D',
  brand: colors.forest,
  brandBright: colors.forestMid,
  brandDeep: colors.headerDeep,
  brandSoft: '#EAF4EC',
  star: '#111A15',
  shadow: {
    shadowColor: '#143C23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  } as ViewStyle,
  /** Lifted glass / floating elements — 0 8px 30px rgba(20,60,35,0.07). */
  shadowFloat: {
    shadowColor: '#143C23',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 4,
  } as ViewStyle,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 };

/**
 * Corner radii (docs/ui-roadmap.md §1): white cards 20, tappable controls 16, everything round is a pill.
 * Use these instead of literal numbers on customer screens.
 */
export const radii = {
  /** White content cards, list groups, banners, sheets (top corners). */
  card: 20,
  sheet: 20,
  /** Buttons, inputs, option tiles, segmented controls. */
  control: 16,
  /** Small square art / photo thumbs inside a row. */
  thumb: 12,
  /** Chips, status pills, badges, round buttons. */
  pill: 999,
} as const;

const t = (style: TextStyle): TextStyle => style;

/**
 * The one type scale for customer screens (Inter): display 22–26 for titles, 18 section titles,
 * 15–16 bold row titles, 13–14 body, 12 uppercase labels. Colour is left to the caller.
 */
export const typeScale = {
  /** Big page title on a hero / tab screen. */
  display: t({ fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 }),
  /** Pushed-screen title, sheet hero titles, success headline. */
  title: t({ fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.45 }),
  /** Section heading inside a page or sheet. */
  section: t({ fontFamily: fonts.display, fontSize: 18, lineHeight: 24, letterSpacing: -0.35 }),
  /** Card / list-row title. */
  rowTitle: t({ fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21, letterSpacing: -0.2 }),
  /** Prominent row title (service name, booking card). */
  rowTitleLg: t({ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.25 }),
  body: t({ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, letterSpacing: -0.05 }),
  bodyStrong: t({ fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, letterSpacing: -0.05 }),
  caption: t({ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }),
  captionStrong: t({ fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 }),
  /** Small uppercase kicker / field label. */
  label: t({ fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' }),
  /** Pills, badges, tab labels. */
  micro: t({ fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 }),
  price: t({ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 }),
  priceLg: t({ fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 }),
  button: t({ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 }),
} as const;

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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 12,
  },
  hero: {
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 28,
    elevation: 14,
  },
};

export const gradients = {
  primary: [colors.greenBright, colors.green] as const,
  header: [colors.headerGreen, colors.headerDeep] as const,
  headerDark: [colors.forest, colors.forestDeep] as const,
  premiumHero: [colors.forest, colors.headerDeep, colors.forestDeep] as const,
  bookHero: [colors.forest, colors.headerDeep, colors.forestDeep] as const,
  goldCta: [colors.greenBright, colors.green, colors.forestMid] as const,
  goldBar: [colors.limeBright, colors.green] as const,
  otp: [colors.limeBright, colors.green] as const,
  offerDark: [colors.deep, colors.forestDeep] as const,
  secondary: ['#6BB5A8', '#3A9688', colors.secondaryDark] as const,
  sky: ['#6BB5A8', '#3A9688', colors.secondaryDark] as const,
  avatarRing: [colors.white, colors.limeBright] as const,
};

/** Premium booking flow tokens */
export const premium = {
  surfaceElevated: '#FFFFFF',
  accentGold: '#159447',
  accentGoldBg: '#F2FAEE',
  radiusCard: radii.card,
  radiusButton: radii.control,
  radiusInput: radii.control,
  shadowSoft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  } as ViewStyle,
  shadowFocus: {
    shadowColor: '#159447',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
};

/** Shared form control sizing — used by Input, IconInput, Button. */
export const formField = {
  height: 54,
  minHeight: 54,
  radius: radii.control,
  borderWidth: 1.5,
  /** Idle fields are a soft grey fill with no visible outline (same as the auth fields). */
  borderColor: ui.surfaceMuted,
  borderFocus: colors.forest,
  bg: ui.surfaceMuted,
  bgMuted: ui.surfaceMuted,
  bgFocus: '#FFFFFF',
  labelSize: 13,
  inputSize: 15,
};

/** Button sizing & shape — used by Button component app-wide. */
export const buttonTokens = {
  radius: radii.control,
  radiusSm: 14,
  heightLg: 52,
  heightMd: 48,
  heightSm: 42,
  borderWidth: 1.5,
};

/** Soft mint + forest brand palette */
export const classic = {
  screenBg: '#F6FAF2',
  screenBgAlt: '#EEF6E8',
  cardBorder: 'rgba(26,135,52,0.08)',
  cardBorderGold: 'rgba(48,184,79,0.25)',
  headerGoldLine: 'rgba(48,184,79,0.5)',
  subtlePattern: 'rgba(26,135,52,0.03)',
};

/** App-wide premium design system */
export const design = {
  /** Same canvas as the screens paint, so stack transitions never flash mint behind grey. */
  screenBg: ui.canvas,
  surface: premium.surfaceElevated,
  radiusLg: premium.radiusCard,
  radiusXl: radii.sheet,
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
    ...premium.shadowSoft,
  } as ViewStyle,
};

export const statusColors: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: colors.mint, text: colors.forest },
  confirmed: { bg: colors.soft, text: colors.green },
  in_progress: { bg: colors.mint, text: colors.forest },
  awaiting_verification: { bg: colors.mint, text: colors.forest },
  completed: { bg: colors.greyBg, text: colors.muted },
  cancelled: { bg: colors.errorBg, text: colors.error },
};

export const headerStyle = {
  headerStyle: { backgroundColor: colors.forest },
  headerTintColor: colors.white,
  headerTitleStyle: { fontFamily: fonts.displaySemi, fontSize: 17, letterSpacing: -0.25 },
};


/** Decorative header light (PremiumAurora): base washes + the drifting colour blobs. */
export const auroraPalette = {
  /** Deep emerald the dark aurora starts from — also the status-bar strip above dark headers. */
  deepTop: '#06361B',
  darkMid: '#0A5A2B',
  darkBottom: '#0C7A39',
  /** Calm brand-green header (Home) — also the status-bar strip above it. */
  brandTop: '#0F8C40',
  brandMid: '#0B7C38',
  brandBottom: '#086A2F',
  lightMid: '#F3FAF5',
  lightBottom: '#EAF4EC',
  gold: '#F4D98C',
  goldPale: '#F6E2A8',
  mint: '#4FE08A',
  mintSoft: '#6BE6A0',
  mintPale: '#B7E6C4',
  teal: '#13B7A0',
  tealSoft: '#19C2A6',
  tealPale: '#BDEBE0',
} as const;

/** Toast skins (PremiumToast): accent bar / icon gradient, soft halo, progress rail and border. */
export const toastTones = {
  success: {
    accentSoft: 'rgba(31,154,62,0.14)',
    gradient: [colors.forest, colors.green] as const,
    progress: colors.green,
    border: 'rgba(180,220,165,0.95)',
  },
  error: {
    accentSoft: colors.errorBg,
    gradient: ['#9B3412', '#C0492E'] as const,
    progress: '#C0492E',
    border: 'rgba(245,180,160,0.9)',
  },
  info: {
    accentSoft: colors.secondarySoft,
    gradient: [colors.secondaryDark, '#3A9688'] as const,
    progress: '#3A9688',
    border: 'rgba(160,210,200,0.95)',
  },
  warning: {
    accentSoft: premium.accentGoldBg,
    gradient: ['#B6841C', '#D4A017'] as const,
    progress: '#D4A017',
    border: 'rgba(245,184,46,0.55)',
  },
  offline: {
    accentSoft: colors.greyBg,
    gradient: ['#374151', '#6E8075'] as const,
    progress: '#6E8075',
    border: 'rgba(160,175,165,0.85)',
    badge: '#4B5563',
  },
} as const;

/** Dimmed backdrop behind sheets and dialogs. */
export const scrim = 'rgba(8,14,10,0.45)';
