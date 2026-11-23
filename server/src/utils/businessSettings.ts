import { BusinessSettingsModel } from '../models/BusinessSettings';
import { AppContent, DEFAULT_CUSTOMER_UI_COPY } from '../models/AppContent';
import { PROPERTY_TYPE_DEFAULT_LABELS, PROPERTY_TYPE_KEYS, setLivePropertyTypeLabels } from '../constants/propertyTypes';
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS } from '../constants/serviceTypes';
import { AppError } from './AppError';

/* ------------------------------------------------------------------ */
/* Shape                                                               */
/* ------------------------------------------------------------------ */

export type SlotGroup = 'night' | 'morning' | 'afternoon' | 'evening';
export type ListItem = { key: string; label: string; active: boolean };
export type PropertyItem = ListItem & { group: 'home' | 'business' };
export type SlotItem = { key: string; from: string; to: string; group: SlotGroup; active: boolean };
export type MessageTemplate = { title: string; body: string };

export interface BusinessSettings {
  tax: { gstPercent: number };
  invoice: { legalName: string; gstin: string; address: string; prefix: string; footer: string };
  slots: SlotItem[];
  booking: {
    /** Minutes between now and the start of the earliest bookable slot (0 = any slot that hasn't started). */
    leadMinutes: number;
    /** How many days ahead the server accepts bookings. */
    horizonDays: number;
    /** How many days the customer date picker shows. */
    pickerDays: number;
    /** Customers can't cancel within this many hours of the visit (0 = any time before work starts). */
    cancelCutoffHours: number;
    /** Customers can't reschedule within this many hours of the visit (0 = any time before work starts). */
    rescheduleCutoffHours: number;
    /** Reschedules allowed per booking (0 = unlimited). */
    maxReschedules: number;
    /** New bookings skip "pending" and are confirmed straight away. */
    autoConfirm: boolean;
    /** Confirmed bookings get the least-busy on-duty technician automatically. */
    autoAssign: boolean;
  };
  lists: {
    categories: ListItem[];
    propertyTypes: PropertyItem[];
    /** Pest / treatment type names (keys are fixed: the app ships artwork for each). */
    pestTypes: ListItem[];
    reviewTags: string[];
    /** Technician leave types (keys are fixed by the leave model). */
    leaveTypes: ListItem[];
  };
  serviceArea: { mode: 'anywhere' | 'listed'; cities: string[]; pincodes: string[] };
  payments: { methods: ListItem[] };
  customers: { vipSpend: number; vipBookings: number };
  app: { maintenance: boolean; maintenanceMessage: string; minVersion: string; iosUrl: string; androidUrl: string };
  /** Notification texts, keyed "<event>.<audience>" (e.g. "assigned.customer"). Placeholders: {service} {ref} {date} {time}. */
  messages: Record<string, MessageTemplate>;
}

export type BusinessSettingsView = BusinessSettings & { updatedAt: string };
/** What the apps and the website may read (no notification texts). */
export type PublicBusinessSettings = Omit<BusinessSettings, 'messages'> & { updatedAt: string };

/* ------------------------------------------------------------------ */
/* Defaults = today's built-in behaviour                               */
/* ------------------------------------------------------------------ */

const SLOT_GROUP_OF = (from: string): SlotGroup => {
  const h = Number(from.slice(0, 2));
  return h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
};

const DEFAULT_SLOTS: SlotItem[] = [
  '00:00-02:00', '02:00-04:00', '04:00-06:00', '06:00-08:00', '08:00-10:00', '10:00-12:00',
  '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00', '22:00-00:00',
].map((key) => {
  const [from, to] = key.split('-');
  return { key, from, to, group: SLOT_GROUP_OF(from), active: true };
});

const HOME_PROPERTY = new Set(['1bhk', '2bhk', '3bhk', '4bhk', 'bungalow']);

export const LEAVE_TYPE_KEYS = ['casual', 'sick', 'emergency', 'other'] as const;
export const PAYMENT_METHOD_KEYS = ['upi_card', 'pay_after'] as const;

