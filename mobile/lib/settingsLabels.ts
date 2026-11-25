import { getBusinessSettings } from '@/lib/businessSettings';
import type { BusinessSettings, SettingsSlot, SettingsSlotGroup } from '@/types/api';

/**
 * Display helpers over the admin-managed business settings. Pass `settings` from
 * `useBusinessSettings()` inside components (so they re-render on change); plain helpers can omit it
 * and get the latest known copy.
 */
const pick = (s?: BusinessSettings) => s ?? getBusinessSettings();

function labelFrom(items: { key: string; label: string }[], key: string | null | undefined, fallback?: string): string {
  if (!key) return fallback ?? '';
  return items.find((i) => i.key === key)?.label ?? fallback ?? key.replace(/_/g, ' ');
}

/** "UPI / Card", "Pay after service"… */
export function paymentLabel(key?: string | null, s?: BusinessSettings): string {
  if (!key?.trim()) return '—';
  return labelFrom(pick(s).payments.methods, key);
}

/** Payment methods customers may choose right now, in admin order. */
export function activePaymentMethods(s?: BusinessSettings) {
  return pick(s).payments.methods.filter((m) => m.active);
}

/** "2 BHK", "Cafe / Restaurant"… */
export function propertyLabel(key?: string | null, s?: BusinessSettings): string {
  return labelFrom(pick(s).lists.propertyTypes, key);
}

export function activePropertyTypes(s?: BusinessSettings) {
  return pick(s).lists.propertyTypes.filter((p) => p.active);
}

/** Pest / treatment type name ("Bed Bug", "Termite"…). */
export function pestLabel(key?: string | null, s?: BusinessSettings): string {
  return labelFrom(pick(s).lists.pestTypes, key);
}

export function activePestTypes(s?: BusinessSettings) {
  return pick(s).lists.pestTypes.filter((p) => p.active);
}

/** Service category name ("Residential"…). */
export function categoryLabel(key?: string | null, s?: BusinessSettings): string {
  return labelFrom(pick(s).lists.categories, key);
}

export function activeCategories(s?: BusinessSettings) {
  return pick(s).lists.categories.filter((c) => c.active);
}

export function reviewTags(s?: BusinessSettings): string[] {
  return pick(s).lists.reviewTags;
}

export function activeLeaveTypes(s?: BusinessSettings) {
  return pick(s).lists.leaveTypes.filter((l) => l.active);
}

export function leaveTypeLabel(key?: string | null, s?: BusinessSettings): string {
  return labelFrom(pick(s).lists.leaveTypes, key);
}

/** Bookable time windows, in order. */
export function activeSlots(s?: BusinessSettings): SettingsSlot[] {
  return pick(s).slots.filter((x) => x.active);
}

/** Bookable windows grouped night / morning / afternoon / evening (empty groups dropped). */
export function slotGroups(s?: BusinessSettings): { group: SettingsSlotGroup; slots: SettingsSlot[] }[] {
  const order: SettingsSlotGroup[] = ['night', 'morning', 'afternoon', 'evening'];
  const slots = activeSlots(s);
  return order.map((group) => ({ group, slots: slots.filter((x) => x.group === group) })).filter((g) => g.slots.length > 0);
}

/** GST as a percentage number (18). */
export function gstPercent(s?: BusinessSettings): number {
  return pick(s).tax.gstPercent;
}

/** "18" / "12.5" — a rate without trailing zeros. */
export function formatPercent(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/**
 * GST line label with the current rate: fills {percent} in an admin label, swaps the number in one like
 * "GST (18%)", or builds "GST (18%)". Pass `percent` for a booking charged at its own stored rate.
 */
export function gstLabel(template?: string, s?: BusinessSettings, percent?: number): string {
  const pct = formatPercent(percent ?? gstPercent(s));
  const t = template?.trim() || 'GST ({percent}%)';
  if (t.includes('{percent}')) return t.replace(/\{percent\}/g, pct);
  if (/\d+(?:\.\d+)?\s*%/.test(t)) return t.replace(/\d+(?:\.\d+)?\s*%/, `${pct}%`);
  return t;
}

/** Display name of a slot group, from the admin-editable words when given (webSlotNight / Morning / …). */
export const SLOT_GROUP_COPY_KEY: Record<SettingsSlotGroup, 'webSlotNight' | 'webSlotMorning' | 'webSlotAfternoon' | 'webSlotEvening'> = {
  night: 'webSlotNight',
  morning: 'webSlotMorning',
  afternoon: 'webSlotAfternoon',
  evening: 'webSlotEvening',
};

const SLOT_GROUP_FALLBACK: Record<SettingsSlotGroup, string> = {
  night: 'Night',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function slotGroupTitle(group: SettingsSlotGroup, copy?: Partial<Record<string, string>>): string {
  return copy?.[SLOT_GROUP_COPY_KEY[group]]?.trim() || SLOT_GROUP_FALLBACK[group];
}

/* ─── Service area (mirrors server/src/utils/businessSettings.ts addressInServiceArea) ─── */

const areaWords = (x: string) =>
  x
    .toLowerCase()
    .replace(/(\d{3})\s+(\d{3})/g, '$1$2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** True when bookings are limited to listed cities / pincodes (and something is listed). */
export function serviceAreaLimited(s?: BusinessSettings): boolean {
  const area = pick(s).serviceArea;
  return area.mode === 'listed' && (area.cities.length > 0 || area.pincodes.length > 0);
}

/**
 * Would the server take a booking at this address? Saved addresses: pass city + pincode;
 * typed ones: pass the text (a 6-digit pincode or a listed city name inside it counts).
 */
export function addressInServiceArea(
  where: { city?: string | null; pincode?: string | null; text?: string | null },
  s?: BusinessSettings,
): boolean {
  if (!serviceAreaLimited(s)) return true;
  const { cities, pincodes } = pick(s).serviceArea;
  const text = areaWords(`${where.city ?? ''} ${where.text ?? ''}`);
  const pins = new Set(text.split(' ').filter((t) => /^\d{6}$/.test(t)));
  const pin = (where.pincode ?? '').replace(/\D/g, '');
  if (pin.length === 6) pins.add(pin);
  if (pincodes.some((p) => pins.has(p))) return true;
  const city = areaWords(where.city ?? '');
  const padded = ` ${text} `;
  return cities.some((c) => {
    const name = areaWords(c);
    return Boolean(name) && (name === city || padded.includes(` ${name} `));
  });
}

/** "Ahmedabad, Gandhinagar and 3 more" — the listed cities (pincodes when no city is listed). */
export function serviceAreaSummary(s?: BusinessSettings, max = 3): string {
  const { cities, pincodes } = pick(s).serviceArea;
  const names = cities.length ? cities : pincodes;
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')} +${names.length - max}`;
}
