import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Review, publicReviewReply } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { formatReview } from '../utils/format';
import { getBusinessSettings } from '../utils/businessSettings';

export const reviewsRouter = Router();

/**
 * Review tags must be ones the admin offers (Business settings → Lists → Review tags). Matching ignores
 * case and spacing and stores the admin's wording; unknown tags (e.g. from an app with an older list) are
 * dropped instead of failing the review.
 */
async function allowedReviewTags(raw: unknown): Promise<string[]> {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const { lists } = await getBusinessSettings();
  const byKey = new Map(lists.reviewTags.map((t) => [t.trim().toLowerCase(), t]));
  const out: string[] = [];
  for (const tag of raw) {
    if (typeof tag !== 'string') continue;
    const match = byKey.get(tag.trim().toLowerCase());
    if (match && !out.includes(match)) out.push(match);
  }
  return out.slice(0, 20);
}

function runValidation(
  req: Parameters<typeof validationResult>[0],
  res: { status: (n: number) => { json: (o: object) => void } },
  next: () => void,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0]?.msg ?? 'Validation failed' });
    return;
  }
  next();
}

/**
 * A technician's real rating = average of their visible reviews (0 when none). Run after a review is
 * added, hidden / shown or deleted. Returns the new rating.
 */
export async function recomputeTechnicianRating(technicianId: unknown): Promise<number> {
  if (!technicianId) return 0;
  const id = new Types.ObjectId(String(technicianId));
  const agg = await Review.aggregate([
    { $match: { technicianId: id, hidden: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);
  const rating = Math.round((agg[0]?.avg ?? 0) * 10) / 10;
  await User.findByIdAndUpdate(id, { rating });
  return rating;
}

reviewsRouter.post(
  '/',
  requireAuth,
  requireRole('customer'),
  body('bookingId').isMongoId(),
  body('stars').isInt({ min: 1, max: 5 }),
  body('tags').optional().isArray(),
  body('comment').optional().isString(),
  body('photos').optional().isArray(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.body.bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.customerId.toString() !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }

    if (booking.status !== 'completed') {
      throw new AppError(400, 'Booking must be completed to review');
    }

    if (!booking.technicianId) {
      throw new AppError(400, 'No technician assigned');
    }

    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      throw new AppError(400, 'Review already exists for this booking');
    }

    const tags = await allowedReviewTags(req.body.tags);

    let review;
    try {
      review = await Review.create({
        bookingId: booking._id,
        technicianId: booking.technicianId,
        customerId: booking.customerId,
        stars: req.body.stars,
        tags,
        comment: req.body.comment,
        photos: req.body.photos ?? [],
      });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        throw new AppError(400, 'Review already exists for this booking');
      }
      throw err;
    }

    await recomputeTechnicianRating(booking.technicianId);

    res.status(201).json({ review: formatReview(review) });
  }),
);

reviewsRouter.get(
  '/technician/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({
      technicianId: req.params.id,
      hidden: { $ne: true },
    }).sort({ createdAt: -1 });
    res.json({ reviews: reviews.map((r) => ({ ...formatReview(r), reply: publicReviewReply(r.reply) })) });
  }),
);

reviewsRouter.get(
  '/booking/:id',
  requireAuth,
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const { role, id } = req.user!;
    const customerId = booking.customerId.toString();
    const techId = booking.technicianId?.toString();
    const allowed =
      role === 'admin' ||
      customerId === id ||
      (role === 'technician' && techId === id);
    if (!allowed) {
      throw new AppError(403, 'Access denied');
    }

    const review = await Review.findOne({
      bookingId: req.params.id,
      ...(role === 'admin' ? {} : { hidden: { $ne: true } }),
    });
    // No review yet is a normal state for this existence check, not an error — 200 + null.
    res.json({ review: review ? { ...formatReview(review), reply: publicReviewReply(review.reply) } : null });
  }),
);
