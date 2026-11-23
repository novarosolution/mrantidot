import { getBusinessSettings } from '@/lib/businessSettings';

/**
 * Pest / treatment types a service can cover (mirrors server/src/constants/serviceTypes.ts).
 * Keys are fixed (the app ships artwork for each); names and on/off come from
 * Business settings → Lists → Pest names.
 */
export const SERVICE_TYPE_KEYS = [
  'ant',
  'cockroach',
  'rodent',
  'mosquito',
  'termite',
  'bed_bug',
  'bird',
  'flea',
  'spider',
  'lizard',
  'bee',
  'wood_borer',
  'general',
  'fumigation',
  'deep_cleaning',
  'silo',
] as const;

export type ServiceTypeKey = (typeof SERVICE_TYPE_KEYS)[number];

/** Built-in names (the Business settings defaults). */
export const SERVICE_TYPE_DEFAULT_LABELS: Record<ServiceTypeKey, string> = {
  ant: 'Ant',
  cockroach: 'Cockroach',
  rodent: 'Rodent',
  mosquito: 'Mosquito',
  termite: 'Termite',
  bed_bug: 'Bed Bug',
  bird: 'Bird',
  flea: 'Flea',
  spider: 'Spider',
  lizard: 'Lizard',
  bee: 'Bee / Wasp',
  wood_borer: 'Wood Borer',
  general: 'General Pest',
  fumigation: 'Fumigation',
  deep_cleaning: 'Deep Cleaning',
  silo: 'Silo Treatment',
};

function settingsLabel(key: string): string | undefined {
  return getBusinessSettings().lists.pestTypes.find((p) => p.key === key)?.label?.trim() || undefined;
}

/** Display name of a pest type — the admin's name, built-in name before settings load. */
export function serviceTypeLabel(key: string): string {
  const builtIn = isServiceTypeKey(key) ? SERVICE_TYPE_DEFAULT_LABELS[key] : undefined;
  return settingsLabel(key) || builtIn || key.replace(/_/g, ' ');
}

/**
 * Current names by key. Reads live (each access returns the admin's latest name), so screens that read it
 * while rendering pick up changes on their next render; use `useBusinessSettings()` to re-render on change.
 */
export const SERVICE_TYPE_LABELS: Record<ServiceTypeKey, string> = Object.defineProperties(
  {} as Record<ServiceTypeKey, string>,
  Object.fromEntries(SERVICE_TYPE_KEYS.map((k) => [k, { enumerable: true, get: () => serviceTypeLabel(k) }])),
);

export function isServiceTypeKey(value: string): value is ServiceTypeKey {
  return (SERVICE_TYPE_KEYS as readonly string[]).includes(value);
}

/** Pest types switched on in Business settings, in the admin's order. */
export function activeServiceTypeKeys(): ServiceTypeKey[] {
  const on = getBusinessSettings().lists.pestTypes.filter((p) => p.active).map((p) => p.key);
  return on.filter(isServiceTypeKey);
}