/** Notification events and who hears about them. Defaults match the texts that used to be in code. */
export const DEFAULT_MESSAGES: Record<string, MessageTemplate> = {
  'schedule_requested.customer': { title: 'Booking request received', body: 'We received your booking. Our team will confirm your visit time shortly.' },
  'schedule_requested.admin': { title: 'Schedule to confirm', body: 'A customer requested a visit. Review and confirm the schedule.' },
  'schedule_confirmed.customer': { title: 'Visit scheduled', body: 'Your visit time has been confirmed. We will assign a service expert shortly.' },
  'schedule_confirmed.admin': { title: 'Schedule confirmed', body: 'Visit confirmed for {date} · {time}. Assign a technician when ready.' },
  'reschedule_requested.admin': { title: 'Reschedule requested', body: 'Customer asked to move the visit to {date} · {time}. Confirm the new time.' },
  'reschedule_requested.tech': { title: 'Job rescheduled', body: 'The customer moved this visit. It has been removed from your schedule until it is reassigned.' },
  'rescheduled.customer': { title: 'Visit rescheduled', body: 'Your visit is now on {date} · {time}.' },
  'rescheduled.tech': { title: 'Job rescheduled', body: 'This job is now on {date} · {time}.' },
  'rescheduled.admin': { title: 'Visit rescheduled', body: 'Customer moved the visit to {date} · {time}. The new time is confirmed.' },
  'confirmed.customer': { title: 'Booking confirmed', body: 'Your service has been confirmed. We will assign a service expert shortly.' },
  'confirmed.admin': { title: 'New booking', body: 'A customer placed a new booking. Review and assign if needed.' },
  'assigned.customer': { title: 'Visit scheduled', body: 'A service expert has been assigned. Your start code is ready when they arrive.' },
  'assigned.tech': { title: 'New job assigned', body: 'You have been assigned a new service job.' },
  'in_progress.customer': { title: 'Service in progress', body: 'Treatment has started at your location.' },
  'awaiting_verification.customer': { title: 'Treatment finished', body: 'Review the photos, then share your completion code with the technician.' },
  'awaiting_verification.admin': { title: 'Job awaiting verification', body: 'A booking is ready for admin review and verification.' },
  'completed.customer': { title: 'Service completed', body: 'Thank you! You can leave a review for your visit.' },
  'completed.tech': { title: 'Job completed', body: 'The job is marked complete. Great work!' },
  'cancelled.customer': { title: 'Booking cancelled', body: 'Your booking has been cancelled.' },
  'cancelled.tech': { title: 'Job cancelled', body: 'An assigned job was cancelled.' },
  'cancelled.admin': { title: 'Booking cancelled', body: 'A booking was cancelled and may need follow-up.' },
  'start_otp_ready.customer': { title: 'Start code ready', body: 'Share your start code with the technician when they arrive.' },
  'start_otp_ready.tech': { title: 'Ask for start code', body: 'Ask the customer for their start code to begin the job.' },
  'start_otp_ready.admin': { title: 'Start OTP issued', body: 'Customer received a start code for this booking.' },
  'end_otp_ready.customer': { title: 'Completion code ready', body: 'Share your end code with the technician to finish the job.' },
  'end_otp_ready.tech': { title: 'Ask for end code', body: 'Ask the customer for their completion code to finish the job.' },
  'end_otp_ready.admin': { title: 'End OTP issued', body: 'Customer received a completion code for this booking.' },
  'work_started.customer': { title: 'Work started', body: 'Your technician has started the treatment.' },
  'work_started.tech': { title: 'Job started', body: 'You have started this job on site.' },
  'work_started.admin': { title: 'Work started', body: 'Technician verified the start code and began work.' },
  'work_completed.customer': { title: 'Service completed', body: 'Thank you! You can leave a review for your technician.' },
  'work_completed.tech': { title: 'Job completed', body: 'Completion code verified. Great work!' },
  'work_completed.admin': { title: 'Job completed', body: 'End code verified and booking marked complete.' },
  // Technician leave. Placeholders: {name} technician, {type} leave type, {date} dates, {note} reason / admin note.
  'leave_requested.admin': { title: 'Leave request', body: '{name} asked for {type} leave on {date}. {note}' },
  'leave_approved.tech': { title: 'Leave approved', body: 'Your {type} leave for {date} is approved. {note}' },
  'leave_rejected.tech': { title: 'Leave not approved', body: 'Your {type} leave for {date} was not approved. {note}' },
};

