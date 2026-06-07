/** Pest / treatment types a service can cover (mirrors server/src/constants/serviceTypes.ts). */
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

export const SERVICE_TYPE_LABELS: Record<ServiceTypeKey, string> = {
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

export function serviceTypeLabel(key: string): string {
  return SERVICE_TYPE_LABELS[key as ServiceTypeKey] ?? key.replace(/_/g, ' ');
}

export function isServiceTypeKey(value: string): value is ServiceTypeKey {
  return (SERVICE_TYPE_KEYS as readonly string[]).includes(value);
}
