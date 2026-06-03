/** Pest / treatment types a service can cover (multiple allowed per service). */
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

export function isServiceTypeKey(value: string): value is ServiceTypeKey {
  return (SERVICE_TYPE_KEYS as readonly string[]).includes(value);
}

export function normalizeServiceTypes(values: unknown): ServiceTypeKey[] {
  if (!Array.isArray(values)) return [];
  const out: ServiceTypeKey[] = [];
  for (const raw of values) {
    const key = String(raw).trim().toLowerCase().replace(/\s+/g, '_');
    if (isServiceTypeKey(key) && !out.includes(key)) out.push(key);
  }
  return out;
}
