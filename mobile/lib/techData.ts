import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { localDateKey } from '@/lib/dates';
import type {
  AttendanceRecord,
  Booking,
  DayAttendanceStatus,
  LeaveRequest,
  TechnicianStats,
} from '@/types/api';

/**
 * Technician data cache — stale-while-revalidate, shared by every tech screen.
 *
 * - Screens render the last good copy at once (no spinner when coming back) and refetch only when it is
 *   older than its TTL — on mount, on focus, or when asked (pull-to-refresh, retry, after a mutation).
 * - A failed fetch keeps the last good copy and records `error`, so screens can show a quiet inline notice.
 * - Keys are per user, and everything is dropped on sign-out.
 */
type Entry = {
  data: unknown;
  /** When `data` was last fetched (0 = stale: seeded, invalidated or never fetched). */
  at: number;
  error: string | null;
  fetching: boolean;
};

const EMPTY: Entry = { data: undefined, at: 0, error: null, fetching: false };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();
/** Bumped by `clearTechData` so answers to requests started before sign-out are dropped. */
let generation = 0;

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function write(key: string, patch: Partial<Entry>) {
  store.set(key, { ...(store.get(key) ?? EMPTY), ...patch });
  emit(key);
}

function subscribe(key: string, listener: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

export function readTechData<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

/** Store a fresh copy (e.g. the booking a mutation returned). */
export function setTechData<T>(key: string, data: T): void {
  write(key, { data, at: Date.now(), error: null });
}

/** Change a cached copy in place without a request; its age is kept. No-op when nothing is cached. */
export function updateTechData<T>(key: string, change: (prev: T) => T): void {
  const prev = store.get(key);
  if (!prev || prev.data === undefined) return;
  write(key, { data: change(prev.data as T) });
}

/** Mark entries stale (their data stays on screen) so the next mount / focus refetches them. */
export function invalidateTechData(match: (key: string) => boolean): void {
  for (const [key, entry] of store) {
    if (match(key) && entry.at !== 0) write(key, { at: 0 });
  }
}

/** Drop everything — call on sign-out. */
export function clearTechData(): void {
  generation += 1;
  const keys = [...store.keys()];
  store.clear();
  inflight.clear();
  keys.forEach(emit);
}

/** Fetch into the cache unless a fresh copy exists. Never throws: failures land in `error`. */
export function fetchTechData<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttlMs, force = false }: { ttlMs: number; force?: boolean },
): Promise<void> {
  const running = inflight.get(key);
  if (running) return running;
  const cur = store.get(key);
  if (!force && cur && cur.data !== undefined && cur.at > 0 && Date.now() - cur.at < ttlMs) {
    return Promise.resolve();
  }
  const gen = generation;
  write(key, { fetching: true });
  const request = fetcher()
    .then(
      (data) => {
        if (gen === generation) write(key, { data, at: Date.now(), error: null, fetching: false });
      },
      (err: unknown) => {
        if (gen === generation) write(key, { error: getApiErrorMessage(err), fetching: false });
      },
    )
    .finally(() => {
      if (inflight.get(key) === request) inflight.delete(key);
    });
  inflight.set(key, request);
  return request;
}

export type TechQuery<T> = {
  data: T | undefined;
  /** Last failure, cleared by the next success. Data from before the failure stays in `data`. */
  error: string | null;
  /** Nothing to show yet and a request is (about to be) in flight — render a skeleton. */
  loading: boolean;
  /** A user-started refresh (pull-to-refresh, retry button) is running. */
  refreshing: boolean;
  /** Pull-to-refresh / retry: always refetches and flags `refreshing`. */
  refresh: () => Promise<void>;
  /** Quiet refetch — `force` skips the freshness check (after a mutation). */
  reload: (force?: boolean) => Promise<void>;
};

/**
 * Read a cached resource and keep it fresh: fetches on mount and on focus when older than `ttlMs`.
 * `seed` supplies data to show while the first request runs (e.g. the job from the jobs list).
 */
export function useTechQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  { ttlMs, seed }: { ttlMs: number; seed?: () => T | undefined },
): TechQuery<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const sub = useCallback((listener: () => void) => (key ? subscribe(key, listener) : () => undefined), [key]);
  const entry = useSyncExternalStore(sub, () => (key ? (store.get(key) ?? EMPTY) : EMPTY));
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(
    (force = false) =>
      key ? fetchTechData(key, () => fetcherRef.current(), { ttlMs, force }) : Promise.resolve(),
    [key, ttlMs],
  );

  useEffect(() => {
    void reload(false);
  }, [reload]);

  // Mount already fetched; later focuses refetch only stale data.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      void reload(false);
    }, [reload]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload(true);
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const data = (entry.data as T | undefined) ?? seed?.();
  return {
    data,
    error: entry.error,
    loading: data === undefined && (entry.fetching || !entry.error),
    refreshing,
    refresh,
    reload,
  };
}

