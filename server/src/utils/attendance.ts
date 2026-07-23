import { Types } from 'mongoose';
import { IBooking } from '../models/Booking';
import {
  ITechnicianAttendance,
  TechnicianAttendance,
} from '../models/TechnicianAttendance';
import { eachDateInRange, localDateKey } from './dateKey';

export type DayAttendanceStatus = 'came' | 'not_came' | 'pending' | 'future' | 'leave';

export function todayDateKey(): string {
  return localDateKey();
}

export function monthRange(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return {
    from: `${y}-${mm}-01`,
    to: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function parseMonthParam(month?: string): string {
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  return todayDateKey().slice(0, 7);
}

export function resolveDayStatus(
  date: string,
  record: ITechnicianAttendance | undefined,
  today: string,
): DayAttendanceStatus {
  if (record?.status === 'leave') return 'leave';
  if (record?.status === 'present') return 'came';
  if (record?.status === 'absent') return 'not_came';
  if (date > today) return 'future';
  if (date === today) return 'pending';
  return 'not_came';
}

export function buildAttendanceCalendar(
  records: ITechnicianAttendance[],
  from: string,
  to: string,
  today: string = todayDateKey(),
): Record<string, DayAttendanceStatus> {
  const map = new Map(records.map((r) => [r.date, r]));
  const calendar: Record<string, DayAttendanceStatus> = {};
  for (const date of eachDateInRange(from, to)) {
    const record = map.get(date);
    // Past days with no record stay unmarked — do not inflate "absent".
    if (!record && date < today) continue;
    calendar[date] = resolveDayStatus(date, record, today);
  }
  return calendar;
}

export function computeAttendanceAnalytics(
  calendar: Record<string, DayAttendanceStatus>,
  today: string = todayDateKey(),
): {
  daysPresent: number;
  daysAbsent: number;
  daysLeave: number;
  daysPending: number;
  attendanceRate: number;
} {
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let daysPending = 0;

  for (const [date, status] of Object.entries(calendar)) {
    if (date > today) continue;
    if (status === 'came') daysPresent += 1;
    else if (status === 'leave') daysLeave += 1;
    else if (status === 'not_came') daysAbsent += 1;
    else if (status === 'pending') daysPending += 1;
  }

  const attendanceRate =
    daysPresent + daysAbsent > 0
      ? Math.round((daysPresent / (daysPresent + daysAbsent)) * 100)
      : 0;

  return { daysPresent, daysAbsent, daysLeave, daysPending, attendanceRate };
}

function bookingInMonth(booking: IBooking, month: string): boolean {
  const date = booking.schedule?.date ?? '';
  return date.startsWith(`${month}-`);
}

export function computeJobAnalytics(
  bookings: IBooking[],
  month?: string,
): {
  jobsScheduled: number;
  jobsCompleted: number;
  completionRate: number;
} {
  const scoped = month ? bookings.filter((b) => bookingInMonth(b, month)) : bookings;
  const active = scoped.filter((b) => !['cancelled'].includes(b.status));
  const jobsScheduled = active.length;
  const jobsCompleted = scoped.filter((b) => b.status === 'completed').length;
  const completionRate =
    jobsScheduled > 0 ? Math.round((jobsCompleted / jobsScheduled) * 100) : 0;
  return { jobsScheduled, jobsCompleted, completionRate };
}

export async function loadAttendanceForRange(
  technicianId: Types.ObjectId | string,
  from: string,
  to: string,
): Promise<ITechnicianAttendance[]> {
  return TechnicianAttendance.find({
    technicianId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });
}

/**
 * Upsert day attendance.
 * - present: keeps first checkedInAt; clears checkedOutAt when coming back on duty
 * - absent/leave: sets status; optional note
 */
export async function upsertAttendance(
  technicianId: Types.ObjectId,
  date: string,
  status: 'present' | 'absent' | 'leave',
  source: 'technician' | 'admin' | 'system',
  note?: string,
): Promise<ITechnicianAttendance> {
  const existing = await TechnicianAttendance.findOne({ technicianId, date });
  const now = new Date();

  if (existing) {
    // Technicians cannot override approved leave via check-in / self-absent.
    if (existing.status === 'leave' && source === 'technician' && status !== 'leave') {
      throw new Error('On approved leave');
    }
    existing.status = status;
    existing.source = source;
    if (note !== undefined) existing.note = note;
    if (status === 'present') {
      if (!existing.checkedInAt) existing.checkedInAt = now;
      existing.checkedOutAt = undefined;
    } else if (!existing.checkedInAt) {
      existing.checkedInAt = now;
    }
    await existing.save();
    return existing;
  }

  return TechnicianAttendance.create({
    technicianId,
    date,
    status,
    checkedInAt: now,
    source,
    ...(note !== undefined ? { note } : {}),
  });
}

/** End duty for today without marking the day absent. */
export async function checkOutAttendance(
  technicianId: Types.ObjectId,
  date: string,
): Promise<ITechnicianAttendance> {
  const record = await TechnicianAttendance.findOne({ technicianId, date });
  if (!record || record.status !== 'present') {
    throw new Error('Check in before checking out');
  }
  record.checkedOutAt = new Date();
  await record.save();
  return record;
}

/** Mark a date range as leave (approved). */
export async function markLeaveRange(
  technicianId: Types.ObjectId,
  from: string,
  to: string,
  note?: string,
): Promise<void> {
  for (const date of eachDateInRange(from, to)) {
    await upsertAttendance(technicianId, date, 'leave', 'system', note);
  }
}

/** Attendance date range for admin reports period selector. */
export function periodAttendanceRange(period: 'week' | 'month' | 'quarter' | 'year'): {
  from: string;
  to: string;
  month: string;
} {
  const today = todayDateKey();
  const now = new Date();
  const month = parseMonthParam();

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: localDateKey(start), to: today, month };
  }
  if (period === 'month') {
    const { from, to } = monthRange(month);
    return { from, to, month };
  }
  if (period === 'quarter') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { from: localDateKey(start), to: today, month };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  return { from: localDateKey(start), to: today, month };
}
