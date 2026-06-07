import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { User, sanitizeUser, type IUser } from '../models/User';
import { Booking } from '../models/Booking';
import { Offer } from '../models/Offer';
import { Review } from '../models/Review';
import { Service } from '../models/Service';
import { formatBooking, formatReview } from '../utils/format';
import { AppError } from '../utils/AppError';
import { getAdminConfig } from '../utils/adminUser';
import { normalizePhone } from '../utils/phone';
import { formatAttendance } from '../models/TechnicianAttendance';
import {
  buildAttendanceCalendar,
  computeAttendanceAnalytics,
  computeJobAnalytics,
  loadAttendanceForRange,
  monthRange,
  parseMonthParam,
  todayDateKey,
  upsertAttendance,
} from '../utils/attendance';
import {
  buildJobVisitsForBookings,
  computeJobVisitAnalytics,
} from '../utils/jobVisit';
import {
  buildAttendanceTrend,
  buildJobsTrend,
  computeTechStatusBreakdown,
  monthDateRange,
} from '../utils/technicianAnalytics';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

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

function isEnvAdmin(user: IUser): boolean {
  return user.role === 'admin' && normalizePhone(user.phone) === getAdminConfig().phone;
}

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const role = req.query.role as string | undefined;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ name: 1 });
    res.json({ users: users.map((u) => sanitizeUser(u)) });
  }),
);

adminRouter.get(
  '/users/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    const json = sanitizeUser(user) as Record<string, unknown>;
    if (isEnvAdmin(user)) json.protected = true;
    res.json({ user: json });
  }),
);

adminRouter.post(
  '/users',
  body('role').isIn(['technician', 'customer', 'admin']),
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('city').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    const existing = await User.findOne({ $or: [{ phone }, { email: req.body.email }] });
    if (existing) {
      throw new AppError(400, 'Phone or email already in use');
    }
    const passwordHash = await bcrypt.hash(String(req.body.password).trim(), 12);
    const user = await User.create({
      role: req.body.role,
      name: req.body.name.trim(),
      phone,
      email: req.body.email,
      passwordHash,
      city: req.body.city?.trim(),
      rating: 0,
      jobsDone: 0,
      available: req.body.role !== 'customer',
    });
    res.status(201).json({ user: sanitizeUser(user) });
  }),
);

adminRouter.patch(
  '/users/:id',
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('city').optional().trim(),
  body('role').optional().isIn(['customer', 'technician', 'admin']),
  body('available').optional().isBoolean(),
  body('disabled').optional().isBoolean(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    if (isEnvAdmin(user) && req.body.role && req.body.role !== 'admin') {
      throw new AppError(400, 'Cannot change role of primary admin');
    }
    if (req.body.role && req.body.role !== user.role) {
      if (isEnvAdmin(user)) {
        throw new AppError(400, 'Cannot change role of primary admin');
      }
      const adminCount = await User.countDocuments({ role: 'admin', disabled: { $ne: true } });
      if (user.role === 'admin' && req.body.role !== 'admin' && adminCount <= 1) {
        throw new AppError(400, 'Cannot remove the last active admin');
      }
      user.role = req.body.role;
      if (user.role === 'technician') {
        if (typeof req.body.available !== 'boolean') user.available = true;
      } else if (user.role === 'admin') {
        user.available = true;
      }
    }
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.city !== undefined) user.city = req.body.city;
    if (typeof req.body.available === 'boolean') user.available = req.body.available;
    if (typeof req.body.disabled === 'boolean') {
      user.disabled = req.body.disabled;
      if (req.body.disabled) user.available = false;
    }
    if (req.body.phone) {
      const phone = normalizePhone(req.body.phone);
      const dup = await User.findOne({ phone, _id: { $ne: user._id } });
      if (dup) throw new AppError(400, 'Phone already in use');
      user.phone = phone;
    }
    await user.save();
    const json = sanitizeUser(user) as Record<string, unknown>;
    if (isEnvAdmin(user)) json.protected = true;
    res.json({ user: json });
  }),
);

