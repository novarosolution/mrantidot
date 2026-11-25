import '../types/express';
import { Router, type Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import type { ActivityNote } from '../middleware/activityLog';
import { PayAdjustment, type IPayAdjustment } from '../models/PayAdjustment';
import { PAYOUT_METHODS, Payout, type IPayout, type PayoutMethod } from '../models/Payout';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { businessDayRange, daysInclusive, optionalDateKey, optionalObjectId, parseDateRange } from '../utils/adminList';
import { monthRange } from '../utils/attendance';
import { localDateKey } from '../utils/dateKey';
import { payoutCountsFor } from '../utils/payrollLedger';

/**
 * Technician payouts and pay adjustments. Mounted at /api/admin/payroll, before the admin router, so
 * GET /api/admin/payroll itself (the per-technician table) still reaches admin.routes.ts.
 *
 *   GET    /payouts?technicianId&month|from&to&limit     payouts whose pay period overlaps the range
 *                                                         (`counted` = the whole period is inside it)
 *   POST   /payouts      { technicianId, periodFrom, periodTo, amount, method, reference?, paidAt?, note? }
 *   DELETE /payouts/:id
 *   GET    /adjustments?technicianId&month|from&to&limit  bonuses (+) / deductions (−) dated in the range
 *   POST   /adjustments  { technicianId, date, amount, reason }
 *   DELETE /adjustments/:id
 */
export const payrollRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')];

export const PAYOUT_AMOUNT_MAX = 10_000_000;
export const PAY_ADJUSTMENT_AMOUNT_MAX = 1_000_000;
export const PAYOUT_REFERENCE_MAX = 120;
export const PAYOUT_NOTE_MAX = 300;
export const PAY_ADJUSTMENT_REASON_MIN = 3;
export const PAY_ADJUSTMENT_REASON_MAX = 200;
const PERIOD_MAX_DAYS = 366;
const LIST_LIMIT_DEFAULT = 200;
const LIST_LIMIT_MAX = 500;

const METHOD_LABELS: Record<PayoutMethod, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', other: 'Other' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function noteActivity(res: Response, note: ActivityNote): void {
  res.locals.activity = note;
}

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** "24 Nov 2026". */
function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1] ?? ''} ${y}`;
}

/** "1–30 Nov 2026", "25 Oct – 24 Nov 2026", "28 Dec 2026 – 3 Jan 2027". */
function periodLabel(from: string, to: string): string {
  if (from === to) return dayLabel(from);
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m2 - 1]} ${y2}`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y2}`;
  return `${dayLabel(from)} – ${dayLabel(to)}`;
}

/** `month` (YYYY-MM) or `from` + `to`; null when neither is sent (= every date). */
function rangeOf(query: Record<string, unknown>): { from: string; to: string } | null {
  const custom = parseDateRange(query, { maxDays: PERIOD_MAX_DAYS });
  if ((custom.from && !custom.to) || (!custom.from && custom.to)) throw new AppError(400, 'Send both from and to');
  if (custom.from && custom.to) return { from: custom.from, to: custom.to };
  if (typeof query.month === 'string' && query.month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) throw new AppError(400, 'month must be YYYY-MM');
    return monthRange(query.month);
  }
  return null;
}

function listLimit(raw: unknown): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, LIST_LIMIT_MAX) : LIST_LIMIT_DEFAULT;
}

async function technicianOr404(id: unknown): Promise<{ _id: Types.ObjectId; name: string }> {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) throw new AppError(400, 'Pick a technician');
  const tech = await User.findOne({ _id: id, role: 'technician' }).select('name').lean<{ _id: Types.ObjectId; name: string }>();
  if (!tech) throw new AppError(404, 'Technician not found');
  return tech;
}

async function namesOf(ids: Types.ObjectId[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.map(String))];
  if (unique.length === 0) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select('name').lean<{ _id: Types.ObjectId; name: string }[]>();
  return new Map(users.map((u) => [String(u._id), u.name]));
}

async function adminName(id: string): Promise<string> {
  const user = await User.findById(id).select('name').lean<{ name?: string }>();
  return user?.name || 'Admin';
}

function iso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function payoutJson(p: IPayout, names: Map<string, string>, range: { from: string; to: string } | null) {
  return {
    id: String(p._id),
    technicianId: String(p.technicianId),
    technicianName: names.get(String(p.technicianId)),
    periodFrom: p.periodFrom,
    periodTo: p.periodTo,
    amount: p.amount,
    method: p.method,
    reference: p.reference || undefined,
    paidAt: iso(p.paidAt),
    note: p.note || undefined,
    createdBy: { id: String(p.createdBy), name: p.createdByName || 'Admin' },
    createdAt: iso(p.createdAt),
    ...(range ? { counted: payoutCountsFor(p, range.from, range.to) } : {}),
  };
}

function adjustmentJson(a: IPayAdjustment, names: Map<string, string>) {
  return {
    id: String(a._id),
    technicianId: String(a.technicianId),
    technicianName: names.get(String(a.technicianId)),
    date: a.date,
    amount: a.amount,
    reason: a.reason,
    createdBy: { id: String(a.createdBy), name: a.createdByName || 'Admin' },
    createdAt: iso(a.createdAt),
  };
}

/** `paidAt`: an ISO time, or a business day (YYYY-MM-DD → midday that day, or now for today). Never in the future. */
function paidAtFrom(raw: unknown): Date {
  if (raw === undefined || raw === null || raw === '') return new Date();
  const today = localDateKey();
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const key = optionalDateKey(raw, 'paidAt')!;
    if (key > today) throw new AppError(400, 'The payment date can’t be in the future.');
    if (key === today) return new Date();
    return new Date(businessDayRange(key, key).start.getTime() + 12 * 3_600_000);
  }
  const d = typeof raw === 'string' ? new Date(raw) : NaN;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) throw new AppError(400, 'Invalid payment date');
  if (d.getTime() > Date.now() + 5 * 60_000) throw new AppError(400, 'The payment date can’t be in the future.');
  return d;
}

/* ---------- payouts ---------- */

payrollRouter.get(
  '/payouts',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, unknown>;
    const range = rangeOf(query);
    const tech = optionalObjectId(query.technicianId, 'technicianId');
    const filter: Record<string, unknown> = {};
    if (tech) filter.technicianId = tech;
    if (range) Object.assign(filter, { periodFrom: { $lte: range.to }, periodTo: { $gte: range.from } });
    const payouts = await Payout.find(filter).sort({ paidAt: -1, _id: -1 }).limit(listLimit(query.limit));
    const names = await namesOf(payouts.map((p) => p.technicianId));
    res.json({
      ...(range ? { from: range.from, to: range.to } : {}),
      payouts: payouts.map((p) => payoutJson(p, names, range)),
    });
  }),
);

payrollRouter.post(
  '/payouts',
  ...adminOnly,
  body('technicianId').isMongoId().withMessage('Pick a technician'),
  body('periodFrom').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Pick the pay period'),
  body('periodTo').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Pick the pay period'),
  body('amount')
    .isFloat({ min: 1, max: PAYOUT_AMOUNT_MAX })
    .withMessage(`Enter an amount between ₹1 and ${rupee(PAYOUT_AMOUNT_MAX)}`),
  body('method').isIn(PAYOUT_METHODS as unknown as string[]).withMessage('Pick how the technician was paid'),
  body('reference')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: PAYOUT_REFERENCE_MAX })
    .withMessage(`Keep the reference under ${PAYOUT_REFERENCE_MAX} characters`),
  body('note')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: PAYOUT_NOTE_MAX })
    .withMessage(`Keep the note under ${PAYOUT_NOTE_MAX} characters`),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const tech = await technicianOr404(req.body.technicianId);
    const periodFrom = optionalDateKey(req.body.periodFrom, 'periodFrom')!;
    const periodTo = optionalDateKey(req.body.periodTo, 'periodTo')!;
    if (periodTo < periodFrom) throw new AppError(400, 'The pay period must end on or after its start.');
    if (daysInclusive(periodFrom, periodTo) > PERIOD_MAX_DAYS) throw new AppError(400, `Keep the pay period to ${PERIOD_MAX_DAYS} days or less.`);
    const amount = Math.round(Number(req.body.amount));
    if (amount < 1) throw new AppError(400, 'Enter an amount of at least ₹1.');
    const method = req.body.method as PayoutMethod;
    const reference = typeof req.body.reference === 'string' ? req.body.reference.trim() : '';
    const note = typeof req.body.note === 'string' ? req.body.note.trim().replace(/\s+/g, ' ') : '';
    const paidAt = paidAtFrom(req.body.paidAt);

    // A double tap (same technician, period and amount within a minute) is refused rather than paid twice.
    const recent = await Payout.findOne({
      technicianId: tech._id,
      periodFrom,
      periodTo,
      amount,
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    }).select('_id');
    if (recent) {
      throw new AppError(409, 'This payout was recorded a moment ago. Check the history before adding it again.', 'DUPLICATE_PAYOUT');
    }

    const payout = await Payout.create({
      technicianId: tech._id,
      periodFrom,
      periodTo,
      amount,
      method,
      ...(reference ? { reference } : {}),
      paidAt,
      ...(note ? { note } : {}),
      createdBy: new Types.ObjectId(req.user!.id),
      createdByName: await adminName(req.user!.id),
    });
    noteActivity(res, {
      summary: `Recorded a ${rupee(amount)} payout to ${tech.name} for ${periodLabel(periodFrom, periodTo)} (${METHOD_LABELS[method]}${
        reference ? ` · ref ${reference}` : ''
      })`,
      targetId: String(tech._id),
      targetType: 'technician',
      targetLabel: tech.name,
      fields: ['payout'],
    });
    const names = new Map([[String(tech._id), tech.name]]);
    res.status(201).json({ payout: payoutJson(payout, names, null) });
  }),
);

payrollRouter.delete(
  '/payouts/:id',
  ...adminOnly,
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const payout = await Payout.findByIdAndDelete(req.params.id);
    if (!payout) throw new AppError(404, 'Payout not found — it may have been deleted already.');
    const names = await namesOf([payout.technicianId]);
    const techName = names.get(String(payout.technicianId)) ?? 'a technician';
    noteActivity(res, {
      summary: `Deleted the ${rupee(payout.amount)} payout to ${techName} for ${periodLabel(payout.periodFrom, payout.periodTo)}`,
      targetId: String(payout.technicianId),
      targetType: 'technician',
      targetLabel: techName,
      fields: ['payout'],
    });
    res.json({ ok: true, payout: payoutJson(payout, names, null) });
  }),
);

/* ---------- pay adjustments ---------- */

payrollRouter.get(
  '/adjustments',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, unknown>;
    const range = rangeOf(query);
    const tech = optionalObjectId(query.technicianId, 'technicianId');
    const filter: Record<string, unknown> = {};
    if (tech) filter.technicianId = tech;
    if (range) filter.date = { $gte: range.from, $lte: range.to };
    const adjustments = await PayAdjustment.find(filter).sort({ date: -1, createdAt: -1 }).limit(listLimit(query.limit));
    const names = await namesOf(adjustments.map((a) => a.technicianId));
    res.json({
      ...(range ? { from: range.from, to: range.to } : {}),
      adjustments: adjustments.map((a) => adjustmentJson(a, names)),
    });
  }),
);

payrollRouter.post(
  '/adjustments',
  ...adminOnly,
  body('technicianId').isMongoId().withMessage('Pick a technician'),
  body('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Pick the date'),
  body('amount')
    .isFloat({ min: -PAY_ADJUSTMENT_AMOUNT_MAX, max: PAY_ADJUSTMENT_AMOUNT_MAX })
    .withMessage(`Enter an amount up to ${rupee(PAY_ADJUSTMENT_AMOUNT_MAX)}`),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: PAY_ADJUSTMENT_REASON_MIN, max: PAY_ADJUSTMENT_REASON_MAX })
    .withMessage(`Give a reason (${PAY_ADJUSTMENT_REASON_MIN}–${PAY_ADJUSTMENT_REASON_MAX} characters)`),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const tech = await technicianOr404(req.body.technicianId);
    const date = optionalDateKey(req.body.date, 'date')!;
    const amount = Math.round(Number(req.body.amount));
    if (!Number.isFinite(amount) || amount === 0) throw new AppError(400, 'Enter a bonus or a deduction amount.');
    const reason = String(req.body.reason).trim().replace(/\s+/g, ' ');
    const adjustment = await PayAdjustment.create({
      technicianId: tech._id,
      date,
      amount,
      reason,
      createdBy: new Types.ObjectId(req.user!.id),
      createdByName: await adminName(req.user!.id),
    });
    const kind = amount > 0 ? 'bonus' : 'deduction';
    noteActivity(res, {
      summary: `Added a ${rupee(Math.abs(amount))} ${kind} for ${tech.name} on ${dayLabel(date)} — ${reason}`,
      targetId: String(tech._id),
      targetType: 'technician',
      targetLabel: tech.name,
      fields: ['payAdjustment'],
    });
    res.status(201).json({ adjustment: adjustmentJson(adjustment, new Map([[String(tech._id), tech.name]])) });
  }),
);

payrollRouter.delete(
  '/adjustments/:id',
  ...adminOnly,
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const adjustment = await PayAdjustment.findByIdAndDelete(req.params.id);
    if (!adjustment) throw new AppError(404, 'Adjustment not found — it may have been deleted already.');
    const names = await namesOf([adjustment.technicianId]);
    const techName = names.get(String(adjustment.technicianId)) ?? 'a technician';
    const kind = adjustment.amount > 0 ? 'bonus' : 'deduction';
    noteActivity(res, {
      summary: `Deleted the ${rupee(Math.abs(adjustment.amount))} ${kind} for ${techName} (${dayLabel(adjustment.date)})`,
      targetId: String(adjustment.technicianId),
      targetType: 'technician',
      targetLabel: techName,
      fields: ['payAdjustment'],
    });
    res.json({ ok: true, adjustment: adjustmentJson(adjustment, names) });
  }),
);
