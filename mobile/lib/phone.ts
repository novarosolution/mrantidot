import { normalizeLoginEmail } from '@/lib/email';

/** Match server normalizePhone for login / OTP. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function formatLoginIdentifier(input: string): string {
  const trimmed = input.trim();
  return trimmed.includes('@') ? normalizeLoginEmail(trimmed) : normalizePhone(trimmed);
}
