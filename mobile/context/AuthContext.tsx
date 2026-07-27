import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { api, clearApiCache, setUnauthorizedHandler } from '@/lib/api';
import { config } from '@/lib/config';
import { normalizeLoginEmail } from '@/lib/email';
import { formatLoginIdentifier } from '@/lib/phone';
import { clearSession, getToken, getUser, setToken, setUser, type StoredUser } from '@/lib/storage';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    city?: string;
  }) => Promise<User>;
  otpVerify: (phone: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: (options?: { silent?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Strip zero-width / BOM chars that mobile keyboards sometimes insert. */
function cleanAuthText(value: string): string {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authEpoch = useRef(0);
  const loginInFlight = useRef(0);

  const bumpEpoch = useCallback(() => {
    authEpoch.current += 1;
    return authEpoch.current;
  }, []);

  const persistSession = useCallback(async (sessionToken: string, sessionUser: User) => {
    await setToken(sessionToken);
    await setUser(sessionUser);
    setTokenState(sessionToken);
    setUserState(sessionUser);
  }, []);

  const logout = useCallback(async () => {
    // Don't wipe a login that just succeeded.
    if (loginInFlight.current > 0) return;
    bumpEpoch();
    clearApiCache();
    await clearSession();
    setUserState(null);
    setTokenState(null);
  }, [bumpEpoch]);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    const epoch = authEpoch.current;
    const silent = options?.silent === true;
    const tokenAtStart = await getToken();
    if (!tokenAtStart) return;

    try {
      const { data } = await api.get<{ user: User }>('/auth/me', {
        silent401: silent,
        skipErrorToast: silent,
      });
      if (epoch !== authEpoch.current) return;
      if (loginInFlight.current > 0) return;
      await setUser(data.user);
      setUserState(data.user);
    } catch (err) {
      if (epoch !== authEpoch.current) return;
      if (loginInFlight.current > 0) return;
      const stillCurrent = (await getToken()) === tokenAtStart;
      if (!stillCurrent) return;

      // Only clear session on confirmed auth failure — keep session on network/5xx.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        await logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [storedToken, storedUser] = await Promise.all([getToken(), getUser()]);
        if (cancelled) return;
        if (storedToken) {
          setTokenState(storedToken);
          if (storedUser) setUserState(storedUser);
          await refreshMe({ silent: true });
        }
      } catch {
        // Keep any hydrated session; interceptor handles real 401s.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      loginInFlight.current += 1;
      try {
        const { data } = await api.post<{ token: string; user: User }>(
          '/auth/login',
          {
            identifier: formatLoginIdentifier(cleanAuthText(identifier)),
            password: cleanAuthText(password),
          },
          { skipErrorToast: true },
        );
        if (!data?.token || !data?.user?.id || !data?.user?.role) {
          throw new Error(`Login response invalid — API at ${config.apiUrl} may be misconfigured.`);
        }

        // Always persist a successful login (do not skip on epoch races).
        bumpEpoch();
        await persistSession(data.token, data.user);
        clearApiCache();
        return data.user;
      } finally {
        loginInFlight.current = Math.max(0, loginInFlight.current - 1);
      }
    },
    [bumpEpoch, persistSession],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      phone: string;
      email: string;
      password: string;
      city?: string;
    }) => {
      loginInFlight.current += 1;
      try {
        const { data } = await api.post<{ token: string; user: User }>('/auth/register', {
          ...payload,
          phone: formatLoginIdentifier(cleanAuthText(payload.phone)),
          email: normalizeLoginEmail(cleanAuthText(payload.email)),
          password: cleanAuthText(payload.password),
        }, { skipErrorToast: true });
        if (!data?.token || !data?.user?.id) {
          throw new Error('Register response invalid');
        }
        bumpEpoch();
        await persistSession(data.token, data.user);
        clearApiCache();
        return data.user;
      } finally {
        loginInFlight.current = Math.max(0, loginInFlight.current - 1);
      }
    },
    [bumpEpoch, persistSession],
  );

  const otpVerify = useCallback(
    async (phone: string, code: string) => {
      loginInFlight.current += 1;
      try {
        const { data } = await api.post<{ token: string; user: User }>('/auth/otp/verify', {
          phone: formatLoginIdentifier(cleanAuthText(phone)),
          code: cleanAuthText(code),
        }, { skipErrorToast: true });
        if (!data?.token || !data?.user?.id) {
          throw new Error('OTP response invalid');
        }
        bumpEpoch();
        await persistSession(data.token, data.user);
        clearApiCache();
        return data.user;
      } finally {
        loginInFlight.current = Math.max(0, loginInFlight.current - 1);
      }
    },
    [bumpEpoch, persistSession],
  );

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, otpVerify, logout, refreshMe }),
    [user, token, isLoading, login, register, otpVerify, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
