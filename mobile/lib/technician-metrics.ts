import type { TechnicianDetailResponse, TechnicianMetricKey } from '@/types/api';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
  bookingStatusLabel,
} from '@/lib/booking-helpers';
import { formatDuration } from '@/lib/job-visit-helpers';
import type { MetricDetailRow } from '@/components/kit/MetricDetailSheet';

const STATUS_KEYS: Record<string, TechnicianMetricKey> = {
  pending: 'status_pending',
  confirmed: 'status_confirmed',
  in_progress: 'status_in_progress',
  awaiting_verification: 'status_awaiting_verification',
  completed: 'status_completed',
  cancelled: 'status_cancelled',
};

export function metricSheetMeta(
  key: TechnicianMetricKey,
  detail: TechnicianDetailResponse,
  weekIndex?: number,
): { title: string; message?: string; actionLabel?: string; listStatus?: string } {
  const month = detail.month ?? new Date().toISOString().slice(0, 7);
  const analytics = detail.analytics;

  switch (key) {
    case 'attendance_rate':
      return {
        title: 'Attendance rate',
        message: `${analytics?.attendanceRate ?? 0}% for ${month}`,
      };
    case 'days_present':
      return { title: 'Days came', message: `Present days in ${month}` };
    case 'days_absent':
      return { title: 'Did not come', message: `Absent days in ${month}` };
    case 'completion_rate':
      return {
        title: 'Job completion',
        message: `${analytics?.completionRate ?? 0}% of scheduled jobs completed in ${month}`,
      };
    case 'jobs_started':
      return { title: 'Jobs started', message: `Work started in ${month}` };
    case 'jobs_completed':
      return { title: 'Jobs completed', message: `Completed in ${month}` };
    case 'jobs_no_show':
      return { title: 'No-shows', message: `Confirmed but not started past schedule date` };
    case 'avg_visit':
      return { title: 'Average visit duration', message: `Completed visits in ${month}` };
    case 'pending_global':
      return {
        title: 'Pending schedule queue',
        message: 'System-wide bookings awaiting admin schedule confirmation',
        actionLabel: 'View all pending',
      };
    case 'active':
      return {
        title: 'Active jobs',
        message: 'Confirmed, in progress, or awaiting verification',
        actionLabel: 'View in list',
        listStatus: 'active',
      };
    case 'in_progress':
      return {
        title: 'In progress',
        message: 'Jobs currently being worked on',
        actionLabel: 'View in list',
        listStatus: 'in_progress',
      };
    case 'verify':
      return {
        title: 'Awaiting verification',
        message: 'Jobs pending OTP verification',
        actionLabel: 'View in list',
        listStatus: 'awaiting_verification',
      };
    case 'completed':
      return {
        title: 'Completed jobs',
        message: `All completed jobs for ${detail.technician.name}`,
        actionLabel: 'View in list',
        listStatus: 'completed',
      };
    case 'earnings':
      return {
        title: 'Earnings',
        message: `₹${detail.stats.earnings} from completed jobs`,
        actionLabel: 'View completed jobs',
        listStatus: 'completed',
      };
    case 'week_jobs': {
      const bucket = detail.jobsTrend?.[weekIndex ?? 0];
      return {
        title: `Jobs — ${bucket?.label ?? 'Week'}`,
        message: `${bucket?.completed ?? 0} completed in this week`,
      };
    }
    case 'week_earnings': {
      const bucket = detail.jobsTrend?.[weekIndex ?? 0];
      return {
        title: `Earnings — ${bucket?.label ?? 'Week'}`,
        message: `₹${bucket?.earnings ?? 0} earned this week`,
      };
    }
    case 'week_attendance': {
      const bucket = detail.attendanceTrend?.[weekIndex ?? 0];
      return {
        title: `Attendance — ${bucket?.label ?? 'Week'}`,
        message: `${bucket?.present ?? 0} present · ${bucket?.absent ?? 0} absent`,
      };
    }
    default:
      if (key.startsWith('status_')) {
        const status = key.replace('status_', '');
        return {
          title: bookingStatusLabel(status as never),
          message: `This technician's ${status.replace(/_/g, ' ')} bookings`,
          actionLabel: 'View in list',
          listStatus: status,
        };
      }
      return { title: 'Details' };
  }
}

