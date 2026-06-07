import { useMemo } from 'react';
import { DEFAULT_BOOKING_COPY, getBookingCopy } from '@/constants/bookingCopy';
import { useAppContent } from '@/context/AppContentContext';

export { DEFAULT_BOOKING_COPY, getBookingCopy };

export function useBookingCopy() {
  const { content } = useAppContent();
  return useMemo(() => getBookingCopy(content.booking), [content.booking]);
}
