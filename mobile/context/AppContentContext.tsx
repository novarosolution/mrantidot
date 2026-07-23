import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import {
  DEFAULT_APP_CONFIG,
  mergeAppConfig,
  mergeHomeConfig,
  mergeHomePromo,
} from '@/lib/mergeHomeConfig';
import type { AppConfig, HomeConfig, HomePromo } from '@/types/api';

export { DEFAULT_APP_CONFIG };

interface AppContentValue {
  content: AppConfig;
  homeConfig: HomeConfig;
  homePromo: HomePromo;
  loaded: boolean;
  refresh: () => Promise<void>;
  refreshHome: () => Promise<void>;
}

const AppContentCtx = createContext<AppContentValue | null>(null);

export function AppContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() => mergeHomeConfig(null));
  const [homePromo, setHomePromo] = useState<HomePromo>(() => mergeHomePromo(null));
  const [loaded, setLoaded] = useState(false);

  const refreshHome = useCallback(async () => {
    try {
      const { data } = await api.get<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/home', {
        skipErrorToast: true,
        silent401: true,
        cacheTtlMs: CACHE_TTL.content,
      });
      if (data) {
        setHomePromo(mergeHomePromo(data.promo));
        setHomeConfig(mergeHomeConfig(data.homeConfig));
      }
    } catch {
      // keep defaults
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [appRes, homeRes] = await Promise.allSettled([
        api.get<{ app: AppConfig }>('/content/app', {
          skipErrorToast: true,
          silent401: true,
          cacheTtlMs: CACHE_TTL.content,
        }),
        api.get<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/home', {
          skipErrorToast: true,
          silent401: true,
          cacheTtlMs: CACHE_TTL.content,
        }),
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data?.app) {
        setContent(mergeAppConfig(appRes.value.data.app));
      }
      if (homeRes.status === 'fulfilled' && homeRes.value.data) {
        setHomePromo(mergeHomePromo(homeRes.value.data.promo));
        setHomeConfig(mergeHomeConfig(homeRes.value.data.homeConfig));
      }
    } catch {
      // keep defaults on failure
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ content, homeConfig, homePromo, loaded, refresh, refreshHome }),
    [content, homeConfig, homePromo, loaded, refresh, refreshHome],
  );
  return <AppContentCtx.Provider value={value}>{children}</AppContentCtx.Provider>;
}

export function useAppContent(): AppContentValue {
  const ctx = useContext(AppContentCtx);
  if (!ctx) throw new Error('useAppContent must be used within AppContentProvider');
  return ctx;
}

/** Home CMS only — same provider, narrower destructuring helper. */
export function useHomeContent() {
  const { homeConfig, homePromo, refreshHome, loaded } = useAppContent();
  return { homeConfig, homePromo, refreshHome, loaded };
}
