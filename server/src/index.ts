import fs from 'fs';
import './types/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { connectDb, disconnectDb, isDbConnected, isPersistentLocalDb, isUsingMemoryMongo } from './config/db';
import { User } from './models/User';
import { env } from './config/env';
import { assertDistBuilt, validateProductionEnv } from './config/validateEnv';
import { errorHandler } from './middleware/error';
import { apiRouter } from './routes';
import { runSeedDatabase } from './seed/seed';
import { getAdminConfig, upsertAdminUser } from './utils/adminUser';
import { backfillServiceContent } from './utils/backfillServiceContent';
import { backfillSupportContact } from './utils/backfillSupportContact';

function ensureUploadDir(): void {
  if (!fs.existsSync(env.uploadDir)) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
  }
}

async function main(): Promise<void> {
  validateProductionEnv();
  assertDistBuilt();
  ensureUploadDir();
  await connectDb();

  const seedMode = process.env.SEED_ON_START?.trim().toLowerCase() ?? '';
  const alwaysSeed = seedMode === 'true' || seedMode === '1';
  // The seed deletes non-demo users and refreshes bookings, so on a database that keeps
  // its data it must only run when there is nothing to lose.
  const seedOnStart = alwaysSeed || (seedMode === 'if-empty' && (await User.estimatedDocumentCount()) === 0);

  if (alwaysSeed && isPersistentLocalDb()) {
    console.warn('[seed] SEED_ON_START=true resets demo data on every start — use SEED_ON_START=if-empty to keep your data.');
  }

  if (seedOnStart) {
    console.log(`[seed] SEED_ON_START=${seedMode} — loading seed data into connected database…`);
    await runSeedDatabase();
  } else if (seedMode === 'if-empty') {
    console.log('[seed] Database already has data — skipping demo seed');
  } else if (isUsingMemoryMongo()) {
    console.warn(
      '[db] In-memory MongoDB is empty. Set MONGO_URI to your Atlas/local DB in server/.env, ' +
        'or set SEED_ON_START=true only if you intentionally want demo data.',
    );
  }

  try {
    await backfillServiceContent();
  } catch (err) {
    console.error('[services] Starter content backfill failed:', err);
  }

  try {
    await backfillSupportContact();
  } catch (err) {
    console.error('[content] Support contact fix failed:', err);
  }

  if (env.ensureAdminOnStartup && !seedOnStart) {
    try {
      await upsertAdminUser();
      const admin = getAdminConfig();
      console.log(`[admin] Synced to database — ${admin.email} (phone ${admin.phone})`);
    } catch (err) {
      console.error('[admin] Failed to sync admin user on startup:', err);
      throw err;
    }
  } else if (env.ensureAdminOnStartup && seedOnStart) {
    // Seed already upserts admin
    const admin = getAdminConfig();
    console.log(`[admin] Present from seed — ${admin.email} (phone ${admin.phone})`);
  }

  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      // JSON API + mobile-consumed static images — CSP/COEP are for browser pages, not needed here
      // and would otherwise complicate cross-origin loading of uploaded photos.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  const corsOrigins = env.clientUrl.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: corsOrigins.includes('*') ? '*' : corsOrigins }));
  if (!env.isProduction) {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(env.uploadDir), { maxAge: env.isProduction ? '1d' : 0 }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isProduction ? 30 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
  });
  app.use('/api/auth', authLimiter);
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.isProduction ? 300 : 5000,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health',
      message: { error: 'Too many requests. Please slow down and try again.' },
    }),
  );

  app.get('/api/health', (_req, res) => {
    const connected = isDbConnected();
    res.status(connected ? 200 : 503).json({
      ok: connected,
      db: connected ? 'connected' : 'disconnected',
      dbMode: isUsingMemoryMongo() ? (isPersistentLocalDb() ? 'local' : 'memory') : 'atlas',
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
  });
  app.use(errorHandler);

  const server = app.listen(env.port, '0.0.0.0', () => {
    const mem = process.memoryUsage();
    console.log(
      `[server] API on :${env.port} (${env.isProduction ? 'production' : 'development'}) ` +
        `heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    );
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[server] Port ${env.port} is already in use. Stop the other process (lsof -i :${env.port}) or set PORT in server/.env`,
      );
      process.exit(1);
    }
    throw err;
  });

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} — shutting down`);
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
