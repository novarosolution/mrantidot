import { useEffect, useMemo, useRef, useState } from 'react';
import { LocationLaunchScreen } from '@/components/kit/LocationLaunchScreen';
import { useLocation } from '@/context/LocationContext';
import { isRealCity } from '@/lib/location';
import { appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isOnboardingDone } from '@/lib/onboarding';
import { isProfileIncomplete } from '@/lib/profile-display';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import type { StoredUser } from '@/lib/storage';

/** Signed-out launch: long enough to read the brand, never a wait for its own sake. */
const MIN_SPLASH_MS = 1200;
/** After "Serving <city>" appears, keep it up briefly so it can be read. */
const FOUND_HOLD_MS = 500;
const LOGGED_IN_MIN_MS = 350;
/** Signed-out users wait at most this long for a GPS fix before moving on (the chip updates later). */
const GPS_WAIT_MS = 2500;
const LOCATION_DETECT_TIMEOUT_MS = 9000;

function routeAfterSplash(user: StoredUser) {
  if (user.role === 'customer' && isProfileIncomplete(user)) {
    return customerRoutes.settings;
  }
  return homeRouteForRole(user.role);
}

export default function SplashScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { content, loaded: contentLoaded } = useAppContent();
  const { refreshLocation, displayLabel, location } = useLocation();

  const [phase, setPhase] = useState<'detecting' | 'found' | 'denied'>('detecting');
  const [gpsWaitOver, setGpsWaitOver] = useState(false);
  const startedAt = useRef(Date.now());
  const navigated = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setGpsWaitOver(true), GPS_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const detectTimer = setTimeout(() => {
      if (!cancelled) setPhase((current) => (current === 'detecting' ? 'denied' : current));
    }, LOCATION_DETECT_TIMEOUT_MS);

    // Shares the provider's in-flight fix (LocationContext de-duplicates), so launch asks GPS once.
    void refreshLocation({ silent: true })
      .then((loc) => {
        if (cancelled) return;
        if (loc.granted || isRealCity(loc.city)) {
          setPhase('found');
        } else {
          setPhase('denied');
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('denied');
      });

    return () => {
      cancelled = true;
      clearTimeout(detectTimer);
    };
  }, [refreshLocation]);

  const cityLabel = isRealCity(location?.city)
    ? location!.city
    : displayLabel ?? undefined;
  const areaLabel = location?.area?.trim() || undefined;

  // Signed-in users never wait for GPS; signed-out users wait for the fix or GPS_WAIT_MS, whichever is first.
  const ready = !authLoading && contentLoaded && (Boolean(user) || phase !== 'detecting' || gpsWaitOver);

  useEffect(() => {
    if (!ready || navigated.current) return;

    const elapsed = Date.now() - startedAt.current;
    const minWait = user ? LOGGED_IN_MIN_MS : MIN_SPLASH_MS;
    const wait = Math.max(0, minWait - elapsed) + (user ? 0 : phase === 'found' ? FOUND_HOLD_MS : 0);

    const t = setTimeout(async () => {
      if (navigated.current) return;
      navigated.current = true;

      if (user) {
        appReplace(routeAfterSplash(user));
        return;
      }

      const done = await isOnboardingDone();
      appReplace(done ? authRoutes.login : authRoutes.onboarding);
    }, wait);

    return () => clearTimeout(t);
  }, [phase, ready, user]);

  const brandName = useMemo(() => content.branding.name, [content.branding.name]);
  // Empty → LocationLaunchScreen shows the admin-editable fallback line.
  const tagline = content.branding.tagline?.trim() || undefined;
  const trustChips = useMemo(
    () => content.onboarding.trustChips,
    [content.onboarding.trustChips],
  );

  return (
    <LocationLaunchScreen
      brandName={brandName}
      tagline={tagline}
      trustChips={trustChips}
      cityLabel={cityLabel}
      areaLabel={areaLabel}
      phase={phase}
      onContinue={() => {
        if (navigated.current) return;
        navigated.current = true;
        void (async () => {
          if (user) {
            appReplace(routeAfterSplash(user));
            return;
          }
          const done = await isOnboardingDone();
          appReplace(done ? authRoutes.login : authRoutes.onboarding);
        })();
      }}
    />
  );
}
