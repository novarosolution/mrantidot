import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { appToast } from '@/lib/toast';
import {
  apiCacheKey,
  clearApiCache,
  invalidateAfterMutation,
  readApiCache,
  writeApiCache,
} from '@/lib/apiCache';
import { config } from './config';
import { clearSession, getToken } from './storage';
import type { ApiErrorBody } from '@/types/axios';

export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const nativeGet = api.get.bind(api);

const getWithCache = async function getWithCache<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const ttl = config?.cacheTtlMs;
  if (ttl && !config?.skipCache) {
    const key = apiCacheKey('GET', url, config?.params);
    const cached = readApiCache<T>(key, ttl);
    if (cached !== null) {
      return {
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config ?? {},
      } as AxiosResponse<T>;
    }
  }

  const response = await nativeGet<T>(url, config);
  if (ttl && !config?.skipCache) {
    writeApiCache(apiCacheKey('GET', url, config?.params), response.data);
  }
  return response;
};

api.get = getWithCache as typeof api.get;

/** Pass on GETs inside useScreenLoad to avoid duplicate toast + inline retry. */
export const screenLoadConfig: AxiosRequestConfig = { skipErrorToast: true };

let onUnauthorized: (() => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

const AUTH_ATTEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/otp/send', '/auth/otp/verify'];

function isAuthAttempt(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ATTEMPT_PATHS.some((path) => url.includes(path));
}

function bearerToken(config: AxiosRequestConfig | undefined): string | null {
  const header = config?.headers?.Authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function shouldShowToast(error: AxiosError, silent401: boolean, skipToast: boolean): boolean {
  if (skipToast) return false;
  const status = error.response?.status;
  const url = error.config?.url ?? '';
  if (status === 401) {
    if (isAuthAttempt(url)) return true;
    return !silent401;
  }
  return true;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const body = error.response?.data;
  if (body && typeof body === 'object' && 'error' in body) {
    const msg = (body as ApiErrorBody).error;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  if (!error.response) {
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    return `Cannot reach server. Check API at ${config.apiUrl}`;
  }

  const status = error.response.status;
  if (status === 404) return 'The requested item was not found.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 422) return 'Please check your input and try again.';
  if (status >= 500) return 'Server error. Please try again later.';

  return error.message || fallback;
}

export function setUnauthorizedHandler(handler: () => void | Promise<void>): void {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (req) => {
  const url = req.url ?? '';
  const isPublicAuth = isAuthAttempt(url);
  const token = isPublicAuth ? null : await getToken();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  } else {
    delete req.headers.Authorization;
  }

  return req;
});

api.interceptors.response.use(
  (res) => {
    const method = res.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      invalidateAfterMutation(res.config.url ?? '');
    }
    return res;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const message = getApiErrorMessage(error);
    const silent401 = error.config?.silent401 === true;
    const skipToast = error.config?.skipErrorToast === true;
    const url = error.config?.url ?? '';
    const status = error.response?.status;
    const showToast = shouldShowToast(error, silent401, skipToast);

    if (status === 404 && error.config?.method?.toUpperCase() === 'GET' && url.includes('/services')) {
      clearApiCache('/services');
    }

    if (status === 401) {
      if (isAuthAttempt(url)) {
        if (showToast) appToast.error(message);
        return Promise.reject(error);
      }

      const tokenAtRequest = bearerToken(error.config);
      const currentToken = await getToken();
      if (tokenAtRequest && currentToken && tokenAtRequest !== currentToken) {
        return Promise.reject(error);
      }

      await clearSession();
      if (showToast) {
        appToast.error('Session expired', 'Please sign in again');
      }
      if (onUnauthorized && !handlingUnauthorized) {
        handlingUnauthorized = true;
        try {
          await onUnauthorized();
        } finally {
          handlingUnauthorized = false;
        }
      }
    } else if (showToast) {
      if (status) {
        appToast.error(message);
      } else {
        appToast.offline('Cannot reach server', `Check API at ${config.apiUrl}`);
      }
    }

    return Promise.reject(error);
  },
);

export async function checkHealth(): Promise<{ ok: boolean; db: string }> {
  const { data } = await axios.get(`${config.apiUrl}/api/health`, { timeout: 10000 });
  return data;
}

/** Fire-and-forget async work; prefer useScreenLoad for screen data loads. */
export function safeAsync(
  fn: () => Promise<void>,
  onFinally?: () => void,
  onError?: (message: string) => void,
): void {
  void fn()
    .catch((err) => {
      if (onError) onError(getApiErrorMessage(err));
    })
    .finally(() => onFinally?.());
}

export { clearApiCache } from '@/lib/apiCache';
export { mediaUrl } from './images';
