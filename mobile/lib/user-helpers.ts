import type { User } from '@/types/api';
import { localDateKey } from '@/lib/dates';

/** Technicians eligible for a visit; today's off-duty status only blocks today's (or overdue) visits. */
export function assignableTechnicians(techs: User[], visitDate?: string): User[] {
  const visitIsToday = !visitDate || visitDate <= localDateKey();
  return techs.filter((t) => t.disabled !== true && (!visitIsToday || t.available !== false));
}

/** Whether a user account is disabled for sign-in. */
export function isAccountDisabled(user: Pick<User, 'available' | 'disabled' | 'role'>): boolean {
  if (user.disabled === true) return true;
  if (user.role === 'technician') return false;
  return user.available === false;
}
