import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

export interface ResolvedAddress {
  line1: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
}

/**
 * Requests foreground location permission, reads the current GPS position, and
 * reverse-geocodes it into address fields. Shows a toast and returns null when
 * permission is denied or the position cannot be read. Reverse geocoding is
 * best-effort: coordinates are always returned even if the lookup fails.
 */
export async function getCurrentAddress(): Promise<ResolvedAddress | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Toast.show({
      type: 'error',
      text1: 'Location permission needed',
      text2: 'Allow location access to autofill your address',
    });
    return null;
  }

  let pos: Location.LocationObject;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    Toast.show({ type: 'error', text1: 'Could not get your location', text2: 'Try again or enter it manually' });
    return null;
  }

  const { latitude, longitude } = pos.coords;
  let line1 = '';
  let city = '';
  let pincode = '';

  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      const parts = [place.name, place.street, place.district].filter(
        (v): v is string => Boolean(v),
      );
      line1 = parts.filter((v, i) => parts.indexOf(v) === i).join(', ');
      city = place.city ?? place.subregion ?? place.region ?? '';
      pincode = place.postalCode ?? '';
    }
  } catch {
    // reverse geocoding can fail (offline / rate limited) - still return coords
  }

  return { line1, city, pincode, lat: latitude, lng: longitude };
}
