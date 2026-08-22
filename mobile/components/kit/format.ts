export function formatRupee(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
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
