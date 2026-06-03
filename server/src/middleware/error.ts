import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function sendError(res: Response, status: number, message: string, code?: string): void {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;
  res.status(status).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const code =
      err.code ??
      (err.statusCode === 404 ? 'NOT_FOUND' : err.statusCode === 400 ? 'BAD_REQUEST' : undefined);
    sendError(res, err.statusCode, err.message, code);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0]?.message;
    sendError(res, 400, first ?? 'Validation failed', 'VALIDATION');
    return;
  }

  console.error('[error]', err);
  sendError(res, 500, 'Internal server error', 'INTERNAL');
}
