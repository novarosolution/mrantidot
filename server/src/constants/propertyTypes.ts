/**
 * Property / premises types selected during booking. These are the built-in keys and names — the live
 * list (names, on/off, extra types) is Business settings → Lists → Property types.
 */
export const PROPERTY_TYPE_KEYS = [
  '1bhk',
  '2bhk',
  '3bhk',
  '4bhk',
  'bungalow',
  'office',
  'cafe_restaurant',
  'hotel',
  'warehouse',
  'factory',
] as const;

export type PropertyTypeKey = (typeof PROPERTY_TYPE_KEYS)[number];

/** Built-in names (the Business settings defaults). */
export const PROPERTY_TYPE_DEFAULT_LABELS: Record<PropertyTypeKey, string> = {
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  '4bhk': '4 BHK',
  bungalow: 'Bungalow',
  office: 'Office',
  cafe_restaurant: 'Cafe / Restaurant',
  hotel: 'Hotel',
  warehouse: 'Warehouse',
  factory: 'Factory',
};

let liveLabels: Record<string, string> = {};
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Business settings calls this whenever the rules load, so the names below follow the admin's names. */
export function setLivePropertyTypeLabels(labels: Record<string, string>): void {
  liveLabels = labels;
}

/**
 * Current names (admin names once settings have loaded), for built-in keys and any type the admin added;
 * unknown keys read as undefined like a plain map.
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyTypeKey, string> = new Proxy(
  { ...PROPERTY_TYPE_DEFAULT_LABELS },
  {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && (own(liveLabels, prop) || own(PROPERTY_TYPE_DEFAULT_LABELS, prop))) {
        return propertyTypeLabel(prop);
      }
      return Reflect.get(target, prop, receiver);
    },
  },
);

/** Display name for any property key, including types the admin added. */
export function propertyTypeLabel(key: string): string {
  return (
    (own(liveLabels, key) ? liveLabels[key] : '') ||
    (own(PROPERTY_TYPE_DEFAULT_LABELS, key) ? PROPERTY_TYPE_DEFAULT_LABELS[key as PropertyTypeKey] : '') ||
    key.replace(/_/g, ' ')
  );
}

/** Built-in key? (Bookings are checked against the live settings list instead.) */
export function isPropertyTypeKey(value: string): value is PropertyTypeKey {
  return (PROPERTY_TYPE_KEYS as readonly string[]).includes(value);
}
