import '../types/express';
import { Router } from 'express';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import {
  buildAttendanceCalendar,
  computeAttendanceAnalytics,
  computeJobAnalytics,
  loadAttendanceForRange,
  monthRange,
  parseMonthParam,
  todayDateKey,
} from '../utils/attendance';
import {
  buildJobVisitsForBookings,
  computeJobVisitAnalytics,
} from '../utils/jobVisit';
import { technicianPublicRating } from '../utils/ratings';
import { formatPaySummary, payConfigFromUser, resolveTechEarning } from '../utils/techPay';
import { adminDashboard, teamAttendance } from '../utils/adminDashboard';

export const statsRouter = Router();

/**
 * Dashboard + reports for one range — see utils/adminDashboard.ts for the definitions.
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD  (IST, at most ~10 years; daily points up to 62 days, then monthly)
 *   ?period=week|month|quarter|year  older app builds: rolling range ending today (default: last 30 days)
 */
statsRouter.get(
  '/admin',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    res.json(await adminDashboard(req.query as Record<string, unknown>));
  }),
);

statsRouter.get(
  '/technician',
  requireAuth,
  requireRole('technician'),
  asyncHandler(async (req, res) => {
    const techId = req.user!.id;
    const tech = await User.findById(techId);
    if (!tech) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }

    const month = parseMonthParam(
      typeof req.query.month === 'string' ? req.query.month : undefined,
    );
    const { from, to } = monthRange(month);
    const today = todayDateKey();

    const [assigned, inProgress, completed, awaitingVerification, completedBookings, monthBookings] =
      await Promise.all([
        Booking.countDocuments({ technicianId: techId, status: 'confirmed' }),
        Booking.countDocuments({ technicianId: techId, status: 'in_progress' }),
        Booking.countDocuments({ technicianId: techId, status: 'completed' }),
        Booking.countDocuments({ technicianId: techId, status: 'awaiting_verification' }),
        Booking.find({ technicianId: tech._id, status: 'completed' }).select(
          'amount technicianEarning schedule.date',
        ),
        Booking.find({
          technicianId: tech._id,
          'schedule.date': { $gte: from, $lte: to },
        }),
      ]);
    const techPay = payConfigFromUser(tech);
    const earningsAllTime = completedBookings.reduce(
      (sum, b) => sum + resolveTechEarning(b, techPay),
      0,
    );
    const monthCompleted = completedBookings.filter((b) => {
      const d = b.schedule?.date;
      return d != null && d >= from && d <= to;
    });
    const monthEarnings = monthCompleted.reduce(
      (sum, b) => sum + resolveTechEarning(b, techPay),
      0,
    );
    // Headline earnings follow the selected month (matches attendance / visit analytics).
    const earnings = monthEarnings;
    const attendanceRecords = await loadAttendanceForRange(tech._id, from, to);
    const attendance = buildAttendanceCalendar(attendanceRecords, from, to, today);
    const attendanceStats = computeAttendanceAnalytics(attendance, today);
    const jobStats = computeJobAnalytics(monthBookings, month);
    const visitStats = computeJobVisitAnalytics(monthBookings, today, month);
    const jobVisits = buildJobVisitsForBookings(monthBookings, today, month);

    res.json({
      assigned,
      inProgress,
      completed,
      awaitingVerification,
      rating: technicianPublicRating(tech),
      jobsDone: Math.max(tech.jobsDone ?? 0, completed),
      earnings,
      earningsAllTime,
      monthEarnings,
      paySummary: formatPaySummary(techPay),
      payMode: techPay.payMode ?? 'percent',
      payPercent: techPay.payPercent ?? 100,
      payFlat: techPay.payFlat ?? 0,
      month,
      attendance,
      todayStatus: attendance[today] ?? 'pending',
      jobVisits,
      analytics: {
        ...attendanceStats,
        ...jobStats,
        ...visitStats,
      },
    });
  }),
);

/** Team attendance for a range (`from` / `to`, at most 366 days, or legacy `period`) with per-technician rows. */
statsRouter.get(
  '/admin/team-attendance',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    res.json(await teamAttendance(req.query as Record<string, unknown>));
  }),
);
