import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { assertValidMongoUri, ensureProductionJwt } from './validateEnv';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

ensureProductionJwt();

const mongoUri = process.env.MONGO_URI?.trim() ?? 'mongodb://127.0.0.1:27017/mrantidot';
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  try {
    assertValidMongoUri(mongoUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[env] ${message}`);
  }
}

export const env = {
  isProduction,
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongoUri,
  jwtSecret: process.env.JWT_SECRET ?? 'supersecret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? '*',
  uploadDir: path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'),
  ),
  admin: {
    phone: process.env.ADMIN_PHONE ?? '9000000001',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
    name: process.env.ADMIN_NAME ?? 'Ravi Admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@mrantidot.com',
    city: process.env.ADMIN_CITY ?? 'Mumbai',
  },
  ensureAdminOnStartup: process.env.ENSURE_ADMIN_ON_STARTUP !== 'false',
  workOtpTtlMinutes: parseInt(process.env.WORK_OTP_TTL_MINUTES ?? '30', 10),
  /** Cap Mongo connection pool — keeps RAM low on Render free tier (2GB). */
  mongoMaxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE ?? '5', 10),
};
