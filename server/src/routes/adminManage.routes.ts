import '../types/express';
import { Router } from 'express';
import { Types } from 'mongoose';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error';
import { Booking } from '../models/Booking';
import { Offer } from '../models/Offer';
import { Review, adminReviewReply } from '../models/Review';
import { SavedAddress } from '../models/SavedAddress';
import { User, adminUserJson, formatAdminNote } from '../models/User';
import { AppError } from '../utils/AppError';
import { customerDetail } from '../utils/adminLists';
import { addressInServiceArea, fillTemplate, getBusinessSettings, messageFor, type BusinessSettings } from '../utils/businessSettings';
import { bookingTemplateVars, notifyUser } from '../utils/notifications';
import { offerEverUsed, offerStatsFor } from '../utils/offerStats';
import { technicianFitReport } from '../utils/technicianFit';
import { revalidateWebsite } from '../utils/websiteRevalidate';
import { recomputeTechnicianRating } from './reviews.routes';

/**
 * Admin management endpoints added for people and catalog records (mounted inside the admin router, so
 * every route here is admin-only). Each change describes itself for the activity log.
 *
 *   GET    /admin/technicians/fit?bookingId=           who fits a visit, and why not (assign picker)
 *   GET    /admin/customer-tags                         tags in use, with counts
 *   PATCH  /admin/customers/:id                         { tags?, vipOverride? }
 *   POST   /admin/customers/:id/notes                   { text }
 *   DELETE /admin/customers/:id/notes/:noteId
 *   POST   /admin/customers/:id/addresses               { label, line1, city, pincode?, isDefault? }
 *   PATCH  /admin/customers/:id/addresses/:addressId    same fields, all optional
 *   DELETE /admin/customers/:id/addresses/:addressId
 *   PUT    /admin/reviews/:id/reply                     { text } — add or edit the one reply
 *   DELETE /admin/reviews/:id/reply
 *   DELETE /admin/reviews/:id                           permanent; the technician's rating is recalculated
 *   DELETE /admin/offers/:id/permanent                  only when the code was never used
 *   POST   /admin/offers/:id/duplicate                  { code? } — a switched-off copy
 */
export const adminManageRouter = Router();

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

const NOTE_MAX = 1000;
const REPLY_MAX = 1000;
const TAG_MAX_LENGTH = 24;
const MAX_TAGS = 12;

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const refOf = (id: unknown) => `#${String(id).slice(-6).toUpperCase()}`;

async function adminName(id: string): Promise<string> {
  const user = await User.findById(id).select('name').lean<{ name?: string }>();
  return user?.name?.trim() || 'Admin';
}

/* ------------------------------------------------------------------ */
/* Technicians                                                         */
/* ------------------------------------------------------------------ */

/** See utils/technicianFit.ts (technicianFitReport) for the query and the answer. */
adminManageRouter.get(
  '/technicians/fit',
  asyncHandler(async (req, res) => {
    res.json(await technicianFitReport(req.query as Record<string, unknown>));
  }),
);

/* ------------------------------------------------------------------ */
/* Customers: tags, VIP override, notes                                */
/* ------------------------------------------------------------------ */

async function findCustomer(id: string) {
  const customer = await User.findOne({ _id: id, role: 'customer' });
  if (!customer) throw new AppError(404, 'Customer not found');
  return customer;
}

/** GET /admin/customer-tags → { tags: [{ tag, count }] } — most used first. */
adminManageRouter.get(
  '/customer-tags',
  asyncHandler(async (_req, res) => {
    const rows = await User.aggregate<{ _id: string; tag: string; count: number }>([
      { $match: { role: 'customer', 'tags.0': { $exists: true } } },
      { $unwind: '$tags' },
      { $group: { _id: { $toLower: '$tags' }, tag: { $first: '$tags' }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 200 },
    ]);
    res.json({ tags: rows.map((r) => ({ tag: r.tag, count: r.count })) });
  }),
);

/** Trimmed, de-duplicated (ignoring case) tags, spelled like the ones already in use. */
async function cleanTags(raw: unknown): Promise<string[]> {
  if (!Array.isArray(raw)) throw new AppError(400, 'Tags must be a list');
  const existing = (await User.distinct('tags', { role: 'customer' })) as string[];
  const spelling = new Map(existing.map((t) => [t.toLowerCase(), t]));
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const text = item.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (text.length > TAG_MAX_LENGTH) throw new AppError(400, `Keep tags under ${TAG_MAX_LENGTH} characters`);
    if (out.some((t) => t.toLowerCase() === text.toLowerCase())) continue;
    out.push(spelling.get(text.toLowerCase()) ?? text);
  }
  if (out.length > MAX_TAGS) throw new AppError(400, `Use at most ${MAX_TAGS} tags`);
  return out;
}

