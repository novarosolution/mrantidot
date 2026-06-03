import type { User } from '@/types/api';

/** Technicians eligible for new booking assignment. */
export function assignableTechnicians(techs: User[]): User[] {
  return techs.filter((t) => t.disabled !== true && t.available !== false);
}

/** Whether a user account is disabled for sign-in. */
export function isAccountDisabled(user: Pick<User, 'available' | 'disabled' | 'role'>): boolean {
  if (user.disabled === true) return true;
  if (user.role === 'technician') return false;
  return user.available === false;
}
