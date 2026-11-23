import { AppError } from './AppError';
import { localDateKey, localTimeHHmm } from './dateKey';
import type { ScheduleMode } from '../models/Booking';
import {
  customerText,
  durationText,
  getBusinessSettings,
  type BusinessSettings,
} from './businessSettings';

/**
 * Visit windows and the booking-time rules. Customers book against the admin's settings
 * (Business settings → Time slots / Booking rules); admin edits of existing bookings stay permissive
 * so old windows and custom times keep working.
 */

/** The built-in 2-hour windows (the default settings slots). The live list is `settings.slots`. */
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

export interface ScheduleRequestInput {
  date: string;
  slot?: string;
  time?: string;
  notes?: string;
}

export interface BookingScheduleInput {
  date: string;
  slot: string;
  time?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WINDOW_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

/** Admins may schedule this far ahead (the longest booking horizon an admin can set). */
const ADMIN_MAX_DAYS_AHEAD = 365;

export function validateDateKey(date: string): void {
  if (!DATE_RE.test(date)) {
    throw new AppError(400, 'Invalid date (use YYYY-MM-DD)');
  }
  const [y, m, d] = date.split('-').map(Number);
  if (new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) !== date) {
    throw new AppError(400, 'Invalid date');
  }
}

export function validateTimeHHmm(time: string): void {
  if (!TIME_RE.test(time)) {
    throw new AppError(400, 'Invalid time format (use HH:mm)');
  }
}

/** Any "HH:mm-HH:mm" window with different ends (old windows, admin-added windows, wraps past midnight). */
export function isWellFormedSlot(slot: string): boolean {
  if (!WINDOW_RE.test(slot)) return false;
  const [from, to] = slot.split('-');
  return from !== to;
}

/* ---------- business-timezone clock ---------- */

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Wall-clock minutes in the business timezone — differences are real minutes (IST has no DST). */
function wallMinutes(date: string, hhmm: string): number {
  const [h, mi] = hhmm.split(':').map(Number);
  return dayNumber(date) * 1440 + (h || 0) * 60 + (mi || 0);
}

/** Minutes from now until `date` at `hhmm` (business timezone); negative once it has passed. */
export function minutesUntil(date: string, hhmm: string): number {
  return wallMinutes(date, hhmm) - wallMinutes(localDateKey(), localTimeHHmm());
}

/** Start time (HH:mm) of a booking schedule — the slot start, or the custom time. */
export function scheduleStart(schedule: { slot?: string; time?: string } | undefined | null): string | undefined {
  if (!schedule) return undefined;
  if (schedule.slot && schedule.slot !== 'custom') return schedule.slot.split('-')[0];
  return schedule.time;
}

/** True when HH:mm falls inside the window (windows ending at 00:00 or crossing midnight included). */
function timeInWindow(time: string, from: string, to: string): boolean {
  if (from < to) return time >= from && time < to;
  return time >= from || time < to;
}

/* ---------- customer rules (create + reschedule) ---------- */

/**
 * Checks a customer's requested visit against the admin's rules:
 *  - the date is today or later and at most `booking.horizonDays` ahead;
 *  - a standard slot is one of the active settings windows; a custom time falls inside one;
 *  - the visit starts at least `booking.leadMinutes` from now (0 = any time that hasn't started).
 * Throws a 400 with a customer-facing message (admin-editable copy) and a `code`.
 */
