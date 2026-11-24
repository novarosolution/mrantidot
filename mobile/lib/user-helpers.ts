import type { User } from '@/types/api';

// Assigning a technician: see components/admin/TechnicianPickerSheet.tsx (server-side fit rules).

/** Whether a user account is disabled for sign-in. */
export function isAccountDisabled(user: Pick<User, 'available' | 'disabled' | 'role'>): boolean {
  if (user.disabled === true) return true;
  if (user.role === 'technician') return false;
  return user.available === false;
}
