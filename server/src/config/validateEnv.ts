import fs from 'fs';
import path from 'path';

/**
 * Startup checks so production (e.g. Render) fails fast with a clear message
 * instead of exiting with a generic Mongo or missing-file error.
 */
export function parseMongoDbName(uri: string): string | null {
  try {
    const url = new URL(uri);
    const name = url.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0];
    return name || null;
  } catch {
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
    return match?.[1] ?? null;
  }
}

export function assertValidMongoUri(uri: string): void {
  const dbName = parseMongoDbName(uri);
  if (!dbName) {
    throw new Error(
      'MONGO_URI must include a database name, e.g. mongodb+srv://user:pass@host/mrantidot-v2',
    );
  }
  if (dbName.includes('.')) {
    throw new Error(
      `MONGO_URI database name "${dbName}" is invalid: MongoDB names cannot contain ".". Use e.g. mrantidot-v2 instead of mrantidot-2.0`,
    );
  }
}

export function isOnRender(): boolean {
  return Boolean(
    process.env.RENDER ||
      process.env.RENDER_SERVICE_ID ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.RENDER_EXTERNAL_HOSTNAME,
  );
}

function isDevRuntime(): boolean {
  return process.argv.some((arg) => /tsx|ts-node-dev|ts-node/.test(arg));
}

/** In production, replace missing or dev-placeholder JWT so the API can start on Render. */
export function ensureProductionJwt(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const jwt = process.env.JWT_SECRET?.trim();
  if (jwt && jwt !== 'supersecret_change_me') return;

  const seed = [
    process.env.RENDER_SERVICE_ID,
    process.env.RENDER_GIT_COMMIT,
    process.env.RENDER_EXTERNAL_HOSTNAME,
    process.env.HOSTNAME,
  ]
    .filter(Boolean)
    .join('_');

  process.env.JWT_SECRET = `jwt_${seed || 'mrantidot_prod'}`;
  console.warn(
    '[env] JWT_SECRET was unset or placeholder — using auto-generated production secret. ' +
      'Set JWT_SECRET in Render → Environment for a stable value.',
  );
}

/** @deprecated use ensureProductionJwt */
export function ensureJwtSecretForRender(): void {
  ensureProductionJwt();
}

const RENDER_DEPLOY_HELP =
  '\n\n— Render web service settings —\n' +
  '  Build Command: bash render-build.sh\n' +
  '  Start Command:   bash render-start.sh   (NOT npm run dev)\n' +
  '  Environment:     JWT_SECRET, MONGO_URI, NODE_ENV=production\n' +
  '  See server/DEPLOY.md';

export function validateProductionEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) return;

  ensureProductionJwt();

  if (isDevRuntime() && !isOnRender()) {
    throw new Error(
      'Do not use "npm run dev" on Render. Use Start Command: bash render-start.sh or npm start' +
        RENDER_DEPLOY_HELP,
    );
  }

  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is required in production. Render → Environment → add your MongoDB Atlas URI.' +
        RENDER_DEPLOY_HELP,
    );
  }
  assertValidMongoUri(mongoUri);

  ensureProductionJwt();
}

export function assertDistBuilt(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const entry = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(entry) && isOnRender()) {
    return;
  }
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Missing ${entry}. Run "npm run build" before "npm start" (Render buildCommand: bash render-build.sh).`,
    );
  }
}
