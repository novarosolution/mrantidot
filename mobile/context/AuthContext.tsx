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
import { api, clearApiCache, setUnauthorizedHandler } from '@/lib/api';
import { normalizeLoginEmail } from '@/lib/email';
import { formatLoginIdentifier } from '@/lib/phone';
import { clearSession, getToken, setToken, setUser, type StoredUser } from '@/lib/storage';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authEpoch = useRef(0);

  const bumpEpoch = useCallback(() => {
    authEpoch.current += 1;
    return authEpoch.current;
  }, []);

  const logout = useCallback(async () => {
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
      await setUser(data.user);
      setUserState(data.user);
    } catch {
      if (epoch !== authEpoch.current) return;
      const stillCurrent = (await getToken()) === tokenAtStart;
      if (!stillCurrent) return;
      await logout();
    }
  }, [logout]);

  const persistSession = useCallback(async (sessionToken: string, sessionUser: User) => {
    await setToken(sessionToken);
    await setUser(sessionUser);
    setTokenState(sessionToken);
    setUserState(sessionUser);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const storedToken = await getToken();
        if (cancelled) return;
        if (storedToken) {
          setTokenState(storedToken);
          await refreshMe({ silent: true });
        }
      } catch {
        if (!cancelled) await logout();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [logout, refreshMe]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const epoch = bumpEpoch();
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>(
        '/auth/login',
        {
          identifier: formatLoginIdentifier(identifier),
          password: password.trim(),
        },
        { skipErrorToast: true },
      );
      if (epoch !== authEpoch.current) return data.user;

      await persistSession(data.token, data.user);
      clearApiCache();
      return data.user;
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
      const epoch = bumpEpoch();
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>('/auth/register', {
        ...payload,
        phone: formatLoginIdentifier(payload.phone),
        email: normalizeLoginEmail(payload.email),
      });
      if (epoch !== authEpoch.current) return data.user;

      await persistSession(data.token, data.user);
      clearApiCache();
      return data.user;
    },
    [bumpEpoch, persistSession],
  );

  const otpVerify = useCallback(
    async (phone: string, code: string) => {
      const epoch = bumpEpoch();
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>('/auth/otp/verify', {
        phone: formatLoginIdentifier(phone),
        code: code.trim(),
      });
      if (epoch !== authEpoch.current) return data.user;

      await persistSession(data.token, data.user);
      clearApiCache();
      return data.user;
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