export function defaultBusinessSettings(): BusinessSettings {
  return {
    tax: { gstPercent: 18 },
    invoice: { legalName: '', gstin: '', address: '', prefix: 'INV-', footer: '' },
    slots: DEFAULT_SLOTS.map((s) => ({ ...s })),
    booking: {
      leadMinutes: 0,
      horizonDays: 90,
      pickerDays: 7,
      cancelCutoffHours: 0,
      rescheduleCutoffHours: 0,
      maxReschedules: 0,
      autoConfirm: false,
      autoAssign: false,
    },
    lists: {
      categories: [
        { key: 'residential', label: 'Residential', active: true },
        { key: 'commercial', label: 'Commercial', active: true },
        { key: 'cleaning', label: 'Cleaning', active: true },
        { key: 'general', label: 'General', active: true },
      ],
      propertyTypes: PROPERTY_TYPE_KEYS.map((key) => ({
        key,
        label: PROPERTY_TYPE_DEFAULT_LABELS[key],
        group: HOME_PROPERTY.has(key) ? ('home' as const) : ('business' as const),
        active: true,
      })),
      pestTypes: SERVICE_TYPE_KEYS.map((key) => ({ key, label: SERVICE_TYPE_LABELS[key], active: true })),
      reviewTags: ['On time', 'Professional', 'No smell', 'Thorough', 'Polite'],
      leaveTypes: [
        { key: 'casual', label: 'Casual', active: true },
        { key: 'sick', label: 'Sick', active: true },
        { key: 'emergency', label: 'Emergency', active: true },
        { key: 'other', label: 'Other', active: true },
      ],
    },
    serviceArea: { mode: 'anywhere', cities: [], pincodes: [] },
    payments: {
      methods: [
        { key: 'upi_card', label: 'UPI / Card', active: true },
        { key: 'pay_after', label: 'Pay after service', active: true },
      ],
    },
    customers: { vipSpend: 2000, vipBookings: 3 },
    app: { maintenance: false, maintenanceMessage: '', minVersion: '', iosUrl: '', androidUrl: '' },
    messages: { ...DEFAULT_MESSAGES },
  };
}

/* ------------------------------------------------------------------ */
/* Cleaning helpers                                                    */
/* ------------------------------------------------------------------ */

