import type { Booking, JobVisitStatus } from '@/types/api';

const VISIT_LABELS: Record<JobVisitStatus, string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  no_show: 'No show',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
};

export function visitStatusLabel(status: JobVisitStatus): string {
  return VISIT_LABELS[status] ?? status;
}

export function jobVisitStatus(booking: Booking, today: string): JobVisitStatus {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.workCompletedAt) return 'completed';
  if (booking.workStartedAt) return 'in_progress';
  const date = booking.schedule?.date ?? '';
  if (date && date < today && booking.status === 'confirmed') return 'no_show';
  return 'scheduled';
}

export function formatVisitTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatVisitTimeShort(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function visitDurationMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatBookingDuration(booking: Booking): string | null {
  if (!booking.workStartedAt || !booking.workCompletedAt) return null;
  return formatDuration(visitDurationMinutes(booking.workStartedAt, booking.workCompletedAt));
}

export function jobVisitHint(booking: Booking, today: string): string {
  const status = jobVisitStatus(booking, today);
  if (status === 'completed' && booking.workStartedAt && booking.workCompletedAt) {
    const dur = formatBookingDuration(booking);
    return `Started ${formatVisitTimeShort(booking.workStartedAt)} · Stopped ${formatVisitTimeShort(booking.workCompletedAt)}${dur ? ` · ${dur}` : ''}`;
  }
  if (status === 'in_progress' && booking.workStartedAt) {
    return `Started ${formatVisitTimeShort(booking.workStartedAt)} · In progress`;
  }
  if (status === 'no_show') return 'Did not come to job';
  if (status === 'scheduled') return 'Not started yet';
  return visitStatusLabel(status);
}

export function visitBadgeTone(status: JobVisitStatus): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'no_show':
      return 'danger';
    case 'scheduled':
      return 'warning';
    default:
      return 'neutral';
  }
}
