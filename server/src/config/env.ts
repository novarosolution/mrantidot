import crypto from 'crypto';
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

const usesEmbeddedDb =
  ['1', 'true', 'yes'].includes(process.env.USE_MEMORY_MONGO?.trim().toLowerCase() ?? '') ||
  ['memory', 'mongodb-memory'].includes(mongoUri.toLowerCase());

if (!isProduction && !usesEmbeddedDb) {
  try {
    assertValidMongoUri(mongoUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[env] ${message}`);
  }
}

// Outside production, never fall back to a well-known signing secret: a dev server exposed on a
// LAN/public host would otherwise accept forged tokens. Unset => random per-process secret
// (tokens reset on restart); set JWT_SECRET in server/.env to keep sessions across restarts.
let jwtSecret = process.env.JWT_SECRET?.trim();
if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[env] JWT_SECRET not set — using a random one for this run. Set it in server/.env to keep logins across restarts.');
}

/** CLIENT_URL may be "*" or a comma-separated list of allowed browser origins. */
const clientUrl = process.env.CLIENT_URL?.trim() || '*';
if (isProduction && clientUrl === '*') {
  console.warn('[env] CLIENT_URL=* allows any browser origin. Set CLIENT_URL to your web origin(s); the native app is unaffected by CORS.');
}

function parseTrustProxy(value: string | undefined): boolean | number | string {
  const v = value?.trim();
  if (!v || v === 'false' || v === '0') return false;
  if (v === 'true') return true;
  const n = Number(v);
  return Number.isInteger(n) ? n : v;
}

export const env = {
  isProduction,
  port: parseInt(process.env.PORT ?? '4001', 10),
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl,
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
  /**
   * Shared secret the public website sends as X-Website-Key. Requests carrying it are rate-limited
   * by the visitor IP the website forwards (X-Client-IP) instead of the website server's own IP.
   */
  websiteApiKey: process.env.WEBSITE_API_KEY?.trim() || '',
  /** Express "trust proxy" setting — set TRUST_PROXY=1 behind Render or another reverse proxy. */
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  /** Public website origin (e.g. https://www.mrantidot.com) — used to refresh its cache after admin edits. */
  websiteUrl: (process.env.WEBSITE_URL?.trim() || '').replace(/\/+$/, ''),
  /** Vercel Blob token for durable website media; without it uploads stay on local disk. */
  blobToken: process.env.BLOB_READ_WRITE_TOKEN?.trim() || '',
  /** Cap Mongo connection pool — keeps RAM low on Render free tier (2GB). */
  mongoMaxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE ?? '5', 10),
};
