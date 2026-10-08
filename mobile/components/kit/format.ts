export function formatRupee(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

export function formatRupeeFull(n: number): string {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

export function plural(n: number, word: string): string {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** "2026-10-08" → "8 Oct" (adds the year when it isn't the current one). */
export function formatDayKey(key?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key ?? '');
  if (!m) return key ?? '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function bookingRef(id: string): string {
  return `#MA-${id.slice(-5).toUpperCase()}`;
}

/**
 * Clean a CMS-authored button label for a CTA that renders its own arrow icon.
 * Admins naturally type "Book Now →", which would otherwise render two arrows.
 */
export function ctaLabelText(raw?: string | null): string {
  return (raw ?? '').replace(/[\s ]*[→⇒➔➜»>▸▶]+[\s ]*$/u, '').trim();
}
