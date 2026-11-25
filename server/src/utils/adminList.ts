import { Types } from 'mongoose';
import { AppError } from './AppError';

/**
 * Shared helpers for the admin list endpoints: paging, sorting, search and IST date ranges.
 *
 * Paging contract (every admin list):
 *   ?page=1&limit=25 (limit max 100)  →  { <items>: [...], total, page, pageSize, hasMore }
 */

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/** Business time zone for day buckets and date filters (same env as utils/dateKey.ts). */
export const BUSINESS_TZ = process.env.APP_TZ || 'Asia/Kolkata';

type Query = Record<string, unknown>;

export type PageParams = { page: number; limit: number; skip: number };

function intParam(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** True when the caller asked for paging (sent `page` or `limit`). */
export function wantsPaging(query: Query): boolean {
  return intParam(query.page) !== undefined || intParam(query.limit) !== undefined;
}

/** `page` (1-based) and `limit` (default 25, max 100) from the query string. */
export function parsePaging(
  query: Query,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): PageParams {
  const maxLimit = opts.maxLimit ?? MAX_PAGE_SIZE;
  const defaultLimit = opts.defaultLimit ?? DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(intParam(query.limit) ?? defaultLimit, 1), maxLimit);
  const page = Math.max(intParam(query.page) ?? 1, 1);
  return { page, limit, skip: (page - 1) * limit };
}

/** The paging fields every list response carries next to its array. */
export function pageMeta(total: number, paging: PageParams) {
  return {
    total,
    page: paging.page,
    pageSize: paging.limit,
    hasMore: paging.skip + paging.limit < total,
  };
}

export type SortOrder = 1 | -1;

/**
 * `sort` / `order` from the query, limited to the keys a list allows. `allowed` maps the public sort key
 * to one or more Mongo fields (a tie-breaker field keeps pages stable).
 */
export function parseSort(
  query: Query,
  allowed: Record<string, string[]>,
  fallback: { key: string; order: 'asc' | 'desc' },
): { key: string; order: 'asc' | 'desc'; spec: Record<string, SortOrder> } {
  const rawKey = typeof query.sort === 'string' ? query.sort.trim() : '';
  const key = rawKey && allowed[rawKey] ? rawKey : fallback.key;
  const rawOrder = typeof query.order === 'string' ? query.order.trim().toLowerCase() : '';
  const order: 'asc' | 'desc' = rawOrder === 'asc' || rawOrder === 'desc' ? rawOrder : key === fallback.key ? fallback.order : 'asc';
  const dir: SortOrder = order === 'asc' ? 1 : -1;
  const spec: Record<string, SortOrder> = {};
  for (const field of allowed[key] ?? []) spec[field] = dir;
  if (!('_id' in spec)) spec._id = dir;
  return { key, order, spec };
}

/** Escapes user text for a case-insensitive "contains" regex; null when there is nothing to search. */
export function searchRegex(raw: unknown, max = 100): RegExp | null {
  if (typeof raw !== 'string') return null;
  const q = raw.trim().slice(0, max);
  if (!q) return null;
  return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

/** Digits of a phone-like search ("+91 98765" → "98765"); null when fewer than 3 digits. */
export function phoneDigits(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.length >= 3 ? digits : null;
}

export function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && Types.ObjectId.isValid(value);
}

/** An optional id from the query: undefined when absent, 400 when malformed. */
export function optionalObjectId(value: unknown, label: string): Types.ObjectId | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (!isObjectId(value)) throw new AppError(400, `Invalid ${label}`);
  return new Types.ObjectId(value);
}

/** 400 unless `value` is a valid ObjectId. */
export function requireObjectId(value: unknown, label: string): Types.ObjectId {
  if (!isObjectId(value)) throw new AppError(400, `Invalid ${label}`);
  return new Types.ObjectId(value);
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` query value: undefined when absent, 400 when malformed. */
export function optionalDateKey(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) {
    throw new AppError(400, `${label} must be YYYY-MM-DD`);
  }
  const [y, m, d] = value.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new AppError(400, `${label} is not a real date`);
  }
  return value;
}

/** Minutes the zone is ahead of UTC at `at` (IST: 330). */
function zoneOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** The instant a business-calendar day starts (`2026-11-23` → 2026-11-22T18:30Z in IST). */
export function startOfBusinessDay(dateKey: string, timeZone = BUSINESS_TZ): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  return new Date(guess.getTime() - zoneOffsetMinutes(guess, timeZone) * 60_000);
}

/** `YYYY-MM-DD` shifted by whole days (calendar arithmetic, no time zone involved). */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`, both included (`2026-11-01`…`2026-11-30` → 30). */
export function daysInclusive(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000) + 1;
}

/** Instants covering business days `from`…`to` (inclusive): `{ start, end }` with `end` exclusive. */
export function businessDayRange(from: string, to: string): { start: Date; end: Date } {
  return { start: startOfBusinessDay(from), end: startOfBusinessDay(addDays(to, 1)) };
}

/**
 * Optional `from` / `to` (YYYY-MM-DD, business days) from the query. Either may be missing (open range);
 * 400 when malformed, reversed or longer than `maxDays`.
 */
export function parseDateRange(
  query: Query,
  opts: { maxDays?: number } = {},
): { from?: string; to?: string } {
  const from = optionalDateKey(query.from, 'from');
  const to = optionalDateKey(query.to, 'to');
  if (from && to) {
    if (to < from) throw new AppError(400, '`to` must be on or after `from`');
    if (opts.maxDays && daysInclusive(from, to) > opts.maxDays) {
      throw new AppError(400, `Pick a range of at most ${opts.maxDays} days`);
    }
  }
  return { from, to };
}

/** Mongo condition for a Date field inside business days `from`…`to` (either side optional). */
export function dateFieldRange(from?: string, to?: string): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  const cond: Record<string, Date> = {};
  if (from) cond.$gte = startOfBusinessDay(from);
  if (to) cond.$lt = startOfBusinessDay(addDays(to, 1));
  return cond;
}

/** Mongo condition for a `YYYY-MM-DD` string field (schedule.date, attendance date) within the range. */
export function dateKeyRange(from?: string, to?: string): Record<string, string> | undefined {
  if (!from && !to) return undefined;
  const cond: Record<string, string> = {};
  if (from) cond.$gte = from;
  if (to) cond.$lte = to;
  return cond;
}

/** "1 if truthy flag" for query switches like `withCounts=1` / `vip=true`. */
export function flag(value: unknown): boolean {
  return value === '1' || value === 'true' || value === 'yes';
}
