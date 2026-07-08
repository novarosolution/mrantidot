import type { UserRole } from '@/types/api';

/** Role-based home route after sign-in. */
export function homeRouteForRole(role: UserRole | string): string {
  if (role === 'admin') return '/(admin)';
  if (role === 'technician') return '/(tech)';
  return '/(customer)';
}
