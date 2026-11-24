import { Types } from 'mongoose';
import type { IBooking, IBookingAdjustment, IBookingStep } from '../models/Booking';
import { Offer, computeOfferDiscount } from '../models/Offer';
import { Service, type IService } from '../models/Service';
import { AppError } from './AppError';
import { initServiceSteps, priceBooking, type BookingAmount } from './booking';
import { listLabel, type BusinessSettings } from './businessSettings';
import { couponValue } from './coupons';
import { bookingMessage, bookingTemplateVars, notifyUser } from './notifications';

/**
 * Admin "Edit order" (PATCH /bookings/:id/order and its preview). One planner decides what may change
 * for the booking's stage, re-checks a new coupon exactly like checkout does, reprices through the shared
 * `priceBooking` formula and describes every change for the booking's history and the activity log.
 *
 *  - pending / confirmed (assigned or not): everything — service, size, property, coupon, adjustment
 *    lines, payment method. A new service rebuilds the treatment steps.
 *  - in progress / awaiting verification: everything except the service and size.
 *  - completed: adjustment lines only (priced at the booking's own GST rate — the visit is done).
 *  - cancelled: nothing (reopen it first).
 * The price is only recomputed when something that affects it changes (size, service, coupon,
 * adjustments); a recomputed price uses the current GST rate from Business settings.
 */

export const ORDER_ADJUSTMENT_MAX_LINES = 20;
export const ORDER_ADJUSTMENT_LABEL_MIN = 2;
export const ORDER_ADJUSTMENT_LABEL_MAX = 60;
export const ORDER_ADJUSTMENT_REASON_MAX = 200;
export const ORDER_ADJUSTMENT_AMOUNT_MAX = 1_000_000;
export const ORDER_NOTE_MAX = 200;
/** Order history entries kept per booking (oldest dropped first). */
export const ORDER_HISTORY_KEEP = 50;

export type OrderEditInput = {
  serviceId?: unknown;
  optionKey?: unknown;
  propertyType?: unknown;
  couponCode?: unknown;
  adjustments?: unknown;
  paymentMethod?: unknown;
  note?: unknown;
  /** Total the admin was looking at — a 409 when the booking changed meanwhile. */
  expectedTotal?: unknown;
};

type AdjustmentLine = Pick<IBookingAdjustment, '_id' | 'label' | 'amount' | 'reason' | 'by' | 'byName' | 'at'>;

export type OrderEditPlan = {
  before: BookingAmount;
  amount: BookingAmount;
  /** Readable lines for the history ("Service: A → B", "Coupon FIRST50 removed"…). Empty = nothing changes. */
  changes: string[];
  /** Short names of what changed, for the activity summary ("service, coupon"). */
  parts: string[];
  /** Booking fields written (activity log field names). */
  fields: string[];
  serviceChanged: boolean;
  totalChanged: boolean;
  /** The customer hears about it (the total or the service changed). */
  notifyCustomer: boolean;
  gstChanged: boolean;
  stepsRebuilt: boolean;
  /** Coupon to claim before saving (a new code) and to give back after saving (the old code). */
  couponClaim?: string;
  couponRelease?: string;
  couponCode: string | null;
  service: { id: string; name: string };
  note?: string;
  $set: Record<string, unknown>;
  $unset: Record<string, 1>;
};

const PRE_WORK = new Set(['pending', 'confirmed']);

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** "+₹500" / "−₹200". */
function signed(n: number): string {
  return `${n < 0 ? '−' : '+'}${rupee(Math.abs(n))}`;
}

function oneLine(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max + 1) : '';
}

function normCode(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : null;
}

function idOf(value: unknown): string {
  if (!value) return '';
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) return String((value as { _id: unknown })._id);
  return String(value);
}

