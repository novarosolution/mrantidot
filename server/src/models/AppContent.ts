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
  trackingStepConfirmed: 'Schedule confirmed',
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
  techCheckInTitle: 'Mark yourself on duty',
  techCheckInSubtitle: 'Check in when you start your work day so admin can track attendance.',
  techOnDutyButton: 'On duty today',
  techOffDutyButton: 'Off today',
  techOnDutyBadge: '● On duty today',
  techOffDutyBadge: 'Off duty today',
  techOffDutyHint: 'You will not receive new job assignments while off duty.',
  techBackOnDutyButton: 'Go on duty',
  techPerformanceTitle: 'Performance',
  techScheduleTitle: 'Schedule calendar',
  techJobVisitsTitle: 'Job visits',
  techEmptyJobsTitle: 'No jobs assigned',
  techEmptyJobsMessage: 'New jobs from admin will appear here.',
  techJobValueLabel: 'Job value',
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
};

export const DEFAULT_APP_CONFIG: IAppConfig = {
  support: {
    phone: '+91 90000 00000',
    email: 'support@mrantidot.com',
    whatsapp: '',
    hours: 'Mon–Sat, 9 AM – 7 PM',
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
    termsMarkdown:
      '## Terms of Service\n\nBy using Mr Antidot you agree to our booking, payment, and cancellation policies. Please contact support for the full terms.',
    privacyMarkdown:
      '## Privacy Policy\n\nWe respect your privacy. Your data is used only to deliver and improve your service experience.',
  },
  aboutMarkdown:
    '## About Mr Antidot\n\nMr Antidot connects you with verified pest control and home service professionals. We are committed to safe, reliable, and guaranteed service.',
  faq: [
    { q: 'How do I book a service?', a: 'Pick a service from the home screen, choose a time slot and address, and confirm your booking.' },
    { q: 'Are technicians verified?', a: 'Yes. Every technician is background-checked and trained before joining the platform.' },
    { q: 'What if I am not satisfied?', a: 'Our satisfaction guarantee means we will make it right. Contact support and we will help.' },
    { q: 'How do I reschedule or cancel?', a: 'Open your booking and use the reschedule or cancel option, or contact support.' },
  ],
  booking: DEFAULT_BOOKING_COPY,
};
