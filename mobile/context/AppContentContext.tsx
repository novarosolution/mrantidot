import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { CACHE_TTL, clearApiCache } from '@/lib/apiCache';
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
  /** True as soon as there is content to show: the last saved copy, or the bundled defaults. */
  loaded: boolean;
  refresh: () => Promise<void>;
  refreshHome: () => Promise<void>;
}

const AppContentCtx = createContext<AppContentValue | null>(null);

/** Last admin content we received, so the next launch paints it at once (no wait on the network). */
const STORE_KEY = '@mrantidot/app-content-v1';
/** First launch only (nothing saved yet): give the API this long before falling back to bundled copy. */
const FIRST_LAUNCH_WAIT_MS = 1500;
/** Admin edits show up when the customer returns to the app — at most once a minute. */
const FOREGROUND_REFRESH_MS = 60_000;

type Saved = { app?: AppConfig | null; promo?: HomePromo | null; homeConfig?: HomeConfig | null };

async function readSaved(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSaved(patch: Saved, base: Saved): Saved {
  const next = { ...base, ...patch };
  void AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => undefined);
  return next;
}

export function AppContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() => mergeHomeConfig(null));
  const [homePromo, setHomePromo] = useState<HomePromo>(() => mergeHomePromo(null));
  const [loaded, setLoaded] = useState(false);
  const saved = useRef<Saved>({});
  /** Set once the network answered — a slower read of the saved copy must not overwrite it. */
  const fresh = useRef(false);

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
        saved.current = writeSaved({ promo: data.promo, homeConfig: data.homeConfig }, saved.current);
      }
    } catch {
      // keep what we have
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

      const patch: Saved = {};
      if (appRes.status === 'fulfilled' && appRes.value.data?.app) {
        setContent(mergeAppConfig(appRes.value.data.app));
        patch.app = appRes.value.data.app;
      }
      if (homeRes.status === 'fulfilled' && homeRes.value.data) {
        setHomePromo(mergeHomePromo(homeRes.value.data.promo));
        setHomeConfig(mergeHomeConfig(homeRes.value.data.homeConfig));
        patch.promo = homeRes.value.data.promo;
        patch.homeConfig = homeRes.value.data.homeConfig;
      }
      if (patch.app || patch.homeConfig) {
        fresh.current = true;
        saved.current = writeSaved(patch, saved.current);
      }
    } catch {
      // keep what we have
    } finally {
      setLoaded(true);
    }
  }, []);

  // Launch: paint the saved copy immediately, then refresh in the background.
  useEffect(() => {
    let alive = true;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    void readSaved().then((s) => {
      if (!alive) return;
      if (s && !fresh.current) {
        saved.current = { ...s, ...saved.current };
        if (s.app) setContent(mergeAppConfig(s.app));
        if (s.homeConfig) setHomeConfig(mergeHomeConfig(s.homeConfig));
        if (s.promo) setHomePromo(mergeHomePromo(s.promo));
        setLoaded(true);
      } else if (!fresh.current) {
        fallback = setTimeout(() => alive && setLoaded(true), FIRST_LAUNCH_WAIT_MS);
      }
    });
    void refresh();
    return () => {
      alive = false;
      if (fallback) clearTimeout(fallback);
    };
  }, [refresh]);

  const lastForeground = useRef(Date.now());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || Date.now() - lastForeground.current < FOREGROUND_REFRESH_MS) return;
      lastForeground.current = Date.now();
      // Only the content responses are stale — bookings, services etc. keep their own cache rules.
      clearApiCache('/content');
      void refresh();
    });
    return () => sub.remove();
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
