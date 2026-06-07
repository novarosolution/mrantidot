/** Normalize phone for lookup: digits only, strip leading country code 91 when present. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

/** All plausible stored phone values for a login identifier (handles legacy formats). */
export function phoneLookupVariants(input: string): string[] {
  const digits = input.replace(/\D/g, '');
  const normalized = normalizePhone(input);
  const variants = new Set<string>([normalized, digits]);

  if (digits.length === 10) {
    variants.add(`91${digits}`);
    variants.add(`0${digits}`);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    variants.add(digits.slice(2));
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    variants.add(digits.slice(1));
  }

  return [...variants].filter(Boolean);
}
