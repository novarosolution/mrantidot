import type { AxiosRequestConfig } from 'axios';
import { api } from '@/lib/api';
import { apiCacheKey, readApiCacheEntry, writeApiCache } from '@/lib/apiCache';

/**
 * GET through the shared in-memory API cache (`lib/apiCache`): a fresh entry is returned without a
 * request, otherwise the API is called and the answer stored. Mutations already clear the matching
 * entries (`invalidateAfterMutation` in the API client), so saved addresses / payments / bookings
 * never come back stale after a change. Pass `force` for pull-to-refresh.
 */
export async function cachedGet<T>(
  url: string,
  ttlMs: number,
  config: AxiosRequestConfig & { force?: boolean } = {},
): Promise<T> {
  const { force, ...axiosConfig } = config;
  const key = apiCacheKey('GET', url, axiosConfig.params);
  if (!force) {
    const hit = readApiCacheEntry<T>(key, ttlMs);
    if (hit && !hit.stale) return hit.data;
  }
  const { data } = await api.get<T>(url, axiosConfig);
  writeApiCache(key, data);
  return data;
}