adminRouter.patch(
  '/users/:id/password',
  param('id').isMongoId(),
  body('password').isLength({ min: 8 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    await user.save();
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  '/users/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    if (isEnvAdmin(user)) {
      throw new AppError(400, 'Cannot disable primary admin account');
    }
    user.disabled = true;
    user.available = false;
    await user.save();
    res.json({ user: sanitizeUser(user) });
  }),
);

adminRouter.get(
  '/technicians',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { role: 'technician' };
    if (req.query.available === 'true') {
      filter.available = { $ne: false };
      filter.disabled = { $ne: true };
    }
    const technicians = await User.find(filter).sort({ name: 1 });
    const techIds = technicians.map((t) => t._id);

    const agg =
      techIds.length > 0
        ? await Booking.aggregate([
            { $match: { technicianId: { $in: techIds } } },
            {
              $group: {
                _id: '$technicianId',
                activeJobs: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['confirmed', 'in_progress', 'awaiting_verification'],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                completedJobs: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                lastJobDate: { $max: '$schedule.date' },
              },
            },
          ])
        : [];

    const aggMap = new Map(agg.map((r) => [String(r._id), r]));

    const enriched = technicians.map((t) => {
      const stats = aggMap.get(t._id.toString());
      return {
        ...sanitizeUser(t),
        activeJobs: (stats?.activeJobs as number) ?? 0,
        completedJobs: (stats?.completedJobs as number) ?? 0,
        lastJobDate: stats?.lastJobDate as string | undefined,
      };
    });

    res.json({ technicians: enriched });
  }),
);

adminRouter.get(
  '/technicians/:id/detail',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }

    const month = parseMonthParam(
      typeof req.query.month === 'string' ? req.query.month : undefined,
    );
    const { from, to } = monthRange(month);
    const today = todayDateKey();

    const bookings = await Booking.find({ technicianId: technician._id })
      .populate('serviceId')
      .populate('customerId', '-passwordHash')
      .sort({ 'schedule.date': 1, createdAt: -1 });

    const formattedBookings = bookings.map((b) => formatBooking(b));

    const calendar: Record<string, number> = {};
    let activeJobs = 0;
    let completedJobs = 0;
    let cancelledJobs = 0;
    let earnings = 0;
    let lastJobDate: string | undefined;

    for (const b of bookings) {
      const date = b.schedule?.date;
      if (date) {
        calendar[date] = (calendar[date] ?? 0) + 1;
        if (!lastJobDate || date > lastJobDate) lastJobDate = date;
      }
      if (['confirmed', 'in_progress', 'awaiting_verification'].includes(b.status)) {
        activeJobs += 1;
      } else if (b.status === 'completed') {
        completedJobs += 1;
        earnings += b.amount?.total ?? 0;
      } else if (b.status === 'cancelled') {
        cancelledJobs += 1;
      }
    }

    const reviewCount = await Review.countDocuments({
      technicianId: technician._id,
      hidden: { $ne: true },
    });

    const reviews = await Review.find({
      technicianId: technician._id,
      hidden: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const attendanceRecords = await loadAttendanceForRange(technician._id, from, to);
    const attendance = buildAttendanceCalendar(attendanceRecords, from, to, today);
    const attendanceStats = computeAttendanceAnalytics(attendance, today);
    const jobStats = computeJobAnalytics(bookings, month);
    const visitStats = computeJobVisitAnalytics(bookings, today, month);
    const jobVisits = buildJobVisitsForBookings(bookings, today, month);

    const { start: monthStart, end: monthEnd } = monthDateRange(month);

    const [
      pendingBookingsRaw,
      globalPendingCount,
      globalPendingPeriodCount,
    ] = await Promise.all([
      Booking.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('serviceId')
        .populate('customerId', '-passwordHash')
        .populate('technicianId', '-passwordHash'),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({
        status: 'pending',
        createdAt: { $gte: monthStart, $lt: monthEnd },
      }),
    ]);

    const statusBreakdown = computeTechStatusBreakdown(bookings, month);
    const attendanceTrend = buildAttendanceTrend(attendance, month, today);
    const jobsTrend = buildJobsTrend(bookings, month);

    res.json({
      technician: sanitizeUser(technician),
      bookings: formattedBookings,
      stats: {
        totalJobs: bookings.length,
        activeJobs,
        completedJobs,
        cancelledJobs,
        earnings,
        lastJobDate,
        reviewCount,
      },
      reviews: reviews.map((r) => formatReview(r)),
      calendar,
      month,
      attendance,
      jobVisits,
      analytics: {
        ...attendanceStats,
        ...jobStats,
        ...visitStats,
      },
      globalPending: {
        count: globalPendingCount,
        periodCount: globalPendingPeriodCount,
        bookings: pendingBookingsRaw.map((b) => formatBooking(b)),
      },
      statusBreakdown,
      attendanceTrend,
      jobsTrend,
    });
  }),
);

