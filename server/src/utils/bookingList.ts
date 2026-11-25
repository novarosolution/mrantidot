import { Types } from 'mongoose';
import { Booking, type IBooking } from '../models/Booking';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { AppError } from './AppError';
import {
  dateFieldRange,
  dateKeyRange,
  flag,
  optionalObjectId,
  pageMeta,
  parseDateRange,
  parsePaging,
  parseSort,
  phoneDigits,
  searchRegex,
  wantsPaging,
  type PageParams,
} from './adminList';

/**
 * Query building for `GET /bookings` (the one list every role uses).
 *
 * Customers / technicians only ever see their own bookings; without `page` / `limit` they keep the old
 * behaviour (newest first, up to 200) so the apps and the website are unaffected.
 *
 * Admin filters (all optional, combined with AND):
 *   status          one status, a group (`active`, `live`, `closed`) or a comma list
 *   technicianId    an id, or `unassigned`
 *   customerId, serviceId
 *   paymentStatus   unpaid (also matches bookings saved before the field existed) | paid | refunded
 *   paymentMethod   upi_card | pay_after
 *   source          app | website | admin | unknown (bookings saved before the source was recorded)
 *   from, to        YYYY-MM-DD business days (IST); `dateField` = visit (default) | created | completed
 *   q               ref (#MA-1A2B3), customer / technician name or phone, service name, coupon code
 *   sort            visit | created (default) | amount | updated;  order = asc | desc (default desc)
 *   page, limit     paging (default 25, max 100)
 *   withCounts=1    adds `statusCounts` for the same filters without the status filter (chip counts)
 */

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
  'cancelled',
] as const;

export const BOOKING_STATUS_GROUPS: Record<string, readonly string[]> = {
  active: ['pending', 'confirmed', 'in_progress', 'awaiting_verification'],
  live: ['in_progress', 'awaiting_verification'],
  closed: ['completed', 'cancelled'],
};

const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const;
const PAYMENT_METHODS = ['upi_card', 'pay_after'] as const;
const SOURCES = ['app', 'website', 'admin', 'unknown'] as const;

type Query = Record<string, unknown>;

/** Statuses for a `status` query value (group names expand); undefined = no status filter. */
export function parseStatusFilter(raw: unknown): string[] | undefined {
  if (typeof raw !== 'string' || !raw.trim() || raw.trim() === 'all') return undefined;
  const out = new Set<string>();
  for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const group = BOOKING_STATUS_GROUPS[part];
    if (group) group.forEach((s) => out.add(s));
    else if ((BOOKING_STATUSES as readonly string[]).includes(part)) out.add(part);
    else throw new AppError(400, `Unknown booking status "${part}"`);
  }
  return [...out];
}

/** Mongo filter for a payment status; `unpaid` also matches bookings without the field. */
export function paymentStatusFilter(raw: unknown): unknown {
  if (typeof raw !== 'string' || !raw.trim() || raw === 'all') return undefined;
  const value = raw.trim();
  if (!(PAYMENT_STATUSES as readonly string[]).includes(value)) {
    throw new AppError(400, `Unknown payment status "${value}"`);
  }
  return value === 'unpaid' ? { $in: ['unpaid', null] } : value;
}

/** Ids of bookings / people / services matching a free-text admin search. */
async function searchConditions(raw: unknown): Promise<Record<string, unknown>[] | null> {
  if (typeof raw !== 'string') return null;
  const text = raw.trim().slice(0, 100).replace(/^#/, '').replace(/^ma-/i, '');
  const rx = searchRegex(text);
  if (!rx) return null;
  const digits = phoneDigits(text);
  const people: Record<string, unknown>[] = [{ name: rx }, { email: rx }];
  if (digits) people.push({ phone: new RegExp(digits) });
  const [users, services] = await Promise.all([
    User.find({ $or: people }).select('_id').limit(500).lean(),
    Service.find({ name: rx }).select('_id').limit(200).lean(),
  ]);
  const userIds = users.map((u) => u._id);
  const or: Record<string, unknown>[] = [
    { customerId: { $in: userIds } },
    { technicianId: { $in: userIds } },
    { serviceId: { $in: services.map((s) => s._id) } },
    // Coupon codes too, so an offer can link to "every booking with this code".
    { couponCode: rx },
  ];
  // Booking refs are the end of the id (#MA-1A2B3 / #1A2B3C) — match hex text against the id.
  if (/^[a-f\d]{4,24}$/i.test(text)) {
    or.push({ $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: text, options: 'i' } } });
  }
  return or;
}

export type BookingListQuery = {
  /** Every filter (use with find / countDocuments / aggregate — ids are ObjectIds). */
  filter: Record<string, unknown>;
  /** The same filter without the status condition (for status chip counts). */
  filterWithoutStatus: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  paging: PageParams;
  withCounts: boolean;
};