function bookingsInWeek(
  detail: TechnicianDetailResponse,
  weekIndex: number,
  filter?: (b: (typeof detail.bookings)[0]) => boolean,
) {
  const month = detail.month ?? new Date().toISOString().slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${month}-01`;
  const to = `${month}-${String(lastDay).padStart(2, '0')}`;
  const dates: string[] = [];
  const cur = new Date(y, m - 1, 1);
  const end = new Date(y, m - 1, lastDay);
  while (cur <= end) {
    const dk = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    dates.push(dk);
    cur.setDate(cur.getDate() + 1);
  }
  const chunk = dates.slice(weekIndex * 7, weekIndex * 7 + 7);
  if (chunk.length === 0) return [];
  const weekFrom = chunk[0];
  const weekTo = chunk[chunk.length - 1];

  return detail.bookings.filter((b) => {
    const date = b.schedule?.date ?? '';
    if (!date || date < weekFrom || date > weekTo) return false;
    return filter ? filter(b) : true;
  });
}

export function buildMetricDetailRows(
  key: TechnicianMetricKey,
  detail: TechnicianDetailResponse,
  weekIndex?: number,
  onBookingPress?: (id: string) => void,
): MetricDetailRow[] {
  const month = detail.month ?? new Date().toISOString().slice(0, 7);
  const attendance = detail.attendance ?? {};
  const today = new Date().toISOString().slice(0, 10);

  const bookingRow = (b: (typeof detail.bookings)[0]): MetricDetailRow => ({
    key: b.id,
    title: bookingServiceName(b),
    subtitle: bookingCustomerName(b),
    meta: bookingScheduleDisplay(b),
    onPress: onBookingPress ? () => onBookingPress(b.id) : undefined,
  });

  switch (key) {
    case 'days_present':
      return Object.entries(attendance)
        .filter(([date, status]) => date <= today && status === 'came')
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date]) => ({
          key: date,
          title: date,
          subtitle: 'Present',
          meta: 'Marked as came',
        }));
    case 'days_absent':
      return Object.entries(attendance)
        .filter(([date, status]) => date <= today && status === 'not_came')
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date]) => ({
          key: date,
          title: date,
          subtitle: 'Absent',
          meta: 'Did not come',
        }));
    case 'week_attendance': {
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const dates: string[] = [];
      for (let d = 1; d <= lastDay; d++) {
        dates.push(`${month}-${String(d).padStart(2, '0')}`);
      }
      const chunk = dates.slice((weekIndex ?? 0) * 7, (weekIndex ?? 0) * 7 + 7);
      return chunk
        .filter((date) => date <= today && attendance[date] && attendance[date] !== 'future')
        .sort((a, b) => b.localeCompare(a))
        .map((date) => ({
          key: date,
          title: date,
          subtitle:
            attendance[date] === 'came'
              ? 'Present'
              : attendance[date] === 'not_came'
                ? 'Absent'
                : 'Pending',
        }));
    }
    case 'jobs_started':
      return detail.bookings
        .filter((b) => b.schedule?.date?.startsWith(`${month}-`) && b.workStartedAt)
        .map(bookingRow);
    case 'jobs_completed':
    case 'completed':
      return detail.bookings.filter((b) => b.status === 'completed').map(bookingRow);
    case 'jobs_no_show':
      return (detail.jobVisits ?? [])
        .filter((v) => v.status === 'no_show')
        .map((v) => {
          const b = detail.bookings.find((x) => x.id === v.bookingId);
          return b
            ? bookingRow(b)
            : { key: v.bookingId, title: v.date, subtitle: 'No-show', meta: v.slot };
        });
    case 'avg_visit':
      return (detail.jobVisits ?? [])
        .filter((v) => v.durationMinutes != null && v.durationMinutes > 0)
        .map((v) => {
          const b = detail.bookings.find((x) => x.id === v.bookingId);
          return {
            key: v.bookingId,
            title: b ? bookingServiceName(b) : v.date,
            subtitle: b ? bookingCustomerName(b) : v.slot,
            meta: formatDuration(v.durationMinutes!),
            onPress: onBookingPress ? () => onBookingPress(v.bookingId) : undefined,
          };
        });
    case 'pending_global':
      return (detail.globalPending?.bookings ?? []).map(bookingRow);
    case 'active':
      return detail.bookings
        .filter((b) => ['confirmed', 'in_progress', 'awaiting_verification'].includes(b.status))
        .map(bookingRow);
    case 'in_progress':
      return detail.bookings.filter((b) => b.status === 'in_progress').map(bookingRow);
    case 'verify':
      return detail.bookings.filter((b) => b.status === 'awaiting_verification').map(bookingRow);
    case 'earnings':
      return detail.bookings.filter((b) => b.status === 'completed').map((b) => ({
        ...bookingRow(b),
        meta: `₹${b.amount?.total ?? b.jobValue ?? 0}`,
      }));
    case 'week_jobs':
      return bookingsInWeek(detail, weekIndex ?? 0, (b) => b.status === 'completed').map(bookingRow);
    case 'week_earnings':
      return bookingsInWeek(detail, weekIndex ?? 0, (b) => b.status === 'completed').map((b) => ({
        ...bookingRow(b),
        meta: `₹${b.amount?.total ?? b.jobValue ?? 0}`,
      }));
    default:
      if (key.startsWith('status_')) {
        const status = key.replace('status_', '');
        return detail.bookings.filter((b) => b.status === status).map(bookingRow);
      }
      return [];
  }
}

export function statusKeyToMetric(status: string): TechnicianMetricKey {
  return STATUS_KEYS[status] ?? 'status_confirmed';
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en', { month: 'long', year: 'numeric' });
}
