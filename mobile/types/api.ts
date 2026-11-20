export type UserRole = 'customer' | 'technician' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_verification'
  | 'completed'
  | 'cancelled';

export type ServiceCategory = 'residential' | 'commercial' | 'cleaning' | 'general';

export type ServiceTypeKey =
  | 'ant'
  | 'cockroach'
  | 'rodent'
  | 'mosquito'
  | 'termite'
  | 'bed_bug'
  | 'bird'
  | 'flea'
  | 'spider'
  | 'lizard'
  | 'bee'
  | 'wood_borer'
  | 'general'
  | 'fumigation'
  | 'deep_cleaning'
  | 'silo';

export type PropertyTypeKey =
  | '1bhk'
  | '2bhk'
  | '3bhk'
  | '4bhk'
  | 'bungalow'
  | 'office'
  | 'cafe_restaurant'
  | 'hotel'
  | 'warehouse'
  | 'factory';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  city?: string;
  rating?: number;
  /** Admin-set public rating override for technicians. */
  displayRating?: number | null;
  jobsDone?: number;
  available?: boolean;
  disabled?: boolean;
  /** Technician pay: percent of job total, or flat ₹ per completed job. */
  payMode?: 'percent' | 'flat';
  payPercent?: number;
  payFlat?: number;
  /** Primary env-configured admin; role cannot be changed */
  protected?: boolean;
  createdAt?: string;
}

/** A bookable size/package — sized services are priced from the picked option. */
export interface ServiceOption {
  key: string;
  label: string;
  price: number;
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  iconKey: string;
  basePrice: number;
  shortDesc: string;
  rating?: number;
  category?: ServiceCategory;
  serviceTypes?: ServiceTypeKey[];
  active?: boolean;
  /** Admin display position (lower first). */
  sortOrder?: number;
  /** Pinned into the home "Most booked" rail. */
  showInPopular?: boolean;
  /** Listed in the home "All services" section (default true). */
  showOnHome?: boolean;
  createdAt?: string;
  stepTemplate?: string[];
  stats?: ServiceStats;
  /** Heading above the size picker, e.g. "Size of home". */
  optionsTitle?: string;
  options?: ServiceOption[];
  /** Approx. visit length in minutes (0/absent = derive from steps). */
  durationMins?: number;
  /** Admin-written detail content — empty lists hide their section. */
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  notes?: string[];
}

export interface HomePromo {
  badge: string;
  title: string;
  ctaLabel: string;
  serviceId?: string;
  active: boolean;
}

export interface HomeCategoryChip {
  label: string;
  category?: string;
}

export interface HomeQuickLabels {
  book: string;
  bookings: string;
  offers: string;
  help: string;
}

export interface HomeConfig {
  featuredServiceId?: string;
  sectionTitles: { services: string; popular: string };
  /** Subtitle under Our Services on home. */
  servicesSubtitle?: string;
  searchPlaceholder: string;
  servicesActionLabel: string;
  popularActionLabel: string;
  categoryChips: HomeCategoryChip[];
  serviceTypesTitle?: string;
  serviceTypesAction?: string;
  bookSlideTitle?: string;
  bookSlideCta?: string;
  bookSlideFallbackSub?: string;
  promoCodeHint?: string;
  quickLabels?: HomeQuickLabels;
  /** Optional hero eyebrow under greeting (e.g. brand line). */
  heroEyebrow?: string;
  /** Optional line under the user name on home hero. */
  heroSubtitle?: string;
}

export interface SupportConfig {
  phone: string;
  email: string;
  whatsapp?: string;
  hours?: string;
}

export interface BrandingConfig {
  name: string;
  tagline: string;
}

export interface TrustConfig {
  guaranteeText: string;
  badges: string[];
}

export interface OnboardingSlide {
  title: string;
  subtitle: string;
  icon?: string;
}

export interface OnboardingConfig {
  slides: OnboardingSlide[];
  trustChips: string[];
}

