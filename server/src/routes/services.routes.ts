import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Service } from '../models/Service';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { isServiceTypeKey, normalizeServiceTypes, SERVICE_TYPE_KEYS } from '../constants/serviceTypes';
import { formatService } from '../utils/format';
import { getServiceStats, getStatsForServiceIds } from '../utils/service-stats';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { getOptionalUser } from '../utils/optionalAuth';
import { formatServiceStatsForRole } from '../utils/ratings';

export const servicesRouter = Router();

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
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
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
      const map: Record<string, string> = {
        Residential: 'residential',
        Commercial: 'commercial',
        Cleaning: 'cleaning',
      };
      const cat = map[category] ?? category.toLowerCase();
      filter.category = cat;
    }
    const services = await Service.find(filter).sort({ name: 1 });
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
  body('stepTemplate').optional().isArray(),
  body('category').optional().isIn(['residential', 'commercial', 'cleaning', 'general']),
  body('serviceTypes').optional().isArray(),
  body('serviceTypes.*').optional().isIn([...SERVICE_TYPE_KEYS]),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const payload = { ...req.body, active: true };
    if (req.body.serviceTypes !== undefined) {
      payload.serviceTypes = normalizeServiceTypes(req.body.serviceTypes);
    }
    const service = await Service.create(payload);
    res.status(201).json({ service: formatService(service) });
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
  body('stepTemplate').optional().isArray(),
  body('category').optional().isIn(['residential', 'commercial', 'cleaning', 'general']),
  body('serviceTypes').optional().isArray(),
  body('serviceTypes.*').optional().isIn([...SERVICE_TYPE_KEYS]),
  body('active').optional().isBoolean(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    if (req.body.serviceTypes !== undefined) {
      updates.serviceTypes = normalizeServiceTypes(req.body.serviceTypes);
    }
    const service = await Service.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }
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
    res.json({ service: formatService(service) });
  }),
);
