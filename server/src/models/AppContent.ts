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
  cartForTitle: string;
  cartForMe: string;
  cartForOther: string;
  cartForOtherHint: string;
  cartForName: string;
  cartForNamePlaceholder: string;
  cartForPhone: string;
  cartForPhonePlaceholder: string;
  cartForRowSub: string;
  cartForErrName: string;
  cartForErrPhone: string;
  bookingVisitContactTitle: string;
  bookingVisitContactSub: string;
  bookingForChip: string;
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
  webProcessEyebrow: string;
  webProcessTitle: string;
  webSectorsEyebrow: string;
  webSectorsTitle: string;
  webSectorsSubtitle: string;
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
  webScienceTitle: string;
  webScienceText: string;
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
  webHeroCardTitle: string;
  webHeroCardText: string;
  webHeroRatingText: string;
  webHeroScrollHint: string;
  webClientsTitle: string;
  webWorkEyebrow: string;
  webWorkTitle: string;
  webWorkSubtitle: string;
  webWorkCta: string;
  webDetailNavOverview: string;
  webDetailNavIncluded: string;
  webDetailNavProcess: string;
  webDetailNavReviews: string;
  webDetailNavFaq: string;
  webDetailBookingsCount: string;
  webDetailRelatedTitle: string;
  webDetailSizesTitle: string;
  webDetailReviewsSummary: string;
  webDetailWhatsApp: string;
  webBookProgress: string;
  webBookStickyCta: string;
  webBookCouponMin: string;
  webBookMissingStep: string;
  webBookAddressError: string;
  webBookFailedError: string;
  webSuccessNextTitle: string;
  webSuccessNext1: string;
  webSuccessNext2: string;
  webSuccessNext3: string;
  webSuccessAddCalendar: string;
  webSuccessBreakdownTitle: string;
  webUnitMins: string;
  webUnitHr: string;
  webUnitHrs: string;
  webUnitAm: string;
  webUnitPm: string;
  webUnitSqft: string;
  webPestLabels: string;
  webPropertyLabels: string;
  webAuthIdentifierPlaceholder: string;
  webAuthPasswordPlaceholder: string;
  webAuthShowPassword: string;
  webAuthHidePassword: string;
  webAuthLoginError: string;
  webAuthRegisterError: string;
  webBookingTimelineTitle: string;
  webBookingLive: string;
  webBookingKeep: string;
  webBookingCancelError: string;
  webAccountTabProfile: string;
  webAccountTabAddresses: string;
  webAccountAddressSaved: string;
  webAccountNameRequired: string;
  webAccountDeleteAddress: string;
  webAccountFallbackName: string;
  webContactSendAnother: string;
  webContactResponseNote: string;
  webBlogReadingTime: string;
  webBlogShare: string;
  webBlogCopyLink: string;
  webBlogLinkCopied: string;
  webLegalContents: string;
  webLegalEmpty: string;
  webFooterCtaTitle: string;
  webFooterCtaText: string;
  webFooterAccountTitle: string;
  webBackToTop: string;
  webStarsOutOf: string;
  webOpenMenu: string;
  webCloseMenu: string;
  webPrevious: string;
  webNext: string;
  webClose: string;
  webStickyBookText: string;
  webAppStoreLabel: string;
  webPlayStoreLabel: string;
  webReviewsAppBadge: string;
  webLoginPageTitle: string;
  webRegisterPageTitle: string;
  webAccountPageTitle: string;
  webBookingsPageTitle: string;
  webBookingPageTitle: string;
  webSuccessPageTitle: string;
  webVisitLabel: string;
  webTimeLabel: string;
  webTechnicianLabel: string;
  webTotalLabel: string;
  webPincodeLabel: string;
  webAddressHome: string;
  webAddressOffice: string;
  webAddressOther: string;
  webSlotMorning: string;
  webSlotAfternoon: string;
  webSlotEvening: string;
  webStatusPending: string;
  webStatusConfirmed: string;
  webStatusInProgress: string;
  webStatusAwaiting: string;
  webStatusCompleted: string;
  webStatusCancelled: string;
  webBookingsLoadError: string;
  webServerDownTitle: string;
  webServerDownText: string;
  webRetryLabel: string;
  webNewsletterError: string;
  webErrLoginMissing: string;
  webErrStaffLogin: string;
  webErrRegisterMissing: string;
  webErrPhoneInvalid: string;
  webErrPasswordShort: string;
  webErrAddressMissing: string;
  techTabJobs: string;
  techTabProfile: string;
  appMaintenanceTitle: string;
  appMaintenanceText: string;
  appMaintenanceRetry: string;
  appUpdateTitle: string;
  appUpdateText: string;
  appUpdateButton: string;
  liveBadgeLabel: string;
  systemLoading: string;
  systemBootPreparing: string;
  systemOfflineTitle: string;
  systemOfflineMessage: string;
  systemErrorTitle: string;
  systemErrorMessage: string;
  systemRetry: string;
  systemClose: string;
  systemCancel: string;
  systemDone: string;
  toastLabelSuccess: string;
  toastLabelError: string;
  toastLabelInfo: string;
  toastLabelWarning: string;
  toastLabelOffline: string;
  toastDismiss: string;
  homeSearchHintPrefix: string;
  homeSearchForHint: string;
  homeSearchClear: string;
  techCancel: string;
  techRetry: string;
  techClose: string;
  techRefreshError: string;
  techCheckConnection: string;
  techLiveBadge: string;
  techPhotosOne: string;
  techPhotosMany: string;
  techDaysOne: string;
  techDaysMany: string;
  techJobsOne: string;
  techJobsMany: string;
  techOpenSettings: string;
  techDutyOn: string;
  techDutyCheckedOut: string;
  techDutyLeave: string;
  techDutyAbsent: string;
  techDutyPending: string;
  techOnDutyTitle: string;
  techOnDutySince: string;
  techCheckOutButton: string;
  techMarkAbsentButton: string;
  techCheckedOutHint: string;
  techLeaveTodayTitle: string;
  techLeaveTodayHint: string;
  techToastCheckedOut: string;
  techToastAbsent: string;
  techCheckInError: string;
  techCheckOutError: string;
  techAttendanceUpdateError: string;
  techAbsentConfirmTitle: string;
  techAbsentConfirmText: string;
  techCheckOutConfirmTitle: string;
  techCheckOutConfirmText: string;
  techJobsEyebrow: string;
  techJobsGreeting: string;
  techNameFallback: string;
  techJobsLoadError: string;
  techJobsRefreshError: string;
  techAttendanceLoadError: string;
  techStatsLoadError: string;
  techEarnedThisMonth: string;
  techEarningsA11y: string;
  techStatActive: string;
  techStatJobsDone: string;
  techStatRating: string;
  techSectionOverdue: string;
  techSectionToday: string;
  techSectionUpcoming: string;
  techSectionAssigned: string;
  techSectionPast: string;
  techOverdueHint: string;
  techAllCaughtUpTitle: string;
  techAllCaughtUpText: string;
  techContinueActiveJob: string;
  techBannerActionNeeded: string;
  techBannerVerifyTitle: string;
  techBannerOverdue: string;
  techJobTitle: string;
  techJobNotFound: string;
  techJobLoadError: string;
  techJobSubtitle: string;
  techStatusPending: string;
  techStatusConfirmed: string;
  techStatusInProgress: string;
  techStatusAwaiting: string;
  techStatusCompleted: string;
  techStatusCancelled: string;
  techGuidePending: string;
  techGuideConfirmed: string;
  techGuideInProgress: string;
  techGuideAwaiting: string;
  techGuideCompleted: string;
  techGuideCancelled: string;
  techReadyTitle: string;
  techReadyText: string;
  techEstimateNote: string;
  techProgressJob: string;
  techProgressStepsComplete: string;
  techProgressTreatment: string;
  techProgressSteps: string;
  techStepDoneTag: string;
  techStepAddPhotos: string;
  techStepAddToComplete: string;
  techStepCompleteWith: string;
  techStepNeedPhoto: string;
  techStepSaveError: string;
  techToastStepDone: string;
  techToastPhotosSaved: string;
  techStepPhotoA11y: string;
  techVisitStatus: string;
  techVisitStarted: string;
  techVisitNotStarted: string;
  techVisitCompleted: string;
  techVisitInProgress: string;
  techVisitDuration: string;
  techVisitStateScheduled: string;
  techVisitStateInProgress: string;
  techVisitStateCompleted: string;
  techVisitStateNoShow: string;
  techVisitStateCancelled: string;
  techCollectPayment: string;
  techOpenDirections: string;
  techToastStartVerified: string;
  techToastWorkStarted: string;
  techToastAskCompletionCode: string;
  techToastJobCompleted: string;
  techOtpErrorTitle: string;
  techOtpErrorText: string;
  techOtpStartHint: string;
  techOtpEndHint: string;
  techOtpVerify: string;
  techOtpVerifying: string;
  techOtpInputA11y: string;
  techGpsLocatingTitle: string;
  techGpsLocatingText: string;
  techGpsUseLastKnown: string;
  techGpsFailTitle: string;
  techGpsFailText: string;
  techGpsDeniedTitle: string;
  techGpsDeniedText: string;
  techGpsOffTitle: string;
  techGpsOffText: string;
  techGpsFallbackAddress: string;
  techPhotoCounter: string;
  techLeaveTitle: string;
  techLeaveSubtitle: string;
  techLeaveFormTitle: string;
  techLeaveFormHint: string;
  techLeaveWhen: string;
  techLeaveFrom: string;
  techLeaveTo: string;
  techLeaveToday: string;
  techLeaveTomorrow: string;
  techLeaveWeek: string;
  techLeaveType: string;
  techLeaveReason: string;
  techLeaveReasonPlaceholder: string;
  techLeaveSubmit: string;
  techLeaveRequestedToast: string;
  techLeaveRequestError: string;
  techLeaveEndBeforeStart: string;
  techLeaveLoadError: string;
  techLeaveListTitle: string;
  techLeaveListCount: string;
  techLeaveListPending: string;
  techLeaveEmptyTitle: string;
  techLeaveEmptyText: string;
  techLeaveAdminNote: string;
  techLeavePending: string;
  techLeaveApproved: string;
  techLeaveRejected: string;
  techLeaveCancelled: string;
  techLeaveCancelTitle: string;
  techLeaveCancelText: string;
  techLeaveKeep: string;
  techLeaveCancelAction: string;
  techLeaveCancelledToast: string;
  techLeaveCancelError: string;
  techLeavePickTitle: string;
  techLeavePickHint: string;
  techLeavePickEnd: string;
  techLeavePickApply: string;
  techLeaveDatesA11y: string;
  techCalendarPrevMonth: string;
  techCalendarNextMonth: string;
  techCalPresent: string;
  techCalLeave: string;
  techCalPending: string;
  techCalJobs: string;
  techCalNoJobs: string;
  techCalToday: string;
  techProfileEyebrow: string;
  techProfileSubtitle: string;
  techVerifiedBadge: string;
  techStatThisMonth: string;
  techProfileLoadError: string;
  techQuickActionsTitle: string;
  techActionJobs: string;
  techActionJobsCount: string;
  techActionJobsEmpty: string;
  techActionActive: string;
  techActionActiveContinue: string;
  techActionActiveNone: string;
  techActionVerify: string;
  techActionVerifyCount: string;
  techActionVerifyNone: string;
  techActionLeaveSub: string;
  techPayRuleTitle: string;
  techPayRuleHint: string;
  techPerformanceHint: string;
  techStatAssigned: string;
  techStatCompleted: string;
  techAttendanceTitle: string;
  techAttendanceHint: string;
  techAttRate: string;
  techAttPresent: string;
  techAttLeave: string;
  techAttStarted: string;
  techAttCompleted: string;
  techAttOnTime: string;
  techAttAvgVisit: string;
  techAttSummary: string;
  techScheduleHint: string;
  techSignOut: string;
  techSignOutTitle: string;
  techSignOutText: string;
  onboardSlide1Title: string;
  onboardSlide1Sub: string;
  onboardSlide2Title: string;
  onboardSlide2Sub: string;
  onboardSlide3Title: string;
  onboardSlide3Sub: string;
  onboardPageLabel: string;
  launchTaglineFallback: string;
  launchFindingTitle: string;
  launchFindingBody: string;
  launchFoundTitle: string;
  launchFoundBody: string;
  launchDeniedTitle: string;
  launchDeniedBody: string;
  launchContinue: string;
  cartAreaNotServed: string;
  cartSlotUnavailable: string;
  cartSlotTooSoon: string;
  cartDateTooFar: string;
  cartPropertyUnavailable: string;
  cartPaymentUnavailable: string;
  bookingDetailRescheduleCutoff: string;
  bookingDetailRescheduleLimit: string;
  appMaintenanceStaff: string;
  webBookAreaHint: string;
  customerTabHome: string;
  customerTabBookings: string;
  customerTabOffers: string;
  customerTabProfile: string;
  statusLabelPending: string;
  statusLabelConfirmed: string;
  statusLabelInProgress: string;
  statusLabelAwaiting: string;
  statusLabelCompleted: string;
  statusLabelCancelled: string;
  statusGuidePending: string;
  statusGuideConfirmed: string;
  statusGuideInProgress: string;
  statusGuideAwaiting: string;
  statusGuideCompleted: string;
  statusGuideCancelled: string;
  bookingServiceFallback: string;
  bookingScheduleTbd: string;
  trackAssigned: string;
  trackStartCode: string;
  trackWorkStarted: string;
  trackStepDone: string;
  trackEndCode: string;
  trackCompleted: string;
  trackCancelled: string;
  trackAdminOverride: string;
  trackScheduleConfirmed: string;
  trackRescheduled: string;
  bookingDetailCancelCutoff: string;
  photoViewerLabel: string;
  photoViewerCount: string;
  photoOpenHint: string;
  photoUnavailable: string;
  bookingProblemPhotos: string;
  bookingFactPackage: string;
  bookingCallLabel: string;
  stepPhotosOne: string;
  stepPhotosMany: string;
  stepWorkingNow: string;
  problemPhotosTitle: string;
  problemPhotosSub: string;
  webSlotNight: string;
  listMoreOptions: string;
  servicePerSqFt: string;
  serviceRowA11y: string;
  serviceRowBookA11y: string;
  timeJustNow: string;
  timeMinutesAgo: string;
  timeHoursAgo: string;
  timeYesterday: string;
  notificationsUnreadA11y: string;
  appMaintenanceBadge: string;
  appUpdateBadge: string;
  slotPassedNote: string;
  slotUnavailableA11y: string;
  slotNoneOpen: string;
  dayToday: string;
  dayTomorrowShort: string;
  dayTomorrow: string;
  rescheduleTitle: string;
  rescheduleHint: string;
  rescheduleButton: string;
  photoSheetTitle: string;
  photoSheetSub: string;
  photoTake: string;
  photoTakeSub: string;
  photoGallery: string;
  photoGallerySub: string;
  serviceInvalidLink: string;
  serviceGone: string;
  serviceOptionsFallbackTitle: string;
  servicePickSizeFirst: string;
  serviceShareA11y: string;
  serviceReviewCountOne: string;
  serviceReviewCountMany: string;
  serviceSeeAllReviews: string;
  serviceAllReviewsTitle: string;
  serviceStarsA11y: string;
  navBack: string;
  propertyGroupHome: string;
  propertyGroupBusiness: string;
  payUpiCardSub: string;
  payAfterSub: string;
  payOtherSub: string;
  payManageSaved: string;
  billItemTotal: string;
  billGst: string;
  billCoupon: string;
  billAmountToPay: string;
  billSaving: string;
  offerApply: string;
  offerRemove: string;
  offerAppliedA11y: string;
  offerTapToApplyA11y: string;
  offerPercentOff: string;
  offerFlatOff: string;
  couponPlaceholder: string;
  couponClear: string;
  couponInvalid: string;
  couponApplied: string;
  payTotalPayable: string;
  paySavePill: string;
  payServiceRow: string;
  payDiscountRow: string;
  paySecureNote: string;
  payReadyKicker: string;
  payEstimated: string;
  addrHouseLabel: string;
  addrHousePlaceholder: string;
  addrStreetLabel: string;
  addrStreetPlaceholder: string;
  addrLandmarkLabel: string;
  addrLandmarkPlaceholder: string;
  addrCityLabel: string;
  addrCityPlaceholder: string;
  addrPincodeLabel: string;
  addrPincodePlaceholder: string;
  addrSaveAsLabel: string;
  addrSaveHome: string;
  addrSaveOffice: string;
  addrSaveOther: string;
  addrSaveAsA11y: string;
  addrHousePrefix: string;
  addrLandmarkPrefix: string;
  addrFieldMissing: string;
  cartLocationFilled: string;
  cartLocationFilledSub: string;
  cartAddressIncomplete: string;
  cartAddressNotSaved: string;
  cartAddressNotSavedSub: string;
  cartBookFailed: string;
  cartLoadFailed: string;
  cartTimePast: string;
  cartTimeOutside: string;
  invoiceTaxTitle: string;
  invoicePreparing: string;
  invoiceItemised: string;
  invoiceDownload: string;
  invoiceGenerate: string;
  invoiceOpening: string;
  invoiceDownloadA11y: string;
  invoiceGenerateA11y: string;
  invoiceCopyA11y: string;
  invoiceShareA11y: string;
  invoiceReadyToast: string;
  invoiceDownloadFailed: string;
  invoiceCopied: string;
  invoiceCopyFailed: string;
  invoiceTotalPaid: string;
  invoiceAmountDue: string;
  invoiceGstin: string;
  invoiceBadge: string;
  invoiceReceiptTitle: string;
  invoiceReceiptSub: string;
  invoiceTapToGenerate: string;
  invoiceServiceKicker: string;
  invoiceFactVisit: string;
  invoiceFactProperty: string;
  invoiceFactPayment: string;
  invoiceFactTechnician: string;
  invoiceCharges: string;
  invoiceChargeService: string;
  invoiceChargeCoupon: string;
  invoiceTreatment: string;
  invoicePremiumTitle: string;
  invoicePremiumBody: string;
  invoiceCopy: string;
  invoiceCopying: string;
  invoiceShare: string;
  bookingStepsProgress: string;
  trackingEmpty: string;
  bookingNotFound: string;
  bookingLoadFailed: string;
  cancelSheetKeep: string;
  otpCodeCopied: string;
  otpCodeExpired: string;
  otpExpiresIn: string;
  otpCopyCode: string;
  otpRefreshing: string;
  otpGetNew: string;
  otpCodeA11y: string;
  homeSeeAll: string;
  homeAdd: string;
  homeStartsAt: string;
  homeSearching: string;
  homeResultsOne: string;
  homeResultsMany: string;
  homeSeeAllResults: string;
  homeOffersTile: string;
  homeNewlyAdded: string;
  homeMostBookedTitle: string;
  homeSlideOffer: string;
  homeSlideService: string;
  homeLoadFailed: string;
  homeRefreshFailed: string;
  servicesSearchPlaceholder: string;
  servicesAllTypesA11y: string;
  servicesCountOne: string;
  servicesCountMany: string;
  servicesPopularBadge: string;
  servicesLoadFailed: string;
  servicesRefreshFailed: string;
  browseFallbackTitle: string;
  browseUnknownType: string;
  profileSignOutTitle: string;
  profileSignOutMessage: string;
  profileIncomplete: string;
  profileComplete: string;
  profileEditA11y: string;
  profileNotificationsA11y: string;
  profileAddDetails: string;
  profileSectionAccount: string;
  profileSectionInfo: string;
  profileSupportTitle: string;
  profileSupportSub: string;
  profileSupportCall: string;
  profileSupportWhatsapp: string;
  profileSupportFaq: string;
  profileVersion: string;
  profileStatAddresses: string;
  profileStatActiveLabel: string;
  profileStatPayments: string;
  profilePromiseEyebrow: string;
  homeTrustHeadline: string;
  homeTrustBadges: string;
  settingsLocationUpdated: string;
  settingsNameRequired: string;
  settingsEmailInvalid: string;
  settingsPhoneInvalid: string;
  settingsSaved: string;
  settingsSave: string;
  settingsFieldName: string;
  settingsFieldEmail: string;
  settingsFieldPhone: string;
  settingsFieldCity: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutEmptyTitle: string;
  aboutEmptyMessage: string;
  termsTitle: string;
  termsSubtitle: string;
  termsEmptyTitle: string;
  privacyTitle: string;
  privacySubtitle: string;
  privacyEmptyTitle: string;
  legalEmptyMessage: string;
  guideTitle: string;
  guideSubtitle: string;
  helpGuideSub: string;
  helpNoChannels: string;
  faqEmptyTitle: string;
  faqEmptyMessage: string;
  faqStillNeedHelp: string;
  faqStillNeedHelpSub: string;
  faqSearchPlaceholder: string;
  faqNoMatches: string;
  helpContactA11y: string;
  notifGroupToday: string;
  notifGroupYesterday: string;
  notifGroupWeek: string;
  notifGroupEarlier: string;
  notifLoadFailed: string;
  notifMarkFailed: string;
  addressesEdit: string;
  addressesEditSub: string;
  addressesEditSheetTitle: string;
  addressesUpdatedToast: string;
  addressesLoadFailed: string;
  paymentsLabelRequired: string;
  paymentsAddedToast: string;
  paymentsRemovedToast: string;
  paymentsDefaultToast: string;
  paymentsSetDefault: string;
  paymentsSetDefaultSub: string;
  paymentsRemove: string;
  paymentsRemoveTitle: string;
  paymentsKeep: string;
  paymentsSavedTitle: string;
  paymentsDefaultBadge: string;
  paymentsSheetHint: string;
  paymentsSave: string;
  paymentsLabelField: string;
  paymentsLabelPlaceholder: string;
  paymentsLoadFailed: string;
  reviewStar1: string;
  reviewStar2: string;
  reviewStar3: string;
  reviewStar4: string;
  reviewStar5: string;
  reviewStarA11y: string;
  reviewSelectRating: string;
  reviewNotePlaceholder: string;
  reviewSubmit: string;
  reviewSubmitFailed: string;
  reviewThanksTitle: string;
  reviewThanksBody: string;
  reviewThanksDone: string;
  offersLoadFailed: string;
  offersRefreshFailed: string;
  offersNoServicesOk: string;
  offerCouponCopied: string;
  offerCodeCopiedSub: string;
  offerCopy: string;
  offerCopyCode: string;
  offerCopied: string;
  offerCopyA11y: string;
  offerTicketA11y: string;
  offerRailTicketA11y: string;
  offerValidTill: string;
  offerMinOrder: string;
  offerApplyBook: string;
  offerSave: string;
  offerOff: string;
  offersRailTitle: string;
  offersEmptyTitle: string;
  offersEmptyMessage: string;
  offersDealsTitle: string;
  offersDealsSub: string;
  bookingsLoadFailed: string;
  timeSelected: string;
  timeHour: string;
  timeMinutes: string;
  timePassedNote: string;
  timeAnyNote: string;
  modeStandardDesc: string;
  modeCustomDesc: string;
  photoRemoveA11y: string;
  photoAddAnotherA11y: string;
  photosOptionalCount: string;
  locateFinding: string;
  locateUse: string;
  locateFindingSub: string;
  locateUseSub: string;
  homeCurationScript: string;
  homeSpecialistTitle: string;
  homeOpenProfileA11y: string;
  homeLocationA11y: string;
  homeLocationUpdatingA11y: string;
  homeLocationRefreshA11y: string;
  homeClosingA11y: string;
  trustNoteTitle: string;
  homeTopLocationA11y: string;
  guideIntroTitle: string;
  guideIntroBody: string;
  guideStep1Title: string;
  guideStep1Body: string;
  guideStep2Title: string;
  guideStep2Body: string;
  guideStep3Title: string;
  guideStep3Body: string;
  guideStep4Title: string;
  guideStep4Body: string;
  guideStep5Title: string;
  guideStep5Body: string;
  guideTimeKicker: string;
  guideTimeHeading: string;
  guideTimeSub: string;
  guideStandardTitle: string;
  guideStandardBody: string;
  guideCustomTitle: string;
  guideCustomBody: string;
  guideStart: string;
  otpSendFailed: string;
  otpSendFailedSub: string;
  otpInvalidCode: string;
  otpFailed: string;
  otpEnterDigits: string;
  otpSentTo: string;
  bookingFactCustomer: string;
  bookingFactCustomerContact: string;
  bookingFactJob: string;
  profileNameFallback: string;
  contactOpenFailed: string;
  contactOpenFailedSub: string;
  cartProgressAddress: string;
  cartProgressTime: string;
  cartProgressProperty: string;
  cartProgressPayment: string;
  cartProgressDoneA11y: string;
  notifLinkService: string;
  notifLinkOffers: string;
  notifLinkUrl: string;
  notifLoadingMoreA11y: string;
  bookingDetailCancelTooLateTitle: string;
  bookingDetailCallUs: string;
  bookingDetailCancelFailed: string;
  bookingDetailCancelledByYou: string;
  bookingDetailCancelledByTeam: string;
  bookingDetailCancelReason: string;
  bookingPaymentPaid: string;
  bookingPaymentRefunded: string;
  techNotificationsTitle: string;
  techNotificationsUnread: string;
  techNotificationsCaughtUp: string;
  techNotificationsLoadError: string;
  techNotificationsEmptyTitle: string;
  techNotificationsEmptyText: string;
  techNotificationsReadAll: string;
  techNotificationsClearRead: string;
  techNotificationsClearTitle: string;
  techNotificationsClearText: string;
  techNotificationsClearConfirm: string;
  techNotificationsCleared: string;
  techNotificationsUpdateError: string;
  techNotificationsDeleteA11y: string;
  techNotificationsLinkError: string;
  techNotificationsShowing: string;
  techNotificationsEnd: string;
  techNotificationsBell: string;
  techNotificationsBellUnread: string;
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
  cartForTitle: 'Who is this booking for?',
  cartForMe: 'Myself',
  cartForOther: 'Someone else',
  cartForOtherHint: 'They will be at the property. Our technician calls them on the visit day; updates and start/end codes stay in your account.',
  cartForName: 'Their name',
  cartForNamePlaceholder: 'e.g. Meera Shah',
  cartForPhone: 'Their mobile number',
  cartForPhonePlaceholder: '10-digit mobile number',
  cartForRowSub: 'Booking for someone else',
  cartForErrName: 'Enter their name',
  cartForErrPhone: 'Enter a valid 10-digit mobile number',
  bookingVisitContactTitle: 'Visit contact',
  bookingVisitContactSub: 'Our technician will call this person on the visit day',
  bookingForChip: 'For {name}',
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
  webProcessEyebrow: 'Our process',
  webProcessTitle: 'Our professional hygiene protection process',
  webSectorsEyebrow: 'Sectors we serve',
  webSectorsTitle: 'Pest control for every kind of space',
  webSectorsSubtitle: 'Specialised pest management solutions across diverse industries.',
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
  webScienceTitle: 'The science behind our treatments',
  webScienceText: 'Every treatment is based on pest behaviour analysis, research and safe chemical application methods.',
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
  webHeroCardTitle: 'Visit booked in 60 seconds',
  webHeroCardText: 'Photo proof of every step',
  webHeroRatingText: 'Loved by {count}+ customers',
  webHeroScrollHint: 'Scroll to explore',
  webClientsTitle: 'Trusted by brands across Gujarat',
  webWorkEyebrow: 'Our work',
  webWorkTitle: 'Real jobs, real results',
  webWorkSubtitle: 'A look at treatments our technicians have carried out for homes, kitchens and offices.',
  webWorkCta: 'View full gallery',
  webDetailNavOverview: 'Overview',
  webDetailNavIncluded: 'What\'s included',
  webDetailNavProcess: 'How it works',
  webDetailNavReviews: 'Reviews',
  webDetailNavFaq: 'FAQ',
  webDetailBookingsCount: '{count}+ bookings',
  webDetailRelatedTitle: 'You may also need',
  webDetailSizesTitle: 'Prices by size',
  webDetailReviewsSummary: 'Based on {count} reviews',
  webDetailWhatsApp: 'WhatsApp us',
  webBookProgress: 'Step {step} of {total}',
  webBookStickyCta: 'Confirm booking',
  webBookCouponMin: 'Add ₹{amount} more to use {code}',
  webBookMissingStep: 'Please complete this step first',
  webBookAddressError: 'Add the address where we should come.',
  webBookFailedError: 'Could not place the booking. Please try again.',
  webSuccessNextTitle: 'What happens next',
  webSuccessNext1: 'We confirm your visit time and send you an update.',
  webSuccessNext2: 'A verified technician is assigned before the visit.',
  webSuccessNext3: 'Share the start code when they arrive, then relax.',
  webSuccessAddCalendar: 'Add to calendar',
  webSuccessBreakdownTitle: 'Price details',
  webUnitMins: 'mins',
  webUnitHr: 'hr',
  webUnitHrs: 'hrs',
  webUnitAm: 'AM',
  webUnitPm: 'PM',
  webUnitSqft: '/ sq ft',
  webPestLabels: 'ant=Ant, cockroach=Cockroach, rodent=Rodent, mosquito=Mosquito, termite=Termite, bed_bug=Bed Bug, bird=Bird, flea=Flea, spider=Spider, lizard=Lizard, bee=Bee / Wasp, wood_borer=Wood Borer, general=General Pest, fumigation=Fumigation, deep_cleaning=Deep Cleaning, silo=Silo Treatment',
  webPropertyLabels: '1bhk=1 BHK, 2bhk=2 BHK, 3bhk=3 BHK, 4bhk=4 BHK, bungalow=Bungalow, office=Office, cafe_restaurant=Cafe / Restaurant, hotel=Hotel, warehouse=Warehouse, factory=Factory',
  webAuthIdentifierPlaceholder: 'you@email.com or 98765 43210',
  webAuthPasswordPlaceholder: 'Enter your password',
  webAuthShowPassword: 'Show password',
  webAuthHidePassword: 'Hide password',
  webAuthLoginError: 'Could not sign in. Please try again.',
  webAuthRegisterError: 'Could not create your account. Please try again.',
  webBookingTimelineTitle: 'Booking progress',
  webBookingLive: 'Live',
  webBookingKeep: 'Keep booking',
  webBookingCancelError: 'Could not cancel this booking.',
  webAccountTabProfile: 'Profile',
  webAccountTabAddresses: 'Addresses',
  webAccountAddressSaved: 'Address saved',
  webAccountNameRequired: 'Name is required.',
  webAccountDeleteAddress: 'Delete this address?',
  webAccountFallbackName: 'Account',
  webContactSendAnother: 'Send another message',
  webContactResponseNote: 'We usually reply within a few hours.',
  webBlogReadingTime: '{count} min read',
  webBlogShare: 'Share',
  webBlogCopyLink: 'Copy link',
  webBlogLinkCopied: 'Link copied',
  webLegalContents: 'On this page',
  webLegalEmpty: 'This page is being updated. Please check back soon.',
  webFooterCtaTitle: 'Ready for a pest-free space?',
  webFooterCtaText: 'Book a certified expert in minutes, or talk to us first.',
  webFooterAccountTitle: 'Your account',
  webBackToTop: 'Back to top',
  webStarsOutOf: '{value} out of 5',
  webOpenMenu: 'Open menu',
  webCloseMenu: 'Close menu',
  webPrevious: 'Previous',
  webNext: 'Next',
  webClose: 'Close',
  webStickyBookText: 'Pest problem? Book in 60 seconds',
  webAppStoreLabel: 'App Store',
  webPlayStoreLabel: 'Google Play',
  webReviewsAppBadge: 'Verified app review',
  webLoginPageTitle: 'Log in',
  webRegisterPageTitle: 'Create account',
  webAccountPageTitle: 'Account',
  webBookingsPageTitle: 'My bookings',
  webBookingPageTitle: 'Booking',
  webSuccessPageTitle: 'Booking received',
  webVisitLabel: 'Visit',
  webTimeLabel: 'Time',
  webTechnicianLabel: 'Technician',
  webTotalLabel: 'Total',
  webPincodeLabel: 'Pincode',
  webAddressHome: 'Home',
  webAddressOffice: 'Office',
  webAddressOther: 'Other',
  webSlotMorning: 'Morning',
  webSlotAfternoon: 'Afternoon',
  webSlotEvening: 'Evening',
  webStatusPending: 'Confirming time',
  webStatusConfirmed: 'Confirmed',
  webStatusInProgress: 'In progress',
  webStatusAwaiting: 'Awaiting your code',
  webStatusCompleted: 'Completed',
  webStatusCancelled: 'Cancelled',
  webBookingsLoadError: 'We could not load your bookings right now. Please refresh in a moment.',
  webServerDownTitle: 'We can’t reach Mr Antidot right now',
  webServerDownText: 'Please try again in a moment, or call us — we’re happy to help.',
  webRetryLabel: 'Try again',
  webNewsletterError: 'Could not subscribe right now. Please try again.',
  webErrLoginMissing: 'Enter your phone or email and password.',
  webErrStaffLogin: 'This login is for customers. Staff and technicians please use the Mr Antidot app.',
  webErrRegisterMissing: 'Name, phone and email are required.',
  webErrPhoneInvalid: 'Enter a valid 10-digit mobile number.',
  webErrPasswordShort: 'Password must be at least 8 characters.',
  webErrAddressMissing: 'House / flat and city are required.',
  techTabJobs: 'Jobs',
  techTabProfile: 'Profile',
  appMaintenanceTitle: 'We\'ll be right back',
  appMaintenanceText: 'Mr Antidot is getting an upgrade. Please try again in a little while.',
  appMaintenanceRetry: 'Try again',
  appUpdateTitle: 'Update available',
  appUpdateText: 'A newer version of Mr Antidot is required to continue.',
  appUpdateButton: 'Update now',
  liveBadgeLabel: 'Live',
  systemLoading: 'Loading…',
  systemBootPreparing: 'Preparing {brand}…',
  systemOfflineTitle: 'You’re offline',
  systemOfflineMessage: 'Check your internet connection and try again.',
  systemErrorTitle: 'Something went wrong',
  systemErrorMessage: 'We couldn’t load this right now. Please try again.',
  systemRetry: 'Try again',
  systemClose: 'Close',
  systemCancel: 'Cancel',
  systemDone: 'Done',
  toastLabelSuccess: 'Success',
  toastLabelError: 'Error',
  toastLabelInfo: 'Info',
  toastLabelWarning: 'Notice',
  toastLabelOffline: 'Offline',
  toastDismiss: 'Dismiss notification',
  homeSearchHintPrefix: 'Search for',
  homeSearchForHint: 'Search for {query}',
  homeSearchClear: 'Clear search',
  techCancel: 'Cancel',
  techRetry: 'Try again',
  techClose: 'Close',
  techRefreshError: 'Could not refresh',
  techCheckConnection: 'Check your connection and try again',
  techLiveBadge: 'Live',
  techPhotosOne: '1 photo',
  techPhotosMany: '{count} photos',
  techDaysOne: '1 day',
  techDaysMany: '{count} days',
  techJobsOne: '1 job',
  techJobsMany: '{count} jobs',
  techOpenSettings: 'Open settings',
  techDutyOn: 'On duty',
  techDutyCheckedOut: 'Checked out',
  techDutyLeave: 'On leave',
  techDutyAbsent: 'Absent',
  techDutyPending: 'Not checked in',
  techOnDutyTitle: 'You\'re on duty',
  techOnDutySince: 'On duty since {time}',
  techCheckOutButton: 'Check out',
  techMarkAbsentButton: 'Mark absent',
  techCheckedOutHint: 'You were present today. Go back on duty if you\'re taking more jobs.',
  techLeaveTodayTitle: 'On leave today',
  techLeaveTodayHint: 'Approved leave for today. Contact admin if you need to return early.',
  techToastCheckedOut: 'Checked out — off duty',
  techToastAbsent: 'Marked absent for today',
  techCheckInError: 'Could not check in',
  techCheckOutError: 'Could not check out',
  techAttendanceUpdateError: 'Could not update attendance',
  techAbsentConfirmTitle: 'Mark today absent?',
  techAbsentConfirmText: 'Use this for sick leave or a full day off. To end duty after working, use Check out.',
  techCheckOutConfirmTitle: 'Check out for today?',
  techCheckOutConfirmText: 'You\'ll go off duty. Today still counts as present.',
  techJobsEyebrow: 'FIELD WORK',
  techJobsGreeting: 'Hi {name} · {date}',
  techNameFallback: 'Technician',
  techJobsLoadError: 'Could not load jobs',
  techJobsRefreshError: 'Couldn\'t refresh your jobs — showing the last saved list.',
  techAttendanceLoadError: 'Couldn\'t load today\'s attendance.',
  techStatsLoadError: 'Couldn\'t load your earnings.',
  techEarnedThisMonth: 'Earned this month',
  techEarningsA11y: 'Open profile and earnings',
  techStatActive: 'Active',
  techStatJobsDone: 'Jobs done',
  techStatRating: 'Rating',
  techSectionOverdue: 'Overdue',
  techSectionToday: 'Today',
  techSectionUpcoming: 'Upcoming',
  techSectionAssigned: 'Assigned',
  techSectionPast: 'Past',
  techOverdueHint: 'Past visit date — action needed',
  techAllCaughtUpTitle: 'You\'re all caught up',
  techAllCaughtUpText: 'New jobs appear here as soon as admin assigns them.',
  techContinueActiveJob: 'Continue active job',
  techBannerActionNeeded: 'Action needed',
  techBannerVerifyTitle: 'Enter customer completion code',
  techBannerOverdue: 'Overdue · {count}',
  techJobTitle: 'Job',
  techJobNotFound: 'Job not found',
  techJobLoadError: 'Could not load this job',
  techJobSubtitle: 'Field job · {schedule}',
  techStatusPending: 'Pending',
  techStatusConfirmed: 'Confirmed',
  techStatusInProgress: 'In progress',
  techStatusAwaiting: 'Awaiting completion code',
  techStatusCompleted: 'Completed',
  techStatusCancelled: 'Cancelled',
  techGuidePending: 'Waiting for operations to confirm the visit schedule.',
  techGuideConfirmed: 'Ask the customer for their 6-digit start code, then tap below to begin.',
  techGuideInProgress: 'Capture a geotagged photo for each step, or finish when no steps are required.',
  techGuideAwaiting: 'Ask the customer for their completion code to finish this job.',
  techGuideCompleted: 'This job is finished. Great work!',
  techGuideCancelled: 'This job was cancelled. No further action needed.',
  techReadyTitle: 'Ready to start',
  techReadyText: 'Ask the customer for their start code, then enter it below to begin the visit.',
  techEstimateNote: 'estimate until complete',
  techProgressJob: 'Job progress',
  techProgressStepsComplete: 'Steps complete',
  techProgressTreatment: 'Treatment progress',
  techProgressSteps: '{done} of {total} steps',
  techStepDoneTag: 'Done · {photos}',
  techStepAddPhotos: 'Add up to {max} photos',
  techStepAddToComplete: 'Add photos to complete',
  techStepCompleteWith: 'Complete with {photos}',
  techStepNeedPhoto: 'Add at least one photo',
  techStepSaveError: 'Could not save step',
  techToastStepDone: '{step} completed',
  techToastPhotosSaved: '{photos} saved',
  techStepPhotoA11y: 'Open photo {index} of {total}',
  techVisitStatus: 'Visit status',
  techVisitStarted: 'Started',
  techVisitNotStarted: 'Not started',
  techVisitCompleted: 'Completed',
  techVisitInProgress: 'In progress',
  techVisitDuration: 'Duration',
  techVisitStateScheduled: 'Scheduled',
  techVisitStateInProgress: 'In progress',
  techVisitStateCompleted: 'Completed',
  techVisitStateNoShow: 'No show',
  techVisitStateCancelled: 'Cancelled',
  techCollectPayment: 'Collect payment',
  techOpenDirections: 'Open directions',
  techToastStartVerified: 'Start verified',
  techToastWorkStarted: 'Work started',
  techToastAskCompletionCode: 'Ask the customer for their completion code',
  techToastJobCompleted: 'Job completed',
  techOtpErrorTitle: 'Could not verify code',
  techOtpErrorText: 'Check the code with the customer and try again',
  techOtpStartHint: 'Ask the customer for the 6-digit start code in their app.',
  techOtpEndHint: 'Ask the customer for the 6-digit completion code in their app.',
  techOtpVerify: 'Verify code',
  techOtpVerifying: 'Verifying…',
  techOtpInputA11y: '6-digit code',
  techGpsLocatingTitle: 'Getting your location…',
  techGpsLocatingText: 'Step photos are tagged with where they were taken. This can take a few seconds indoors.',
  techGpsUseLastKnown: 'Use last known location',
  techGpsFailTitle: 'Couldn\'t find your location',
  techGpsFailText: 'Move near a window or step outside, then try again.',
  techGpsDeniedTitle: 'Allow location access',
  techGpsDeniedText: 'Step photos need your location. Allow location access for this app in Settings.',
  techGpsOffTitle: 'Turn on location',
  techGpsOffText: 'Location services are off on this phone. Turn them on to save this step.',
  techGpsFallbackAddress: 'On-site location',
  techPhotoCounter: '{index} of {total}',
  techLeaveTitle: 'Leave',
  techLeaveSubtitle: 'Request time off for approval',
  techLeaveFormTitle: 'Request leave',
  techLeaveFormHint: 'Admin must approve. Approved days mark attendance as leave automatically.',
  techLeaveWhen: 'When',
  techLeaveFrom: 'From',
  techLeaveTo: 'To',
  techLeaveToday: 'Today',
  techLeaveTomorrow: 'Tomorrow',
  techLeaveWeek: '1 week',
  techLeaveType: 'Type',
  techLeaveReason: 'Reason (optional)',
  techLeaveReasonPlaceholder: 'Short note for admin',
  techLeaveSubmit: 'Submit request',
  techLeaveRequestedToast: 'Leave requested',
  techLeaveRequestError: 'Could not request leave',
  techLeaveEndBeforeStart: 'End date must be on or after the start date',
  techLeaveLoadError: 'Could not load your leave requests',
  techLeaveListTitle: 'Your requests',
  techLeaveListCount: '{total} total',
  techLeaveListPending: '{count} pending',
  techLeaveEmptyTitle: 'No leave requests yet',
  techLeaveEmptyText: 'Submit above when you need time off.',
  techLeaveAdminNote: 'Admin: {note}',
  techLeavePending: 'Pending',
  techLeaveApproved: 'Approved',
  techLeaveRejected: 'Rejected',
  techLeaveCancelled: 'Cancelled',
  techLeaveCancelTitle: 'Cancel this leave request?',
  techLeaveCancelText: 'Admin will no longer see this pending request.',
  techLeaveKeep: 'Keep request',
  techLeaveCancelAction: 'Cancel request',
  techLeaveCancelledToast: 'Leave request cancelled',
  techLeaveCancelError: 'Could not cancel the request',
  techLeavePickTitle: 'Choose leave dates',
  techLeavePickHint: 'Tap the first day, then the last day. Tap a day twice for a single day.',
  techLeavePickEnd: 'Now tap the last day',
  techLeavePickApply: 'Use these dates',
  techLeaveDatesA11y: 'Leave from {from} to {to}. Double-tap to change.',
  techCalendarPrevMonth: 'Previous month',
  techCalendarNextMonth: 'Next month',
  techCalPresent: 'Present',
  techCalLeave: 'Leave',
  techCalPending: 'Pending',
  techCalJobs: 'Jobs',
  techCalNoJobs: 'No jobs on this day',
  techCalToday: 'Today',
  techProfileEyebrow: 'FIELD CREW',
  techProfileSubtitle: 'Verified technician · performance & schedule',
  techVerifiedBadge: 'Verified technician',
  techStatThisMonth: 'This month',
  techProfileLoadError: 'Could not load your profile',
  techQuickActionsTitle: 'Quick actions',
  techActionJobs: 'Open jobs',
  techActionJobsCount: '{count} assigned',
  techActionJobsEmpty: 'View schedule',
  techActionActive: 'Active job',
  techActionActiveContinue: 'Continue work',
  techActionActiveNone: 'None right now',
  techActionVerify: 'Verify',
  techActionVerifyCount: '{count} need code',
  techActionVerifyNone: 'All clear',
  techActionLeaveSub: 'Request time off',
  techPayRuleTitle: 'Pay rule',
  techPayRuleHint: 'Set by admin · applied when a job is completed',
  techPerformanceHint: 'Tap a metric to open related work',
  techStatAssigned: 'Assigned',
  techStatCompleted: 'Completed',
  techAttendanceTitle: 'Attendance & visits',
  techAttendanceHint: 'Presence and visit performance this month',
  techAttRate: 'Attendance',
  techAttPresent: 'Days present',
  techAttLeave: 'Leave days',
  techAttStarted: 'Jobs started',
  techAttCompleted: 'Jobs completed',
  techAttOnTime: 'On time',
  techAttAvgVisit: 'Avg visit',
  techAttSummary: '{done} of {scheduled} jobs completed',
  techScheduleHint: 'Your attendance and visits by day',
  techSignOut: 'Sign out',
  techSignOutTitle: 'Sign out?',
  techSignOutText: 'You\'ll return to the login screen.',
  onboardSlide1Title: 'Pest control made simple',
  onboardSlide1Sub: 'Book trusted professionals for your home or business in seconds.',
  onboardSlide2Title: 'Track every step',
  onboardSlide2Sub: 'Follow your technician live from visit start to photo proof.',
  onboardSlide3Title: 'Guaranteed results',
  onboardSlide3Sub: 'Eco-safe treatments backed by our satisfaction promise.',
  onboardPageLabel: 'Page {current} of {total}',
  launchTaglineFallback: 'Trusted pest control & home services',
  launchFindingTitle: 'Finding your area…',
  launchFindingBody: 'Matching trusted experts near you',
  launchFoundTitle: 'Serving {city}',
  launchFoundBody: 'Verified technicians are ready nearby',
  launchDeniedTitle: 'Location is off',
  launchDeniedBody: 'You can set your city anytime from home',
  launchContinue: 'Continue',
  cartAreaNotServed: 'Sorry, we don’t serve this area yet. Try another address or call us.',
  cartSlotUnavailable: 'That time isn’t open for booking. Please pick another slot.',
  cartSlotTooSoon: 'Please pick a time at least {lead} from now.',
  cartDateTooFar: 'Bookings open up to {days} days ahead. Please pick an earlier date.',
  cartPropertyUnavailable: 'Please pick a property type from the list.',
  cartPaymentUnavailable: 'That payment option isn’t available right now. Please choose another.',
  bookingDetailRescheduleCutoff: 'Visits can’t be moved less than {window} before they start. Please call us to change it.',
  bookingDetailRescheduleLimit: 'You’ve used all reschedules for this visit ({count}). Please call us to change it.',
  appMaintenanceStaff: 'Team sign-in',
  webBookAreaHint: 'We currently serve {areas}.',
  customerTabHome: 'Home',
  customerTabBookings: 'Bookings',
  customerTabOffers: 'Offers',
  customerTabProfile: 'Profile',
  statusLabelPending: 'Pending',
  statusLabelConfirmed: 'Confirmed',
  statusLabelInProgress: 'In progress',
  statusLabelAwaiting: 'Awaiting code',
  statusLabelCompleted: 'Completed',
  statusLabelCancelled: 'Cancelled',
  statusGuidePending: 'We’re confirming your visit time. You’ll be notified once it’s scheduled.',
  statusGuideConfirmed: 'Share your start code when our service expert arrives.',
  statusGuideInProgress: 'Treatment is in progress at your location.',
  statusGuideAwaiting: 'Share your completion code to finish the booking.',
  statusGuideCompleted: 'This booking is complete. Thank you for choosing {brand}.',
  statusGuideCancelled: 'This booking was cancelled. You can book again anytime.',
  bookingServiceFallback: 'Service',
  bookingScheduleTbd: 'Schedule TBD',
  trackAssigned: 'Service expert assigned',
  trackStartCode: 'Start code issued',
  trackWorkStarted: 'Work started',
  trackStepDone: 'Treatment step captured',
  trackEndCode: 'Completion code issued',
  trackCompleted: 'Job completed',
  trackCancelled: 'Booking cancelled',
  trackAdminOverride: 'Marked complete by our team',
  trackScheduleConfirmed: 'Visit time confirmed',
  trackRescheduled: 'Visit rescheduled',
  bookingDetailCancelCutoff: 'Visits can’t be cancelled less than {window} before they start. Please call us to cancel.',
  photoViewerLabel: 'Photo {current} of {total}',
  photoViewerCount: '{current} / {total}',
  photoOpenHint: 'Opens the photo full screen',
  photoUnavailable: 'Photo unavailable',
  bookingProblemPhotos: 'Problem photos ({count})',
  bookingFactPackage: 'Package',
  bookingCallLabel: 'Call {name}',
  stepPhotosOne: '1 photo captured',
  stepPhotosMany: '{count} photos captured',
  stepWorkingNow: 'Technician is working on this now',
  problemPhotosTitle: 'Problem photos',
  problemPhotosSub: '{count} attached',
  webSlotNight: 'Night',
  listMoreOptions: 'More options for {name}',
  servicePerSqFt: '{price} / sq ft',
  serviceRowA11y: '{service}, starts at {price}',
  serviceRowBookA11y: 'Book {service}',
  timeJustNow: 'Just now',
  timeMinutesAgo: '{count}m ago',
  timeHoursAgo: '{count}h ago',
  timeYesterday: 'Yesterday',
  notificationsUnreadA11y: 'Unread',
  appMaintenanceBadge: 'Scheduled maintenance',
  appUpdateBadge: 'You have version {version}',
  slotPassedNote: 'Earlier slots today have passed — showing what’s still open.',
  slotUnavailableA11y: 'unavailable',
  slotNoneOpen: 'No open slots on this day. Pick another day.',
  dayToday: 'Today',
  dayTomorrowShort: 'Tmrw',
  dayTomorrow: 'Tomorrow',
  rescheduleTitle: 'Reschedule visit',
  rescheduleHint: 'Pick a new day and time. Our team will confirm it shortly.',
  rescheduleButton: 'Request new time',
  photoSheetTitle: 'Add photo',
  photoSheetSub: 'Take a new photo or choose from your gallery',
  photoTake: 'Take photo',
  photoTakeSub: 'Open camera and capture now',
  photoGallery: 'Choose from gallery',
  photoGallerySub: 'Pick one or more saved photos',
  serviceInvalidLink: 'This service link is invalid.',
  serviceGone: 'This service is no longer available.',
  serviceOptionsFallbackTitle: 'Size of home',
  servicePickSizeFirst: 'Select a size to continue',
  serviceShareA11y: 'Share this service',
  serviceReviewCountOne: '1 review',
  serviceReviewCountMany: '{count} reviews',
  serviceSeeAllReviews: 'See all {count} reviews',
  serviceAllReviewsTitle: 'All reviews',
  serviceStarsA11y: '{stars} stars: {count}',
  navBack: 'Go back',
  propertyGroupHome: 'Residential',
  propertyGroupBusiness: 'Commercial',
  payUpiCardSub: 'Pay by UPI or card at the visit — nothing is charged in the app',
  payAfterSub: 'Pay cash to the technician once the job is done',
  payOtherSub: 'Pay at the visit',
  payManageSaved: 'Manage saved payment methods',
  billItemTotal: 'Item total',
  billGst: 'Taxes (GST {percent}%)',
  billCoupon: 'Coupon discount',
  billAmountToPay: 'Amount to pay',
  billSaving: 'You’re saving {amount} on this booking',
  offerApply: 'Apply',
  offerRemove: 'Remove',
  offerAppliedA11y: 'Applied, tap to remove',
  offerTapToApplyA11y: 'Tap to apply',
  offerPercentOff: '{value}% off',
  offerFlatOff: '{amount} off',
  couponPlaceholder: 'Enter coupon code',
  couponClear: 'Clear coupon',
  couponInvalid: 'This coupon is not valid',
  couponApplied: 'Applied',
  payTotalPayable: 'Total payable',
  paySavePill: 'You save {amount}',
  payServiceRow: 'Service',
  payDiscountRow: 'Discount',
  paySecureNote: 'Secure checkout · Your payment details stay protected',
  payReadyKicker: 'Ready to continue',
  payEstimated: '{amount} estimated',
  addrHouseLabel: 'House / flat number',
  addrHousePlaceholder: 'e.g. A-302 / 14',
  addrStreetLabel: 'Street / area',
  addrStreetPlaceholder: 'Street, society, area',
  addrLandmarkLabel: 'Landmark',
  addrLandmarkPlaceholder: 'Near park, opposite temple…',
  addrCityLabel: 'City',
  addrCityPlaceholder: 'City',
  addrPincodeLabel: 'Pincode',
  addrPincodePlaceholder: '6 digits',
  addrSaveAsLabel: 'Save as',
  addrSaveHome: 'Home',
  addrSaveOffice: 'Office',
  addrSaveOther: 'Other',
  addrSaveAsA11y: 'Save as {label}',
  addrHousePrefix: 'Flat/House {house}',
  addrLandmarkPrefix: 'Landmark: {landmark}',
  addrFieldMissing: 'Add this to continue',
  cartLocationFilled: 'Location filled',
  cartLocationFilledSub: 'Add your house / flat number to finish',
  cartAddressIncomplete: 'Add house/flat, street and city — or pick a saved place',
  cartAddressNotSaved: 'Address not saved for later',
  cartAddressNotSavedSub: 'Booking will still use the details you entered',
  cartBookFailed: 'Could not confirm booking',
  cartLoadFailed: 'Could not load booking details',
  cartTimePast: 'Pick a time later than now',
  cartTimeOutside: 'That time is outside our booking hours. Pick another time.',
  invoiceTaxTitle: 'Tax invoice',
  invoicePreparing: 'Preparing invoice…',
  invoiceItemised: 'Itemised receipt for this visit',
  invoiceDownload: 'Download',
  invoiceGenerate: 'Generate',
  invoiceOpening: 'Opening…',
  invoiceDownloadA11y: 'Download invoice',
  invoiceGenerateA11y: 'Generate invoice',
  invoiceCopyA11y: 'Copy invoice',
  invoiceShareA11y: 'Share invoice',
  invoiceReadyToast: 'Invoice ready to save or share',
  invoiceDownloadFailed: 'Could not download invoice',
  invoiceCopied: 'Invoice copied',
  invoiceCopyFailed: 'Could not copy invoice',
  invoiceTotalPaid: 'Total paid',
  invoiceAmountDue: 'Amount due',
  invoiceGstin: 'GSTIN {gstin}',
  invoiceBadge: 'TAX INVOICE',
  invoiceReceiptTitle: 'Service receipt',
  invoiceReceiptSub: 'Itemised charges, visit details & treatment summary',
  invoiceTapToGenerate: 'Tap below to generate',
  invoiceServiceKicker: 'SERVICE',
  invoiceFactVisit: 'Visit',
  invoiceFactProperty: 'Property',
  invoiceFactPayment: 'Payment',
  invoiceFactTechnician: 'Technician',
  invoiceCharges: 'Charges',
  invoiceChargeService: 'Service',
  invoiceChargeCoupon: 'Coupon',
  invoiceTreatment: 'Treatment included',
  invoicePremiumTitle: 'Premium invoice',
  invoicePremiumBody: 'Download a branded receipt with service coverage, visit details, and itemised charges.',
  invoiceCopy: 'Copy',
  invoiceCopying: 'Copying…',
  invoiceShare: 'Share',
  bookingStepsProgress: '{done} of {total} treatment steps',
  trackingEmpty: 'No activity yet',
  bookingNotFound: 'Booking not found',
  bookingLoadFailed: 'Could not load booking',
  cancelSheetKeep: 'Keep booking',
  otpCodeCopied: 'Code copied',
  otpCodeExpired: 'Code expired',
  otpExpiresIn: 'Expires in {time}',
  otpCopyCode: 'Copy code',
  otpRefreshing: 'Refreshing…',
  otpGetNew: 'Get new code',
  otpCodeA11y: 'Your code is {code}',
  homeSeeAll: 'See all',
  homeAdd: 'Add',
  homeStartsAt: 'Starts at',
  homeSearching: 'Searching…',
  homeResultsOne: '1 result for “{query}”',
  homeResultsMany: '{count} results for “{query}”',
  homeSeeAllResults: 'See all {count} results',
  homeOffersTile: 'Offers',
  homeNewlyAdded: 'Newly added',
  homeMostBookedTitle: 'Most booked services',
  homeSlideOffer: 'Get {amount} off with code {code}',
  homeSlideService: '{service} from {price}',
  homeLoadFailed: 'Could not load services',
  homeRefreshFailed: 'Could not refresh',
  servicesSearchPlaceholder: 'Search services…',
  servicesAllTypesA11y: 'All types',
  servicesCountOne: '1 service',
  servicesCountMany: '{count} services',
  servicesPopularBadge: 'Popular',
  servicesLoadFailed: 'Could not load services',
  servicesRefreshFailed: 'Could not refresh services',
  browseFallbackTitle: 'Browse',
  browseUnknownType: 'This service type isn’t available.',
  profileSignOutTitle: 'Sign out?',
  profileSignOutMessage: 'You can sign back in anytime.',
  profileIncomplete: 'Incomplete profile',
  profileComplete: 'Complete',
  profileEditA11y: '{name}. Edit profile',
  profileNotificationsA11y: 'Notifications, {count} unread',
  profileAddDetails: 'Add your phone and email',
  profileSectionAccount: 'Account',
  profileSectionInfo: 'Help & info',
  profileSupportTitle: 'Need help?',
  profileSupportSub: 'Our team is here for you',
  profileSupportCall: 'Call',
  profileSupportWhatsapp: 'WhatsApp',
  profileSupportFaq: 'FAQ',
  profileVersion: '{brand} · v{version}',
  profileStatAddresses: 'Addresses',
  profileStatActiveLabel: 'Active',
  profileStatPayments: 'Payments',
  profilePromiseEyebrow: '{brand} promise',
  homeTrustHeadline: '100% Satisfaction Guarantee',
  homeTrustBadges: 'Verified Pros, On-time Service, Safe Chemicals',
  settingsLocationUpdated: 'Location updated',
  settingsNameRequired: 'Please enter your name',
  settingsEmailInvalid: 'Please enter a valid email',
  settingsPhoneInvalid: 'Please enter a valid 10-digit mobile number',
  settingsSaved: 'Profile updated',
  settingsSave: 'Save changes',
  settingsFieldName: 'Full name',
  settingsFieldEmail: 'Email',
  settingsFieldPhone: 'Phone',
  settingsFieldCity: 'City',
  aboutTitle: 'About us',
  aboutSubtitle: 'Who we are',
  aboutEmptyTitle: 'Nothing here yet',
  aboutEmptyMessage: 'Check back soon.',
  termsTitle: 'Terms of Service',
  termsSubtitle: 'Please read carefully',
  termsEmptyTitle: 'Terms unavailable',
  privacyTitle: 'Privacy Policy',
  privacySubtitle: 'How we protect your data',
  privacyEmptyTitle: 'Privacy policy unavailable',
  legalEmptyMessage: 'Please contact support.',
  guideTitle: 'How to book',
  guideSubtitle: 'Steps, date & book-time options',
  helpGuideSub: '5 easy steps · Book with confidence',
  helpNoChannels: 'Call or message us from the Help page once our support lines are set up.',
  faqEmptyTitle: 'No FAQs yet',
  faqEmptyMessage: 'Check back soon.',
  faqStillNeedHelp: 'Still need help?',
  faqStillNeedHelpSub: 'Talk to our support team',
  faqSearchPlaceholder: 'Search questions',
  faqNoMatches: 'No questions match “{query}”.',
  helpContactA11y: '{label}: {value}',
  notifGroupToday: 'Today',
  notifGroupYesterday: 'Yesterday',
  notifGroupWeek: 'This week',
  notifGroupEarlier: 'Earlier',
  notifLoadFailed: 'Could not load notifications',
  notifMarkFailed: 'Could not mark as read',
  addressesEdit: 'Edit address',
  addressesEditSub: 'Change the street, landmark or city',
  addressesEditSheetTitle: 'Edit address',
  addressesUpdatedToast: 'Address updated',
  addressesLoadFailed: 'Could not load addresses',
  paymentsLabelRequired: 'Enter a label for this method',
  paymentsAddedToast: 'Payment method added',
  paymentsRemovedToast: 'Payment method removed',
  paymentsDefaultToast: 'Default updated',
  paymentsSetDefault: 'Set as default',
  paymentsSetDefaultSub: 'Pre-selected at checkout',
  paymentsRemove: 'Remove',
  paymentsRemoveTitle: 'Remove this payment method?',
  paymentsKeep: 'Keep it',
  paymentsSavedTitle: 'Saved methods',
  paymentsDefaultBadge: 'Default',
  paymentsSheetHint: 'Choose how you’d like to pay at the visit.',
  paymentsSave: 'Save',
  paymentsLabelField: 'Label',
  paymentsLabelPlaceholder: 'e.g. Personal UPI',
  paymentsLoadFailed: 'Could not load payment methods',
  reviewStar1: 'Poor',
  reviewStar2: 'Fair',
  reviewStar3: 'Good',
  reviewStar4: 'Great',
  reviewStar5: 'Excellent',
  reviewStarA11y: '{count} out of 5 stars',
  reviewSelectRating: 'Select a rating',
  reviewNotePlaceholder: 'Optional',
  reviewSubmit: 'Submit review',
  reviewSubmitFailed: 'Could not submit review',
  reviewThanksTitle: 'Thanks for your feedback!',
  reviewThanksBody: 'Your review helps other families choose with confidence.',
  reviewThanksDone: 'Back to bookings',
  offersLoadFailed: 'Could not load offers',
  offersRefreshFailed: 'Could not refresh offers',
  offersNoServicesOk: 'OK',
  offerCouponCopied: 'Coupon copied',
  offerCodeCopiedSub: '{code} — apply it at checkout',
  offerCopy: 'Copy',
  offerCopyCode: 'Copy code',
  offerCopied: 'Copied',
  offerCopyA11y: 'Copy code {code}',
  offerTicketA11y: '{value} off with {code}. Apply and book',
  offerRailTicketA11y: '{value} off with code {code}. Tap to copy',
  offerValidTill: 'Valid till {date}',
  offerMinOrder: 'Min order {amount}',
  offerApplyBook: 'Apply & book',
  offerSave: 'SAVE',
  offerOff: 'OFF',
  offersRailTitle: 'Offers for you',
  offersEmptyTitle: 'No offers right now',
  offersEmptyMessage: 'New coupons and seasonal deals will show up here. Book a service anytime at regular pricing.',
  offersDealsTitle: '{brand} deals',
  offersDealsSub: 'Save on your next booking',
  bookingsLoadFailed: 'Could not load bookings',
  timeSelected: 'Selected',
  timeHour: 'Hour',
  timeMinutes: 'Minutes',
  timePassedNote: 'Times that have already passed today are greyed out',
  timeAnyNote: 'Available 24/7 — any time',
  modeStandardDesc: '2-hour arrival window',
  modeCustomDesc: 'Pick an exact time',
  photoRemoveA11y: 'Remove photo',
  photoAddAnotherA11y: 'Add another photo',
  photosOptionalCount: 'Optional · {count}/{max} photos',
  locateFinding: 'Finding your location…',
  locateUse: 'Use current location',
  locateFindingSub: 'Hang tight — filling your address',
  locateUseSub: 'One tap · auto-fill from GPS',
  homeCurationScript: 'Expert',
  homeSpecialistTitle: 'Specialist treatments',
  homeOpenProfileA11y: 'Open profile',
  homeLocationA11y: 'Location {label}. Tap to refresh',
  homeLocationUpdatingA11y: 'Updating location',
  homeLocationRefreshA11y: 'Refresh location',
  homeClosingA11y: 'A {brand} technician being welcomed at a customer’s front door',
  trustNoteTitle: 'Every booking is protected',
  homeTopLocationA11y: '{title}. Service location: {place}. Tap to refresh',
  guideIntroTitle: 'Book in 5 easy steps',
  guideIntroBody: 'Follow this quick guide — pick a service, book your time, and confirm.',
  guideStep1Title: 'Pick a service',
  guideStep1Body: 'Browse pest types on Home or Services, then open the service you need.',
  guideStep2Title: 'Choose date & book time',
  guideStep2Body: 'Pick a visit day, then choose how you want to book the time (see options below).',
  guideStep3Title: 'Add property details',
  guideStep3Body: 'Tell us your property type so the technician brings the right treatment.',
  guideStep4Title: 'Add your address',
  guideStep4Body: 'GPS or saved place, then house/flat, optional landmark, and save as Home / Other.',
  guideStep5Title: 'Pay & confirm',
  guideStep5Body: 'Apply a coupon if you have one, choose payment, and place the booking.',
  guideTimeKicker: 'BOOK TIME OPTIONS',
  guideTimeHeading: 'How do you want to schedule?',
  guideTimeSub: 'On the date & time step you can use either option — both work day or night.',
  guideStandardTitle: 'Standard window',
  guideStandardBody: '2-hour slots — pick a ready-made visit window.',
  guideCustomTitle: 'Custom time',
  guideCustomBody: 'Set the exact time that works best for you.',
  guideStart: 'Start booking',
  otpSendFailed: 'Could not send code',
  otpSendFailedSub: 'Try password sign-in instead',
  otpInvalidCode: 'Invalid code',
  otpFailed: 'OTP failed',
  otpEnterDigits: 'Enter {count}-digit code',
  otpSentTo: 'Sent to {phone}',
  bookingFactCustomer: 'Customer',
  bookingFactCustomerContact: 'Customer contact',
  bookingFactJob: 'Job',
  profileNameFallback: 'Your account',
  contactOpenFailed: 'Could not open link',
  contactOpenFailedSub: 'Please try again from your phone app',
  cartProgressAddress: 'Address',
  cartProgressTime: 'Time',
  cartProgressProperty: 'Property',
  cartProgressPayment: 'Payment',
  cartProgressDoneA11y: '{step}, done',
  notifLinkService: 'View service',
  notifLinkOffers: 'View offers',
  notifLinkUrl: 'Open link',
  notifLoadingMoreA11y: 'Loading older notifications',
  bookingDetailCancelTooLateTitle: 'Too late to cancel in the app',
  bookingDetailCallUs: 'Call us',
  bookingDetailCancelFailed: 'Could not cancel the booking',
  bookingDetailCancelledByYou: 'You cancelled this booking. You can book again anytime.',
  bookingDetailCancelledByTeam: '{brand} cancelled this booking. You can book again anytime.',
  bookingDetailCancelReason: 'Reason: {reason}',
  bookingPaymentPaid: 'Paid',
  bookingPaymentRefunded: 'Refunded',
  techNotificationsTitle: 'Notifications',
  techNotificationsUnread: '{count} unread',
  techNotificationsCaughtUp: 'All caught up',
  techNotificationsLoadError: 'Couldn’t load notifications',
  techNotificationsEmptyTitle: 'No notifications yet',
  techNotificationsEmptyText: 'Job updates and messages from the office will show up here.',
  techNotificationsReadAll: 'Read all',
  techNotificationsClearRead: 'Clear read',
  techNotificationsClearTitle: 'Clear read notifications?',
  techNotificationsClearText: 'Everything you’ve already read will be deleted. Unread notifications stay.',
  techNotificationsClearConfirm: 'Clear',
  techNotificationsCleared: 'Read notifications cleared',
  techNotificationsUpdateError: 'Couldn’t update your notifications',
  techNotificationsDeleteA11y: 'Delete notification: {title}',
  techNotificationsLinkError: 'Couldn’t open the link',
  techNotificationsShowing: 'Showing {shown} of {total}',
  techNotificationsEnd: 'That’s everything',
  techNotificationsBell: 'Notifications',
  techNotificationsBellUnread: 'Notifications, {count} unread',
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
