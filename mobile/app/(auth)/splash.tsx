import { useEffect, useMemo, useRef, useState } from 'react';
import { LocationLaunchScreen } from '@/components/kit/LocationLaunchScreen';
import { useLocation } from '@/context/LocationContext';
import { appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isOnboardingDone } from '@/lib/onboarding';
import { isProfileIncomplete } from '@/lib/profile-display';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import type { StoredUser } from '@/lib/storage';

const MIN_SPLASH_MS = 2800;
const FOUND_HOLD_MS = 900;
const LOGGED_IN_MIN_MS = 350;
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
  const { setLocation, refreshLocation, displayLabel, location } = useLocation();

  const [phase, setPhase] = useState<'detecting' | 'found' | 'denied'>('detecting');
  const startedAt = useRef(Date.now());
  const navigated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const detectTimer = setTimeout(() => {
      if (!cancelled) setPhase((current) => (current === 'detecting' ? 'denied' : current));
    }, LOCATION_DETECT_TIMEOUT_MS);

    void refreshLocation({ silent: true })
      .then((loc) => {
        if (cancelled) return;
        if (!loc.granted && loc.city === 'your area') {
          setPhase('denied');
        } else {
          setPhase('found');
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

  const cityLabel = location?.city && location.city !== 'your area' ? location.city : displayLabel ?? undefined;
  const areaLabel = location?.area?.trim() || undefined;

  const ready =
    !authLoading &&
    contentLoaded &&
    phase !== 'detecting' &&
    (Boolean(user) || phase === 'found' || phase === 'denied');

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

  return (
    <LocationLaunchScreen
      brandName={brandName}
      cityLabel={cityLabel}
      areaLabel={areaLabel}
      phase={phase}
      onContinue={() => {
        if (navigated.current) return;
        navigated.current = true;
        void setLocation({ city: 'your area', area: '', granted: false, updatedAt: Date.now() });
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
