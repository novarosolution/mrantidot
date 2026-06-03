import { IBooking } from '../models/Booking';
import { DayAttendanceStatus, monthRange } from './attendance';
import { eachDateInRange } from './dateKey';

export const TECH_PIPELINE_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
  'cancelled',
] as const;

export interface WeekBucket {
  label: string;
  from: string;
  to: string;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  periodCount: number;
}

export interface AttendanceTrendBucket {
  label: string;
  present: number;
  absent: number;
}

export interface JobsTrendBucket {
  label: string;
  completed: number;
  earnings: number;
}

export function weeklyBucketsInMonth(month: string): WeekBucket[] {
  const { from, to } = monthRange(month);
  const dates = eachDateInRange(from, to);
  const buckets: WeekBucket[] = [];

  for (let i = 0; i < dates.length; i += 7) {
    const chunk = dates.slice(i, i + 7);
    if (chunk.length === 0) continue;
    buckets.push({
      label: `W${buckets.length + 1}`,
      from: chunk[0],
      to: chunk[chunk.length - 1],
    });
  }

  return buckets;
}

export function computeTechStatusBreakdown(
  bookings: IBooking[],
  month: string,
): StatusBreakdownItem[] {
  const byStatus: Record<string, number> = {};
  const periodByStatus: Record<string, number> = {};

  for (const b of bookings) {
    const status = b.status;
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const date = b.schedule?.date ?? '';
    if (date.startsWith(`${month}-`)) {
      periodByStatus[status] = (periodByStatus[status] ?? 0) + 1;
    }
  }

  return TECH_PIPELINE_STATUSES.map((status) => ({
    status,
    count: byStatus[status] ?? 0,
    periodCount: periodByStatus[status] ?? 0,
  }));
}

export function buildAttendanceTrend(
  calendar: Record<string, DayAttendanceStatus>,
  month: string,
  today: string,
): AttendanceTrendBucket[] {
  return weeklyBucketsInMonth(month).map((bucket) => {
    let present = 0;
    let absent = 0;

    for (const date of eachDateInRange(bucket.from, bucket.to)) {
      if (date > today) continue;
      const status = calendar[date];
      if (status === 'came') present += 1;
      else if (status === 'not_came') absent += 1;
    }

    return { label: bucket.label, present, absent };
  });
}

export function buildJobsTrend(bookings: IBooking[], month: string): JobsTrendBucket[] {
  return weeklyBucketsInMonth(month).map((bucket) => {
    let completed = 0;
    let earnings = 0;

    for (const b of bookings) {
      const date = b.schedule?.date ?? '';
      if (!date || date < bucket.from || date > bucket.to) continue;
      if (b.status === 'completed') {
        completed += 1;
        earnings += b.amount?.total ?? 0;
      }
    }

    return { label: bucket.label, completed, earnings };
  });
}

export function monthDateRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
  };
}
