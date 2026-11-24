import '../types/express';
import { Router } from 'express';
import { Types } from 'mongoose';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { formatLeaveRequest, LeaveRequest, type ILeaveRequest } from '../models/LeaveRequest';
import { markLeaveRange, todayDateKey } from '../utils/attendance';
import { fillTemplate, getBusinessSettings, listLabel, messageFor } from '../utils/businessSettings';
import { notifyAdmins, notifyUser } from '../utils/notifications';
import {
  daysInclusive,
  optionalObjectId,
  pageMeta,
  parseDateRange,
  parsePaging,
  parseSort,
  phoneDigits,
  searchRegex,
} from '../utils/adminList';

export const leaveRouter = Router();

leaveRouter.use(requireAuth);

const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
/** Longest single request (days). */
const MAX_LEAVE_DAYS = 60;

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

const dayFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayNoYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const utcDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** "12 Dec 2026", "12 Dec – 14 Dec 2026" or "28 Dec 2026 – 2 Jan 2027". */
function leaveDates(from: string, to: string): string {
  if (from === to) return dayFormat.format(utcDate(from));
  if (from.slice(0, 4) === to.slice(0, 4)) return `${dayNoYear.format(utcDate(from))} – ${dayFormat.format(utcDate(to))}`;
  return `${dayFormat.format(utcDate(from))} – ${dayFormat.format(utcDate(to))}`;
}

/** Leave type name from Business settings → Lists → Leave types. */
async function leaveTypeName(key: string): Promise<string> {
  const settings = await getBusinessSettings();
  return listLabel(settings.lists.leaveTypes, key).toLowerCase();
}

/** Notification text for a leave event, from Business settings → Messages. */
async function leaveMessage(
  event: 'leave_requested' | 'leave_approved' | 'leave_rejected',
  audience: 'admin' | 'tech',
  leave: ILeaveRequest,
  vars: { name?: string; note?: string },
): Promise<{ title: string; body: string } | undefined> {
  const tpl = await messageFor(event, audience);
  if (!tpl) return undefined;
  const values = {
    name: vars.name ?? '',
    type: await leaveTypeName(leave.type),
    date: leaveDates(leave.from, leave.to),
    note: vars.note ?? '',
  };
  return { title: fillTemplate(tpl.title, values) || tpl.title, body: fillTemplate(tpl.body, values) };
}

/** Never let a notification problem fail the request that triggered it. */
function notifyQuietly(work: () => Promise<void>): void {
  void work().catch((err) => console.error('[leave] notification failed', err));
}

async function decidedByNames(leaves: ILeaveRequest[]): Promise<Map<string, string>> {
  const ids = [...new Set(leaves.map((l) => (l.decidedBy ? String(l.decidedBy) : '')).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const admins = await User.find({ _id: { $in: ids } }).select('name').lean();
  return new Map(admins.map((a) => [String(a._id), a.name]));
}

function leaveJson(
  leave: ILeaveRequest,
  tech?: { name?: string; phone?: string } | null,
  deciders?: Map<string, string>,
) {
  const json = formatLeaveRequest(leave, tech);
  return {
    ...json,
    days: daysInclusive(json.from, json.to),
    decidedByName: json.decidedBy ? deciders?.get(json.decidedBy) : undefined,
  };
}

/** Technician: request leave (type must be one the admin has switched on). Admins are notified. */
leaveRouter.post(
  '/',
  requireRole('technician'),
  body('from').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('to').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('type').optional().isString().trim(),
  body('reason').optional().trim().isLength({ max: 500 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const from = String(req.body.from);
    const to = String(req.body.to);
    if (to < from) throw new AppError(400, 'Leave end date must be on or after start date');
    if (daysInclusive(from, to) > MAX_LEAVE_DAYS) {
      throw new AppError(400, `A leave request can cover at most ${MAX_LEAVE_DAYS} days`);
    }

    const settings = await getBusinessSettings();
    const activeTypes = settings.lists.leaveTypes.filter((t) => t.active);
    if (activeTypes.length === 0) throw new AppError(400, 'Leave requests are switched off right now');
    const type = typeof req.body.type === 'string' && req.body.type ? req.body.type : activeTypes[0].key;
    if (!activeTypes.some((t) => t.key === type)) {
      throw new AppError(400, 'This leave type is not available');
    }

    const overlap = await LeaveRequest.findOne({
      technicianId: req.user!.id,
      status: { $in: ['pending', 'approved'] },
      from: { $lte: to },
      to: { $gte: from },
    });
    if (overlap) {
      throw new AppError(400, 'You already have leave covering these dates');
    }

    const leave = await LeaveRequest.create({
      technicianId: req.user!.id,
      from,
      to,
      type,
      reason: req.body.reason,
      status: 'pending',
    });

    const tech = await User.findById(req.user!.id).select('name phone');
    notifyQuietly(async () => {
      const msg = await leaveMessage('leave_requested', 'admin', leave, { name: tech?.name, note: leave.reason });
      if (msg) await notifyAdmins(msg.title, msg.body, 'admin_leave_requested');
    });

    res.status(201).json({ leave: leaveJson(leave, tech) });
  }),
);

/** Technician: list own leave (newest first). */
leaveRouter.get(
  '/me',
  requireRole('technician'),
  asyncHandler(async (req, res) => {
    const leaves = await LeaveRequest.find({ technicianId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ leaves: leaves.map((l) => leaveJson(l)) });
  }),
);

/** Technician: cancel pending leave. */
leaveRouter.post(
  '/:id/cancel',
  requireRole('technician'),
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      technicianId: req.user!.id,
    });
    if (!leave) throw new AppError(404, 'Leave request not found');
    if (leave.status !== 'pending') {
      throw new AppError(400, 'Only pending leave can be cancelled');
    }
    leave.status = 'cancelled';
    await leave.save();
    res.json({ leave: leaveJson(leave) });
  }),
);

