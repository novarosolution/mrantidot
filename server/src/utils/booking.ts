import { Types } from 'mongoose';
import { IBooking, IBookingStep } from '../models/Booking';
import { SavedAddress } from '../models/SavedAddress';
import { IService } from '../models/Service';
import { User } from '../models/User';
import { AppError } from './AppError';
import { couponValue } from './coupons';
import {
  addressInServiceArea,
  customerText,
  getBusinessSettings,
  type BusinessSettings,
} from './businessSettings';
import { notifyBookingEvent, notifyWorkOtpEvent } from './notifications';
import { pickTechnicianForVisit, visitContextForBooking } from './technicianFit';
import { appendTracking, issueStartOtp } from './workOtp';

/** A booking's bill as stored on `booking.amount`. */
export type BookingAmount = {
  base: number;
  gst: number;
  coupon: number;
  total: number;
  gstPercent: number;
  /** Net of the admin's adjustment lines (before GST); left out when there are none. */
  adjustments?: number;
};

/**
 * The one bill formula — checkout, admin order edits and reopen all price through it so the app, the
 * website and the admin always agree: the coupon comes off the service price first, the admin's
 * adjustment lines (+ extra charge / − discount) are added, and GST (Business settings → Tax) is
 * charged on what is left. `gstPercent` is stored with the amount so old invoices keep their rate.
 */
export function priceBooking(parts: { base: number; coupon: number; adjustments?: number; gstPercent: number }): BookingAmount {
  const base = parts.base;
  const coupon = Math.min(base, Math.max(0, parts.coupon));
  const adjustments = Math.round(parts.adjustments ?? 0);
  const taxable = Math.max(0, base - coupon + adjustments);
  const gst = Math.round((taxable * parts.gstPercent) / 100);
  const total = taxable + gst;
  return { base, gst, coupon, total, gstPercent: parts.gstPercent, ...(adjustments !== 0 ? { adjustments } : {}) };
}

/** Checkout price: a coupon is checked like the customer typed it (active, expiry, minimum order, uses). */
export async function computeAmount(basePrice: number, couponCode?: string, gstPercent?: number): Promise<BookingAmount> {
  const pct = gstPercent ?? (await getBusinessSettings()).tax.gstPercent;
  const coupon = Math.min(basePrice, await couponValue(couponCode, basePrice));
  return priceBooking({ base: basePrice, coupon, gstPercent: pct });
}

export function buildStepsFromTemplate(template: string[]): IBookingStep[] {
  return template.map((title, index) => ({
    title,
    description: title,
    status: index === 0 ? 'active' : 'pending',
  }));
}

/**
 * Least-busy technician who can take a visit — the rules live in utils/technicianFit.ts (shared with the
 * admin's assign picker). Skips anyone off duty for a visit today, on leave (approved or marked in
 * attendance), with a job in the same slot, on a weekly day off, at their daily job cap, without a skill for
 * the service's pest types (`serviceTypes`) or outside their cities / pincodes (`address`); then fewest jobs
 * that day, then fewest open jobs. Without `date` (older callers) only duty, skills and area count.
 * `prefer` (e.g. the customer's pick) wins when that technician is free.
 */
export async function assignLeastBusyTechnician(opts: {
  date?: string;
  slot?: string;
  excludeBookingId?: Types.ObjectId | string;
  prefer?: Types.ObjectId | string;
  /** Pest types of the booked service. */
  serviceTypes?: string[];
  /** Visit address text. */
  address?: string;
} = {}): Promise<Types.ObjectId | undefined> {
  return pickTechnicianForVisit({
    date: opts.date,
    slot: opts.slot,
    excludeBookingId: opts.excludeBookingId,
    prefer: opts.prefer,
    pestTypes: opts.serviceTypes,
    address: opts.address,
  });
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
  const visit = await visitContextForBooking(booking);
  const techId = await assignLeastBusyTechnician({
    date: visit.date,
    slot: visit.slot,
    excludeBookingId: visit.excludeBookingId,
    prefer: opts.prefer,
    serviceTypes: visit.pestTypes,
    address: visit.address,
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
