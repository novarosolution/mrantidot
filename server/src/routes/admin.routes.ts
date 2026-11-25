import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { User, sanitizeUser, type IUser } from '../models/User';
import { Offer } from '../models/Offer';
import { Review, adminReviewReply } from '../models/Review';
import { formatReview } from '../utils/format';
import { AppError } from '../utils/AppError';
import { getAdminConfig } from '../utils/adminUser';
import { normalizePhone } from '../utils/phone';
import { formatAttendance } from '../models/TechnicianAttendance';
import { upsertAttendance } from '../utils/attendance';
import {
  buildAdminExport,
  exportSummary,
  parseExportRange,
  pickDatasets,
  streamExportCsv,
  streamExportJson,
} from '../utils/adminExport';
import { revalidateWebsite } from '../utils/websiteRevalidate';
import { getBusinessSettings } from '../utils/businessSettings';
import { offerStatsFor, recentOfferBookings } from '../utils/offerStats';
import { cleanTechnicianCoverage, COVERAGE_FIELDS } from '../utils/technicianFit';
import { adminManageRouter, customerAddresses } from './adminManage.routes';
import { recomputeTechnicianRating } from './reviews.routes';
import {
  customerDetail,
  listCustomers,
  listOffers,
  listReviews,
  listTechnicians,
  listUsers,
  payroll,
  technicianBookings,
  technicianDetail,
} from '../utils/adminLists';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

// Notes, tags, addresses, review replies, offer copy / delete, technician fit — routes/adminManage.routes.ts.
adminRouter.use(adminManageRouter);

/**
 * Business data export (no passwords / live OTPs, no row cap — rows are streamed):
 *   ?summary=1                         row counts per dataset for the range (nothing heavy)
 *   ?format=csv&dataset=bookings       one dataset as CSV
 *   ?format=json&datasets=a,b          JSON backup of the chosen datasets (all when omitted)
 *   + from / to (YYYY-MM-DD, IST) and dateField=visit|created for bookings
 *   no params                          the old full bundle (older app builds)
 */
adminRouter.get(
  '/export',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, unknown>;
    const range = parseExportRange(query);
    if (query.summary === '1' || query.summary === 'true') {
      res.json(await exportSummary(range));
      return;
    }
    if (query.format === 'csv') {
      await streamExportCsv(res, query.dataset, range);
      return;
    }
    if (query.format === 'json') {
      await streamExportJson(res, pickDatasets(query.datasets), range);
      return;
    }
    res.json(await buildAdminExport());
  }),
);

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

