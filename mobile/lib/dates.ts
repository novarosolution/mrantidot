export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nextBookableDays(count = 6): {
  label: string;
  date: string;
  dayIdx: number;
  weekday: string;
  dayNum: number;
  month: string;
}[] {
  const days: {
    label: string;
    date: string;
    dayIdx: number;
    weekday: string;
    dayNum: number;
    month: string;
  }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const weekday = d.toLocaleString('en', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleString('en', { month: 'short' });
    days.push({
      label: `${weekday} ${dayNum}`,
      date: localDateKey(d),
      dayIdx: i,
      weekday,
      dayNum,
      month,
    });
  }
  return days;
}

export const BOOKING_SLOTS = [
  '00:00-02:00',
  '02:00-04:00',
  '04:00-06:00',
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-22:00',
  '22:00-00:00',
] as const;

/** Sensible default for new bookings (daytime). */
export const DEFAULT_BOOKING_SLOT: (typeof BOOKING_SLOTS)[number] = '10:00-12:00';

export const BOOKING_SLOT_GROUPS = [
  { title: 'Night', slots: ['00:00-02:00', '02:00-04:00', '04:00-06:00'] as const },
  { title: 'Morning', slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00'] as const },
  { title: 'Afternoon', slots: ['12:00-14:00', '14:00-16:00', '16:00-18:00'] as const },
  { title: 'Evening', slots: ['18:00-20:00', '20:00-22:00', '22:00-00:00'] as const },
] as const;

export function formatSlotLabel(slot: string): string {
  if (slot === 'custom') return 'Custom time';
  return slot.replace('-', ' – ');
}

/** Custom preferred time — every hour, 24/7. */
export const BOOKING_HOURS = Array.from({ length: 24 }, (_, i) => i);
export const BOOKING_MINUTES = [0, 30] as const;

export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
}

/** Human label for a YYYY-MM-DD key — e.g. "Today · Jun 1" or "Wed · Jun 4" */
export function formatBookableDate(dateKey: string, opts?: { includeYear?: boolean }): string {
  const [y, mo, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  if (!y || !mo || !d) return dateKey;
  const date = new Date(y, mo - 1, d);
  const today = localDateKey();
  const weekday = date.toLocaleString('en', { weekday: 'short' });
  const month = date.toLocaleString('en', { month: 'short' });
  const dayLabel = `${weekday} · ${month} ${d}`;
  if (dateKey === today) return `Today · ${month} ${d}`;
  if (opts?.includeYear) return `${dayLabel}, ${y}`;
  return dayLabel;
}

export function formatScheduleLabel(
  schedule: { date: string; slot: string; time?: string },
  mode?: 'standard' | 'custom',
): string {
  const dateLabel = formatBookableDate(schedule.date);
  const isCustom = mode === 'custom' || schedule.slot === 'custom';
  if (isCustom && schedule.time) {
    return `${dateLabel} · ${formatTime12h(schedule.time)}`;
  }
  return `${dateLabel} · ${formatSlotLabel(schedule.slot)}`;
}
