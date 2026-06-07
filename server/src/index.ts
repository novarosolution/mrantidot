import fs from 'fs';
import './types/express';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
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
  app.use(cors({ origin: env.clientUrl || '*' }));
  if (!env.isProduction) {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(env.uploadDir), { maxAge: env.isProduction ? '1d' : 0 }));

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
