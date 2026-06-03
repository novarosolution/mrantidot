import type { UserRole } from '@/types/api';

/** Role-aware booking detail route (avoids /booking/[id] resolving to admin). */
export function bookingDetailPath(role: UserRole | undefined, bookingId: string): string {
  if (role === 'admin') return `/(admin)/booking/${bookingId}`;
  if (role === 'technician') return `/(tech)/job/${bookingId}`;
  return `/(customer)/booking/${bookingId}`;
}
