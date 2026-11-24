/**
 * Number formatting for admin charts and reports — rupees in Indian digit grouping (₹1,23,456) and
 * compact Indian units for axes (₹45k, ₹1.2L, ₹3.4Cr). Done by hand so Hermes, Safari and Chrome agree.
 */

function group(digits: string): string {
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
}

/** "1,23,456" (whole number, Indian grouping). */
export function formatIndianNumber(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return `${v < 0 ? '-' : ''}${group(String(Math.abs(v)))}`;
}

/** "₹1,23,456". */
export function formatINR(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return `${v < 0 ? '-' : ''}₹${group(String(Math.abs(v)))}`;
}

function trimUnit(x: number): string {
  if (x >= 100) return String(Math.round(x));
  const fixed = x >= 10 ? x.toFixed(0) : x.toFixed(1);
  return fixed.replace(/\.0$/, '');
}

/** Axis / tile labels: ₹0, ₹850, ₹12k, ₹1.2L, ₹3.4Cr. */
export function formatINRCompact(n: number): string {
  const v = Math.abs(Number.isFinite(n) ? n : 0);
  const sign = n < 0 ? '-' : '';
  if (v >= 1e7) return `${sign}₹${trimUnit(v / 1e7)}Cr`;
  if (v >= 1e5) return `${sign}₹${trimUnit(v / 1e5)}L`;
  if (v >= 1e3) return `${sign}₹${trimUnit(v / 1e3)}k`;
  return `${sign}₹${Math.round(v)}`;
}

/** Counts on an axis: 0, 8, 1.2k. */
export function formatCountCompact(n: number): string {
  const v = Math.abs(n);
  if (v >= 1e5) return `${trimUnit(n / 1e5)}L`;
  if (v >= 1e3) return `${trimUnit(n / 1e3)}k`;
  return String(Math.round(n));
}

/**
 * A rounded axis top and step for `ticks` gridlines (1 / 2 / 2.5 / 5 × 10ⁿ).
 * `integer` keeps count axes on whole numbers.
 */
export function niceScale(max: number, ticks = 4, integer = false): { max: number; step: number } {
  if (!Number.isFinite(max) || max <= 0) return { max: ticks, step: 1 };
  const rough = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  let step = nice * pow;
  if (integer) step = Math.max(1, Math.ceil(step));
  return { max: step * ticks, step };
}

/** "+12%", "−5%", "0%"; null when there was nothing to compare with. */
export function formatPctDelta(pct: number | null | undefined): string | undefined {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return undefined;
  if (pct === 0) return '0%';
  return `${pct > 0 ? '+' : '-'}${Math.abs(pct)}%`;
}

/** Share of a total as a whole percent ("0%" when the total is zero). */
export function percentOf(part: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

/** Booking-status colours for charts (distinct hues on the brand palette). */
export const STATUS_CHART_COLORS: Record<string, string> = {
  pending: '#F5B82E',
  confirmed: '#2E569E',
  in_progress: '#2F8578',
  awaiting_verification: '#8FD03C',
  completed: '#159447',
  cancelled: '#B33F28',
};

/** Fallback series palette (brand first). */
export const CHART_PALETTE = ['#159447', '#2F8578', '#2E569E', '#F5B82E', '#8FD03C', '#B33F28', '#6B756E'];

/** Whole-percent change vs a previous value; null when the previous value is zero (nothing to compare). */
export function pctChangeOf(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
