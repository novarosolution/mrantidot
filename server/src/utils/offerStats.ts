import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { User } from '../models/User';

/**
 * Coupon usage from the bookings that carry the code (`Booking.couponCode`, saved as the customer typed it,
 * so matching ignores case and spaces). Cancelled bookings don't count as uses or discount given.
 */
export type OfferStats = {
  /** Bookings with the code that were not cancelled. */
  uses: number;
  completed: number;
  cancelled: number;
  /** ₹ taken off across the uses. */
  discountGiven: number;
  /** ₹ total (incl. GST) of the completed bookings with the code. */
  revenue: number;
  /** ₹ total of every booking with the code that was not cancelled. */
  bookedValue: number;
  customers: number;
  /** ISO time of the newest booking with the code (cancelled ones included). */
  lastUsedAt: string | null;
};

export const EMPTY_OFFER_STATS: OfferStats = {
  uses: 0,
  completed: 0,
  cancelled: 0,
  discountGiven: 0,
  revenue: 0,
  bookedValue: 0,
  customers: 0,
  lastUsedAt: null,
};

const normalizedCode = { $toUpper: { $trim: { input: { $ifNull: ['$couponCode', ''] } } } };

/** Stats per (upper-case) code; codes with no bookings get the empty stats. */
export async function offerStatsFor(codes: string[]): Promise<Map<string, OfferStats>> {
  const wanted = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  const out = new Map<string, OfferStats>(wanted.map((c) => [c, { ...EMPTY_OFFER_STATS }]));
  if (wanted.length === 0) return out;
  const rows = await Booking.aggregate<{
    _id: string;
    uses: number;
    completed: number;
    cancelled: number;
    discountGiven: number;
    revenue: number;
    bookedValue: number;
    customers: unknown[];
    lastUsedAt?: Date;
  }>([
    { $match: { couponCode: { $exists: true, $nin: [null, ''] } } },
    { $addFields: { _code: normalizedCode } },
    { $match: { _code: { $in: wanted } } },
    {
      $group: {
        _id: '$_code',
        uses: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        discountGiven: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, { $ifNull: ['$amount.coupon', 0] }, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$amount.total', 0] }, 0] } },
        bookedValue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, { $ifNull: ['$amount.total', 0] }, 0] } },
        customers: { $addToSet: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$customerId', '$$REMOVE'] } },
        lastUsedAt: { $max: '$createdAt' },
      },
    },
  ]);
  for (const r of rows) {
    out.set(r._id, {
      uses: r.uses,
      completed: r.completed,
      cancelled: r.cancelled,
      discountGiven: Math.round(r.discountGiven),
      revenue: Math.round(r.revenue),
      bookedValue: Math.round(r.bookedValue),
      customers: r.customers.length,
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
    });
  }
  return out;
}

/** True when any booking (any status) carries the code. */
export async function offerEverUsed(code: string): Promise<boolean> {
  const wanted = code.trim().toUpperCase();
  const hit = await Booking.aggregate([
    { $match: { couponCode: { $exists: true, $nin: [null, ''] } } },
    { $addFields: { _code: normalizedCode } },
    { $match: { _code: wanted } },
    { $limit: 1 },
    { $project: { _id: 1 } },
  ]);
  return hit.length > 0;
}

/** Newest bookings with the code (for the offer screen). */
export async function recentOfferBookings(code: string, limit = 5) {
  const wanted = code.trim().toUpperCase();
  const rows = await Booking.aggregate<{
    _id: unknown;
    status: string;
    createdAt: Date;
    schedule?: { date?: string };
    amount?: { coupon?: number; total?: number };
    customerId?: unknown;
    serviceId?: unknown;
  }>([
    { $match: { couponCode: { $exists: true, $nin: [null, ''] } } },
    { $addFields: { _code: normalizedCode } },
    { $match: { _code: wanted } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    { $project: { status: 1, createdAt: 1, schedule: 1, amount: 1, customerId: 1, serviceId: 1 } },
  ]);
  if (rows.length === 0) return [];
  const [people, services] = await Promise.all([
    User.find({ _id: { $in: rows.map((r) => r.customerId) } }).select('name').lean(),
    Service.find({ _id: { $in: rows.map((r) => r.serviceId) } }).select('name').lean(),
  ]);
  const personName = new Map(people.map((p) => [String(p._id), p.name]));
  const serviceName = new Map(services.map((s) => [String(s._id), s.name]));
  return rows.map((r) => {
    const id = String(r._id);
    return {
      bookingId: id,
      ref: `#${id.slice(-6).toUpperCase()}`,
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
      date: r.schedule?.date,
      customerName: personName.get(String(r.customerId)) ?? 'Customer',
      serviceName: serviceName.get(String(r.serviceId)) ?? 'Service',
      discount: Math.round(r.amount?.coupon ?? 0),
      total: Math.round(r.amount?.total ?? 0),
    };
  });
}
