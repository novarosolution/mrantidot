/** Pest / treatment types a service can cover (mirrors server/src/constants/serviceTypes.ts). */
export const SERVICE_TYPE_KEYS = [
  'ant',
  'cockroach',
  'rodent',
  'mosquito',
  'termite',
  'bed_bug',
  'bird',
  'general',
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
  general: 'General Pest',
};

export function serviceTypeLabel(key: string): string {
  return SERVICE_TYPE_LABELS[key as ServiceTypeKey] ?? key.replace(/_/g, ' ');
}
