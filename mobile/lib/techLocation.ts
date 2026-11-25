import * as Location from 'expo-location';

/** GPS point attached to a step photo. */
export type GeoFix = { lat: number; lng: number };

export type LocationAccess = 'ok' | 'denied' | 'off';

/** Ask for foreground location (no prompt when already decided) and check that location services are on. */
export async function ensureLocationAccess(): Promise<LocationAccess> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'denied';
    return (await Location.hasServicesEnabledAsync()) ? 'ok' : 'off';
  } catch {
    return 'denied';
  }
}

function toFix(pos: Location.LocationObject | null | undefined): GeoFix | null {
  if (!pos) return null;
  const { latitude, longitude } = pos.coords;
  // The server rejects 0,0 (a common "no fix" placeholder).
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null;
  return { lat: latitude, lng: longitude };
}

/**
 * A fresh fix, or null once `timeoutMs` passes. expo-location can't cancel the native request, so a late
 * answer is simply ignored.
 */
export async function currentFix(timeoutMs: number): Promise<GeoFix | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
      timeout,
    ]);
    return toFix(pos);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The last position the phone already knows (at most `maxAgeMs` old), or null. Instant. */
export async function lastKnownFix(maxAgeMs = 15 * 60_000): Promise<GeoFix | null> {
  try {
    return toFix(await Location.getLastKnownPositionAsync({ maxAge: maxAgeMs }));
  } catch {
    return null;
  }
}

/** "Street, City, Region" for a fix — empty when geocoding is slow or unavailable. */
export async function placeName(fix: GeoFix, timeoutMs = 5_000): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const places = await Promise.race([
      Location.reverseGeocodeAsync({ latitude: fix.lat, longitude: fix.lng }).catch(() => null),
      timeout,
    ]);
    const place = places?.[0];
    return place ? [place.street, place.city, place.region].filter(Boolean).join(', ') : '';
  } finally {
    if (timer) clearTimeout(timer);
  }
}
