import './config/env';
import './types/express';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { connectDb, isDbConnected } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { apiRouter } from './routes';
import { getAdminConfig, upsertAdminUser } from './utils/adminUser';

async function main(): Promise<void> {
  await connectDb();

  if (env.ensureAdminOnStartup) {
    await upsertAdminUser();
    const admin = getAdminConfig();
    console.log(`[admin] Synced to database — ${admin.email} (phone ${admin.phone})`);
  }

  const app = express();

  app.use(cors({ origin: env.clientUrl || '*' }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      db: isDbConnected() ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);

  app.use(errorHandler);

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[server] API on :${env.port}`);
  });
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