/* ─── Technician resources ───────────────────────────────────────────── */

export type TechAttendance = {
  attendance: Record<string, DayAttendanceStatus>;
  todayStatus: DayAttendanceStatus;
  onDuty: boolean;
  todayRecord: AttendanceRecord | null;
};

/** "2026-11" — the month the jobs screen and profile hero report on. */
export function techCurrentMonth(): string {
  return localDateKey().slice(0, 7);
}

export const techKeys = {
  jobs: (uid: string) => `${uid}:jobs`,
  job: (uid: string, id: string) => `${uid}:job:${id}`,
  attendance: (uid: string, month: string) => `${uid}:attendance:${month}`,
  stats: (uid: string, month: string) => `${uid}:stats:${month}`,
  leave: (uid: string) => `${uid}:leave`,
};

async function fetchJobs(): Promise<Booking[]> {
  const { data } = await api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig);
  return data.bookings;
}

async function fetchJob(id: string): Promise<Booking> {
  const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`, screenLoadConfig);
  return data.booking;
}

async function fetchAttendance(month: string): Promise<TechAttendance> {
  const { data } = await api.get<{
    attendance?: Record<string, DayAttendanceStatus>;
    todayStatus?: DayAttendanceStatus;
    onDuty?: boolean;
    todayRecord?: AttendanceRecord | null;
  }>('/attendance/me', { ...screenLoadConfig, params: { month } });
  return {
    attendance: data.attendance ?? {},
    todayStatus: data.todayStatus ?? 'pending',
    onDuty: Boolean(data.onDuty),
    todayRecord: data.todayRecord ?? null,
  };
}

async function fetchStats(month: string): Promise<TechnicianStats> {
  const { data } = await api.get<TechnicianStats>('/stats/technician', { ...screenLoadConfig, params: { month } });
  return data;
}

async function fetchLeave(): Promise<LeaveRequest[]> {
  const { data } = await api.get<{ leaves: LeaveRequest[] }>('/leave/me', screenLoadConfig);
  return data.leaves;
}

function useTechUserId(): string | null {
  return useAuth().user?.id ?? null;
}

/** Everything assigned to this technician (all statuses). */
export function useTechJobs(): TechQuery<Booking[]> {
  const uid = useTechUserId();
  return useTechQuery(uid ? techKeys.jobs(uid) : null, fetchJobs, { ttlMs: CACHE_TTL.bookingsList });
}

/** One job — shows the copy from the jobs list straight away, then refreshes it. */
export function useTechJob(id: string): TechQuery<Booking> {
  const uid = useTechUserId();
  const fetcher = useCallback(() => fetchJob(id), [id]);
  const seed = useCallback(
    () => (uid && id ? readTechData<Booking[]>(techKeys.jobs(uid))?.find((b) => b.id === id) : undefined),
    [uid, id],
  );
  return useTechQuery(uid && id ? techKeys.job(uid, id) : null, fetcher, { ttlMs: CACHE_TTL.bookingDetail, seed });
}

/** Attendance calendar for a month; today's status / on-duty flag come from the current month. */
export function useTechAttendance(month: string): TechQuery<TechAttendance> {
  const uid = useTechUserId();
  const fetcher = useCallback(() => fetchAttendance(month), [month]);
  return useTechQuery(uid ? techKeys.attendance(uid, month) : null, fetcher, { ttlMs: CACHE_TTL.stats });
}

/** Earnings, counts and analytics for a month. */
export function useTechStats(month: string): TechQuery<TechnicianStats> {
  const uid = useTechUserId();
  const fetcher = useCallback(() => fetchStats(month), [month]);
  return useTechQuery(uid ? techKeys.stats(uid, month) : null, fetcher, { ttlMs: CACHE_TTL.stats });
}

export function useTechLeave(): TechQuery<LeaveRequest[]> {
  const uid = useTechUserId();
  return useTechQuery(uid ? techKeys.leave(uid) : null, fetchLeave, { ttlMs: CACHE_TTL.stats });
}

/** A job changed (OTP verified, step saved): update its own copy and its row in the jobs list. */
export function storeTechJob(uid: string, booking: Booking): void {
  setTechData(techKeys.job(uid, booking.id), booking);
  updateTechData<Booking[]>(techKeys.jobs(uid), (list) => list.map((b) => (b.id === booking.id ? booking : b)));
}

/** Earnings and counts move when a job starts or finishes — refetch them on the next visit. */
export function invalidateTechStats(uid: string): void {
  invalidateTechData((key) => key.startsWith(`${uid}:stats:`));
}
