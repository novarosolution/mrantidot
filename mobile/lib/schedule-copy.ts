import { useMemo } from 'react';
import { useAppContent } from '@/context/AppContentContext';
import type { BookingCopyConfig } from '@/types/api';

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
};

export function getBookingCopy(copy?: Partial<BookingCopyConfig>): BookingCopyConfig {
  return { ...DEFAULT_BOOKING_COPY, ...copy };
}

export function useBookingCopy(): BookingCopyConfig {
  const { content } = useAppContent();
  return useMemo(() => getBookingCopy(content.booking), [content.booking]);
}
