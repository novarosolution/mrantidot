import '../types/express';
import { Router } from 'express';
import { Types } from 'mongoose';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { formatLeaveRequest, LeaveRequest } from '../models/LeaveRequest';
import { markLeaveRange, todayDateKey } from '../utils/attendance';

export const leaveRouter = Router();

leaveRouter.use(requireAuth);

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

/** Technician: request leave. */
leaveRouter.post(
  '/',
  requireRole('technician'),
  body('from').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('to').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('type').optional().isIn(['casual', 'sick', 'emergency', 'other']),
  body('reason').optional().trim().isLength({ max: 500 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const from = String(req.body.from);
    const to = String(req.body.to);
    if (to < from) throw new AppError(400, 'Leave end date must be on or after start date');

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
      type: req.body.type || 'casual',
      reason: req.body.reason,
      status: 'pending',
    });

    res.status(201).json({ leave: formatLeaveRequest(leave) });
  }),
);

/** Technician: list own leave. */
leaveRouter.get(
  '/me',
  requireRole('technician'),
  asyncHandler(async (req, res) => {
    const leaves = await LeaveRequest.find({ technicianId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ leaves: leaves.map((l) => formatLeaveRequest(l)) });
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
    res.json({ leave: formatLeaveRequest(leave) });
  }),
);

/** Admin: list leave (optional status filter). */
leaveRouter.get(
  '/',
  requireRole('admin'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.status === 'string') filter.status = req.query.status;
    else filter.status = 'pending';

    const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 }).limit(100);
    const techIds = [...new Set(leaves.map((l) => String(l.technicianId)))];
    const techs = await User.find({ _id: { $in: techIds } }).select('name phone');
    const byId = new Map(techs.map((t) => [String(t._id), t]));

    res.json({
      leaves: leaves.map((l) => formatLeaveRequest(l, byId.get(String(l.technicianId)))),
    });
  }),
);

/** Admin: approve leave → mark attendance leave + off duty if today covered. */
leaveRouter.post(
  '/:id/approve',
  requireRole('admin'),
  param('id').isMongoId(),
  body('adminNote').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) throw new AppError(404, 'Leave request not found');
    if (leave.status !== 'pending') {
      throw new AppError(400, 'Leave is not pending');
    }

    leave.status = 'approved';
    leave.decidedBy = new Types.ObjectId(req.user!.id);
    leave.decidedAt = new Date();
    if (req.body.adminNote) leave.adminNote = req.body.adminNote;
    await leave.save();

    await markLeaveRange(
      leave.technicianId,
      leave.from,
      leave.to,
      leave.reason || 'Approved leave',
    );

    const today = todayDateKey();
    if (leave.from <= today && leave.to >= today) {
      await User.findByIdAndUpdate(leave.technicianId, { available: false });
    }

    const tech = await User.findById(leave.technicianId).select('name phone');
    res.json({ leave: formatLeaveRequest(leave, tech) });
  }),
);

/** Admin: reject leave. */
leaveRouter.post(
  '/:id/reject',
  requireRole('admin'),
  param('id').isMongoId(),
  body('adminNote').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) throw new AppError(404, 'Leave request not found');
    if (leave.status !== 'pending') {
      throw new AppError(400, 'Leave is not pending');
    }

    leave.status = 'rejected';
    leave.decidedBy = new Types.ObjectId(req.user!.id);
    leave.decidedAt = new Date();
    if (req.body.adminNote) leave.adminNote = req.body.adminNote;
    await leave.save();

    const tech = await User.findById(leave.technicianId).select('name phone');
    res.json({ leave: formatLeaveRequest(leave, tech) });
  }),
);
