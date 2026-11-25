import '../types/express';
import { Router } from 'express';
import type { Types } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { Booking } from '../models/Booking';
import { Offer } from '../models/Offer';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { BlogPost } from '../models/Website';
import { scheduleWords } from '../utils/schedule';

/**
 * Admin global search (command palette / phone search screen). Mounted at /api/admin/search.
 *
 *   GET /api/admin/search?q=ravi&limit=5&types=bookings,customers
 *     q      1–80 characters; every word must match (name, phone, email, booking ref, service, code…)
 *     limit  results per type, 1–10 (default 5)
 *     types  optional comma list: bookings, customers, technicians, services, offers, blog
 *
 *   → { q, groups: [{ type, label, total, items: [{ type, id, title, subtitle?, meta?, badge?, status?,
 *       score, open: { screen, id } }] }], tookMs }
 *
 * Groups are ordered by their best match (exact ref / phone / code first), items by score, then the most
 * relevant record (open bookings first, then newest). `open.screen` says which admin screen shows the hit:
 * booking | customer | technician | service | offer | blog.
 */
export const searchRouter = Router();

searchRouter.use(requireAuth, requireRole('admin'));

export const SEARCH_TYPES = ['bookings', 'customers', 'technicians', 'services', 'offers', 'blog'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

type HitScreen = 'booking' | 'customer' | 'technician' | 'service' | 'offer' | 'blog';
type BadgeTone = 'green' | 'amber' | 'red' | 'grey' | 'blue';

export type SearchHit = {
  type: HitScreen;
  id: string;
  title: string;
  subtitle?: string;
  /** Short right-hand detail: amount, booking count, discount… */
  meta?: string;
  badge?: { label: string; tone: BadgeTone };
  /** Booking status key (the client shows its own status pill). */
  status?: string;
  score: number;
  open: { screen: HitScreen; id: string };
};

const GROUP_LABELS: Record<SearchType, string> = {
  bookings: 'Bookings',
  customers: 'Customers',
  technicians: 'Technicians',
  services: 'Services',
  offers: 'Offers',
  blog: 'Blog posts',
};

const MAX_Q = 80;
const MAX_TOKENS = 4;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
/** Records fetched per type before ranking (the best `limit` of these are returned). */
const CANDIDATES = 40;

const OPEN_STATUSES = ['pending', 'confirmed', 'in_progress', 'awaiting_verification'];

/* ─── Matching + ranking ───────────────────────────────────────────── */

function escapeRx(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rx(token: string): RegExp {
  return new RegExp(escapeRx(token), 'i');
}

/** Lower-case words of the query (max 4); `#MA-1A2B3` and `#A1B2C3` keep only the ref part. */
export function queryTokens(q: string): string[] {
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const word of words) {
    const clean = word.replace(/^#/, '').replace(/^ma-/, '');
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= MAX_TOKENS) break;
  }
  return out;
}

function digitsOf(text: string): string {
  return text.replace(/\D/g, '');
}

/** Phone digits worth matching (3+), without a leading 91 on 12-digit numbers. */
function phoneToken(token: string): string | null {
  if (!/^[+\d\s()-]+$/.test(token)) return null;
  let digits = digitsOf(token);
  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.length >= 3 ? digits : null;
}

function isHexRef(token: string): boolean {
  return /^[a-f\d]{4,24}$/i.test(token);
}

/** 0–100: exact 100, starts with 85, a word starts with 70, contains 45. */
export function textScore(value: unknown, token: string): number {
  if (typeof value !== 'string' || !value) return 0;
  const v = value.toLowerCase();
  if (v === token) return 100;
  if (v.startsWith(token)) return 85;
  if (v.split(/[^a-z0-9ऀ-ॿ]+/).some((w) => w && w.startsWith(token))) return 70;
  if (v.includes(token)) return 45;
  return 0;
}

function phoneScore(phone: unknown, token: string): number {
  const digits = phoneToken(token);
  if (!digits || typeof phone !== 'string') return 0;
  let p = digitsOf(phone);
  if (p.length >= 12 && p.startsWith('91')) p = p.slice(2);
  if (p === digits) return 100;
  if (digits.length >= 4 && (p.endsWith(digits) || p.startsWith(digits))) return 85;
  return p.includes(digits) ? 55 : 0;
}

/** A booking ref is the end of its id (#MA-1A2B3 shows 5, the activity log 6 characters). */
function refScore(id: string, token: string): number {
  if (!isHexRef(token)) return 0;
  const v = id.toLowerCase();
  if (v === token) return 100;
  if (v.endsWith(token)) return token.length >= 5 ? 100 : 90;
  return v.includes(token) ? 50 : 0;
}

/**
 * Score of a record: every token must hit at least one field (0 otherwise); the record scores the
 * average of each token's best field, plus a bonus when the whole query matches a field from the start.
 */
function recordScore(tokens: string[], phrase: string, fields: ((token: string) => number)[], wholeFields: unknown[]): number {
  let sum = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) best = Math.max(best, field(token));
    if (best === 0) return 0;
    sum += best;
  }
  let score = sum / tokens.length;
  if (tokens.length > 1 && wholeFields.some((f) => typeof f === 'string' && f.toLowerCase().startsWith(phrase))) score += 12;
  return Math.round(Math.min(score, 110));
}

