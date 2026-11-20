import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHomePromo {
  badge: string;
  title: string;
  ctaLabel: string;
  serviceId?: Types.ObjectId;
  active: boolean;
}

export interface ICategoryChip {
  label: string;
  category?: string;
}

export interface IHomeConfig {
  featuredServiceId?: Types.ObjectId;
  sectionTitles: {
    services: string;
    popular: string;
  };
  servicesSubtitle?: string;
  searchPlaceholder: string;
  servicesActionLabel: string;
  popularActionLabel: string;
  categoryChips: ICategoryChip[];
  serviceTypesTitle?: string;
  serviceTypesAction?: string;
  bookSlideTitle?: string;
  bookSlideCta?: string;
  bookSlideFallbackSub?: string;
  promoCodeHint?: string;
  heroEyebrow?: string;
  heroSubtitle?: string;
  quickLabels?: {
    book: string;
    bookings: string;
    offers: string;
    help: string;
  };
}

export interface ISupportConfig {
  phone: string;
  email: string;
  whatsapp?: string;
  hours?: string;
}

export interface IBrandingConfig {
  name: string;
  tagline: string;
}

export interface ITrustConfig {
  guaranteeText: string;
  badges: string[];
}

export interface IOnboardingSlide {
  title: string;
  subtitle: string;
  icon?: string;
}

export interface IOnboardingConfig {
  slides: IOnboardingSlide[];
  trustChips: string[];
}

export interface ILegalConfig {
  termsMarkdown: string;
  privacyMarkdown: string;
}

export interface IFaqItem {
  q: string;
  a: string;
}

