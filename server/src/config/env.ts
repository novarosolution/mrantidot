import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/mrantidot',
  jwtSecret: process.env.JWT_SECRET ?? 'supersecret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? '*',
  uploadDir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR ?? 'uploads'),
  /** Admin account written to MongoDB on startup and during seed. */
  admin: {
    phone: process.env.ADMIN_PHONE ?? '9000000001',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
    name: process.env.ADMIN_NAME ?? 'Ravi Admin',
    email: process.env.ADMIN_EMAIL ?? 'admin@mrantidot.com',
    city: process.env.ADMIN_CITY ?? 'Mumbai',
  },
  ensureAdminOnStartup: process.env.ENSURE_ADMIN_ON_STARTUP !== 'false',
  workOtpTtlMinutes: parseInt(process.env.WORK_OTP_TTL_MINUTES ?? '30', 10),
};