export interface LegalConfig {
  termsMarkdown: string;
  privacyMarkdown: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BookingCopyConfig {
  scheduleStepTitle: string;
  scheduleStepSubtitle: string;
  standardModeLabel: string;
  customModeLabel: string;
  customNotesPlaceholder: string;
  pendingCustomerTitle: string;
  pendingCustomerHint: string;
  pendingFactsSubtitle: string;
  pendingReviewNote: string;
  requestSubmittedToast: string;
  adminRequestTitle: string;
  adminConfirmTitle: string;
  adminConfirmHint: string;
  adminConfirmButton: string;
  wizardScreenTitle: string;
  wizardStepSchedule: string;
  wizardStepProperty: string;
  wizardStepAddress: string;
  wizardStepPayment: string;
  wizardStepConfirm: string;
  wizardReviewSectionTitle: string;
  wizardContinueButton: string;
  wizardSubmitButton: string;
  wizardBackButton: string;
  listScreenTitle: string;
  listFilterActive: string;
  listFilterCompleted: string;
  listFilterCancelled: string;
  listNextVisitLabel: string;
  listEmptyActive: string;
  listEmptyCompleted: string;
  listEmptyCancelled: string;
  listBookServiceButton: string;
  successSummaryTitle: string;
  successLabelReference: string;
  successLabelService: string;
  successLabelVisit: string;
  successLabelPayment: string;
  successLabelTotal: string;
  successViewBookingButton: string;
  successHomeButton: string;
  detailScreenTitle: string;
  detailDetailsTitle: string;
  detailDetailsSubtitle: string;
  trackingSectionTitle: string;
  trackingSectionSubtitle: string;
  trackingStepReceived: string;
  trackingStepConfirmed: string;
  trackingStepAssignExpert: string;
  trackingStepShareStartCode: string;
  trackingStepInProgress: string;
  trackingStepShareCompletionCode: string;
  trackingStepCompleted: string;
  activitySectionTitle: string;
  activitySectionSubtitle: string;
  treatmentStepsTitle: string;
  treatmentStepsLiveSubtitle: string;
  treatmentStepsDoneSubtitle: string;
  detailLiveProgressLabel: string;
  detailLiveBadge: string;
  otpStartTitle: string;
  otpStartSubtitle: string;
  otpEndTitle: string;
  otpEndSubtitle: string;
  detailActionEnterCode: string;
  detailActionReview: string;
  detailActionCancel: string;
  detailActionBookAgain: string;
  factLabelWhen: string;
  factLabelWhere: string;
  factLabelProperty: string;
  factLabelPayment: string;
  factLabelCoupon: string;
  factLabelTechnician: string;
  priceBreakdownTitle: string;
  priceLabelService: string;
  priceLabelGst: string;
  priceLabelCoupon: string;
  priceLabelTotal: string;
  cancelConfirmTitle: string;
  cancelConfirmMessage: string;
  cancelConfirmKeep: string;
  cancelConfirmAction: string;
  statusGuidancePending: string;
  statusGuidanceConfirmed: string;
  statusGuidanceInProgress: string;
  statusGuidanceAwaitingVerification: string;
  statusGuidanceCompleted: string;
  statusGuidanceCancelled: string;
  techJobsTitle: string;
  techProfileTitle: string;
  techCheckInTitle: string;
  techCheckInSubtitle: string;
  techOnDutyButton: string;
  techOffDutyButton: string;
  techOnDutyBadge: string;
  techOffDutyBadge: string;
  techOffDutyHint: string;
  techBackOnDutyButton: string;
  techPerformanceTitle: string;
  techScheduleTitle: string;
  techJobVisitsTitle: string;
  techEmptyJobsTitle: string;
  techEmptyJobsMessage: string;
  techJobValueLabel: string;
  techEarningLabel: string;
  techVisitTimesTitle: string;
  techJobDetailsTitle: string;
  techTreatmentStepsTitle: string;
  techActivityTitle: string;
  techEnterStartCode: string;
  techEnterCompletionCode: string;
  techCompleteStepsFirst: string;
  techStartOtpTitle: string;
  techEndOtpTitle: string;
  techLocationNoteLabel: string;
  techLocationNotePlaceholder: string;
  techNoStepsHint: string;
  pendingPastHint: string;
  listPendingPastHint: string;
  liveNowLabel: string;
  liveOngoingLabel: string;
  wizardDayHint: string;
  wizardTimeTitle: string;
  wizardNotesLabel: string;
  wizardIncludedTitle: string;
  wizardPropertyTitle: string;
  wizardPropertySubtitle: string;
  wizardAddressTitle: string;
  wizardAddressSubtitle: string;
  wizardSavedAddressesTitle: string;
  wizardNewAddressTitle: string;
  wizardAddressDetailsTitle: string;
  wizardAddressFormSubtitle: string;
  wizardPhotosTitle: string;
  wizardPhotosSubtitle: string;
  wizardPaymentTitle: string;
  wizardSummaryTitle: string;
  wizardDetailsTitle: string;
  wizardLabelSchedule: string;
  wizardLabelProperty: string;
  wizardLabelAddress: string;
  wizardLabelPayment: string;
  wizardLabelCoupon: string;
  wizardLabelPhotos: string;
  wizardNextStepsTitle: string;
  wizardCancellationTitle: string;
  wizardCancellationNote: string;
  wizardTotalCaption: string;
  wizardDetectedAreaHint: string;
}

/** Customer-facing screen copy (home chrome, auth, offers, profile, help, account). */
export interface CustomerUiCopy {
  homeGreetingMorning: string;
  homeGreetingAfternoon: string;
  homeGreetingEvening: string;
  homeSetLocation: string;
  homeFindingLocation: string;
  homeEmptyNoMatchesTitle: string;
  homeEmptyNoMatchesMessage: string;
  homeEmptyNoServicesTitle: string;
  homeEmptyNoServicesMessage: string;
  homeEmptyBrowseAll: string;
  homeCarouselOfferKicker: string;
  homeCarouselBookKicker: string;
  homeCarouselFallbackSub: string;
  homePopularBadge: string;
  authLoginTitle: string;
  authLoginSubtitle: string;
  authLoginEmailPlaceholder: string;
  authLoginPasswordPlaceholder: string;
  authLoginButton: string;
  authLoginSuccessToast: string;
  authLoginErrorToast: string;
  authRegisterTitle: string;
  authRegisterSubtitle: string;
  authRegisterButton: string;
  authRegisterSuccessToast: string;
  authRegisterErrorToast: string;
  authOtpTitle: string;
  authOtpSubtitle: string;
  authOtpButton: string;
  offersScreenTitle: string;
  offersSectionAvailable: string;
  offersEmptyHint: string;
  offersPickServiceTitle: string;
  offersNoServicesAlertTitle: string;
  offersNoServicesAlertBody: string;
  offersHeroFallbackTitle: string;
  offersHeroFallbackSub: string;
  profileScreenTitle: string;
  profileQuickBook: string;
  profileQuickBookings: string;
  profileQuickOffers: string;
  profileQuickSupport: string;
  profileStatActive: string;
  profileStatDone: string;
  profileStatSaved: string;
  profileStatPay: string;
  profileMenuBookings: string;
  profileMenuBookingsSub: string;
  profileMenuAddresses: string;
  profileMenuAddressesSub: string;
  profileMenuPayments: string;
  profileMenuPaymentsSub: string;
  profileMenuOffers: string;
  profileMenuOffersSub: string;
  profileMenuNotifications: string;
  profileMenuNotificationsSub: string;
  profileMenuSettings: string;
  profileMenuSettingsSub: string;
  profileMenuHelp: string;
  profileMenuHelpSub: string;
  profileMenuFaq: string;
  profileMenuFaqSub: string;
  profileMenuAbout: string;
  profileMenuAboutSub: string;
  profileMenuTerms: string;
  profileMenuTermsSub: string;
  profileMenuPrivacy: string;
  profileMenuPrivacySub: string;
  profileSignOut: string;
  profileInviteTitle: string;
  helpScreenTitle: string;
  helpContactTitle: string;
  helpResourcesTitle: string;
  helpPhoneLabel: string;
  helpEmailLabel: string;
  helpWhatsappLabel: string;
  helpHoursLabel: string;
  addressesScreenTitle: string;
  addressesEmptyTitle: string;
  addressesEmptyMessage: string;
  addressesAddButton: string;
  paymentsScreenTitle: string;
  paymentsEmptyTitle: string;
  paymentsEmptyMessage: string;
  paymentsAddButton: string;
  notificationsScreenTitle: string;
  notificationsEmptyTitle: string;
  notificationsEmptyMessage: string;
  settingsScreenTitle: string;
  servicesScreenTitle: string;
  servicePriceHint: string;
  serviceFactOneTitle: string;
  serviceFactOneSub: string;
  serviceFactDurationSub: string;
  serviceFactThreeTitle: string;
  serviceFactThreeSub: string;
  serviceAboutTitle: string;
  serviceStepsTitle: string;
  serviceReviewsTitle: string;
  serviceFromLabel: string;
  serviceBookButton: string;
  browseTitle: string;
  browseSubtitle: string;
  browseBadges: string;
  settingsSubtitle: string;
  settingsCompleteHint: string;
  settingsDetailsTitle: string;
  settingsDetailsHint: string;
  paymentsSubtitle: string;
  helpSubtitle: string;
  helpGuideTitle: string;
  helpResourcesSub: string;
  profileNextVisitTitle: string;
  reviewScreenTitle: string;
  reviewHeading: string;
  reviewTagsTitle: string;
  reviewNoteLabel: string;
  homeTrustSub: string;
  homeTrackLive: string;
  homeViewVisit: string;
  homeSpotlightTitle: string;
  homeNewTitle: string;
  homeRailHomeTitle: string;
  homeRailHomeSub: string;
  homeRailBusinessTitle: string;
  homeRailBusinessSub: string;
  homeRailCleaningTitle: string;
  homeRailCleaningSub: string;
  homeClosingLine: string;
  homeHeroTitle: string;
  homeLocationLabel: string;
  homeHeroKicker: string;
  homeHeroCta: string;
  homeAllServices: string;
  homeCurationsTitle: string;
  homeCurationsSub: string;
  homeFeatureTag: string;
  serviceUnavailableTitle: string;
  serviceStartsAtLabel: string;
  serviceEarliestLabel: string;
  serviceOptionsHeading: string;
  serviceIncludedLink: string;
  serviceNotesTitle: string;
  serviceIncludedTitle: string;
  serviceExcludedTitle: string;
  serviceStepsSub: string;
  serviceWhyTitle: string;
  serviceShareText: string;
  serviceShareButton: string;
  serviceShareMessage: string;
  serviceRowViewDetails: string;
  serviceRowBook: string;
  browseAvailableTitle: string;
  browseEmptyTitle: string;
  browseEmptyMessage: string;
  browseHelpTitle: string;
  browseHelpSub: string;
  servicesAllLabel: string;
  servicesSortTitle: string;
  servicesSortPopular: string;
  servicesSortRating: string;
  servicesSortPrice: string;
  servicesCategoryLabel: string;
  servicesEmptyTitle: string;
  servicesEmptyMessage: string;
  servicesClearFilters: string;
  cartTitle: string;
  cartEditPackage: string;
  cartAddMore: string;
  cartCouponsTitle: string;
  cartCouponApplied: string;
  cartCouponSaved: string;
  cartCouponsAvailable: string;
  cartViewAll: string;
  cartChange: string;
  cartEdit: string;
  cartAdd: string;
  cartContactMissing: string;
  cartPropertyMissing: string;
  cartPropertyLabel: string;
  cartPropertyHint: string;
  cartPaymentMissing: string;
  cartPaymentLabel: string;
  cartPhotosMissing: string;
  cartPhotosHint: string;
  cartPhotosAdded: string;
  cartTotalLabel: string;
  cartGstNote: string;
  cartSavedNote: string;
  cartPolicyTitle: string;
  cartReadPolicy: string;
  cartStepAddress: string;
  cartStepSlot: string;
  cartStepProperty: string;
  cartStepPayment: string;
  cartTermsLine: string;
  cartTermsLink: string;
  cartPrivacyLink: string;
  cartSlotTitle: string;
  cartSlotHint: string;
  cartSlotConfirm: string;
  cartAddressTitle: string;
  cartAddressUse: string;
  cartAddressAddAnother: string;
  cartAddressFallback: string;
  cartDone: string;
  bookingsKicker: string;
  bookingsLoadingSub: string;
  bookingsEmptySub: string;
  bookingsCountSub: string;
  bookingsBookButton: string;
  bookingsUpcomingTitle: string;
  bookingsPastTitle: string;
  bookingsCancelledTitle: string;
  bookingsCountOne: string;
  bookingsCountMany: string;
  bookingsHintCode: string;
  bookingsHintAssigned: string;
  bookingsBookAgain: string;
  bookingsTrackLive: string;
  bookingsViewVisit: string;
  bookingsTimeConfirming: string;
  bookingsEmptyHintActive: string;
  bookingsEmptyHintCompleted: string;
  bookingsEmptyHintCancelled: string;
  bookingsHowToBook: string;
  bookingDetailStatusEyebrow: string;
  bookingDetailLiveEyebrow: string;
  bookingDetailJourneyTitle: string;
  bookingDetailCurrentStep: string;
  bookingDetailStepCompleted: string;
  bookingDetailStepInProgress: string;
  bookingDetailStepUpcoming: string;
  bookingDetailInvoiceTitle: string;
  bookingDetailCancel: string;
  bookingDetailReschedule: string;
  bookingDetailCancelledToast: string;
  bookingDetailRescheduledToast: string;
  bookingDetailRescheduledToastSub: string;
  bookingDetailCodeToast: string;
  offersBrowseLabel: string;
  offersFromPrice: string;
  offersCodeHint: string;
  offersFootnote: string;
  offersApplyQuestion: string;
  notificationsUnreadSub: string;
  notificationsCaughtUpSub: string;
  notificationsMarkAll: string;
  notificationsFilterAll: string;
  notificationsFilterUnread: string;
  notificationsUnreadEmptyTitle: string;
  notificationsUnreadEmptyMessage: string;
  addressesSavedSub: string;
  addressesSectionTitle: string;
  addressesDefaultBadge: string;
  addressesFootnote: string;
  addressesSetDefault: string;
  addressesSetDefaultSub: string;
  addressesDelete: string;
  addressesDeleteTitle: string;
  addressesKeep: string;
  addressesSheetTitle: string;
  addressesSheetHint: string;
  addressesSaveButton: string;
  addressesSavedToast: string;
  addressesRemovedToast: string;
  addressesDefaultToast: string;
  authFieldIdentifier: string;
  authFieldPassword: string;
  authForgotPassword: string;
  authForgotTitle: string;
  authForgotBody: string;
  authForgotBodyFallback: string;
  authSigningIn: string;
  authOrDivider: string;
  authOtpContinue: string;
  authSecureNote: string;
  authNewHere: string;
  authCreateAccountLink: string;
  authRequired: string;
  authWrongCredentials: string;
  authSignedInFallback: string;
  authCompleteProfileTitle: string;
  authCompleteProfileBody: string;
  authHaveAccount: string;
  authSignInLink: string;
  authFieldName: string;
  authFieldNamePlaceholder: string;
  authFieldPhone: string;
  authFieldPhonePlaceholder: string;
  authFieldEmail: string;
  authFieldEmailPlaceholder: string;
  authFieldNewPasswordPlaceholder: string;
  authFieldCity: string;
  authFieldCityPlaceholder: string;
  authCreatingAccount: string;
  authRegisterWelcome: string;
  authBackLabel: string;
  authFieldOptional: string;
  onboardSkip: string;
  onboardNext: string;
  onboardGetStarted: string;
  onboardChipExpert: string;
  onboardChipArriving: string;
  onboardChipPhoto: string;
  onboardChipEco: string;
  onboardChipVerified: string;
  onboardChipGuarantee: string;
  otpPhoneLabel: string;
  otpInvalidPhone: string;
  otpEnterCode: string;
  otpSendFirstTitle: string;
  otpSendFirstBody: string;
  otpSendButton: string;
  otpSending: string;
  otpVerifying: string;
  otpPreferPassword: string;
  webSeoTitle: string;
  webSeoDescription: string;
  webNavHome: string;
  webNavServices: string;
  webNavAbout: string;
  webNavTeam: string;
  webNavBlog: string;
  webNavGallery: string;
  webNavContact: string;
  webNavBookings: string;
  webNavLogin: string;
  webNavAccount: string;
  webNavLogout: string;
  webNavBookNow: string;
  webFloatWhatsapp: string;
  webFloatCall: string;
  webWhatsappMessage: string;
  webHeroEyebrow: string;
  webHeroTitle: string;
  webHeroSubtitle: string;
  webHeroPrimaryCta: string;
  webHeroSecondaryCta: string;
  webHeroSearchPlaceholder: string;
  webHeroPopularLabel: string;
  webStat1Value: string;
  webStat1Label: string;
  webStat2Value: string;
  webStat2Label: string;
  webStat3Value: string;
  webStat3Label: string;
  webStat4Value: string;
  webStat4Label: string;
  webOffersTitle: string;
  webOfferFixed: string;
  webOfferPercent: string;
  webOfferCopy: string;
  webOfferCopied: string;
  webServicesEyebrow: string;
  webServicesTitle: string;
  webServicesSubtitle: string;
  webServicesViewAll: string;
  webWhyEyebrow: string;
  webWhyTitle: string;
  webWhySubtitle: string;
  webWhy1Title: string;
  webWhy1Text: string;
  webWhy2Title: string;
  webWhy2Text: string;
  webWhy3Title: string;
  webWhy3Text: string;
  webWhy4Title: string;
  webWhy4Text: string;
  webProcessEyebrow: string;
  webProcessTitle: string;
  webStep1Title: string;
  webStep1Text: string;
  webStep2Title: string;
  webStep2Text: string;
  webStep3Title: string;
  webStep3Text: string;
  webStep4Title: string;
  webStep4Text: string;
  webSectorsEyebrow: string;
  webSectorsTitle: string;
  webSectorsSubtitle: string;
  webSectorsList: string;
  webMissionTitle: string;
  webMissionText: string;
  webVisionTitle: string;
  webVisionText: string;
  webReviewsEyebrow: string;
  webReviewsTitle: string;
  webTeamEyebrow: string;
  webTeamTitle: string;
  webTeamSubtitle: string;
  webTeamViewAll: string;
  webBlogEyebrow: string;
  webBlogTitle: string;
  webBlogViewAll: string;
  webBlogReadMore: string;
  webFaqEyebrow: string;
  webFaqTitle: string;
  webFaqSubtitle: string;
  webAppTitle: string;
  webAppText: string;
  webAppStoreUrl: string;
  webPlayStoreUrl: string;
  webCtaTitle: string;
  webCtaText: string;
  webCtaButton: string;
  webCtaCall: string;
  webAboutEyebrow: string;
  webAboutTitle: string;
  webAboutIntro: string;
  webAboutBody: string;
  webAboutPoints: string;
  webScienceTitle: string;
  webScienceText: string;
  webScience1Title: string;
  webScience1Text: string;
  webScience2Title: string;
  webScience2Text: string;
  webScience3Title: string;
  webScience3Text: string;
  webScience4Title: string;
  webScience4Text: string;
  webContactEyebrow: string;
  webContactTitle: string;
  webContactSubtitle: string;
  webContactPhoneLabel: string;
  webContactEmailLabel: string;
  webContactWhatsappLabel: string;
  webContactAddressLabel: string;
  webContactHoursLabel: string;
  webAddress: string;
  webMapEmbedUrl: string;
  webContactFormTitle: string;
  webContactFormSubtitle: string;
  webContactFormName: string;
  webContactFormEmail: string;
  webContactFormPhone: string;
  webContactFormService: string;
  webContactFormServiceAny: string;
  webContactFormMessage: string;
  webContactFormButton: string;
  webContactFormSuccess: string;
  webFooterAbout: string;
  webFooterServicesTitle: string;
  webFooterCompanyTitle: string;
  webFooterContactTitle: string;
  webNewsletterTitle: string;
  webNewsletterPlaceholder: string;
  webNewsletterButton: string;
  webNewsletterSuccess: string;
  webSocialFacebook: string;
  webSocialInstagram: string;
  webSocialYoutube: string;
  webSocialLinkedin: string;
  webCopyright: string;
  webFooterCredit: string;
  webFooterCreditUrl: string;
  webServicesPageTitle: string;
  webServicesPageSubtitle: string;
  webServicesSearchPlaceholder: string;
  webBookTitle: string;
  webBookLoginHint: string;
  webBookDateLabel: string;
  webBookSlotLabel: string;
  webBookNotesLabel: string;
  webBookNotesPlaceholder: string;
  webBookCouponPlaceholder: string;
  webBookCouponApply: string;
  webBookPayAfter: string;
  webBookPayOnline: string;
  webBookSubtotal: string;
  webBookGst: string;
  webBookDiscount: string;
  webBookConfirm: string;
  webBookConfirming: string;
  webSuccessTitle: string;
  webSuccessText: string;
  webSuccessViewBooking: string;
  webSuccessHome: string;
  webAccountTitle: string;
  webAccountSave: string;
  webAccountSaved: string;
  webGalleryTitle: string;
  webGallerySubtitle: string;
  webBlogPageTitle: string;
  webBlogPageSubtitle: string;
  webTeamPageTitle: string;
  webTeamPageSubtitle: string;
  webNotFoundTitle: string;
  webNotFoundText: string;
  webBookPickSize: string;
  webBookAddressLine: string;
  webContactFormError: string;
  webTeamExperience: string;
  webTeamYears: string;
  webTeamEducation: string;
  webTeamResponsibilities: string;
  webTeamCertifications: string;
  webTeamExpertise: string;
  webEmptyListText: string;
  webBlogRelatedTitle: string;
}

export interface AppConfig {
  support: SupportConfig;
  branding: BrandingConfig;
  trust: TrustConfig;
  onboarding: OnboardingConfig;
  legal: LegalConfig;
  aboutMarkdown: string;
  faq: FaqItem[];
  booking?: BookingCopyConfig;
  customerUi?: CustomerUiCopy;
}

export interface BookingStatusCounts {
  total: number;
  byStatus: Record<string, number>;
}

export interface ServiceStats {
  bookingCount: number;
  reviewCount: number;
  /** Real average from reviews — admin API only. */
  realAvgRating?: number | null;
  /** @deprecated use realAvgRating */
  avgRating?: number | null;
}

export interface ServiceReview {
  id: string;
  stars: number;
  tags: string[];
  comment?: string;
  customerName: string;
  createdAt?: string;
}

export interface AdminReview {
  id: string;
  bookingId: string;
  stars: number;
  tags: string[];
  comment?: string;
  hidden: boolean;
  customerName: string;
  serviceName: string;
  createdAt?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
}

export interface PaymentMethodRecord {
  id: string;
  type: 'upi_card' | 'pay_after';
  label: string;
  details?: string;
  isDefault: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  bookingId?: string;
  createdAt?: string;
}

export type OfferDiscountType = 'fixed' | 'percent';

export interface Offer {
  id: string;
  code: string;
  discount: number;
  discountType?: OfferDiscountType;
  description: string;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  useCount?: number;
  minOrderAmount?: number;
}

export interface BookingStep {
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'done';
  photoUrl?: string;
  /** Multiple progress photos for this treatment step. */
  photoUrls?: string[];
  capturedAt?: string;
  geo?: { lat: number; lng: number; address: string };
}

export interface BookingAmount {
  base: number;
  gst: number;
  coupon: number;
  total: number;
}

/** Client / admin service invoice with full booking details. */
export interface BookingInvoice {
  invoiceNumber: string;
  issuedAt: string;
  brand: { name: string; tagline: string };
  support: { phone: string; email: string; hours?: string };
  booking: {
    id: string;
    status: string;
    createdAt?: string;
    completedAt?: string;
    scheduleLabel: string;
    scheduleDate: string;
    scheduleSlot: string;
    scheduleTime?: string;
    address: string;
    propertyType?: string;
    propertyTypeLabel?: string;
    paymentMethod: string;
    paymentMethodLabel: string;
    couponCode?: string;
  };
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
  };
  technician?: {
    id: string;
    name: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    category?: string;
    shortDesc?: string;
    iconKey?: string;
    serviceTypes: string[];
    basePrice?: number;
  };
  steps: Array<{
    title: string;
    status: string;
    photoCount: number;
    capturedAt?: string;
  }>;
  amount: BookingAmount;
  text: string;
}

