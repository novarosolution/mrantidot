import { Router } from 'express';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

export const techniciansRouter = Router();

/** Public technician profiles for customer booking (no email/password). */
techniciansRouter.get(
  '/available',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (_req, res) => {
    const technicians = await User.find({
      role: 'technician',
      available: { $ne: false },
      disabled: { $ne: true },
    })
      .select('name rating jobsDone city')
      .sort({ rating: -1, jobsDone: -1, name: 1 });

    res.json({
      technicians: technicians.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        rating: t.rating ?? 0,
        jobsDone: t.jobsDone ?? 0,
        city: t.city,
      })),
    });
  }),
);
