import type { CustomerUiCopy } from '@/types/api';

export const DEFAULT_CUSTOMER_UI_COPY: CustomerUiCopy = {
  // Home chrome
  homeGreetingMorning: 'Good morning',
  homeGreetingAfternoon: 'Good afternoon',
  homeGreetingEvening: 'Good evening',
  homeSetLocation: 'Set location',
  homeFindingLocation: 'Finding location…',
  homeEmptyNoMatchesTitle: 'No matches',
  homeEmptyNoMatchesMessage: 'Try another search or filter.',
  homeEmptyNoServicesTitle: 'No services yet',
  homeEmptyNoServicesMessage: 'Check back soon.',
  homeEmptyBrowseAll: 'Browse all',
  homeCarouselOfferKicker: 'Limited offer',
  homeCarouselBookKicker: 'Book now',
  homeCarouselFallbackSub: '20% off first booking',
  homePopularBadge: 'Most booked',

  // Auth
  authLoginTitle: 'Welcome back',
  authLoginSubtitle: 'Sign in to continue',
  authLoginEmailPlaceholder: 'Email or phone',
  authLoginPasswordPlaceholder: 'Password',
  authLoginButton: 'Sign in',
  authLoginSuccessToast: 'Welcome back',
  authLoginErrorToast: 'Sign in failed',
  authRegisterTitle: 'Create\naccount',
  authRegisterSubtitle: 'Join {brand} for trusted pest control at home',
  authRegisterButton: 'Create account',
  authRegisterSuccessToast: 'Account created',
  authRegisterErrorToast: 'Could not create account',
  authOtpTitle: 'Verify phone',
  authOtpSubtitle: 'Enter the code we sent you',
  authOtpButton: 'Verify',

  // Offers
  offersScreenTitle: 'Offers',
  offersSectionAvailable: 'Available coupons',
  offersEmptyHint: 'Seasonal deals appear here',
  offersPickServiceTitle: 'Choose a service',
  offersNoServicesAlertTitle: 'No services',
  offersNoServicesAlertBody: 'No services available to book right now.',
  offersHeroFallbackTitle: 'Exclusive deals',
  offersHeroFallbackSub: 'Save on pest control & home care',

  // Profile
  profileScreenTitle: 'Your profile',
  profileQuickBook: 'Book',
  profileQuickBookings: 'Bookings',
  profileQuickOffers: 'Offers',
  profileQuickSupport: 'Support',
  profileStatActive: 'ACTIVE',
  profileStatDone: 'DONE',
  profileStatSaved: 'SAVED',
  profileStatPay: 'PAY',
  profileMenuBookings: 'My Bookings',
  profileMenuBookingsSub: 'Track, reschedule & rate visits',
  profileMenuAddresses: 'Saved Addresses',
  profileMenuAddressesSub: 'Home, office & more',
  profileMenuPayments: 'Payment Methods',
  profileMenuPaymentsSub: 'UPI, cards & wallets',
  profileMenuOffers: 'Offers & Referrals',
  profileMenuOffersSub: 'Coupons and rewards',
  profileMenuNotifications: 'Notifications',
  profileMenuNotificationsSub: 'Reminders & booking updates',
  profileMenuSettings: 'Settings',
  profileMenuSettingsSub: 'Language, privacy & app preferences',
  profileMenuHelp: 'Help & Support',
  profileMenuHelpSub: 'Chat or call our team',
  profileMenuFaq: 'FAQs',
  profileMenuFaqSub: 'Answers to common questions',
  profileMenuAbout: 'About',
  profileMenuAboutSub: 'Company & app details',
  profileMenuTerms: 'Terms of Service',
  profileMenuTermsSub: 'Booking & cancellation policies',
  profileMenuPrivacy: 'Privacy Policy',
  profileMenuPrivacySub: 'How we use your data',
  profileSignOut: 'Sign out',
  profileInviteTitle: 'Invite to {brand}',

  // Help
  helpScreenTitle: 'Help & support',
  helpContactTitle: 'Contact us',
  helpResourcesTitle: 'Resources',
  helpPhoneLabel: 'Phone',
  helpEmailLabel: 'Email',
  helpWhatsappLabel: 'WhatsApp',
  helpHoursLabel: 'Hours',

  // Account screens
  addressesScreenTitle: 'Saved addresses',
  addressesEmptyTitle: 'No addresses yet',
  addressesEmptyMessage: 'Add a home or office address for faster booking.',
  addressesAddButton: 'Add address',
  paymentsScreenTitle: 'Payment methods',
  paymentsEmptyTitle: 'No payment methods',
  paymentsEmptyMessage: 'Add UPI or a card for quicker checkout.',
  paymentsAddButton: 'Add payment method',
  notificationsScreenTitle: 'Notifications',
  notificationsEmptyTitle: 'You’re all caught up',
  notificationsEmptyMessage: 'Booking updates and offers will show here.',
  settingsScreenTitle: 'Settings',
  servicesScreenTitle: 'Services',
};

