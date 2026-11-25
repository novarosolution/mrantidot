import type { Service, ServiceOption } from '@/types/api';

/** Lowest price a customer can book this service for — the cheapest size, else the base price. */
export function serviceStartPrice(s: Pick<Service, 'basePrice' | 'options'>): number {
  const prices = (s.options ?? []).map((o) => o.price).filter((p) => Number.isFinite(p) && p > 0);
  return prices.length > 0 ? Math.min(...prices) : s.basePrice;
}

/** Price for a picked size, falling back to the base price for services without sizes. */
export function servicePriceFor(s: Pick<Service, 'basePrice' | 'options'>, optionKey?: string | null): number {
  const option = optionKey ? s.options?.find((o) => o.key === optionKey) : undefined;
  return option?.price ?? (s.options?.length ? serviceStartPrice(s) : s.basePrice);
}

export function findOption(s: Pick<Service, 'options'>, key?: string | null): ServiceOption | undefined {
  return key ? s.options?.find((o) => o.key === key) : undefined;
}

/** Approx. visit minutes — the admin's value, else ~15 min per step (min 30), else 60. */
export function serviceDurationMins(s: Pick<Service, 'durationMins' | 'stepTemplate'>): number {
  if (s.durationMins && s.durationMins > 0) return s.durationMins;
  const steps = s.stepTemplate?.length ?? 0;
  return steps > 0 ? Math.max(30, steps * 15) : 60;
}

/** "45 mins", "1 hr", "3 hrs 30 mins". */
export function formatDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m} mins`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hrs = `${h} ${h === 1 ? 'hr' : 'hrs'}`;
  return rest ? `${hrs} ${rest} mins` : hrs;
}
