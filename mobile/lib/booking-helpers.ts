import type { Booking, BookingStatus, CustomerUiCopy, Service, User } from '@/types/api';
import { formatScheduleLabel, isSlotStarted, isTimeStarted } from '@/lib/dates';
import { paymentLabel } from '@/lib/settingsLabels';
import { fillBrand } from '@/constants/customerUiCopy';

/**
 * Customer-facing labels take the admin-editable copy (`useCustomerUiCopy()`) as an optional last
 * argument. Staff / technician screens omit it and keep the built-in operations wording.
 */
type Copy = Pick<
  CustomerUiCopy,
  | 'statusLabelPending'
  | 'statusLabelConfirmed'
  | 'statusLabelInProgress'
  | 'statusLabelAwaiting'
  | 'statusLabelCompleted'
  | 'statusLabelCancelled'
  | 'statusGuidePending'
  | 'statusGuideConfirmed'
  | 'statusGuideInProgress'
  | 'statusGuideAwaiting'
  | 'statusGuideCompleted'
  | 'statusGuideCancelled'
  | 'bookingServiceFallback'
  | 'bookingScheduleTbd'
  | 'trackAssigned'
  | 'trackStartCode'
  | 'trackWorkStarted'
  | 'trackStepDone'
  | 'trackEndCode'
  | 'trackCompleted'
  | 'trackCancelled'
  | 'trackAdminOverride'
  | 'trackScheduleConfirmed'
  | 'trackRescheduled'
>;

export function bookingServiceName(booking: Booking, copy?: Pick<Copy, 'bookingServiceFallback'>): string {
  if (booking.service && typeof booking.service === 'object') {
    return (booking.service as Service).name;
  }
  return copy?.bookingServiceFallback ?? 'Service';
}

export function bookingServiceIconKey(booking: Booking): string {
  if (booking.service && typeof booking.service === 'object') {
    return (booking.service as Service).iconKey ?? 'spray';
  }
  return 'spray';
}

export function bookingCustomerName(booking: Booking): string {
  if (booking.customer && typeof booking.customer === 'object') {
    return (booking.customer as User).name;
  }
  return 'Customer';
}

export function bookingTechnicianName(booking: Booking): string {
  if (booking.technician && typeof booking.technician === 'object') {
    return (booking.technician as User).name;
  }
  return 'Technician';
}

/** True when admin has assigned a field technician (staff views only). */
export function bookingHasTechnician(booking: Booking): boolean {
  return Boolean(booking.technician && typeof booking.technician === 'object');
}

