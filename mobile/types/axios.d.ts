import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Suppress session-expired toast (e.g. stale token check on app launch). */
    silent401?: boolean;
    /** Suppress global error toast; screen shows ListEmptyRetry instead. */
    skipErrorToast?: boolean;
    /** Cache GET response in memory for this many ms. */
    cacheTtlMs?: number;
    /** Skip reading/writing GET cache for this request. */
    skipCache?: boolean;
  }

  export interface AxiosResponse<T = unknown> {
    data: T;
  }
}

export interface ApiErrorBody {
  error: string;
  code?: string;
}