const SORTS: Record<string, string[]> = {
  visit: ['schedule.date', 'schedule.slot', 'createdAt'],
  created: ['createdAt'],
  amount: ['amount.total', 'createdAt'],
  updated: ['updatedAt'],
};

export async function buildBookingListQuery(
  query: Query,
  user: { id: string; role: string },
): Promise<BookingListQuery> {
  const isAdmin = user.role === 'admin';
  const base: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (user.role === 'customer') base.customerId = new Types.ObjectId(user.id);
  else if (user.role === 'technician') base.technicianId = new Types.ObjectId(user.id);

  const statuses = parseStatusFilter(query.status);

  if (isAdmin) {
    if (query.technicianId === 'unassigned') {
      base.technicianId = null;
    } else {
      const techId = optionalObjectId(query.technicianId, 'technicianId');
      if (techId) base.technicianId = techId;
    }
    const customerId = optionalObjectId(query.customerId, 'customerId');
    if (customerId) base.customerId = customerId;
    const serviceId = optionalObjectId(query.serviceId, 'serviceId');
    if (serviceId) base.serviceId = serviceId;

    const payStatus = paymentStatusFilter(query.paymentStatus);
    if (payStatus !== undefined) base.paymentStatus = payStatus;

    if (typeof query.paymentMethod === 'string' && query.paymentMethod && query.paymentMethod !== 'all') {
      if (!(PAYMENT_METHODS as readonly string[]).includes(query.paymentMethod)) {
        throw new AppError(400, `Unknown payment method "${query.paymentMethod}"`);
      }
      base.paymentMethod = query.paymentMethod;
    }

    if (typeof query.source === 'string' && query.source && query.source !== 'all') {
      if (!(SOURCES as readonly string[]).includes(query.source)) {
        throw new AppError(400, 'source must be app, website, admin or unknown');
      }
      base.source = query.source === 'unknown' ? null : query.source;
    }

    const { from, to } = parseDateRange(query, { maxDays: 3700 });
    const dateField = typeof query.dateField === 'string' ? query.dateField : 'visit';
    if (from || to) {
      if (dateField === 'created') base.createdAt = dateFieldRange(from, to);
      else if (dateField === 'completed') base.workCompletedAt = dateFieldRange(from, to);
      else if (dateField === 'visit') base['schedule.date'] = dateKeyRange(from, to);
      else throw new AppError(400, 'dateField must be visit, created or completed');
    }

    const search = await searchConditions(query.q);
    if (search) and.push({ $or: search });
  }

  const filterWithoutStatus: Record<string, unknown> = and.length ? { ...base, $and: and } : { ...base };
  const filter: Record<string, unknown> = statuses
    ? { ...filterWithoutStatus, status: statuses.length === 1 ? statuses[0] : { $in: statuses } }
    : filterWithoutStatus;

  let paging: PageParams;
  if (isAdmin || wantsPaging(query)) {
    paging = parsePaging(query);
  } else {
    // Customer / technician apps and the website: the old unpaged list (newest 200).
    const limit = Math.min(Number.parseInt(String(query.limit ?? '200'), 10) || 200, 500);
    const skip = Math.max(Number.parseInt(String(query.skip ?? '0'), 10) || 0, 0);
    paging = { page: 1, limit, skip };
  }

  const { spec } = parseSort(query, SORTS, { key: 'created', order: 'desc' });
  return { filter, filterWithoutStatus, sort: spec, paging, withCounts: isAdmin && flag(query.withCounts) };
}

/** Runs the list query: one page of populated bookings, the total, and (optionally) status counts. */
export async function runBookingList(q: BookingListQuery): Promise<{
  bookings: IBooking[];
  meta: ReturnType<typeof pageMeta>;
  statusCounts?: Record<string, number>;
}> {
  const [bookings, total, counts] = await Promise.all([
    Booking.find(q.filter)
      .populate('serviceId')
      .populate('customerId', '-passwordHash')
      .populate('technicianId', '-passwordHash')
      .sort(q.sort)
      .skip(q.paging.skip)
      .limit(q.paging.limit),
    Booking.countDocuments(q.filter),
    q.withCounts
      ? Booking.aggregate<{ _id: string; count: number }>([
          { $match: q.filterWithoutStatus },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
      : Promise.resolve(null),
  ]);

  let statusCounts: Record<string, number> | undefined;
  if (counts) {
    statusCounts = { all: 0 };
    for (const s of BOOKING_STATUSES) statusCounts[s] = 0;
    for (const row of counts) {
      statusCounts[String(row._id)] = row.count;
      statusCounts.all += row.count;
    }
    for (const [group, members] of Object.entries(BOOKING_STATUS_GROUPS)) {
      statusCounts[group] = members.reduce((sum, s) => sum + (statusCounts![s] ?? 0), 0);
    }
  }

  return { bookings, meta: pageMeta(total, q.paging), statusCounts };
}
