import type { Service, ServiceStats, User } from '@/types/api';

/** Rating customers see on service cards (admin-editable on the service). */
export function serviceDisplayRating(service: Pick<Service, 'rating'>): number {
  const n = service.rating;
  if (n == null || Number.isNaN(n) || n <= 0) return 0;
  return Math.round(n * 10) / 10;
}

/** Real average from customer reviews — admin dashboards only. */
export function serviceRealRating(stats?: ServiceStats | null): number | null {
  if (!stats) return null;
  const n = stats.realAvgRating ?? stats.avgRating;
  if (n == null || Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

/** Rating customers see for a technician. */
export function technicianDisplayRating(user: Pick<User, 'displayRating' | 'rating'>): number {
  const display = user.displayRating;
  if (display != null && !Number.isNaN(display) && display > 0) {
    return Math.round(display * 10) / 10;
  }
  const real = user.rating;
  if (real == null || Number.isNaN(real) || real <= 0) return 0;
  return Math.round(real * 10) / 10;
}

/** Real technician average from reviews (never manually edited). */
export function technicianRealRating(user: Pick<User, 'rating'>): number | null {
  const n = user.rating;
  if (n == null || Number.isNaN(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

export function formatAdminRatingPair(display: number | null, real: number | null): string {
  const pub = display != null && display > 0 ? `★ ${display.toFixed(1)} public` : 'No public rating';
  const actual = real != null && real > 0 ? `${real.toFixed(1)} real` : 'no reviews';
  return `${pub} · ${actual}`;
}
