import { getBusinessSettings } from '@/lib/businessSettings';
import type { SettingsPropertyItem } from '@/types/api';

/**
 * Property / premises types for booking (mirrors server). These are the built-in keys; names, on/off,
 * order and extra types come from Business settings → Lists → Property types. The exports keep their
 * shapes but read the admin's list live (each access), so screens see changes on their next render —
 * use `useBusinessSettings()` in a screen to re-render as soon as settings change.
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

const settingsItems = (): SettingsPropertyItem[] => getBusinessSettings().lists.propertyTypes;

/** Display name for any property key (admin name → built-in name → the key as words). */
export function propertyTypeLabel(key: string): string {
  const builtIn = Object.prototype.hasOwnProperty.call(PROPERTY_TYPE_DEFAULT_LABELS, key)
    ? PROPERTY_TYPE_DEFAULT_LABELS[key as PropertyTypeKey]
    : undefined;
  return settingsItems().find((p) => p.key === key)?.label?.trim() || builtIn || key.replace(/_/g, ' ');
}

/**
 * Names by key, live. Answers for every key — built-in ones and types the admin added — so
 * `PROPERTY_TYPE_LABELS[key]` never comes back empty for a key from the settings list.
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyTypeKey, string> = new Proxy(
  { ...PROPERTY_TYPE_DEFAULT_LABELS },
  {
    get(target, prop, receiver) {
      const known =
        typeof prop === 'string' &&
        (Object.prototype.hasOwnProperty.call(PROPERTY_TYPE_DEFAULT_LABELS, prop) || settingsItems().some((p) => p.key === prop));
      return known ? propertyTypeLabel(prop as string) : Reflect.get(target, prop, receiver);
    },
  },
);

function activeKeys(group: 'home' | 'business'): PropertyTypeKey[] {
  // Admin-added keys are typed as PropertyTypeKey so existing pickers keep compiling; labels resolve above.
  return settingsItems()
    .filter((p) => p.active && p.group === group)
    .map((p) => p.key as PropertyTypeKey);
}

/** Bookable types by group, in the admin's order (switched-off types left out). */
export const PROPERTY_TYPE_GROUPS: { title: string; readonly keys: PropertyTypeKey[] }[] = [
  {
    title: 'Residential',
    get keys() {
      return activeKeys('home');
    },
  },
  {
    title: 'Commercial',
    get keys() {
      return activeKeys('business');
    },
  },
];

/** True when `key` is a property type customers can book right now (on in Business settings). */
export function isPropertyTypeKey(key: string): key is PropertyTypeKey {
  return settingsItems().some((p) => p.active && p.key === key);
}
