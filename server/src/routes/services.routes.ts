import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Service } from '../models/Service';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { isServiceTypeKey, normalizeServiceTypes, SERVICE_TYPE_KEYS } from '../constants/serviceTypes';
import { formatService } from '../utils/format';
import { pickServiceContent, serviceContentRules } from '../utils/serviceContent';
import { getServiceStats, getStatsForServiceIds } from '../utils/service-stats';
import { Review, publicReviewReply } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { getOptionalUser } from '../utils/optionalAuth';
import { formatServiceStatsForRole } from '../utils/ratings';
import { revalidateWebsite } from '../utils/websiteRevalidate';
import { getBusinessSettings } from '../utils/businessSettings';

export const servicesRouter = Router();

/**
 * Category must be one of Business settings → Lists → Categories (on or off). A service keeps the
 * category it already has even after the admin removes it from the list.
 */
async function assertCategory(value: unknown, current?: string): Promise<void> {
  if (value === undefined) return;
  const key = String(value).trim().toLowerCase();
  if (current && key === current) return;
  const { lists } = await getBusinessSettings();
  if (!lists.categories.some((c) => c.key === key)) {
    throw new AppError(400, 'Pick a category from Business settings → Lists → Categories');
  }
}

const MAX_STEPS = 15;
const MAX_STEP_LENGTH = 60;

/** Visit steps: trimmed, blanks dropped, at most 15 (empty = the default Arrival … Sign-off steps). */
function cleanSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.replace(/\s+/g, ' ').trim().slice(0, MAX_STEP_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_STEPS);
}

const stepRules = [
  body('stepTemplate').optional().isArray({ max: MAX_STEPS }).withMessage(`Use at most ${MAX_STEPS} visit steps`),
  body('stepTemplate.*')
    .optional()
    .isString()
    .isLength({ max: MAX_STEP_LENGTH })
    .withMessage(`Keep each step under ${MAX_STEP_LENGTH} characters`),
];

function adminIncludeInactive(req: { query: Record<string, unknown>; headers: { authorization?: string } }): boolean {
  const flag = req.query.includeInactive === '1' || req.query.includeInactive === 'true';
  if (!flag) return false;
  const user = getOptionalUser(req as Parameters<typeof getOptionalUser>[0]);
  return user?.role === 'admin';
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

servicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string'
      ? req.query.q.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase().replace(/\s+/g, '_') : '';
    const filter: Record<string, unknown> = adminIncludeInactive(req) ? {} : { active: true };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortDesc: { $regex: q, $options: 'i' } },
        { serviceTypes: { $regex: q, $options: 'i' } },
      ];
    }
    if (type && type !== 'all' && isServiceTypeKey(type)) {
      filter.serviceTypes = type;
    }
    if (category && category !== 'All') {
      // Accepts the key or the admin's label ("Residential", "Deep clean"…).
      const { lists } = await getBusinessSettings();
      const wanted = category.toLowerCase();
      const match = lists.categories.find((c) => c.key === wanted || c.label.toLowerCase() === wanted);
      filter.category = match?.key ?? wanted;
    }
    const services = await Service.find(filter).sort({ sortOrder: 1, name: 1 });
    const includeStats =
      req.query.includeStats === '1' || req.query.includeStats === 'true';
    const viewerRole = getOptionalUser(req)?.role;
    let statsById: Record<string, Awaited<ReturnType<typeof getServiceStats>>> | undefined;
    if (includeStats && services.length) {
      statsById = await getStatsForServiceIds(services.map((s) => s._id.toString()));
    }
    res.json({
      services: services.map((s) => {
        const base = formatService(s);
        const sid = s._id.toString();
        const raw = statsById?.[sid];
        return raw
          ? { ...base, stats: formatServiceStatsForRole(raw, viewerRole) }
          : base;
      }),
    });
  }),
);

servicesRouter.get(
  '/:id/stats',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service || !service.active) {
      throw new AppError(404, 'Service not found');
    }
    const stats = await getServiceStats(req.params.id);
    const viewerRole = getOptionalUser(req)?.role;
    res.json({ stats: formatServiceStatsForRole(stats, viewerRole) });
  }),
);

servicesRouter.get(
  '/:id/reviews',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service || !service.active) {
      throw new AppError(404, 'Service not found');
    }

    const bookings = await Booking.find({ serviceId: service._id, status: 'completed' })
      .select('_id customerId')
      .limit(20);
    const bookingIds = bookings.map((b) => b._id);

    const reviews = await Review.find({ bookingId: { $in: bookingIds }, hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5);

    const customerIds = [...new Set(reviews.map((r) => r.customerId.toString()))];
    const customers = await User.find({ _id: { $in: customerIds } }).select('name');
    const nameById = new Map(customers.map((c) => [c._id.toString(), c.name?.split(' ')[0] ?? 'Customer']));

    const enriched = reviews.map((r) => ({
      id: r._id.toString(),
      stars: r.stars,
      tags: r.tags,
      comment: r.comment,
      customerName: nameById.get(r.customerId.toString()) ?? 'Customer',
      createdAt: r.createdAt,
      reply: publicReviewReply(r.reply),
    }));

    res.json({ reviews: enriched });
  }),
);

servicesRouter.get(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw new AppError(404, 'Service not found');
    }
    const user = getOptionalUser(req);
    if (!service.active && user?.role !== 'admin') {
      throw new AppError(404, 'Service not found');
    }
    res.json({ service: formatService(service) });
  }),
);

servicesRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  body('name').trim().notEmpty(),
  body('iconKey').trim().notEmpty(),
  body('basePrice').isFloat({ min: 0 }),
  body('shortDesc').trim().notEmpty(),
  ...stepRules,
  body('category').optional().isString().trim().toLowerCase().matches(/^[a-z0-9_]{1,40}$/),
  body('serviceTypes').optional().isArray(),
  body('serviceTypes.*').optional().isIn([...SERVICE_TYPE_KEYS]),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('showInPopular').optional().isBoolean(),
  body('showOnHome').optional().isBoolean(),
  ...serviceContentRules,
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    await assertCategory(req.body.category);
    if (req.body.stepTemplate !== undefined) req.body.stepTemplate = cleanSteps(req.body.stepTemplate);
    // New services go to the end of the admin's order.
    const last = await Service.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
    const payload = {
      ...req.body,
      ...pickServiceContent(req.body),
      active: true,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    };
    if (req.body.serviceTypes !== undefined) {
      payload.serviceTypes = normalizeServiceTypes(req.body.serviceTypes);
    }
    const service = await Service.create(payload);
    revalidateWebsite(['services']);
    res.status(201).json({ service: formatService(service) });
  }),
);

/** Admin: save the full display order — ids in the order they should appear. */
servicesRouter.put(
  '/order',
  requireAuth,
  requireRole('admin'),
  body('ids').isArray({ min: 1, max: 500 }),
  body('ids.*').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const ids = [...new Set(req.body.ids as string[])];
    await Service.bulkWrite(
      ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: (i + 1) * 10 } } } })),
    );
    revalidateWebsite(['services']);
    res.json({ ok: true, count: ids.length });
  }),
);

servicesRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('iconKey').optional().trim().notEmpty(),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('shortDesc').optional().trim().notEmpty(),
  ...stepRules,
  body('category').optional().isString().trim().toLowerCase().matches(/^[a-z0-9_]{1,40}$/),
  body('serviceTypes').optional().isArray(),
  body('serviceTypes.*').optional().isIn([...SERVICE_TYPE_KEYS]),
  body('active').optional().isBoolean(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('sortOrder').optional().isInt({ min: 0, max: 100000 }),
  body('showInPopular').optional().isBoolean(),
  body('showOnHome').optional().isBoolean(),
  ...serviceContentRules,
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    if (req.body.category !== undefined) {
      const existing = await Service.findById(req.params.id).select('category').lean<{ category?: string }>();
      await assertCategory(req.body.category, existing?.category);
    }
    const updates = { ...req.body, ...pickServiceContent(req.body) };
    if (req.body.serviceTypes !== undefined) {
      updates.serviceTypes = normalizeServiceTypes(req.body.serviceTypes);
    }
    if (req.body.stepTemplate !== undefined) updates.stepTemplate = cleanSteps(req.body.stepTemplate);
    const service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }
    if (typeof req.body.active === 'boolean' && Object.keys(req.body).length === 1) {
      res.locals.activity = {
        summary: req.body.active ? `Restored service ${service.name}` : `Deactivated service ${service.name}`,
        targetLabel: service.name,
        fields: ['active'],
      };
    } else {
      res.locals.activity = { summary: `Updated service ${service.name}`, targetLabel: service.name };
    }
    revalidateWebsite(['services']);
    res.json({ service: formatService(service) });
  }),
);

servicesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );
    if (!service) {
      throw new AppError(404, 'Service not found');
    }
    res.locals.activity = { summary: `Deactivated service ${service.name}`, targetLabel: service.name, fields: ['active'] };
    revalidateWebsite(['services']);
    res.json({ service: formatService(service) });
  }),
);

/**
 * Admin: copy a service — POST /services/:id/duplicate → 201 { service }. The copy is named "<name> (copy)",
 * starts switched off (customers don't see it until you turn it on), sits right after the original and is
 * not pinned to the home rail. Steps, sizes, content, photo and pest types are copied.
 */
servicesRouter.post(
  '/:id/duplicate',
  requireAuth,
  requireRole('admin'),
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const source = await Service.findById(req.params.id).lean<Record<string, unknown> & { name: string; sortOrder?: number }>();
    if (!source) throw new AppError(404, 'Service not found');
    const { _id, __v: _v, createdAt: _c, updatedAt: _u, ...fields } = source;
    let name = `${source.name} (copy)`;
    for (let n = 2; await Service.exists({ name }); n += 1) name = `${source.name} (copy ${n})`;
    // Right after the original (between it and the next one), without moving any other service.
    const after = Number(source.sortOrder ?? 1000);
    const next = await Service.findOne({ sortOrder: { $gt: after } }).sort({ sortOrder: 1 }).select('sortOrder').lean<{ sortOrder?: number }>();
    const sortOrder = next?.sortOrder != null ? (after + next.sortOrder) / 2 : after + 10;
    const copy = await Service.create({
      ...fields,
      name,
      active: false,
      showInPopular: false,
      sortOrder,
    });
    res.locals.activity = {
      summary: `Duplicated service ${source.name} as ${name}`,
      targetId: String(copy._id),
      targetLabel: name,
      fields: ['name', 'active'],
    };
    revalidateWebsite(['services']);
    res.status(201).json({ service: formatService(copy), sourceId: String(_id) });
  }),
);
