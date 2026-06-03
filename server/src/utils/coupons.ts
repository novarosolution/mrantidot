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
  const fallback = FALLBACK[normalized];
  if (fallback != null) return Math.min(orderAmount, fallback);
  return 0;
}

export async function incrementOfferUse(code?: string): Promise<void> {
  if (!code?.trim()) return;
  const normalized = code.trim().toUpperCase();
  await Offer.updateOne({ code: normalized }, { $inc: { useCount: 1 } });
}
