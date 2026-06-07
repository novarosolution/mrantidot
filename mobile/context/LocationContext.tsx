import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchLaunchLocation,
  formatLocationLabel,
  getCachedAppLocation,
  getCachedLaunchCity,
  getCurrentAddress,
  resolvedToAppLocation,
  resolveDisplayCity,
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

  useEffect(() => {
    void (async () => {
      const [cachedLoc, city] = await Promise.all([getCachedAppLocation(), getCachedLaunchCity()]);
      setCachedCity(city);
      if (cachedLoc) setLocationState(cachedLoc);
      setLoaded(true);
    })();
  }, []);

  const setLocation = useCallback(async (loc: AppLocation) => {
    setLocationState(loc);
    await saveAppLocation(loc);
    if (loc.city && loc.city !== 'your area') setCachedCity(loc.city);
  }, []);

  const refreshLocation = useCallback(async (opts?: { silent?: boolean }) => {
    setLocating(true);
    try {
      const loc = await fetchLaunchLocation();
      await setLocation(loc);
      return loc;
    } finally {
      setLocating(false);
      if (!opts?.silent) setLoaded(true);
    }
  }, [setLocation]);

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

  const displayLabel = useMemo(() => {
    const profileCity = user?.city?.trim();
    if (profileCity) {
      const area = location?.area?.trim();
      return area && !profileCity.toLowerCase().includes(area.toLowerCase())
        ? `${area}, ${profileCity}`
        : profileCity;
    }
    return formatLocationLabel(location) ?? (cachedCity && cachedCity !== 'your area' ? cachedCity : null);
  }, [cachedCity, location, user?.city]);

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