/**
 * PATCH /admin/customers/:id { tags?, vipOverride?: 'vip' | 'not_vip' | null } → { customer, statusTag }.
 * `vipOverride` null hands the VIP badge back to the Business settings rule.
 */
adminManageRouter.patch(
  '/customers/:id',
  param('id').isMongoId().withMessage('Invalid customer id'),
  body('vipOverride').optional({ nullable: true }).isIn(['vip', 'not_vip']).withMessage('VIP must be vip, not_vip or empty'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const customer = await findCustomer(req.params.id);
    const fields: string[] = [];
    const parts: string[] = [];
    if (req.body.tags !== undefined) {
      const before = customer.tags ?? [];
      const tags = await cleanTags(req.body.tags);
      const added = tags.filter((t) => !before.some((b) => b.toLowerCase() === t.toLowerCase()));
      const removed = before.filter((b) => !tags.some((t) => t.toLowerCase() === b.toLowerCase()));
      customer.tags = tags;
      if (added.length || removed.length) {
        fields.push('tags');
        if (added.length) parts.push(`tagged ${added.join(', ')}`);
        if (removed.length) parts.push(`removed tag ${removed.join(', ')}`);
      }
    }
    if (req.body.vipOverride !== undefined) {
      const next = req.body.vipOverride === 'vip' || req.body.vipOverride === 'not_vip' ? req.body.vipOverride : null;
      if ((customer.vipOverride ?? null) !== next) {
        customer.vipOverride = next;
        fields.push('vipOverride');
        parts.push(next === 'vip' ? 'marked VIP' : next === 'not_vip' ? 'marked not VIP' : 'VIP back to the automatic rule');
      }
    }
    if (fields.length) await customer.save();
    res.locals.activity = fields.length
      ? {
          summary: `${customer.name}: ${parts.join('; ')}`,
          targetType: 'user',
          targetLabel: customer.name,
          fields,
        }
      : { skip: true };
    const detail = await customerDetail(customer._id.toString());
    res.json({ customer: detail.customer, statusTag: detail.statusTag });
  }),
);

/** POST /admin/customers/:id/notes { text } → 201 { note, notes } (newest first). Admins only, ever. */
adminManageRouter.post(
  '/customers/:id/notes',
  param('id').isMongoId().withMessage('Invalid customer id'),
  body('text')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Write the note first')
    .isLength({ max: NOTE_MAX })
    .withMessage(`Keep notes under ${NOTE_MAX} characters`),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const text = String(req.body.text).trim();
    const note = {
      _id: new Types.ObjectId(),
      text,
      by: new Types.ObjectId(req.user!.id),
      byName: await adminName(req.user!.id),
      at: new Date(),
    };
    // $push keeps the write small and never re-validates the rest of an older account.
    const result = await User.updateOne({ _id: req.params.id, role: 'customer' }, { $push: { adminNotes: note } });
    if (!result.matchedCount) throw new AppError(404, 'Customer not found');
    const customer = await findCustomer(req.params.id);
    res.locals.activity = {
      summary: `Added a note on ${customer.name}: “${clip(text, 80)}”`,
      targetType: 'user',
      targetLabel: customer.name,
      fields: ['adminNotes'],
    };
    res.status(201).json({ note: formatAdminNote(note), notes: adminUserJson(customer).adminNotes });
  }),
);

