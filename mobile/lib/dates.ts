import { getBusinessSettings } from '@/lib/businessSettings';
import type { BusinessSettings, SettingsSlotGroup } from '@/types/api';

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

/** Built-in 2-hour windows (the default Business settings slots). Settings-aware code uses `bookingSlotGroups` etc. */
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

/** Slot label in 12-hour time — "8 PM – 10 PM" (same format as the booking chips). */
export function formatSlotLabel(slot: string): string {
  if (slot === 'custom') return 'Custom time';
  const [from, to] = slot.split('-');
  if (!from || !to) return slot;
  return `${formatHour12(from)} – ${formatHour12(to)}`;
}

/** True when the slot (or custom HH:MM) on `dateKey` has already started — can't be booked any more. */
export function isTimeStarted(dateKey: string, startTime: string, now: Date = new Date()): boolean {
  if (dateKey !== localDateKey(now)) return dateKey < localDateKey(now);
  const [h, m] = startTime.split(':').map((n) => parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0) <= now.getHours() * 60 + now.getMinutes();
}

export function isSlotStarted(dateKey: string, slot: string, now: Date = new Date()): boolean {
  return isTimeStarted(dateKey, slot.split('-')[0] ?? '00:00', now);
}

/** Compact 12-hour hour label — "10 AM", "12 PM" (minutes kept only when non-zero). */
export function formatHour12(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr && mStr !== '00' ? `:${mStr}` : '';
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${m} ${suffix}`;
}

/** Slot chip label in 12-hour time — "10 AM – 12 PM". */
export function formatSlotShort12h(slot: string): string {
  return formatSlotLabel(slot);
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
  schedule?: { date?: string; slot?: string; time?: string } | null,
  mode?: 'standard' | 'custom',
): string {
  if (!schedule?.date) return 'Schedule TBD';
  const dateLabel = formatBookableDate(schedule.date);
  const slot = schedule.slot ?? 'custom';
  const isCustom = mode === 'custom' || slot === 'custom';
  if (isCustom && schedule.time) {
    return `${dateLabel} · ${formatTime12h(schedule.time)}`;
  }
  return `${dateLabel} · ${formatSlotLabel(slot)}`;
}

/* ─── Admin-managed booking rules (Business settings → Time slots / Booking rules) ───────────────
 * Pass `settings` from `useBusinessSettings()` inside components so they re-render on change;
 * without it the latest known copy is used. Times are the device clock, like the helpers above.
 */

const pickSettings = (s?: BusinessSettings) => s ?? getBusinessSettings();

function dateFromKey(dateKey: string, time = '00:00'): Date {
  const [y, mo, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return new Date(y ?? 1970, (mo ?? 1) - 1, d ?? 1, h || 0, m || 0);
}

/** Minutes from `now` until `time` (HH:mm) on `dateKey`; negative once it has started. */
export function minutesUntilStart(dateKey: string, time: string, now: Date = new Date()): number {
  return Math.round((dateFromKey(dateKey, time).getTime() - now.getTime()) / 60_000);
}

/** Days from today to `dateKey` (0 = today). */
export function daysFromToday(dateKey: string, now: Date = new Date()): number {
  const today = dateFromKey(localDateKey(now));
  return Math.round((dateFromKey(dateKey).getTime() - today.getTime()) / 86_400_000);
}

/** Within the booking horizon (today … today + `booking.horizonDays`). */
export function isWithinBookingHorizon(dateKey: string, s?: BusinessSettings, now: Date = new Date()): boolean {
  const days = daysFromToday(dateKey, now);
  return days >= 0 && days <= pickSettings(s).booking.horizonDays;
}

/**
 * Can a visit starting at `time` on `dateKey` still be booked? Not started, at least
 * `booking.leadMinutes` away, and within the horizon — the same rules the server enforces.
 */
export function isTimeBookable(dateKey: string, time: string, s?: BusinessSettings, now: Date = new Date()): boolean {
  const st = pickSettings(s);
  if (!isWithinBookingHorizon(dateKey, st, now)) return false;
  const until = minutesUntilStart(dateKey, time, now);
  return until > 0 && until >= st.booking.leadMinutes;
}

/** True when `slot` is an active window that can still be booked on `dateKey`. */
export function isSlotBookable(dateKey: string, slot: string, s?: BusinessSettings, now: Date = new Date()): boolean {
  const st = pickSettings(s);
  const win = st.slots.find((x) => x.active && x.key === slot);
  return Boolean(win) && isTimeBookable(dateKey, win!.from, st, now);
}

/** Active windows (keys, in order) still bookable on `dateKey`. */
export function bookableSlotsForDate(dateKey: string, s?: BusinessSettings, now: Date = new Date()): string[] {
  const st = pickSettings(s);
  return st.slots.filter((x) => x.active && isTimeBookable(dateKey, x.from, st, now)).map((x) => x.key);
}

/** True when a custom HH:mm falls inside an active window (windows past midnight included). */
export function isTimeInActiveWindow(time: string, s?: BusinessSettings): boolean {
  return pickSettings(s).slots.some((x) => x.active && (x.from < x.to ? time >= x.from && time < x.to : time >= x.from || time < x.to));
}

/** Active windows grouped night / morning / afternoon / evening — `titleKey` is the admin-editable group name. */
export function bookingSlotGroups(s?: BusinessSettings): {
  group: SettingsSlotGroup;
  titleKey: 'webSlotNight' | 'webSlotMorning' | 'webSlotAfternoon' | 'webSlotEvening';
  title: string;
  slots: string[];
}[] {
  const order: { group: SettingsSlotGroup; titleKey: 'webSlotNight' | 'webSlotMorning' | 'webSlotAfternoon' | 'webSlotEvening'; title: string }[] = [
    { group: 'morning', titleKey: 'webSlotMorning', title: 'Morning' },
    { group: 'afternoon', titleKey: 'webSlotAfternoon', title: 'Afternoon' },
    { group: 'evening', titleKey: 'webSlotEvening', title: 'Evening' },
    { group: 'night', titleKey: 'webSlotNight', title: 'Night' },
  ];
  const active = pickSettings(s).slots.filter((x) => x.active);
  return order
    .map((g) => ({ ...g, slots: active.filter((x) => x.group === g.group).map((x) => x.key) }))
    .filter((g) => g.slots.length > 0);
}

/**
 * Days for the customer date picker: up to `booking.pickerDays` days, from today, that still have at least
 * one bookable window (today drops out once its last window is too close), never past the horizon.
 */
export function bookingPickerDays(s?: BusinessSettings, now: Date = new Date()): ReturnType<typeof nextBookableDays> {
  const st = pickSettings(s);
  const want = Math.max(1, st.booking.pickerDays);
  const span = Math.min(st.booking.horizonDays + 1, want + 4);
  const out = nextBookableDays(span).filter((d) => bookableSlotsForDate(d.date, st, now).length > 0).slice(0, want);
  return out.map((d, i) => ({ ...d, dayIdx: i }));
}

/** Default window for a date: 10 AM – 12 PM when bookable, else the first bookable one. */
export function defaultSlotForDate(dateKey: string, s?: BusinessSettings, now: Date = new Date()): string | undefined {
  const open = bookableSlotsForDate(dateKey, s, now);
  return open.includes(DEFAULT_BOOKING_SLOT) ? DEFAULT_BOOKING_SLOT : open[0];
}

/** Earliest bookable visit within the picker days, or undefined when nothing is open. */
export function firstBookableSlot(s?: BusinessSettings, now: Date = new Date()): { date: string; slot: string } | undefined {
  for (const d of bookingPickerDays(s, now)) {
    const slot = bookableSlotsForDate(d.date, s, now)[0];
    if (slot) return { date: d.date, slot };
  }
  return undefined;
}

/** Hours until a booking's visit starts (schedule slot start, or custom time); undefined without a date. */
export function hoursUntilVisit(
  schedule?: { date?: string; slot?: string; time?: string } | null,
  now: Date = new Date(),
): number | undefined {
  if (!schedule?.date) return undefined;
  const start = schedule.slot && schedule.slot !== 'custom' ? schedule.slot.split('-')[0] : schedule.time;
  if (!start) return undefined;
  return minutesUntilStart(schedule.date, start, now) / 60;
}

/** Customer may still reschedule: outside `booking.rescheduleCutoffHours` and under `booking.maxReschedules`. */
export function canRescheduleVisit(
  booking: { schedule?: { date?: string; slot?: string; time?: string } | null; rescheduleCount?: number },
  s?: BusinessSettings,
  now: Date = new Date(),
): boolean {
  const { rescheduleCutoffHours, maxReschedules } = pickSettings(s).booking;
  if (maxReschedules > 0 && (booking.rescheduleCount ?? 0) >= maxReschedules) return false;
  const hours = hoursUntilVisit(booking.schedule, now);
  return rescheduleCutoffHours <= 0 || hours === undefined || hours >= rescheduleCutoffHours;
}

/** Customer may still cancel: outside `booking.cancelCutoffHours` of the visit (0 = until work starts). */
export function canCancelVisit(
  booking: { schedule?: { date?: string; slot?: string; time?: string } | null },
  s?: BusinessSettings,
  now: Date = new Date(),
): boolean {
  const { cancelCutoffHours } = pickSettings(s).booking;
  const hours = hoursUntilVisit(booking.schedule, now);
  return cancelCutoffHours <= 0 || hours === undefined || hours >= cancelCutoffHours;
}
