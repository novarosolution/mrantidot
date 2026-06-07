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
} as const;

type CacheEntry = { data: unknown; at: number };

const store = new Map<string, CacheEntry>();

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

export function readApiCache<T>(key: string, ttlMs: number): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return hit.data as T;
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
}
