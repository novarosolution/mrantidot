import { memo } from 'react';
import { BookingListCard } from '@/components/kit/BookingListCard';
import type { Booking } from '@/types/api';

/** Compact booking row for dashboard and technician schedule. */
export const AdminBookingRow = memo(function AdminBookingRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress?: () => void;
}) {
  return <BookingListCard booking={booking} onPress={onPress} showCustomer />;
});
