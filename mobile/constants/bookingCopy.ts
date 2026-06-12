import type { BookingCopyConfig, BookingStatus } from '@/types/api';

export const DEFAULT_BOOKING_COPY: BookingCopyConfig = {
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
  adminConfirmHint: 'Review the customer’s request and set the final visit time before notifying them.',
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
  otpEndSubtitle: 'Give this code once treatment is finished',
  otpStartSubtitle: 'Share this with your technician when they arrive',
  otpEndTitle: 'Completion code',
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

const STATUS_GUIDANCE_KEYS: Record<BookingStatus, keyof BookingCopyConfig> = {
  pending: 'statusGuidancePending',
  confirmed: 'statusGuidanceConfirmed',
  in_progress: 'statusGuidanceInProgress',
  awaiting_verification: 'statusGuidanceAwaitingVerification',
  completed: 'statusGuidanceCompleted',
  cancelled: 'statusGuidanceCancelled',
};

function strField(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

export function getBookingCopy(copy?: Partial<BookingCopyConfig>): BookingCopyConfig {
  const d = DEFAULT_BOOKING_COPY;
  const b = copy ?? {};
  const out = { ...d };
  for (const key of Object.keys(d) as (keyof BookingCopyConfig)[]) {
    out[key] = strField(b[key], d[key]);
  }
  return out;
}

export function getStatusGuidance(status: BookingStatus, copy?: Partial<BookingCopyConfig>): string {
  const merged = getBookingCopy(copy);
  const key = STATUS_GUIDANCE_KEYS[status];
  return merged[key] ?? '';
}

export function getWizardStepLabels(copy?: Partial<BookingCopyConfig>): string[] {
  const c = getBookingCopy(copy);
  return [
    c.wizardStepSchedule,
    c.wizardStepProperty,
    c.wizardStepAddress,
    c.wizardStepPayment,
    c.wizardStepConfirm,
  ];
}

export function getCustomerTrackingSteps(
  status: BookingStatus,
  expertAssigned: boolean,
  copy?: Partial<BookingCopyConfig>,
): { title: string; done: boolean }[] {
  const c = getBookingCopy(copy);
  const steps = [
    { title: c.trackingStepReceived, done: true },
    { title: c.trackingStepConfirmed, done: false },
    {
      title: expertAssigned ? c.trackingStepShareStartCode : c.trackingStepAssignExpert,
      done: false,
    },
    { title: c.trackingStepInProgress, done: false },
    { title: c.trackingStepShareCompletionCode, done: false },
    { title: c.trackingStepCompleted, done: false },
  ];
  if (status === 'pending') return steps.map((s, i) => ({ ...s, done: i === 0 }));
  if (status === 'confirmed') {
    return steps.map((s, i) => ({
      ...s,
      done: i <= 1 || (i === 2 && expertAssigned),
    }));
  }
  if (status === 'in_progress') return steps.map((s, i) => ({ ...s, done: i <= 3 }));
  if (status === 'awaiting_verification') return steps.map((s, i) => ({ ...s, done: i <= 4 }));
  if (status === 'completed') return steps.map((s) => ({ ...s, done: true }));
  return steps;
}

/** Field groups for admin content editor. */
export const BOOKING_COPY_ADMIN_GROUPS = {
  wizard: [
    ['wizardScreenTitle', 'Screen title'],
    ['wizardStepSchedule', 'Step: Schedule'],
    ['wizardStepProperty', 'Step: Property'],
    ['wizardStepAddress', 'Step: Address'],
    ['wizardStepPayment', 'Step: Payment'],
    ['wizardStepConfirm', 'Step: Confirm'],
    ['wizardReviewSectionTitle', 'Review section title'],
    ['wizardContinueButton', 'Continue button'],
    ['wizardSubmitButton', 'Submit button'],
    ['wizardBackButton', 'Back button'],
    ['scheduleStepTitle', 'Schedule panel title'],
    ['scheduleStepSubtitle', 'Schedule panel subtitle'],
    ['standardModeLabel', 'Standard mode'],
    ['customModeLabel', 'Custom mode'],
    ['customNotesPlaceholder', 'Notes placeholder'],
    ['pendingReviewNote', 'Review pending note'],
    ['requestSubmittedToast', 'Submit toast / success title'],
  ] as const,
  list: [
    ['listScreenTitle', 'Screen title'],
    ['listFilterActive', 'Filter: Active'],
    ['listFilterCompleted', 'Filter: Done'],
    ['listFilterCancelled', 'Filter: Cancelled'],
    ['listNextVisitLabel', 'Next visit badge'],
    ['listEmptyActive', 'Empty: active'],
    ['listEmptyCompleted', 'Empty: completed'],
    ['listEmptyCancelled', 'Empty: cancelled'],
    ['listBookServiceButton', 'Book service button'],
  ] as const,
  success: [
    ['successSummaryTitle', 'Summary title'],
    ['successLabelReference', 'Reference label'],
    ['successLabelService', 'Service label'],
    ['successLabelVisit', 'Visit label'],
    ['successLabelPayment', 'Payment label'],
    ['successLabelTotal', 'Total label'],
    ['successViewBookingButton', 'View booking button'],
    ['successHomeButton', 'Home button'],
  ] as const,
  pending: [
    ['pendingCustomerTitle', 'Pending card title'],
    ['pendingCustomerHint', 'Pending card hint'],
    ['pendingFactsSubtitle', 'Facts subtitle'],
  ] as const,
  detail: [
    ['detailScreenTitle', 'Screen title'],
    ['detailDetailsTitle', 'Details title'],
    ['detailDetailsSubtitle', 'Details subtitle'],
    ['trackingSectionTitle', 'Tracking title'],
    ['trackingSectionSubtitle', 'Tracking subtitle'],
    ['activitySectionTitle', 'Activity title'],
    ['activitySectionSubtitle', 'Activity subtitle'],
    ['treatmentStepsTitle', 'Treatment steps title'],
    ['treatmentStepsLiveSubtitle', 'Steps live subtitle'],
    ['treatmentStepsDoneSubtitle', 'Steps done subtitle'],
    ['detailLiveProgressLabel', 'Live progress label'],
    ['detailLiveBadge', 'Live badge'],
    ['otpStartTitle', 'Start OTP title'],
    ['otpStartSubtitle', 'Start OTP hint'],
    ['otpEndTitle', 'End OTP title'],
    ['otpEndSubtitle', 'End OTP hint'],
    ['detailActionEnterCode', 'Enter code button'],
    ['detailActionReview', 'Review button'],
    ['detailActionCancel', 'Cancel button'],
    ['detailActionBookAgain', 'Book again button'],
    ['factLabelWhen', 'Fact: When'],
    ['factLabelWhere', 'Fact: Where'],
    ['factLabelProperty', 'Fact: Property'],
    ['factLabelPayment', 'Fact: Payment'],
    ['factLabelCoupon', 'Fact: Coupon'],
    ['factLabelTechnician', 'Fact: Technician'],
    ['priceBreakdownTitle', 'Price title'],
    ['priceLabelService', 'Price: Service'],
    ['priceLabelGst', 'Price: GST'],
    ['priceLabelCoupon', 'Price: Coupon'],
    ['priceLabelTotal', 'Price: Total'],
    ['cancelConfirmTitle', 'Cancel dialog title'],
    ['cancelConfirmMessage', 'Cancel dialog message'],
    ['cancelConfirmKeep', 'Cancel keep button'],
    ['cancelConfirmAction', 'Cancel confirm button'],
  ] as const,
  trackingSteps: [
    ['trackingStepReceived', 'Step 1'],
    ['trackingStepConfirmed', 'Step 2'],
    ['trackingStepAssignExpert', 'Step 3a (assign)'],
    ['trackingStepShareStartCode', 'Step 3b (start code)'],
    ['trackingStepInProgress', 'Step 4'],
    ['trackingStepShareCompletionCode', 'Step 5'],
    ['trackingStepCompleted', 'Step 6'],
  ] as const,
  statusGuidance: [
    ['statusGuidancePending', 'Pending'],
    ['statusGuidanceConfirmed', 'Confirmed'],
    ['statusGuidanceInProgress', 'In progress'],
    ['statusGuidanceAwaitingVerification', 'Awaiting verification'],
    ['statusGuidanceCompleted', 'Completed'],
    ['statusGuidanceCancelled', 'Cancelled'],
  ] as const,
  admin: [
    ['adminRequestTitle', 'Request title'],
    ['adminConfirmTitle', 'Confirm title'],
    ['adminConfirmHint', 'Confirm hint'],
    ['adminConfirmButton', 'Confirm button'],
  ] as const,
  tech: [
    ['techJobsTitle', 'Jobs screen title'],
    ['techProfileTitle', 'Profile screen title'],
    ['techCheckInTitle', 'Check-in card title'],
    ['techCheckInSubtitle', 'Check-in card subtitle'],
    ['techOnDutyButton', 'On duty button'],
    ['techOffDutyButton', 'Off duty button'],
    ['techOnDutyBadge', 'On duty badge'],
    ['techOffDutyBadge', 'Off duty badge'],
    ['techOffDutyHint', 'Off duty hint'],
    ['techBackOnDutyButton', 'Back on duty button'],
    ['techPerformanceTitle', 'Performance section'],
    ['techScheduleTitle', 'Calendar section'],
    ['techJobVisitsTitle', 'Job visits section'],
    ['techEmptyJobsTitle', 'Empty jobs title'],
    ['techEmptyJobsMessage', 'Empty jobs message'],
    ['techJobValueLabel', 'Job value label'],
    ['techVisitTimesTitle', 'Visit times section'],
    ['techJobDetailsTitle', 'Job details section'],
    ['techTreatmentStepsTitle', 'Treatment steps section'],
    ['techActivityTitle', 'Activity section'],
    ['techEnterStartCode', 'Start code button'],
    ['techEnterCompletionCode', 'Completion code button'],
    ['techCompleteStepsFirst', 'Complete steps first button'],
    ['techStartOtpTitle', 'Start OTP sheet title'],
    ['techEndOtpTitle', 'End OTP sheet title'],
    ['techLocationNoteLabel', 'Location note label'],
    ['techLocationNotePlaceholder', 'Location note placeholder'],
    ['techNoStepsHint', 'No steps hint'],
  ] as const,
} as const;

export type BookingCopyFieldKey = keyof BookingCopyConfig;
