import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadImages, filesToUrls } from '../middleware/upload';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';

export const uploadRouter = Router();

function collectFiles(req: Request): Express.Multer.File[] {
  const files = req.files as
    | Record<string, Express.Multer.File[]>
    | Express.Multer.File[]
    | undefined;
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
}

function multerMiddleware(req: Request, res: Response, next: NextFunction): void {
  uploadImages(req, res, (err: unknown) => {
    if (err) {
      next(new AppError(400, err instanceof Error ? err.message : 'Upload failed'));
      return;
    }
    next();
  });
}

uploadRouter.post(
  '/',
  requireAuth,
  multerMiddleware,
  asyncHandler(async (req, res) => {
    const uploaded = collectFiles(req);
    if (uploaded.length === 0) {
      throw new AppError(400, 'No images uploaded');
    }
    res.json({ urls: filesToUrls(uploaded) });
  }),
);
