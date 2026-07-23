import { DEFAULT_HOME_CONFIG, DEFAULT_HOME_PROMO } from '@/constants/homeContent';
import { DEFAULT_BOOKING_COPY, getBookingCopy } from '@/constants/bookingCopy';
import { DEFAULT_CUSTOMER_UI_COPY, getCustomerUiCopy } from '@/constants/customerUiCopy';
import type { AppConfig, HomeConfig, HomePromo } from '@/types/api';

export function mergeHomeConfig(incoming?: Partial<HomeConfig> | null): HomeConfig {
  const base = DEFAULT_HOME_CONFIG;
  if (!incoming) return { ...base, quickLabels: { ...base.quickLabels! } };
  return {
    ...base,
    ...incoming,
    sectionTitles: {
      services: incoming.sectionTitles?.services?.trim() || base.sectionTitles.services,
      popular: incoming.sectionTitles?.popular?.trim() || base.sectionTitles.popular,
    },
    categoryChips:
      incoming.categoryChips && incoming.categoryChips.length > 0
        ? incoming.categoryChips
        : base.categoryChips,
    searchPlaceholder: incoming.searchPlaceholder?.trim() || base.searchPlaceholder,
    servicesActionLabel: incoming.servicesActionLabel?.trim() || base.servicesActionLabel,
    popularActionLabel: incoming.popularActionLabel?.trim() || base.popularActionLabel,
    servicesSubtitle: incoming.servicesSubtitle?.trim() || base.servicesSubtitle,
    featuredServiceId: incoming.featuredServiceId || base.featuredServiceId,
    serviceTypesTitle: incoming.serviceTypesTitle?.trim() || base.serviceTypesTitle,
    serviceTypesAction: incoming.serviceTypesAction?.trim() || base.serviceTypesAction,
    bookSlideTitle: incoming.bookSlideTitle?.trim() || base.bookSlideTitle,
    bookSlideCta: incoming.bookSlideCta?.trim() || base.bookSlideCta,
    bookSlideFallbackSub: incoming.bookSlideFallbackSub?.trim() || base.bookSlideFallbackSub,
    promoCodeHint: incoming.promoCodeHint?.trim() || base.promoCodeHint,
    heroEyebrow: incoming.heroEyebrow?.trim() || base.heroEyebrow,
    heroSubtitle: incoming.heroSubtitle?.trim() || base.heroSubtitle,
    quickLabels: {
      book: incoming.quickLabels?.book?.trim() || base.quickLabels!.book,
      bookings: incoming.quickLabels?.bookings?.trim() || base.quickLabels!.bookings,
      offers: incoming.quickLabels?.offers?.trim() || base.quickLabels!.offers,
      help: incoming.quickLabels?.help?.trim() || base.quickLabels!.help,
    },
  };
}

export function mergeHomePromo(incoming?: HomePromo | null): HomePromo {
  if (!incoming || incoming.active === false) {
    return { ...DEFAULT_HOME_PROMO, active: incoming?.active !== false };
  }
  return {
    ...DEFAULT_HOME_PROMO,
    ...incoming,
    badge: incoming.badge?.trim() || DEFAULT_HOME_PROMO.badge,
    title: incoming.title?.trim() || DEFAULT_HOME_PROMO.title,
    ctaLabel: incoming.ctaLabel?.trim() || DEFAULT_HOME_PROMO.ctaLabel,
    active: true,
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  support: {
    phone: '+91 90000 00000',
    email: 'support@mrantidot.com',
    whatsapp: '',
    hours: 'Open 24/7',
  },
  branding: { name: 'Mr Antidot', tagline: 'Trusted pest control & home services' },
  trust: {
    guaranteeText: '100% satisfaction guarantee · Verified professionals',
    badges: ['Verified pros', 'On-time service', 'Safe chemicals', 'Post-service support'],
  },
  onboarding: {
    slides: [
      {
        title: 'Pest control made simple',
        subtitle: 'Book trusted professionals for your home or business in seconds.',
        icon: 'spray',
      },
      {
        title: 'Track every step',
        subtitle: 'Follow your technician live from visit start to photo proof.',
        icon: 'map',
      },
      {
        title: 'Guaranteed results',
        subtitle: 'Eco-safe treatments backed by our satisfaction promise.',
        icon: 'shield',
      },
    ],
    trustChips: ['Verified pros', 'On-time service', '4.8★ rated'],
  },
  legal: { termsMarkdown: '', privacyMarkdown: '' },
  aboutMarkdown: '',
  faq: [],
  booking: DEFAULT_BOOKING_COPY,
  customerUi: DEFAULT_CUSTOMER_UI_COPY,
};

/** Deep-merge CMS app config so empty API fields keep branded defaults. */
export function mergeAppConfig(incoming?: Partial<AppConfig> | null): AppConfig {
  const base = DEFAULT_APP_CONFIG;
  if (!incoming) return base;
  return {
    ...base,
    ...incoming,
    support: { ...base.support, ...incoming.support },
    branding: {
      name: incoming.branding?.name?.trim() || base.branding.name,
      tagline: incoming.branding?.tagline?.trim() || base.branding.tagline,
    },
    trust: {
      guaranteeText: incoming.trust?.guaranteeText?.trim() || base.trust.guaranteeText,
      badges:
        incoming.trust?.badges && incoming.trust.badges.length > 0
          ? incoming.trust.badges
          : base.trust.badges,
    },
    onboarding: {
      slides:
        incoming.onboarding?.slides && incoming.onboarding.slides.length > 0
          ? incoming.onboarding.slides
          : base.onboarding.slides,
      trustChips:
        incoming.onboarding?.trustChips && incoming.onboarding.trustChips.length > 0
          ? incoming.onboarding.trustChips
          : base.onboarding.trustChips,
    },
    legal: { ...base.legal, ...incoming.legal },
    aboutMarkdown: incoming.aboutMarkdown?.trim() || base.aboutMarkdown,
    faq: incoming.faq && incoming.faq.length > 0 ? incoming.faq : base.faq,
    booking: getBookingCopy(incoming.booking),
    customerUi: getCustomerUiCopy(incoming.customerUi),
  };
}