adminManageRouter.delete(
  '/customers/:id/notes/:noteId',
  param('id').isMongoId().withMessage('Invalid customer id'),
  param('noteId').isMongoId().withMessage('Invalid note id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const noteId = new Types.ObjectId(req.params.noteId);
    const result = await User.updateOne(
      { _id: req.params.id, role: 'customer', 'adminNotes._id': noteId },
      { $pull: { adminNotes: { _id: noteId } } },
    );
    if (!result.matchedCount) throw new AppError(404, 'Note not found');
    const customer = await findCustomer(req.params.id);
    res.locals.activity = {
      summary: `Deleted a note on ${customer.name}`,
      targetType: 'user',
      targetLabel: customer.name,
      fields: ['adminNotes'],
    };
    res.json({ notes: adminUserJson(customer).adminNotes });
  }),
);

/* ------------------------------------------------------------------ */
/* Customers: saved addresses on their behalf                          */
/* ------------------------------------------------------------------ */

const ADDRESS_LABEL_MAX = 30;

/** A customer's addresses, default first, each flagged when it is outside the service area. */
export async function customerAddresses(customerId: Types.ObjectId | string, settings?: BusinessSettings) {
  const s = settings ?? (await getBusinessSettings());
  const list = await SavedAddress.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
  return list.map((a) => ({
    ...(a.toJSON() as Record<string, unknown>),
    inServiceArea: addressInServiceArea(s, { city: a.city, pincode: a.pincode, text: a.line1 }),
  }));
}

const addressRules = (required: boolean) => {
  const opt = <T extends { optional: () => T }>(chain: T) => (required ? chain : chain.optional());
  return [
    opt(body('label'))
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Give the address a label (Home, Office…)')
      .isLength({ max: ADDRESS_LABEL_MAX })
      .withMessage(`Keep the label under ${ADDRESS_LABEL_MAX} characters`),
    opt(body('line1'))
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Enter the house / street')
      .isLength({ max: 300 })
      .withMessage('Keep the address under 300 characters'),
    opt(body('city'))
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Enter the city')
      .isLength({ max: 60 })
      .withMessage('Keep the city under 60 characters'),
    body('pincode')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Pincode must be 6 digits'),
    body('isDefault').optional().isBoolean(),
  ];
};

function addressLine(a: { label?: string; line1?: string; city?: string }): string {
  return clip([a.line1, a.city].filter(Boolean).join(', '), 60);
}

adminManageRouter.post(
  '/customers/:id/addresses',
  param('id').isMongoId().withMessage('Invalid customer id'),
  ...addressRules(true),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const customer = await findCustomer(req.params.id);
    const count = await SavedAddress.countDocuments({ customerId: customer._id });
    if (count >= 20) throw new AppError(400, 'A customer can keep at most 20 addresses');
    // The first address is always the default.
    const makeDefault = req.body.isDefault === true || count === 0;
    if (makeDefault) await SavedAddress.updateMany({ customerId: customer._id }, { isDefault: false });
    const address = await SavedAddress.create({
      customerId: customer._id,
      label: String(req.body.label).trim(),
      line1: String(req.body.line1).trim(),
      city: String(req.body.city).trim(),
      pincode: typeof req.body.pincode === 'string' && req.body.pincode.trim() ? req.body.pincode.trim() : undefined,
      isDefault: makeDefault,
    });
    res.locals.activity = {
      summary: `Added a ${address.label} address for ${customer.name} — ${addressLine(address)}`,
      targetType: 'user',
      targetLabel: customer.name,
      fields: ['addresses'],
    };
    res.status(201).json({ address: address.toJSON(), addresses: await customerAddresses(customer._id) });
  }),
);

adminManageRouter.patch(
  '/customers/:id/addresses/:addressId',
  param('id').isMongoId().withMessage('Invalid customer id'),
  param('addressId').isMongoId().withMessage('Invalid address id'),
  ...addressRules(false),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const customer = await findCustomer(req.params.id);
    const address = await SavedAddress.findOne({ _id: req.params.addressId, customerId: customer._id });
    if (!address) throw new AppError(404, 'Address not found');
    const { label, line1, city, pincode, isDefault } = req.body as Record<string, unknown>;
    if (typeof label === 'string') address.label = label.trim();
    if (typeof line1 === 'string') address.line1 = line1.trim();
    if (typeof city === 'string') address.city = city.trim();
    if (pincode !== undefined) address.pincode = typeof pincode === 'string' && pincode.trim() ? pincode.trim() : undefined;
    if (isDefault === true && !address.isDefault) {
      await SavedAddress.updateMany({ customerId: customer._id, _id: { $ne: address._id } }, { isDefault: false });
      address.isDefault = true;
    }
    // Un-setting the default only works by picking another one (a customer with addresses keeps one default).
    await address.save();
    res.locals.activity = {
      summary:
        isDefault === true && Object.keys(req.body).length === 1
          ? `Made ${customer.name}'s ${address.label} address the default`
          : `Edited ${customer.name}'s ${address.label} address — ${addressLine(address)}`,
      targetType: 'user',
      targetLabel: customer.name,
      fields: ['addresses'],
    };
    res.json({ address: address.toJSON(), addresses: await customerAddresses(customer._id) });
  }),
);

