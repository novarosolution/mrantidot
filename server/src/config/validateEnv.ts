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

export function validateProductionEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) return;

  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is required in production. On Render: Environment → add MONGO_URI (MongoDB Atlas connection string).',
    );
  }
  assertValidMongoUri(mongoUri);

  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt || jwt === 'supersecret_change_me') {
    throw new Error(
      'Set a strong JWT_SECRET in production (Render Environment or render.yaml generateValue).',
    );
  }
}

export function assertDistBuilt(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const entry = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Missing ${entry}. Run "npm run build" before "npm start" (Render buildCommand: npm install && npm run build).`,
    );
  }
}