export interface AvailableTechnician {
  id: string;
  name: string;
  rating: number;
  jobsDone: number;
  city?: string;
}

export type AssignmentMode = 'auto' | 'customer_pick';

export type TrackingEventType =
  | 'assigned'
  | 'start_otp_sent'
  | 'work_started'
  | 'step_done'
  | 'end_otp_sent'
  | 'work_completed'
  | 'cancelled'
  | 'admin_override'
  | 'schedule_confirmed'
  | 'rescheduled';

export interface TrackingEvent {
  at: string;
  event: TrackingEventType;
  meta?: Record<string, unknown>;
}

export interface WorkOtpView {
  start?: { code: string; expiresIn: number };
  end?: { code: string; expiresIn: number };
}

export interface WorkOtpAdminView {
  start?: { masked: string; code?: string; verifiedAt?: string; expiresAt?: string };
  end?: { masked: string; code?: string; verifiedAt?: string; expiresAt?: string };
}

export type ScheduleMode = 'standard' | 'custom';

export interface ScheduleRequest {
  date: string;
  slot?: string;
  time?: string;
  notes?: string;
}

export interface BookingSchedule {
  date: string;
  slot: string;
  time?: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduleMode?: ScheduleMode;
  scheduleRequest?: ScheduleRequest;
  schedule: BookingSchedule;
  scheduleConfirmedAt?: string;
  propertyType?: PropertyTypeKey;
  propertyTypeLabel?: string;
  /** Size/package picked at booking — label and price locked then. */
  option?: { key: string; label: string; price: number };
  address: string;
  amount: BookingAmount;
  paymentMethod: string;
  assignmentMode?: AssignmentMode;
  steps: BookingStep[];
  problemPhotos: string[];
  couponCode?: string;
  service?: Service | string;
  customer?: User | string;
  technician?: User | string;
  workOtp?: WorkOtpView | WorkOtpAdminView;
  workStartedAt?: string;
  workCompletedAt?: string;
  tracking?: TrackingEvent[];
  otpRequired?: 'start' | 'end' | null;
  createdAt?: string;
  /** Locked technician take-home (admin view / completed jobs). */
  technicianEarning?: number;
  /** Technician view — job total for assigned active/completed jobs only */
  jobValue?: number;
  /** Technician view — take-home (locked or estimated from pay rules) */
  techEarning?: number;
}

