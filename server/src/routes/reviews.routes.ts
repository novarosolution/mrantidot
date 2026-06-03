import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { formatReview } from '../utils/format';

export const reviewsRouter = Router();

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

    const review = await Review.create({
      bookingId: booking._id,
      technicianId: booking.technicianId,
      customerId: booking.customerId,
      stars: req.body.stars,
      tags: req.body.tags ?? [],
      comment: req.body.comment,
      photos: req.body.photos ?? [],
    });

    const agg = await Review.aggregate([
      { $match: { technicianId: booking.technicianId } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]);

    const avg = agg[0]?.avg ?? req.body.stars;
    await User.findByIdAndUpdate(booking.technicianId, {
      rating: Math.round(avg * 10) / 10,
      $inc: { jobsDone: 1 },
    });

    res.status(201).json({ review: formatReview(review) });
  }),
);

reviewsRouter.get(
  '/technician/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ technicianId: req.params.id }).sort({ createdAt: -1 });
    res.json({ reviews: reviews.map((r) => formatReview(r)) });
  }),
);

reviewsRouter.get(
  '/booking/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const review = await Review.findOne({ bookingId: req.params.id });
    if (!review) {
      throw new AppError(404, 'Review not found');
    }
    res.json({ review: formatReview(review) });
  }),
);
