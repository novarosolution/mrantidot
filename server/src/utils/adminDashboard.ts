import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { LeaveRequest } from '../models/LeaveRequest';
import { Offer } from '../models/Offer';
import { Review } from '../models/Review';
import { Service } from '../models/Service';
import { TechnicianAttendance } from '../models/TechnicianAttendance';
import { User } from '../models/User';
import { AppError } from './AppError';
import { addDays, BUSINESS_TZ, daysInclusive, parseDateRange, startOfBusinessDay } from './adminList';
import { buildAttendanceCalendar, computeAttendanceAnalytics, todayDateKey } from './attendance';
import { getBusinessSettings, listLabel } from './businessSettings';
import { eachDateInRange } from './dateKey';
import { formatBooking } from './format';
import { technicianPublicRating } from './ratings';

/**
 * Dashboard + reports numbers (GET /stats/admin, GET /stats/admin/team-attendance).
 *
 * Definitions (all days are business days in IST):
 *   revenue        completed bookings whose work was completed in the range (`workCompletedAt`, or the last
 *                  update for bookings completed before that field existed). Cancelled bookings never count.
 *                  `total` includes GST; `net` = total − GST; `gst` and `coupon` are shown separately.
 *   bookings       bookings created in the range, split by their current status.
 *   newCustomers   customer accounts created in the range.
 *   snapshot       "right now" counts (active jobs, pending, unassigned…) — no range, no delta.
 *   delta          % change against the previous range of the same length (null = nothing to compare).
 */

type Query = Record<string, unknown>;

export const PIPELINE_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
  'cancelled',
] as const;
const OPEN_STATUSES: readonly string[] = ['pending', 'confirmed', 'in_progress', 'awaiting_verification'];

/** Longest range the dashboard / reports accept (about ten years — monthly points). */
const MAX_RANGE_DAYS = 3700;
/** Ranges up to this many days chart one point per day; longer ones one point per month. */
export const DAILY_BUCKET_MAX_DAYS = 62;
/** Old app builds send `period`; it maps to a rolling range ending today. */
const LEGACY_PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type StatsRange = {
  from: string;
  to: string;
  days: number;
  prevFrom: string;
  prevTo: string;
  start: Date;
  end: Date;
  prevStart: Date;
  bucket: 'day' | 'month';
  /** Legacy period key when the caller used `period`, else `custom`. */
  period: string;
  today: string;
};

/**
 * `from` / `to` (YYYY-MM-DD, IST) — either may be left out (`to` defaults to today, `from` to 30 days before
 * `to`). Without both, a legacy `period` (week | month | quarter | year) or the last 30 days.
 */
export function parseStatsRange(query: Query, maxDays = MAX_RANGE_DAYS): StatsRange {
  const today = todayDateKey();
  let { from, to } = parseDateRange(query);
  let period = 'custom';
  if (!from && !to) {
    const key = typeof query.period === 'string' && LEGACY_PERIOD_DAYS[query.period] ? query.period : 'month';
    period = key;
    to = today;
    from = addDays(today, -(LEGACY_PERIOD_DAYS[key] - 1));
  } else if (from && !to) {
    to = from > today ? from : today;
  } else if (!from && to) {
    from = addDays(to, -29);
  }
  const f = from as string;
  const t = to as string;
  const days = daysInclusive(f, t);
  if (days > maxDays) throw new AppError(400, `Pick a range of at most ${maxDays} days`);
  const prevTo = addDays(f, -1);
  const prevFrom = addDays(f, -days);
  return {
    from: f,
    to: t,
    days,
    prevFrom,
    prevTo,
    start: startOfBusinessDay(f),
    end: startOfBusinessDay(addDays(t, 1)),
    prevStart: startOfBusinessDay(prevFrom),
    bucket: days <= DAILY_BUCKET_MAX_DAYS ? 'day' : 'month',
    period,
    today,
  };
}

