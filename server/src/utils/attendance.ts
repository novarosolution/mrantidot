import { Types } from 'mongoose';
import { IBooking } from '../models/Booking';
import {
  ITechnicianAttendance,
  TechnicianAttendance,
} from '../models/TechnicianAttendance';
import { eachDateInRange, localDateKey } from './dateKey';

export type DayAttendanceStatus = 'came' | 'not_came' | 'pending' | 'future';

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
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function resolveDayStatus(
  date: string,
  record: ITechnicianAttendance | undefined,
  today: string,
): DayAttendanceStatus {
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
    calendar[date] = resolveDayStatus(date, map.get(date), today);
  }
  return calendar;
}

export function computeAttendanceAnalytics(
  calendar: Record<string, DayAttendanceStatus>,
  today: string = todayDateKey(),
): {
  daysPresent: number;
  daysAbsent: number;
  daysPending: number;
  attendanceRate: number;
} {
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysPending = 0;

  for (const [date, status] of Object.entries(calendar)) {
    if (date > today) continue;
    if (status === 'came') daysPresent += 1;
    else if (status === 'not_came') daysAbsent += 1;
    else if (status === 'pending') daysPending += 1;
  }

  const attendanceRate =
    daysPresent + daysAbsent > 0
      ? Math.round((daysPresent / (daysPresent + daysAbsent)) * 100)
      : 0;

  return { daysPresent, daysAbsent, daysPending, attendanceRate };
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

export async function upsertAttendance(
  technicianId: Types.ObjectId,
  date: string,
  status: 'present' | 'absent',
  source: 'technician' | 'admin',
  note?: string,
): Promise<ITechnicianAttendance> {
  const record = await TechnicianAttendance.findOneAndUpdate(
    { technicianId, date },
    {
      $set: {
        status,
        checkedInAt: new Date(),
        source,
        ...(note !== undefined ? { note } : {}),
      },
    },
    { upsert: true, new: true },
  );
  return record;
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
