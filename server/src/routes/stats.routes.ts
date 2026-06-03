import '../types/express';
import { Router } from 'express';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { TechnicianAttendance } from '../models/TechnicianAttendance';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { formatBooking } from '../utils/format';
import {
  buildAttendanceCalendar,
  computeAttendanceAnalytics,
  computeJobAnalytics,
  loadAttendanceForRange,
  monthRange,
  parseMonthParam,
  periodAttendanceRange,
  todayDateKey,
} from '../utils/attendance';
import {
  buildJobVisitsForBookings,
  computeJobVisitAnalytics,
} from '../utils/jobVisit';

export const statsRouter = Router();

type Period = 'week' | 'month' | 'quarter' | 'year';

function periodStart(period: Period): Date {
  const now = new Date();
  const d = new Date(now);
  if (period === 'week') d.setDate(d.getDate() - 7);
  else if (period === 'month') d.setMonth(d.getMonth() - 1);
  else if (period === 'quarter') d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

function previousPeriodStart(period: Period): Date {
  const start = periodStart(period);
  const prev = new Date(start);
  if (period === 'week') prev.setDate(prev.getDate() - 7);
  else if (period === 'month') prev.setMonth(prev.getMonth() - 1);
  else if (period === 'quarter') prev.setMonth(prev.getMonth() - 3);
  else prev.setFullYear(prev.getFullYear() - 1);
  return prev;
}

function pctDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct}%`;
}

async function revenueInRange(from: Date, to: Date): Promise<number> {
  const agg = await Booking.aggregate([
    { $match: { status: 'completed', updatedAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, revenue: { $sum: '$amount.total' } } },
  ]);
  return agg[0]?.revenue ?? 0;
}

async function bookingsInRange(from: Date, to: Date): Promise<number> {
  return Booking.countDocuments({ createdAt: { $gte: from, $lt: to } });
}

async function customersInRange(from: Date, to: Date): Promise<number> {
  return User.countDocuments({ role: 'customer', createdAt: { $gte: from, $lt: to } });
}

async function pendingInRange(from: Date, to: Date): Promise<number> {
  return Booking.countDocuments({
    status: 'pending',
    createdAt: { $gte: from, $lt: to },
  });
}

const PIPELINE_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
  'cancelled',
] as const;

async function revenueByMonthBuckets(): Promise<{ label: string; amount: number }[]> {
  const buckets: { label: string; amount: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const agg = await Booking.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, revenue: { $sum: '$amount.total' } } },
    ]);
    const label = start.toLocaleString('en', { month: 'short' });
    buckets.push({ label, amount: agg[0]?.revenue ?? 0 });
  }
  return buckets;
}

statsRouter.get(
  '/admin',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const period = (typeof req.query.period === 'string' ? req.query.period : 'month') as Period;
    const valid: Period[] = ['week', 'month', 'quarter', 'year'];
    const p = valid.includes(period) ? period : 'month';

    const rangeStart = periodStart(p);
    const prevStart = previousPeriodStart(p);
    const now = new Date();

    const [
      totalBookings,
      statusAgg,
      revenueAgg,
      customers,
      technicians,
      topServices,
      recent,
      periodRevenue,
      prevRevenue,
      periodBookings,
      prevBookings,
      periodCustomers,
      prevCustomers,
      revenueByMonth,
      pendingRecent,
      periodPending,
      prevPending,
      periodStatusAgg,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, revenue: { $sum: '$amount.total' } } },
      ]),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'technician' }),
      Booking.aggregate([
        { $match: { createdAt: { $gte: rangeStart, $lt: now } } },
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        {
          $project: {
            serviceId: '$_id',
            name: '$service.name',
            count: 1,
          },
        },
      ]),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('serviceId')
        .populate('customerId', '-passwordHash')
        .populate('technicianId', '-passwordHash'),
      revenueInRange(rangeStart, now),
      revenueInRange(prevStart, rangeStart),
      bookingsInRange(rangeStart, now),
      bookingsInRange(prevStart, rangeStart),
      customersInRange(rangeStart, now),
      customersInRange(prevStart, rangeStart),
      revenueByMonthBuckets(),
      Booking.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('serviceId')
        .populate('customerId', '-passwordHash')
        .populate('technicianId', '-passwordHash'),
      pendingInRange(rangeStart, now),
      pendingInRange(prevStart, rangeStart),
      Booking.aggregate([
        { $match: { createdAt: { $gte: rangeStart, $lt: now } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusAgg) {
      byStatus[row._id as string] = row.count as number;
    }

    const periodByStatus: Record<string, number> = {};
    for (const row of periodStatusAgg) {
      periodByStatus[row._id as string] = row.count as number;
    }

    const statusBreakdown = PIPELINE_STATUSES.map((status) => ({
      status,
      count: byStatus[status] ?? 0,
      periodCount: periodByStatus[status] ?? 0,
    }));

    const activeJobs = (byStatus.in_progress ?? 0) + (byStatus.confirmed ?? 0) + (byStatus.pending ?? 0);
    const prevActiveJobs = await Booking.countDocuments({
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      updatedAt: { $gte: prevStart, $lt: rangeStart },
    });

    res.json({
      totalBookings,
      byStatus,
      statusBreakdown,
      periodPending,
      revenueCompleted: revenueAgg[0]?.revenue ?? 0,
      periodRevenue,
      periodBookings,
      customers,
      technicians,
      topServices,
      recentBookings: recent.map((b) => formatBooking(b)),
      pendingBookings: pendingRecent.map((b) => formatBooking(b)),
      revenueByMonth,
      deltas: {
        revenue: pctDelta(periodRevenue, prevRevenue),
        bookings: pctDelta(periodBookings, prevBookings),
        activeJobs: pctDelta(activeJobs, prevActiveJobs),
        customers: pctDelta(periodCustomers, prevCustomers),
        pending: pctDelta(periodPending, prevPending),
      },
      period: p,
    });
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

    const [assigned, inProgress, completed, awaitingVerification, earningsAgg, monthBookings] = await Promise.all([
      Booking.countDocuments({ technicianId: techId, status: 'confirmed' }),
      Booking.countDocuments({ technicianId: techId, status: 'in_progress' }),
      Booking.countDocuments({ technicianId: techId, status: 'completed' }),
      Booking.countDocuments({ technicianId: techId, status: 'awaiting_verification' }),
      Booking.aggregate([
        { $match: { technicianId: tech._id, status: 'completed' } },
        { $group: { _id: null, earnings: { $sum: '$amount.total' } } },
      ]),
      Booking.find({
        technicianId: tech._id,
        'schedule.date': { $gte: from, $lte: to },
      }),
    ]);
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
      rating: tech.rating,
      jobsDone: tech.jobsDone,
      earnings: earningsAgg[0]?.earnings ?? 0,
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

statsRouter.get(
  '/admin/team-attendance',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const period = (typeof req.query.period === 'string' ? req.query.period : 'month') as Period;
    const valid: Period[] = ['week', 'month', 'quarter', 'year'];
    const p = valid.includes(period) ? period : 'month';

    const { from, to, month } = periodAttendanceRange(p);
    const today = todayDateKey();

    const technicians = await User.find({
      role: 'technician',
      disabled: { $ne: true },
    }).sort({ name: 1 });

    const techIds = technicians.map((t) => t._id);
    const allRecords = await TechnicianAttendance.find({
      technicianId: { $in: techIds },
      date: { $gte: from, $lte: to },
    });

    let checkedInToday = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    const lowAttendance: Array<{ id: string; name: string; rate: number }> = [];

    for (const tech of technicians) {
      const techRecords = allRecords.filter(
        (r) => r.technicianId.toString() === tech._id.toString(),
      );
      const cal = buildAttendanceCalendar(techRecords, from, to, today);
      const stats = computeAttendanceAnalytics(cal, today);

      const todayRecord = techRecords.find((r) => r.date === today);
      if (todayRecord?.status === 'present') checkedInToday += 1;

      totalPresent += stats.daysPresent;
      totalAbsent += stats.daysAbsent;

      if (stats.daysPresent + stats.daysAbsent >= 3 && stats.attendanceRate < 80) {
        lowAttendance.push({
          id: tech._id.toString(),
          name: tech.name,
          rate: stats.attendanceRate,
        });
      }
    }

    const avgRate =
      totalPresent + totalAbsent > 0
        ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
        : 0;

    res.json({
      period: p,
      month,
      totalTechnicians: technicians.length,
      checkedInToday,
      averageAttendanceRate: avgRate,
      lowAttendance: lowAttendance.sort((a, b) => a.rate - b.rate),
    });
  }),
);
