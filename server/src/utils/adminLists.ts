import { Types } from 'mongoose';
import { Booking, type IBooking } from '../models/Booking';
import { LeaveRequest } from '../models/LeaveRequest';
import { Offer } from '../models/Offer';
import { Review, adminReviewReply } from '../models/Review';
import { Service } from '../models/Service';
import { formatAttendance } from '../models/TechnicianAttendance';
import { User, adminUserJson, sanitizeUser, type IUser, type VipOverride } from '../models/User';
import { AppError } from './AppError';
import { getAdminConfig } from './adminUser';
import {
  businessDayRange,
  dateFieldRange,
  dateKeyRange,
  daysInclusive,
  flag,
  optionalObjectId,
  pageMeta,
  parseDateRange,
  parsePaging,
  parseSort,
  phoneDigits,
  requireObjectId,
  searchRegex,
  wantsPaging,
  type PageParams,
} from './adminList';
import {
  buildAttendanceCalendar,
  computeAttendanceAnalytics,
  computeJobAnalytics,
  loadAttendanceForRange,
  monthRange,
  parseMonthParam,
  todayDateKey,
} from './attendance';
import { parseStatusFilter } from './bookingList';
import { getBusinessSettings } from './businessSettings';
import { formatBooking, formatReview } from './format';
import { buildJobVisitsForBookings, computeJobVisitAnalytics } from './jobVisit';
import { normalizePhone } from './phone';
import { buildAttendanceTrend, buildJobsTrend, TECH_PIPELINE_STATUSES } from './technicianAnalytics';
import { formatPaySummary, payConfigFromUser, resolveTechEarning, type TechPayConfig } from './techPay';
import { offerStatsFor } from './offerStats';
import { technicianCoverageFilter } from './technicianFit';

/**
 * Admin list endpoints (GET /admin/users, /technicians, /customers, /offers, /reviews, /payroll and the
 * technician / customer detail reads). Every list takes `page`, `limit` (default 25, max 100), `sort`,
 * `order` and `q`, and answers `{ <items>, total, page, pageSize, hasMore }` plus list-specific counts.
 */

type Query = Record<string, unknown>;

const ACTIVE_JOB_STATUSES = ['confirmed', 'in_progress', 'awaiting_verification'];
const OPEN_STATUSES = ['pending', 'confirmed', 'in_progress', 'awaiting_verification'];
const NUMBER_TYPES = ['double', 'int', 'long', 'decimal'];

/** The same JSON `sanitizeUser` gives, for `.lean()` documents. */
function leanUserJson(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v: _v, passwordHash: _p, adminNotes, ...rest } = doc;
  return { ...rest, id: String(_id), noteCount: Array.isArray(adminNotes) ? adminNotes.length : 0 };
}

function isEnvAdminLike(user: { role?: unknown; phone?: unknown }): boolean {
  return user.role === 'admin' && typeof user.phone === 'string' && normalizePhone(user.phone) === getAdminConfig().phone;
}

