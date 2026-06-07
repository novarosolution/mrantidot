import mongoose from 'mongoose';
import { env } from './env';
import { assertValidMongoUri } from './validateEnv';

function parseMongoTarget(uri: string): { host: string; dbName: string } {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.replace(/^\//, '') || 'test';
    return { host: url.host, dbName };
  } catch {
    return { host: uri, dbName: 'unknown' };
  }
}

export async function connectDb(): Promise<void> {
  const uri = env.mongoUri;
  assertValidMongoUri(uri);
  const { host, dbName } = parseMongoTarget(uri);

  mongoose.set('strictQuery', true);

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[db] Connection failed — host=${host} db=${dbName}: ${message}`);
    if (env.isProduction) {
      console.error(
        '\nProduction: set MONGO_URI to MongoDB Atlas (no "." in database name).\n' +
          'Render → Environment → MONGO_URI\n',
      );
    } else {
      console.error(
        '\nStart MongoDB locally:\n  brew services start mongodb-community\n',
      );
    }
    throw err;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
