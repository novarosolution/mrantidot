/**
 * Admin operations: activity log, broadcasts, people search, booking order edits / reopen and payroll
 * payouts. Server: routes/activity.routes.ts, routes/broadcast.routes.ts, routes/admin.routes.ts
 * (user-search), routes/bookings.routes.ts (order, reopen), routes/payroll.routes.ts.
 */
import type { BookingAmount, NotificationLink, UserRole } from './api';
import type { PayrollPage, PayrollTechRow } from './adminLists';

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

/* ─── Edit order (PATCH /bookings/:id/order, POST /bookings/:id/order/preview) ─── */

/** Server limits — keep in sync with server/src/utils/orderEdit.ts. */
export const ORDER_ADJUSTMENT_MAX_LINES = 20;
export const ORDER_ADJUSTMENT_LABEL_MIN = 2;
export const ORDER_ADJUSTMENT_LABEL_MAX = 60;
export const ORDER_ADJUSTMENT_REASON_MAX = 200;
export const ORDER_ADJUSTMENT_AMOUNT_MAX = 1_000_000;
export const ORDER_NOTE_MAX = 200;

/** One bill line the admin sends: `amount` > 0 extra charge, < 0 discount (whole rupees, before GST). */
export interface OrderAdjustmentInput {
  /** Existing line id (kept), or left out for a new line. */
  id?: string;
  label: string;
  amount: number;
  reason?: string;
}

/** Every field optional — left out = unchanged. `adjustments` replaces the whole list. */
export interface OrderEditInput {
  serviceId?: string;
  /** Size key; null = none. */
  optionKey?: string | null;
  propertyType?: string;
  /** null / '' removes the coupon. */
  couponCode?: string | null;
  adjustments?: OrderAdjustmentInput[];
  paymentMethod?: string;
  /** Why (kept in the order history). */
  note?: string;
  /** The total the admin was looking at — 409 ORDER_STALE when the booking changed meanwhile. */
  expectedTotal?: number;
}

/** `POST /bookings/:id/order/preview` → { preview } (nothing is saved). */
export interface OrderEditPreview {
  amount: BookingAmount & { gstPercent: number };
  before: BookingAmount & { gstPercent: number };
  /** amount.total − before.total */
  difference: number;
  changes: string[];
  unchanged: boolean;
  serviceChanged: boolean;
  totalChanged: boolean;
  /** The customer will be told (total or service changes). */
  notifyCustomer: boolean;
  gstChanged: boolean;
  /** A new service replaces the treatment steps. */
  stepsRebuilt: boolean;
  couponCode: string | null;
  service: { id: string; name: string };
}

/** Error codes the order endpoints answer with (400 unless noted). */
export type OrderEditErrorCode =
  | 'ORDER_CANCELLED'
  | 'ORDER_LOCKED'
  | 'SERVICE_LOCKED'
  | 'SERVICE_UNAVAILABLE'
  | 'OPTION_REQUIRED'
  | 'PROPERTY_UNAVAILABLE'
  | 'PAYMENT_UNAVAILABLE'
  | 'COUPON_INVALID'
  | 'ADJUSTMENT_INVALID'
  | 'ADJUSTMENTS_TOO_LOW'
  /** 409 */
  | 'ORDER_STALE';

/** `POST /bookings/:id/reopen` { dropCoupon? } → { booking, reopened }. 409 COUPON_LIMIT when the coupon ran out. */
export interface ReopenResult {
  status: 'pending' | 'confirmed';
  /** The old visit time still passes the booking rules. */
  slotOpen: boolean;
  /** Auto-assign gave it a technician. */
  assigned: boolean;
  couponDropped: boolean;
}

/* ─── Payroll payouts + adjustments (/admin/payroll/payouts, /admin/payroll/adjustments) ─── */

export type PayoutMethod = 'cash' | 'upi' | 'bank' | 'other';

export const PAYOUT_METHODS: { key: PayoutMethod; label: string }[] = [
  { key: 'upi', label: 'UPI' },
  { key: 'bank', label: 'Bank transfer' },
  { key: 'cash', label: 'Cash' },
  { key: 'other', label: 'Other' },
];

/** Server limits — keep in sync with server/src/routes/payroll.routes.ts. */
export const PAYOUT_AMOUNT_MAX = 10_000_000;
export const PAYOUT_REFERENCE_MAX = 120;
export const PAYOUT_NOTE_MAX = 300;
export const PAY_ADJUSTMENT_AMOUNT_MAX = 1_000_000;
export const PAY_ADJUSTMENT_REASON_MIN = 3;
export const PAY_ADJUSTMENT_REASON_MAX = 200;

export interface PayrollPayout {
  id: string;
  technicianId: string;
  technicianName?: string;
  /** Pay period it settles (YYYY-MM-DD). */
  periodFrom: string;
  periodTo: string;
  amount: number;
  method: PayoutMethod;
  reference?: string;
  /** ISO time. */
  paidAt?: string;
  note?: string;
  createdBy: { id: string; name: string };
  createdAt?: string;
  /** With a range: true when the whole pay period lies inside it (counted in "paid"). */
  counted?: boolean;
}

export interface PayrollAdjustment {
  id: string;
  technicianId: string;
  technicianName?: string;
  /** YYYY-MM-DD */
  date: string;
  /** > 0 bonus, < 0 deduction. */
  amount: number;
  reason: string;
  createdBy: { id: string; name: string };
  createdAt?: string;
}

/** Ledger fields every GET /admin/payroll row carries for the range. */
export type PayrollLedgerFields = {
  adjustments: number;
  adjustmentCount: number;
  paid: number;
  payoutCount: number;
  /** earnings + adjustments − paid (negative = paid more than earned). */
  due: number;
  lastPaidAt?: string;
  /** Payouts whose period only partly overlaps the range (not counted). */
  overlapPaid: number;
  overlapPayouts: number;
};

export type PayrollLedgerRow = PayrollTechRow & PayrollLedgerFields;

export type PayrollLedgerPage = Omit<PayrollPage, 'technicians'> & {
  technicians: PayrollLedgerRow[];
  totalAdjustments: number;
  totalPaid: number;
  /** What is still owed (overpayments not netted off). */
  totalDue: number;
  totalOverpaid: number;
};
