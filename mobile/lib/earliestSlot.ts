import { firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { formatBookableDate, formatHour12, nextBookableDays } from '@/lib/dates';

/** First open visit window in the next week, as "Today, 6 PM" — null when the week is full. */
export function earliestSlotLabel(): string | null {
  for (const d of nextBookableDays(7)) {
    const slot = firstOpenSlot(d.date);
    if (slot) {
      const day = formatBookableDate(d.date).split(' · ')[0] ?? '';
      return `${day}, ${formatHour12(slot.split('-')[0] ?? '09:00')}`;
    }
  }
  return null;
}
