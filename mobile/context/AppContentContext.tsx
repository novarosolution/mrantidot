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
import type { AppConfig } from '@/types/api';
import { DEFAULT_BOOKING_COPY, getBookingCopy } from '@/constants/bookingCopy';

export const DEFAULT_APP_CONFIG: AppConfig = {
  support: {
    phone: '+91 90000 00000',
    email: 'support@mrantidot.com',
    whatsapp: '',
    hours: 'Mon–Sat, 9 AM – 7 PM',
  },
  branding: { name: 'Mr Antidot', tagline: 'Trusted pest control & home services' },
  trust: {
    guaranteeText: '100% satisfaction guarantee · Verified professionals',
    badges: ['Verified pros', 'On-time service', 'Safe chemicals', 'Post-service support'],
  },
  onboarding: {
    slides: [
      { title: 'Pest control made simple', subtitle: 'Book trusted professionals in seconds.', icon: 'spray' },
      { title: 'Track every step', subtitle: 'Watch your technician progress live.', icon: 'map' },
      { title: 'Guaranteed results', subtitle: 'Backed by our satisfaction guarantee.', icon: 'shield' },
    ],
    trustChips: ['Verified pros', 'On-time service', '4.8★ rated'],
  },
  legal: { termsMarkdown: '', privacyMarkdown: '' },
  aboutMarkdown: '',
  faq: [],
  booking: DEFAULT_BOOKING_COPY,
};

interface AppContentValue {
  content: AppConfig;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const AppContentCtx = createContext<AppContentValue | null>(null);

export function AppContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ app: AppConfig }>('/content/app', {
        skipErrorToast: true,
        silent401: true,
        cacheTtlMs: CACHE_TTL.content,
      });
      if (data?.app) {
        setContent({
          ...data.app,
          booking: getBookingCopy(data.app.booking),
        });
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

  const value = useMemo(() => ({ content, loaded, refresh }), [content, loaded, refresh]);
  return <AppContentCtx.Provider value={value}>{children}</AppContentCtx.Provider>;
}

export function useAppContent(): AppContentValue {
  const ctx = useContext(AppContentCtx);
  if (!ctx) throw new Error('useAppContent must be used within AppContentProvider');
  return ctx;
}
