import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Booking, BookingStatus, IBooking, ScheduleMode, type PaymentStatus } from '../models/Booking';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';
import { formatBookingForRole } from '../utils/format';
import { buildBookingInvoice } from '../utils/invoice';
import {
  activateNextStep,
  allStepsDone,
  assertBookingAddressInArea,
  assertPropertyTypeOffered,
  assertStatusTransition,
  autoAssignIfEnabled,
  computeAmount,
  initServiceSteps,
  preferredTechnician,
  resolvePaymentMethod,
} from '../utils/booking';
import { resolveAddressString } from '../utils/addresses';
import { releaseOfferUse, reserveOfferUse } from '../utils/coupons';
import {
  notifyBookingEvent,
  notifyUserFromTemplate,
  notifyWorkOtpEvent,
} from '../utils/notifications';
import { computeTechEarning, payConfigFromUser } from '../utils/techPay';
import { applyStepPhotos, MAX_STEP_PHOTOS, normalizeStepPhotoUrls } from '../utils/stepPhotos';
import {
  appendTracking,
  incrementTechnicianJobsDone,
  issueEndOtp,
  issueStartOtp,
  regenerateOtp,
  reserveOtpAttempt,
  verifyEndOtp,
  verifyStartOtp,
} from '../utils/workOtp';
import {
  assertCanCancel,
  assertCanReschedule,
  assertCustomerSchedule,
  formatScheduleSummary,
  provisionalScheduleFromRequest,
  validateConfirmedSchedule,
  assertScheduleNotPast,
} from '../utils/schedule';
import { getBusinessSettings } from '../utils/businessSettings';
import { localDateKey } from '../utils/dateKey';
import { buildBookingListQuery, runBookingList } from '../utils/bookingList';
import { env } from '../config/env';
import { bookingRefOf, type ActivityNote } from '../middleware/activityLog';

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

/** Describes an admin change for the activity log (middleware/activityLog.ts). */
function noteActivity(res: { locals: Record<string, unknown> }, note: ActivityNote): void {
  res.locals.activity = note;
}

async function userName(id: string | Types.ObjectId | undefined): Promise<string | undefined> {
  if (!id) return undefined;
  const user = await User.findById(id).select('name').lean<{ name?: string }>();
  return user?.name;
}

const CANCEL_REASON_MAX = 300;

/** Reason sent with a cancel (trimmed, capped). Admins must give one of at least 3 characters. */
function cancelReasonFrom(raw: unknown, role: string): string | undefined {
  const reason = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ').slice(0, CANCEL_REASON_MAX) : '';
  if (role === 'admin' && reason.length < 3) {
    throw new AppError(400, 'Give a reason for cancelling (at least 3 characters).', 'CANCEL_REASON_REQUIRED');
  }
  return reason || undefined;
}

/** Marks the booking cancelled with who did it, when and why (not saved yet). */
async function markCancelled(booking: IBooking, user: { id: string; role: string }, reason?: string): Promise<void> {
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelReason = reason;
  booking.cancelledBy = {
    id: new Types.ObjectId(user.id),
    role: user.role === 'admin' ? 'admin' : 'customer',
    name: await userName(user.id),
  };
  // Tracking is shown to customers — who cancelled, never the reason.
  appendTracking(booking, 'cancelled', { by: user.role === 'admin' ? 'admin' : 'customer' });
}

/** "Cancelled booking #A1B2C3 — reason: …" for the activity log. */
function cancelSummary(booking: IBooking, reason?: string): string {
  const ref = bookingRefOf(String(booking._id));
  return reason ? `Cancelled booking ${ref} — reason: ${reason}` : `Cancelled booking ${ref}`;
}

/** Customer bookings from the website arrive through its server with the shared website key. */
function bookingSourceOf(req: { get: (name: string) => string | undefined }): 'app' | 'website' {
  return env.websiteApiKey && req.get('x-website-key') === env.websiteApiKey ? 'website' : 'app';
}

