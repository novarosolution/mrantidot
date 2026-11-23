import { Types } from 'mongoose';
import { Booking, IBooking, IBookingStep } from '../models/Booking';
import { LeaveRequest } from '../models/LeaveRequest';
import { SavedAddress } from '../models/SavedAddress';
import { IService } from '../models/Service';
import { User } from '../models/User';
import { AppError } from './AppError';
import { couponValue } from './coupons';
import { localDateKey } from './dateKey';
import {
  addressInServiceArea,
  customerText,
  getBusinessSettings,
  type BusinessSettings,
} from './businessSettings';
import { notifyBookingEvent, notifyWorkOtpEvent } from './notifications';
import { appendTracking, issueStartOtp } from './workOtp';

/**
 * Coupon comes off the service price first; GST (Business settings → Tax, 18% by default) is charged
 * on the discounted amount. `gstPercent` is stored with the amount so old invoices keep their rate.
 */
export async function computeAmount(basePrice: number, couponCode?: string, gstPercent?: number) {
  const pct = gstPercent ?? (await getBusinessSettings()).tax.gstPercent;
  const base = basePrice;
  const coupon = Math.min(base, await couponValue(couponCode, base));
  const taxable = base - coupon;
  const gst = Math.round((taxable * pct) / 100);
  const total = taxable + gst;
  return { base, gst, coupon, total, gstPercent: pct };
}

export function buildStepsFromTemplate(template: string[]): IBookingStep[] {
  return template.map((title, index) => ({
    title,
    description: title,
    status: index === 0 ? 'active' : 'pending',
  }));
}

const BUSY_STATUSES = ['confirmed', 'in_progress', 'awaiting_verification'];

/**
 * Least-busy technician who can take a visit. Without `date` (older callers): any on-duty technician,
 * fewest open jobs. With `date` (+ `slot`): skips technicians on approved leave that day, with a job in the
 * same slot that day, or off duty when the visit is today; then fewest jobs that day, then fewest open jobs.
 * `prefer` (e.g. the customer's pick) wins when that technician is free.
 */
export async function assignLeastBusyTechnician(opts: {
  date?: string;
  slot?: string;
  excludeBookingId?: Types.ObjectId | string;
  prefer?: Types.ObjectId | string;
} = {}): Promise<Types.ObjectId | undefined> {
  const { date, slot } = opts;
  const today = localDateKey();
  const filter: Record<string, unknown> = { role: 'technician', disabled: { $ne: true } };
  // Off duty only matters for today's visits (the admin's assign rule); older callers keep "on duty".
  if (!date || date <= today) filter.available = true;
  const technicians = await User.find(filter).select('_id');
  if (technicians.length === 0) return undefined;
  let ids = technicians.map((t) => t._id as Types.ObjectId);

  const exclude = opts.excludeBookingId ? new Types.ObjectId(String(opts.excludeBookingId)) : undefined;
  if (date) {
    const onLeave = await LeaveRequest.find({
      technicianId: { $in: ids },
      status: 'approved',
      from: { $lte: date },
      to: { $gte: date },
    }).distinct('technicianId');
    const leaveSet = new Set(onLeave.map(String));
    if (slot && slot !== 'custom') {
      const clash = await Booking.find({
        technicianId: { $in: ids },
        'schedule.date': date,
        'schedule.slot': slot,
        status: { $in: BUSY_STATUSES },
        ...(exclude ? { _id: { $ne: exclude } } : {}),
      }).distinct('technicianId');
      for (const id of clash) leaveSet.add(String(id));
    }
    ids = ids.filter((id) => !leaveSet.has(String(id)));
    if (ids.length === 0) return undefined;
  }

  if (opts.prefer && ids.some((id) => String(id) === String(opts.prefer))) {
    return ids.find((id) => String(id) === String(opts.prefer));
  }

  const countBy = async (match: Record<string, unknown>) => {
    const rows = await Booking.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { technicianId: { $in: ids }, status: { $in: BUSY_STATUSES }, ...match } },
      { $group: { _id: '$technicianId', n: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.n]));
  };
  const [open, sameDay] = await Promise.all([countBy({}), date ? countBy({ 'schedule.date': date }) : Promise.resolve(new Map<string, number>())]);

  const ranked = ids
    .map((id) => ({ id, day: sameDay.get(String(id)) ?? 0, open: open.get(String(id)) ?? 0 }))
    .sort((a, b) => a.day - b.day || a.open - b.open);
  return ranked[0]?.id;
}

/**
 * "Auto-assign" (Business settings → Booking rules): gives a confirmed, unassigned booking the
 * least-busy free technician, issues the start code and sends the usual notifications.
 * Returns true when a technician was assigned. Safe to call after any confirm.
 */
export async function autoAssignIfEnabled(
  booking: IBooking,
  settings?: BusinessSettings,
  opts: { prefer?: Types.ObjectId | string } = {},
): Promise<boolean> {
  const s = settings ?? (await getBusinessSettings());
  if (!s.booking.autoAssign || booking.status !== 'confirmed' || booking.technicianId) return false;
  const techId = await assignLeastBusyTechnician({
    date: booking.schedule?.date,
    slot: booking.schedule?.slot,
    excludeBookingId: booking._id as Types.ObjectId,
    prefer: opts.prefer,
  });
  if (!techId) return false;
  booking.technicianId = techId;
  issueStartOtp(booking);
  appendTracking(booking, 'assigned', { auto: true });
  await booking.save();
  await notifyBookingEvent(booking, 'assigned');
  await notifyWorkOtpEvent(booking, 'start_otp_ready');
  return true;
}