export interface Review {
  id: string;
  bookingId: string;
  technicianId: string;
  customerId: string;
  stars: number;
  tags: string[];
  comment?: string;
  photos: string[];
}

export interface TechnicianStats {
  assigned: number;
  inProgress: number;
  completed: number;
  awaitingVerification?: number;
  rating: number;
  jobsDone: number;
  /** Earnings for the selected month (schedule.date in range). */
  earnings: number;
  monthEarnings?: number;
  earningsAllTime?: number;
  paySummary?: string;
  payMode?: 'percent' | 'flat';
  payPercent?: number;
  payFlat?: number;
  month?: string;
  attendance?: Record<string, DayAttendanceStatus>;
  todayStatus?: DayAttendanceStatus;
  analytics?: TechnicianAnalytics;
  jobVisits?: JobVisitSummary[];
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  periodCount: number;
}

export interface AdminExtendedAnalytics {
  reviews: { total: number; averageRating: number; periodCount: number };
  offers: { total: number; active: number; totalRedemptions: number };
  catalog: { totalServices: number; activeServices: number };
  performance: {
    completionRate: number;
    cancellationRate: number;
    avgOrderValue: number;
    couponBookings: number;
  };
  paymentSplit: { upi_card: number; pay_after: number };
  topTechnicians: { id: string; name: string; jobs: number; revenue: number }[];
  topCustomers: { id: string; name: string; bookings: number; spend: number }[];
  bookingsTrend: { label: string; count: number }[];
}

