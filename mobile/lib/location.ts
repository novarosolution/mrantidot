import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const CITY_CACHE_KEY = 'mrantidot_launch_city';
const LOCATION_CACHE_KEY = 'mrantidot_launch_location_v2';

export type AppLocation = {
  city: string;
  area: string;
  line1?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  granted: boolean;
  updatedAt: number;
};

/** @deprecated Use AppLocation */
export type LaunchLocation = AppLocation;

export interface ResolvedAddress {
  line1: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  area?: string;
}

const FALLBACK: AppLocation = {
  city: 'your area',
  area: '',
  granted: false,
  updatedAt: 0,
};

const LOCATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('location_timeout')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isRealCity(city?: string): city is string {
  return Boolean(city?.trim() && city !== 'your area');
}

function placeToFields(place: Location.LocationGeocodedAddress) {
  const parts = [place.name, place.street, place.district].filter((v): v is string => Boolean(v));
  const line1 = parts.filter((v, i) => parts.indexOf(v) === i).join(', ');
  const city = place.city ?? place.subregion ?? place.region ?? '';
  const area = place.district ?? place.name ?? place.street ?? '';
  const pincode = place.postalCode ?? '';
  return { line1, city, area, pincode };
}

export async function getCachedLaunchCity(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CITY_CACHE_KEY);
  } catch {
    return null;
  }
}

export async function getCachedAppLocation(): Promise<AppLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppLocation;
    if (!parsed?.city) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAppLocation(loc: AppLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
    if (isRealCity(loc.city)) {
      await AsyncStorage.setItem(CITY_CACHE_KEY, loc.city);
    }
  } catch {
    // cache is best-effort
  }
}

export function formatLocationLabel(loc?: AppLocation | null): string | null {
  if (!loc) return null;
  const city = isRealCity(loc.city) ? loc.city : null;
  const area = loc.area?.trim();
  if (area && city) return `${area}, ${city}`;
  return city ?? area ?? null;
}

export function resolveDisplayCity(
  userCity?: string | null,
  location?: AppLocation | null,
  cachedCity?: string | null,
): string | null {
  const profile = userCity?.trim();
  if (profile) return profile;
  if (isRealCity(location?.city)) return location!.city;
  if (isRealCity(cachedCity ?? undefined)) return cachedCity!.trim();
  return null;
}

/** Silent location read for launch splash — no toasts. */
export async function fetchLaunchLocation(): Promise<AppLocation> {
  try {
    const { status } = await withTimeout(
      Location.requestForegroundPermissionsAsync(),
      LOCATION_TIMEOUT_MS,
    );
    if (status !== 'granted') {
      const cached = await getCachedAppLocation();
      if (cached) return { ...cached, granted: false, updatedAt: Date.now() };
      const city = await getCachedLaunchCity();
      if (city) return { city, area: '', granted: false, updatedAt: Date.now() };
      return { ...FALLBACK, updatedAt: Date.now() };
    }

    const pos = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      LOCATION_TIMEOUT_MS,
    );
    const { latitude, longitude } = pos.coords;
    let city = 'your area';
    let area = '';
    let line1 = '';
    let pincode = '';

    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const fields = placeToFields(place);
        city = fields.city || city;
        area = fields.area;
        line1 = fields.line1;
        pincode = fields.pincode;
      }
    } catch {
      // coords still useful
    }

    const loc: AppLocation = {
      city,
      area,
      line1: line1 || undefined,
      pincode: pincode || undefined,
      lat: latitude,
      lng: longitude,
      granted: true,
      updatedAt: Date.now(),
    };
    await saveAppLocation(loc);
    return loc;
  } catch {
    const cached = await getCachedAppLocation();
    if (cached) return { ...cached, granted: false, updatedAt: Date.now() };
    const city = await getCachedLaunchCity();
    if (city) return { city, area: '', granted: false, updatedAt: Date.now() };
    return { ...FALLBACK, updatedAt: Date.now() };
  }
}

/**
 * Requests foreground location permission, reads GPS, reverse-geocodes.
 * Shows a toast and returns null when permission is denied or position fails.
 */
export async function getCurrentAddress(): Promise<ResolvedAddress | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const { appToast } = await import('@/lib/toast');
    appToast.warning('Location permission needed', 'Allow location access to autofill your address');
    return null;
  }

  let pos: Location.LocationObject;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    const { appToast } = await import('@/lib/toast');
    appToast.error('Could not get your location', 'Try again or enter it manually');
    return null;
  }

  const { latitude, longitude } = pos.coords;
  let line1 = '';
  let city = '';
  let pincode = '';
  let area = '';

  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      const fields = placeToFields(place);
      line1 = fields.line1;
      city = fields.city;
      pincode = fields.pincode;
      area = fields.area;
    }
  } catch {
    // reverse geocoding can fail — still return coords
  }

  const resolved: ResolvedAddress = { line1, city, pincode, lat: latitude, lng: longitude, area };
  await saveAppLocation({
    city: city || 'your area',
    area,
    line1: line1 || undefined,
    pincode: pincode || undefined,
    lat: latitude,
    lng: longitude,
    granted: true,
    updatedAt: Date.now(),
  });
  return resolved;
}

export function resolvedToAppLocation(resolved: ResolvedAddress, granted = true): AppLocation {
  return {
    city: resolved.city || 'your area',
    area: resolved.area ?? '',
    line1: resolved.line1 || undefined,
    pincode: resolved.pincode || undefined,
    lat: resolved.lat,
    lng: resolved.lng,
    granted,
    updatedAt: Date.now(),
  };
}
