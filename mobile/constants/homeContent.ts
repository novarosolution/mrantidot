import type { HomeConfig, HomePromo } from '@/types/api';

/** Fallback copy when CMS/home API is empty — keep tone premium & on-brand. */
export const DEFAULT_HOME_CONFIG: HomeConfig = {
  sectionTitles: { services: 'Our services', popular: 'Popular now' },
  servicesSubtitle: 'Certified experts · Transparent pricing',
  searchPlaceholder: "Search 'cockroach control'",
  servicesActionLabel: 'View all',
  popularActionLabel: 'See more',
  categoryChips: [
    { label: 'All' },
    { label: 'Residential', category: 'residential' },
    { label: 'Commercial', category: 'commercial' },
    { label: 'Cleaning', category: 'cleaning' },
  ],
  serviceTypesTitle: 'Service types',
  serviceTypesAction: 'View all',
  bookSlideTitle: 'Book pest control & home services',
  bookSlideCta: 'Book Now',
  bookSlideFallbackSub: 'Certified experts · Same-day slots',
  promoCodeHint: 'ANTIDOT20',
  quickLabels: {
    book: 'Book',
    bookings: 'Bookings',
    offers: 'Offers',
    help: 'Help',
  },
  heroEyebrow: 'Mr Antidot',
  heroSubtitle: 'Eco-safe care for your space',
};

export const DEFAULT_HOME_PROMO: HomePromo = {
  badge: 'Limited offer',
  title: 'Flat 20% off your first booking',
  ctaLabel: 'Claim Offer',
  active: true,
};

/** @deprecated Prefer homeConfig fields from CMS — kept for any residual imports. */
export const HOME_SECTION = {
  serviceTypes: DEFAULT_HOME_CONFIG.serviceTypesTitle!,
  serviceTypesAction: DEFAULT_HOME_CONFIG.serviceTypesAction!,
  bookSlideTitle: DEFAULT_HOME_CONFIG.bookSlideTitle!,
  bookSlideCta: DEFAULT_HOME_CONFIG.bookSlideCta!,
  bookSlideFallbackSub: DEFAULT_HOME_CONFIG.bookSlideFallbackSub!,
  promoCodeHint: DEFAULT_HOME_CONFIG.promoCodeHint!,
} as const;

/** @deprecated Prefer homeConfig.quickLabels from CMS. */
export const HOME_QUICK_LABELS = DEFAULT_HOME_CONFIG.quickLabels!;
