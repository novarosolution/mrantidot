import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const MAX_SIZE = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
  'image/tiff': '.tiff',
  'image/svg+xml': '.svg',
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|tiff?|svg)$/i;

function isImageFile(file: Express.Multer.File): boolean {
  const mime = file.mimetype?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) return true;
  return IMAGE_EXT.test(file.originalname);
}

function safeExtension(file: Express.Multer.File): string {
  const mime = file.mimetype?.toLowerCase() ?? '';
  const fromMime = EXT_BY_MIME[mime];
  if (fromMime) return fromMime;
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext && IMAGE_EXT.test(ext)) return ext;
  return '.jpg';
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeExt = safeExtension(file);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (isImageFile(file)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only image files are allowed (no documents, video, or other types)'));
}

export const uploadImages = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
}).fields([
  { name: 'photos', maxCount: 10 },
  { name: 'photo', maxCount: 10 },
  { name: 'images', maxCount: 10 },
]);

export function filesToUrls(files: Express.Multer.File[] | undefined): string[] {
  if (!files?.length) return [];
  return files.map((f) => `/uploads/${f.filename}`);
}