/** Paged users: role, status, q, sort — see utils/adminLists.ts (listUsers). */
adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    res.json(await listUsers(req.query as Record<string, unknown>));
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
  body('payMode').optional().isIn(['percent', 'flat']),
  body('payPercent').optional().isFloat({ min: 0, max: 100 }),
  body('payFlat').optional().isFloat({ min: 0 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    if (req.body.role === 'admin') await assertPrimaryAdmin(req.user!.id);
    const coverage =
      req.body.role === 'technician' ? cleanTechnicianCoverage(req.body as Record<string, unknown>, undefined, await getBusinessSettings()) : {};
    const phone = normalizePhone(req.body.phone);
    const existing = await User.findOne({ $or: [{ phone }, { email: req.body.email }] });
    if (existing) {
      throw new AppError(400, 'Phone or email already in use');
    }
    const passwordHash = await bcrypt.hash(String(req.body.password).trim(), 12);
    const isTech = req.body.role === 'technician';
    const user = await User.create({
      role: req.body.role,
      name: req.body.name.trim(),
      phone,
      email: req.body.email,
      passwordHash,
      city: req.body.city?.trim(),
      rating: 0,
      jobsDone: 0,
      available: true,
      ...(isTech
        ? {
            payMode: req.body.payMode === 'flat' ? 'flat' : 'percent',
            payPercent:
              req.body.payPercent !== undefined
                ? Math.min(100, Math.max(0, Number(req.body.payPercent)))
                : 100,
            payFlat:
              req.body.payFlat !== undefined
                ? Math.max(0, Math.round(Number(req.body.payFlat)))
                : 0,
            ...coverage,
          }
        : {}),
    });
    res.locals.activity = {
      summary: `Created ${user.role} account for ${user.name}`,
      targetId: String(user._id),
      targetType: 'user',
      targetLabel: user.name,
      fields: Object.keys(req.body).filter((k) => k !== 'password').concat('password'),
    };
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
  body('displayRating').optional({ nullable: true }).isFloat({ min: 0, max: 5 }),
  body('payMode').optional().isIn(['percent', 'flat']),
  body('payPercent').optional().isFloat({ min: 0, max: 100 }),
  body('payFlat').optional().isFloat({ min: 0 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    await assertCanEditAccount(req.user!.id, user, req.body as Record<string, unknown>);
    const before = accountSnapshot(user);
    if (isEnvAdmin(user)) {
      if (req.body.role && req.body.role !== 'admin') {
        throw new AppError(400, 'Cannot change role of primary admin');
      }
      if (typeof req.body.disabled === 'boolean' && req.body.disabled) {
        throw new AppError(400, 'Cannot disable primary admin account');
      }
      if (req.body.phone && normalizePhone(req.body.phone) !== normalizePhone(user.phone)) {
        throw new AppError(400, 'Cannot change phone of primary admin');
      }
      if (req.body.email && req.body.email !== user.email) {
        throw new AppError(400, 'Cannot change email of primary admin');
      }
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
    if (req.body.email && !isEnvAdmin(user)) {
      const dupEmail = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (dupEmail) throw new AppError(400, 'Email already in use');
      user.email = req.body.email;
    }
    if (req.body.city !== undefined) user.city = req.body.city;
    if (typeof req.body.available === 'boolean') user.available = req.body.available;
    if (typeof req.body.disabled === 'boolean') {
      if (req.body.disabled && user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', disabled: { $ne: true } });
        if (adminCount <= 1) {
          throw new AppError(400, 'Cannot disable the last active admin');
        }
      }
      user.disabled = req.body.disabled;
      if (req.body.disabled) user.available = false;
    }
    if (req.body.displayRating !== undefined && user.role === 'technician') {
      const v = req.body.displayRating;
      user.displayRating = v === null || v === '' ? null : Number(v);
    }
    if (user.role === 'technician' || req.body.role === 'technician') {
      if (COVERAGE_FIELDS.some((f) => req.body[f] !== undefined)) {
        const coverage = cleanTechnicianCoverage(req.body as Record<string, unknown>, user, await getBusinessSettings());
        Object.assign(user, coverage);
      }
      if (req.body.payMode === 'percent' || req.body.payMode === 'flat') {
        user.payMode = req.body.payMode;
      }
      if (req.body.payPercent !== undefined) {
        user.payPercent = Math.min(100, Math.max(0, Number(req.body.payPercent)));
      }
      if (req.body.payFlat !== undefined) {
        user.payFlat = Math.max(0, Math.round(Number(req.body.payFlat)));
      }
    }
    if (req.body.phone && !isEnvAdmin(user)) {
      const phone = normalizePhone(req.body.phone);
      const dup = await User.findOne({ phone, _id: { $ne: user._id } });
      if (dup) throw new AppError(400, 'Phone already in use');
      user.phone = phone;
    }
    await user.save();
    res.locals.activity = accountChangeNote(before, user, req.user!.id);
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
    // Admins may change their own password; other admins' passwords only the primary admin resets.
    const self = String(user._id) === req.user!.id;
    if (user.role === 'admin' && !self) await assertPrimaryAdmin(req.user!.id);
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    await user.save();
    res.locals.activity = {
      summary: self ? 'Changed own password' : `Reset the password for ${user.name}`,
      targetType: 'user',
      targetLabel: user.name,
      fields: ['password'],
    };
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
    if (user.role === 'admin') await assertPrimaryAdmin(req.user!.id);
    user.disabled = true;
    user.available = false;
    await user.save();
    res.locals.activity = {
      summary: `Disabled ${user.name}'s ${user.role} account`,
      targetType: 'user',
      targetLabel: user.name,
      fields: ['disabled'],
    };
    res.json({ user: sanitizeUser(user) });
  }),
);

/** Technician roster (paged when `page` / `limit` is sent) — see utils/adminLists.ts (listTechnicians). */
adminRouter.get(
  '/technicians',
  asyncHandler(async (req, res) => {
    res.json(await listTechnicians(req.query as Record<string, unknown>));
  }),
);

/** One month of a technician's jobs (+ open jobs) with all-time totals — utils/adminLists.ts (technicianDetail). */
adminRouter.get(
  '/technicians/:id/detail',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    res.json(await technicianDetail(req.params.id, req.query.month));
  }),
);

