export function formatBookingCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  if (n > 0) return `${n}`;
  return '';
}
