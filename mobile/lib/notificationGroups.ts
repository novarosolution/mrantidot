import type { AppNotification, CustomerUiCopy } from '@/types/api';
import { localDateKey } from '@/lib/dates';
import { DEFAULT_CUSTOMER_UI_COPY } from '@/constants/customerUiCopy';

type GroupCopy = Pick<CustomerUiCopy, 'notifGroupToday' | 'notifGroupYesterday' | 'notifGroupWeek' | 'notifGroupEarlier'>;

export type NotificationSection = { key: string; title: string; data: AppNotification[] };

const DAY_MS = 864e5;

/** Bucket notifications (newest first) into Today / Yesterday / This week / Earlier (admin-editable names). */
export function groupNotificationsByDay(
  items: AppNotification[],
  now: Date = new Date(),
  copy: GroupCopy = DEFAULT_CUSTOMER_UI_COPY,
): NotificationSection[] {
  const today = localDateKey(now);
  const yesterday = localDateKey(new Date(now.getTime() - DAY_MS));
  const weekAgo = localDateKey(new Date(now.getTime() - 6 * DAY_MS));

  const buckets: Record<string, NotificationSection> = {
    today: { key: 'today', title: copy.notifGroupToday, data: [] },
    yesterday: { key: 'yesterday', title: copy.notifGroupYesterday, data: [] },
    week: { key: 'week', title: copy.notifGroupWeek, data: [] },
    earlier: { key: 'earlier', title: copy.notifGroupEarlier, data: [] },
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
