import '../types/express';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/token';
import type { UserRole } from '../models/User';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role as UserRole };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
}
