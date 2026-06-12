import type { ServiceStatsResult } from './service-stats';

/** Rating shown to customers on service cards (admin-editable). */
export function serviceDisplayRating(service: { rating?: number | null }): number {
  const n = service.rating;
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(n * 10) / 10;
}

/** Public technician rating — admin display override, else real average from reviews. */
export function technicianPublicRating(user: {
  displayRating?: number | null;
  rating?: number | null;
}): number {
  const display = user.displayRating;
  if (display != null && !Number.isNaN(display) && display > 0) {
    return Math.round(display * 10) / 10;
  }
  const real = user.rating;
  if (real == null || Number.isNaN(real)) return 0;
  return Math.round(real * 10) / 10;
}

export type PublicServiceStats = Pick<ServiceStatsResult, 'bookingCount' | 'reviewCount'>;

export function formatServiceStatsForRole(
  stats: ServiceStatsResult,
  role: string | undefined,
): ServiceStatsResult | PublicServiceStats {
  if (role === 'admin') return stats;
  return {
    bookingCount: stats.bookingCount,
    reviewCount: stats.reviewCount,
  };
}
