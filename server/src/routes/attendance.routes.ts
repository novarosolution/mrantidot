import '../types/express';
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { formatAttendance } from '../models/TechnicianAttendance';
import {
  buildAttendanceCalendar,
  computeAttendanceAnalytics,
  monthRange,
  parseMonthParam,
  todayDateKey,
  upsertAttendance,
  loadAttendanceForRange,
} from '../utils/attendance';

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

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

attendanceRouter.post(
  '/check-in',
  requireRole('technician'),
  asyncHandler(async (req, res) => {
    const tech = await User.findById(req.user!.id);
    if (!tech || tech.role !== 'technician') {
      throw new AppError(404, 'Technician not found');
    }
    if (tech.disabled) {
      throw new AppError(403, 'Account disabled');
    }

    const date = todayDateKey();
    const record = await upsertAttendance(tech._id, date, 'present', 'technician');
    tech.available = true;
    await tech.save();
    res.json({ attendance: formatAttendance(record), date, status: 'came', available: true });
  }),
);

attendanceRouter.post(
  '/mark-absent',
  requireRole('technician'),
  body('note').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const tech = await User.findById(req.user!.id);
    if (!tech || tech.role !== 'technician') {
      throw new AppError(404, 'Technician not found');
    }

    const date = todayDateKey();
    const record = await upsertAttendance(
      tech._id,
      date,
      'absent',
      'technician',
      req.body.note,
    );
    tech.available = false;
    await tech.save();
    res.json({ attendance: formatAttendance(record), date, status: 'not_came', available: false });
  }),
);

attendanceRouter.get(
  '/me',
  requireRole('technician'),
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('month').optional().matches(/^\d{4}-\d{2}$/),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const month = parseMonthParam(
      typeof req.query.month === 'string' ? req.query.month : undefined,
    );
    const range =
      typeof req.query.from === 'string' && typeof req.query.to === 'string'
        ? { from: req.query.from, to: req.query.to }
        : monthRange(month);

    const records = await loadAttendanceForRange(req.user!.id, range.from, range.to);
    const today = todayDateKey();
    const attendance = buildAttendanceCalendar(records, range.from, range.to, today);

    res.json({
      records: records.map((r) => formatAttendance(r)),
      attendance,
      month,
      from: range.from,
      to: range.to,
      todayStatus: attendance[today] ?? 'pending',
    });
  }),
);
