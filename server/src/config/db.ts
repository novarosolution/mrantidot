import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';
import { assertValidMongoUri } from './validateEnv';

let memoryServer: MongoMemoryServer | null = null;

function parseMongoTarget(uri: string): { host: string; dbName: string } {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.replace(/^\//, '') || 'test';
    return { host: url.host, dbName };
  } catch {
    return { host: uri, dbName: 'unknown' };
  }
}

let usingMemoryMongo = false;

function wantsMemoryMongo(): boolean {
  const flag = process.env.USE_MEMORY_MONGO?.trim().toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'yes') return true;
  const uri = (process.env.MONGO_URI ?? env.mongoUri).trim().toLowerCase();
  return uri === 'memory' || uri === 'mongodb-memory';
}

/** True when this process is backed by mongodb-memory-server. */
export function isUsingMemoryMongo(): boolean {
  return usingMemoryMongo;
}

async function startMemoryMongo(): Promise<string> {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: 'mrantidot-v2' },
  });
  const uri = memoryServer.getUri('mrantidot-v2');
  process.env.MONGO_URI = uri;
  usingMemoryMongo = true;
  return uri;
}

async function connectWithUri(uri: string): Promise<void> {
  assertValidMongoUri(uri);
  const { host, dbName } = parseMongoTarget(uri);
  await mongoose.connect(uri, {
    maxPoolSize: env.mongoMaxPoolSize,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 15_000,
    socketTimeoutMS: 45_000,
    maxIdleTimeMS: 30_000,
  });
  console.log(
    `[db] Connected — host=${host} db=${dbName} pool=${env.mongoMaxPoolSize}`,
  );
}

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);

  if (!env.isProduction && wantsMemoryMongo()) {
    const uri = await startMemoryMongo();
    console.log('[db] Using in-memory MongoDB (USE_MEMORY_MONGO / MONGO_URI=memory)');
    await connectWithUri(uri);
    return;
  }

  const uri = env.mongoUri;
  const { host, dbName } = parseMongoTarget(uri);

  try {
    await connectWithUri(uri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[db] Connection failed — host=${host} db=${dbName}: ${message}`);

    if (env.isProduction) {
      console.error(
        '\nProduction: set MONGO_URI to MongoDB Atlas (no "." in database name).\n' +
          'Render → Environment → MONGO_URI\n',
      );
      throw err;
    }

    // Local Mongo not installed/running — only fall back to memory if allowed.
    const isRefused =
      /ECONNREFUSED/i.test(message) ||
      /Server selection timed out/i.test(message) ||
      /failed to connect/i.test(message);

    const allowMemoryFallback =
      process.env.ALLOW_MEMORY_FALLBACK?.trim().toLowerCase() === 'true' ||
      process.env.ALLOW_MEMORY_FALLBACK?.trim() === '1';

    if (!isRefused) throw err;

    if (!allowMemoryFallback) {
      console.error(
        '\nMongoDB connection failed. Fix MONGO_URI in server/.env (Atlas or local).\n' +
          'In-memory fallback is disabled so demo data is not used by accident.\n' +
          'To allow temporary in-memory DB: set ALLOW_MEMORY_FALLBACK=true\n',
      );
      throw err;
    }

    console.warn(
      '[db] Local MongoDB unavailable — starting in-memory MongoDB (ALLOW_MEMORY_FALLBACK=true).\n' +
        '     Data is wiped when the server stops.',
    );
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      const memoryUri = await startMemoryMongo();
      await connectWithUri(memoryUri);
    } catch (memoryErr) {
      console.error('[db] In-memory MongoDB also failed to start:', memoryErr);
      console.error(
        '\nStart MongoDB locally:\n  brew services start mongodb-community\n' +
          'Or set MONGO_URI to a MongoDB Atlas connection string in server/.env\n',
      );
      throw memoryErr;
    }
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
