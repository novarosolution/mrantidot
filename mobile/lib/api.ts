import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { appToast } from '@/lib/toast';
import { clearApiCache, invalidateAfterMutation } from '@/lib/apiCache';
import { config } from './config';
import { clearSession, getToken } from './storage';
import type { ApiErrorBody } from '@/types/axios';

/** Single shared Axios client — every app request goes through this instance. */
export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  transitional: { clarifyTimeoutError: true },
});

// Prefer fetch adapter in Expo Go (cleartext HTTP is more reliable than XHR).
if (typeof fetch === 'function') {
  try {
    api.defaults.adapter = 'fetch';
  } catch {
    // keep default adapter
  }
}

/** Pass on GETs inside useScreenLoad to avoid duplicate toast + inline retry. */
export const screenLoadConfig: AxiosRequestConfig = { skipErrorToast: true };

let onUnauthorized: (() => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

const AUTH_ATTEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/otp/send', '/auth/otp/verify'];

function isAuthAttempt(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ATTEMPT_PATHS.some((path) => url.includes(path));
}

function bearerToken(reqConfig: AxiosRequestConfig | undefined): string | null {
  const header = reqConfig?.headers?.Authorization;
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

function looksLikeHtml(body: unknown): boolean {
  if (typeof body !== 'string') return false;
  const sample = body.slice(0, 200).toLowerCase();
  return sample.includes('<!doctype') || sample.includes('<html') || sample.includes('service suspended');
}

function requestUrl(error: AxiosError): string {
  try {
    if (error.config) return axios.getUri(error.config);
  } catch {
    // ignore
  }
  const base = error.config?.baseURL ?? `${config.apiUrl}/api`;
  const path = error.config?.url ?? '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Human + machine-readable network / HTTP errors for login + toasts. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const body = error.response?.data;
  if (body && typeof body === 'object' && 'error' in body) {
    const msg = (body as ApiErrorBody).error;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  if (looksLikeHtml(body)) {
    return `API returned HTML instead of JSON (${config.apiUrl})`;
  }

  const status = error.response?.status;
  if (status != null) {
    if (status === 401) return 'Invalid credentials';
    if (status === 403) return '403 Forbidden';
    if (status === 404) return '404 Not Found';
    if (status === 408) return '408 Request Timeout';
    if (status === 422) return 'Please check your input and try again.';
    if (status === 429) return 'Too many attempts. Try again later.';
    if (status === 500) return '500 Internal Server Error';
    if (status === 502) return '502 Bad Gateway';
    if (status === 503) return '503 Service Unavailable';
    if (status === 504) return '504 Gateway Timeout';
    if (status >= 500) return `${status} Server Error`;
    return `${status} ${error.response?.statusText || error.message}`.trim();
  }

  const code = error.code ?? 'NETWORK_ERROR';
  const msg = error.message || 'Network request failed';

  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
    return `Timeout (${code}) — ${config.apiUrl}`;
  }
  if (code === 'ECONNREFUSED') {
    return `ECONNREFUSED — ${config.apiUrl}`;
  }
  if (code === 'ENOTFOUND') {
    return `ENOTFOUND — DNS failed for ${config.apiUrl}`;
  }
  if (code === 'ERR_NETWORK' || /network request failed/i.test(msg)) {
    return `Network request failed (${code}) — ${config.apiUrl}`;
  }

  return `${code}: ${msg}`;
}

export function setUnauthorizedHandler(handler: () => void | Promise<void>): void {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (req) => {
  // Always pin to resolved config (never a stale / localhost baseURL).
  req.baseURL = `${config.apiUrl}/api`;

  const url = req.url ?? '';
  const isPublicAuth = isAuthAttempt(url);
  const token = isPublicAuth ? null : await getToken();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  } else {
    delete req.headers.Authorization;
  }

  if (typeof FormData !== 'undefined' && req.data instanceof FormData) {
    const headers = req.headers as { delete?: (name: string) => void } & Record<string, unknown>;
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
  }

  try {
    const fullUrl = axios.getUri(req);
    console.log('[api→]', (req.method ?? 'GET').toUpperCase(), fullUrl);
  } catch {
    console.log('[api→]', (req.method ?? 'GET').toUpperCase(), req.baseURL, req.url);
  }

  return req;
});

api.interceptors.response.use(
  (res) => {
    console.log('[api←]', res.status, {
      url: axios.getUri(res.config),
      headers: res.headers,
      body: res.data,
    });

    const method = res.config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      invalidateAfterMutation(res.config.url ?? '');
    }
    return res;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const url = requestUrl(error);
    console.error('[api←ERR]', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      url,
      status: error.response?.status,
      body: error.response?.data,
    });

    const message = getApiErrorMessage(error);
    const silent401 = error.config?.silent401 === true;
    const skipToast = error.config?.skipErrorToast === true;
    const path = error.config?.url ?? '';
    const status = error.response?.status;
    const showToast = shouldShowToast(error, silent401, skipToast);

    if (status === 404 && error.config?.method?.toUpperCase() === 'GET' && path.includes('/services')) {
      clearApiCache('/services');
    }

    if (status === 401) {
      if (isAuthAttempt(path)) {
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
        appToast.offline(error.code ?? 'NETWORK_ERROR', message);
      }
    }

    return Promise.reject(error);
  },
);

/** Health check via the same axios instance (never a second client). */
export async function checkHealth(): Promise<{
  ok: boolean;
  db: string;
  dbMode?: string;
}> {
  const { data } = await api.get<{ ok: boolean; db: string; dbMode?: string }>('/health', {
    skipErrorToast: true,
    timeout: 15000,
  });
  if (looksLikeHtml(data)) {
    throw new Error(`API returned HTML (${config.apiUrl})`);
  }
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
