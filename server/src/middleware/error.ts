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

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, `Invalid ${err.path}: "${err.value}"`, 'BAD_REQUEST');
    return;
  }

  // Duplicate key (unique index) errors surface as plain MongoServerError, not AppError.
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : undefined;
    sendError(res, 409, field ? `${field} already in use` : 'Duplicate value', 'CONFLICT');
    return;
  }

  // Malformed ObjectId strings passed straight to `new Types.ObjectId()` throw BSONError,
  // not a Mongoose CastError — treat the same way (bad input, not a server fault).
  if (err instanceof Error && err.name === 'BSONError') {
    sendError(res, 400, 'Invalid identifier', 'BAD_REQUEST');
    return;
  }

  console.error('[error]', err);
  sendError(res, 500, 'Internal server error', 'INTERNAL');
}
