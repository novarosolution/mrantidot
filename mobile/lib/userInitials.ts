/** First letter for compact avatar chips. */
export function userInitial(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'A';
  return trimmed[0].toUpperCase();
}

/** Up to two initials for larger displays. */
export function userInitials(name?: string | null, max = 2): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'AD';
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, max)
    .toUpperCase();
}
