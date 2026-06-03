import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setUnauthorizedHandler } from '@/lib/api';
import { formatLoginIdentifier } from '@/lib/phone';
import { clearSession, getToken, setToken, setUser, type StoredUser } from '@/lib/storage';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    city?: string;
  }) => Promise<void>;
  otpVerify: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: (options?: { silent?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearSession();
    setUserState(null);
    setTokenState(null);
  }, []);

  const refreshMe = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const { data } = await api.get<{ user: User }>('/auth/me', {
      silent401: silent,
      skipErrorToast: silent,
    });
    await setUser(data.user);
    setUserState(data.user);
  }, []);

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
        if (!storedToken || cancelled) return;
        setTokenState(storedToken);
        await refreshMe({ silent: true });
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
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
        identifier: formatLoginIdentifier(identifier),
        password,
      });
      await persistSession(data.token, data.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      phone: string;
      email: string;
      password: string;
      city?: string;
    }) => {
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>('/auth/register', {
        ...payload,
        phone: formatLoginIdentifier(payload.phone),
        email: payload.email.trim().toLowerCase(),
      });
      await persistSession(data.token, data.user);
    },
    [persistSession],
  );

  const otpVerify = useCallback(
    async (phone: string, code: string) => {
      await clearSession();
      setUserState(null);
      setTokenState(null);

      const { data } = await api.post<{ token: string; user: User }>('/auth/otp/verify', {
        phone: formatLoginIdentifier(phone),
        code: code.trim(),
      });
      await persistSession(data.token, data.user);
    },
    [persistSession],
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