function rankAndCut<T extends { score: number }>(rows: T[], limit: number, tie: (a: T, b: T) => number): T[] {
  return rows
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || tie(a, b))
    .slice(0, limit);
}

/** Mongo condition: every token matches one of the given text fields (phone fields by digits). */
function tokensFilter(tokens: string[], textFields: string[], phoneFields: string[] = []): Record<string, unknown> {
  return {
    $and: tokens.map((token) => {
      const or: Record<string, unknown>[] = textFields.map((f) => ({ [f]: rx(token) }));
      const digits = phoneToken(token);
      if (digits) for (const f of phoneFields) or.push({ [f]: new RegExp(digits) });
      return { $or: or };
    }),
  };
}

const inr = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '');

function bookingRef(id: string): string {
  return `#MA-${id.slice(-5).toUpperCase()}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  awaiting_verification: 'Awaiting code',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/* ─── Per-type searches ────────────────────────────────────────────── */

type Found = { hits: SearchHit[]; total: number };

type PersonRow = {
  _id: Types.ObjectId;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  disabled?: boolean;
  available?: boolean;
  rating?: number;
  displayRating?: number | null;
  jobsDone?: number;
  updatedAt?: Date;
};

async function totalFor(found: number, count: () => Promise<number>): Promise<number> {
  return found < CANDIDATES ? found : count();
}

function personFields(row: PersonRow) {
  return [
    (t: string) => textScore(row.name, t),
    (t: string) => Math.round(textScore(row.email, t) * 0.85),
    (t: string) => phoneScore(row.phone, t),
  ];
}

async function searchPeople(role: 'customer' | 'technician', tokens: string[], phrase: string, limit: number): Promise<Found> {
  const filter = { role, ...tokensFilter(tokens, ['name', 'email'], ['phone']) };
  const rows = await User.find(filter)
    .select('name phone email city disabled available rating displayRating jobsDone updatedAt')
    .sort({ updatedAt: -1 })
    .limit(CANDIDATES)
    .lean<PersonRow[]>();
  const scored = rows.map((row) => ({ row, score: recordScore(tokens, phrase, personFields(row), [row.name]) }));
  const top = rankAndCut(scored, limit, (a, b) => (b.row.updatedAt?.getTime() ?? 0) - (a.row.updatedAt?.getTime() ?? 0));

  let bookingCounts = new Map<string, number>();
  if (role === 'customer' && top.length) {
    const counts = await Booking.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { customerId: { $in: top.map((t) => t.row._id) } } },
      { $group: { _id: '$customerId', n: { $sum: 1 } } },
    ]);
    bookingCounts = new Map(counts.map((c) => [String(c._id), c.n]));
  }

  const hits = top.map(({ row, score }): SearchHit => {
    const id = String(row._id);
    if (role === 'customer') {
      const n = bookingCounts.get(id) ?? 0;
      return {
        type: 'customer',
        id,
        title: row.name || 'Customer',
        subtitle: [row.phone, row.email].filter(Boolean).join(' · ') || undefined,
        meta: `${n} booking${n === 1 ? '' : 's'}`,
        badge: row.disabled ? { label: 'Disabled', tone: 'grey' } : undefined,
        score,
        open: { screen: 'customer', id },
      };
    }
    const rating = typeof row.displayRating === 'number' ? row.displayRating : row.rating;
    return {
      type: 'technician',
      id,
      title: row.name || 'Technician',
      subtitle: [row.phone, row.city].filter(Boolean).join(' · ') || undefined,
      meta: [rating ? `★ ${rating.toFixed(1)}` : '', `${row.jobsDone ?? 0} jobs`].filter(Boolean).join(' · '),
      badge: row.disabled
        ? { label: 'Disabled', tone: 'grey' }
        : row.available === false
          ? { label: 'Off duty', tone: 'amber' }
          : { label: 'On duty', tone: 'green' },
      score,
      open: { screen: 'technician', id },
    };
  });
  return { hits, total: await totalFor(rows.length, () => User.countDocuments(filter)) };
}

type BookingRow = {
  _id: Types.ObjectId;
  status: string;
  schedule?: { date?: string; slot?: string; time?: string };
  scheduleRequest?: { date?: string; slot?: string; time?: string };
  amount?: { total?: number };
  createdAt?: Date;
  serviceId?: { _id: Types.ObjectId; name?: string } | null;
  customerId?: { _id: Types.ObjectId; name?: string; phone?: string; email?: string } | null;
};

async function searchBookings(tokens: string[], phrase: string, limit: number): Promise<Found> {
  // Per word: the customers and services it matches, or a booking ref.
  const perToken = await Promise.all(
    tokens.map(async (token) => {
      const [customers, services] = await Promise.all([
        User.find({ role: 'customer', ...tokensFilter([token], ['name', 'email'], ['phone']) }).select('_id').limit(300).lean(),
        Service.find({ name: rx(token) }).select('_id').limit(100).lean(),
      ]);
      const or: Record<string, unknown>[] = [];
      if (customers.length) or.push({ customerId: { $in: customers.map((c) => c._id) } });
      if (services.length) or.push({ serviceId: { $in: services.map((s) => s._id) } });
      if (isHexRef(token)) {
        or.push({ $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapeRx(token), options: 'i' } } });
      }
      return or;
    }),
  );
  if (perToken.some((or) => or.length === 0)) return { hits: [], total: 0 };
  const filter = { $and: perToken.map((or) => ({ $or: or })) };

  const rows = await Booking.find(filter)
    .select('status schedule scheduleRequest amount createdAt serviceId customerId')
    .populate('serviceId', 'name')
    .populate('customerId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(CANDIDATES)
    .lean<BookingRow[]>();

  const scored = rows.map((row) => {
    const id = String(row._id);
    const customer = row.customerId ?? undefined;
    const fields = [
      (t: string) => refScore(id, t),
      (t: string) => Math.round(textScore(customer?.name, t) * 0.95),
      (t: string) => Math.round(phoneScore(customer?.phone, t) * 0.95),
      (t: string) => Math.round(textScore(customer?.email, t) * 0.8),
      (t: string) => Math.round(textScore(row.serviceId?.name, t) * 0.8),
    ];
    return { row, score: recordScore(tokens, phrase, fields, [customer?.name, row.serviceId?.name]) };
  });
  const open = (r: BookingRow) => (OPEN_STATUSES.includes(r.status) ? 1 : 0);
  const top = rankAndCut(scored, limit, (a, b) => open(b.row) - open(a.row) || (b.row.createdAt?.getTime() ?? 0) - (a.row.createdAt?.getTime() ?? 0));

  const hits = top.map(({ row, score }): SearchHit => {
    const id = String(row._id);
    const when = scheduleWords(row.schedule?.date ? row.schedule : row.scheduleRequest);
    const tone: BadgeTone =
      row.status === 'cancelled' ? 'red' : row.status === 'completed' ? 'grey' : row.status === 'pending' ? 'amber' : row.status === 'confirmed' ? 'blue' : 'green';
    return {
      type: 'booking',
      id,
      title: `${bookingRef(id)} · ${row.serviceId?.name || 'Service'}`,
      subtitle: [row.customerId?.name, row.customerId?.phone, [when.date, when.time].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || undefined,
      meta: inr(row.amount?.total) || undefined,
      badge: { label: STATUS_LABELS[row.status] ?? row.status, tone },
      status: row.status,
      score,
      open: { screen: 'booking', id },
    };
  });
  return { hits, total: await totalFor(rows.length, () => Booking.countDocuments(filter)) };
}

type ServiceRow = { _id: Types.ObjectId; name: string; category?: string; basePrice?: number; active?: boolean; shortDesc?: string; sortOrder?: number };

async function searchServices(tokens: string[], phrase: string, limit: number): Promise<Found> {
  const filter = tokensFilter(tokens, ['name', 'category', 'shortDesc']);
  const rows = await Service.find(filter).select('name category basePrice active shortDesc sortOrder').limit(CANDIDATES).lean<ServiceRow[]>();
  const scored = rows.map((row) => ({
    row,
    score: recordScore(
      tokens,
      phrase,
      [(t) => textScore(row.name, t), (t) => Math.round(textScore(row.category?.replace(/_/g, ' '), t) * 0.6), (t) => Math.round(textScore(row.shortDesc, t) * 0.5)],
      [row.name],
    ),
  }));
  const top = rankAndCut(scored, limit, (a, b) => (a.row.sortOrder ?? 1000) - (b.row.sortOrder ?? 1000));
  const hits = top.map(({ row, score }): SearchHit => {
    const id = String(row._id);
    return {
      type: 'service',
      id,
      title: row.name,
      subtitle: [row.category && row.category !== 'general' ? row.category.replace(/_/g, ' ') : '', row.shortDesc].filter(Boolean).join(' · ') || undefined,
      meta: row.basePrice ? `from ${inr(row.basePrice)}` : undefined,
      badge: row.active === false ? { label: 'Hidden', tone: 'grey' } : undefined,
      score,
      open: { screen: 'service', id },
    };
  });
  return { hits, total: await totalFor(rows.length, () => Service.countDocuments(filter)) };
}

type OfferRow = {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  discount?: number;
  discountType?: 'fixed' | 'percent';
  active?: boolean;
  expiresAt?: Date;
  maxUses?: number;
  useCount?: number;
  createdAt?: Date;
};

async function searchOffers(tokens: string[], phrase: string, limit: number): Promise<Found> {
  const filter = tokensFilter(tokens, ['code', 'description']);
  const rows = await Offer.find(filter)
    .select('code description discount discountType active expiresAt maxUses useCount createdAt')
    .sort({ createdAt: -1 })
    .limit(CANDIDATES)
    .lean<OfferRow[]>();
  const now = Date.now();
  const scored = rows.map((row) => ({
    row,
    score: recordScore(tokens, phrase, [(t) => textScore(row.code, t), (t) => Math.round(textScore(row.description, t) * 0.6)], [row.code]),
  }));
  const top = rankAndCut(scored, limit, (a, b) => (b.row.createdAt?.getTime() ?? 0) - (a.row.createdAt?.getTime() ?? 0));
  const hits = top.map(({ row, score }): SearchHit => {
    const id = String(row._id);
    const expired = row.expiresAt ? row.expiresAt.getTime() < now : false;
    const usedUp = row.maxUses ? (row.useCount ?? 0) >= row.maxUses : false;
    const badge: SearchHit['badge'] =
      row.active === false
        ? { label: 'Off', tone: 'grey' }
        : expired
          ? { label: 'Expired', tone: 'red' }
          : usedUp
            ? { label: 'Used up', tone: 'amber' }
            : { label: 'Active', tone: 'green' };
    return {
      type: 'offer',
      id,
      title: row.code,
      subtitle: row.description || undefined,
      meta: row.discount ? (row.discountType === 'percent' ? `${row.discount}% off` : `${inr(row.discount)} off`) : undefined,
      badge,
      score,
      open: { screen: 'offer', id },
    };
  });
  return { hits, total: await totalFor(rows.length, () => Offer.countDocuments(filter)) };
}

type BlogRow = { _id: Types.ObjectId; title: string; slug?: string; tags?: string[]; status?: string; excerpt?: string; updatedAt?: Date; publishedAt?: Date };

async function searchBlog(tokens: string[], phrase: string, limit: number): Promise<Found> {
  // Deleted posts are hidden by the model (soft delete).
  const filter = tokensFilter(tokens, ['title', 'tags', 'slug', 'excerpt']);
  const rows = await BlogPost.find(filter)
    .select('title slug tags status excerpt updatedAt publishedAt')
    .sort({ updatedAt: -1 })
    .limit(CANDIDATES)
    .lean<BlogRow[]>();
  const scored = rows.map((row) => ({
    row,
    score: recordScore(
      tokens,
      phrase,
      [
        (t) => textScore(row.title, t),
        (t) => Math.round(Math.max(0, ...(row.tags ?? []).map((tag) => textScore(tag, t))) * 0.75),
        (t) => Math.round(textScore(row.slug?.replace(/-/g, ' '), t) * 0.6),
        (t) => Math.round(textScore(row.excerpt, t) * 0.5),
      ],
      [row.title],
    ),
  }));
  const top = rankAndCut(scored, limit, (a, b) => (b.row.updatedAt?.getTime() ?? 0) - (a.row.updatedAt?.getTime() ?? 0));
  const hits = top.map(({ row, score }): SearchHit => {
    const id = String(row._id);
    const published = row.status === 'published';
    return {
      type: 'blog',
      id,
      title: row.title,
      subtitle: row.excerpt || (row.tags?.length ? row.tags.join(', ') : undefined),
      badge: published ? { label: 'Published', tone: 'green' } : { label: 'Draft', tone: 'amber' },
      score,
      open: { screen: 'blog', id },
    };
  });
  return { hits, total: await totalFor(rows.length, () => BlogPost.countDocuments(filter)) };
}

const SEARCHERS: Record<SearchType, (tokens: string[], phrase: string, limit: number) => Promise<Found>> = {
  bookings: searchBookings,
  customers: (tokens, phrase, limit) => searchPeople('customer', tokens, phrase, limit),
  technicians: (tokens, phrase, limit) => searchPeople('technician', tokens, phrase, limit),
  services: searchServices,
  offers: searchOffers,
  blog: searchBlog,
};

/** Runs every (or the asked) type in parallel; one failing type never breaks the others. */
export async function adminSearch(rawQ: unknown, opts: { limit?: unknown; types?: unknown } = {}) {
  const q = typeof rawQ === 'string' ? rawQ.trim().replace(/\s+/g, ' ').slice(0, MAX_Q) : '';
  const tokens = queryTokens(q);
  if (!tokens.length) return { q, groups: [] as { type: SearchType; label: string; total: number; items: SearchHit[] }[] };

  const limit = Math.min(Math.max(Number.parseInt(String(opts.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const asked = typeof opts.types === 'string' && opts.types.trim() ? opts.types.split(',').map((s) => s.trim()) : null;
  const wanted = asked ? SEARCH_TYPES.filter((t) => asked.includes(t)) : [...SEARCH_TYPES];
  const phrase = tokens.join(' ');

  const results = await Promise.all(
    wanted.map(async (type) => {
      try {
        const found = await SEARCHERS[type](tokens, phrase, limit);
        return { type, label: GROUP_LABELS[type], total: found.total, items: found.hits };
      } catch (err) {
        console.error(`[search] ${type} failed`, err);
        return { type, label: GROUP_LABELS[type], total: 0, items: [] as SearchHit[] };
      }
    }),
  );

  const order = (type: SearchType) => SEARCH_TYPES.indexOf(type);
  const groups = results
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (b.items[0]?.score ?? 0) - (a.items[0]?.score ?? 0) || order(a.type) - order(b.type));
  return { q, groups };
}

searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const started = Date.now();
    const result = await adminSearch(req.query.q, { limit: req.query.limit, types: req.query.types });
    res.json({ ...result, tookMs: Date.now() - started });
  }),
);