export interface AdminStats {
  totalBookings: number;
  byStatus: Record<string, number>;
  statusBreakdown?: StatusBreakdownItem[];
  periodPending?: number;
  pendingBookings?: Booking[];
  revenueCompleted: number;
  periodRevenue?: number;
  periodBookings?: number;
  customers: number;
  technicians: number;
  topServices: { serviceId: string; name: string; count: number }[];
  recentBookings: Booking[];
  revenueByMonth?: { label: string; amount: number }[];
  deltas?: {
    revenue: string;
    bookings: string;
    activeJobs: string;
    customers: string;
    pending?: string;
  };
  period?: string;
  analytics?: AdminExtendedAnalytics;
}

export interface AdminCustomer extends User {
  bookingCount: number;
  totalSpend: number;
  lastBookingAt?: string;
  statusTag: 'active' | 'inactive' | 'vip';
}

export interface AdminCustomersResponse {
  customers: AdminCustomer[];
  summary: { total: number; new: number; vip: number };
}

export interface AdminTechnician extends User {
  activeJobs?: number;
  completedJobs?: number;
  lastJobDate?: string;
}

export interface TechnicianDetailStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  earnings: number;
  lastJobDate?: string;
  reviewCount: number;
  paySummary?: string;
}

export interface AttendanceTrendBucket {
  label: string;
  present: number;
  absent: number;
}