/** The stored bill with its GST rate filled in (bookings made before rates were stored were charged 18%). */
export function storedAmount(booking: Pick<IBooking, 'amount'>): BookingAmount {
  const a = booking.amount ?? { base: 0, gst: 0, coupon: 0, total: 0 };
  const pct = typeof a.gstPercent === 'number' && Number.isFinite(a.gstPercent) ? a.gstPercent : 18;
  return {
    base: a.base ?? 0,
    gst: a.gst ?? 0,
    coupon: a.coupon ?? 0,
    total: a.total ?? 0,
    gstPercent: pct,
    ...(typeof a.adjustments === 'number' && a.adjustments !== 0 ? { adjustments: a.adjustments } : {}),
  };
}

function lockedError(completed: boolean): AppError {
  return completed
    ? new AppError(400, 'This booking is completed — only extra charges and discounts can change now.', 'ORDER_LOCKED')
    : new AppError(400, 'Work has started, so the service and size can’t change any more.', 'SERVICE_LOCKED');
}

/**
 * A coupon the booking already holds, re-priced for a new service price: its use is already counted and
 * the customer keeps the deal they booked with (even if it has expired since), but the minimum order
 * still applies. A code that no longer exists keeps the discount it gave (capped at the new price).
 */
async function keptCouponValue(code: string, base: number, previous: number): Promise<number> {
  const offer = await Offer.findOne({ code });
  if (!offer) return Math.min(base, previous);
  if (offer.minOrderAmount != null && base < offer.minOrderAmount) {
    throw new AppError(
      400,
      `Coupon ${code} needs a minimum order of ${rupee(offer.minOrderAmount)}. Remove the coupon or pick a bigger option.`,
      'COUPON_INVALID',
    );
  }
  return computeOfferDiscount(offer, base);
}

/** A new coupon, checked exactly like checkout (active, expiry, minimum order, usage limit). */
async function newCouponValue(code: string, base: number): Promise<number> {
  let value: number;
  try {
    value = Math.min(base, await couponValue(code, base));
  } catch (err) {
    if (err instanceof AppError) throw new AppError(400, err.message, 'COUPON_INVALID');
    throw err;
  }
  if (value <= 0) throw new AppError(400, 'This coupon takes nothing off this order.', 'COUPON_INVALID');
  return value;
}

function parseAdjustments(
  raw: unknown,
  current: AdjustmentLine[],
  actor: { id: string; name: string },
  now: Date,
): AdjustmentLine[] {
  if (!Array.isArray(raw)) throw new AppError(400, 'Send the extra charges and discounts as a list.', 'ADJUSTMENT_INVALID');
  if (raw.length > ORDER_ADJUSTMENT_MAX_LINES) {
    throw new AppError(400, `Add at most ${ORDER_ADJUSTMENT_MAX_LINES} extra charges or discounts.`, 'ADJUSTMENT_INVALID');
  }
  const byId = new Map(current.map((a) => [String(a._id), a]));
  const used = new Set<string>();
  return raw.map((item, i) => {
    const r = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const label = oneLine(r.label, ORDER_ADJUSTMENT_LABEL_MAX);
    if (label.length < ORDER_ADJUSTMENT_LABEL_MIN) {
      throw new AppError(400, `Give line ${i + 1} a label the customer will understand (at least 2 characters).`, 'ADJUSTMENT_INVALID');
    }
    if (label.length > ORDER_ADJUSTMENT_LABEL_MAX) {
      throw new AppError(400, `Keep “${label.slice(0, 20)}…” under ${ORDER_ADJUSTMENT_LABEL_MAX} characters.`, 'ADJUSTMENT_INVALID');
    }
    const n = typeof r.amount === 'number' ? r.amount : typeof r.amount === 'string' && r.amount.trim() ? Number(r.amount) : NaN;
    const amount = Number.isFinite(n) ? Math.round(n) : NaN;
    if (!Number.isFinite(amount) || amount === 0) {
      throw new AppError(400, `Enter an amount for “${label}” (a discount is a minus amount).`, 'ADJUSTMENT_INVALID');
    }
    if (Math.abs(amount) > ORDER_ADJUSTMENT_AMOUNT_MAX) {
      throw new AppError(400, `“${label}” is too large — keep each line under ${rupee(ORDER_ADJUSTMENT_AMOUNT_MAX)}.`, 'ADJUSTMENT_INVALID');
    }
    const reason = oneLine(r.reason, ORDER_ADJUSTMENT_REASON_MAX);
    if (reason.length > ORDER_ADJUSTMENT_REASON_MAX) {
      throw new AppError(400, `Keep the reason for “${label}” under ${ORDER_ADJUSTMENT_REASON_MAX} characters.`, 'ADJUSTMENT_INVALID');
    }
    const id = typeof r.id === 'string' ? r.id : '';
    const existing = id && !used.has(id) ? byId.get(id) : undefined;
    if (existing) used.add(id);
    return {
      _id: existing?._id ?? new Types.ObjectId(),
      label,
      amount,
      ...(reason ? { reason } : {}),
      by: existing?.by ?? new Types.ObjectId(actor.id),
      byName: existing?.byName ?? actor.name,
      at: existing?.at ?? now,
    };
  });
}