adminRouter.put(
  '/technicians/:id/attendance/:date',
  param('id').isMongoId(),
  param('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('status').isIn(['present', 'absent']),
  body('note').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }

    const record = await upsertAttendance(
      technician._id,
      req.params.date,
      req.body.status,
      'admin',
      req.body.note,
    );

    const status = req.body.status === 'present' ? 'came' : 'not_came';
    res.json({ attendance: formatAttendance(record), date: req.params.date, status });
  }),
);

adminRouter.get(
  '/technicians/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const technician = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }
    res.json({ technician: sanitizeUser(technician) });
  }),
);

adminRouter.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    const customers = await User.find({ role: 'customer' }).sort({ name: 1 });
    const customerIds = customers.map((c) => c._id);

    const agg = await Booking.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      {
        $group: {
          _id: '$customerId',
          bookingCount: { $sum: 1 },
          totalSpend: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount.total', 0],
            },
          },
          lastBookingAt: { $max: '$createdAt' },
        },
      },
    ]);

    const aggMap = new Map(agg.map((r) => [String(r._id), r]));

    const enriched = customers.map((c) => {
      const stats = aggMap.get(c._id.toString());
      const bookingCount = (stats?.bookingCount as number) ?? 0;
      const totalSpend = (stats?.totalSpend as number) ?? 0;
      let statusTag: 'active' | 'inactive' | 'vip' = 'active';
      if (bookingCount === 0) statusTag = 'inactive';
      else if (totalSpend >= 2000 || bookingCount >= 3) statusTag = 'vip';

      return {
        ...sanitizeUser(c),
        bookingCount,
        totalSpend,
        lastBookingAt: stats?.lastBookingAt,
        statusTag,
      };
    });

    const summary = {
      total: enriched.length,
      new: enriched.filter((c) => {
        const createdAt = (c as Record<string, unknown>).createdAt;
        const created = createdAt ? new Date(String(createdAt)) : null;
        if (!created) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      }).length,
      vip: enriched.filter((c) => c.statusTag === 'vip').length,
    };

    res.json({ customers: enriched, summary });
  }),
);

adminRouter.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const bookings = await Booking.find({ customerId: customer._id })
      .populate('serviceId')
      .populate('technicianId', '-passwordHash')
      .sort({ createdAt: -1 });

    const spendAgg = await Booking.aggregate([
      { $match: { customerId: customer._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount.total' } } },
    ]);

    res.json({
      customer: sanitizeUser(customer),
      bookings: bookings.map((b) => formatBooking(b)),
      totalSpend: spendAgg[0]?.total ?? 0,
      bookingCount: bookings.length,
    });
  }),
);

adminRouter.get(
  '/technicians/:id/bookings',
  asyncHandler(async (req, res) => {
    const tech = await User.findOne({ _id: req.params.id, role: 'technician' });
    if (!tech) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }

    const bookings = await Booking.find({ technicianId: tech._id })
      .populate('serviceId')
      .populate('customerId', '-passwordHash')
      .sort({ 'schedule.date': 1, createdAt: -1 });

    res.json({ bookings: bookings.map((b) => formatBooking(b)) });
  }),
);

adminRouter.get(
  '/offers',
  asyncHandler(async (_req, res) => {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ offers: offers.map((o) => o.toJSON()) });
  }),
);

adminRouter.get(
  '/offers/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      throw new AppError(404, 'Offer not found');
    }
    res.json({ offer: offer.toJSON() });
  }),
);

