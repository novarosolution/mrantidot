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
import { Platform } from 'react-native';
import {
  fetchLaunchLocation,
  getCachedAppLocation,
  getCachedLaunchCity,
  getCurrentAddress,
  isRealCity,
  resolvedToAppLocation,
  resolveDisplayCity,
  resolveDisplayLabel,
  saveAppLocation,
  type AppLocation,
} from '@/lib/location';
import { useAuth } from '@/context/AuthContext';

type LocationContextValue = {
  location: AppLocation | null;
  loaded: boolean;
  locating: boolean;
  displayCity: string | null;
  displayLabel: string | null;
  setLocation: (loc: AppLocation) => Promise<void>;
  refreshLocation: (opts?: { silent?: boolean }) => Promise<AppLocation>;
  detectAddress: () => Promise<AppLocation | null>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location, setLocationState] = useState<AppLocation | null>(null);
  const [cachedCity, setCachedCity] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const autoRefreshDone = useRef(false);
  /** One GPS fix at a time: launch (splash) and the provider's own refresh share the same request. */
  const inflight = useRef<Promise<AppLocation> | null>(null);

  const setLocation = useCallback(async (loc: AppLocation) => {
    setLocationState(loc);
    await saveAppLocation(loc);
    if (isRealCity(loc.city)) setCachedCity(loc.city);
  }, []);

  const refreshLocation = useCallback(
    (opts?: { silent?: boolean }): Promise<AppLocation> => {
      const done = () => {
        if (!opts?.silent) setLoaded(true);
      };
      if (inflight.current) return inflight.current.finally(done);
      setLocating(true);
      const run = (async () => {
        try {
          const loc = await fetchLaunchLocation();
          await setLocation(loc);
          return loc;
        } finally {
          inflight.current = null;
          setLocating(false);
        }
      })();
      inflight.current = run;
      return run.finally(done);
    },
    [setLocation],
  );

  useEffect(() => {
    void (async () => {
      const [cachedLoc, city] = await Promise.all([getCachedAppLocation(), getCachedLaunchCity()]);
      setCachedCity(city);
      if (cachedLoc) setLocationState(cachedLoc);
      setLoaded(true);
      // Always pull a fresh GPS fix after cache paint so chips show the real place.
      // Not on web: the admin panel has no location chips, and a browser permission prompt on open is noise.
      if (!autoRefreshDone.current && Platform.OS !== 'web') {
        autoRefreshDone.current = true;
        void refreshLocation({ silent: true });
      }
    })();
  }, [refreshLocation]);

  const detectAddress = useCallback(async () => {
    setLocating(true);
    try {
      const resolved = await getCurrentAddress();
      if (!resolved) return null;
      const loc = resolvedToAppLocation(resolved);
      await setLocation(loc);
      return loc;
    } finally {
      setLocating(false);
    }
  }, [setLocation]);

  const displayCity = useMemo(
    () => resolveDisplayCity(user?.city, location, cachedCity),
    [cachedCity, location, user?.city],
  );

  const displayLabel = useMemo(
    () => resolveDisplayLabel(user?.city, location, cachedCity),
    [cachedCity, location, user?.city],
  );

  const value = useMemo(
    (): LocationContextValue => ({
      location,
      loaded,
      locating,
      displayCity,
      displayLabel,
      setLocation,
      refreshLocation,
      detectAddress,
    }),
    [detectAddress, displayCity, displayLabel, loaded, locating, location, refreshLocation, setLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
