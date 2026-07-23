import type { Offer } from '@/types/api';

const FALLBACK_COUPONS: Record<string, number> = {
  ANTIDOT100: 100,
  FIRST50: 50,
};

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

export function isValidCoupon(code: string, offers: Offer[], orderAmount = 0): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true;
  return couponDiscountFromOffers(trimmed, offers, orderAmount) > 0;
}

/** @deprecated Use couponDiscountFromOffers with live offers */
export function couponDiscount(code: string): number {
  if (!__DEV__ || !code.trim()) return 0;
  return FALLBACK_COUPONS[code.trim().toUpperCase()] ?? 0;
}

export function computePricing(basePrice: number, couponCode = '', offers: Offer[] = []) {
  const base = basePrice;
  const gst = Math.round(base * 0.18);
  const subtotal = base + gst;
  const coupon = couponDiscountFromOffers(couponCode, offers, subtotal);
  const total = Math.max(0, subtotal - coupon);
  return { base, gst, coupon, total, subtotal };
}