adminRouter.post(
  '/offers',
  body('code').trim().notEmpty(),
  body('discount').isFloat({ min: 0 }),
  body('description').trim().notEmpty(),
  body('active').optional().isBoolean(),
  body('discountType').optional().isIn(['fixed', 'percent']),
  body('expiresAt').optional({ nullable: true }),
  body('maxUses').optional({ nullable: true }).isInt({ min: 1 }),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const offer = await Offer.create({
      code: String(req.body.code).toUpperCase().trim(),
      discount: req.body.discount,
      discountType: req.body.discountType ?? 'fixed',
      description: req.body.description.trim(),
      active: req.body.active ?? true,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      maxUses: req.body.maxUses ?? undefined,
      minOrderAmount: req.body.minOrderAmount ?? undefined,
    });
    res.status(201).json({ offer: offer.toJSON() });
  }),
);

adminRouter.patch(
  '/offers/:id',
  param('id').isMongoId(),
  body('code').optional().trim().notEmpty(),
  body('discount').optional().isFloat({ min: 0 }),
  body('description').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
  body('discountType').optional().isIn(['fixed', 'percent']),
  body('expiresAt').optional({ nullable: true }),
  body('maxUses').optional({ nullable: true }).isInt({ min: 1 }),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const update: Record<string, unknown> = {};
    if (typeof req.body.code === 'string') update.code = req.body.code.toUpperCase().trim();
    if (typeof req.body.discount === 'number') update.discount = req.body.discount;
    if (typeof req.body.description === 'string') update.description = req.body.description.trim();
    if (typeof req.body.active === 'boolean') update.active = req.body.active;
    if (typeof req.body.discountType === 'string') update.discountType = req.body.discountType;
    if (req.body.expiresAt === null || req.body.expiresAt === '') {
      update.expiresAt = undefined;
    } else if (req.body.expiresAt) {
      update.expiresAt = new Date(req.body.expiresAt);
    }
    if (req.body.maxUses === null) update.maxUses = undefined;
    else if (typeof req.body.maxUses === 'number') update.maxUses = req.body.maxUses;
    if (req.body.minOrderAmount === null) update.minOrderAmount = undefined;
    else if (typeof req.body.minOrderAmount === 'number') update.minOrderAmount = req.body.minOrderAmount;
    const offer = await Offer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!offer) {
      throw new AppError(404, 'Offer not found');
    }
    res.json({ offer: offer.toJSON() });
  }),
);

adminRouter.delete(
  '/offers/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const offer = await Offer.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!offer) {
      throw new AppError(404, 'Offer not found');
    }
    res.json({ offer: offer.toJSON() });
  }),
);

adminRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(limit);
    const bookingIds = [...new Set(reviews.map((r) => r.bookingId.toString()))];
    const bookings = await Booking.find({ _id: { $in: bookingIds } }).select('serviceId customerId');
    const bookingMap = new Map(bookings.map((b) => [b._id.toString(), b]));
    const serviceIds = [...new Set(bookings.map((b) => b.serviceId.toString()))];
    const customerIds = [...new Set(bookings.map((b) => b.customerId.toString()))];
    const [services, customers] = await Promise.all([
      Service.find({ _id: { $in: serviceIds } }).select('name'),
      User.find({ _id: { $in: customerIds } }).select('name'),
    ]);
    const serviceNameById = new Map(services.map((s) => [s._id.toString(), s.name]));
    const customerNameById = new Map(
      customers.map((c) => [c._id.toString(), c.name?.split(' ')[0] ?? 'Customer']),
    );

    res.json({
      reviews: reviews.map((r) => {
        const base = formatReview(r);
        const booking = bookingMap.get(r.bookingId.toString());
        const serviceId = booking?.serviceId?.toString();
        return {
          ...base,
          customerName: booking
            ? (customerNameById.get(booking.customerId.toString()) ?? 'Customer')
            : 'Customer',
          serviceName: serviceId ? (serviceNameById.get(serviceId) ?? 'Service') : 'Service',
        };
      }),
    });
  }),
);

adminRouter.patch(
  '/reviews/:id',
  param('id').isMongoId(),
  body('hidden').isBoolean(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { hidden: req.body.hidden },
      { new: true },
    );
    if (!review) {
      throw new AppError(404, 'Review not found');
    }
    res.json({ review: formatReview(review) });
  }),
);