/** People search: name / email / city contains, or phone digits contain. */
function personSearch(q: unknown): Record<string, unknown> | undefined {
  const rx = searchRegex(q);
  if (!rx) return undefined;
  const or: Record<string, unknown>[] = [{ name: rx }, { email: rx }, { city: rx }];
  const digits = phoneDigits(q);
  if (digits) or.push({ phone: new RegExp(digits) });
  return { $or: or };
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const USER_ROLES = ['customer', 'technician', 'admin'] as const;

/**
 * GET /admin/users — `role` (customer | technician | admin), `status` (active | disabled), `q`,
 * `sort` = name (default) | created | role. Adds `counts` per role for the same search / status.
 */
export async function listUsers(query: Query) {
  const base: Record<string, unknown> = {};
  const search = personSearch(query.q);
  if (search) Object.assign(base, search);
  if (query.status === 'disabled') base.disabled = true;
  else if (query.status === 'active') base.disabled = { $ne: true };
  else if (query.status !== undefined && query.status !== '' && query.status !== 'all') {
    throw new AppError(400, 'status must be active or disabled');
  }

  const filter: Record<string, unknown> = { ...base };
  if (typeof query.role === 'string' && query.role && query.role !== 'all') {
    if (!(USER_ROLES as readonly string[]).includes(query.role)) throw new AppError(400, 'Unknown role');
    filter.role = query.role;
  }

  const paging = parsePaging(query);
  const { spec } = parseSort(
    query,
    { name: ['name'], created: ['createdAt'], role: ['role', 'name'] },
    { key: 'name', order: 'asc' },
  );

  const [users, total, roleRows] = await Promise.all([
    User.find(filter).sort(spec).skip(paging.skip).limit(paging.limit),
    User.countDocuments(filter),
    User.aggregate<{ _id: string; count: number }>([{ $match: base }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const counts: Record<string, number> = { all: 0, customer: 0, technician: 0, admin: 0 };
  for (const row of roleRows) {
    counts[String(row._id)] = row.count;
    counts.all += row.count;
  }

  return {
    users: users.map((u) => {
      const json = sanitizeUser(u) as Record<string, unknown>;
      if (isEnvAdminLike(u)) json.protected = true;
      return json;
    }),
    ...pageMeta(total, paging),
    counts,
  };
}

/* ------------------------------------------------------------------ */
/* Technicians                                                         */
/* ------------------------------------------------------------------ */

async function techniciansOnLeaveToday(): Promise<Set<string>> {
  const today = todayDateKey();
  const ids = await LeaveRequest.distinct('technicianId', {
    status: 'approved',
    from: { $lte: today },
    to: { $gte: today },
  });
  return new Set(ids.map((id) => String(id)));
}

/**
 * GET /admin/technicians — `status` = available | off_duty | on_leave | disabled | active (not disabled),
 * legacy `available=true`, `q`, `sort` = name (default) | jobs | rating | joined.
 * Without `page` / `limit` the whole roster comes back (assign pickers rely on it).
 */
export async function listTechnicians(query: Query) {
  const onLeave = await techniciansOnLeaveToday();
  const onLeaveIds = [...onLeave].map((id) => new Types.ObjectId(id));

  const base: Record<string, unknown> = { role: 'technician' };
  const search = personSearch(query.q);
  if (search) Object.assign(base, search);
  // Coverage filters: `skill`, `city`, `worksOn` (0–6).
  const coverage = technicianCoverageFilter(query);
  if (coverage) Object.assign(base, coverage);

  const filter: Record<string, unknown> = { ...base };
  if (query.available === 'true') {
    filter.available = { $ne: false };
    filter.disabled = { $ne: true };
  }
  const status = typeof query.status === 'string' ? query.status : '';
  if (status === 'available') {
    filter.available = { $ne: false };
    filter.disabled = { $ne: true };
  } else if (status === 'off_duty') {
    filter.available = false;
    filter.disabled = { $ne: true };
  } else if (status === 'disabled') {
    filter.disabled = true;
  } else if (status === 'active') {
    filter.disabled = { $ne: true };
  } else if (status === 'on_leave') {
    filter._id = { $in: onLeaveIds };
  } else if (status && status !== 'all') {
    throw new AppError(400, 'status must be available, off_duty, on_leave, disabled or active');
  }

  const total = await User.countDocuments(filter);
  const paging: PageParams = wantsPaging(query)
    ? parsePaging(query)
    : { page: 1, limit: Math.max(total, 1), skip: 0 };
  const { spec } = parseSort(
    query,
    { name: ['name'], jobs: ['jobsDone', 'name'], rating: ['rating', 'name'], joined: ['createdAt'] },
    { key: 'name', order: 'asc' },
  );

  const [technicians, countRows] = await Promise.all([
    User.find(filter).sort(spec).skip(paging.skip).limit(paging.limit),
    User.aggregate<{ _id: null; all: number; available: number; offDuty: number; disabled: number; onLeave: number }>([
      { $match: base },
      {
        $group: {
          _id: null,
          all: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $and: [{ $ne: ['$available', false] }, { $ne: ['$disabled', true] }] }, 1, 0] },
          },
          offDuty: {
            $sum: { $cond: [{ $and: [{ $eq: ['$available', false] }, { $ne: ['$disabled', true] }] }, 1, 0] },
          },
          disabled: { $sum: { $cond: [{ $eq: ['$disabled', true] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $in: ['$_id', onLeaveIds] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const techIds = technicians.map((t) => t._id);
  const agg =
    techIds.length > 0
      ? await Booking.aggregate([
          { $match: { technicianId: { $in: techIds } } },
          {
            $group: {
              _id: '$technicianId',
              activeJobs: { $sum: { $cond: [{ $in: ['$status', ACTIVE_JOB_STATUSES] }, 1, 0] } },
              completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              lastJobDate: { $max: '$schedule.date' },
            },
          },
        ])
      : [];
  const aggMap = new Map(agg.map((r) => [String(r._id), r]));

  const counts = countRows[0] ?? { all: 0, available: 0, offDuty: 0, disabled: 0, onLeave: 0 };

  return {
    technicians: technicians.map((t) => {
      const stats = aggMap.get(t._id.toString());
      return {
        ...sanitizeUser(t),
        activeJobs: (stats?.activeJobs as number) ?? 0,
        completedJobs: (stats?.completedJobs as number) ?? 0,
        lastJobDate: stats?.lastJobDate as string | undefined,
        onLeaveToday: onLeave.has(t._id.toString()),
      };
    }),
    ...pageMeta(total, paging),
    counts: {
      all: counts.all,
      available: counts.available,
      offDuty: counts.offDuty,
      disabled: counts.disabled,
      onLeave: counts.onLeave,
    },
  };
}

/** Sum of take-home pay over completed bookings, per document (locked earning, else the pay rule). */
function earningExpression(pay: TechPayConfig): unknown {
  const fromRule =
    pay.payMode === 'flat'
      ? Math.max(0, Math.round(Number(pay.payFlat) || 0))
      : {
          $round: [
            {
              $multiply: [
                { $max: [0, { $ifNull: ['$amount.total', 0] }] },
                Math.min(100, Math.max(0, Number(pay.payPercent ?? 100))) / 100,
              ],
            },
            0,
          ],
        };
  return {
    $cond: [{ $in: [{ $type: '$technicianEarning' }, NUMBER_TYPES] }, { $max: [0, { $round: ['$technicianEarning', 0] }] }, fromRule],
  };
}

/**
 * GET /admin/technicians/:id/detail?month=YYYY-MM — the month's jobs (plus any still-open job from other
 * months), with all-time totals from one aggregation instead of loading every booking ever.
 */
export async function technicianDetail(idRaw: unknown, monthRaw: unknown) {
  const id = requireObjectId(idRaw, 'technician id');
  const technician = await User.findOne({ _id: id, role: 'technician' });
  if (!technician) throw new AppError(404, 'Technician not found');

  const month = parseMonthParam(typeof monthRaw === 'string' ? monthRaw : undefined);
  const { from, to } = monthRange(month);
  const today = todayDateKey();
  const techPay = payConfigFromUser(technician);
  const monthInstants = businessDayRange(from, to);

  const [bookings, totalsRows, reviewCount, reviews, attendanceRecords, pendingBookingsRaw, globalPendingCount, globalPendingPeriodCount] =
    await Promise.all([
      Booking.find({
        technicianId: technician._id,
        $or: [{ 'schedule.date': { $gte: from, $lte: to } }, { status: { $in: OPEN_STATUSES } }],
      })
        .populate('serviceId')
        .populate('customerId', '-passwordHash')
        .sort({ 'schedule.date': 1, createdAt: -1 }),
      Booking.aggregate<{ _id: string; count: number; earnings: number; lastJobDate?: string }>([
        { $match: { technicianId: technician._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            earnings: { $sum: earningExpression(techPay) },
            lastJobDate: { $max: '$schedule.date' },
          },
        },
      ]),
      Review.countDocuments({ technicianId: technician._id, hidden: { $ne: true } }),
      Review.find({ technicianId: technician._id, hidden: { $ne: true } }).sort({ createdAt: -1 }).limit(10),
      loadAttendanceForRange(technician._id, from, to),
      Booking.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('serviceId')
        .populate('customerId', '-passwordHash')
        .populate('technicianId', '-passwordHash'),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'pending', createdAt: { $gte: monthInstants.start, $lt: monthInstants.end } }),
    ]);

  const byStatus: Record<string, number> = {};
  let totalJobs = 0;
  let earnings = 0;
  let lastJobDate: string | undefined;
  for (const row of totalsRows) {
    byStatus[String(row._id)] = row.count;
    totalJobs += row.count;
    if (row._id === 'completed') earnings = Math.round(row.earnings);
    if (row.lastJobDate && (!lastJobDate || row.lastJobDate > lastJobDate)) lastJobDate = row.lastJobDate;
  }

  const calendar: Record<string, number> = {};
  const monthBookings: IBooking[] = [];
  let monthEarnings = 0;
  const periodByStatus: Record<string, number> = {};
  for (const b of bookings) {
    const date = b.schedule?.date;
    if (date) calendar[date] = (calendar[date] ?? 0) + 1;
    if (date && date >= from && date <= to) {
      monthBookings.push(b);
      periodByStatus[b.status] = (periodByStatus[b.status] ?? 0) + 1;
      if (b.status === 'completed') monthEarnings += resolveTechEarning(b, techPay);
    }
  }

  const attendance = buildAttendanceCalendar(attendanceRecords, from, to, today);
  const attendanceStats = computeAttendanceAnalytics(attendance, today);
  const jobStats = computeJobAnalytics(monthBookings, month);
  const visitStats = computeJobVisitAnalytics(monthBookings, today, month);
  const jobVisits = buildJobVisitsForBookings(monthBookings, today, month);

  return {
    technician: sanitizeUser(technician),
    bookings: bookings.map((b) => formatBooking(b)),
    range: { from, to },
    stats: {
      totalJobs,
      activeJobs: ACTIVE_JOB_STATUSES.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0),
      completedJobs: byStatus.completed ?? 0,
      cancelledJobs: byStatus.cancelled ?? 0,
      pendingJobs: byStatus.pending ?? 0,
      inProgressJobs: byStatus.in_progress ?? 0,
      awaitingVerificationJobs: byStatus.awaiting_verification ?? 0,
      earnings,
      monthEarnings,
      lastJobDate,
      reviewCount,
      paySummary: formatPaySummary(techPay),
    },
    reviews: reviews.map((r) => formatReview(r)),
    calendar,
    month,
    attendance,
    attendanceRecords: attendanceRecords.map((r) => formatAttendance(r)),
    jobVisits,
    analytics: { ...attendanceStats, ...jobStats, ...visitStats },
    globalPending: {
      count: globalPendingCount,
      periodCount: globalPendingPeriodCount,
      bookings: pendingBookingsRaw.map((b) => formatBooking(b)),
    },
    statusBreakdown: TECH_PIPELINE_STATUSES.map((status) => ({
      status,
      count: byStatus[status] ?? 0,
      periodCount: periodByStatus[status] ?? 0,
    })),
    attendanceTrend: buildAttendanceTrend(attendance, month, today),
    jobsTrend: buildJobsTrend(monthBookings, month, techPay),
  };
}

/**
 * GET /admin/technicians/:id/bookings — `status` (incl. groups), `from` / `to` (visit date), paging,
 * `sort` = visit (default, ascending) | created | amount.
 */
export async function technicianBookings(idRaw: unknown, query: Query) {
  const id = requireObjectId(idRaw, 'technician id');
  const tech = await User.findOne({ _id: id, role: 'technician' }).select('_id');
  if (!tech) throw new AppError(404, 'Technician not found');

  const filter: Record<string, unknown> = { technicianId: tech._id };
  const statuses = parseStatusFilter(query.status);
  if (statuses) filter.status = { $in: statuses };
  const { from, to } = parseDateRange(query);
  const visit = dateKeyRange(from, to);
  if (visit) filter['schedule.date'] = visit;

  const paging = parsePaging(query);
  const { spec } = parseSort(
    query,
    { visit: ['schedule.date', 'schedule.slot'], created: ['createdAt'], amount: ['amount.total'] },
    { key: 'visit', order: 'asc' },
  );
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('serviceId')
      .populate('customerId', '-passwordHash')
      .sort(spec)
      .skip(paging.skip)
      .limit(paging.limit),
    Booking.countDocuments(filter),
  ]);
  return { bookings: bookings.map((b) => formatBooking(b)), ...pageMeta(total, paging) };
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

type CustomerTag = 'active' | 'inactive' | 'vip';

/**
 * VIP rule from Business settings → Customers (a threshold of 0 is switched off). The admin's override on the
 * customer wins: `vip` always VIP, `not_vip` never.
 */
export function customerTag(
  bookingCount: number,
  totalSpend: number,
  vip: { vipSpend: number; vipBookings: number },
  override?: VipOverride | null,
): CustomerTag {
  if (override === 'vip') return 'vip';
  if (bookingCount === 0) return 'inactive';
  if (override === 'not_vip') return 'active';
  const bySpend = vip.vipSpend > 0 && totalSpend >= vip.vipSpend;
  const byCount = vip.vipBookings > 0 && bookingCount >= vip.vipBookings;
  return bySpend || byCount ? 'vip' : 'active';
}

const CUSTOMER_STATUSES = ['all', 'active', 'inactive', 'vip', 'disabled', 'new'] as const;

/**
 * GET /admin/customers — `status` = active | inactive | vip | disabled | new (joined in the last 7 days),
 * `vip=1` (same as status=vip), `q` (name, phone, email, city, tags), `tag` (exact tag, any case),
 * `sort` = name (default) | created | spend | bookings | last.
 * `summary` covers every customer; `counts` are per status for the current search.
 */
export async function listCustomers(query: Query) {
  const status = flag(query.vip) ? 'vip' : typeof query.status === 'string' && query.status ? query.status : 'all';
  if (!(CUSTOMER_STATUSES as readonly string[]).includes(status)) {
    throw new AppError(400, 'status must be active, inactive, vip, disabled or new');
  }
  const settings = await getBusinessSettings();
  const vipRule = settings.customers;

  const [customers, statsRows] = await Promise.all([
    User.find({ role: 'customer' }).lean<Record<string, unknown>[]>(),
    Booking.aggregate<{ _id: Types.ObjectId; bookingCount: number; totalSpend: number; lastBookingAt?: Date }>([
      {
        $group: {
          _id: '$customerId',
          bookingCount: { $sum: 1 },
          totalSpend: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount.total', 0] } },
          lastBookingAt: { $max: '$createdAt' },
        },
      },
    ]),
  ]);
  const stats = new Map(statsRows.map((r) => [String(r._id), r]));
  const weekAgo = Date.now() - 7 * 86_400_000;
  const rx = searchRegex(query.q);
  const digits = phoneDigits(query.q);
  // `tag`: customers carrying this tag (any case).
  const tagFilter = typeof query.tag === 'string' && query.tag.trim() ? query.tag.trim().toLowerCase() : '';

  type Row = {
    json: Record<string, unknown>;
    name: string;
    createdAt: number;
    bookingCount: number;
    totalSpend: number;
    lastBookingAt: number;
    tag: CustomerTag;
    disabled: boolean;
    isNew: boolean;
    matches: boolean;
  };

  const rows: Row[] = customers.map((c) => {
    const s = stats.get(String(c._id));
    const bookingCount = s?.bookingCount ?? 0;
    const totalSpend = s?.totalSpend ?? 0;
    const override = c.vipOverride === 'vip' || c.vipOverride === 'not_vip' ? c.vipOverride : null;
    const tag = customerTag(bookingCount, totalSpend, vipRule, override);
    const created = c.createdAt instanceof Date ? c.createdAt.getTime() : 0;
    const tags = Array.isArray(c.tags) ? (c.tags as unknown[]).filter((t): t is string => typeof t === 'string') : [];
    const text = [c.name, c.email, c.city, ...tags].filter((x): x is string => typeof x === 'string');
    const matches =
      (!rx ||
        text.some((t) => rx.test(t)) ||
        Boolean(digits && typeof c.phone === 'string' && c.phone.includes(digits))) &&
      (!tagFilter || tags.some((t) => t.toLowerCase() === tagFilter));
    return {
      json: {
        ...leanUserJson(c),
        bookingCount,
        totalSpend,
        lastBookingAt: s?.lastBookingAt,
        statusTag: tag,
        tags,
        vipOverride: override,
      },
      name: typeof c.name === 'string' ? c.name.toLowerCase() : '',
      createdAt: created,
      bookingCount,
      totalSpend,
      lastBookingAt: s?.lastBookingAt instanceof Date ? s.lastBookingAt.getTime() : 0,
      tag,
      disabled: c.disabled === true || c.available === false,
      isNew: created >= weekAgo,
      matches,
    };
  });

  const inStatus = (r: Row, st: string): boolean => {
    if (st === 'all') return true;
    if (st === 'disabled') return r.disabled;
    if (st === 'new') return r.isNew;
    if (st === 'vip') return r.tag === 'vip';
    if (st === 'inactive') return r.tag === 'inactive';
    return !r.disabled && r.tag !== 'inactive'; // active
  };

  const searched = rows.filter((r) => r.matches);
  const counts: Record<string, number> = {};
  for (const st of CUSTOMER_STATUSES) counts[st] = searched.filter((r) => inStatus(r, st)).length;

  const matched = searched.filter((r) => inStatus(r, status));
  const sortKey = typeof query.sort === 'string' ? query.sort : 'name';
  const dir = query.order === 'desc' ? -1 : query.order === 'asc' ? 1 : sortKey === 'name' ? 1 : -1;
  const value = (r: Row): number | string => {
    switch (sortKey) {
      case 'created':
        return r.createdAt;
      case 'spend':
        return r.totalSpend;
      case 'bookings':
        return r.bookingCount;
      case 'last':
        return r.lastBookingAt;
      default:
        return r.name;
    }
  };
  matched.sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return a.name.localeCompare(b.name);
  });

  const paging = parsePaging(query);
  return {
    customers: matched.slice(paging.skip, paging.skip + paging.limit).map((r) => r.json),
    ...pageMeta(matched.length, paging),
    summary: {
      total: rows.length,
      new: rows.filter((r) => r.isNew).length,
      vip: rows.filter((r) => r.tag === 'vip').length,
      disabled: rows.filter((r) => r.disabled).length,
    },
    counts,
    vipRule: { vipSpend: vipRule.vipSpend, vipBookings: vipRule.vipBookings },
  };
}

/** GET /admin/customers/:id — profile, every booking (newest first) and lifetime spend. */
export async function customerDetail(idRaw: unknown) {
  const id = requireObjectId(idRaw, 'customer id');
  const customer = await User.findOne({ _id: id, role: 'customer' });
  if (!customer) throw new AppError(404, 'Customer not found');

  const [bookings, settings] = await Promise.all([
    Booking.find({ customerId: customer._id })
      .populate('serviceId')
      .populate('technicianId', '-passwordHash')
      .sort({ createdAt: -1 }),
    getBusinessSettings(),
  ]);
  const totalSpend = bookings.reduce((sum, b) => sum + (b.status === 'completed' ? (b.amount?.total ?? 0) : 0), 0);

  return {
    // Includes the admin-only notes (newest first), tags and VIP override.
    customer: adminUserJson(customer as IUser),
    bookings: bookings.map((b) => formatBooking(b)),
    totalSpend,
    bookingCount: bookings.length,
    statusTag: customerTag(bookings.length, totalSpend, settings.customers, customer.vipOverride),
    lastBookingAt: bookings[0]?.createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* Offers                                                              */
/* ------------------------------------------------------------------ */

/**
 * GET /admin/offers — `status` = active (switched on and not expired) | inactive (switched off) | expired,
 * `q` (code / description), `sort` = created (default) | code | uses | expires | discount.
 */
export async function listOffers(query: Query) {
  const now = new Date();
  const base: Record<string, unknown> = {};
  const rx = searchRegex(query.q);
  if (rx) base.$or = [{ code: rx }, { description: rx }];

  const notExpired = { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] };
  const conditions: Record<string, Record<string, unknown>> = {
    active: { active: true, ...notExpired },
    inactive: { active: false },
    expired: { expiresAt: { $lt: now } },
  };
  const status = typeof query.status === 'string' && query.status ? query.status : 'all';
  if (status !== 'all' && !conditions[status]) throw new AppError(400, 'status must be active, inactive or expired');

  // `$and` keeps the search `$or` and the "not expired" `$or` apart.
  const filter = status === 'all' ? base : { $and: [base, conditions[status]] };
  const paging = parsePaging(query);
  const { spec } = parseSort(
    query,
    {
      created: ['createdAt'],
      code: ['code'],
      uses: ['useCount'],
      expires: ['expiresAt'],
      discount: ['discount'],
    },
    { key: 'created', order: 'desc' },
  );

  const [offers, total, all, active, inactive, expired] = await Promise.all([
    Offer.find(filter).sort(spec).skip(paging.skip).limit(paging.limit),
    Offer.countDocuments(filter),
    Offer.countDocuments(base),
    Offer.countDocuments({ $and: [base, conditions.active] }),
    Offer.countDocuments({ $and: [base, conditions.inactive] }),
    Offer.countDocuments({ $and: [base, conditions.expired] }),
  ]);

  // Usage per code from the bookings that carry it (utils/offerStats.ts).
  const stats = await offerStatsFor(offers.map((o) => o.code));
  return {
    offers: offers.map((o) => ({ ...o.toJSON(), stats: stats.get(o.code.toUpperCase()) })),
    ...pageMeta(total, paging),
    counts: { all, active, inactive, expired },
  };
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

/**
 * GET /admin/reviews — `rating` (1–5 or a comma list), `visibility` = visible | hidden, `technicianId`,
 * `q` (comment / tags / reply), `replied` = yes | no, `from` / `to` (created), `sort` = created (default) | stars.
 * `summary` (average, count, hidden, star breakdown) covers every review matching the filters except
 * `rating`, so the breakdown stays a full distribution you can tap to filter.
 */
export async function listReviews(query: Query) {
  const base: Record<string, unknown> = {};
  if (query.visibility === 'visible') base.hidden = { $ne: true };
  else if (query.visibility === 'hidden') base.hidden = true;
  else if (query.visibility !== undefined && query.visibility !== '' && query.visibility !== 'all') {
    throw new AppError(400, 'visibility must be visible or hidden');
  }
  const techId = optionalObjectId(query.technicianId, 'technicianId');
  if (techId) base.technicianId = techId;
  const rx = searchRegex(query.q);
  if (rx) base.$or = [{ comment: rx }, { tags: rx }, { 'reply.text': rx }];
  const { from, to } = parseDateRange(query);
  const created = dateFieldRange(from, to);
  if (created) base.createdAt = created;
  // `replied` = yes (has a reply) | no (waiting for one).
  if (query.replied === 'yes') base['reply.text'] = { $exists: true, $ne: '' };
  else if (query.replied === 'no') base.$and = [{ $or: [{ reply: null }, { 'reply.text': { $exists: false } }] }];
  else if (query.replied !== undefined && query.replied !== '' && query.replied !== 'all') {
    throw new AppError(400, 'replied must be yes or no');
  }

  const filter: Record<string, unknown> = { ...base };
  if (typeof query.rating === 'string' && query.rating && query.rating !== 'all') {
    const stars = [...new Set(query.rating.split(',').map((s) => Number.parseInt(s.trim(), 10)))];
    if (stars.some((s) => !Number.isInteger(s) || s < 1 || s > 5)) throw new AppError(400, 'rating must be 1–5');
    filter.stars = stars.length === 1 ? stars[0] : { $in: stars };
  }

  const paging = parsePaging(query);
  const { spec } = parseSort(query, { created: ['createdAt'], stars: ['stars', 'createdAt'] }, { key: 'created', order: 'desc' });

  const [reviews, total, summaryRows] = await Promise.all([
    Review.find(filter).sort(spec).skip(paging.skip).limit(paging.limit),
    Review.countDocuments(filter),
    Review.aggregate<{ _id: number; count: number; hidden: number }>([
      { $match: base },
      { $group: { _id: '$stars', count: { $sum: 1 }, hidden: { $sum: { $cond: [{ $eq: ['$hidden', true] }, 1, 0] } } } },
    ]),
  ]);

  const breakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let count = 0;
  let sum = 0;
  let hidden = 0;
  for (const row of summaryRows) {
    breakdown[String(row._id)] = (breakdown[String(row._id)] ?? 0) + row.count;
    count += row.count;
    sum += Number(row._id) * row.count;
    hidden += row.hidden;
  }

  const bookingIds = [...new Set(reviews.map((r) => r.bookingId.toString()))];
  const techIds = [...new Set(reviews.map((r) => r.technicianId.toString()))];
  const bookings = await Booking.find({ _id: { $in: bookingIds } }).select('serviceId customerId').lean();
  const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));
  const serviceIds = [...new Set(bookings.map((b) => String(b.serviceId)))];
  const customerIds = [...new Set(bookings.map((b) => String(b.customerId)))];
  const [services, people] = await Promise.all([
    Service.find({ _id: { $in: serviceIds } }).select('name').lean(),
    User.find({ _id: { $in: [...customerIds, ...techIds] } }).select('name').lean(),
  ]);
  const serviceName = new Map(services.map((s) => [String(s._id), s.name]));
  const personName = new Map(people.map((p) => [String(p._id), p.name]));

  return {
    reviews: reviews.map((r) => {
      const booking = bookingMap.get(r.bookingId.toString());
      const customer = booking ? personName.get(String(booking.customerId)) : undefined;
      return {
        ...formatReview(r),
        reply: adminReviewReply(r.reply),
        customerName: customer?.split(' ')[0] || 'Customer',
        customerFullName: customer,
        serviceName: booking ? (serviceName.get(String(booking.serviceId)) ?? 'Service') : 'Service',
        technicianName: personName.get(r.technicianId.toString()),
      };
    }),
    ...pageMeta(total, paging),
    summary: {
      count,
      average: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      hidden,
      breakdown,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Payroll                                                             */
/* ------------------------------------------------------------------ */

/**
 * GET /admin/payroll — `month` (YYYY-MM) or `from` / `to` (YYYY-MM-DD, at most 366 days) on the visit date,
 * optional `technicianId`, `includeJobs=1` for the per-job breakdown (ref, date, service, customer, job
 * value, take-home).
 */
export async function payroll(query: Query) {
  const month = parseMonthParam(typeof query.month === 'string' ? query.month : undefined);
  const custom = parseDateRange(query, { maxDays: 366 });
  if ((custom.from && !custom.to) || (!custom.from && custom.to)) {
    throw new AppError(400, 'Send both from and to');
  }
  const { from, to } = custom.from && custom.to ? { from: custom.from, to: custom.to } : monthRange(month);
  const includeJobs = flag(query.includeJobs);
  const techFilter: Record<string, unknown> = { role: 'technician' };
  const onlyTech = optionalObjectId(query.technicianId, 'technicianId');
  if (onlyTech) techFilter._id = onlyTech;

  const techs = await User.find(techFilter).sort({ name: 1 });
  const completed = await Booking.find({
    status: 'completed',
    technicianId: { $in: techs.map((t) => t._id) },
    'schedule.date': { $gte: from, $lte: to },
  })
    .select('technicianId amount technicianEarning schedule serviceId customerId workCompletedAt option')
    .populate('serviceId', 'name')
    .populate('customerId', 'name phone')
    .sort({ 'schedule.date': 1 })
    .lean();

  const byTech = new Map<string, typeof completed>();
  for (const b of completed) {
    const key = String(b.technicianId);
    const list = byTech.get(key) ?? [];
    list.push(b);
    byTech.set(key, list);
  }

  const rows = techs.map((tech) => {
    const pay = payConfigFromUser(tech);
    const jobs = byTech.get(String(tech._id)) ?? [];
    let earnings = 0;
    let jobValue = 0;
    const breakdown = jobs.map((b) => {
      const earning = resolveTechEarning(b, pay);
      const total = b.amount?.total ?? 0;
      earnings += earning;
      jobValue += total;
      const service = b.serviceId as unknown as { name?: string } | null;
      const customer = b.customerId as unknown as { name?: string; phone?: string } | null;
      const id = String(b._id);
      return {
        bookingId: id,
        ref: `#MA-${id.slice(-5).toUpperCase()}`,
        date: b.schedule?.date ?? '',
        slot: b.schedule?.slot ?? '',
        serviceName: service?.name ?? 'Service',
        option: b.option?.label,
        customerName: customer?.name ?? 'Customer',
        customerPhone: customer?.phone,
        jobValue: total,
        earning,
        locked: typeof b.technicianEarning === 'number',
        completedAt: b.workCompletedAt,
      };
    });
    return {
      technicianId: String(tech._id),
      name: tech.name,
      phone: tech.phone,
      available: tech.available !== false,
      disabled: tech.disabled === true,
      paySummary: formatPaySummary(pay),
      jobsCompleted: jobs.length,
      earnings,
      jobValue,
      ...(includeJobs ? { jobs: breakdown } : {}),
    };
  });

  rows.sort((a, b) => b.earnings - a.earnings || a.name.localeCompare(b.name));
  return {
    from,
    to,
    month,
    days: daysInclusive(from, to),
    totalEarnings: rows.reduce((s, r) => s + r.earnings, 0),
    totalJobs: rows.reduce((s, r) => s + r.jobsCompleted, 0),
    totalJobValue: rows.reduce((s, r) => s + r.jobValue, 0),
    technicians: rows,
  };
}
