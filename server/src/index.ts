import fs from 'fs';
import './types/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { connectDb, disconnectDb, isDbConnected } from './config/db';
import { env } from './config/env';
import { assertDistBuilt, validateProductionEnv } from './config/validateEnv';
import { errorHandler } from './middleware/error';
import { apiRouter } from './routes';
import { getAdminConfig, upsertAdminUser } from './utils/adminUser';

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

  if (env.ensureAdminOnStartup) {
    await upsertAdminUser();
    const admin = getAdminConfig();
    console.log(`[admin] Synced to database — ${admin.email} (phone ${admin.phone})`);
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
  app.use(cors({ origin: env.clientUrl || '*' }));
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

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      db: isDbConnected() ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);
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
