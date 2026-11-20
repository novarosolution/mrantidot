import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';
import { env } from '../config/env';
import { AppError } from './AppError';

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/** One website photo per request, kept in memory (the app resizes to ~1600px before sending). */
export const websiteImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (TYPES[file.mimetype]) cb(null, true);
    else cb(new AppError(400, 'Use a JPG, PNG, WebP or AVIF photo (HEIC is not supported by browsers).'));
  },
}).single('photo');

/**
 * Stores a website photo: Vercel Blob (https + CDN, survives redeploys) when a token is set,
 * otherwise the local uploads folder (development).
 */
export async function storeWebsiteImage(file: Express.Multer.File): Promise<{ url: string; pathname: string }> {
  const ext = TYPES[file.mimetype];
  if (!ext) throw new AppError(400, 'Unsupported image type');
  const month = new Date().toISOString().slice(0, 7);
  const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
  if (env.blobToken) {
    const blob = await put(`website/${month}/${name}`, file.buffer, {
      access: 'public',
      token: env.blobToken,
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return { url: blob.url, pathname: blob.pathname };
  }
  const filename = `website-${name}`;
  await fs.mkdir(env.uploadDir, { recursive: true });
  await fs.writeFile(path.join(env.uploadDir, filename), file.buffer);
  return { url: `/uploads/${filename}`, pathname: filename };
}
