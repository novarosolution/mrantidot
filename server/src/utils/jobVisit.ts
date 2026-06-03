import { IBooking } from '../models/Booking';

export type JobVisitStatus =
  | 'completed'
  | 'in_progress'
  | 'no_show'
  | 'scheduled'
  | 'cancelled';

export interface JobVisitSummary {
  bookingId: string;
  date: string;
  slot: string;
  status: JobVisitStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
}

export interface JobVisitAnalytics {
  jobsStarted: number;
  jobsNoShow: number;
  avgVisitMinutes: number;
}

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function jobVisitStatus(booking: IBooking, today: string): JobVisitStatus {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.workCompletedAt) return 'completed';
  if (booking.workStartedAt) return 'in_progress';
  const date = booking.schedule?.date ?? '';
  if (date && date < today && booking.status === 'confirmed') return 'no_show';
  return 'scheduled';
}

export function visitDurationMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function formatVisitDuration(start: Date, end: Date): string {
  const mins = visitDurationMinutes(start, end);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function bookingInMonth(booking: IBooking, month: string): boolean {
  const date = booking.schedule?.date ?? '';
  return date.startsWith(`${month}-`);
}

export function buildJobVisitSummary(booking: IBooking, today: string): JobVisitSummary {
  const startedAt = isoDate(booking.workStartedAt);
  const completedAt = isoDate(booking.workCompletedAt);
  let durationMinutes: number | undefined;
  if (booking.workStartedAt && booking.workCompletedAt) {
    durationMinutes = visitDurationMinutes(booking.workStartedAt, booking.workCompletedAt);
  }

  return {
    bookingId: booking._id.toString(),
    date: booking.schedule?.date ?? '',
    slot: booking.schedule?.slot ?? '',
    status: jobVisitStatus(booking, today),
    startedAt,
    completedAt,
    durationMinutes,
  };
}

export function buildJobVisitsForBookings(
  bookings: IBooking[],
  today: string,
  month?: string,
): JobVisitSummary[] {
  const scoped = month
    ? bookings.filter((b) => bookingInMonth(b, month))
    : bookings;
  return scoped
    .map((b) => buildJobVisitSummary(b, today))
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.slot.localeCompare(b.slot);
    });
}

export function computeJobVisitAnalytics(
  bookings: IBooking[],
  today: string,
  month?: string,
): JobVisitAnalytics {
  const scoped = month
    ? bookings.filter((b) => bookingInMonth(b, month))
    : bookings;

  let jobsStarted = 0;
  let jobsNoShow = 0;
  let totalMinutes = 0;
  let durationCount = 0;

  for (const b of scoped) {
    if (b.workStartedAt) jobsStarted += 1;
    if (jobVisitStatus(b, today) === 'no_show') jobsNoShow += 1;
    if (b.workStartedAt && b.workCompletedAt) {
      totalMinutes += visitDurationMinutes(b.workStartedAt, b.workCompletedAt);
      durationCount += 1;
    }
  }

  return {
    jobsStarted,
    jobsNoShow,
    avgVisitMinutes: durationCount > 0 ? Math.round(totalMinutes / durationCount) : 0,
  };
}
