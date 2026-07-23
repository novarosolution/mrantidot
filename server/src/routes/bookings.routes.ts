import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Booking, BookingStatus, IBooking, ScheduleMode } from '../models/Booking';
import { IService, Service } from '../models/Service';
import { IUser, User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { formatBooking, formatBookingForRole } from '../utils/format';
import {
  activateNextStep,
  allStepsDone,
  assertStatusTransition,
  computeAmount,
  initServiceSteps,
  resolveTechnicianForBooking,
} from '../utils/booking';
import { resolveAddressString } from '../utils/addresses';
import { incrementOfferUse } from '../utils/coupons';
import { notifyBookingEvent, notifyAdminsForBooking, notifyWorkOtpEvent } from '../utils/notifications';
import { computeTechEarning, payConfigFromUser } from '../utils/techPay';
import { applyStepPhotos, MAX_STEP_PHOTOS, normalizeStepPhotoUrls } from '../utils/stepPhotos';
import {
  appendTracking,
  incrementTechnicianJobsDone,
  issueEndOtp,
  issueStartOtp,
  regenerateOtp,
  verifyEndOtp,
  verifyStartOtp,
} from '../utils/workOtp';
import {
  formatScheduleSummary,
  provisionalScheduleFromRequest,
  validateConfirmedSchedule,
  validateScheduleRequest,
} from '../utils/schedule';
import { isPropertyTypeKey } from '../constants/propertyTypes';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

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

async function loadBooking(id: string): Promise<IBooking> {
  const booking = await Booking.findById(id)
    .populate('serviceId')
    .populate('customerId', '-passwordHash')
    .populate('technicianId', '-passwordHash');
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  return booking;
}

function refId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function assertBookingAccess(
  user: { id: string; role: string },
  booking: IBooking,
): void {
  if (user.role === 'admin') return;
  if (user.role === 'customer' && refId(booking.customerId) === user.id) return;
  if (user.role === 'technician' && refId(booking.technicianId) === user.id) return;
  throw new AppError(403, 'Access denied');
}

function assertTechnicianOwns(user: { id: string; role: string }, booking: IBooking): void {
  if (user.role === 'admin') return;
  if (user.role === 'technician' && refId(booking.technicianId) === user.id) return;
  throw new AppError(403, 'Not your booking');
}

async function setupStartOtp(booking: IBooking): Promise<void> {
  issueStartOtp(booking);
  appendTracking(booking, 'assigned');
  await booking.save();
  await notifyBookingEvent(booking, 'assigned');
  await notifyWorkOtpEvent(booking, 'start_otp_ready');
}

bookingsRouter.post(
  '/',
  requireRole('customer'),
  body('serviceId').isMongoId(),
  body('scheduleMode').isIn(['standard', 'custom']),
  body('scheduleRequest.date').trim().notEmpty(),
  body('scheduleRequest.slot').optional().trim(),
  body('scheduleRequest.time').optional().trim(),
  body('scheduleRequest.notes').optional().trim(),
  body('address').optional().trim(),
  body('addressId').optional().isMongoId(),
  body('propertyType').trim().notEmpty(),
  body('paymentMethod').optional().isIn(['upi_card', 'pay_after']),
  body('couponCode').optional().trim(),
  body('problemPhotos').optional().isArray(),
  body('technicianId').optional().isMongoId(),
  body('assignmentMode').optional().isIn(['auto', 'customer_pick']),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.body.serviceId);
    if (!service || !service.active) {
      throw new AppError(404, 'Service not found');
    }

    const scheduleMode = req.body.scheduleMode as ScheduleMode;
    const scheduleRequest = {
      date: String(req.body.scheduleRequest.date).trim(),
      slot: req.body.scheduleRequest.slot ? String(req.body.scheduleRequest.slot).trim() : undefined,
      time: req.body.scheduleRequest.time ? String(req.body.scheduleRequest.time).trim() : undefined,
      notes: req.body.scheduleRequest.notes ? String(req.body.scheduleRequest.notes).trim() : undefined,
    };
    validateScheduleRequest(scheduleMode, scheduleRequest);
    const schedule = provisionalScheduleFromRequest(scheduleMode, scheduleRequest);

    if (!isPropertyTypeKey(req.body.propertyType)) {
      throw new AppError(400, 'Invalid property type');
    }

    const address = await resolveAddressString(
      req.user!.id,
      req.body.addressId,
      req.body.address,
    );
    const amount = await computeAmount(service.basePrice, req.body.couponCode);
    const steps = initServiceSteps(service);
    const { assignmentMode } = await resolveTechnicianForBooking({
      assignmentMode: 'auto',
    });

    const booking = await Booking.create({
      customerId: req.user!.id,
      serviceId: service._id,
      assignmentMode,
      scheduleMode,
      scheduleRequest,
      schedule,
      propertyType: req.body.propertyType,
      address,
      amount,
      paymentMethod: req.body.paymentMethod ?? 'upi_card',
      status: 'pending',
      steps,
      problemPhotos: req.body.problemPhotos ?? [],
      couponCode: req.body.couponCode,
    });

    if (req.body.couponCode && amount.coupon > 0) {
      await incrementOfferUse(req.body.couponCode);
    }

    try {
      await notifyBookingEvent(booking, 'schedule_requested', { notifyAdmin: true });
      await notifyAdminsForBooking(
        booking._id,
        'Confirm schedule',
        'A customer requested a visit — review and confirm the schedule.',
        'admin_schedule_pending',
      );
    } catch (err) {
      console.error('[bookings] notify after create failed', err);
    }

    const populated = await loadBooking(booking._id.toString());
    res.status(201).json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};
    const { role, id } = req.user!;

    if (role === 'customer') {
      filter.customerId = id;
    } else if (role === 'technician') {
      filter.technicianId = id;
    }

    if (typeof req.query.status === 'string' && req.query.status) {
      if (role === 'admin' && req.query.status === 'active') {
        filter.status = { $in: ['pending', 'confirmed', 'in_progress', 'awaiting_verification'] };
      } else {
        filter.status = req.query.status;
      }
    }

    if (role === 'admin') {
      if (typeof req.query.technicianId === 'string' && req.query.technicianId) {
        filter.technicianId = req.query.technicianId;
      }
      if (typeof req.query.customerId === 'string' && req.query.customerId) {
        filter.customerId = req.query.customerId;
      }
      if (typeof req.query.serviceId === 'string' && req.query.serviceId) {
        filter.serviceId = req.query.serviceId;
      }
    }

    const limit = Math.min(parseInt(String(req.query.limit ?? '200'), 10) || 200, 500);
    const skip = Math.max(parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    let bookings = await Booking.find(filter)
      .populate('serviceId')
      .populate('customerId', '-passwordHash')
      .populate('technicianId', '-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    if (role === 'admin' && q) {
      bookings = bookings.filter((b) => {
        const ref = b._id.toString().slice(-6).toLowerCase();
        const cust = b.customerId as IUser | Types.ObjectId | undefined;
        const svc = b.serviceId as IService | Types.ObjectId | undefined;
        const customerName =
          cust && typeof cust === 'object' && 'name' in cust ? String(cust.name).toLowerCase() : '';
        const serviceName =
          svc && typeof svc === 'object' && 'name' in svc ? String(svc.name).toLowerCase() : '';
        return ref.includes(q) || customerName.includes(q) || serviceName.includes(q);
      });
    }

    res.json({ bookings: bookings.map((b) => formatBookingForRole(b, role)) });
  }),
);

