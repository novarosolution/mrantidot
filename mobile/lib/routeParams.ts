/** Normalize expo-router param that may be string | string[]. */
export function paramString(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