const rec = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const str = (x: unknown, max = 200): string => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const bool = (x: unknown, fallback: boolean): boolean => (typeof x === 'boolean' ? x : fallback);
function num(x: unknown, fallback: number, min: number, max: number): number {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() ? Number(x) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
const KEY_RE = /^[a-z0-9_]{1,40}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const VERSION_RE = /^\d+(\.\d+){0,2}$/;

function listItems(raw: unknown, fallback: ListItem[], fixedKeys?: readonly string[]): ListItem[] {
  if (!Array.isArray(raw)) return fallback.map((i) => ({ ...i }));
  const seen = new Set<string>();
  const out: ListItem[] = [];
  for (const x of arr(raw)) {
    const r = rec(x);
    const key = str(r.key, 40).toLowerCase();
    if (!KEY_RE.test(key) || seen.has(key)) continue;
    if (fixedKeys && !fixedKeys.includes(key)) continue;
    seen.add(key);
    const def = fallback.find((f) => f.key === key);
    out.push({ key, label: str(r.label, 60) || def?.label || key, active: bool(r.active, true) });
  }
  // Fixed lists always keep every key (the app has artwork / the model has an enum for them).
  if (fixedKeys) for (const f of fallback) if (!seen.has(f.key)) out.push({ ...f });
  return out;
}

function cleanSlots(raw: unknown, fallback: SlotItem[]): SlotItem[] {
  if (!Array.isArray(raw)) return fallback.map((s) => ({ ...s }));
  const seen = new Set<string>();
  const out: SlotItem[] = [];
  for (const x of arr(raw)) {
    const r = rec(x);
    const from = str(r.from, 5);
    const to = str(r.to, 5);
    if (!TIME_RE.test(from) || !TIME_RE.test(to) || from === to) continue;
    const key = `${from}-${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const group = ['night', 'morning', 'afternoon', 'evening'].includes(String(r.group)) ? (r.group as SlotGroup) : SLOT_GROUP_OF(from);
    out.push({ key, from, to, group, active: bool(r.active, true) });
  }
  return out.sort((a, b) => a.from.localeCompare(b.from));
}

/** Fills gaps from the defaults and clamps everything to safe values. */
export function normalizeBusinessSettings(raw: unknown): BusinessSettings {
  const d = defaultBusinessSettings();
  const r = rec(raw);
  const tax = rec(r.tax);
  const inv = rec(r.invoice);
  const bk = rec(r.booking);
  const lists = rec(r.lists);
  const area = rec(r.serviceArea);
  const pay = rec(r.payments);
  const cust = rec(r.customers);
  const app = rec(r.app);
  const msgs = rec(r.messages);
  const horizonDays = num(bk.horizonDays, d.booking.horizonDays, 1, 365);

  const propertyTypes: PropertyItem[] = Array.isArray(lists.propertyTypes)
    ? listItems(lists.propertyTypes, d.lists.propertyTypes).map((i) => {
        const rawItem = rec(arr(lists.propertyTypes).find((x) => str(rec(x).key, 40).toLowerCase() === i.key));
        const def = d.lists.propertyTypes.find((p) => p.key === i.key);
        const group = rawItem.group === 'home' || rawItem.group === 'business' ? rawItem.group : def?.group ?? 'home';
        return { ...i, group };
      })
    : d.lists.propertyTypes;

  const messages: Record<string, MessageTemplate> = { ...d.messages };
  for (const key of Object.keys(DEFAULT_MESSAGES)) {
    const m = rec(msgs[key]);
    const title = str(m.title, 80);
    const body = str(m.body, 300);
    if (title || body) messages[key] = { title: title || DEFAULT_MESSAGES[key].title, body: body || DEFAULT_MESSAGES[key].body };
  }

  return {
    tax: { gstPercent: num(tax.gstPercent, d.tax.gstPercent, 0, 40) },
    invoice: {
      legalName: str(inv.legalName, 120),
      gstin: str(inv.gstin, 20).toUpperCase(),
      address: str(inv.address, 300),
      prefix: str(inv.prefix, 12) || d.invoice.prefix,
      footer: str(inv.footer, 300),
    },
    slots: cleanSlots(r.slots, d.slots),
    booking: {
      leadMinutes: num(bk.leadMinutes, d.booking.leadMinutes, 0, 72 * 60),
      horizonDays,
      // The date picker never offers days the server would refuse (today + horizonDays).
      pickerDays: Math.min(num(bk.pickerDays, d.booking.pickerDays, 1, 60), horizonDays + 1),
      cancelCutoffHours: num(bk.cancelCutoffHours, d.booking.cancelCutoffHours, 0, 168),
      rescheduleCutoffHours: num(bk.rescheduleCutoffHours, d.booking.rescheduleCutoffHours, 0, 168),
      maxReschedules: num(bk.maxReschedules, d.booking.maxReschedules, 0, 20),
      autoConfirm: bool(bk.autoConfirm, d.booking.autoConfirm),
      autoAssign: bool(bk.autoAssign, d.booking.autoAssign),
    },
    lists: {
      categories: listItems(lists.categories, d.lists.categories),
      propertyTypes,
      pestTypes: listItems(lists.pestTypes, d.lists.pestTypes, SERVICE_TYPE_KEYS),
      reviewTags: Array.isArray(lists.reviewTags)
        ? [...new Set(arr(lists.reviewTags).map((t) => str(t, 40)).filter(Boolean))].slice(0, 20)
        : d.lists.reviewTags,
      leaveTypes: listItems(lists.leaveTypes, d.lists.leaveTypes, LEAVE_TYPE_KEYS),
    },
    serviceArea: {
      mode: area.mode === 'listed' ? 'listed' : 'anywhere',
      cities: [...new Set(arr(area.cities).map((c) => str(c, 60)).filter(Boolean))].slice(0, 200),
      pincodes: [...new Set(arr(area.pincodes).map((p) => str(p, 6)).filter((p) => /^\d{6}$/.test(p)))].slice(0, 2000),
    },
    payments: { methods: listItems(pay.methods, d.payments.methods, PAYMENT_METHOD_KEYS) },
    customers: {
      vipSpend: num(cust.vipSpend, d.customers.vipSpend, 0, 10_000_000),
      vipBookings: num(cust.vipBookings, d.customers.vipBookings, 0, 1000),
    },
    app: {
      maintenance: bool(app.maintenance, d.app.maintenance),
      maintenanceMessage: str(app.maintenanceMessage, 300),
      minVersion: VERSION_RE.test(str(app.minVersion, 20)) ? str(app.minVersion, 20) : '',
      iosUrl: /^https:\/\//.test(str(app.iosUrl, 300)) ? str(app.iosUrl, 300) : '',
      androidUrl: /^https:\/\//.test(str(app.androidUrl, 300)) ? str(app.androidUrl, 300) : '',
    },
    messages,
  };
}

/* ------------------------------------------------------------------ */
/* Read (cached) / write                                               */
/* ------------------------------------------------------------------ */

const CACHE_MS = 30_000;
let cache: { at: number; value: BusinessSettingsView } | null = null;

async function loadDoc() {
  let doc = await BusinessSettingsModel.findOne({ key: 'business' });
  if (!doc) {
    try {
      doc = await BusinessSettingsModel.create({ key: 'business', settings: {} });
    } catch {
      doc = await BusinessSettingsModel.findOne({ key: 'business' });
    }
  }
  if (!doc) throw new AppError(500, 'Business settings unavailable');
  return doc;
}

/** Current rules (defaults filled in). Cached for 30 s; saving clears the cache. */
export async function getBusinessSettings(): Promise<BusinessSettingsView> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const doc = await loadDoc();
  const value = { ...normalizeBusinessSettings(doc.settings), updatedAt: (doc.updatedAt ?? new Date()).toISOString() };
  cache = { at: Date.now(), value };
  // Synchronous label lookups (booking JSON) follow the admin's names.
  setLivePropertyTypeLabels(Object.fromEntries(value.lists.propertyTypes.map((p) => [p.key, p.label])));
  return value;
}

export function publicBusinessSettings(s: BusinessSettingsView): PublicBusinessSettings {
  const { messages: _messages, ...rest } = s;
  return rest;
}

/** Groups an admin may send; each group present replaces the saved one as a whole. */
export const SETTINGS_GROUPS = ['tax', 'invoice', 'slots', 'booking', 'lists', 'serviceArea', 'payments', 'customers', 'app', 'messages'] as const;

/**
 * Applies an admin save. `updatedAt` (from the last read) must match, so two admins can't silently
 * overwrite each other. Returns the new rules.
 */
export async function saveBusinessSettings(
  patch: Record<string, unknown>,
  userId: string,
  sentUpdatedAt?: string,
): Promise<BusinessSettingsView> {
  const doc = await loadDoc();
  if (sentUpdatedAt && doc.updatedAt && sentUpdatedAt !== doc.updatedAt.toISOString()) {
    throw new AppError(409, 'Someone else saved the settings meanwhile. Reload to see their changes, then save again.');
  }
  const current = normalizeBusinessSettings(doc.settings) as unknown as Record<string, unknown>;
  for (const g of SETTINGS_GROUPS) {
    if (g in patch) current[g] = patch[g];
  }
  const next = normalizeBusinessSettings(current);
  if (!next.slots.some((s) => s.active)) throw new AppError(400, 'Keep at least one time slot switched on.');
  if (!next.payments.methods.some((m) => m.active)) throw new AppError(400, 'Keep at least one payment method switched on.');
  if (!next.lists.categories.some((c) => c.active)) throw new AppError(400, 'Keep at least one service category switched on.');
  if (!next.lists.propertyTypes.some((p) => p.active)) throw new AppError(400, 'Keep at least one property type switched on.');
  if (next.serviceArea.mode === 'listed' && next.serviceArea.cities.length === 0 && next.serviceArea.pincodes.length === 0) {
    throw new AppError(400, 'Add at least one city or pincode to the service area, or choose “Anywhere”.');
  }
  doc.set('settings', next);
  doc.markModified('settings');
  doc.set('updatedBy', userId);
  await doc.save();
  cache = null;
  return getBusinessSettings();
}

/** Fills a message template: "{service} on {date}" with the given values; unknown placeholders stay empty. */
export function fillTemplate(text: string, vars: Record<string, string | number | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] === undefined ? '' : String(vars[k]))).replace(/\s{2,}/g, ' ').trim();
}

/** Template for an event/audience, falling back to the built-in text. */
export async function messageFor(event: string, audience: 'customer' | 'tech' | 'admin'): Promise<MessageTemplate | undefined> {
  const key = `${event}.${audience}`;
  const s = await getBusinessSettings();
  return s.messages[key] ?? DEFAULT_MESSAGES[key];
}

/**
 * Last known rules without waiting — for synchronous code paths (labels, admin-side checks).
 * Built-in defaults until the first read; a stale copy triggers a background refresh.
 */
export function peekBusinessSettings(): BusinessSettings {
  if (!cache || Date.now() - cache.at >= CACHE_MS) void getBusinessSettings().catch(() => undefined);
  return cache?.value ?? defaultBusinessSettings();
}

/* ------------------------------------------------------------------ */
/* Lookups used by the booking / service / invoice code                */
/* ------------------------------------------------------------------ */

/** Display label for a key of a settings list ("2bhk" → "2 BHK"); unknown keys read as words. */
export function listLabel(items: { key: string; label: string }[], key?: string | null): string {
  if (!key) return '';
  return items.find((i) => i.key === key)?.label ?? key.replace(/_/g, ' ');
}

const areaWords = (x: string) =>
  x
    .toLowerCase()
    .replace(/(\d{3})\s+(\d{3})/g, '$1$2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * True when the service area takes this address: mode "anywhere", nothing listed yet, or the address's
 * pincode / city is on the list. Free-text addresses are searched for a 6-digit pincode and listed city names.
 */
export function addressInServiceArea(
  s: Pick<BusinessSettings, 'serviceArea'>,
  where: { city?: string; pincode?: string; text?: string },
): boolean {
  const { mode, cities, pincodes } = s.serviceArea;
  if (mode !== 'listed' || (cities.length === 0 && pincodes.length === 0)) return true;
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

/* ------------------------------------------------------------------ */
/* Customer-facing words for server messages                           */
/* ------------------------------------------------------------------ */

let copyCache: { at: number; value: Record<string, string> } | null = null;

/** Admin-edited customer words (Content → Customer screens), built-in defaults underneath. Cached 30 s. */
async function customerUiCopy(): Promise<Record<string, string>> {
  if (copyCache && Date.now() - copyCache.at < CACHE_MS) return copyCache.value;
  const value: Record<string, string> = { ...(DEFAULT_CUSTOMER_UI_COPY as unknown as Record<string, string>) };
  try {
    const doc = await AppContent.findOne({ key: 'app' }).select('appConfig.customerUi').lean();
    const saved = rec((doc as { appConfig?: { customerUi?: unknown } } | null)?.appConfig?.customerUi);
    for (const [k, v] of Object.entries(saved)) if (typeof v === 'string' && v.trim()) value[k] = v;
  } catch {
    // Built-in words are fine when the content document can't be read.
  }
  copyCache = { at: Date.now(), value };
  return value;
}

/** A customer-facing sentence from a copy key ({placeholders} filled); `fallback` when the key is empty. */
export async function customerText(
  key: string,
  fallback: string,
  vars: Record<string, string | number | undefined> = {},
): Promise<string> {
  const copy = await customerUiCopy();
  return fillTemplate(copy[key]?.trim() || fallback, vars);
}

/** "30 mins", "2 hrs", "1 hr 30 mins" — unit words from the admin-editable copy. */
export async function durationText(mins: number): Promise<string> {
  const copy = await customerUiCopy();
  const m = Math.max(0, Math.round(mins));
  const minsWord = copy.webUnitMins || 'mins';
  if (m < 60) return `${m} ${minsWord}`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hrs = `${h} ${h === 1 ? copy.webUnitHr || 'hr' : copy.webUnitHrs || 'hrs'}`;
  return rest ? `${hrs} ${rest} ${minsWord}` : hrs;
}