export async function assertCustomerSchedule(
  mode: ScheduleMode,
  req: ScheduleRequestInput,
  settings?: BusinessSettings,
): Promise<void> {
  const s = settings ?? (await getBusinessSettings());
  validateDateKey(req.date);

  const today = localDateKey();
  if (req.date < today) {
    throw new AppError(400, 'Please pick today or a future date', 'DATE_PAST');
  }
  const horizon = s.booking.horizonDays;
  if (dayNumber(req.date) - dayNumber(today) > horizon) {
    throw new AppError(
      400,
      await customerText('cartDateTooFar', `Bookings open up to ${horizon} days ahead. Please pick an earlier date.`, { days: horizon }),
      'DATE_TOO_FAR',
    );
  }

  let start: string;
  if (mode === 'standard') {
    const window = s.slots.find((x) => x.active && x.key === req.slot);
    if (!window) {
      throw new AppError(400, await customerText('cartSlotUnavailable', 'That time isn’t open for booking. Please pick another slot.'), 'SLOT_UNAVAILABLE');
    }
    start = window.from;
  } else {
    if (!req.time) {
      throw new AppError(400, 'Preferred time is required for custom schedule');
    }
    validateTimeHHmm(req.time);
    const time = req.time;
    if (!s.slots.some((x) => x.active && timeInWindow(time, x.from, x.to))) {
      throw new AppError(400, await customerText('cartSlotUnavailable', 'That time isn’t open for booking. Please pick another slot.'), 'SLOT_UNAVAILABLE');
    }
    start = time;
  }

  const until = minutesUntil(req.date, start);
  if (until <= 0) {
    throw new AppError(400, 'That time has already passed — pick a later time', 'SLOT_PAST');
  }
  const lead = s.booking.leadMinutes;
  if (lead > 0 && until < lead) {
    const leadText = await durationText(lead);
    throw new AppError(
      400,
      await customerText('cartSlotTooSoon', `Please pick a time at least ${leadText} from now.`, { lead: leadText }),
      'SLOT_TOO_SOON',
    );
  }
}

/**
 * Customer reschedule limits: no move within `booking.rescheduleCutoffHours` of the current visit start
 * (0 = any time before work starts) and at most `booking.maxReschedules` moves (0 = unlimited).
 */
export async function assertCanReschedule(
  booking: { schedule?: { date?: string; slot?: string; time?: string } | null; rescheduleCount?: number },
  settings?: BusinessSettings,
): Promise<void> {
  const s = settings ?? (await getBusinessSettings());
  const max = s.booking.maxReschedules;
  if (max > 0 && (booking.rescheduleCount ?? 0) >= max) {
    throw new AppError(
      400,
      await customerText('bookingDetailRescheduleLimit', `You’ve used all reschedules for this visit (${max}). Please call us to change it.`, { count: max }),
      'RESCHEDULE_LIMIT',
    );
  }
  const cutoff = s.booking.rescheduleCutoffHours;
  const start = scheduleStart(booking.schedule);
  if (cutoff > 0 && booking.schedule?.date && start && TIME_RE.test(start)) {
    if (minutesUntil(booking.schedule.date, start) < cutoff * 60) {
      const window = await durationText(cutoff * 60);
      throw new AppError(
        400,
        await customerText('bookingDetailRescheduleCutoff', `Visits can’t be moved less than ${window} before they start. Please call us to change it.`, { window }),
        'RESCHEDULE_CUTOFF',
      );
    }
  }
}

/**
 * Customer cancel cut-off: no cancelling within `booking.cancelCutoffHours` of the visit start
 * (0 = any time before work starts). For the cancel route; admins are not limited.
 */
export async function assertCanCancel(
  booking: { schedule?: { date?: string; slot?: string; time?: string } | null },
  settings?: BusinessSettings,
): Promise<void> {
  const s = settings ?? (await getBusinessSettings());
  const cutoff = s.booking.cancelCutoffHours;
  const start = scheduleStart(booking.schedule);
  if (cutoff <= 0 || !booking.schedule?.date || !start || !TIME_RE.test(start)) return;
  if (minutesUntil(booking.schedule.date, start) < cutoff * 60) {
    const window = await durationText(cutoff * 60);
    throw new AppError(
      400,
      await customerText('bookingDetailCancelCutoff', `Visits can’t be cancelled less than ${window} before they start. Please call us to cancel.`, { window }),
      'CANCEL_CUTOFF',
    );
  }
}

/* ---------- admin rules (confirm / edit existing bookings) ---------- */