export interface JobsTrendBucket {
  label: string;
  completed: number;
  earnings: number;
}

export interface GlobalPendingSummary {
  count: number;
  periodCount: number;
  bookings: Booking[];
}

export type TechnicianMetricKey =
  | 'attendance_rate'
  | 'days_present'
  | 'days_absent'
  | 'days_leave'
  | 'completion_rate'
  | 'jobs_started'
  | 'jobs_completed'
  | 'jobs_no_show'
  | 'on_time'
  | 'avg_visit'
  | 'pending_global'
  | 'status_pending'
  | 'status_confirmed'
  | 'status_in_progress'
  | 'status_awaiting_verification'
  | 'status_completed'
  | 'status_cancelled'
  | 'week_jobs'
  | 'week_earnings'
  | 'week_attendance'
  | 'active'
  | 'in_progress'
  | 'verify'
  | 'completed'
  | 'earnings';

export interface TechnicianDetailResponse {
  technician: User;
  bookings: Booking[];
  stats: TechnicianDetailStats;
  reviews: Review[];
  calendar: Record<string, number>;
  month?: string;
  attendance?: Record<string, DayAttendanceStatus>;
  analytics?: TechnicianAnalytics;
  jobVisits?: JobVisitSummary[];
  globalPending?: GlobalPendingSummary;
  statusBreakdown?: StatusBreakdownItem[];
  attendanceTrend?: AttendanceTrendBucket[];
  jobsTrend?: JobsTrendBucket[];
}

