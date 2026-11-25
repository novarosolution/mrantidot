import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate-limit key: the website's server calls the API for all of its visitors, so when it proves
 * itself with X-Website-Key we key by the visitor IP it forwards; everyone else by their own IP.
 */
export function rateLimitKey(req: Request): string {
  if (env.websiteApiKey && req.get('x-website-key') === env.websiteApiKey) {
    const visitor = req.get('x-client-ip')?.split(',')[0]?.trim();
    if (visitor) return `web:${ipKeyGenerator(visitor)}`;
    return 'web:anonymous';
  }
  return ipKeyGenerator(req.ip ?? 'unknown');
}