function assertAdminDate(date: string): void {
  const today = localDateKey();
  if (date < today) {
    throw new AppError(400, 'Please pick today or a future date');
  }
  if (dayNumber(date) - dayNumber(today) > ADMIN_MAX_DAYS_AHEAD) {
    throw new AppError(400, `Bookings can be made up to ${ADMIN_MAX_DAYS_AHEAD} days ahead`);
  }
}

/**
 * @deprecated Customer flows use `assertCustomerSchedule` (settings-aware). Kept for older callers:
 * date + window shape + "not started yet" only.
 */
export function validateScheduleRequest(mode: ScheduleMode, req: ScheduleRequestInput): void {
  validateDateKey(req.date);
  assertAdminDate(req.date);
  if (mode === 'standard') {
    if (!req.slot || !isWellFormedSlot(req.slot)) {
      throw new AppError(400, 'Invalid or missing time slot');
    }
    assertStartNotPast(req.date, req.slot.split('-')[0]);
    return;
  }
  if (!req.time) {
    throw new AppError(400, 'Preferred time is required for custom schedule');
  }
  validateTimeHHmm(req.time);
  assertStartNotPast(req.date, req.time);
}

/** Admin-confirmed schedule: a custom time, or any well-formed window (settings, legacy or admin-picked). */
export function validateConfirmedSchedule(schedule: BookingScheduleInput): ScheduleMode {
  validateDateKey(schedule.date);
  if (schedule.slot === 'custom') {
    if (!schedule.time) {
      throw new AppError(400, 'Time is required for custom schedule');
    }
    validateTimeHHmm(schedule.time);
    return 'custom';
  }
  if (!isWellFormedSlot(schedule.slot)) {
    throw new AppError(400, 'Invalid time slot');
  }
  return 'standard';
}

/** Rejects a start time (HH:mm) on `date` that has already passed in the business timezone. */
function assertStartNotPast(date: string, start: string | undefined): void {
  if (!start) return;
  if (minutesUntil(date, start) <= 0) {
    throw new AppError(400, 'That time has already passed — pick a later time');
  }
}

/** Admin confirm / reschedule must not land on a visit that has already started (business timezone). */
export function assertScheduleNotPast(schedule: BookingScheduleInput): void {
  assertAdminDate(schedule.date);
  assertStartNotPast(schedule.date, schedule.slot === 'custom' ? schedule.time : schedule.slot.split('-')[0]);
}

export function provisionalScheduleFromRequest(
  mode: ScheduleMode,
  req: ScheduleRequestInput,
): BookingScheduleInput {
  if (mode === 'custom') {
    return { date: req.date, slot: 'custom', time: req.time! };
  }
  return { date: req.date, slot: req.slot! };
}

export function formatScheduleSummary(schedule: BookingScheduleInput, mode?: ScheduleMode): string {
  if (mode === 'custom' || schedule.slot === 'custom') {
    return `${schedule.date} at ${schedule.time ?? '—'}`;
  }
  return `${schedule.date} · ${schedule.slot.replace('-', ' – ')}`;
}

/* ---------- friendly words for notifications ---------- */

function hour12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hr}:${String(m).padStart(2, '0')} ${suffix}` : `${hr} ${suffix}`;
}

/** {date} / {time} for message templates — "Tue, 24 Nov" and "10 AM – 12 PM" (or "10:30 AM"). */
export function scheduleWords(schedule: { date?: string; slot?: string; time?: string } | undefined | null): {
  date: string;
  time: string;
} {
  if (!schedule?.date) return { date: '', time: '' };
  let date = schedule.date;
  if (DATE_RE.test(schedule.date)) {
    const [y, m, d] = schedule.date.split('-').map(Number);
    date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  }
  let time = '';
  if (schedule.slot && schedule.slot !== 'custom' && schedule.slot.includes('-')) {
    const [from, to] = schedule.slot.split('-');
    time = `${hour12(from)} – ${hour12(to)}`;
  } else if (schedule.time) {
    time = hour12(schedule.time);
  }
  return { date, time };
}
