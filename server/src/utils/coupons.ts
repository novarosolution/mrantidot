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

export async function incrementOfferUse(code?: string): Promise<void> {
  if (!code?.trim()) return;
  const normalized = code.trim().toUpperCase();
  const offer = await Offer.findOne({ code: normalized });
  if (!offer) return;
  if (offer.maxUses != null) {
    await Offer.updateOne(
      { _id: offer._id, useCount: { $lt: offer.maxUses } },
      { $inc: { useCount: 1 } },
    );
  } else {
    await Offer.updateOne({ _id: offer._id }, { $inc: { useCount: 1 } });
  }
}
