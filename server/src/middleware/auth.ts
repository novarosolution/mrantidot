import '../types/express';
import { NextFunction, Request, Response } from 'express';
import { User, type UserRole } from '../models/User';
import { AppError } from '../utils/AppError';
import { verifyToken, type TokenPayload } from '../utils/token';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    // Bad signature, expired or malformed token — the app should sign in again.
    next(new AppError(401, 'Invalid or expired token'));
    return;
  }

  void (async () => {
    try {
      const user = await User.findById(payload.id).select('role disabled');
      if (!user || user.disabled === true) {
        next(new AppError(401, 'Invalid or expired token'));
        return;
      }
      // Always use current role from DB — JWT role can be stale after demotion.
      req.user = { id: user._id.toString(), role: user.role as UserRole };
      next();
    } catch (err) {
      // A token whose id isn't a valid ObjectId can't belong to anyone.
      if (err instanceof Error && err.name === 'CastError') {
        next(new AppError(401, 'Invalid or expired token'));
        return;
      }
      // Database not reachable (server restarting, network blip…). That's not the user's fault, so
      // never answer 401 here: the apps sign out on 401 and would throw away a good session.
      next(new AppError(503, 'Service is restarting — please try again in a moment.', 'SERVICE_UNAVAILABLE'));
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