function sameAdjustments(a: AdjustmentLine[], b: AdjustmentLine[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((line, i) => {
    const other = b[i];
    return (
      String(line._id) === String(other._id) &&
      line.label === other.label &&
      line.amount === other.amount &&
      (line.reason ?? '') === (other.reason ?? '')
    );
  });
}

function adjustmentChanges(before: AdjustmentLine[], after: AdjustmentLine[]): string[] {
  const out: string[] = [];
  const old = new Map(before.map((a) => [String(a._id), a]));
  for (const line of after) {
    const prev = old.get(String(line._id));
    if (!prev) {
      out.push(`Added “${line.label}” ${signed(line.amount)}`);
    } else if (prev.label !== line.label || prev.amount !== line.amount) {
      const renamed = prev.label !== line.label ? ` “${line.label}”` : '';
      out.push(`Changed “${prev.label}” ${signed(prev.amount)} →${renamed} ${signed(line.amount)}`);
    } else if ((prev.reason ?? '') !== (line.reason ?? '')) {
      out.push(`Updated the reason for “${line.label}”`);
    }
  }
  for (const prev of before) {
    if (!after.some((a) => String(a._id) === String(prev._id))) out.push(`Removed “${prev.label}” ${signed(prev.amount)}`);
  }
  return out;
}

function optionText(o?: { label: string; price: number } | null): string {
  return o ? `${o.label} (${rupee(o.price)})` : 'none';
}

/**
 * Works out an admin's order edit without saving anything — the preview returns it, the save applies
 * `$set` / `$unset` and the coupon claim / release. Throws a 400 (with a `code`) the screen can show.
 */
export async function planOrderEdit(
  booking: IBooking,
  input: OrderEditInput,
  settings: BusinessSettings,
  actor: { id: string; name: string },
): Promise<OrderEditPlan> {
  const status = booking.status;
  if (status === 'cancelled') {
    throw new AppError(400, 'This booking is cancelled. Reopen it before changing the order.', 'ORDER_CANCELLED');
  }
  const completed = status === 'completed';
  const preWork = PRE_WORK.has(status);
  const before = storedAmount(booking);
  const now = new Date();

  if (input.expectedTotal !== undefined && input.expectedTotal !== null && input.expectedTotal !== '') {
    const expected = Number(input.expectedTotal);
    if (Number.isFinite(expected) && Math.round(expected) !== Math.round(before.total)) {
      throw new AppError(
        409,
        `This booking’s total changed to ${rupee(before.total)} while you were editing. Review the order and save again.`,
        'ORDER_STALE',
      );
    }
  }

  /* ---------- service + size ---------- */
  const currentServiceId = idOf(booking.serviceId);
  const currentService = currentServiceId ? await Service.findById(currentServiceId) : null;
  const currentServiceName = currentService?.name ?? 'Service';
  const wantServiceId = typeof input.serviceId === 'string' && input.serviceId.trim() ? input.serviceId.trim() : currentServiceId;
  const serviceChanged = wantServiceId !== currentServiceId;

  let service: IService | null = currentService;
  if (serviceChanged) {
    if (!preWork) throw lockedError(completed);
    if (!Types.ObjectId.isValid(wantServiceId)) throw new AppError(400, 'Pick a service from the list.', 'SERVICE_UNAVAILABLE');
    service = await Service.findById(wantServiceId);
    if (!service || !service.active) {
      throw new AppError(400, 'That service isn’t available any more. Pick an active service.', 'SERVICE_UNAVAILABLE');
    }
  }

  const currentOption = booking.option?.key
    ? { key: booking.option.key, label: booking.option.label, price: booking.option.price }
    : undefined;
  const keyGiven = input.optionKey !== undefined;
  const wantKey = keyGiven && typeof input.optionKey === 'string' ? input.optionKey.trim() : '';
  let nextOption = currentOption;
  let base = before.base;

  if (serviceChanged && service) {
    const options = service.options ?? [];
    if (options.length > 0) {
      const picked = options.find((o) => o.key === wantKey);
      if (!picked) {
        throw new AppError(400, `Pick ${service.optionsTitle?.toLowerCase() || 'a size'} for ${service.name}.`, 'OPTION_REQUIRED');
      }
      nextOption = { key: picked.key, label: picked.label, price: picked.price };
    } else {
      nextOption = undefined;
    }
    base = nextOption?.price ?? service.basePrice;
  } else if (keyGiven && (wantKey || null) !== (currentOption?.key ?? null)) {
    if (!preWork) throw lockedError(completed);
    if (!service) throw new AppError(400, 'This booking’s service was removed, so its size can’t change.', 'SERVICE_UNAVAILABLE');
    const options = service.options ?? [];
    if (!wantKey) {
      if (options.length > 0) {
        throw new AppError(400, `Pick ${service.optionsTitle?.toLowerCase() || 'a size'} for ${service.name}.`, 'OPTION_REQUIRED');
      }
      nextOption = undefined;
      base = service.basePrice;
    } else {
      const picked = options.find((o) => o.key === wantKey);
      if (!picked) throw new AppError(400, 'That size isn’t offered for this service any more.', 'OPTION_REQUIRED');
      nextOption = { key: picked.key, label: picked.label, price: picked.price };
      base = picked.price;
    }
  }
  const optionChanged = serviceChanged || (nextOption?.key ?? null) !== (currentOption?.key ?? null);
  const priceChanged = base !== before.base;

  /* ---------- property type ---------- */
  const currentProperty = booking.propertyType ? String(booking.propertyType) : '';
  let nextProperty = currentProperty;
  if (typeof input.propertyType === 'string' && input.propertyType.trim() && input.propertyType.trim() !== currentProperty) {
    if (completed) throw lockedError(true);
    const value = input.propertyType.trim();
    if (!settings.lists.propertyTypes.some((p) => p.active && p.key === value)) {
      throw new AppError(400, 'Pick a property type that is switched on in Business settings.', 'PROPERTY_UNAVAILABLE');
    }
    nextProperty = value;
  }
  const propertyChanged = nextProperty !== currentProperty;

  /* ---------- payment method ---------- */
  const currentPayment = booking.paymentMethod;
  let nextPayment: string = currentPayment;
  if (typeof input.paymentMethod === 'string' && input.paymentMethod.trim() && input.paymentMethod.trim() !== currentPayment) {
    if (completed) throw lockedError(true);
    const value = input.paymentMethod.trim();
    if (!settings.payments.methods.some((m) => m.active && m.key === value)) {
      throw new AppError(400, 'That payment method is switched off in Business settings.', 'PAYMENT_UNAVAILABLE');
    }
    nextPayment = value;
  }
  const paymentChanged = nextPayment !== currentPayment;

  /* ---------- coupon ---------- */
  const currentCode = normCode(booking.couponCode);
  const wantCode = input.couponCode === undefined ? currentCode : normCode(input.couponCode);
  const couponChanged = wantCode !== currentCode;
  if (couponChanged && completed) throw lockedError(true);
  let coupon = 0;
  if (wantCode) {
    if (couponChanged) coupon = await newCouponValue(wantCode, base);
    else if (!priceChanged) coupon = before.coupon;
    else coupon = await keptCouponValue(wantCode, base, before.coupon);
  }

  /* ---------- adjustment lines ---------- */
  const currentLines: AdjustmentLine[] = (booking.adjustments ?? []).map((a) => ({
    _id: a._id,
    label: a.label,
    amount: a.amount,
    ...(a.reason ? { reason: a.reason } : {}),
    by: a.by,
    byName: a.byName,
    at: a.at,
  }));
  const nextLines = input.adjustments === undefined ? currentLines : parseAdjustments(input.adjustments, currentLines, actor, now);
  const adjustmentsChanged = !sameAdjustments(currentLines, nextLines);
  const adjustmentTotal = nextLines.reduce((sum, a) => sum + a.amount, 0);
  const adjustmentTotalBefore = currentLines.reduce((sum, a) => sum + a.amount, 0);

  /* ---------- price ---------- */
  const priceInputsChanged = priceChanged || couponChanged || coupon !== before.coupon || adjustmentTotal !== adjustmentTotalBefore;
  if (base - Math.min(base, coupon) + adjustmentTotal < 0) {
    throw new AppError(
      400,
      `Discounts can’t be more than the order value (${rupee(base - Math.min(base, coupon))} before GST).`,
      'ADJUSTMENTS_TOO_LOW',
    );
  }
  const gstPercent = completed || !priceInputsChanged ? before.gstPercent : settings.tax.gstPercent;
  const amount = priceInputsChanged ? priceBooking({ base, coupon, adjustments: adjustmentTotal, gstPercent }) : before;
  const gstChanged = amount.gstPercent !== before.gstPercent;

  /* ---------- what changed ---------- */
  const changes: string[] = [];
  const parts: string[] = [];
  const nextServiceName = service?.name ?? currentServiceName;
  if (serviceChanged) {
    changes.push(`Service: ${currentServiceName} → ${nextServiceName}`);
    parts.push('service');
  }
  if (optionChanged && (currentOption || nextOption)) {
    changes.push(`Size: ${optionText(currentOption)} → ${optionText(nextOption)}`);
    if (!serviceChanged) parts.push('size');
  } else if (priceChanged) {
    changes.push(`Service price: ${rupee(before.base)} → ${rupee(base)}`);
  }
  if (propertyChanged) {
    const types = settings.lists.propertyTypes;
    changes.push(`Property: ${currentProperty ? listLabel(types, currentProperty) : 'none'} → ${listLabel(types, nextProperty)}`);
    parts.push('property type');
  }
  if (couponChanged) {
    if (currentCode && wantCode) changes.push(`Coupon ${currentCode} → ${wantCode} (−${rupee(coupon)})`);
    else if (wantCode) changes.push(`Coupon ${wantCode} applied (−${rupee(coupon)})`);
    else if (currentCode) changes.push(`Coupon ${currentCode} removed (was −${rupee(before.coupon)})`);
    parts.push('coupon');
  } else if (wantCode && coupon !== before.coupon) {
    changes.push(`Coupon ${wantCode}: −${rupee(before.coupon)} → −${rupee(coupon)}`);
  }
  if (adjustmentsChanged) {
    changes.push(...adjustmentChanges(currentLines, nextLines));
    parts.push('extra charges / discounts');
  }
  if (paymentChanged) {
    const methods = settings.payments.methods;
    changes.push(`Payment: ${listLabel(methods, currentPayment)} → ${listLabel(methods, nextPayment)}`);
    parts.push('payment method');
  }
  if (gstChanged) {
    changes.push(`GST rate: ${before.gstPercent}% → ${amount.gstPercent}% (current rate)`);
    parts.push('GST rate');
  }

  /* ---------- writes ---------- */
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  let steps: IBookingStep[] | undefined;
  if (serviceChanged && service) {
    $set.serviceId = service._id;
    steps = initServiceSteps(service);
    $set.steps = steps;
  }
  if (optionChanged) {
    if (nextOption) $set.option = nextOption;
    else if (currentOption) $unset.option = 1;
  }
  if (propertyChanged) $set.propertyType = nextProperty;
  if (couponChanged) {
    if (wantCode) $set.couponCode = wantCode;
    else $unset.couponCode = 1;
  }
  if (adjustmentsChanged) {
    if (nextLines.length > 0) $set.adjustments = nextLines;
    else $unset.adjustments = 1;
  }
  if (paymentChanged) $set.paymentMethod = nextPayment;
  if (priceInputsChanged) $set.amount = amount;

  const totalChanged = amount.total !== before.total;
  const note = oneLine(input.note, ORDER_NOTE_MAX).slice(0, ORDER_NOTE_MAX);

  return {
    before,
    amount,
    changes,
    parts,
    fields: [...Object.keys($set), ...Object.keys($unset)],
    serviceChanged,
    totalChanged,
    notifyCustomer: changes.length > 0 && (totalChanged || serviceChanged),
    gstChanged,
    stepsRebuilt: Boolean(steps),
    ...(couponChanged && wantCode ? { couponClaim: wantCode } : {}),
    ...(couponChanged && currentCode ? { couponRelease: currentCode } : {}),
    couponCode: wantCode,
    service: { id: service ? String(service._id) : currentServiceId, name: nextServiceName },
    ...(note ? { note } : {}),
    $set,
    $unset,
  };
}

/** "₹1,180" — shared with the order routes for summaries and the {total} message placeholder. */
export function orderRupee(n: number): string {
  return rupee(n);
}

/** What `POST /bookings/:id/order/preview` answers — nothing is saved. */
export function orderPreviewJson(plan: OrderEditPlan) {
  return {
    amount: plan.amount,
    before: plan.before,
    difference: plan.amount.total - plan.before.total,
    changes: plan.changes,
    unchanged: plan.changes.length === 0,
    serviceChanged: plan.serviceChanged,
    totalChanged: plan.totalChanged,
    notifyCustomer: plan.notifyCustomer,
    gstChanged: plan.gstChanged,
    stepsRebuilt: plan.stepsRebuilt,
    couponCode: plan.couponCode,
    service: plan.service,
  };
}

/**
 * Tells the customer their order changed (template `order_updated.customer`, Business settings →
 * Messages): {service} {ref} {date} {time} plus {total}. Pass the reloaded (populated) booking.
 */
export async function notifyOrderUpdated(booking: IBooking): Promise<boolean> {
  const customerId = idOf(booking.customerId);
  if (!customerId) return false;
  const vars = { ...(await bookingTemplateVars(booking)), total: rupee(booking.amount?.total ?? 0) };
  const msg = await bookingMessage(booking, 'order_updated', 'customer', vars);
  if (!msg) return false;
  await notifyUser(customerId, msg.title, msg.body, 'order_updated', booking._id as Types.ObjectId);
  return true;
}

/** The bill without its coupon at the booking's own GST rate — reopening when the coupon ran out meanwhile. */
export function amountWithoutCoupon(booking: Pick<IBooking, 'amount'>): BookingAmount {
  const before = storedAmount(booking);
  return priceBooking({ base: before.base, coupon: 0, adjustments: before.adjustments ?? 0, gstPercent: before.gstPercent });
}
