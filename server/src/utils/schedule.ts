import { AppError } from './AppError';
import type { ScheduleMode } from '../models/Booking';

export const BOOKING_SLOTS = ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'] as const;

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

function parseMinutes(time: string): number {
  const m = TIME_RE.exec(time);
  if (!m) throw new AppError(400, 'Invalid time format (use HH:mm)');
  return parseInt(m[1]!, 10) * 60 + parseInt(m[2]!, 10);
}

export function validateDateKey(date: string): void {
  if (!DATE_RE.test(date)) {
    throw new AppError(400, 'Invalid date (use YYYY-MM-DD)');
  }
}

export function validateTimeHHmm(time: string): void {
  if (!TIME_RE.test(time)) {
    throw new AppError(400, 'Invalid time format (use HH:mm)');
  }
  const mins = parseMinutes(time);
  const minAllowed = 8 * 60;
  const maxAllowed = 20 * 60;
  if (mins < minAllowed || mins > maxAllowed) {
    throw new AppError(400, 'Time must be between 08:00 and 20:00');
  }
}

export function validateScheduleRequest(mode: ScheduleMode, req: ScheduleRequestInput): void {
  validateDateKey(req.date);
  if (mode === 'standard') {
    if (!req.slot || !BOOKING_SLOTS.includes(req.slot as (typeof BOOKING_SLOTS)[number])) {
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
  if (!BOOKING_SLOTS.includes(schedule.slot as (typeof BOOKING_SLOTS)[number])) {
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
