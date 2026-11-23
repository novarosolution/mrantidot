import '../types/express';
import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';

/**
 * The signed-in person's in-app inbox (every role).
 *
 *   GET    /notifications?limit&before&beforeId   newest first; limit 0–100 (default 50, 0 = counts only).
 *          → { notifications, unreadCount, total, hasMore, nextCursor: { before, beforeId } | null }
 *          Pass `nextCursor` back as before / beforeId for the next page.
 *   PATCH  /notifications/read-all · /notifications/:id/read
 *   DELETE /notifications/read      removes every read notification → { deleted }
 *   DELETE /notifications/:id       removes one → { ok: true }
 */
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
    const userId = new Types.ObjectId(req.user!.id);
    const rawLimit = parseInt(String(req.query.limit ?? '50'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 0), 100) : 50;

    const before = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
    const beforeId =
      typeof req.query.beforeId === 'string' && Types.ObjectId.isValid(req.query.beforeId)
        ? new Types.ObjectId(req.query.beforeId)
        : undefined;
    const filter: Record<string, unknown> = { userId };
    if (before && !Number.isNaN(before.getTime())) {
      filter.$or = beforeId
        ? [{ createdAt: { $lt: before } }, { createdAt: before, _id: { $lt: beforeId } }]
        : [{ createdAt: { $lt: before } }];
    }

    const [docs, unreadCount, total] = await Promise.all([
      limit > 0
        ? Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1)
        : Promise.resolve([]),
      Notification.countDocuments({ userId, read: false }),
      Notification.countDocuments({ userId }),
    ]);
    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit);
    const last = page[page.length - 1];
    res.json({
      notifications: page.map((n) => n.toJSON()),
      unreadCount,
      total,
      hasMore,
      nextCursor: hasMore && last ? { before: last.createdAt.toISOString(), beforeId: String(last._id) } : null,
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

// Registered before "/:id" so "read" is never taken for an id.
notificationsRouter.delete(
  '/read',
  asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({ userId: req.user!.id, read: true });
    res.json({ deleted: result.deletedCount ?? 0 });
  }),
);

notificationsRouter.delete(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const result = await Notification.deleteOne({ _id: req.params.id, userId: req.user!.id });
    if (!result.deletedCount) throw new AppError(404, 'Notification not found');
    res.json({ ok: true });
  }),
);