/**
 * Admin: list leave.
 *   status      pending (default) | approved | rejected | cancelled | all
 *   q           technician name / phone
 *   technicianId, type
 *   from, to    YYYY-MM-DD — leave that overlaps these days
 *   sort        created (default, newest first) | from;  order = asc | desc
 *   page, limit paging (default 25, max 100)
 * Adds `counts` per status for the same filters.
 */
leaveRouter.get(
  '/',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, unknown>;
    const base: Record<string, unknown> = {};

    const techId = optionalObjectId(query.technicianId, 'technicianId');
    if (techId) base.technicianId = techId;

    const rx = searchRegex(query.q);
    if (rx) {
      const digits = phoneDigits(query.q);
      const techs = await User.find({
        role: 'technician',
        $or: [{ name: rx }, ...(digits ? [{ phone: new RegExp(digits) }] : [])],
      })
        .select('_id')
        .limit(200)
        .lean();
      const ids = techs.map((t) => t._id);
      base.technicianId = techId ? (ids.some((id) => id.equals(techId)) ? techId : { $in: [] }) : { $in: ids };
    }

    if (typeof query.type === 'string' && query.type && query.type !== 'all') base.type = query.type;

    const { from, to } = parseDateRange(query);
    if (from) base.to = { $gte: from };
    if (to) base.from = { $lte: to };

    const status = typeof query.status === 'string' && query.status ? query.status : 'pending';
    if (status !== 'all' && !(LEAVE_STATUSES as readonly string[]).includes(status)) {
      throw new AppError(400, 'status must be pending, approved, rejected, cancelled or all');
    }
    const filter = status === 'all' ? base : { ...base, status };

    const paging = parsePaging(query);
    const { spec } = parseSort(query, { created: ['createdAt'], from: ['from', 'createdAt'] }, { key: 'created', order: 'desc' });

    const [leaves, total, statusRows] = await Promise.all([
      LeaveRequest.find(filter).sort(spec).skip(paging.skip).limit(paging.limit),
      LeaveRequest.countDocuments(filter),
      LeaveRequest.aggregate<{ _id: string; count: number }>([
        { $match: base },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const techIds = [...new Set(leaves.map((l) => String(l.technicianId)))];
    const [techs, deciders] = await Promise.all([
      User.find({ _id: { $in: techIds } }).select('name phone'),
      decidedByNames(leaves),
    ]);
    const byId = new Map(techs.map((t) => [String(t._id), t]));

    const counts: Record<string, number> = { all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const row of statusRows) {
      counts[String(row._id)] = row.count;
      counts.all += row.count;
    }

    res.json({
      leaves: leaves.map((l) => leaveJson(l, byId.get(String(l.technicianId)), deciders)),
      ...pageMeta(total, paging),
      counts,
    });
  }),
);

/** Shared approve / reject: saves the decision + optional note and tells the technician. */
async function decideLeave(
  id: string,
  adminId: string,
  decision: 'approved' | 'rejected',
  note: string | undefined,
): Promise<ILeaveRequest> {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw new AppError(404, 'Leave request not found');
  if (leave.status !== 'pending') {
    throw new AppError(400, 'Leave is not pending');
  }

  leave.status = decision;
  leave.decidedBy = new Types.ObjectId(adminId);
  leave.decidedAt = new Date();
  leave.adminNote = note?.trim() ? note.trim() : undefined;
  await leave.save();

  if (decision === 'approved') {
    await markLeaveRange(leave.technicianId, leave.from, leave.to, leave.reason || 'Approved leave');
    const today = todayDateKey();
    if (leave.from <= today && leave.to >= today) {
      await User.findByIdAndUpdate(leave.technicianId, { available: false });
    }
  }

  notifyQuietly(async () => {
    const event = decision === 'approved' ? 'leave_approved' : 'leave_rejected';
    const msg = await leaveMessage(event, 'tech', leave, { note: leave.adminNote });
    if (msg) await notifyUser(leave.technicianId, msg.title, msg.body, event);
  });

  return leave;
}

async function decisionResponse(leave: ILeaveRequest) {
  const [tech, deciders] = await Promise.all([
    User.findById(leave.technicianId).select('name phone'),
    decidedByNames([leave]),
  ]);
  return { leave: leaveJson(leave, tech, deciders) };
}

/** Admin: approve leave → attendance marked as leave (+ off duty when today is covered); technician notified. */
leaveRouter.post(
  '/:id/approve',
  requireRole('admin'),
  param('id').isMongoId(),
  body('adminNote').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await decideLeave(req.params.id, req.user!.id, 'approved', req.body.adminNote);
    res.json(await decisionResponse(leave));
  }),
);

/** Admin: reject leave (optional note); technician notified. */
leaveRouter.post(
  '/:id/reject',
  requireRole('admin'),
  param('id').isMongoId(),
  body('adminNote').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await decideLeave(req.params.id, req.user!.id, 'rejected', req.body.adminNote);
    res.json(await decisionResponse(leave));
  }),
);
