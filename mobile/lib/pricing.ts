import type { Offer } from '@/types/api';

const FALLBACK_COUPONS: Record<string, number> = {
  ANTIDOT100: 100,
  FIRST50: 50,
};

export function couponDiscountFromOffers(code: string, offers: Offer[]): number {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return 0;
  const match = offers.find((o) => o.active && o.code.toUpperCase() === trimmed);
  if (match) return match.discount;
  return FALLBACK_COUPONS[trimmed] ?? 0;
}

export function isValidCoupon(code: string, offers: Offer[]): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true;
  return couponDiscountFromOffers(trimmed, offers) > 0;
}

/** @deprecated Use couponDiscountFromOffers with live offers */
export function couponDiscount(code: string): number {
  if (!code.trim()) return 0;
  return FALLBACK_COUPONS[code.trim().toUpperCase()] ?? 0;
}

export function computePricing(basePrice: number, couponCode = '', offers: Offer[] = []) {
  const base = basePrice;
  const gst = Math.round(base * 0.18);
  const coupon =
    offers.length > 0
      ? couponDiscountFromOffers(couponCode, offers)
      : couponDiscount(couponCode);
  const total = Math.max(0, base + gst - coupon);
  return { base, gst, coupon, total };
}