export interface IBookingCopyConfig {
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


export interface ICustomerUiCopy {
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

export interface IAppConfig {
  support: ISupportConfig;
  branding: IBrandingConfig;
  trust: ITrustConfig;
  onboarding: IOnboardingConfig;
  legal: ILegalConfig;
  aboutMarkdown: string;
  faq: IFaqItem[];
  booking?: IBookingCopyConfig;
  customerUi?: ICustomerUiCopy;
}

export interface IAppContent extends Document {
  key: string;
  homePromo: IHomePromo;
  homeConfig: IHomeConfig;
  appConfig: IAppConfig;
  updatedAt: Date;
}

const homePromoSchema = new Schema<IHomePromo>(
  {
    badge: { type: String, default: 'MR ANTIDOT · TRUSTED SERVICE' },
    title: { type: String, default: 'Book pest control & home services' },
    ctaLabel: { type: String, default: 'Book Now →' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const categoryChipSchema = new Schema<ICategoryChip>(
  {
    label: { type: String, required: true },
    category: { type: String },
  },
  { _id: false },
);

const homeConfigSchema = new Schema<IHomeConfig>(
  {
    featuredServiceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    sectionTitles: {
      services: { type: String, default: 'Our Services' },
      popular: { type: String, default: 'Popular Now' },
    },
    searchPlaceholder: { type: String, default: 'Search services…' },
    servicesSubtitle: { type: String, default: 'Trusted pest control & home services' },
    servicesActionLabel: { type: String, default: 'View all' },
    popularActionLabel: { type: String, default: 'See more' },
    serviceTypesTitle: { type: String, default: 'Service types' },
    serviceTypesAction: { type: String, default: 'View all' },
    bookSlideTitle: { type: String, default: 'Book pest control & home services' },
    bookSlideCta: { type: String, default: 'Book Now' },
    bookSlideFallbackSub: { type: String, default: 'Certified experts · Same-day slots' },
    promoCodeHint: { type: String, default: 'ANTIDOT100' },
    heroEyebrow: { type: String, default: 'Mr Antidot' },
    heroSubtitle: { type: String, default: 'Eco-safe care for your space' },
    quickLabels: {
      book: { type: String, default: 'Book' },
      bookings: { type: String, default: 'Bookings' },
      offers: { type: String, default: 'Offers' },
      help: { type: String, default: 'Help' },
    },
    categoryChips: {
      type: [categoryChipSchema],
      default: () => DEFAULT_HOME_CONFIG.categoryChips,
    },
  },
  { _id: false },
);

const onboardingSlideSchema = new Schema<IOnboardingSlide>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String },
  },
  { _id: false },
);

const faqItemSchema = new Schema<IFaqItem>(
  {
    q: { type: String, required: true },
    a: { type: String, default: '' },
  },
  { _id: false },
);

const bookingCopySchema = new Schema<IBookingCopyConfig>({}, { _id: false, strict: false });

const customerUiCopySchema = new Schema<ICustomerUiCopy>({}, { _id: false, strict: false });

const appConfigSchema = new Schema<IAppConfig>(
  {
    support: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      hours: { type: String, default: '' },
    },
    branding: {
      name: { type: String, default: 'Mr Antidot' },
      tagline: { type: String, default: 'Trusted pest control & home services' },
    },
    trust: {
      guaranteeText: {
        type: String,
        default: '100% satisfaction guarantee · Verified professionals',
      },
      badges: { type: [String], default: () => DEFAULT_APP_CONFIG.trust.badges },
    },
    onboarding: {
      slides: { type: [onboardingSlideSchema], default: () => DEFAULT_APP_CONFIG.onboarding.slides },
      trustChips: { type: [String], default: () => DEFAULT_APP_CONFIG.onboarding.trustChips },
    },
    legal: {
      termsMarkdown: { type: String, default: '' },
      privacyMarkdown: { type: String, default: '' },
    },
    aboutMarkdown: { type: String, default: '' },
    faq: { type: [faqItemSchema], default: () => DEFAULT_APP_CONFIG.faq },
    booking: { type: bookingCopySchema, default: () => DEFAULT_APP_CONFIG.booking },
    customerUi: { type: customerUiCopySchema, default: () => DEFAULT_APP_CONFIG.customerUi },
  },
  { _id: false },
);

const appContentSchema = new Schema<IAppContent>(
  {
    key: { type: String, required: true, unique: true },
    homePromo: { type: homePromoSchema, default: () => ({}) },
    homeConfig: { type: homeConfigSchema, default: () => ({}) },
    appConfig: { type: appConfigSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const AppContent = mongoose.model<IAppContent>('AppContent', appContentSchema);

export const DEFAULT_HOME_PROMO: IHomePromo = {
  badge: 'MR ANTIDOT · TRUSTED SERVICE',
  title: 'Book pest control & home services',
  ctaLabel: 'Book Now →',
  active: true,
};

export const DEFAULT_HOME_CONFIG: IHomeConfig = {
  sectionTitles: { services: 'Our Services', popular: 'Popular Now' },
  servicesSubtitle: 'Trusted pest control & home services',
  searchPlaceholder: 'Search services…',
  servicesActionLabel: 'View all',
  popularActionLabel: 'See more',
  serviceTypesTitle: 'Service types',
  serviceTypesAction: 'View all',
  bookSlideTitle: 'Book pest control & home services',
  bookSlideCta: 'Book Now',
  bookSlideFallbackSub: 'Certified experts · Same-day slots',
  promoCodeHint: 'ANTIDOT100',
  heroEyebrow: 'Mr Antidot',
  heroSubtitle: 'Eco-safe care for your space',
  quickLabels: {
    book: 'Book',
    bookings: 'Bookings',
    offers: 'Offers',
    help: 'Help',
  },
  categoryChips: [
    { label: 'All' },
    { label: 'Residential', category: 'residential' },
    { label: 'Commercial', category: 'commercial' },
    { label: 'Cleaning', category: 'cleaning' },
  ],
};

export const DEFAULT_BOOKING_COPY: IBookingCopyConfig = {
  scheduleStepTitle: 'When should we visit?',
  scheduleStepSubtitle: 'Pick a standard time window or choose a specific time',
  standardModeLabel: 'Standard window',
  customModeLabel: 'Custom time',
  customNotesPlaceholder: 'Timing preferences, gate code, or access notes',
  pendingCustomerTitle: 'Requested visit time',
  pendingCustomerHint:
    'Our team is confirming your schedule. You’ll get a notification once your visit time is set.',
  pendingFactsSubtitle: 'Requested · awaiting confirmation',
  pendingReviewNote:
    'Your booking stays pending until our team confirms the schedule. You’ll be notified once your visit time is set.',
  requestSubmittedToast: 'Booking request submitted',
  adminRequestTitle: 'Customer schedule request',
  adminConfirmTitle: 'Confirm schedule',
  adminConfirmHint:
    'Review the customer’s request and set the final visit time before notifying them.',
  adminConfirmButton: 'Confirm & notify customer',
  wizardScreenTitle: 'Book service',
  wizardStepSchedule: 'Schedule',
  wizardStepProperty: 'Property',
  wizardStepAddress: 'Address',
  wizardStepPayment: 'Payment',
  wizardStepConfirm: 'Confirm',
  wizardReviewSectionTitle: 'Review & confirm',
  wizardContinueButton: 'Continue',
  wizardSubmitButton: 'Submit request',
  wizardBackButton: 'Back',
  listScreenTitle: 'My Bookings',
  listFilterActive: 'Active',
  listFilterCompleted: 'Done',
  listFilterCancelled: 'Cancelled',
  listNextVisitLabel: 'Next visit',
  listEmptyActive: 'No active bookings',
  listEmptyCompleted: 'Nothing completed yet',
  listEmptyCancelled: 'No cancelled bookings',
  listBookServiceButton: 'Book a service',
  successSummaryTitle: 'Booking summary',
  successLabelReference: 'Reference',
  successLabelService: 'Service',
  successLabelVisit: 'Requested visit',
  successLabelPayment: 'Payment',
  successLabelTotal: 'Estimated total',
  successViewBookingButton: 'View booking',
  successHomeButton: 'Back to home',
  detailScreenTitle: 'Your booking',
  detailDetailsTitle: 'Booking details',
  detailDetailsSubtitle: 'Visit, location & payment',
  trackingSectionTitle: 'Tracking',
  trackingSectionSubtitle: 'Where your booking stands',
  trackingStepReceived: 'Booking received',
  trackingStepConfirmed: 'Confirm visit time',
  trackingStepAssignExpert: 'Assigning service expert',
  trackingStepShareStartCode: 'Share start code',
  trackingStepInProgress: 'Treatment in progress',
  trackingStepShareCompletionCode: 'Share completion code',
  trackingStepCompleted: 'Completed',
  activitySectionTitle: 'Activity',
  activitySectionSubtitle: 'Latest updates',
  treatmentStepsTitle: 'Treatment steps',
  treatmentStepsLiveSubtitle: 'Updates as work happens',
  treatmentStepsDoneSubtitle: 'Completed work',
  detailLiveProgressLabel: 'Live progress',
  detailLiveBadge: 'Live',
  otpStartTitle: 'Start code',
  otpStartSubtitle: 'Share this with your technician when they arrive',
  otpEndTitle: 'Completion code',
  otpEndSubtitle: 'Give this code once treatment is finished',
  detailActionEnterCode: 'Enter completion code',
  detailActionReview: 'Leave a review',
  detailActionCancel: 'Cancel booking',
  detailActionBookAgain: 'Book again',
  factLabelWhen: 'When',
  factLabelWhere: 'Where',
  factLabelProperty: 'Property',
  factLabelPayment: 'Payment',
  factLabelCoupon: 'Coupon',
  factLabelTechnician: 'Your technician',
  priceBreakdownTitle: 'Price breakdown',
  priceLabelService: 'Service charge',
  priceLabelGst: 'GST (18%)',
  priceLabelCoupon: 'Coupon discount',
  priceLabelTotal: 'You pay',
  cancelConfirmTitle: 'Cancel booking?',
  cancelConfirmMessage: 'This cannot be undone.',
  cancelConfirmKeep: 'Keep booking',
  cancelConfirmAction: 'Cancel booking',
  statusGuidancePending: 'We’re confirming your visit time. You’ll be notified once it’s scheduled.',
  statusGuidanceConfirmed: 'Share your start code when our service expert arrives.',
  statusGuidanceInProgress: 'Treatment is in progress at your location.',
  statusGuidanceAwaitingVerification: 'Share your completion code to finish the booking.',
  statusGuidanceCompleted: 'This booking is complete. Thank you for choosing Mr Antidot.',
  statusGuidanceCancelled: 'This booking was cancelled. You can book again anytime.',
  techJobsTitle: 'My Jobs',
  techProfileTitle: 'My profile',
  techCheckInTitle: 'Start your work day',
  techCheckInSubtitle: 'Check in to go on duty. Admin tracks attendance from this.',
  techOnDutyButton: 'On duty today',
  techOffDutyButton: 'Off today',
  techOnDutyBadge: '● On duty today',
  techOffDutyBadge: 'Off duty today',
  techOffDutyHint: 'Go back on duty when you are ready to take jobs.',
  techBackOnDutyButton: 'Go on duty',
  techPerformanceTitle: 'Performance',
  techScheduleTitle: 'Schedule calendar',
  techJobVisitsTitle: 'Job visits',
  techEmptyJobsTitle: 'No jobs assigned',
  techEmptyJobsMessage: 'When admin assigns you a visit, it will show up here.',
  techJobValueLabel: 'Job value',
  techEarningLabel: 'Your earning',
  techVisitTimesTitle: 'Visit times',
  techJobDetailsTitle: 'Job details',
  techTreatmentStepsTitle: 'Treatment steps',
  techActivityTitle: 'Activity',
  techEnterStartCode: 'Enter start code',
  techEnterCompletionCode: 'Enter completion code',
  techCompleteStepsFirst: 'Complete steps first',
  techStartOtpTitle: 'Start work',
  techEndOtpTitle: 'Complete job',
  techLocationNoteLabel: 'Location note',
  techLocationNotePlaceholder: 'Building or landmark',
  techNoStepsHint: 'No step photos required. Enter completion code when done.',
  pendingPastHint: 'This time passed before we could confirm it. Tap Reschedule to pick a new time.',
  listPendingPastHint: 'Requested time has passed — pick a new time',
  liveNowLabel: 'Happening now',
  liveOngoingLabel: 'In progress',
  wizardDayHint: 'Pick a day — our team confirms the visit time after you book',
  wizardTimeTitle: 'Select a time',
  wizardNotesLabel: 'Notes',
  wizardIncludedTitle: 'What\'s included',
  wizardPropertyTitle: 'What type of property?',
  wizardPropertySubtitle: 'So the technician can plan the treatment for your space',
  wizardAddressTitle: 'Where should we come?',
  wizardAddressSubtitle: 'Use your location to fill the address in seconds',
  wizardSavedAddressesTitle: 'Saved addresses',
  wizardNewAddressTitle: 'Or add a new address',
  wizardAddressDetailsTitle: 'Address details',
  wizardAddressFormSubtitle: 'House / flat number is required · landmark optional',
  wizardPhotosTitle: 'Problem photos',
  wizardPhotosSubtitle: 'Optional — helps the technician prepare',
  wizardPaymentTitle: 'Payment method',
  wizardSummaryTitle: 'Payment summary',
  wizardDetailsTitle: 'Booking details',
  wizardLabelSchedule: 'Requested schedule',
  wizardLabelProperty: 'Property type',
  wizardLabelAddress: 'Service address',
  wizardLabelPayment: 'Payment method',
  wizardLabelCoupon: 'Coupon applied',
  wizardLabelPhotos: 'Photos',
  wizardNextStepsTitle: 'What happens next',
  wizardCancellationTitle: 'Cancellation',
  wizardCancellationNote: 'You can cancel from My Bookings any time before the technician starts work.',
  wizardTotalCaption: 'Estimated total · incl. taxes',
  wizardDetectedAreaHint: 'Detected area · tap refresh to update',
};

export const DEFAULT_CUSTOMER_UI_COPY: ICustomerUiCopy = {
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
  authLoginEmailPlaceholder: 'you@email.com or 98765 43210',
  authLoginPasswordPlaceholder: 'Enter your password',
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
  profileMenuBookingsSub: 'Track visits & rate completed jobs',
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
  servicePriceHint: 'starting · per visit',
  serviceFactOneTitle: 'Eco-safe',
  serviceFactOneSub: 'Kid & pet friendly',
  serviceFactDurationSub: 'Visit duration',
  serviceFactThreeTitle: 'Photo proof',
  serviceFactThreeSub: 'Every step',
  serviceAboutTitle: 'About this service',
  serviceStepsTitle: 'Service steps',
  serviceReviewsTitle: 'Recent reviews',
  serviceFromLabel: 'From',
  serviceBookButton: 'Book now',
  browseTitle: '{type} services',
  browseSubtitle: 'Starting prices · book in minutes',
  browseBadges: 'Certified experts, Eco-safe, Fixed prices',
  settingsSubtitle: 'Your account & preferences',
  settingsCompleteHint: 'Complete your profile below for a smoother booking experience.',
  settingsDetailsTitle: 'Profile details',
  settingsDetailsHint: 'Update your contact information',
  paymentsSubtitle: 'Pay at the visit · nothing is charged in the app',
  helpSubtitle: 'We\'re here for you',
  helpGuideTitle: 'How to book a service',
  helpResourcesSub: 'Answers, policies and more',
  profileNextVisitTitle: 'Your next visit',
  reviewScreenTitle: 'Rate & Review',
  reviewHeading: 'How was your visit?',
  reviewTagsTitle: 'What stood out?',
  reviewNoteLabel: 'Add a note',
  homeTrustSub: 'Not happy with the result? We come back and fix it — free.',
  homeTrackLive: 'Track live',
  homeViewVisit: 'View details',
  homeSpotlightTitle: 'In the spotlight',
  homeNewTitle: 'New and noteworthy',
  homeRailHomeTitle: 'Home pest control',
  homeRailHomeSub: 'Protect every room',
  homeRailBusinessTitle: 'For offices & businesses',
  homeRailBusinessSub: 'Shops, restaurants & warehouses',
  homeRailCleaningTitle: 'Cleaning essentials',
  homeRailCleaningSub: 'For a clean & fresh home',
  homeClosingLine: 'Safe homes, happy families',
  homeHeroTitle: 'Same-day pest control',
  homeLocationLabel: 'Home',
  homeHeroKicker: 'Pest control at home',
  homeHeroCta: 'Book now',
  homeAllServices: 'All services',
  homeCurationsTitle: 'Thoughtful curations',
  homeCurationsSub: 'Expert treatments for every pest',
  homeFeatureTag: 'Customer favourite',
  serviceUnavailableTitle: 'Service unavailable',
  serviceStartsAtLabel: 'Starts at',
  serviceEarliestLabel: 'Earliest',
  serviceOptionsHeading: 'Select requirements',
  serviceIncludedLink: 'What is included in my service?',
  serviceNotesTitle: 'Please note',
  serviceIncludedTitle: 'What is included',
  serviceExcludedTitle: 'What is excluded?',
  serviceStepsSub: 'About {duration} on site',
  serviceWhyTitle: 'Why {brand}',
  serviceShareText: 'Share this service with your loved ones',
  serviceShareButton: 'Share',
  serviceShareMessage: '{service} by {brand} — starts at {price}. Book it on the {brand} app.',
  serviceRowViewDetails: 'View details',
  serviceRowBook: 'Book',
  browseAvailableTitle: 'Available treatments',
  browseEmptyTitle: 'No services yet',
  browseEmptyMessage: 'Nothing listed for this type right now.',
  browseHelpTitle: 'Not sure which service?',
  browseHelpSub: 'Talk to our team — we\'ll point you to the right treatment',
  servicesAllLabel: 'All',
  servicesSortTitle: 'Sort by',
  servicesSortPopular: 'Popular',
  servicesSortRating: 'Top rated',
  servicesSortPrice: 'Price: low to high',
  servicesCategoryLabel: 'Category',
  servicesEmptyTitle: 'No services found',
  servicesEmptyMessage: 'Try a different search or clear the filters',
  servicesClearFilters: 'Clear filters',
  cartTitle: 'Your cart',
  cartEditPackage: 'Edit package',
  cartAddMore: 'Add more services',
  cartCouponsTitle: 'Coupons and offers',
  cartCouponApplied: '{code} applied',
  cartCouponSaved: 'You save {amount}',
  cartCouponsAvailable: '{count} available',
  cartViewAll: 'View all',
  cartChange: 'Change',
  cartEdit: 'Edit',
  cartAdd: 'Add',
  cartContactMissing: 'Add your contact details',
  cartPropertyMissing: 'Select property type',
  cartPropertyLabel: 'Property type',
  cartPropertyHint: 'Helps the technician bring the right treatment',
  cartPaymentMissing: 'Choose payment method',
  cartPaymentLabel: 'Payment',
  cartPhotosMissing: 'Add photos of the problem',
  cartPhotosHint: 'Optional — helps us prepare',
  cartPhotosAdded: 'Photos added: {count}',
  cartTotalLabel: 'Total bill {amount}',
  cartGstNote: 'Incl. GST',
  cartSavedNote: 'saved {amount}',
  cartPolicyTitle: 'Cancellation & reschedule policy',
  cartReadPolicy: 'Read full policy',
  cartStepAddress: 'Add address',
  cartStepSlot: 'Select slot',
  cartStepProperty: 'Select property type',
  cartStepPayment: 'Choose payment',
  cartTermsLine: 'By proceeding, you agree to our {terms} and {privacy}.',
  cartTermsLink: 'T&C',
  cartPrivacyLink: 'Privacy Policy',
  cartSlotTitle: 'When should the professional arrive?',
  cartSlotHint: 'Service will take approx. {duration}',
  cartSlotConfirm: 'Confirm slot',
  cartAddressTitle: 'Saved address',
  cartAddressUse: 'Use this address',
  cartAddressAddAnother: 'Add another address',
  cartAddressFallback: 'Address',
  cartDone: 'Done',
  bookingsKicker: 'YOUR VISITS',
  bookingsLoadingSub: 'Loading your visits…',
  bookingsEmptySub: 'No visits yet — book your first service',
  bookingsCountSub: '{active} active · {total} total',
  bookingsBookButton: 'Book',
  bookingsUpcomingTitle: 'Upcoming visits',
  bookingsPastTitle: 'Past visits',
  bookingsCancelledTitle: 'Cancelled visits',
  bookingsCountOne: '1 booking',
  bookingsCountMany: '{count} bookings',
  bookingsHintCode: 'Share your completion code',
  bookingsHintAssigned: 'Expert assigned · share start code on arrival',
  bookingsBookAgain: 'Book again',
  bookingsTrackLive: 'Track live visit',
  bookingsViewVisit: 'View visit details',
  bookingsTimeConfirming: 'Visit time being confirmed',
  bookingsEmptyHintActive: 'Book a service and your upcoming visits will appear here with live status updates.',
  bookingsEmptyHintCompleted: 'Finished jobs show here with receipts and review options.',
  bookingsEmptyHintCancelled: 'Cancelled visits are kept here for your records.',
  bookingsHowToBook: 'How to book →',
  bookingDetailStatusEyebrow: 'Booking status',
  bookingDetailLiveEyebrow: 'Happening now',
  bookingDetailJourneyTitle: 'Booking journey',
  bookingDetailCurrentStep: 'Current step',
  bookingDetailStepCompleted: 'Completed',
  bookingDetailStepInProgress: 'In progress',
  bookingDetailStepUpcoming: 'Upcoming',
  bookingDetailInvoiceTitle: 'Invoice',
  bookingDetailCancel: 'Cancel',
  bookingDetailReschedule: 'Reschedule',
  bookingDetailCancelledToast: 'Booking cancelled',
  bookingDetailRescheduledToast: 'Reschedule requested',
  bookingDetailRescheduledToastSub: 'We’ll confirm the new time shortly.',
  bookingDetailCodeToast: 'New code generated',
  offersBrowseLabel: 'Browse services',
  offersFromPrice: 'From {price}',
  offersCodeHint: 'Use code {code} at checkout',
  offersFootnote: 'Tap a coupon, then pick a service to apply it.',
  offersApplyQuestion: 'Apply {code} to which service?',
  notificationsUnreadSub: '{count} unread',
  notificationsCaughtUpSub: 'All caught up',
  notificationsMarkAll: 'Mark all read',
  notificationsFilterAll: 'All',
  notificationsFilterUnread: 'Unread',
  notificationsUnreadEmptyTitle: 'You\'re all caught up',
  notificationsUnreadEmptyMessage: 'No unread notifications right now.',
  addressesSavedSub: '{count} saved',
  addressesSectionTitle: 'Saved addresses',
  addressesDefaultBadge: 'Default',
  addressesFootnote: 'Your saved addresses show up at checkout — pick one in a tap.',
  addressesSetDefault: 'Set as default',
  addressesSetDefaultSub: 'Used first when you book',
  addressesDelete: 'Delete address',
  addressesDeleteTitle: 'Delete this address?',
  addressesKeep: 'Keep it',
  addressesSheetTitle: 'Add address',
  addressesSheetHint: 'House / flat number is required · landmark optional',
  addressesSaveButton: 'Save address',
  addressesSavedToast: 'Address saved',
  addressesRemovedToast: 'Address removed',
  addressesDefaultToast: 'Default updated',
  authFieldIdentifier: 'Email or phone',
  authFieldPassword: 'Password',
  authForgotPassword: 'Forgot password?',
  authForgotTitle: 'Password reset',
  authForgotBody: 'Contact support: {contact}',
  authForgotBodyFallback: 'Contact support from Help in the app.',
  authSigningIn: 'Signing in…',
  authOrDivider: 'or',
  authOtpContinue: 'Continue with OTP',
  authSecureNote: 'Secure sign-in · your details stay private',
  authNewHere: 'New here?',
  authCreateAccountLink: 'Create account',
  authRequired: 'Required',
  authWrongCredentials: 'Wrong phone/email or password',
  authSignedInFallback: 'Signed in successfully',
  authCompleteProfileTitle: 'Complete your profile',
  authCompleteProfileBody: 'Add your name and email to finish setup.',
  authHaveAccount: 'Already have an account?',
  authSignInLink: 'Sign in',
  authFieldName: 'Full name',
  authFieldNamePlaceholder: 'Your name',
  authFieldPhone: 'Phone',
  authFieldPhonePlaceholder: 'Mobile number',
  authFieldEmail: 'Email',
  authFieldEmailPlaceholder: 'Email address',
  authFieldNewPasswordPlaceholder: 'Create a password',
  authFieldCity: 'City',
  authFieldCityPlaceholder: 'Your city',
  authCreatingAccount: 'Creating account…',
  authRegisterWelcome: 'Welcome to {brand}',
  authBackLabel: 'Go back',
  authFieldOptional: 'Optional',
  onboardSkip: 'Skip',
  onboardNext: 'Next',
  onboardGetStarted: 'Get started',
  onboardChipExpert: 'Expert assigned',
  onboardChipArriving: 'Arriving · 12 min',
  onboardChipPhoto: 'Photo proof',
  onboardChipEco: 'Eco-safe',
  onboardChipVerified: 'Verified pros',
  onboardChipGuarantee: '100% guarantee',
  otpPhoneLabel: 'Mobile number',
  otpInvalidPhone: 'Enter a valid mobile number',
  otpEnterCode: 'Enter the code',
  otpSendFirstTitle: 'Send code first',
  otpSendFirstBody: 'Tap Send code to receive your OTP',
  otpSendButton: 'Send code',
  otpSending: 'Sending code…',
  otpVerifying: 'Verifying…',
  otpPreferPassword: 'Prefer password?',
  webSeoTitle: 'Mr Antidot — Pest Control & Hygiene Management',
  webSeoDescription: 'Book safe, eco-friendly pest control, termite, bed bug, mosquito and deep cleaning services from certified Mr Antidot experts. Upfront prices, verified technicians and guaranteed results.',
  webNavHome: 'Home',
  webNavServices: 'Services',
  webNavAbout: 'About',
  webNavTeam: 'Our team',
  webNavBlog: 'Blog',
  webNavGallery: 'Gallery',
  webNavContact: 'Contact',
  webNavBookings: 'My bookings',
  webNavLogin: 'Log in',
  webNavAccount: 'Account',
  webNavLogout: 'Log out',
  webNavBookNow: 'Book a service',
  webFloatWhatsapp: 'Chat on WhatsApp',
  webFloatCall: 'Call now',
  webWhatsappMessage: 'Hello, I have a question about your hygiene management services.',
  webHeroEyebrow: 'The antidote to every unclean threat',
  webHeroTitle: 'Complete hygiene management for homes and businesses',
  webHeroSubtitle: 'Eco-safe pest control and deep cleaning by certified experts — with upfront prices, live visit updates and guaranteed results.',
  webHeroPrimaryCta: 'Book a service',
  webHeroSecondaryCta: 'Get a free inspection',
  webHeroSearchPlaceholder: 'What’s bothering you? Cockroach, termite, bed bugs…',
  webHeroPopularLabel: 'Popular:',
  webStat1Value: '8+',
  webStat1Label: 'Years of industry experience',
  webStat2Value: '95%',
  webStat2Label: 'Pest control success rate',
  webStat3Value: '24/7',
  webStat3Label: 'Support & emergency visits',
  webStat4Value: '100%',
  webStat4Label: 'Satisfaction guarantee',
  webOffersTitle: 'Offers for you',
  webOfferFixed: '₹{amount} off',
  webOfferPercent: '{amount}% off',
  webOfferCopy: 'Copy code',
  webOfferCopied: 'Copied',
  webServicesEyebrow: 'Our services',
  webServicesTitle: 'Complete hygiene management services',
  webServicesSubtitle: 'Pick a service, choose your home size and book a visit in under a minute.',
  webServicesViewAll: 'View all services',
  webWhyEyebrow: 'Why Mr Antidot',
  webWhyTitle: 'Why customers trust Mr Antidot',
  webWhySubtitle: 'We combine expertise, eco-friendly technology and customer-focused service to deliver the highest standards of hygiene management.',
  webWhy1Title: 'Certified & trained experts',
  webWhy1Text: 'Background-checked technicians trained in safe chemical handling and dosage.',
  webWhy2Title: 'Safe for families & pets',
  webWhy2Text: 'Government-approved, eco-safe products with clear precautions for children, pets and food areas.',
  webWhy3Title: 'Odour-free treatments',
  webWhy3Text: 'Comfortable treatments without unpleasant chemical smells.',
  webWhy4Title: 'Guaranteed results',
  webWhy4Text: 'Long-lasting protection, with follow-up visits whenever you need them.',
  webProcessEyebrow: 'Our process',
  webProcessTitle: 'Our professional hygiene protection process',
  webStep1Title: 'Inspection & assessment',
  webStep1Text: 'We analyse pest activity and hygiene conditions.',
  webStep2Title: 'Customised treatment plan',
  webStep2Text: 'We design solutions based on your specific problem.',
  webStep3Title: 'Professional treatment',
  webStep3Text: 'Our trained technicians apply safe and effective treatments.',
  webStep4Title: 'Prevention & maintenance',
  webStep4Text: 'We recommend follow-up visits to stop pests coming back.',
  webSectorsEyebrow: 'Sectors we serve',
  webSectorsTitle: 'Pest control for every kind of space',
  webSectorsSubtitle: 'Specialised pest management solutions across diverse industries.',
  webSectorsList: 'Hospitals & clinics, Hotels & hospitality, Housing societies, IT & corporate offices, Pharmaceutical, Retail & malls, Education, Warehouses & supply chains',
  webMissionTitle: 'Our mission',
  webMissionText: 'To create a cleaner, safer and pest-free environment for every home and business by delivering reliable, science-backed and customer-friendly pest control and cleaning solutions.',
  webVisionTitle: 'Our vision',
  webVisionText: 'A future where every household and workplace feels clean, protected and worry-free with Mr Antidot by their side.',
  webReviewsEyebrow: 'Testimonials',
  webReviewsTitle: 'What our customers say',
  webTeamEyebrow: 'Our team',
  webTeamTitle: 'The experts behind every treatment',
  webTeamSubtitle: 'Chemistry-trained specialists plan every treatment and dosage.',
  webTeamViewAll: 'Meet the team',
  webBlogEyebrow: 'Knowledge centre',
  webBlogTitle: 'Latest from our blog',
  webBlogViewAll: 'Read all articles',
  webBlogReadMore: 'Read article',
  webFaqEyebrow: 'FAQ',
  webFaqTitle: 'Frequently asked questions',
  webFaqSubtitle: 'Clear answers on chemicals, visit frequency, preparation and follow-up. Can’t find yours? Talk to us.',
  webAppTitle: 'Track every visit in the Mr Antidot app',
  webAppText: 'Live technician updates, photo proof of every step and one-tap rebooking.',
  webAppStoreUrl: '',
  webPlayStoreUrl: '',
  webCtaTitle: 'Pest problem? Let’s fix it this week.',
  webCtaText: 'Book online in under a minute, or call us for a free inspection.',
  webCtaButton: 'Book a service',
  webCtaCall: 'Call {phone}',
  webAboutEyebrow: 'About Mr Antidot',
  webAboutTitle: 'Experts in pest control & hygiene management',
  webAboutIntro: 'At Mr Antidot, we believe every space deserves to be clean, safe and refreshing. We protect homes and businesses from pests, dirt and harmful environmental threats through professional pest control and deep cleaning.',
  webAboutBody: 'By combining science-backed treatments, eco-friendly products and a highly trained team, we create healthier environments where people can live and work comfortably.',
  webAboutPoints: 'Certified & trained experts, Eco-safe treatments, Guaranteed results, Odour-free solutions, 24/7 support',
  webScienceTitle: 'The science behind our treatments',
  webScienceText: 'Every treatment is based on pest behaviour analysis, research and safe chemical application methods.',
  webScience1Title: 'Pest analysis',
  webScience1Text: 'Identify the pest species and infestation level.',
  webScience2Title: 'Chemical research',
  webScience2Text: 'Select the most effective product based on research.',
  webScience3Title: 'Dosage calculation',
  webScience3Text: 'Determine a safe and effective dosage for your space.',
  webScience4Title: 'Safe application',
  webScience4Text: 'Apply the treatment following strict safety standards.',
  webContactEyebrow: 'Contact us',
  webContactTitle: 'We’re here to help',
  webContactSubtitle: 'Call, WhatsApp or send us a message — we usually reply within a few hours.',
  webContactPhoneLabel: 'Call us',
  webContactEmailLabel: 'Email us',
  webContactWhatsappLabel: 'WhatsApp',
  webContactAddressLabel: 'Visit us',
  webContactHoursLabel: 'Working hours',
  webAddress: '101/1, Krishna Complex, Opp. Loha Bhavan, Nr. Juni High Court, Ashram Road, Navrangpura, Ahmedabad – 380009',
  webMapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.587357576512!2d72.56744619999999!3d23.038918499999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f5549f740d%3A0x9df5b5e2ddb8587c!2sKrishna%20Complex%2C%20301%2C%20Old%20High%20Ct%20Rd%2C%20Income%20Tax%2C%20Shreyas%20Colony%2C%20Navrangpura%2C%20Ahmedabad%2C%20Gujarat%20380009!5e0!3m2!1sen!2sin!4v1774247113873!5m2!1sen!2sin',
  webContactFormTitle: 'Send us a message',
  webContactFormSubtitle: 'Leave a message and we’ll get back to you shortly.',
  webContactFormName: 'Your name',
  webContactFormEmail: 'Email',
  webContactFormPhone: 'Phone',
  webContactFormService: 'Service you need',
  webContactFormServiceAny: 'Not sure yet',
  webContactFormMessage: 'How can we help?',
  webContactFormButton: 'Send message',
  webContactFormSuccess: 'Thanks! We’ll get back to you shortly.',
  webFooterAbout: 'We are a trusted pest control service provider offering safe, effective solutions for homes and businesses.',
  webFooterServicesTitle: 'Services',
  webFooterCompanyTitle: 'Company',
  webFooterContactTitle: 'Get in touch',
  webNewsletterTitle: 'Pest-control tips in your inbox',
  webNewsletterPlaceholder: 'Your email address',
  webNewsletterButton: 'Subscribe',
  webNewsletterSuccess: 'You’re subscribed — thank you!',
  webSocialFacebook: 'https://www.facebook.com/profile.php?id=61586995831762',
  webSocialInstagram: 'https://www.instagram.com/mr_antidot_india',
  webSocialYoutube: '',
  webSocialLinkedin: '',
  webCopyright: '© {year} Mr Antidot. All rights reserved.',
  webFooterCredit: 'Developed by NovaRo Solution',
  webFooterCreditUrl: 'https://novarosolution.com/',
  webServicesPageTitle: 'All services',
  webServicesPageSubtitle: 'Upfront prices · verified technicians · eco-safe treatments',
  webServicesSearchPlaceholder: 'Search services',
  webBookTitle: 'Book {service}',
  webBookLoginHint: 'Log in or create an account to book — it takes 30 seconds.',
  webBookDateLabel: 'Pick a date',
  webBookSlotLabel: 'Pick a time window',
  webBookNotesLabel: 'Notes for the technician',
  webBookNotesPlaceholder: 'Gate code, parking, pets at home…',
  webBookCouponPlaceholder: 'Coupon code',
  webBookCouponApply: 'Apply',
  webBookPayAfter: 'Pay after service',
  webBookPayOnline: 'UPI / card',
  webBookSubtotal: 'Item total',
  webBookGst: 'GST (18%)',
  webBookDiscount: 'Coupon discount',
  webBookConfirm: 'Confirm booking',
  webBookConfirming: 'Booking…',
  webSuccessTitle: 'Booking received!',
  webSuccessText: 'We’re confirming your visit time and will notify you shortly. You can track everything here or in the app.',
  webSuccessViewBooking: 'View booking',
  webSuccessHome: 'Back to home',
  webAccountTitle: 'Your account',
  webAccountSave: 'Save changes',
  webAccountSaved: 'Profile updated',
  webGalleryTitle: 'Our work',
  webGallerySubtitle: 'Real treatments by the Mr Antidot team.',
  webBlogPageTitle: 'Pest control knowledge centre',
  webBlogPageSubtitle: 'Tips, guides and prevention advice from our experts.',
  webTeamPageTitle: 'Meet our experts',
  webTeamPageSubtitle: 'The specialists who plan and deliver every Mr Antidot treatment.',
  webNotFoundTitle: 'This page has flown away',
  webNotFoundText: 'The page you’re looking for doesn’t exist or has moved.',
  webBookPickSize: 'Select {what}',
  webBookAddressLine: 'House / flat no., street, area',
  webContactFormError: 'Something went wrong. Please try again or call us.',
  webTeamExperience: 'Experience',
  webTeamYears: '{count}+ years',
  webTeamEducation: 'Education',
  webTeamResponsibilities: 'Key responsibilities',
  webTeamCertifications: 'Certifications',
  webTeamExpertise: 'Expertise',
  webEmptyListText: 'Nothing here yet — please check back soon.',
  webBlogRelatedTitle: 'More articles',
};

export const DEFAULT_APP_CONFIG: IAppConfig = {
  support: {
    phone: '+91 76006 00106',
    email: 'support@mrantidot.com',
    whatsapp: '+91 76006 00106',
    hours: 'Open 24/7',
  },
  branding: {
    name: 'Mr Antidot',
    tagline: 'Trusted pest control & home services',
  },
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
        subtitle: 'Watch your technician progress live, with photos and updates.',
        icon: 'map',
      },
      {
        title: 'Guaranteed results',
        subtitle: 'Backed by our satisfaction guarantee and friendly support team.',
        icon: 'shield',
      },
    ],
    trustChips: ['Verified pros', 'On-time service', '4.8★ rated'],
  },
  legal: {
    termsMarkdown: `## Terms of Service

**Last updated:** August 2026

These Terms govern your use of the Mr Antidot app and booking platform ("Service"). By creating an account or booking a service, you agree to these Terms.

### Using the platform

Mr Antidot connects customers with trained pest control and home service technicians. Provide accurate contact and address details so a technician can reach you. You must be 18 or older to create an account.

### Bookings & scheduling

- Submitting a booking sends a request for a visit window — our team confirms the final schedule and notifies you
- You can cancel any time before a technician starts work, at no charge
- Once treatment has started, a booking can no longer be cancelled
- Rescheduling is available from your booking details screen or by contacting support

### Pricing & payment

All prices are shown in Indian Rupees (₹) and include 18% GST, calculated automatically at checkout. Coupon codes are applied at booking and follow the terms of each individual offer, such as minimum order value, expiry, and usage limits.

Payment is collected by your technician at the time of service, using your selected method (UPI, card, or cash). Mr Antidot does not store your card or bank details.

### Service verification

Each booking uses a start code and a completion code shared between you and your technician, along with photo documentation of the work. Do not share these codes with anyone other than your assigned technician.

### Your responsibilities

- Provide safe access to the treatment area and disclose known hazards (pets, allergies, pregnancy, fragile items) before the visit
- Keep children and pets away from treated areas until your technician confirms it is safe
- Report any issue with a completed service promptly so we can make it right

### Our guarantee

We stand behind every booking with a satisfaction guarantee. If a service does not meet the standard we promise, contact support and we will arrange a follow-up visit or resolution.

### Reviews

Ratings and reviews you submit must reflect your genuine experience. We may remove reviews that are abusive, fraudulent, or unrelated to the service provided.

### Account suspension

We may suspend or close accounts that violate these Terms, provide false information, or misuse the platform, including abuse toward technicians or support staff.

### Liability

Technicians are trained and background-checked, but operate as independent service providers. Mr Antidot is not liable for indirect or consequential losses beyond the value of the booking, except where required by law.

### Changes to these Terms

We may update these Terms as the Service evolves. Continued use after an update means you accept the revised Terms. We will communicate material changes in-app.

### Contact

Questions about these Terms? Reach us using the contact details on the Help screen.`,
    privacyMarkdown: `## Privacy Policy

**Last updated:** August 2026

This Privacy Policy explains what information Mr Antidot collects, how we use it, and the choices you have. We handle your data in line with India's Digital Personal Data Protection Act, 2023.

### Information we collect

- Account details: name, phone number, email, and password
- Service details: saved addresses, property type, and booking history
- Location: your device location, with permission, to match you with nearby technicians and confirm on-site arrival
- Photos: before/after treatment photos captured by your technician for quality verification
- Payment preference: your selected payment method (UPI, card, or cash) — we do not store card or bank numbers
- Usage data: app interactions and device information that help us fix bugs and improve performance

### How we use your information

We use your information to create and manage your bookings, assign and guide technicians, send booking updates and notifications, provide customer support, and improve our services. We do not sell your personal information to third parties.

### Camera & location permissions

The app requests camera access so technicians can document service photos, and location access to show nearby availability and verify on-site visits. You can manage these permissions from your device settings at any time; declining them may limit booking features.

### Who we share data with

- The technician assigned to your booking, so they can complete the visit
- Service providers who help us run the platform, such as hosting and notifications, under confidentiality obligations
- Law enforcement or regulators, only when required by law

### Data retention

We keep your account and booking data for as long as your account is active, and for a reasonable period afterward to meet legal, accounting, or dispute-resolution needs. You can request deletion at any time.

### Your rights

You can access, correct, or request deletion of your personal data, and withdraw consent for optional permissions like location or camera. Contact support to make a request; we will respond within a reasonable time.

### Security

We use industry-standard measures, including encrypted connections, hashed passwords, and access controls, to protect your data. No system is 100% secure, so we encourage you to use a strong, unique password.

### Children's privacy

Mr Antidot is not directed at children under 18. We do not knowingly collect data from minors.

### Changes to this policy

We may update this Privacy Policy as our practices evolve. We will note material changes in-app.

### Contact

For privacy questions or data requests, reach us using the contact details on the Help screen.`,
  },
  aboutMarkdown: `## About Mr Antidot

Mr Antidot connects your home or business with trained, background-checked pest control and home service technicians. From general pest control and termite treatment to deep cleaning, every booking is backed by our satisfaction guarantee.

We built this app to make booking simple and transparent — see upfront pricing with GST included, track your technician's progress in real time, and verify every visit with photo documentation and secure start and completion codes.

Have a question or a service we do not cover yet? Reach out from the Help screen — we are always listening.`,
  faq: [
    { q: 'How do I book a service?', a: 'Pick a service from the home screen, choose a time slot and address, and confirm your booking.' },
    { q: 'Are technicians verified?', a: 'Yes. Every technician is background-checked and trained before joining the platform.' },
    { q: 'What if I am not satisfied?', a: 'Our satisfaction guarantee means we will make it right. Contact support and we will help.' },
    { q: 'How do I reschedule or cancel?', a: 'Open your booking to cancel if it is still pending or confirmed. To change the visit time, contact support — our team will confirm a new slot with you.' },
    { q: 'How do I pay for a service?', a: 'Payment is collected by your technician at the time of service, using UPI, card, or cash — whichever you prefer. You choose your payment method when you book.' },
    { q: 'Is my payment information safe?', a: 'Yes. We do not store your card or bank details — payment happens directly between you and your technician at the time of service.' },
    { q: 'What if I am not home during the visit?', a: 'Add access notes when you book — gate code, landmark, or a preferred contact number — so your technician can reach you. If the timing no longer works, contact support to rearrange the visit.' },
  ],
  booking: DEFAULT_BOOKING_COPY,
  customerUi: DEFAULT_CUSTOMER_UI_COPY,
};
