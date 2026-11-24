import { pestLabel } from '@/lib/settingsLabels';
import type { BusinessSettings } from '@/types/api';
import type { TechnicianCoverage } from '@/types/adminManage';

/** Monday-first week for chips; `day` is the JS weekday (0 = Sunday). */
export const WEEK: { day: number; short: string; long: string }[] = [
  { day: 1, short: 'Mon', long: 'Monday' },
  { day: 2, short: 'Tue', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thu', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
  { day: 6, short: 'Sat', long: 'Saturday' },
  { day: 0, short: 'Sun', long: 'Sunday' },
];

export const MAX_JOBS_PER_DAY = 20;

/** "Off Sat, Sun" · "Works every day". */
export function offDaysLabel(offDays?: number[]): string {
  const days = WEEK.filter((w) => (offDays ?? []).includes(w.day)).map((w) => w.short);
  return days.length ? `Off ${days.join(', ')}` : 'Works every day';
}

/** "Termite, Ant +2" · "All pest types". */
export function skillsLabel(skills: string[] | undefined, settings: BusinessSettings, max = 2): string {
  const list = skills ?? [];
  if (list.length === 0) return 'All pest types';
  const names = list.map((k) => pestLabel(k, settings));
  return names.length > max ? `${names.slice(0, max).join(', ')} +${names.length - max}` : names.join(', ');
}

/** "Ahmedabad, Gandhinagar +3 pincodes" · "Anywhere in the service area". */
export function areaLabel(c: Pick<TechnicianCoverage, 'serviceCities' | 'servicePincodes'>, max = 2): string {
  const cities = c.serviceCities ?? [];
  const pins = c.servicePincodes ?? [];
  if (cities.length === 0 && pins.length === 0) return 'Anywhere in the service area';
  const parts: string[] = [];
  if (cities.length) parts.push(cities.length > max ? `${cities.slice(0, max).join(', ')} +${cities.length - max}` : cities.join(', '));
  if (pins.length) parts.push(`${pins.length} pincode${pins.length === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

/** "Max 3 jobs a day" · "No daily limit". */
export function capLabel(cap?: number | null): string {
  return cap && cap > 0 ? `Max ${cap} job${cap === 1 ? '' : 's'} a day` : 'No daily limit';
}

/** True when the technician has any coverage rule set. */
export function hasCoverageRules(c: TechnicianCoverage): boolean {
  return Boolean(c.skills?.length || c.serviceCities?.length || c.servicePincodes?.length || c.offDays?.length || (c.maxJobsPerDay ?? 0) > 0);
}
