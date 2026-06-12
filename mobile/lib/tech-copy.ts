import { useMemo } from 'react';
import { getBookingCopy } from '@/constants/bookingCopy';
import { useAppContent } from '@/context/AppContentContext';
import type { BookingCopyConfig } from '@/types/api';

export function useTechCopy(): BookingCopyConfig {
  const { content } = useAppContent();
  return useMemo(() => getBookingCopy(content.booking), [content.booking]);
}
