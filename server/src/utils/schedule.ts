import { AppError } from './AppError';
import type { ScheduleMode } from '../models/Booking';

/** 2-hour windows covering the full day — app takes bookings 24/7. */
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

/** Older windows still accepted for existing bookings. */
const LEGACY_BOOKING_SLOTS = ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'] as const;

function isAllowedSlot(slot: string): boolean {
  return (
    (BOOKING_SLOTS as readonly string[]).includes(slot) ||
    (LEGACY_BOOKING_SLOTS as readonly string[]).includes(slot)
  );
}

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

export function validateDateKey(date: string): void {
  if (!DATE_RE.test(date)) {
    throw new AppError(400, 'Invalid date (use YYYY-MM-DD)');
  }
}

export function validateTimeHHmm(time: string): void {
  if (!TIME_RE.test(time)) {
    throw new AppError(400, 'Invalid time format (use HH:mm)');
  }
  // 24/7 — any valid HH:mm is allowed
}

export function validateScheduleRequest(mode: ScheduleMode, req: ScheduleRequestInput): void {
  validateDateKey(req.date);
  if (mode === 'standard') {
    if (!req.slot || !isAllowedSlot(req.slot)) {
      throw new AppError(400, 'Invalid or missing time slot');
    }
    return;
  }
  if (!req.time) {
    throw new AppError(400, 'Preferred time is required for custom schedule');
  }
  validateTimeHHmm(req.time);
}

export function validateConfirmedSchedule(schedule: BookingScheduleInput): ScheduleMode {
  validateDateKey(schedule.date);
  if (schedule.slot === 'custom') {
    if (!schedule.time) {
      throw new AppError(400, 'Time is required for custom schedule');
    }
    validateTimeHHmm(schedule.time);
    return 'custom';
  }
  if (!isAllowedSlot(schedule.slot)) {
    throw new AppError(400, 'Invalid time slot');
  }
  return 'standard';
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
