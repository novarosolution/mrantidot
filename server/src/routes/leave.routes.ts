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
import { Booking } from '../models/Booking';
import { TechnicianAttendance } from '../models/TechnicianAttendance';
import { BUSY_JOB_STATUSES } from '../utils/technicianFit';
import { fillTemplate, getBusinessSettings, listLabel, messageFor } from '../utils/businessSettings';
import { notifyAdmins, notifyUser } from '../utils/notifications';
import {
  daysInclusive,
  optionalDateKey,
  optionalObjectId,
  requireObjectId,
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
/** Longest leave an admin enters in one go (days) — e.g. a long medical leave. */
const ADMIN_MAX_LEAVE_DAYS = 120;

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
  event: 'leave_requested' | 'leave_approved' | 'leave_rejected' | 'leave_added' | 'leave_cancelled',
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
  const ids = [
    ...new Set(
      leaves.flatMap((l) => [l.decidedBy ? String(l.decidedBy) : '', l.cancelledBy ? String(l.cancelledBy) : '']).filter(Boolean),
    ),
  ];
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
  const cancelledBy = leave.cancelledBy ? String(leave.cancelledBy) : undefined;
  return {
    ...json,
    days: daysInclusive(json.from, json.to),
    decidedByName: json.decidedBy ? deciders?.get(json.decidedBy) : undefined,
    /** `admin` = entered by an admin and approved straight away. */
    source: leave.source ?? 'technician',
    cancelledBy,
    cancelledByName: cancelledBy ? deciders?.get(cancelledBy) : undefined,
    cancelledAt: leave.cancelledAt instanceof Date ? leave.cancelledAt.toISOString() : undefined,
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


/** Jobs a technician still holds on the given days (to hand to someone else). */
async function jobsInRange(technicianId: Types.ObjectId, from: string, to: string) {
  const bookings = await Booking.find({
    technicianId,
    'schedule.date': { $gte: from, $lte: to },
    status: { $in: BUSY_JOB_STATUSES },
  })
    .select('schedule status serviceId')
    .populate('serviceId', 'name')
    .sort({ 'schedule.date': 1, 'schedule.slot': 1 })
    .limit(50);
  return bookings.map((b) => {
    const id = String(b._id);
    const service = b.serviceId as unknown as { name?: string } | null;
    return {
      bookingId: id,
      ref: `#${id.slice(-6).toUpperCase()}`,
      date: b.schedule?.date,
      slot: b.schedule?.slot,
      status: b.status,
      serviceName: service?.name ?? 'Service',
    };
  });
}

/**
 * Admin: add leave for a technician — POST /leave/admin { technicianId, from, to, type, note? } → 201
 * { leave, jobs }. Approved straight away: attendance is marked leave for those days (and the technician
 * goes off duty when today is covered), the technician is told (Business settings → Messages → "Leave added"),
 * and `jobs` lists the visits they still hold on those days so they can be handed to someone else.
 */
leaveRouter.post(
  '/admin',
  requireRole('admin'),
  body('technicianId').isMongoId().withMessage('Pick a technician'),
  body('from').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Pick the first day'),
  body('to').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Pick the last day'),
  body('type').optional().isString().trim(),
  body('note').optional({ nullable: true }).isString().trim().isLength({ max: 500 }).withMessage('Keep the note under 500 characters'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const from = optionalDateKey(req.body.from, 'from')!;
    const to = optionalDateKey(req.body.to, 'to')!;
    if (to < from) throw new AppError(400, 'The last day must be on or after the first day');
    if (daysInclusive(from, to) > ADMIN_MAX_LEAVE_DAYS) {
      throw new AppError(400, `Add at most ${ADMIN_MAX_LEAVE_DAYS} days at a time`);
    }
    const techId = requireObjectId(req.body.technicianId, 'technician');
    const tech = await User.findOne({ _id: techId, role: 'technician' }).select('name phone');
    if (!tech) throw new AppError(404, 'Technician not found');

    const settings = await getBusinessSettings();
    const types = settings.lists.leaveTypes;
    const type = typeof req.body.type === 'string' && req.body.type ? req.body.type : (types.find((t) => t.active) ?? types[0])?.key;
    if (!type || !types.some((t) => t.key === type)) throw new AppError(400, 'Pick a leave type from Business settings');

    const overlap = await LeaveRequest.findOne({
      technicianId: tech._id,
      status: { $in: ['pending', 'approved'] },
      from: { $lte: to },
      to: { $gte: from },
    }).sort({ from: 1 });
    if (overlap) {
      const when = leaveDates(overlap.from, overlap.to);
      throw new AppError(
        400,
        overlap.status === 'approved'
          ? `${tech.name} is already on leave ${when}. Pick other days.`
          : `${tech.name} has a pending request for ${when} — approve or reject it instead.`,
        'LEAVE_OVERLAP',
      );
    }

    const note = typeof req.body.note === 'string' && req.body.note.trim() ? req.body.note.trim() : undefined;
    const leave = await LeaveRequest.create({
      technicianId: tech._id,
      from,
      to,
      type,
      status: 'approved',
      source: 'admin',
      adminNote: note,
      decidedBy: new Types.ObjectId(req.user!.id),
      decidedAt: new Date(),
    });
    await markLeaveRange(tech._id as Types.ObjectId, from, to, note || 'Leave added by admin');
    const today = todayDateKey();
    if (from <= today && to >= today) await User.findByIdAndUpdate(tech._id, { available: false });

    notifyQuietly(async () => {
      const msg = await leaveMessage('leave_added', 'tech', leave, { note });
      if (msg) await notifyUser(tech._id as Types.ObjectId, msg.title, msg.body, 'leave_added');
    });

    const typeName = await leaveTypeName(type);
    res.locals.activity = {
      summary: `Added ${typeName} leave for ${tech.name} (${leaveDates(from, to)})`,
      targetId: String(leave._id),
      targetType: 'leave',
      targetLabel: tech.name,
      fields: ['from', 'to', 'type', ...(note ? ['note'] : [])],
    };
    const deciders = await decidedByNames([leave]);
    res.status(201).json({ leave: leaveJson(leave, tech, deciders), jobs: await jobsInRange(tech._id as Types.ObjectId, from, to) });
  }),
);

/**
 * Admin: cancel approved leave that has not ended — POST /leave/:id/cancel-approved { adminNote? } → { leave }.
 * Attendance "leave" marks the system made for today and later are cleared (past days stay as they were),
 * and the technician is told (Business settings → Messages → "Leave cancelled").
 */
leaveRouter.post(
  '/:id/cancel-approved',
  requireRole('admin'),
  param('id').isMongoId(),
  body('adminNote').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) throw new AppError(404, 'Leave request not found');
    if (leave.status !== 'approved') throw new AppError(400, 'Only approved leave can be cancelled here');
    const today = todayDateKey();
    if (leave.to < today) throw new AppError(400, 'This leave is already over');

    const note = typeof req.body.adminNote === 'string' && req.body.adminNote.trim() ? req.body.adminNote.trim() : undefined;
    leave.status = 'cancelled';
    leave.cancelledBy = new Types.ObjectId(req.user!.id);
    leave.cancelledAt = new Date();
    if (note) leave.adminNote = note;
    await leave.save();

    const clearFrom = leave.from > today ? leave.from : today;
    await TechnicianAttendance.deleteMany({
      technicianId: leave.technicianId,
      date: { $gte: clearFrom, $lte: leave.to },
      status: 'leave',
      source: 'system',
    });

    notifyQuietly(async () => {
      const msg = await leaveMessage('leave_cancelled', 'tech', leave, { note });
      if (msg) await notifyUser(leave.technicianId, msg.title, msg.body, 'leave_cancelled');
    });

    const [tech, deciders] = await Promise.all([User.findById(leave.technicianId).select('name phone'), decidedByNames([leave])]);
    res.locals.activity = {
      summary: `Cancelled ${tech?.name ?? 'a technician'}'s ${await leaveTypeName(leave.type)} leave (${leaveDates(leave.from, leave.to)})`,
      targetType: 'leave',
      targetLabel: tech?.name,
      fields: ['status', ...(note ? ['adminNote'] : [])],
    };
    res.json({ leave: leaveJson(leave, tech, deciders) });
  }),
);