/** Percent change vs the previous range; null when the previous range had nothing to compare with. */
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/** Old string form ("+12%", "-5%", "0%", "—"). */
function legacyDelta(pct: number | null): string {
  if (pct === null) return '—';
  if (pct === 0) return '0%';
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function bucketKeys(range: StatsRange): string[] {
  if (range.bucket === 'day') return eachDateInRange(range.from, range.to);
  const keys: string[] = [];
  let [y, m] = range.from.slice(0, 7).split('-').map(Number);
  const [ey, em] = range.to.slice(0, 7).split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

function bucketLabel(key: string, bucket: 'day' | 'month', multiYear: boolean): string {
  const [y, m, d] = key.split('-').map(Number);
  if (bucket === 'day') return `${d} ${MONTHS[m - 1]}`;
  return multiYear ? `${MONTHS[m - 1]} ’${String(y).slice(2)}` : MONTHS[m - 1];
}

const NUM = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

type RevenueRow = { _id: 'current' | 'previous'; total: number; gst: number; coupon: number; jobs: number; couponJobs: number };
type SeriesRow = { _id: string; total?: number; gst?: number; jobs?: number; count?: number };
type CreatedRow = { _id: { period: 'current' | 'previous'; status: string }; count: number };
type RankRow = { _id: Types.ObjectId | null; jobs: number; revenue: number; name?: string; phone?: string; rating?: number; displayRating?: number };
type SplitRow = { _id: string | null; count: number; amount: number };

type BookingFacet = {
  revenue: RevenueRow[];
  revenueSeries: SeriesRow[];
  bookingsSeries: SeriesRow[];
  created: CreatedRow[];
  topServices: RankRow[];
  topCustomers: RankRow[];
  leaderboard: RankRow[];
  paymentMethods: SplitRow[];
  paymentStatus: SplitRow[];
};

function withUser(as: string) {
  return [
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as } },
    {
      $addFields: {
        name: { $ifNull: [{ $arrayElemAt: [`$${as}.name`, 0] }, ''] },
        phone: { $arrayElemAt: [`$${as}.phone`, 0] },
        rating: { $arrayElemAt: [`$${as}.rating`, 0] },
        displayRating: { $arrayElemAt: [`$${as}.displayRating`, 0] },
      },
    },
    { $project: { [as]: 0 } },
  ];
}

