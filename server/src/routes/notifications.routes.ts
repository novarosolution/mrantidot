import '../types/express';
import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

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

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user!.id, read: false });
    res.json({
      notifications: notifications.map((n) => n.toJSON()),
      unreadCount,
    });
  }),
);

notificationsRouter.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.user!.id, read: false }, { read: true });
    res.json({ ok: true });
  }),
);

notificationsRouter.patch(
  '/:id/read',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { read: true },
      { new: true },
    );
    if (!notification) throw new AppError(404, 'Notification not found');
    res.json({ notification: notification.toJSON() });
  }),
);