function strField(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

export function getCustomerUiCopy(copy?: Partial<CustomerUiCopy> | null): CustomerUiCopy {
  const d = DEFAULT_CUSTOMER_UI_COPY;
  const b = copy ?? {};
  const out = { ...d };
  for (const key of Object.keys(d) as (keyof CustomerUiCopy)[]) {
    out[key] = strField(b[key], d[key]);
  }
  return out;
}

/** Replace `{brand}` placeholders in CMS strings. */
export function fillBrand(template: string, brand: string): string {
  return template.replace(/\{brand\}/g, brand.trim() || 'Mr Antidot');
}

/** Field groups for admin Content → Screens tab. */
export const CUSTOMER_UI_ADMIN_GROUPS = {
  home: [
    ['homeGreetingMorning', 'Greeting · morning'],
    ['homeGreetingAfternoon', 'Greeting · afternoon'],
    ['homeGreetingEvening', 'Greeting · evening'],
    ['homeSetLocation', 'Location · set'],
    ['homeFindingLocation', 'Location · finding'],
    ['homeEmptyNoMatchesTitle', 'Empty · no matches title'],
    ['homeEmptyNoMatchesMessage', 'Empty · no matches message'],
    ['homeEmptyNoServicesTitle', 'Empty · no services title'],
    ['homeEmptyNoServicesMessage', 'Empty · no services message'],
    ['homeEmptyBrowseAll', 'Empty · browse all button'],
    ['homeCarouselOfferKicker', 'Carousel · offer kicker'],
    ['homeCarouselBookKicker', 'Carousel · book kicker'],
    ['homeCarouselFallbackSub', 'Carousel · fallback subtitle'],
    ['homePopularBadge', 'Popular card badge'],
  ] as const,
  auth: [
    ['authLoginTitle', 'Login title'],
    ['authLoginSubtitle', 'Login subtitle ({brand})'],
    ['authLoginEmailPlaceholder', 'Login email placeholder'],
    ['authLoginPasswordPlaceholder', 'Login password placeholder'],
    ['authLoginButton', 'Login button'],
    ['authLoginSuccessToast', 'Login success toast'],
    ['authLoginErrorToast', 'Login error toast'],
    ['authRegisterTitle', 'Register title'],
    ['authRegisterSubtitle', 'Register subtitle ({brand})'],
    ['authRegisterButton', 'Register button'],
    ['authRegisterSuccessToast', 'Register success toast'],
    ['authRegisterErrorToast', 'Register error toast'],
    ['authOtpTitle', 'OTP title'],
    ['authOtpSubtitle', 'OTP subtitle'],
    ['authOtpButton', 'OTP button'],
  ] as const,
  offers: [
    ['offersScreenTitle', 'Screen title'],
    ['offersSectionAvailable', 'Available coupons title'],
    ['offersEmptyHint', 'Empty hint'],
    ['offersPickServiceTitle', 'Pick service sheet title'],
    ['offersNoServicesAlertTitle', 'No services alert title'],
    ['offersNoServicesAlertBody', 'No services alert body'],
    ['offersHeroFallbackTitle', 'Hero fallback title'],
    ['offersHeroFallbackSub', 'Hero fallback subtitle'],
  ] as const,
  profile: [
    ['profileScreenTitle', 'Screen title'],
    ['profileQuickBook', 'Quick · Book'],
    ['profileQuickBookings', 'Quick · Bookings'],
    ['profileQuickOffers', 'Quick · Offers'],
    ['profileQuickSupport', 'Quick · Support'],
    ['profileStatActive', 'Stat · Active'],
    ['profileStatDone', 'Stat · Done'],
    ['profileStatSaved', 'Stat · Saved'],
    ['profileStatPay', 'Stat · Pay'],
    ['profileMenuBookings', 'Menu · Bookings'],
    ['profileMenuBookingsSub', 'Menu · Bookings subtitle'],
    ['profileMenuAddresses', 'Menu · Addresses'],
    ['profileMenuAddressesSub', 'Menu · Addresses subtitle'],
    ['profileMenuPayments', 'Menu · Payments'],
    ['profileMenuPaymentsSub', 'Menu · Payments subtitle'],
    ['profileMenuOffers', 'Menu · Offers'],
    ['profileMenuOffersSub', 'Menu · Offers subtitle'],
    ['profileMenuNotifications', 'Menu · Notifications'],
    ['profileMenuNotificationsSub', 'Menu · Notifications subtitle'],
    ['profileMenuSettings', 'Menu · Settings'],
    ['profileMenuSettingsSub', 'Menu · Settings subtitle'],
    ['profileMenuHelp', 'Menu · Help'],
    ['profileMenuHelpSub', 'Menu · Help subtitle'],
    ['profileMenuFaq', 'Menu · FAQ'],
    ['profileMenuFaqSub', 'Menu · FAQ subtitle'],
    ['profileMenuAbout', 'Menu · About'],
    ['profileMenuAboutSub', 'Menu · About subtitle'],
    ['profileMenuTerms', 'Menu · Terms'],
    ['profileMenuTermsSub', 'Menu · Terms subtitle'],
    ['profileMenuPrivacy', 'Menu · Privacy'],
    ['profileMenuPrivacySub', 'Menu · Privacy subtitle'],
    ['profileSignOut', 'Sign out'],
    ['profileInviteTitle', 'Invite share title ({brand})'],
  ] as const,
  help: [
    ['helpScreenTitle', 'Screen title'],
    ['helpContactTitle', 'Contact section'],
    ['helpResourcesTitle', 'Resources section'],
    ['helpPhoneLabel', 'Phone label'],
    ['helpEmailLabel', 'Email label'],
    ['helpWhatsappLabel', 'WhatsApp label'],
    ['helpHoursLabel', 'Hours label'],
  ] as const,
  account: [
    ['addressesScreenTitle', 'Addresses title'],
    ['addressesEmptyTitle', 'Addresses empty title'],
    ['addressesEmptyMessage', 'Addresses empty message'],
    ['addressesAddButton', 'Addresses add button'],
    ['paymentsScreenTitle', 'Payments title'],
    ['paymentsEmptyTitle', 'Payments empty title'],
    ['paymentsEmptyMessage', 'Payments empty message'],
    ['paymentsAddButton', 'Payments add button'],
    ['notificationsScreenTitle', 'Notifications title'],
    ['notificationsEmptyTitle', 'Notifications empty title'],
    ['notificationsEmptyMessage', 'Notifications empty message'],
    ['settingsScreenTitle', 'Settings title'],
    ['servicesScreenTitle', 'Services catalog title'],
  ] as const,
} as const;

export type CustomerUiFieldKey = keyof CustomerUiCopy;