adminRouter.put(
  '/technicians/:id/attendance/:date',
  param('id').isMongoId(),
  param('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('status').isIn(['present', 'absent', 'leave']),
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

    const status =
      req.body.status === 'present' ? 'came' : req.body.status === 'leave' ? 'leave' : 'not_came';
    const word = req.body.status === 'present' ? 'present' : req.body.status === 'leave' ? 'on leave' : 'absent';
    res.locals.activity = {
      summary: `Marked ${technician.name} ${word} on ${req.params.date}`,
      targetLabel: technician.name,
      fields: ['attendance'],
    };
    res.json({ attendance: formatAttendance(record), date: req.params.date, status });
  }),
);

/**
 * Team payroll for a month or any range, optional per-job breakdown — utils/adminLists.ts (payroll). Each
 * row also has adjustments / paid / due for the range (utils/payrollLedger.ts; payouts and adjustments
 * are managed by routes/payroll.routes.ts).
 */
adminRouter.get(
  '/payroll',
  asyncHandler(async (req, res) => {
    const { withPayrollLedger } = await import('../utils/payrollLedger');
    res.json(await withPayrollLedger(await payroll(req.query as Record<string, unknown>)));
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

/** Paged customers with spend / VIP (rule from Business settings) — utils/adminLists.ts (listCustomers). */
adminRouter.get(
  '/customers',
  asyncHandler(async (req, res) => {
    res.json(await listCustomers(req.query as Record<string, unknown>));
  }),
);

adminRouter.get(
  '/customers/:id',
  param('id').isMongoId().withMessage('Invalid customer id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    res.json(await customerDetail(req.params.id));
  }),
);

adminRouter.get(
  '/technicians/:id/bookings',
  param('id').isMongoId().withMessage('Invalid technician id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    res.json(await technicianBookings(req.params.id, req.query as Record<string, unknown>));
  }),
);

/** Paged offers: status (active / inactive / expired), q, sort — utils/adminLists.ts (listOffers). */
adminRouter.get(
  '/offers',
  asyncHandler(async (req, res) => {
    res.json(await listOffers(req.query as Record<string, unknown>));
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
    // Usage from the bookings that carry the code (utils/offerStats.ts) and the latest of them.
    const [stats, recent] = await Promise.all([offerStatsFor([offer.code]), recentOfferBookings(offer.code, 5)]);
    res.json({ offer: offer.toJSON(), stats: stats.get(offer.code), recent });
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
    const code = String(req.body.code).toUpperCase().trim();
    if (await Offer.exists({ code })) throw new AppError(409, `${code} already exists — pick another code`, 'CONFLICT');
    const offer = await Offer.create({
      code,
      discount: req.body.discount,
      discountType: req.body.discountType ?? 'fixed',
      description: req.body.description.trim(),
      active: req.body.active ?? true,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      maxUses: req.body.maxUses ?? undefined,
      minOrderAmount: req.body.minOrderAmount ?? undefined,
    });
    res.locals.activity = { summary: `Created offer ${offer.code}`, targetId: String(offer._id), targetLabel: offer.code };
    revalidateWebsite(['offers']);
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
    const unset: Record<string, 1> = {};
    if (req.body.expiresAt === null || req.body.expiresAt === '') {
      unset.expiresAt = 1;
    } else if (req.body.expiresAt) {
      update.expiresAt = new Date(req.body.expiresAt);
    }
    if (req.body.maxUses === null) unset.maxUses = 1;
    else if (typeof req.body.maxUses === 'number') update.maxUses = req.body.maxUses;
    if (req.body.minOrderAmount === null) unset.minOrderAmount = 1;
    else if (typeof req.body.minOrderAmount === 'number') update.minOrderAmount = req.body.minOrderAmount;
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true },
    );
    if (!offer) {
      throw new AppError(404, 'Offer not found');
    }
    const onlyActive = typeof req.body.active === 'boolean' && Object.keys(req.body).length === 1;
    res.locals.activity = {
      summary: onlyActive ? `Switched offer ${offer.code} ${offer.active ? 'on' : 'off'}` : `Updated offer ${offer.code}`,
      targetLabel: offer.code,
    };
    revalidateWebsite(['offers']);
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
    res.locals.activity = { summary: `Switched offer ${offer.code} off`, targetLabel: offer.code, fields: ['active'] };
    revalidateWebsite(['offers']);
    res.json({ offer: offer.toJSON() });
  }),
);

/** Paged reviews with average + star breakdown over all matches — utils/adminLists.ts (listReviews). */
adminRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    res.json(await listReviews(req.query as Record<string, unknown>));
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

    await recomputeTechnicianRating(review.technicianId);
    revalidateWebsite(['testimonials']);
    res.locals.activity = {
      summary: `${review.hidden ? 'Hid' : 'Showed'} a ${review.stars}★ review (booking #${String(review.bookingId).slice(-6).toUpperCase()})`,
      fields: ['hidden'],
    };
    res.json({ review: { ...formatReview(review), reply: adminReviewReply(review.reply) } });
  }),
);

