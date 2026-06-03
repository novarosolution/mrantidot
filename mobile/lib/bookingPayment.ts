import type { PaymentMethodRecord } from '@/types/api';

export const BOOKING_PAYMENT_FALLBACK: PaymentMethodRecord[] = [
  { id: 'fallback-upi', type: 'upi_card', label: 'UPI / Card', isDefault: true },
  { id: 'fallback-pay', type: 'pay_after', label: 'Pay after service', isDefault: false },
];

export function resolvePaymentMethods(apiMethods: PaymentMethodRecord[]): PaymentMethodRecord[] {
  if (apiMethods.length > 0) return apiMethods;
  return BOOKING_PAYMENT_FALLBACK;
}

export function defaultPaymentType(methods: PaymentMethodRecord[]): 'upi_card' | 'pay_after' {
  const def = methods.find((m) => m.isDefault) ?? methods[0];
  return def?.type ?? 'upi_card';
}

export const PAYMENT_TYPE_META: Record<
  'upi_card' | 'pay_after',
  { title: string; subtitle: string }
> = {
  upi_card: { title: 'UPI / Card', subtitle: 'Pay securely online before the visit' },
  pay_after: { title: 'Pay after service', subtitle: 'Settle with the technician when done' },
};
