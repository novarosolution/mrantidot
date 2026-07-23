import { IBooking } from '../models/Booking';
import { todayDateKey } from './attendance';

export type JobVisitStatus =
  | 'completed'
  | 'in_progress'
  | 'no_show'
  | 'scheduled'
  | 'cancelled';

export type Punctuality = 'on_time' | 'late' | 'early' | 'unknown';

export interface JobVisitSummary {
  bookingId: string;
  date: string;
  slot: string;
  status: JobVisitStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  /** Minutes after expected window start when work began (negative = early). */
  startDeltaMinutes?: number;
  punctuality: Punctuality;
  onTime: boolean;
}

export interface JobVisitAnalytics {
  jobsStarted: number;
  jobsNoShow: number;
  avgVisitMinutes: number;
  jobsOnTime: number;
  jobsLate: number;
  onTimeRate: number;
}

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Expected work-start window from schedule slot ("09:00-11:00") or custom time ("14:30"). */
export function expectedStartBounds(
  schedule?: { date?: string; slot?: string; time?: string } | null,
): { start: Date; end: Date } | null {
  const date = schedule?.date?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const custom = schedule?.time?.trim();
  if (custom && /^\d{1,2}:\d{2}$/.test(custom)) {
    const [h, m] = custom.split(':').map(Number);
    const start = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }

  const slot = schedule?.slot?.trim() ?? '';
  const m = slot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const start = new Date(
    `${date}T${String(Number(m[1])).padStart(2, '0')}:${m[2]}:00`,
  );
  let end = new Date(
    `${date}T${String(Number(m[3])).padStart(2, '0')}:${m[4]}:00`,
  );
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  // Overnight window e.g. 22:00-00:00
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

/** Grace: on-time if started within 15 min after window opens (or anytime before end). */
const LATE_GRACE_MS = 15 * 60 * 1000;

export function evaluatePunctuality(
  booking: IBooking,
): { punctuality: Punctuality; onTime: boolean; startDeltaMinutes?: number } {
  if (!booking.workStartedAt) {
    return { punctuality: 'unknown', onTime: false };
  }
  const bounds = expectedStartBounds(booking.schedule);
  if (!bounds) return { punctuality: 'unknown', onTime: false };

  const started = booking.workStartedAt instanceof Date
    ? booking.workStartedAt
    : new Date(booking.workStartedAt);
  if (Number.isNaN(started.getTime())) return { punctuality: 'unknown', onTime: false };

  const deltaMs = started.getTime() - bounds.start.getTime();
  const startDeltaMinutes = Math.round(deltaMs / 60000);

  if (started.getTime() <= bounds.start.getTime() + LATE_GRACE_MS) {
    const punctuality: Punctuality =
      started.getTime() < bounds.start.getTime() - 5 * 60 * 1000 ? 'early' : 'on_time';
    return { punctuality, onTime: true, startDeltaMinutes };
  }
  if (started.getTime() <= bounds.end.getTime()) {
    return { punctuality: 'late', onTime: false, startDeltaMinutes };
  }
  return { punctuality: 'late', onTime: false, startDeltaMinutes };
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
  const { punctuality, onTime, startDeltaMinutes } = evaluatePunctuality(booking);

  return {
    bookingId: booking._id.toString(),
    date: booking.schedule?.date ?? '',
    slot: booking.schedule?.slot ?? '',
    status: jobVisitStatus(booking, today),
    startedAt,
    completedAt,
    durationMinutes,
    startDeltaMinutes,
    punctuality,
    onTime,
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
  today: string = todayDateKey(),
  month?: string,
): JobVisitAnalytics {
  const scoped = month
    ? bookings.filter((b) => bookingInMonth(b, month))
    : bookings;

  let jobsStarted = 0;
  let jobsNoShow = 0;
  let totalMinutes = 0;
  let durationCount = 0;
  let jobsOnTime = 0;
  let jobsLate = 0;
  let punctualSamples = 0;

  for (const b of scoped) {
    if (b.workStartedAt) jobsStarted += 1;
    if (jobVisitStatus(b, today) === 'no_show') jobsNoShow += 1;
    if (b.workStartedAt && b.workCompletedAt) {
      totalMinutes += visitDurationMinutes(b.workStartedAt, b.workCompletedAt);
      durationCount += 1;
    }
    const { punctuality, onTime } = evaluatePunctuality(b);
    if (punctuality !== 'unknown') {
      punctualSamples += 1;
      if (onTime) jobsOnTime += 1;
      else if (punctuality === 'late') jobsLate += 1;
    }
  }

  return {
    jobsStarted,
    jobsNoShow,
    avgVisitMinutes: durationCount > 0 ? Math.round(totalMinutes / durationCount) : 0,
    jobsOnTime,
    jobsLate,
    onTimeRate: punctualSamples > 0 ? Math.round((jobsOnTime / punctualSamples) * 100) : 0,
  };
}
