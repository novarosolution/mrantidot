import '../types/express';
import { NextFunction, Request, Response } from 'express';
import { User, type UserRole } from '../models/User';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/token';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  void (async () => {
    try {
      const token = header.slice(7);
      const payload = verifyToken(token);
      const user = await User.findById(payload.id).select('role disabled');
      if (!user || user.disabled === true) {
        next(new AppError(401, 'Invalid or expired token'));
        return;
      }
      // Always use current role from DB — JWT role can be stale after demotion.
      req.user = { id: user._id.toString(), role: user.role as UserRole };
      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      next(new AppError(401, 'Invalid or expired token'));
    }
  })();
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
