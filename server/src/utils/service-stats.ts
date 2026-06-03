import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';

export type ServiceStatsResult = {
  bookingCount: number;
  avgRating: number | null;
  reviewCount: number;
};

const EMPTY_STATS: ServiceStatsResult = {
  bookingCount: 0,
  avgRating: null,
  reviewCount: 0,
};

export async function getServiceStats(serviceId: string): Promise<ServiceStatsResult> {
  const batch = await getStatsForServiceIds([serviceId]);
  return batch[serviceId] ?? EMPTY_STATS;
}

/** Batch stats for service list screens (single aggregation pass). */
export async function getStatsForServiceIds(
  serviceIds: string[],
): Promise<Record<string, ServiceStatsResult>> {
  if (!serviceIds.length) return {};

  const oids = serviceIds.map((id) => new Types.ObjectId(id));
  const [bookingRows, reviewRows] = await Promise.all([
    Booking.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { serviceId: { $in: oids }, status: 'completed' } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
    ]),
    Review.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
      { $match: { hidden: { $ne: true } } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking',
        },
      },
      { $unwind: '$booking' },
      { $match: { 'booking.serviceId': { $in: oids } } },
      { $group: { _id: '$booking.serviceId', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]),
  ]);

  const out: Record<string, ServiceStatsResult> = {};
  for (const id of serviceIds) {
    out[id] = { ...EMPTY_STATS };
  }
  for (const row of bookingRows) {
    const id = String(row._id);
    if (out[id]) out[id].bookingCount = row.count;
  }
  for (const row of reviewRows) {
    const id = String(row._id);
    if (out[id]) {
      out[id].avgRating = Math.round(row.avg * 10) / 10;
      out[id].reviewCount = row.count;
    }
  }
  return out;
}
