import '../types/express';
import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { ACTIVITY_AREAS, ActivityLog, formatActivity, type ActivityArea } from '../models/ActivityLog';
import { AppError } from '../utils/AppError';

/**
 * Admin activity log (written by middleware/activityLog.ts). Mounted at /api/admin/activity.
 *
 *   GET /api/admin/activity?actor&area&from&to&q&page&limit&before&beforeId
 *       actor     user id of the admin
 *       area      one area or a comma list (bookings,users,services,…)
 *       from, to  ISO date-times, or YYYY-MM-DD read as that whole day in the business timezone
 *       q         text in the summary, the admin's name or the target
 *       paging    newest first; `before` + `beforeId` (from `nextCursor`) for infinite scroll,
 *                 or `page` (1-based) + `limit` (default 30, max 100)
 *   GET /api/admin/activity/actors   admins who appear in the log, with entry counts
 */
export const activityRouter = Router();

activityRouter.use(requireAuth, requireRole('admin'));

const APP_TZ = process.env.APP_TZ || 'Asia/Kolkata';
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Offset (ms) of the business timezone from UTC at a given instant. */
function tzOffsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Start of a YYYY-MM-DD day in the business timezone. */
function dayStart(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utcMidnight = new Date(Date.UTC(y, m - 1, d));
  return new Date(utcMidnight.getTime() - tzOffsetMs(utcMidnight));
}

function parseBound(value: unknown, end: boolean): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const v = value.trim();
  if (DATE_KEY.test(v)) {
    const start = dayStart(v);
    return end ? new Date(start.getTime() + 86_400_000) : start;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

activityRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};

    if (typeof req.query.actor === 'string' && req.query.actor) {
      if (!Types.ObjectId.isValid(req.query.actor)) throw new AppError(400, 'Invalid actor');
      filter.actorId = new Types.ObjectId(req.query.actor);
    }

    if (typeof req.query.area === 'string' && req.query.area) {
      const areas = req.query.area
        .split(',')
        .map((a) => a.trim())
        .filter((a): a is ActivityArea => (ACTIVITY_AREAS as readonly string[]).includes(a));
      if (areas.length === 1) filter.area = areas[0];
      else if (areas.length > 1) filter.area = { $in: areas };
    }

    const from = parseBound(req.query.from, false);
    const to = parseBound(req.query.to, true);
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = from;
    if (to) createdAt.$lt = to;
    if (Object.keys(createdAt).length) filter.createdAt = createdAt;

    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (q) {
      const rx = new RegExp(escapeRegex(q.replace(/^#/, '')), 'i');
      filter.$or = [{ summary: rx }, { actorName: rx }, { targetLabel: rx }, { targetId: rx }];
    }

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '30'), 10) || 30, 1), 100);
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);

    // Cursor paging (stable while new entries arrive): entries strictly older than the last one shown.
    const before = typeof req.query.before === 'string' ? new Date(req.query.before) : undefined;
    const beforeId = typeof req.query.beforeId === 'string' && Types.ObjectId.isValid(req.query.beforeId)
      ? new Types.ObjectId(req.query.beforeId)
      : undefined;
    const useCursor = Boolean(before && !Number.isNaN(before.getTime()));
    const pageFilter: Record<string, unknown> = useCursor
      ? {
          $and: [
            filter,
            beforeId
              ? { $or: [{ createdAt: { $lt: before } }, { createdAt: before, _id: { $lt: beforeId } }] }
              : { createdAt: { $lt: before } },
          ],
        }
      : filter;

    const [docs, total] = await Promise.all([
      ActivityLog.find(pageFilter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(useCursor ? 0 : (page - 1) * limit)
        .limit(limit + 1)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);
    const hasMore = docs.length > limit;
    const entries = docs.slice(0, limit).map((d) => formatActivity(d as unknown as Record<string, unknown> & { _id: unknown }));
    const last = entries[entries.length - 1];
    res.json({
      entries,
      total,
      page,
      limit,
      hasMore,
      nextCursor: hasMore && last ? { before: last.at, beforeId: last.id } : null,
    });
  }),
);

activityRouter.get(
  '/actors',
  asyncHandler(async (_req, res) => {
    const rows = await ActivityLog.aggregate<{ _id: Types.ObjectId; name: string; count: number; lastAt: Date }>([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$actorId', name: { $first: '$actorName' }, count: { $sum: 1 }, lastAt: { $first: '$createdAt' } } },
      { $sort: { lastAt: -1 } },
      { $limit: 200 },
    ]);
    res.json({
      actors: rows.map((r) => ({
        id: String(r._id),
        name: r.name || 'Admin',
        count: r.count,
        lastAt: r.lastAt instanceof Date ? r.lastAt.toISOString() : undefined,
      })),
    });
  }),
);