adminManageRouter.delete(
  '/customers/:id/addresses/:addressId',
  param('id').isMongoId().withMessage('Invalid customer id'),
  param('addressId').isMongoId().withMessage('Invalid address id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const customer = await findCustomer(req.params.id);
    const address = await SavedAddress.findOneAndDelete({ _id: req.params.addressId, customerId: customer._id });
    if (!address) throw new AppError(404, 'Address not found');
    if (address.isDefault) {
      // Keep one default: the newest remaining address takes over.
      const next = await SavedAddress.findOne({ customerId: customer._id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    res.locals.activity = {
      summary: `Deleted ${customer.name}'s ${address.label} address — ${addressLine(address)}`,
      targetType: 'user',
      targetLabel: customer.name,
      fields: ['addresses'],
    };
    res.json({ addresses: await customerAddresses(customer._id) });
  }),
);

/* ------------------------------------------------------------------ */
/* Reviews: reply, permanent delete                                    */
/* ------------------------------------------------------------------ */

async function reviewLabel(review: { customerId: unknown; stars: number; bookingId: unknown }): Promise<string> {
  const customer = await User.findById(review.customerId).select('name').lean<{ name?: string }>();
  const first = customer?.name?.split(' ')[0] || 'a customer';
  return `${review.stars}★ review by ${first} (booking ${refOf(review.bookingId)})`;
}

/**
 * PUT /admin/reviews/:id/reply { text } → { reply }. One reply per review: the first save creates it (and
 * tells the customer — Business settings → Messages → "Review reply"), later saves edit it.
 */
adminManageRouter.put(
  '/reviews/:id/reply',
  param('id').isMongoId().withMessage('Invalid review id'),
  body('text')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Write the reply first')
    .isLength({ max: REPLY_MAX })
    .withMessage(`Keep the reply under ${REPLY_MAX} characters`),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError(404, 'Review not found');
    const text = String(req.body.text).trim();
    const name = await adminName(req.user!.id);
    const first = !review.reply?.text;
    const now = new Date();
    if (first) {
      review.reply = { text, byId: new Types.ObjectId(req.user!.id), byName: name, at: now };
    } else if (review.reply && review.reply.text !== text) {
      review.reply = { ...review.reply, text, byId: new Types.ObjectId(req.user!.id), byName: name, editedAt: now };
    }
    review.markModified('reply');
    await review.save();

    if (first) {
      void (async () => {
        const tpl = await messageFor('review_replied', 'customer');
        const booking = await Booking.findById(review.bookingId).populate('serviceId', 'name');
        if (!tpl || !booking) return;
        const vars = { ...(await bookingTemplateVars(booking)), note: clip(text, 200) };
        await notifyUser(review.customerId, fillTemplate(tpl.title, vars) || tpl.title, fillTemplate(tpl.body, vars), 'review_replied', booking._id as Types.ObjectId);
      })().catch((err) => console.error('[reviews] reply notification failed', err));
    }
    if (!review.hidden) revalidateWebsite(['testimonials']);
    res.locals.activity = {
      summary: `${first ? 'Replied to' : 'Edited the reply on'} the ${await reviewLabel(review)}: “${clip(text, 80)}”`,
      targetType: 'review',
      fields: ['reply'],
    };
    res.json({ reply: adminReviewReply(review.reply) });
  }),
);

adminManageRouter.delete(
  '/reviews/:id/reply',
  param('id').isMongoId().withMessage('Invalid review id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError(404, 'Review not found');
    if (!review.reply?.text) throw new AppError(404, 'This review has no reply');
    review.reply = null;
    review.markModified('reply');
    await review.save();
    if (!review.hidden) revalidateWebsite(['testimonials']);
    res.locals.activity = { summary: `Removed the reply on the ${await reviewLabel(review)}`, targetType: 'review', fields: ['reply'] };
    res.json({ reply: null });
  }),
);

