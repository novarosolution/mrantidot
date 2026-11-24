/**
 * Admin operations: activity log, broadcasts and people search.
 * Server: routes/activity.routes.ts, routes/broadcast.routes.ts, routes/admin.routes.ts (user-search).
 */
import type { NotificationLink, UserRole } from './api';

/* ─── Activity log ─────────────────────────────────────────────────────── */

export type ActivityArea =
  | 'bookings'
  | 'users'
  | 'services'
  | 'offers'
  | 'reviews'
  | 'settings'
  | 'content'
  | 'website'
  | 'leave'
  | 'attendance'
  | 'payroll'
  | 'broadcast'
  | 'other';

/** One admin change. `fields` are field names only — values are never stored. */
export interface ActivityEntry {
  id: string;
  actor: { id: string; name: string };
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  /** Route pattern, e.g. "/bookings/:id/cancel". */
  route: string;
  area: ActivityArea;
  targetId?: string;
  /** booking, user, service, offer, review, blog, broadcast… */
  targetType?: string;
  /** "#A1B2C3", "Ravi Kumar"… */
  targetLabel?: string;
  summary: string;
  fields: string[];
  /** ISO time. */
  at: string;
}

export interface ActivityCursor {
  before: string;
  beforeId: string;
}

/** `GET /admin/activity?actor&area&from&to&q&limit&before&beforeId` */
export interface ActivityListResponse {
  entries: ActivityEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor: ActivityCursor | null;
}

/** `GET /admin/activity/actors` — admins who appear in the log. */
export interface ActivityActor {
  id: string;
  name: string;
  count: number;
  lastAt?: string;
}

/* ─── Broadcast ────────────────────────────────────────────────────────── */

export type BroadcastAudience = 'customers' | 'technicians' | 'everyone' | 'user';

export type BroadcastLinkKind = 'none' | 'service' | 'offers' | 'url';

/** What the admin sends with a broadcast (`kind: 'none'` = no link). */
export interface BroadcastLinkInput {
  kind: BroadcastLinkKind;
  serviceId?: string;
  url?: string;
}

export interface BroadcastInput {
  audience: BroadcastAudience;
  userId?: string;
  title: string;
  body: string;
  link?: BroadcastLinkInput;
}

export interface BroadcastRecord {
  id: string;
  sender: { id: string; name: string };
  audience: BroadcastAudience;
  /** Set when `audience` is 'user'. */
  user?: { id: string; name: string };
  title: string;
  body: string;
  link?: NotificationLink;
  recipientCount: number;
  /** Recipients who have opened it. */
  readCount: number;
  createdAt: string;
}

/** `GET /admin/broadcast?page&limit` */
export interface BroadcastListResponse {
  broadcasts: BroadcastRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** `GET /admin/broadcast/preview?audience&userId` — how many people a send would reach. */
export interface BroadcastPreview {
  audience: BroadcastAudience;
  count: number;
  user?: { id: string; name: string; role: UserRole };
}

/** Limits enforced by the server (keep in sync with routes/broadcast.routes.ts). */
export const BROADCAST_TITLE_MAX = 80;
export const BROADCAST_BODY_MAX = 300;
export const BROADCASTS_PER_HOUR = 5;

/* ─── People search ────────────────────────────────────────────────────── */

/** `GET /admin/user-search?q&role&limit` row. */
export interface AdminUserSearchResult {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  city?: string;
  disabled: boolean;
}

/* ─── Booking ops ──────────────────────────────────────────────────────── */

/** Booking notes and cancel reasons (server limits). */
export const BOOKING_NOTE_MAX = 1000;
export const CANCEL_REASON_MIN = 3;
export const CANCEL_REASON_MAX = 300;
export const PAYMENT_REF_MAX = 120;
