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

export function displayUserName(user: Pick<StoredUser, 'name'> | null | undefined): string {
  const name = user?.name?.trim();
  if (!name || name.toLowerCase() === 'customer') return 'Your account';
  return name;
}

export function homeGreetingName(user: Pick<StoredUser, 'name'> | null | undefined): string {
  const name = user?.name?.trim();
  if (!name || name.toLowerCase() === 'customer') return 'Guest';
  return name.split(' ')[0] ?? name;
}