/**
 * New booking. Customers book for themselves (app or website). Admins book on a customer's behalf by
 * sending `customerId`: the same slot / property / payment / service-area checks apply, the visit is
 * confirmed straight away (the admin picked the time with the customer), `source` is 'admin' and the
 * customer is notified.
 */
bookingsRouter.post(
  '/',
  requireRole('customer', 'admin'),
  body('customerId').optional().isMongoId(),
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
  body('optionKey').optional().isString().trim().isLength({ max: 40 }),
  body('problemPhotos').optional().isArray(),
  body('technicianId').optional().isMongoId(),
  body('assignmentMode').optional().isIn(['auto', 'customer_pick']),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const byAdmin = req.user!.role === 'admin';
    let customerId = req.user!.id;
    let customerName: string | undefined;
    if (byAdmin) {
      if (!req.body.customerId) throw new AppError(400, 'Pick the customer this booking is for');
      const customer = await User.findOne({ _id: req.body.customerId, role: 'customer' }).select('name disabled');
      if (!customer) throw new AppError(404, 'Customer not found');
      if (customer.disabled === true) throw new AppError(400, 'This customer account is disabled');
      customerId = customer._id.toString();
      customerName = customer.name;
    }

    const service = await Service.findById(req.body.serviceId);
    if (!service || !service.active) {
      throw new AppError(404, 'Service not found');
    }
    // Admin-managed rules (Business settings): slots, lead time, horizon, lists, service area, payments, workflow.
    const settings = await getBusinessSettings();

    const scheduleMode = req.body.scheduleMode as ScheduleMode;
    const scheduleRequest = {
      date: String(req.body.scheduleRequest.date).trim(),
      slot: req.body.scheduleRequest.slot ? String(req.body.scheduleRequest.slot).trim() : undefined,
      time: req.body.scheduleRequest.time ? String(req.body.scheduleRequest.time).trim() : undefined,
      notes: req.body.scheduleRequest.notes ? String(req.body.scheduleRequest.notes).trim() : undefined,
    };
    await assertCustomerSchedule(scheduleMode, scheduleRequest, settings);
    const schedule = provisionalScheduleFromRequest(scheduleMode, scheduleRequest);

    const propertyType = await assertPropertyTypeOffered(req.body.propertyType, settings);
    const paymentMethod = await resolvePaymentMethod(req.body.paymentMethod, settings);

    const address = await resolveAddressString(
      customerId,
      req.body.addressId,
      req.body.address,
    );
    await assertBookingAddressInArea(settings, customerId, req.body.addressId, address);
    // Sized services are priced from the picked option — never from a price the client sends.
    const options = service.options ?? [];
    let option: { key: string; label: string; price: number } | undefined;
    if (options.length > 0) {
      const picked = options.find((o) => o.key === req.body.optionKey);
      if (!picked) {
        throw new AppError(400, `Select ${service.optionsTitle?.toLowerCase() || 'a size'} for this service`);
      }
      option = { key: picked.key, label: picked.label, price: picked.price };
    }
    const amount = await computeAmount(option?.price ?? service.basePrice, req.body.couponCode, settings.tax.gstPercent);
    const steps = initServiceSteps(service);
    // A technician the customer picked is kept as a preference; auto-assign tries them first.
    const preferredTechnicianId = await preferredTechnician(req.body.technicianId);
    const assignmentMode = preferredTechnicianId ? 'customer_pick' : 'auto';
    // Auto-confirm skips "pending": the slot the customer chose is the visit time. An admin booking on the
    // customer's behalf has already agreed the time with them, so it is confirmed too.
    const autoConfirm = settings.booking.autoConfirm || byAdmin;
    const adminName = byAdmin ? await userName(req.user!.id) : undefined;

    const usesCoupon = Boolean(req.body.couponCode) && amount.coupon > 0;
    if (usesCoupon && !(await reserveOfferUse(req.body.couponCode))) {
      throw new AppError(400, 'This coupon has reached its usage limit');
    }

    let booking: IBooking;
    try {
      booking = await Booking.create({
        customerId,
        serviceId: service._id,
        source: byAdmin ? 'admin' : bookingSourceOf(req),
        ...(byAdmin ? { createdByAdmin: { id: new Types.ObjectId(req.user!.id), name: adminName ?? 'Admin' } } : {}),
        assignmentMode,
        scheduleMode,
        scheduleRequest,
        schedule,
        propertyType,
        option,
        address,
        amount,
        paymentMethod,
        status: autoConfirm ? 'confirmed' : 'pending',
        ...(autoConfirm
          ? {
              scheduleConfirmedAt: new Date(),
              tracking: [
                { at: new Date(), event: 'schedule_confirmed', meta: byAdmin ? { schedule, by: 'admin' } : { schedule, auto: true } },
              ],
            }
          : {}),
        ...(preferredTechnicianId ? { preferredTechnicianId } : {}),
        steps,
        problemPhotos: req.body.problemPhotos ?? [],
        couponCode: usesCoupon ? req.body.couponCode : undefined,
      });
    } catch (err) {
      if (usesCoupon) await releaseOfferUse(req.body.couponCode);
      throw err;
    }

    let assigned = false;
    if (autoConfirm) {
      try {
        // Auto-assign (when on): least-busy free technician, start code and "assigned" messages.
        assigned = await autoAssignIfEnabled(booking, settings, { prefer: preferredTechnicianId });
      } catch (err) {
        console.error('[bookings] auto-assign after create failed', err);
      }
    }

    try {
      if (byAdmin) {
        // The customer hears their visit is booked (auto-assign already sent "expert assigned" when it ran).
        // Other admins see it in the activity log instead of a "a customer placed a booking" alert.
        if (!assigned) await notifyBookingEvent(booking, 'confirmed', { audiences: ['customer'] });
      } else if (!autoConfirm) {
        await notifyBookingEvent(booking, 'schedule_requested', { notifyAdmin: true });
      } else {
        // When a technician was assigned the customer already heard about it; admins still get "new booking".
        await notifyBookingEvent(booking, 'confirmed', assigned ? { audiences: ['admin'] } : undefined);
      }
    } catch (err) {
      console.error('[bookings] notify after create failed', err);
    }

    const populated = await loadBooking(booking._id.toString());
    if (byAdmin) {
      const ref = bookingRefOf(String(booking._id));
      noteActivity(res, {
        summary: `Booked ${service.name} for ${customerName ?? 'a customer'} (${ref})`,
        targetId: String(booking._id),
        targetType: 'booking',
        targetLabel: ref,
      });
    }
    res.status(201).json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

/** Paged, filtered booking list — see utils/bookingList.ts for every query parameter. */
bookingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role } = req.user!;
    const query = await buildBookingListQuery(req.query as Record<string, unknown>, req.user!);
    const { bookings, meta, statusCounts } = await runBookingList(query);
    res.json({
      bookings: bookings.map((b) => formatBookingForRole(b, role)),
      ...meta,
      ...(statusCounts ? { statusCounts } : {}),
    });
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