/** One pass over the bookings in (previous range ∪ range) — every range-based number comes from it. */
function bookingFacetPipeline(range: StatsRange) {
  const fmt = range.bucket === 'day' ? '%Y-%m-%d' : '%Y-%m';
  const doneInRange = { status: 'completed', _doneAt: { $gte: range.start, $lt: range.end } };
  const money = (field: string) => ({ $sum: { $ifNull: [field, 0] } });
  return [
    {
      $match: {
        $or: [
          { createdAt: { $gte: range.prevStart, $lt: range.end } },
          { status: 'completed', workCompletedAt: { $gte: range.prevStart, $lt: range.end } },
          { status: 'completed', workCompletedAt: null, updatedAt: { $gte: range.prevStart, $lt: range.end } },
        ],
      },
    },
    { $addFields: { _doneAt: { $ifNull: ['$workCompletedAt', '$updatedAt'] } } },
    {
      $facet: {
        revenue: [
          { $match: { status: 'completed', _doneAt: { $gte: range.prevStart, $lt: range.end } } },
          {
            $group: {
              _id: { $cond: [{ $gte: ['$_doneAt', range.start] }, 'current', 'previous'] },
              total: money('$amount.total'),
              gst: money('$amount.gst'),
              coupon: money('$amount.coupon'),
              jobs: { $sum: 1 },
              couponJobs: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$amount.coupon', 0] }, 0] }, 1, 0] } },
            },
          },
        ],
        revenueSeries: [
          { $match: doneInRange },
          {
            $group: {
              _id: { $dateToString: { format: fmt, date: '$_doneAt', timezone: BUSINESS_TZ } },
              total: money('$amount.total'),
              gst: money('$amount.gst'),
              jobs: { $sum: 1 },
            },
          },
        ],
        bookingsSeries: [
          { $match: { createdAt: { $gte: range.start, $lt: range.end } } },
          {
            $group: {
              _id: { $dateToString: { format: fmt, date: '$createdAt', timezone: BUSINESS_TZ } },
              count: { $sum: 1 },
            },
          },
        ],
        created: [
          { $match: { createdAt: { $gte: range.prevStart, $lt: range.end } } },
          {
            $group: {
              _id: {
                period: { $cond: [{ $gte: ['$createdAt', range.start] }, 'current', 'previous'] },
                status: '$status',
              },
              count: { $sum: 1 },
            },
          },
        ],
        topServices: [
          { $match: doneInRange },
          { $group: { _id: '$serviceId', jobs: { $sum: 1 }, revenue: money('$amount.total') } },
          { $sort: { revenue: -1, jobs: -1 } },
          { $limit: 8 },
          { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'svc' } },
          { $addFields: { name: { $ifNull: [{ $arrayElemAt: ['$svc.name', 0] }, 'Service'] } } },
          { $project: { svc: 0 } },
        ],
        topCustomers: [
          { $match: doneInRange },
          { $group: { _id: '$customerId', jobs: { $sum: 1 }, revenue: money('$amount.total') } },
          { $sort: { revenue: -1, jobs: -1 } },
          { $limit: 8 },
          ...withUser('person'),
        ],
        leaderboard: [
          { $match: { ...doneInRange, technicianId: { $ne: null } } },
          { $group: { _id: '$technicianId', jobs: { $sum: 1 }, revenue: money('$amount.total') } },
          { $sort: { jobs: -1, revenue: -1 } },
          { $limit: 10 },
          ...withUser('person'),
        ],
        paymentMethods: [
          { $match: doneInRange },
          { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: money('$amount.total') } },
          { $sort: { count: -1 } },
        ],
        paymentStatus: [
          { $match: doneInRange },
          { $group: { _id: { $ifNull: ['$paymentStatus', 'unpaid'] }, count: { $sum: 1 }, amount: money('$amount.total') } },
        ],
      },
    },
  ];
}

type StatusRow = { _id: string; count: number; total: number; unassigned: number; today: number; overdue: number };

function statusPipeline(today: string) {
  return [
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: { $ifNull: ['$amount.total', 0] } },
        unassigned: { $sum: { $cond: [{ $ifNull: ['$technicianId', false] }, 0, 1] } },
        today: { $sum: { $cond: [{ $eq: ['$schedule.date', today] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [{ $and: [{ $gt: ['$schedule.date', ''] }, { $lt: ['$schedule.date', today] }] }, 1, 0],
          },
        },
      },
    },
  ];
}

const POPULATE_PERSON = '-passwordHash';

