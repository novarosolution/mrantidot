import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, type IUser } from '../models/User';
import { normalizeLoginEmail } from './email';
import { normalizePhone } from './phone';

/** Legacy default admin email from docs/seed — map logins to env-configured admin. */
export const LEGACY_ADMIN_EMAILS = ['admin@mrantidot.com'];

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

/** Create or update the admin user from env (phone + email are stable keys). */
export async function upsertAdminUser(): Promise<IUser> {
  const admin = getAdminConfig();
  const passwordHash = await bcrypt.hash(admin.password, 12);

  // Remove stale duplicate admin rows so old docs email cannot block login.
  await User.deleteMany({
    role: 'admin',
    phone: { $ne: admin.phone },
    $or: [
      { email: { $in: LEGACY_ADMIN_EMAILS } },
      { email: admin.email },
    ],
  });

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