/**
 * DELETE /admin/reviews/:id → { ok, technicianId, technicianRating }. Permanent: the technician's real
 * rating is recalculated; service ratings, the dashboard and the website count reviews live, so they follow.
 */
adminManageRouter.delete(
  '/reviews/:id',
  param('id').isMongoId().withMessage('Invalid review id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError(404, 'Review not found');
    const label = await reviewLabel(review);
    await Review.deleteOne({ _id: review._id });
    const technicianRating = await recomputeTechnicianRating(review.technicianId);
    revalidateWebsite(['testimonials', 'services']);
    res.locals.activity = {
      summary: `Deleted the ${label}${review.comment ? `: “${clip(review.comment, 60)}”` : ''}`,
      targetType: 'review',
      fields: ['review'],
    };
    res.json({ ok: true, technicianId: String(review.technicianId), technicianRating });
  }),
);

/* ------------------------------------------------------------------ */
/* Offers: permanent delete, duplicate                                 */
/* ------------------------------------------------------------------ */

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

/** DELETE /admin/offers/:id/permanent → { ok } — 409 OFFER_USED when any booking carries the code. */
adminManageRouter.delete(
  '/offers/:id/permanent',
  param('id').isMongoId().withMessage('Invalid offer id'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);
    if (!offer) throw new AppError(404, 'Offer not found');
    if ((offer.useCount ?? 0) > 0 || (await offerEverUsed(offer.code))) {
      const stats = (await offerStatsFor([offer.code])).get(offer.code);
      const n = Math.max(stats ? stats.uses + stats.cancelled : 0, offer.useCount ?? 0);
      throw new AppError(
        409,
        `${offer.code} is on ${n} booking${n === 1 ? '' : 's'}, so it stays for your records. Switch it off instead.`,
        'OFFER_USED',
      );
    }
    await Offer.deleteOne({ _id: offer._id });
    revalidateWebsite(['offers']);
    res.locals.activity = { summary: `Deleted offer ${offer.code} (never used)`, targetType: 'offer', targetLabel: offer.code, fields: ['offer'] };
    res.json({ ok: true });
  }),
);

/**
 * POST /admin/offers/:id/duplicate { code? } → 201 { offer }. Same discount, rules and description, a new
 * code ("<CODE>-COPY" unless one is sent), no uses, switched off until you turn it on; a past expiry is dropped.
 */
adminManageRouter.post(
  '/offers/:id/duplicate',
  param('id').isMongoId().withMessage('Invalid offer id'),
  body('code').optional({ values: 'falsy' }).isString().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const source = await Offer.findById(req.params.id);
    if (!source) throw new AppError(404, 'Offer not found');
    let code: string;
    if (typeof req.body.code === 'string' && req.body.code.trim()) {
      code = req.body.code.trim().toUpperCase();
      if (!CODE_RE.test(code)) throw new AppError(400, 'Codes use 2–30 letters, digits, - or _');
      if (await Offer.exists({ code })) throw new AppError(409, `${code} already exists`, 'CONFLICT');
    } else {
      const base = `${source.code.slice(0, 25)}-COPY`;
      code = base;
      for (let n = 2; await Offer.exists({ code }); n += 1) code = `${base}${n}`;
    }
    const keepExpiry = source.expiresAt && source.expiresAt.getTime() > Date.now();
    const offer = await Offer.create({
      code,
      discount: source.discount,
      discountType: source.discountType,
      description: source.description,
      active: false,
      ...(keepExpiry ? { expiresAt: source.expiresAt } : {}),
      ...(source.maxUses != null ? { maxUses: source.maxUses } : {}),
      ...(source.minOrderAmount != null ? { minOrderAmount: source.minOrderAmount } : {}),
      useCount: 0,
    });
    res.locals.activity = {
      summary: `Duplicated offer ${source.code} as ${code} (switched off)`,
      targetId: String(offer._id),
      targetType: 'offer',
      targetLabel: code,
      fields: ['code'],
    };
    res.status(201).json({ offer: offer.toJSON() });
  }),
);