/** GET /stats/admin — everything the dashboard and the reports screen show for one range. */
export async function adminDashboard(query: Query) {
  const range = parseStatsRange(query);
  const { start, end, prevStart, today } = range;

  const [
    facetRows,
    statusRows,
    peopleRows,
    reviewRows,
    leaveRows,
    offerRows,
    serviceRows,
    todaySchedule,
    pendingRecent,
    recent,
    settings,
  ] = await Promise.all([
    Booking.aggregate<BookingFacet>(bookingFacetPipeline(range) as never[]),
    Booking.aggregate<StatusRow>(statusPipeline(today) as never[]),
    User.aggregate<{
      roles: { _id: string; count: number; active: number }[];
      newCustomers: { _id: 'current' | 'previous'; count: number }[];
    }>([
      { $match: { role: { $in: ['customer', 'technician'] } } },
      {
        $facet: {
          roles: [
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: { $sum: { $cond: [{ $ne: ['$disabled', true] }, 1, 0] } },
              },
            },
          ],
          newCustomers: [
            { $match: { role: 'customer', createdAt: { $gte: prevStart, $lt: end } } },
            { $group: { _id: { $cond: [{ $gte: ['$createdAt', start] }, 'current', 'previous'] }, count: { $sum: 1 } } },
          ],
        },
      },
    ]),
    Review.aggregate<{
      allTime: { count: number; avg: number | null }[];
      inRange: { _id: 'current' | 'previous'; count: number; avg: number | null; low: number }[];
      byTech: { _id: Types.ObjectId; count: number; avg: number | null }[];
    }>([
      { $match: { hidden: { $ne: true } } },
      {
        $facet: {
          allTime: [{ $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$stars' } } }],
          inRange: [
            { $match: { createdAt: { $gte: prevStart, $lt: end } } },
            {
              $group: {
                _id: { $cond: [{ $gte: ['$createdAt', start] }, 'current', 'previous'] },
                count: { $sum: 1 },
                avg: { $avg: '$stars' },
                low: { $sum: { $cond: [{ $lte: ['$stars', 2] }, 1, 0] } },
              },
            },
          ],
          byTech: [
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: '$technicianId', count: { $sum: 1 }, avg: { $avg: '$stars' } } },
          ],
        },
      },
    ]),
    LeaveRequest.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          $or: [{ status: 'pending' }, { status: 'approved', from: { $lte: today }, to: { $gte: today } }],
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Offer.aggregate<{ total: number; active: number; uses: number }>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$active', true] },
                    { $or: [{ $eq: [{ $ifNull: ['$expiresAt', null] }, null] }, { $gte: ['$expiresAt', new Date()] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          uses: { $sum: { $ifNull: ['$useCount', 0] } },
        },
      },
    ]),
    Service.aggregate<{ total: number; active: number }>([
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] } } } },
    ]),
    Booking.find({ 'schedule.date': today, status: { $ne: 'cancelled' } })
      .populate('serviceId')
      .populate('customerId', POPULATE_PERSON)
      .populate('technicianId', POPULATE_PERSON)
      .sort({ 'schedule.slot': 1, 'schedule.time': 1, createdAt: 1 })
      .limit(60),
    Booking.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('serviceId')
      .populate('customerId', POPULATE_PERSON)
      .populate('technicianId', POPULATE_PERSON),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('serviceId')
      .populate('customerId', POPULATE_PERSON)
      .populate('technicianId', POPULATE_PERSON),
    getBusinessSettings(),
  ]);

  const facet: BookingFacet = facetRows[0] ?? {
    revenue: [],
    revenueSeries: [],
    bookingsSeries: [],
    created: [],
    topServices: [],
    topCustomers: [],
    leaderboard: [],
    paymentMethods: [],
    paymentStatus: [],
  };

  /* Revenue ------------------------------------------------------------ */
  const revenueBy = new Map(facet.revenue.map((r) => [r._id, r]));
  const cur = revenueBy.get('current');
  const prev = revenueBy.get('previous');
  const total = NUM(cur?.total);
  const gst = NUM(cur?.gst);
  const jobs = NUM(cur?.jobs);
  const prevTotal = NUM(prev?.total);
  const prevGst = NUM(prev?.gst);
  const prevJobs = NUM(prev?.jobs);
  const aov = jobs ? Math.round(total / jobs) : 0;
  const prevAov = prevJobs ? Math.round(prevTotal / prevJobs) : 0;
  const revenue = {
    total,
    net: total - gst,
    gst,
    coupon: NUM(cur?.coupon),
    jobs,
    couponJobs: NUM(cur?.couponJobs),
    avgOrderValue: aov,
    previous: { total: prevTotal, net: prevTotal - prevGst, gst: prevGst, jobs: prevJobs, avgOrderValue: prevAov },
    delta: {
      total: pctChange(total, prevTotal),
      net: pctChange(total - gst, prevTotal - prevGst),
      jobs: pctChange(jobs, prevJobs),
      avgOrderValue: pctChange(aov, prevAov),
    },
  };

  /* Bookings created in range ------------------------------------------ */
  const createdCur: Record<string, number> = {};
  const createdPrev: Record<string, number> = {};
  for (const row of facet.created) {
    const bucket = row._id.period === 'current' ? createdCur : createdPrev;
    bucket[row._id.status] = (bucket[row._id.status] ?? 0) + row.count;
  }
  const sumValues = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
  const created = sumValues(createdCur);
  const createdPrevTotal = sumValues(createdPrev);
  const rate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const bookings = {
    created,
    previous: createdPrevTotal,
    delta: pctChange(created, createdPrevTotal),
    byStatus: PIPELINE_STATUSES.map((status) => ({ status, count: createdCur[status] ?? 0 })),
    completionRate: rate(createdCur.completed ?? 0, created),
    cancellationRate: rate(createdCur.cancelled ?? 0, created),
    previousCancellationRate: rate(createdPrev.cancelled ?? 0, createdPrevTotal),
  };

  /* Chart series --------------------------------------------------------- */
  const revSeries = new Map(facet.revenueSeries.map((r) => [r._id, r]));
  const bookSeries = new Map(facet.bookingsSeries.map((r) => [r._id, r]));
  const multiYear = range.from.slice(0, 4) !== range.to.slice(0, 4);
  const series = bucketKeys(range).map((key) => {
    const r = revSeries.get(key);
    const t = NUM(r?.total);
    const g = NUM(r?.gst);
    return {
      key,
      label: bucketLabel(key, range.bucket, multiYear),
      revenue: t,
      net: t - g,
      gst: g,
      jobs: NUM(r?.jobs),
      bookings: NUM(bookSeries.get(key)?.count),
    };
  });

  /* Right-now snapshot --------------------------------------------------- */
  const allTime = new Map(statusRows.map((r) => [String(r._id), r]));
  const count = (s: string) => allTime.get(s)?.count ?? 0;
  const snapshot = {
    pending: count('pending'),
    confirmed: count('confirmed'),
    inProgress: count('in_progress'),
    awaitingVerification: count('awaiting_verification'),
    activeJobs: count('confirmed') + count('in_progress') + count('awaiting_verification'),
    open: OPEN_STATUSES.reduce((s, st) => s + count(st), 0),
    unassigned: OPEN_STATUSES.reduce((s, st) => s + (allTime.get(st)?.unassigned ?? 0), 0),
    todayVisits: statusRows.filter((r) => r._id !== 'cancelled').reduce((s, r) => s + r.today, 0),
    overdue: (allTime.get('pending')?.overdue ?? 0) + (allTime.get('confirmed')?.overdue ?? 0),
  };

  /* People ------------------------------------------------------------------ */
  const people = peopleRows[0] ?? { roles: [], newCustomers: [] };
  const roles = new Map(people.roles.map((r) => [r._id, r]));
  const newCur = people.newCustomers.find((r) => r._id === 'current')?.count ?? 0;
  const newPrev = people.newCustomers.find((r) => r._id === 'previous')?.count ?? 0;
  const leaveBy = new Map(leaveRows.map((r) => [r._id, r.count]));
  const peopleOut = {
    newCustomers: newCur,
    previousNewCustomers: newPrev,
    delta: pctChange(newCur, newPrev),
    totalCustomers: roles.get('customer')?.count ?? 0,
    totalTechnicians: roles.get('technician')?.count ?? 0,
    activeTechnicians: roles.get('technician')?.active ?? 0,
    techniciansOnLeaveToday: leaveBy.get('approved') ?? 0,
  };

  /* Reviews ----------------------------------------------------------------- */
  const reviewFacet = reviewRows[0] ?? { allTime: [], inRange: [], byTech: [] };
  const revCur = reviewFacet.inRange.find((r) => r._id === 'current');
  const revPrev = reviewFacet.inRange.find((r) => r._id === 'previous');
  const reviews = {
    count: revCur?.count ?? 0,
    average: round1(NUM(revCur?.avg)),
    lowRatings: revCur?.low ?? 0,
    previousCount: revPrev?.count ?? 0,
    previousAverage: round1(NUM(revPrev?.avg)),
    allTimeCount: reviewFacet.allTime[0]?.count ?? 0,
    allTimeAverage: round1(NUM(reviewFacet.allTime[0]?.avg)),
  };
  const techReviews = new Map(reviewFacet.byTech.map((r) => [String(r._id), r]));

  /* Rankings ---------------------------------------------------------------- */
  const topServices = facet.topServices.map((s) => ({
    serviceId: String(s._id),
    name: s.name || 'Service',
    jobs: s.jobs,
    revenue: s.revenue,
    /** Legacy field (old builds): same as `jobs`. */
    count: s.jobs,
  }));
  const topCustomers = facet.topCustomers
    .filter((c) => c._id)
    .map((c) => ({ id: String(c._id), name: c.name || 'Customer', phone: c.phone, jobs: c.jobs, spend: c.revenue }));
  const leaderboard = facet.leaderboard
    .filter((t) => t._id)
    .map((t) => {
      const r = techReviews.get(String(t._id));
      return {
        id: String(t._id),
        name: t.name || 'Technician',
        phone: t.phone,
        jobs: t.jobs,
        revenue: t.revenue,
        rating: technicianPublicRating({ rating: t.rating, displayRating: t.displayRating }),
        reviewsInRange: r?.count ?? 0,
        ratingInRange: r ? round1(NUM(r.avg)) : null,
      };
    });

  const methodLabel = (key: string) => listLabel(settings.payments.methods, key);
  const paymentMethods = facet.paymentMethods.map((p) => {
    const key = p._id ?? 'unknown';
    return { key, label: key === 'unknown' ? 'Not set' : methodLabel(key), count: p.count, amount: p.amount };
  });
  const PAYMENT_STATUS_LABELS: Record<string, string> = { unpaid: 'Unpaid', paid: 'Paid', refunded: 'Refunded' };
  const paymentStatus = ['paid', 'unpaid', 'refunded'].map((key) => {
    const row = facet.paymentStatus.find((p) => (p._id ?? 'unpaid') === key);
    return { key, label: PAYMENT_STATUS_LABELS[key], count: row?.count ?? 0, amount: row?.amount ?? 0 };
  });

  const offers = offerRows[0] ?? { total: 0, active: 0, uses: 0 };
  const catalog = serviceRows[0] ?? { total: 0, active: 0 };

  const pendingCounts = {
    pending: snapshot.pending,
    unassigned: snapshot.unassigned,
    awaitingVerification: snapshot.awaitingVerification,
    overdue: snapshot.overdue,
    leaveRequests: leaveBy.get('pending') ?? 0,
    lowRatings: reviews.lowRatings,
  };

  const pendingBookings = pendingRecent.map((b) => formatBooking(b));
  const statusBreakdown = PIPELINE_STATUSES.map((status) => ({
    status,
    count: count(status),
    periodCount: createdCur[status] ?? 0,
  }));
  const methodCount = (key: string) => paymentMethods.find((p) => p.key === key)?.count ?? 0;

  return {
    range: {
      from: range.from,
      to: range.to,
      days: range.days,
      bucket: range.bucket,
      previousFrom: range.prevFrom,
      previousTo: range.prevTo,
    },
    today,
    timeZone: BUSINESS_TZ,
    generatedAt: new Date().toISOString(),
    revenue,
    bookings,
    people: peopleOut,
    snapshot,
    reviews,
    series,
    topServices,
    topCustomers,
    leaderboard,
    payments: { methods: paymentMethods, statuses: paymentStatus },
    catalog: {
      services: catalog.total,
      activeServices: catalog.active,
      offers: offers.total,
      activeOffers: offers.active,
      offerRedemptions: offers.uses,
    },
    todaySchedule: todaySchedule.map((b) => formatBooking(b)),
    pendingQueue: { counts: pendingCounts, bookings: pendingBookings },

    /* Legacy fields — older app builds read these. ------------------------- */
    period: range.period,
    totalBookings: statusRows.reduce((s, r) => s + r.count, 0),
    byStatus: Object.fromEntries(statusRows.map((r) => [String(r._id), r.count])),
    statusBreakdown,
    periodPending: createdCur.pending ?? 0,
    pendingBookings,
    revenueCompleted: allTime.get('completed')?.total ?? 0,
    periodRevenue: revenue.total,
    periodBookings: created,
    customers: peopleOut.totalCustomers,
    technicians: peopleOut.totalTechnicians,
    recentBookings: recent.map((b) => formatBooking(b)),
    revenueByMonth: series.map((s) => ({ label: s.label, amount: s.revenue })),
    deltas: {
      revenue: legacyDelta(revenue.delta.total),
      bookings: legacyDelta(bookings.delta),
      activeJobs: '—',
      customers: legacyDelta(peopleOut.delta),
      pending: legacyDelta(pctChange(createdCur.pending ?? 0, createdPrev.pending ?? 0)),
    },
    analytics: {
      reviews: { total: reviews.allTimeCount, averageRating: reviews.allTimeAverage, periodCount: reviews.count },
      offers: { total: offers.total, active: offers.active, totalRedemptions: offers.uses },
      catalog: { totalServices: catalog.total, activeServices: catalog.active },
      performance: {
        completionRate: bookings.completionRate,
        cancellationRate: bookings.cancellationRate,
        avgOrderValue: revenue.avgOrderValue,
        couponBookings: revenue.couponJobs,
      },
      paymentSplit: { upi_card: methodCount('upi_card'), pay_after: methodCount('pay_after') },
      topTechnicians: leaderboard.map((t) => ({ id: t.id, name: t.name, jobs: t.jobs, revenue: t.revenue })),
      topCustomers: topCustomers.map((c) => ({ id: c.id, name: c.name, bookings: c.jobs, spend: c.spend })),
      bookingsTrend: series.map((s) => ({ label: s.label, count: s.bookings })),
    },
  };
}