bookingsRouter.get(
  '/status-counts',
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const statuses = [
      'pending',
      'confirmed',
      'in_progress',
      'awaiting_verification',
      'completed',
      'cancelled',
    ] as const;
    const rows = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const key = String(row._id);
      byStatus[key] = row.count as number;
      total += row.count as number;
    }
    for (const s of statuses) {
      if (byStatus[s] === undefined) byStatus[s] = 0;
    }
    res.json({ total, byStatus });
  }),
);

bookingsRouter.get(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await loadBooking(req.params.id);
    assertBookingAccess(req.user!, booking);
    res.json({ booking: formatBookingForRole(booking, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/assign',
  requireRole('admin'),
  param('id').isMongoId(),
  body('technicianId').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const technician = await User.findOne({
      _id: req.body.technicianId,
      role: 'technician',
    });
    if (!technician) {
      throw new AppError(404, 'Technician not found');
    }
    if (technician.disabled === true || technician.available === false) {
      throw new AppError(400, 'Technician is not available for assignment');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (booking.status === 'pending') {
      throw new AppError(400, 'Confirm the schedule before assigning a technician');
    }
    if (booking.status !== 'confirmed') {
      throw new AppError(400, 'Can only assign a technician while the booking is confirmed');
    }

    const visitDate = booking.schedule?.date;
    if (visitDate) {
      const { LeaveRequest } = await import('../models/LeaveRequest');
      const onLeave = await LeaveRequest.findOne({
        technicianId: technician._id,
        status: 'approved',
        from: { $lte: visitDate },
        to: { $gte: visitDate },
      });
      if (onLeave) {
        throw new AppError(400, 'Technician is on approved leave for this date');
      }

      const sameDay = await Booking.findOne({
        technicianId: technician._id,
        'schedule.date': visitDate,
        status: { $in: ['confirmed', 'in_progress', 'awaiting_verification'] },
        _id: { $ne: booking._id },
      });
      if (sameDay && sameDay.schedule?.slot && booking.schedule?.slot
        && sameDay.schedule.slot === booking.schedule.slot) {
        throw new AppError(400, 'Technician already has a job in this time slot');
      }
    }

    booking.technicianId = technician._id;
    await setupStartOtp(booking);

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.post(
  '/:id/start-work',
  requireRole('technician'),
  param('id').isMongoId(),
  body('otp').trim().isLength({ min: 6, max: 6 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError(404, 'Booking not found');
    assertTechnicianOwns(req.user!, booking);
    try {
      verifyStartOtp(booking, req.body.otp);
    } catch (e) {
      await booking.save(); // persist failed-attempt / lockout state
      throw new AppError(400, e instanceof Error ? e.message : 'Invalid start code');
    }
    const noSteps = booking.steps.length === 0;
    if (noSteps) {
      booking.status = 'awaiting_verification';
      issueEndOtp(booking);
    }
    await booking.save();
    if (noSteps) {
      await notifyBookingEvent(booking, 'awaiting_verification', { notifyAdmin: false });
      await notifyWorkOtpEvent(booking, 'end_otp_ready');
    } else {
      await notifyWorkOtpEvent(booking, 'work_started');
    }
    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.post(
  '/:id/complete-work',
  param('id').isMongoId(),
  body('otp').trim().isLength({ min: 6, max: 6 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError(404, 'Booking not found');
    const { role, id } = req.user!;
    if (role === 'customer') {
      if (refId(booking.customerId) !== id) throw new AppError(403, 'Access denied');
    } else if (role === 'technician') {
      assertTechnicianOwns(req.user!, booking);
    } else if (role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }
    try {
      verifyEndOtp(booking, req.body.otp);
    } catch (e) {
      await booking.save(); // persist failed-attempt / lockout state
      throw new AppError(400, e instanceof Error ? e.message : 'Invalid end code');
    }
    await booking.save();
    await incrementTechnicianJobsDone(booking.technicianId);
    await notifyWorkOtpEvent(booking, 'work_completed');
    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.post(
  '/:id/regenerate-otp',
  requireRole('customer', 'admin'),
  param('id').isMongoId(),
  body('type').isIn(['start', 'end']),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError(404, 'Booking not found');
    if (req.user!.role === 'customer' && refId(booking.customerId) !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }
    const type = req.body.type as 'start' | 'end';
    try {
      regenerateOtp(booking, type);
    } catch (e) {
      throw new AppError(400, e instanceof Error ? e.message : 'Cannot regenerate code');
    }
    await booking.save();
    await notifyWorkOtpEvent(booking, type === 'start' ? 'start_otp_ready' : 'end_otp_ready');
    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/status',
  param('id').isMongoId(),
  body('status').isIn(['in_progress', 'awaiting_verification', 'cancelled']),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const nextStatus = req.body.status as BookingStatus;

    if (req.user!.role === 'technician') {
      assertTechnicianOwns(req.user!, booking);
      if (nextStatus === 'in_progress') {
        throw new AppError(400, 'Use start code verification to begin work');
      }
      if (
        nextStatus === 'awaiting_verification' &&
        booking.steps.length > 0 &&
        !allStepsDone(booking.steps)
      ) {
        throw new AppError(400, 'Complete all treatment steps before requesting the completion code');
      }
    } else if (req.user!.role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    try {
      assertStatusTransition(booking.status, nextStatus);
    } catch (e) {
      throw new AppError(400, e instanceof Error ? e.message : 'Invalid transition');
    }

    const enteringVerification = nextStatus === 'awaiting_verification' && booking.status !== 'awaiting_verification';

    booking.status = nextStatus;
    if (nextStatus === 'in_progress' && !booking.workStartedAt) {
      booking.workStartedAt = new Date();
      if (booking.workOtp?.start && !booking.workOtp.start.verifiedAt) {
        booking.workOtp.start.verifiedAt = new Date();
        booking.markModified('workOtp');
      }
      appendTracking(booking, 'work_started');
    }
    if (enteringVerification && !booking.workOtp?.end) {
      issueEndOtp(booking);
    }
    if (nextStatus === 'cancelled') {
      appendTracking(booking, 'cancelled');
    }
    await booking.save();

    if (nextStatus === 'in_progress') await notifyBookingEvent(booking, 'in_progress');
    if (enteringVerification) {
      await notifyBookingEvent(booking, 'awaiting_verification');
      await notifyWorkOtpEvent(booking, 'end_otp_ready');
    }
    if (nextStatus === 'cancelled') {
      await notifyBookingEvent(booking, 'cancelled');
    }

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/steps/:index',
  requireRole('technician', 'admin'),
  param('id').isMongoId(),
  param('index').isNumeric(),
  body('status').isIn(['pending', 'active', 'done']),
  body('photoUrl').optional().isString(),
  body('photoUrls').optional().isArray({ min: 1, max: MAX_STEP_PHOTOS }),
  body('photoUrls.*').optional().isString().trim().notEmpty(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    assertTechnicianOwns(req.user!, booking);

    if (booking.status !== 'in_progress') {
      throw new AppError(400, 'Work must be started with the customer start code before capturing steps');
    }

    const index = parseInt(req.params.index, 10);
    if (index < 0 || index >= booking.steps.length) {
      throw new AppError(400, 'Invalid step index');
    }

    const step = booking.steps[index];
    if (!step) {
      throw new AppError(400, 'Step not found');
    }

    if (req.body.status === 'done' && req.user!.role === 'technician' && step.status !== 'active') {
      throw new AppError(400, 'Complete the current active step first');
    }

    const incomingUrls = normalizeStepPhotoUrls({
      photoUrl: typeof req.body.photoUrl === 'string' ? req.body.photoUrl : undefined,
      photoUrls: Array.isArray(req.body.photoUrls) ? req.body.photoUrls : undefined,
    });

    step.status = req.body.status;
    if (req.body.status === 'done' && req.user!.role === 'technician') {
      const photoUrls = incomingUrls.length
        ? incomingUrls
        : normalizeStepPhotoUrls(step);
      if (photoUrls.length === 0) {
        throw new AppError(400, 'At least one photo is required to complete this step');
      }
      applyStepPhotos(step, photoUrls);
    } else if (incomingUrls.length > 0) {
      applyStepPhotos(step, incomingUrls);
    }
    if (req.body.geo) {
      const { lat, lng, address } = req.body.geo as {
        lat?: number;
        lng?: number;
        address?: string;
      };
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new AppError(400, 'geo.lat and geo.lng are required numbers');
      }
      if (req.user!.role === 'technician' && lat === 0 && lng === 0) {
        throw new AppError(400, 'GPS location is required for step photos');
      }
      step.geo = { lat, lng, address: address ?? '' };
    } else if (req.body.status === 'done' && req.user!.role === 'technician') {
      throw new AppError(400, 'GPS location is required for step photos');
    }
    if (req.body.status === 'done') {
      step.capturedAt = new Date();
      appendTracking(booking, 'step_done', {
        stepIndex: index,
        title: step.title,
        photoCount: normalizeStepPhotoUrls(step).length,
      });
    }

    booking.steps[index] = step;
    booking.markModified('steps');

    if (req.body.status === 'done') {
      booking.steps = activateNextStep(booking.steps);
      booking.markModified('steps');
    }

    const becameAwaiting = allStepsDone(booking.steps);
    if (becameAwaiting) {
      booking.status = 'awaiting_verification';
      issueEndOtp(booking);
    }

    await booking.save();
    if (becameAwaiting) {
      await notifyBookingEvent(booking, 'awaiting_verification', { notifyAdmin: false });
      await notifyWorkOtpEvent(booking, 'end_otp_ready');
    }

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

async function completeBooking(booking: IBooking, override = false): Promise<IBooking> {
  if (booking.status !== 'awaiting_verification') {
    throw new AppError(400, 'Booking is not awaiting verification');
  }
  const tech = booking.technicianId
    ? await User.findById(booking.technicianId).select('payMode payPercent payFlat')
    : null;
  booking.technicianEarning = computeTechEarning(
    booking.amount?.total ?? 0,
    payConfigFromUser(tech),
  );
  booking.status = 'completed';
  booking.workCompletedAt = new Date();
  if (override) {
    appendTracking(booking, 'admin_override');
  }
  await booking.save();
  await incrementTechnicianJobsDone(booking.technicianId);
  if (override) {
    await notifyBookingEvent(booking, 'completed');
  } else {
    await notifyWorkOtpEvent(booking, 'work_completed');
  }
  return loadBooking(booking._id.toString());
}

bookingsRouter.patch(
  '/:id/confirm-schedule',
  requireRole('admin'),
  param('id').isMongoId(),
  body('schedule.date').trim().notEmpty(),
  body('schedule.slot').trim().notEmpty(),
  body('schedule.time').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (booking.status !== 'pending') {
      throw new AppError(400, 'Only pending bookings can be schedule-confirmed');
    }

    const scheduleInput = {
      date: String(req.body.schedule.date).trim(),
      slot: String(req.body.schedule.slot).trim(),
      time: req.body.schedule.time ? String(req.body.schedule.time).trim() : undefined,
    };
    const scheduleMode = validateConfirmedSchedule(scheduleInput);
    const schedule = {
      date: scheduleInput.date,
      slot: scheduleInput.slot,
      ...(scheduleMode === 'custom' ? { time: scheduleInput.time } : {}),
    };

    booking.scheduleMode = scheduleMode;
    booking.schedule = schedule;
    booking.scheduleRequest = {
      date: schedule.date,
      ...(scheduleMode === 'standard' ? { slot: schedule.slot } : { time: schedule.time }),
      notes: booking.scheduleRequest?.notes,
    };
    booking.status = 'confirmed';
    booking.scheduleConfirmedAt = new Date();
    appendTracking(booking, 'schedule_confirmed', { schedule });
    await booking.save();

    await notifyBookingEvent(booking, 'schedule_confirmed', { notifyAdmin: false });
    await notifyAdminsForBooking(
      booking._id,
      'Schedule confirmed',
      `Visit confirmed for ${formatScheduleSummary(schedule, scheduleMode)}. Assign a technician when ready.`,
      'admin_needs_assign',
    );

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  body('schedule.date').optional().trim().notEmpty(),
  body('schedule.slot').optional().trim().notEmpty(),
  body('schedule.time').optional().trim(),
  body('address').optional().trim().notEmpty(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new AppError(400, 'Cannot edit a closed booking');
    }
    if (req.body.schedule?.date && req.body.schedule?.slot) {
      const scheduleInput = {
        date: String(req.body.schedule.date).trim(),
        slot: String(req.body.schedule.slot).trim(),
        time: req.body.schedule.time ? String(req.body.schedule.time).trim() : undefined,
      };
      const scheduleMode = validateConfirmedSchedule(scheduleInput);
      booking.scheduleMode = scheduleMode;
      booking.schedule = {
        date: scheduleInput.date,
        slot: scheduleInput.slot,
        ...(scheduleMode === 'custom' ? { time: scheduleInput.time } : {}),
      };
      if (booking.status === 'pending') {
        booking.scheduleRequest = {
          date: booking.schedule.date,
          ...(scheduleMode === 'standard'
            ? { slot: booking.schedule.slot }
            : { time: booking.schedule.time }),
          notes: booking.scheduleRequest?.notes,
        };
      } else {
        appendTracking(booking, 'admin_override', { schedule: booking.schedule });
      }
      booking.markModified('schedule');
    }
    if (typeof req.body.address === 'string' && req.body.address.trim()) {
      booking.address = req.body.address.trim();
    }
    await booking.save();
    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/complete',
  requireRole('admin'),
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    const populated = await completeBooking(booking, true);
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/verify',
  param('id').isMongoId(),
  body('otp').optional().trim().isLength({ min: 6, max: 6 }),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const { role, id } = req.user!;
    if (role === 'customer') {
      if (refId(booking.customerId) !== id) {
        throw new AppError(403, 'Access denied');
      }
      if (!req.body.otp) {
        throw new AppError(400, 'Completion code is required');
      }
      try {
        verifyEndOtp(booking, req.body.otp);
      } catch (e) {
        await booking.save();
        throw new AppError(400, e instanceof Error ? e.message : 'Invalid end code');
      }
      await booking.save();
      await incrementTechnicianJobsDone(booking.technicianId);
      await notifyWorkOtpEvent(booking, 'work_completed');
      const populated = await loadBooking(booking._id.toString());
      res.json({ booking: formatBookingForRole(populated, req.user!.role) });
      return;
    }
    if (role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const populated = await completeBooking(booking, true);
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/cancel',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    const { role, id } = req.user!;

    if (role === 'customer') {
      if (refId(booking.customerId) !== id) {
        throw new AppError(403, 'Access denied');
      }
      if (['in_progress', 'awaiting_verification', 'completed', 'cancelled'].includes(booking.status)) {
        throw new AppError(400, 'Cannot cancel after work has started');
      }
    } else if (role === 'admin') {
      if (['completed', 'cancelled'].includes(booking.status)) {
        throw new AppError(400, 'Cannot cancel a completed or already cancelled booking');
      }
    } else {
      throw new AppError(403, 'Access denied');
    }

    booking.status = 'cancelled';
    appendTracking(booking, 'cancelled');
    await booking.save();
    await notifyBookingEvent(booking, 'cancelled');

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);
