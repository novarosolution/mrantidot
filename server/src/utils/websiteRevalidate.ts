import { env } from '../config/env';

/**
 * Tells the public website to drop its cached copy of some data right away (it would otherwise
 * refresh within a minute). Fire-and-forget: a slow or missing website never blocks an admin save.
 */
export function revalidateWebsite(tags: string[]): void {
  if (!env.websiteUrl || !env.websiteApiKey || tags.length === 0) return;
  void fetch(`${env.websiteUrl}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-website-key': env.websiteApiKey },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(3000),
  }).catch((err: unknown) => {
    console.warn('[website] revalidate failed:', err instanceof Error ? err.message : err);
  });
}
