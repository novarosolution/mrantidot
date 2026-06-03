import { formatBookingCount } from './formatCount';

export function formatRating(rating?: number | null): string | null {
  if (rating == null || Number.isNaN(rating) || rating <= 0) return null;
  return rating.toFixed(1);
}

export function formatSocialProof(bookingCount?: number, rating?: number | null): string | null {
  const parts: string[] = [];
  const r = formatRating(rating);
  if (r) parts.push(`★ ${r}`);
  const count = bookingCount ?? 0;
  if (count > 0) parts.push(`${formatBookingCount(count)} bookings`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function isMeaningfulDelta(delta?: string | null): boolean {
  if (!delta || delta === '—' || delta === '0%') return false;
  return true;
}

export function formatDelta(delta?: string): string {
  if (!delta) return '';
  if (delta.startsWith('-')) return `▼ ${delta.slice(1)}`;
  if (delta.startsWith('+') || delta.startsWith('▲')) return delta.replace(/^\+/, '▲ ');
  return `▲ ${delta}`;
}