/** Premium client invoice with full service & charge details. */
bookingsRouter.get(
  '/:id/invoice',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await loadBooking(req.params.id);
    assertBookingAccess(req.user!, booking);
    const invoice = await buildBookingInvoice(booking);
    res.json({ invoice });
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
    if (technician.disabled === true) {
      throw new AppError(400, 'Technician account is disabled');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    // Off-duty only matters for today's visits; leave for future dates is checked below.
    const visitIsToday = !booking.schedule?.date || booking.schedule.date <= localDateKey();
    if (technician.available === false && visitIsToday) {
      throw new AppError(400, 'Technician is off duty today');
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

    const previousTechId = booking.technicianId;
    booking.technicianId = technician._id;
    await setupStartOtp(booking);

    const ref = bookingRefOf(String(booking._id));
    const previousName =
      previousTechId && String(previousTechId) !== String(technician._id) ? await userName(previousTechId) : undefined;
    noteActivity(res, {
      summary: previousName
        ? `Reassigned booking ${ref} from ${previousName} to ${technician.name}`
        : `Assigned ${technician.name} to booking ${ref}`,
      fields: ['technicianId'],
    });

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
      await reserveOtpAttempt(booking._id, 'start');
      verifyStartOtp(booking, req.body.otp);
    } catch (e) {
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
    const { role } = req.user!;
    if (role === 'customer') {
      throw new AppError(403, 'Share the completion code with your technician to finish the job');
    } else if (role === 'technician') {
      assertTechnicianOwns(req.user!, booking);
    } else if (role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }
    try {
      await reserveOtpAttempt(booking._id, 'end');
      verifyEndOtp(booking, req.body.otp);
    } catch (e) {
      throw new AppError(400, e instanceof Error ? e.message : 'Invalid end code');
    }
    // Lock technician pay at completion (same as admin completeBooking).
    if (booking.technicianId && booking.technicianEarning == null) {
      const tech = await User.findById(booking.technicianId).select('payMode payPercent payFlat');
      booking.technicianEarning = computeTechEarning(
        booking.amount?.total ?? 0,
        payConfigFromUser(tech),
      );
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
  body('reason').optional().isString(),
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
      if (nextStatus === 'cancelled') {
        throw new AppError(403, 'Technicians cannot cancel bookings');
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
    if (nextStatus === 'in_progress' && !booking.technicianId) {
      throw new AppError(400, 'Assign a technician before starting the job');
    }

    try {
      assertStatusTransition(booking.status, nextStatus);
    } catch (e) {
      throw new AppError(400, e instanceof Error ? e.message : 'Invalid transition');
    }

    const enteringVerification = nextStatus === 'awaiting_verification' && booking.status !== 'awaiting_verification';
    // Only admins reach a cancel here (technicians are refused above) — they must say why.
    const cancelReason = nextStatus === 'cancelled' ? cancelReasonFrom(req.body.reason, req.user!.role) : undefined;
    const ref = bookingRefOf(String(booking._id));

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
      await markCancelled(booking, req.user!, cancelReason);
    }
    await booking.save();

    if (nextStatus === 'in_progress') await notifyBookingEvent(booking, 'in_progress');
    if (enteringVerification) {
      await notifyBookingEvent(booking, 'awaiting_verification');
      await notifyWorkOtpEvent(booking, 'end_otp_ready');
    }
    if (nextStatus === 'cancelled') {
      await releaseOfferUse(booking.couponCode);
      await notifyBookingEvent(booking, 'cancelled');
    }

    noteActivity(res, {
      summary:
        nextStatus === 'cancelled'
          ? cancelSummary(booking, cancelReason)
          : nextStatus === 'in_progress'
            ? `Started job ${ref} without the customer’s start code`
            : `Sent booking ${ref} for the customer’s completion code`,
      fields: ['status', ...(cancelReason ? ['reason'] : [])],
    });

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
    assertScheduleNotPast(scheduleInput);
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

    // Auto-assign (Business settings → Booking rules) right after confirming; it sends the "assigned" messages.
    let assigned = false;
    try {
      assigned = await autoAssignIfEnabled(booking, undefined, { prefer: booking.preferredTechnicianId });
    } catch (err) {
      console.error('[bookings] auto-assign after confirm failed', err);
    }
    // Templates: schedule_confirmed.customer / .admin. Once a technician is assigned the customer already
    // heard about it and there is nothing left for admins to assign.
    if (!assigned) {
      await notifyBookingEvent(booking, 'schedule_confirmed');
    }

    noteActivity(res, {
      summary: `Confirmed booking ${bookingRefOf(String(booking._id))} for ${formatScheduleSummary(schedule, scheduleMode)}${
        assigned ? ' (technician auto-assigned)' : ''
      }`,
      fields: ['schedule'],
    });

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
    let scheduleMoved = false;
    if (req.body.schedule?.date && req.body.schedule?.slot) {
      const scheduleInput = {
        date: String(req.body.schedule.date).trim(),
        slot: String(req.body.schedule.slot).trim(),
        time: req.body.schedule.time ? String(req.body.schedule.time).trim() : undefined,
      };
      const scheduleMode = validateConfirmedSchedule(scheduleInput);
      const current = booking.schedule;
      const scheduleChanged =
        !current ||
        current.date !== scheduleInput.date ||
        current.slot !== scheduleInput.slot ||
        (scheduleMode === 'custom' && current.time !== scheduleInput.time);
      // Address-only edits resend the existing schedule; only a new time has to be in the future.
      if (scheduleChanged) assertScheduleNotPast(scheduleInput);
      scheduleMoved = scheduleChanged;
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
        appendTracking(booking, 'rescheduled', { schedule: booking.schedule, by: 'admin' });
      }
      booking.markModified('schedule');
    }
    const addressChanged =
      typeof req.body.address === 'string' && req.body.address.trim() && req.body.address.trim() !== booking.address;
    if (typeof req.body.address === 'string' && req.body.address.trim()) {
      booking.address = req.body.address.trim();
    }
    const movedTo = scheduleMoved ? formatScheduleSummary(booking.schedule!, booking.scheduleMode) : undefined;
    await booking.save();
    // Only a real move is announced (address-only edits resend the unchanged schedule).
    if (scheduleMoved && booking.status !== 'pending') {
      // Templates: rescheduled.customer / rescheduled.tech (Business settings → Messages).
      await notifyUserFromTemplate(booking.customerId, booking, 'rescheduled', 'customer', 'booking_rescheduled');
      if (booking.technicianId) {
        await notifyUserFromTemplate(booking.technicianId, booking, 'rescheduled', 'tech', 'booking_rescheduled');
      }
    }
    const ref = bookingRefOf(String(booking._id));
    noteActivity(res, {
      summary:
        scheduleMoved && movedTo
          ? `Rescheduled booking ${ref} to ${movedTo}${addressChanged ? ' and changed the address' : ''}`
          : addressChanged
            ? `Changed the address of booking ${ref}`
            : `Edited booking ${ref}`,
      fields: [...(scheduleMoved ? ['schedule'] : []), ...(addressChanged ? ['address'] : [])],
    });
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
    noteActivity(res, {
      summary: `Force-completed booking ${bookingRefOf(String(booking._id))} (skipped the customer’s completion code)`,
      fields: ['status'],
    });
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

    const { role } = req.user!;
    if (role !== 'admin') {
      throw new AppError(403, 'Access denied');
    }

    const populated = await completeBooking(booking, true);
    noteActivity(res, {
      summary: `Force-completed booking ${bookingRefOf(String(booking._id))} (skipped the customer’s completion code)`,
      fields: ['status'],
    });
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

bookingsRouter.patch(
  '/:id/reschedule',
  requireRole('customer'),
  param('id').isMongoId(),
  body('scheduleRequest.date').trim().notEmpty(),
  body('scheduleRequest.slot').trim().notEmpty(),
  body('scheduleRequest.notes').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (refId(booking.customerId) !== req.user!.id) {
      throw new AppError(403, 'Access denied');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new AppError(400, 'This booking can no longer be rescheduled');
    }

    const settings = await getBusinessSettings();
    // Cut-off before the current visit and the per-booking limit (Business settings → Booking rules).
    await assertCanReschedule(booking, settings);

    const scheduleRequest = {
      date: String(req.body.scheduleRequest.date).trim(),
      slot: String(req.body.scheduleRequest.slot).trim(),
      notes: req.body.scheduleRequest.notes
        ? String(req.body.scheduleRequest.notes).trim()
        : booking.scheduleRequest?.notes,
    };
    await assertCustomerSchedule('standard', scheduleRequest, settings);

    const previousTechnicianId = booking.technicianId;
    // Auto-confirm applies to the new time too; otherwise the move waits for the admin again.
    const autoConfirm = settings.booking.autoConfirm;
    booking.scheduleMode = 'standard';
    booking.scheduleRequest = scheduleRequest;
    booking.schedule = provisionalScheduleFromRequest('standard', scheduleRequest);
    booking.status = autoConfirm ? 'confirmed' : 'pending';
    booking.scheduleConfirmedAt = autoConfirm ? new Date() : undefined;
    booking.technicianId = undefined;
    booking.rescheduleCount = (booking.rescheduleCount ?? 0) + 1;
    if (booking.workOtp?.start) {
      booking.workOtp.start = undefined;
      booking.markModified('workOtp');
    }
    if (booking.otpAttempts) {
      booking.otpAttempts.start = 0;
      booking.otpAttempts.startLockedUntil = undefined;
      booking.markModified('otpAttempts');
    }
    appendTracking(booking, 'rescheduled', {
      schedule: booking.schedule,
      by: 'customer',
      ...(autoConfirm ? { autoConfirmed: true } : {}),
    });
    booking.markModified('schedule');
    await booking.save();

    let assigned = false;
    if (autoConfirm) {
      try {
        assigned = await autoAssignIfEnabled(booking, settings, { prefer: booking.preferredTechnicianId });
      } catch (err) {
        console.error('[bookings] auto-assign after reschedule failed', err);
      }
    }

    try {
      if (previousTechnicianId) {
        await notifyUserFromTemplate(previousTechnicianId, booking, 'reschedule_requested', 'tech', 'booking_rescheduled');
      }
      if (!autoConfirm) {
        await notifyBookingEvent(booking, 'reschedule_requested', { audiences: ['admin'] });
      } else {
        await notifyBookingEvent(booking, 'rescheduled', { audiences: assigned ? ['admin'] : ['customer', 'admin'] });
      }
    } catch (err) {
      console.error('[bookings] notify after reschedule failed', err);
    }

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

/**
 * Cancel. Customers: before work starts and outside the cancel cut-off (Business settings → Booking
 * rules); a `reason` is optional. Admins: any open booking, but `reason` (≥ 3 characters) is required.
 */
bookingsRouter.patch(
  '/:id/cancel',
  param('id').isMongoId(),
  body('reason').optional().isString(),
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
      // Cut-off before the visit (admin-editable message, code CANCEL_CUTOFF).
      await assertCanCancel(booking);
    } else if (role === 'admin') {
      if (['completed', 'cancelled'].includes(booking.status)) {
        throw new AppError(400, 'Cannot cancel a completed or already cancelled booking');
      }
    } else {
      throw new AppError(403, 'Access denied');
    }

    const reason = cancelReasonFrom(req.body.reason, role);
    await markCancelled(booking, req.user!, reason);
    await booking.save();
    await releaseOfferUse(booking.couponCode);
    await notifyBookingEvent(booking, 'cancelled');

    noteActivity(res, { summary: cancelSummary(booking, reason), fields: ['status', ...(reason ? ['reason'] : [])] });

    const populated = await loadBooking(booking._id.toString());
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

/* ---------- admin only: internal notes and payment ---------- */

const NOTE_MAX = 1000;
const PAYMENT_REF_MAX = 120;

function clipText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Internal note: POST { text } → 201 { booking, note }. Admins only — customers and technicians never
 * receive `adminNotes`.
 */
bookingsRouter.post(
  '/:id/notes',
  requireRole('admin'),
  param('id').isMongoId(),
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
      byName: (await userName(req.user!.id)) ?? 'Admin',
      at: new Date(),
    };
    // $push keeps the write small and never re-validates an older booking's other fields.
    const result = await Booking.updateOne({ _id: req.params.id }, { $push: { adminNotes: note } });
    if (!result.matchedCount) throw new AppError(404, 'Booking not found');
    noteActivity(res, {
      summary: `Added a note to booking ${bookingRefOf(req.params.id)}: “${clipText(text, 80)}”`,
      fields: ['adminNotes'],
    });
    const populated = await loadBooking(req.params.id);
    res.status(201).json({
      booking: formatBookingForRole(populated, req.user!.role),
      note: { id: String(note._id), text, by: req.user!.id, byName: note.byName, at: note.at.toISOString() },
    });
  }),
);

bookingsRouter.delete(
  '/:id/notes/:noteId',
  requireRole('admin'),
  param('id').isMongoId(),
  param('noteId').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const noteId = new Types.ObjectId(req.params.noteId);
    const result = await Booking.updateOne(
      { _id: req.params.id, 'adminNotes._id': noteId },
      { $pull: { adminNotes: { _id: noteId } } },
    );
    if (!result.matchedCount) throw new AppError(404, 'Note not found');
    noteActivity(res, { summary: `Deleted a note on booking ${bookingRefOf(req.params.id)}`, fields: ['adminNotes'] });
    const populated = await loadBooking(req.params.id);
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);

/**
 * Payment state: PATCH { status: 'unpaid' | 'paid' | 'refunded', via?, ref? } → { booking }.
 * `via` = a payment method key from Business settings → Payments, or 'cash'. Marking paid without `via`
 * uses the booking's own payment method. Only a paid booking can be refunded; unpaid clears it all.
 */
bookingsRouter.patch(
  '/:id/payment',
  requireRole('admin'),
  param('id').isMongoId(),
  body('status').isIn(['unpaid', 'paid', 'refunded']).withMessage('Pick paid, unpaid or refunded'),
  body('via').optional({ values: 'falsy' }).isString().trim().isLength({ max: 40 }),
  body('ref')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: PAYMENT_REF_MAX })
    .withMessage(`Keep the reference under ${PAYMENT_REF_MAX} characters`),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).select('paymentStatus paidAt paidVia paymentMethod');
    if (!booking) throw new AppError(404, 'Booking not found');

    const status = req.body.status as PaymentStatus;
    const settings = await getBusinessSettings();
    const methodLabel = (key: string) =>
      key === 'cash' ? 'Cash' : settings.payments.methods.find((m) => m.key === key)?.label ?? key;
    const knownMethod = (key: string) => key === 'cash' || settings.payments.methods.some((m) => m.key === key);
    const via = typeof req.body.via === 'string' ? req.body.via.trim() : '';
    const ref = typeof req.body.ref === 'string' ? req.body.ref.trim() : undefined;
    const current = booking.paymentStatus ?? 'unpaid';

    const set: Record<string, unknown> = { paymentStatus: status };
    const unset: Record<string, 1> = {};
    const applyRef = () => {
      if (ref === undefined) return;
      if (ref) set.paymentRef = ref;
      else unset.paymentRef = 1;
    };
    let summary: string;
    const bookingRef = bookingRefOf(String(booking._id));

    if (status === 'paid') {
      const method = via || booking.paidVia || booking.paymentMethod;
      if (!method || !knownMethod(method)) throw new AppError(400, 'Pick how the customer paid');
      set.paidVia = method;
      set.paidAt = current === 'paid' && booking.paidAt ? booking.paidAt : new Date();
      unset.refundedAt = 1;
      applyRef();
      summary = `Marked booking ${bookingRef} paid — ${methodLabel(method)}${ref ? ` · ref ${ref}` : ''}`;
    } else if (status === 'refunded') {
      if (current !== 'paid' && current !== 'refunded') throw new AppError(400, 'Only a paid booking can be refunded');
      if (via && !knownMethod(via)) throw new AppError(400, 'Unknown payment method');
      if (via) set.paidVia = via;
      set.refundedAt = new Date();
      applyRef();
      summary = `Marked booking ${bookingRef} refunded${ref ? ` · ref ${ref}` : ''}`;
    } else {
      Object.assign(unset, { paidAt: 1, paidVia: 1, paymentRef: 1, refundedAt: 1 });
      summary = `Marked booking ${bookingRef} unpaid`;
    }

    await Booking.updateOne(
      { _id: booking._id },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    );
    noteActivity(res, { summary, fields: Object.keys(set).concat(Object.keys(unset)) });
    const populated = await loadBooking(String(booking._id));
    res.json({ booking: formatBookingForRole(populated, req.user!.role) });
  }),
);
