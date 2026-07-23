import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, type IUser } from '../models/User';
import { normalizeLoginEmail } from './email';
import { normalizePhone } from './phone';

/** Legacy default admin email from docs/seed — map logins to env-configured admin. */
export const LEGACY_ADMIN_EMAILS = ['admin@mrantidot.com'];

/** Old seed/demo admin phones — map logins to the env-configured admin. */
export const LEGACY_ADMIN_PHONES = ['9000000001'];

/** Old demo passwords accepted only in development (then re-synced to ADMIN_PASSWORD). */
export const LEGACY_ADMIN_PASSWORDS = ['admin123', 'Ronak@1027'];

export type AdminConfig = {
  phone: string;
  password: string;
  name: string;
  email: string;
  city: string;
};

export function getAdminConfig(): AdminConfig {
  return {
    phone: normalizePhone(env.admin.phone),
    password: env.admin.password,
    name: env.admin.name,
    email: normalizeLoginEmail(env.admin.email),
    city: env.admin.city,
  };
}

/** True when identifier should resolve to the env-configured admin account. */
export function isLegacyAdminIdentifier(identifier: string): boolean {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed.includes('@')) return false;
  const normalized = normalizeLoginEmail(trimmed);
  return LEGACY_ADMIN_EMAILS.includes(normalized) || LEGACY_ADMIN_EMAILS.includes(trimmed);
}

/** True when identifier matches the env admin phone or email (including legacy aliases). */
export function isEnvAdminIdentifier(identifier: string): boolean {
  const trimmed = identifier.trim();
  if (!trimmed) return false;
  if (isLegacyAdminIdentifier(trimmed)) return true;

  const admin = getAdminConfig();
  if (trimmed.includes('@')) {
    return normalizeLoginEmail(trimmed) === admin.email;
  }
  const phone = normalizePhone(trimmed);
  return phone === admin.phone || LEGACY_ADMIN_PHONES.includes(phone);
}

/** Password allowed for env/legacy admin login (env password, or legacy demo in non-prod). */
export function isAcceptedAdminPassword(password: string): boolean {
  const pass = password.trim();
  const admin = getAdminConfig();
  if (pass === admin.password) return true;
  if (env.isProduction) return false;
  return LEGACY_ADMIN_PASSWORDS.includes(pass);
}

/** Create or update the admin user from env (phone + email are stable keys). */
export async function upsertAdminUser(): Promise<IUser> {
  const admin = getAdminConfig();
  const passwordHash = await bcrypt.hash(admin.password, 12);

  // Soft-disable stale duplicate admin rows (never hard-delete on boot).
  await User.updateMany(
    {
      role: 'admin',
      phone: { $ne: admin.phone },
      $or: [
        { email: { $in: LEGACY_ADMIN_EMAILS } },
        { email: admin.email },
      ],
    },
    { disabled: true, available: false },
  );

  return User.findOneAndUpdate(
    { $or: [{ phone: admin.phone }, { email: admin.email }] },
    {
      role: 'admin',
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      passwordHash,
      city: admin.city,
      rating: 0,
      jobsDone: 0,
      available: true,
      disabled: false,
    },
    { upsert: true, new: true },
  );
}

/** Load env-configured admin for login (handles legacy admin@ email alias). */
export async function findEnvAdminForLogin(): Promise<IUser | null> {
  const admin = getAdminConfig();
  return User.findOne({ phone: admin.phone }).select('+passwordHash');
}
