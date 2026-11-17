import type { AppNotification } from '@/types/api';
import { localDateKey } from '@/lib/dates';

export type NotificationSection = { key: string; title: string; data: AppNotification[] };

const DAY_MS = 864e5;

/** Bucket notifications (newest first) into Today / Yesterday / This week / Earlier. */
export function groupNotificationsByDay(items: AppNotification[], now: Date = new Date()): NotificationSection[] {
  const today = localDateKey(now);
  const yesterday = localDateKey(new Date(now.getTime() - DAY_MS));
  const weekAgo = localDateKey(new Date(now.getTime() - 6 * DAY_MS));

  const buckets: Record<string, NotificationSection> = {
    today: { key: 'today', title: 'Today', data: [] },
    yesterday: { key: 'yesterday', title: 'Yesterday', data: [] },
    week: { key: 'week', title: 'This week', data: [] },
    earlier: { key: 'earlier', title: 'Earlier', data: [] },
  };

  const sorted = [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  for (const n of sorted) {
    const day = n.createdAt ? localDateKey(new Date(n.createdAt)) : '';
    if (day === today) buckets.today!.data.push(n);
    else if (day === yesterday) buckets.yesterday!.data.push(n);
    else if (day && day >= weekAgo) buckets.week!.data.push(n);
    else buckets.earlier!.data.push(n);
  }
  return Object.values(buckets).filter((s) => s.data.length > 0);
}