/**
 * GET /stats/admin/team-attendance — `from` / `to` (at most 366 days) or legacy `period`.
 * Per technician present / absent / leave days and rate, plus team totals.
 */
export async function teamAttendance(query: Query) {
  const range = parseStatsRange(query, 366);
  const { from, to, today } = range;

  const [technicians, records] = await Promise.all([
    User.find({ role: 'technician', disabled: { $ne: true } }).select('name').sort({ name: 1 }),
    TechnicianAttendance.find({ date: { $gte: from, $lte: to } }),
  ]);

  const byTech = new Map<string, typeof records>();
  for (const r of records) {
    const key = String(r.technicianId);
    const list = byTech.get(key) ?? [];
    list.push(r);
    byTech.set(key, list);
  }

  let checkedInToday = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  const rows = technicians.map((tech) => {
    const own = byTech.get(String(tech._id)) ?? [];
    const stats = computeAttendanceAnalytics(buildAttendanceCalendar(own, from, to, today), today);
    if (own.some((r) => r.date === today && r.status === 'present')) checkedInToday += 1;
    totalPresent += stats.daysPresent;
    totalAbsent += stats.daysAbsent;
    return {
      id: String(tech._id),
      name: tech.name,
      present: stats.daysPresent,
      absent: stats.daysAbsent,
      leave: stats.daysLeave,
      rate: stats.attendanceRate,
    };
  });

  const lowAttendance = rows
    .filter((r) => r.present + r.absent >= 3 && r.rate < 80)
    .map((r) => ({ id: r.id, name: r.name, rate: r.rate }))
    .sort((a, b) => a.rate - b.rate);

  return {
    period: range.period,
    month: today.slice(0, 7),
    from,
    to,
    totalTechnicians: technicians.length,
    checkedInToday,
    averageAttendanceRate:
      totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0,
    lowAttendance,
    technicians: rows,
  };
}
