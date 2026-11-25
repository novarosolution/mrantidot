import { getBusinessSettings } from '@/lib/businessSettings';
import type { Offer } from '@/types/api';

function isOfferValidForOrder(offer: Offer, orderAmount: number): boolean {
  if (!offer.active) return false;
  if (offer.expiresAt) {
    const expires = new Date(offer.expiresAt);
    if (!Number.isNaN(expires.getTime()) && expires.getTime() < Date.now()) return false;
  }
  if (offer.maxUses != null && (offer.useCount ?? 0) >= offer.maxUses) return false;
  if (offer.minOrderAmount != null && orderAmount < offer.minOrderAmount) return false;
  return true;
}

function computeOfferDiscount(offer: Offer, orderAmount: number): number {
  if (offer.discountType === 'percent') {
    return Math.min(orderAmount, Math.round((orderAmount * offer.discount) / 100));
  }
  return Math.min(orderAmount, offer.discount);
}

export function couponDiscountFromOffers(code: string, offers: Offer[], orderAmount = 0): number {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return 0;
  const match = offers.find((o) => o.code.toUpperCase() === trimmed);
  if (match) {
    if (!isOfferValidForOrder(match, orderAmount)) return 0;
    return computeOfferDiscount(match, orderAmount);
  }
  // Match server: no built-in demo coupons — offers must exist in the database
  return 0;
}

/** Pass the order amount (subtotal) — with the default ₹0 every discount computes to 0, so any code reads as invalid. */
export function isValidCoupon(code: string, offers: Offer[], orderAmount = 0): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true;
  return couponDiscountFromOffers(trimmed, offers, orderAmount) > 0;
}

/**
 * @deprecated Coupons come from live offers only (`couponDiscountFromOffers`); the old built-in demo codes
 * are gone, matching the server. Always 0.
 */
export function couponDiscount(_code: string): number {
  return 0;
}

/**
 * Must match server computeAmount: coupon off the service price, then GST on the discounted amount.
 * The rate is the admin's (Business settings → Tax, 18% by default); pass `gstPercent` to price with a
 * specific rate (e.g. from `useBusinessSettings()` so the screen re-renders when it changes).
 */
export function computePricing(basePrice: number, couponCode = '', offers: Offer[] = [], gstPercent?: number) {
  const pct = gstPercent ?? getBusinessSettings().tax.gstPercent;
  const base = basePrice;
  const subtotal = base;
  const coupon = Math.min(base, couponDiscountFromOffers(couponCode, offers, base));
  const gst = Math.round(((base - coupon) * pct) / 100);
  const total = base - coupon + gst;
  return { base, gst, coupon, total, subtotal, gstPercent: pct };
}
