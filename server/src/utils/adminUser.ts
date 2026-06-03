import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, type IUser } from '../models/User';
import { normalizePhone } from './phone';

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
    email: env.admin.email,
    city: env.admin.city,
  };
}

/** Create or update the admin user from env (phone is the stable key). */
export async function upsertAdminUser(): Promise<IUser> {
  const admin = getAdminConfig();
  const passwordHash = await bcrypt.hash(admin.password, 12);
  return User.findOneAndUpdate(
    { phone: admin.phone },
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
    },
    { upsert: true, new: true },
  );
}