export type DayAttendanceStatus = 'came' | 'not_came' | 'pending' | 'future' | 'leave';

export type AttendanceRecord = {
  id: string;
  technicianId: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  checkedInAt: string;
  checkedOutAt?: string;
  source: string;
  note?: string;
};

export type LeaveType = 'casual' | 'sick' | 'emergency' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type LeaveRequest = {
  id: string;
  technicianId: string;
  technicianName?: string;
  technicianPhone?: string;
  from: string;
  to: string;
  type: LeaveType;
  status: LeaveStatus;
  reason?: string;
  adminNote?: string;
  createdAt?: string;
};

export type PayrollRow = {
  technicianId: string;
  name: string;
  phone?: string;
  available: boolean;
  disabled: boolean;
  paySummary: string;
  jobsCompleted: number;
  earnings: number;
};

export type JobVisitStatus =
  | 'completed'
  | 'in_progress'
  | 'no_show'
  | 'scheduled'
  | 'cancelled';

export interface JobVisitSummary {
  bookingId: string;
  date: string;
  slot: string;
  status: JobVisitStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  startDeltaMinutes?: number;
  punctuality?: 'on_time' | 'late' | 'early' | 'unknown';
  onTime?: boolean;
}

export interface TechnicianAnalytics {
  daysPresent: number;
  daysAbsent: number;
  daysLeave?: number;
  daysPending: number;
  attendanceRate: number;
  jobsScheduled: number;
  jobsCompleted: number;
  completionRate: number;
  jobsStarted?: number;
  jobsNoShow?: number;
  avgVisitMinutes?: number;
  jobsOnTime?: number;
  jobsLate?: number;
  onTimeRate?: number;
}

export interface TeamAttendanceStats {
  period: string;
  month: string;
  totalTechnicians: number;
  checkedInToday: number;
  averageAttendanceRate: number;
  lowAttendance: { id: string; name: string; rate: number }[];
}
