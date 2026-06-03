import { Request } from 'express';
import { verifyToken } from './token';

export function getOptionalUser(req: Request): { id: string; role: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(header.slice(7));
  } catch {
    return null;
  }
}
