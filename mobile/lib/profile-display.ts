import type { StoredUser } from '@/lib/storage';

const OTP_EMAIL_SUFFIX = '@otp.mrantidot.local';

export function isOtpPlaceholderEmail(email?: string): boolean {
  return !!email?.toLowerCase().endsWith(OTP_EMAIL_SUFFIX);
}

export function displayUserEmail(email?: string): string | undefined {
  const trimmed = email?.trim();
  if (!trimmed || isOtpPlaceholderEmail(trimmed)) return undefined;
  return trimmed;
}

export function isProfileIncomplete(user: Pick<StoredUser, 'name' | 'email'> | null | undefined): boolean {
  if (!user) return false;
  const name = user.name?.trim() ?? '';
  if (!name || name.toLowerCase() === 'customer') return true;
  if (isOtpPlaceholderEmail(user.email)) return true;
  return false;
}

/** False while the account still has the sign-up placeholder name (or none). */
export function hasDisplayName(user: Pick<StoredUser, 'name'> | null | undefined): boolean {
  const name = user?.name?.trim();
  return Boolean(name) && name!.toLowerCase() !== 'customer';
}

/** The customer's name, or `fallback` (admin copy `profileNameFallback` on customer screens). */
export function displayUserName(user: Pick<StoredUser, 'name'> | null | undefined, fallback = 'Your account'): string {
  return hasDisplayName(user) ? user!.name!.trim() : fallback;
}

export function homeGreetingName(user: Pick<StoredUser, 'name'> | null | undefined): string {
  const name = user?.name?.trim();
  if (!name || name.toLowerCase() === 'customer') return 'Guest';
  return name.split(' ')[0] ?? name;
}

/** 10-digit Indian mobile → "+91 98765 43210"; anything else is shown as entered. */
export function formatPhoneDisplay(raw?: string | null): string | undefined {
  const phone = raw?.trim();
  if (!phone) return undefined;
  return /^\d{10}$/.test(phone) ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
}
