import '../types/express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { BROADCAST_AUDIENCES, Broadcast, formatBroadcast, type BroadcastAudience } from '../models/Broadcast';
import type { INotificationLink } from '../models/Notification';
import { Notification } from '../models/Notification';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { notifyUsersBulk } from '../utils/notifications';

/**
 * Admin broadcasts — an in-app notice to many people at once. Mounted at /api/admin/broadcast.
 *
 *   POST /api/admin/broadcast
 *        { audience: 'customers' | 'technicians' | 'everyone' | 'user', userId?,
 *          title (≤ 80), body (≤ 300),
 *          link?: { kind: 'none' | 'service' | 'offers' | 'url', serviceId?, url? (https) } }
 *        → 201 { broadcast, recipientCount }      (at most 5 per hour per admin → 429)
 *   GET  /api/admin/broadcast?page&limit          → { broadcasts, total, page, limit, hasMore }
 *   GET  /api/admin/broadcast/preview?audience&userId → { audience, count, user? }
 *
 * Every recipient gets a notification with type 'broadcast', the link and `broadcastId`.
 * "Everyone" = all active customers and technicians.
 */
export const broadcastRouter = Router();

broadcastRouter.use(requireAuth, requireRole('admin'));

const MAX_PER_HOUR = 5;
const TITLE_MAX = 80;
const BODY_MAX = 300;

const AUDIENCE_WORDS: Record<BroadcastAudience, string> = {
  customers: 'customers',
  technicians: 'technicians',
  everyone: 'customers and technicians',
  user: 'person',
};

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

function isAudience(value: unknown): value is BroadcastAudience {
  return typeof value === 'string' && (BROADCAST_AUDIENCES as readonly string[]).includes(value);
}

/** Active accounts the audience covers. */
function recipientFilter(audience: BroadcastAudience, userId?: string): Record<string, unknown> {
  const active = { disabled: { $ne: true } };
  if (audience === 'customers') return { role: 'customer', ...active };
  if (audience === 'technicians') return { role: 'technician', ...active };
  if (audience === 'everyone') return { role: { $in: ['customer', 'technician'] }, ...active };
  return { _id: new Types.ObjectId(userId), ...active };
}

async function resolveAudience(audience: unknown, userId: unknown) {
  if (!isAudience(audience)) throw new AppError(400, 'Pick who should get this message');
  if (audience !== 'user') return { audience, filter: recipientFilter(audience), user: undefined };
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw new AppError(400, 'Pick the person to send this to');
  }
  const user = await User.findById(userId).select('name role disabled');
  if (!user) throw new AppError(404, 'User not found');
  if (user.disabled === true) throw new AppError(400, 'This account is disabled');
  return { audience, filter: recipientFilter('user', userId), user };
}

/** Optional link: a service page, the offers screen or an https page. */
async function parseLink(raw: unknown): Promise<INotificationLink | undefined> {
  if (!raw || typeof raw !== 'object') return undefined;
  const link = raw as Record<string, unknown>;
  const kind = typeof link.kind === 'string' ? link.kind : 'none';
  if (kind === 'none' || !kind) return undefined;
  if (kind === 'offers') return { kind: 'offers', label: 'Offers' };
  if (kind === 'service') {
    const id = typeof link.serviceId === 'string' ? link.serviceId : '';
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Pick the service to link to');
    const service = await Service.findOne({ _id: id, active: true }).select('name');
    if (!service) throw new AppError(400, 'That service is not available — pick an active one');
    return { kind: 'service', serviceId: service._id as Types.ObjectId, label: service.name };
  }
  if (kind === 'url') {
    const url = typeof link.url === 'string' ? link.url.trim() : '';
    let parsed: URL | undefined;
    try {
      parsed = new URL(url);
    } catch {
      parsed = undefined;
    }
    if (!parsed || parsed.protocol !== 'https:' || url.length > 500) {
      throw new AppError(400, 'Links must be a full web address starting with https://');
    }
    return { kind: 'url', url, label: parsed.hostname };
  }
  throw new AppError(400, 'Unknown link type');
}

broadcastRouter.get(
  '/preview',
  asyncHandler(async (req, res) => {
    const { audience, filter, user } = await resolveAudience(req.query.audience, req.query.userId);
    const count = await User.countDocuments(filter);
    res.json({
      audience,
      count,
      ...(user ? { user: { id: String(user._id), name: user.name, role: user.role } } : {}),
    });
  }),
);

broadcastRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 50);
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const [docs, total] = await Promise.all([
      Broadcast.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Broadcast.countDocuments(),
    ]);
    const ids = docs.map((d) => d._id);
    const reads = ids.length
      ? await Notification.aggregate<{ _id: Types.ObjectId; n: number }>([
          { $match: { broadcastId: { $in: ids }, read: true } },
          { $group: { _id: '$broadcastId', n: { $sum: 1 } } },
        ])
      : [];
    const readById = new Map(reads.map((r) => [String(r._id), r.n]));
    res.json({
      broadcasts: docs.map((d) => formatBroadcast(d, readById.get(String(d._id)) ?? 0)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  }),
);

broadcastRouter.post(
  '/',
  body('title').isString().trim().notEmpty().withMessage('Add a title').isLength({ max: TITLE_MAX }).withMessage(`Keep the title under ${TITLE_MAX} characters`),
  body('body').isString().trim().notEmpty().withMessage('Add a message').isLength({ max: BODY_MAX }).withMessage(`Keep the message under ${BODY_MAX} characters`),
  body('audience').isIn([...BROADCAST_AUDIENCES]).withMessage('Pick who should get this message'),
  body('userId').optional({ values: 'falsy' }).isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const senderId = req.user!.id;
    const recent = await Broadcast.countDocuments({
      senderId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recent >= MAX_PER_HOUR) {
      throw new AppError(429, `You can send up to ${MAX_PER_HOUR} broadcasts an hour. Please try again later.`, 'BROADCAST_LIMIT');
    }

    const { audience, filter, user } = await resolveAudience(req.body.audience, req.body.userId);
    const link = await parseLink(req.body.link);
    const title = String(req.body.title).trim();
    const text = String(req.body.body).trim();

    const recipients = await User.find(filter).select('_id').lean<{ _id: Types.ObjectId }[]>();
    if (recipients.length === 0) throw new AppError(400, 'Nobody matches this audience yet');

    const sender = await User.findById(senderId).select('name');
    const broadcast = await Broadcast.create({
      senderId,
      senderName: sender?.name ?? '',
      audience,
      ...(user ? { userId: user._id, userName: user.name } : {}),
      title,
      body: text,
      ...(link ? { link } : {}),
      recipientCount: 0,
    });

    let recipientCount = 0;
    try {
      recipientCount = await notifyUsersBulk(
        recipients.map((r) => r._id),
        { title, body: text, type: 'broadcast', link, broadcastId: broadcast._id as Types.ObjectId },
      );
    } finally {
      broadcast.recipientCount = recipientCount;
      await broadcast.save();
    }

    res.locals.activity = {
      summary:
        audience === 'user'
          ? `Sent broadcast “${title}” to ${user?.name ?? 'one person'}`
          : `Sent broadcast “${title}” to ${recipientCount} ${AUDIENCE_WORDS[audience]}`,
      targetId: String(broadcast._id),
      targetType: 'broadcast',
      targetLabel: title,
      fields: ['audience', 'title', 'body', ...(link ? ['link'] : [])],
    };
    res.status(201).json({ broadcast: formatBroadcast(broadcast), recipientCount });
  }),
);
