/** In-memory GET cache TTLs (ms). */
export const CACHE_TTL = {
  content: 5 * 60 * 1000,
  services: 90 * 1000,
  notifications: 45 * 1000,
  bookingsList: 30 * 1000,
  bookingDetail: 15 * 1000,
  stats: 30 * 1000,
  profile: 60 * 1000,
  addresses: 2 * 60 * 1000,
  offers: 5 * 60 * 1000,
  paymentMethods: 2 * 60 * 1000,
  adminLists: 30 * 1000,
} as const;

type CacheEntry = { data: unknown; at: number };

const store = new Map<string, CacheEntry>();

/** Keep stale entries up to this multiple of TTL for SWR. */
const STALE_MULTIPLIER = 3;

function stableParams(params: unknown): string {
  if (!params || typeof params !== 'object') return '';
  const entries = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function apiCacheKey(method: string, url: string, params?: unknown): string {
  return `${method}:${url}?${stableParams(params)}`;
}

export type ApiCacheRead<T> = { data: T; stale: boolean };

/** Fresh or soft-stale hit. Hard-expired entries are removed. */
export function readApiCacheEntry<T>(key: string, ttlMs: number): ApiCacheRead<T> | null {
  const hit = store.get(key);
  if (!hit) return null;
  const age = Date.now() - hit.at;
  if (age > ttlMs * STALE_MULTIPLIER) {
    store.delete(key);
    return null;
  }
  return { data: hit.data as T, stale: age > ttlMs };
}

/** Fresh-only read (legacy). Prefer readApiCacheEntry for SWR. */
export function readApiCache<T>(key: string, ttlMs: number): T | null {
  const entry = readApiCacheEntry<T>(key, ttlMs);
  if (!entry || entry.stale) return null;
  return entry.data;
}

export function writeApiCache(key: string, data: unknown): void {
  store.set(key, { data, at: Date.now() });
}

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.includes(prefix)) store.delete(key);
  }
}

export function invalidateAfterMutation(url: string): void {
  if (url.includes('/bookings')) {
    clearApiCache('/bookings');
    clearApiCache('/stats');
  }
  if (url.includes('/services')) clearApiCache('/services');
  if (url.includes('/attendance')) {
    clearApiCache('/attendance');
    clearApiCache('/stats/technician');
  }
  if (url.includes('/notifications')) clearApiCache('/notifications');
  if (url.includes('/content')) clearApiCache('/content');
  if (url.includes('/addresses')) clearApiCache('/addresses');
  if (url.includes('/payment-methods')) clearApiCache('/payment-methods');
  if (url.includes('/offers')) clearApiCache('/offers');
  if (url.includes('/admin/users')) clearApiCache('/admin/users');
  if (url.includes('/admin/reviews')) clearApiCache('/admin/reviews');
}