export function bookingRef(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

/** Payment method name from the admin's business settings ("UPI / Card", "Pay after service"…). */
export function paymentMethodLabel(method?: string | null): string {
  return paymentLabel(method);
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  awaiting_verification: 'Awaiting verification',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_GUIDANCE: Record<BookingStatus, string> = {
  pending: 'We’re confirming your visit time. You’ll be notified once it’s scheduled.',
  confirmed: 'Share your start code when our service expert arrives.',
  in_progress: 'Treatment is in progress at your location.',
  awaiting_verification: 'Share your completion code to finish the booking.',
  completed: 'This booking is complete. Thank you for choosing Mr Antidot.',
  cancelled: 'This booking was cancelled. You can book again anytime.',
};

const TECHNICIAN_STATUS_GUIDANCE: Record<BookingStatus, string> = {
  pending: 'Waiting for operations to confirm the visit schedule.',
  confirmed: 'Ask the customer for their 6-digit start code, then tap below to begin.',
  in_progress: 'Capture a geotagged photo for each step, or finish when no steps are required.',
  awaiting_verification: 'Ask the customer for their completion code to finish this job.',
  completed: 'This job is finished. Great work!',
  cancelled: 'This job was cancelled. No further action needed.',
};

const STAFF_STATUS_GUIDANCE: Record<BookingStatus, string> = {
  pending: 'Review the requested time, confirm the schedule, then assign a technician.',
  confirmed: 'Scheduled. The technician needs the customer’s start code to begin.',
  in_progress: 'Technician is on site capturing treatment steps.',
  awaiting_verification: 'Treatment done — waiting for the customer’s completion code.',
  completed: 'Job closed. Earnings are credited to the technician.',
  cancelled: 'This booking was cancelled. No further action needed.',
};

function customerStatusLabels(copy: Copy): Record<BookingStatus, string> {
  return {
    pending: copy.statusLabelPending,
    confirmed: copy.statusLabelConfirmed,
    in_progress: copy.statusLabelInProgress,
    awaiting_verification: copy.statusLabelAwaiting,
    completed: copy.statusLabelCompleted,
    cancelled: copy.statusLabelCancelled,
  };
}

/** Status name. Pass the customer copy on customer screens. */
export function bookingStatusLabel(status: BookingStatus, copy?: Copy): string {
  if (copy) return customerStatusLabels(copy)[status] ?? status.replace(/_/g, ' ');
  return STATUS_LABELS[status] ?? status;
}

export function bookingStatusMessage(
  status: BookingStatus,
  audience: 'customer' | 'technician' | 'staff' = 'customer',
  copy?: Copy,
  brand?: string,
): string {
  if (audience === 'technician') {
    return TECHNICIAN_STATUS_GUIDANCE[status] ?? '';
  }
  if (audience === 'staff') {
    return STAFF_STATUS_GUIDANCE[status] ?? '';
  }
  if (copy) {
    const map: Record<BookingStatus, string> = {
      pending: copy.statusGuidePending,
      confirmed: copy.statusGuideConfirmed,
      in_progress: copy.statusGuideInProgress,
      awaiting_verification: copy.statusGuideAwaiting,
      completed: copy.statusGuideCompleted,
      cancelled: copy.statusGuideCancelled,
    };
    return fillBrand(map[status] ?? '', brand ?? 'Mr Antidot');
  }
  return STATUS_GUIDANCE[status] ?? '';
}

export function canCancelBooking(status: BookingStatus): boolean {
  return ['pending', 'confirmed'].includes(status);
}

const TRACKING_LABELS: Record<string, string> = {
  assigned: 'Service expert assigned',
  start_otp_sent: 'Start code issued',
  work_started: 'Work started',
  step_done: 'Treatment step captured',
  end_otp_sent: 'Completion code issued',
  work_completed: 'Job completed',
  cancelled: 'Booking cancelled',
  admin_override: 'Admin marked complete',
  schedule_confirmed: 'Visit time confirmed',
  rescheduled: 'Visit rescheduled',
};

export function trackingEventLabel(event: string, copy?: Copy): string {
  if (copy) {
    const map: Record<string, string> = {
      assigned: copy.trackAssigned,
      start_otp_sent: copy.trackStartCode,
      work_started: copy.trackWorkStarted,
      step_done: copy.trackStepDone,
      end_otp_sent: copy.trackEndCode,
      work_completed: copy.trackCompleted,
      cancelled: copy.trackCancelled,
      admin_override: copy.trackAdminOverride,
      schedule_confirmed: copy.trackScheduleConfirmed,
      rescheduled: copy.trackRescheduled,
    };
    if (map[event]) return map[event];
  }
  return TRACKING_LABELS[event] ?? event.replace(/_/g, ' ');
}

export function isSchedulePending(booking: Booking): boolean {
  return booking.status === 'pending';
}

/** Pending booking whose requested visit time has already started without being confirmed. */
export function isRequestedTimePast(booking: Booking): boolean {
  if (booking.status !== 'pending') return false;
  const req = booking.scheduleRequest ?? booking.schedule;
  if (!req?.date) return false;
  if (req.time) return isTimeStarted(req.date, req.time);
  return isSlotStarted(req.date, req.slot ?? '00:00-02:00');
}

export function bookingScheduleDisplay(booking: Booking, copy?: Pick<Copy, 'bookingScheduleTbd'>): string {
  const source = booking.status === 'pending' && booking.scheduleRequest
    ? {
        date: booking.scheduleRequest.date,
        slot: booking.scheduleRequest.slot ?? 'custom',
        time: booking.scheduleRequest.time,
      }
    : booking.schedule;
  if (!source?.date) return copy?.bookingScheduleTbd ?? 'Schedule TBD';
  return formatScheduleLabel(source, booking.scheduleMode);
}

export function bookingRequestedScheduleDisplay(booking: Booking): string | null {
  if (!booking.scheduleRequest) return null;
  const req = booking.scheduleRequest;
  return formatScheduleLabel(
    {
      date: req.date,
      slot: req.slot ?? 'custom',
      time: req.time,
    },
    booking.scheduleMode ?? (req.time ? 'custom' : 'standard'),
  );
}

export function bookingStepsDone(booking: Booking): number {
  return (booking.steps ?? []).filter((s) => s.status === 'done').length;
}

/** Visit date for lists/calendar (requested date while pending, else confirmed schedule). */
export function bookingVisitDate(booking: Booking): string {
  if (booking.status === 'pending' && booking.scheduleRequest?.date) {
    return booking.scheduleRequest.date;
  }
  return booking.schedule?.date ?? '';
}

export function isVerificationPhase(status: BookingStatus): boolean {
  return status === 'awaiting_verification';
}

export function isBookingLive(status: BookingStatus): boolean {
  return status === 'in_progress' || status === 'awaiting_verification';
}

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export function isOperationsPhase(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

/** Soonest booking that is still in progress (not completed / cancelled) — the customer's "next visit". */
export function nextActiveBooking(bookings: Booking[]): Booking | null {
  const active = bookings.filter((b) => !isTerminalBookingStatus(b.status));
  if (active.length === 0) return null;
  const when = (b: Booking) => b.schedule?.date ?? b.createdAt ?? '';
  return [...active].sort((a, b) => when(a).localeCompare(when(b)))[0] ?? null;
}