/* ---------- E2: admin accounts, customer addresses, people search ---------- */

const PRIMARY_ADMIN_ONLY = 'Only the primary admin can manage admin accounts';

/** The env-configured admin (ADMIN_PHONE) is the primary admin. */
async function isPrimaryAdminId(userId: string): Promise<boolean> {
  const actor = await User.findById(userId).select('role phone');
  return Boolean(actor && isEnvAdmin(actor));
}

async function assertPrimaryAdmin(actorId: string): Promise<void> {
  if (!(await isPrimaryAdminId(actorId))) throw new AppError(403, PRIMARY_ADMIN_ONLY, 'PRIMARY_ADMIN_ONLY');
}

/**
 * Editing an admin account, or promoting someone to admin, is for the primary admin only. Other admins may
 * still edit their own profile (name, phone, email, city) — but not their own role or access.
 */
async function assertCanEditAccount(actorId: string, target: IUser, body: Record<string, unknown>): Promise<void> {
  const promotes = body.role === 'admin' && target.role !== 'admin';
  if (target.role !== 'admin' && !promotes) return;
  if (await isPrimaryAdminId(actorId)) return;
  const self = String(target._id) === actorId;
  const roleChange = typeof body.role === 'string' && body.role !== target.role;
  const accessChange = typeof body.disabled === 'boolean' && body.disabled !== (target.disabled === true);
  if (self && !roleChange && !accessChange) return;
  throw new AppError(403, PRIMARY_ADMIN_ONLY, 'PRIMARY_ADMIN_ONLY');
}

const ACCOUNT_FIELDS = [
  'name',
  'phone',
  'email',
  'city',
  'role',
  'available',
  'disabled',
  'displayRating',
  'payMode',
  'payPercent',
  'payFlat',
  ...COVERAGE_FIELDS,
] as const;

type AccountSnapshot = Record<(typeof ACCOUNT_FIELDS)[number], unknown>;

function accountSnapshot(user: IUser): AccountSnapshot {
  const u = user as unknown as Record<string, unknown>;
  return Object.fromEntries(ACCOUNT_FIELDS.map((f) => [f, u[f] ?? null])) as AccountSnapshot;
}

/** Activity entry for a user edit — role and access changes spelled out, other fields by name (never values). */
function accountChangeNote(before: AccountSnapshot, user: IUser, actorId: string) {
  const after = accountSnapshot(user);
  const fields = ACCOUNT_FIELDS.filter((f) => JSON.stringify(before[f]) !== JSON.stringify(after[f]));
  if (fields.length === 0) return { skip: true };
  const whose = String(user._id) === actorId ? 'own account' : `${user.name}'s account`;
  let summary: string;
  if (fields.includes('role')) summary = `Changed ${user.name}'s role from ${String(before.role)} to ${user.role}`;
  else if (fields.includes('disabled')) summary = user.disabled ? `Disabled ${user.name}'s account` : `Re-enabled ${user.name}'s account`;
  else summary = `Updated ${whose} (${fields.join(', ')})`;
  return { summary, targetType: 'user', targetLabel: user.name, fields: [...fields] };
}

/** GET /admin/customers/:id/addresses → { addresses } — a customer's saved addresses (default first). */
adminRouter.get(
  '/customers/:id/addresses',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('_id');
    if (!customer) throw new AppError(404, 'Customer not found');
    // Default first; `inServiceArea` false when Business settings → Service area doesn't cover it.
    res.json({ addresses: await customerAddresses(customer._id) });
  }),
);

/**
 * GET /admin/user-search?q&role&limit&includeDisabled=1 → { users: [{ id, name, phone, email, role, city, disabled }] }
 * Light people search for pickers (book for a customer, broadcast to one person). Name, email or phone digits.
 */
adminRouter.get(
  '/user-search',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
    const roles = ['customer', 'technician', 'admin'];
    const role = typeof req.query.role === 'string' && roles.includes(req.query.role) ? req.query.role : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 50);
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (req.query.includeDisabled !== '1') filter.disabled = { $ne: true };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const digits = q.replace(/\D/g, '');
      filter.$or = [{ name: rx }, { email: rx }, { phone: digits.length >= 3 ? new RegExp(digits) : rx }];
    }
    const users = await User.find(filter).sort({ name: 1 }).limit(limit).select('name phone email role city disabled');
    res.json({
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        city: u.city,
        disabled: u.disabled === true,
      })),
    });
  }),
);
