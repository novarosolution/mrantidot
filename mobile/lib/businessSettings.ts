import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_BUSINESS_SETTINGS } from '@/constants/businessSettingsDefaults';
import type { BusinessSettings } from '@/types/api';

/**
 * Admin-managed business rules (tax, slots, booking rules, lists, service area, payments, app status).
 * One shared copy for the whole app: starts from the bundled defaults (or the copy saved on the last run),
 * refreshes from `GET /settings` at most once a minute, and notifies every screen that uses it.
 *
 *   const settings = useBusinessSettings();          // in components
 *   getBusinessSettings().tax.gstPercent             // in plain helpers (latest known copy)
 *   await refreshBusinessSettings(true)              // after an admin save / when the app returns to the foreground
 */
let current: BusinessSettings = DEFAULT_BUSINESS_SETTINGS;
let fetchedAt = 0;
let inflight: Promise<BusinessSettings> | null = null;
let restoreStarted = false;
const listeners = new Set<() => void>();
const FRESH_MS = 60_000;
/** Last copy from the server, so a cold start offline still knows the rules (and a maintenance switch). */
const STORAGE_KEY = 'mrantidot.businessSettings.v1';

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  Boolean(x) && typeof x === 'object' && !Array.isArray(x);

/** Server (or saved) copy over the bundled defaults, two levels deep so newer fields always exist. */
function withDefaults(raw: unknown): BusinessSettings {
  if (!isPlainObject(raw)) return DEFAULT_BUSINESS_SETTINGS;
  const out: Record<string, unknown> = { ...DEFAULT_BUSINESS_SETTINGS };
  for (const [key, def] of Object.entries(DEFAULT_BUSINESS_SETTINGS)) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    out[key] = isPlainObject(def) && isPlainObject(value) ? { ...def, ...value } : value;
  }
  return out as unknown as BusinessSettings;
}

export function getBusinessSettings(): BusinessSettings {
  return current;
}

function setCurrent(next: BusinessSettings) {
  current = next;
  listeners.forEach((l) => l());
}

function persist(next: BusinessSettings) {
  try {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  } catch {
    // Storage unavailable (e.g. private browser mode) — the in-memory copy is enough.
  }
}

/** Loads the copy saved on the last run, unless a fresh one has already arrived. */
function restoreSaved() {
  if (restoreStarted) return;
  restoreStarted = true;
  try {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || fetchedAt) return;
        setCurrent(withDefaults(JSON.parse(raw)));
      })
      .catch(() => undefined);
  } catch {
    // No storage — keep the bundled defaults.
  }
}

export function refreshBusinessSettings(force = false): Promise<BusinessSettings> {
  restoreSaved();
  if (!force && Date.now() - fetchedAt < FRESH_MS) return Promise.resolve(current);
  if (inflight) return inflight;
  inflight = api
    .get<{ settings: BusinessSettings }>('/settings', { skipCache: true, skipErrorToast: true })
    .then(({ data }) => {
      fetchedAt = Date.now();
      if (data?.settings) {
        const next = withDefaults(data.settings);
        setCurrent(next);
        persist(next);
      }
      return current;
    })
    .catch(() => current)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Replace the shared copy (e.g. with the result of an admin save). */
export function setBusinessSettings(next: BusinessSettings): void {
  fetchedAt = Date.now();
  const merged = withDefaults(next);
  setCurrent(merged);
  persist(merged);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Current business rules; re-renders when they change. Never null (bundled defaults until loaded). */
export function useBusinessSettings(): BusinessSettings {
  const value = useSyncExternalStore(subscribe, getBusinessSettings, getBusinessSettings);
  useEffect(() => {
    void refreshBusinessSettings();
  }, []);
  return value;
}

/** Active items of a settings list, in admin order. */
export function activeItems<T extends { active: boolean }>(items: T[]): T[] {
  return items.filter((i) => i.active);
}