/**
 * The technician a customer asked for, when that account exists and is active — only a preference:
 * auto-assign tries them first if they are free for the visit. Anything else is ignored (no error).
 */
export async function preferredTechnician(id: unknown): Promise<Types.ObjectId | undefined> {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) return undefined;
  const tech = await User.findOne({ _id: id, role: 'technician', disabled: { $ne: true } }).select('_id');
  return tech?._id as Types.ObjectId | undefined;
}

/** Resolve technician from customer booking: pick one tech, or leave unassigned for admin (auto). */
export async function resolveTechnicianForBooking(body: {
  technicianId?: string;
  assignmentMode?: string;
}): Promise<{ technicianId?: Types.ObjectId; assignmentMode: 'auto' | 'customer_pick' }> {
  if (body.technicianId) {
    const tech = await User.findOne({
      _id: body.technicianId,
      role: 'technician',
      available: { $ne: false },
      disabled: { $ne: true },
    });
    if (!tech) {
      throw new AppError(400, 'Selected technician is not available');
    }
    return { technicianId: tech._id, assignmentMode: 'customer_pick' };
  }

  const mode = body.assignmentMode === 'customer_pick' ? 'customer_pick' : 'auto';
  if (mode === 'customer_pick') {
    throw new AppError(400, 'Please select a technician or choose auto assign');
  }

  return { assignmentMode: 'auto' };
}

/* ---------- booking rules from Business settings ---------- */

/** Property type must be one the admin offers right now. */
export async function assertPropertyTypeOffered(key: unknown, settings: BusinessSettings): Promise<string> {
  const value = typeof key === 'string' ? key.trim() : '';
  if (!settings.lists.propertyTypes.some((p) => p.active && p.key === value)) {
    throw new AppError(400, await customerText('cartPropertyUnavailable', 'Please pick a property type from the list.'), 'PROPERTY_UNAVAILABLE');
  }
  return value;
}

/** Payment method must be switched on; none sent = the first one on (UPI / card by default). */
export async function resolvePaymentMethod(
  key: unknown,
  settings: BusinessSettings,
): Promise<'upi_card' | 'pay_after'> {
  const active = settings.payments.methods.filter((m) => m.active);
  const value = typeof key === 'string' && key.trim() ? key.trim() : active[0]?.key;
  if (!value || !active.some((m) => m.key === value)) {
    throw new AppError(400, await customerText('cartPaymentUnavailable', 'That payment option isn’t available right now. Please choose another.'), 'PAYMENT_UNAVAILABLE');
  }
  return value as 'upi_card' | 'pay_after';
}

/**
 * Service area for a new booking: a saved address is checked by its city + pincode (and text),
 * a typed address by its text (6-digit pincode or a listed city name).
 */
export async function assertBookingAddressInArea(
  settings: BusinessSettings,
  customerId: string,
  addressId: string | undefined,
  addressText: string,
): Promise<void> {
  if (!addressId) return assertInServiceArea(settings, { text: addressText });
  const saved = await SavedAddress.findOne({ _id: addressId, customerId })
    .select('city pincode')
    .lean<{ city?: string; pincode?: string }>();
  return assertInServiceArea(settings, { city: saved?.city, pincode: saved?.pincode, text: addressText });
}

/** Service area (Business settings → Service area): the visit address must be in a listed city / pincode. */
export async function assertInServiceArea(
  settings: BusinessSettings,
  where: { city?: string; pincode?: string; text?: string },
): Promise<void> {
  if (addressInServiceArea(settings, where)) return;
  throw new AppError(
    400,
    await customerText('cartAreaNotServed', 'Sorry, we don’t serve this area yet. Try another address or call us.'),
    'AREA_NOT_SERVED',
  );
}

export function activateNextStep(steps: IBookingStep[]): IBookingStep[] {
  if (steps.every((s) => s.status === 'done')) {
    return steps;
  }

  const nextPending = steps.findIndex((s) => s.status === 'pending');
  if (nextPending < 0) {
    return steps;
  }

  return steps.map((step, index) =>
    index === nextPending ? { ...step, status: 'active' as const } : step,
  );
}

export function allStepsDone(steps: IBookingStep[]): boolean {
  return steps.length > 0 && steps.every((s) => s.status === 'done');
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_verification', 'cancelled'],
  awaiting_verification: ['completed', 'cancelled'],
};

export function assertStatusTransition(current: string, next: string): void {
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new Error(`Invalid status transition from ${current} to ${next}`);
  }
}

export function initServiceSteps(service: IService): IBookingStep[] {
  const template =
    service.stepTemplate.length > 0
      ? service.stepTemplate
      : ['Arrival', 'Before', 'During', 'After', 'Sign-off'];
  return buildStepsFromTemplate(template);
}
