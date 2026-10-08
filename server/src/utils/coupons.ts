import { Offer, computeOfferDiscount, isOfferCurrentlyValid } from '../models/Offer';
import { AppError } from './AppError';

const FALLBACK: Record<string, number> = {
  ANTIDOT100: 100,
  FIRST50: 50,
};

export async function couponValue(code: string | undefined, orderAmount: number): Promise<number> {
  if (!code?.trim()) return 0;
  const normalized = code.trim().toUpperCase();
  const offer = await Offer.findOne({ code: normalized });
  if (offer) {
    if (!isOfferCurrentlyValid(offer, orderAmount)) {
      if (!offer.active) throw new AppError(400, 'This coupon is no longer active');
      if (offer.expiresAt && offer.expiresAt < new Date()) {
        throw new AppError(400, 'This coupon has expired');
      }
      if (offer.maxUses != null && offer.useCount >= offer.maxUses) {
        throw new AppError(400, 'This coupon has reached its usage limit');
      }
      if (offer.minOrderAmount != null && orderAmount < offer.minOrderAmount) {
        throw new AppError(
          400,
          `Minimum order ₹${offer.minOrderAmount} required for this coupon`,
        );
      }
      throw new AppError(400, 'This coupon cannot be applied');
    }
    return computeOfferDiscount(offer, orderAmount);
  }
  // Built-in demo coupons only when explicitly allowed (never for real env DB by default)
  const allowDemo =
    process.env.ALLOW_DEMO_COUPONS?.trim().toLowerCase() === 'true' ||
    process.env.ALLOW_DEMO_COUPONS?.trim() === '1';
  if (allowDemo && process.env.NODE_ENV !== 'production') {
    const fallback = FALLBACK[normalized];
    if (fallback != null) return Math.min(orderAmount, fallback);
  }
  throw new AppError(400, 'Invalid coupon code');
}

/** Atomically claims one use; returns false when the usage limit was reached in the meantime. */
export async function reserveOfferUse(code?: string): Promise<boolean> {
  if (!code?.trim()) return true;
  const offer = await Offer.findOne({ code: code.trim().toUpperCase() });
  if (!offer) return true;
  const filter = offer.maxUses != null
    ? { _id: offer._id, useCount: { $lt: offer.maxUses } }
    : { _id: offer._id };
  const res = await Offer.updateOne(filter, { $inc: { useCount: 1 } });
  return res.modifiedCount === 1;
}

export async function releaseOfferUse(code?: string): Promise<void> {
  if (!code?.trim()) return;
  await Offer.updateOne(
    { code: code.trim().toUpperCase(), useCount: { $gt: 0 } },
    { $inc: { useCount: -1 } },
  );
}
