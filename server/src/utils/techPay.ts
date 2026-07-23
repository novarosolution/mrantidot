import type { IUser } from '../models/User';

export type TechPayMode = 'percent' | 'flat';

export type TechPayConfig = {
  payMode?: TechPayMode | null;
  payPercent?: number | null;
  payFlat?: number | null;
};

/** Admin-configured take-home for a completed job. */
export function computeTechEarning(jobTotal: number, tech?: TechPayConfig | null): number {
  const total = Math.max(0, Number(jobTotal) || 0);
  if (!tech) return Math.round(total);
  if (tech.payMode === 'flat') {
    return Math.max(0, Math.round(Number(tech.payFlat) || 0));
  }
  const pct = Math.min(100, Math.max(0, Number(tech.payPercent ?? 100)));
  return Math.max(0, Math.round((total * pct) / 100));
}

/** Prefer locked-in booking.technicianEarning; else compute from config / job total. */
export function resolveTechEarning(
  booking: { technicianEarning?: number | null; amount?: { total?: number } | null },
  tech?: TechPayConfig | null,
): number {
  if (typeof booking.technicianEarning === 'number' && Number.isFinite(booking.technicianEarning)) {
    return Math.max(0, Math.round(booking.technicianEarning));
  }
  return computeTechEarning(booking.amount?.total ?? 0, tech);
}

export function formatPaySummary(tech: TechPayConfig): string {
  if (tech.payMode === 'flat') {
    return `Flat ₹${Math.round(Number(tech.payFlat) || 0)} / job`;
  }
  return `${Math.round(Number(tech.payPercent ?? 100))}% of job value`;
}

export function payConfigFromUser(user: IUser | TechPayConfig | null | undefined): TechPayConfig {
  if (!user) return { payMode: 'percent', payPercent: 100, payFlat: 0 };
  return {
    payMode: user.payMode === 'flat' ? 'flat' : 'percent',
    payPercent: user.payPercent ?? 100,
    payFlat: user.payFlat ?? 0,
  };
}
