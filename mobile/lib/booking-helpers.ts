import type { Booking, BookingStatus, Service, User } from '@/types/api';
import { formatScheduleLabel } from '@/lib/dates';

export function bookingServiceName(booking: Booking): string {
  if (booking.service && typeof booking.service === 'object') {
    return (booking.service as Service).name;
  }
  return 'Service';
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

export function paymentMethodLabel(method: string): string {
  if (method === 'pay_after') return 'Pay after service';
  if (method === 'upi_card') return 'UPI / Card';
  return method.replace(/_/g, ' ');
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

export function bookingStatusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function bookingStatusMessage(status: BookingStatus): string {
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
};

export function trackingEventLabel(event: string): string {
  return TRACKING_LABELS[event] ?? event.replace(/_/g, ' ');
}

export function isSchedulePending(booking: Booking): boolean {
  return booking.status === 'pending';
}

export function bookingScheduleDisplay(booking: Booking): string {
  const source = booking.status === 'pending' && booking.scheduleRequest
    ? {
        date: booking.scheduleRequest.date,
        slot: booking.scheduleRequest.slot ?? 'custom',
        time: booking.scheduleRequest.time,
      }
    : booking.schedule;
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
  return booking.steps.filter((s) => s.status === 'done').length;
}

export function isVerificationPhase(status: BookingStatus): boolean {
  return status === 'awaiting_verification';
}

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export function isOperationsPhase(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}
