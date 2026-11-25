import '../types/express';
import type { NextFunction, Request, Response } from 'express';
import { ActivityLog, type ActivityArea } from '../models/ActivityLog';
import { User } from '../models/User';

/**
 * Admin audit trail. Mounted once on the API router (routes/index.ts): every successful admin
 * POST / PUT / PATCH / DELETE is written to ActivityLog after the response has been sent, so logging
 * can never slow down or break a request.
 *
 * Handlers can describe their change on `res.locals.activity` (see ActivityNote), e.g.
 *   res.locals.activity = { summary: 'Cancelled booking #A1B2C3 — reason: customer travelling' };
 * Without it the entry gets a generic summary ("Updated a service").
 *
 * Only field NAMES are stored, never values (passwords, codes and tokens included).
 */
export type ActivityNote = {
  /** One readable line, e.g. "Assigned Ravi to booking #A1B2C3". */
  summary?: string;
  /** Overrides `req.params.id` — e.g. the id of the record a POST just created. */
  targetId?: string;
  targetType?: string;
  /** Short name of the target ("#A1B2C3", "Ravi Kumar"). */
  targetLabel?: string;
  /** Names of the changed fields (default: the top-level keys of the request body). */
  fields?: string[];
  /** Don't log this request. */
  skip?: boolean;
};

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Not business changes: sign-in / own profile, file uploads, the admin's own inbox. */
const SKIP_PATHS = [/^\/auth(\/|$)/, /^\/upload(\/|$)/, /^\/notifications(\/|$)/, /^\/website\/admin\/media(\/|$)/];

type AreaRule = { match: RegExp; area: ActivityArea; target?: string };

/** First match wins — matched against the route pattern without the /api prefix. */
const AREA_RULES: AreaRule[] = [
  { match: /^\/admin\/broadcast/, area: 'broadcast', target: 'broadcast' },
  { match: /^\/admin\/technicians\/:id\/attendance/, area: 'attendance', target: 'technician' },
  { match: /^\/admin\/payroll/, area: 'payroll' },
  { match: /^\/admin\/offers/, area: 'offers', target: 'offer' },
  { match: /^\/admin\/reviews/, area: 'reviews', target: 'review' },
  { match: /^\/admin\/(users|customers|technicians)/, area: 'users', target: 'user' },
  { match: /^\/bookings/, area: 'bookings', target: 'booking' },
  { match: /^\/services/, area: 'services', target: 'service' },
  { match: /^\/offers/, area: 'offers', target: 'offer' },
  { match: /^\/reviews/, area: 'reviews', target: 'review' },
  { match: /^\/settings/, area: 'settings', target: 'settings' },
  { match: /^\/content/, area: 'content', target: 'content' },
  { match: /^\/website\/admin\/blog/, area: 'website', target: 'blog' },
  { match: /^\/website\/admin\/gallery/, area: 'website', target: 'gallery' },
  { match: /^\/website\/admin\/team/, area: 'website', target: 'team' },
  { match: /^\/website\/admin\/testimonials/, area: 'website', target: 'testimonial' },
  { match: /^\/website\/admin\/messages/, area: 'website', target: 'message' },
  { match: /^\/website\/admin\/subscribers/, area: 'website', target: 'subscriber' },
  { match: /^\/website/, area: 'website', target: 'website' },
  { match: /^\/leave/, area: 'leave', target: 'leave' },
  { match: /^\/attendance/, area: 'attendance' },
  { match: /^\/technicians/, area: 'users', target: 'user' },
];

/** Generic summaries by "METHOD /route"; {ref} becomes the booking reference (#A1B2C3). */
const SUMMARIES: Record<string, string> = {
  'POST /bookings': 'Created a booking',
  'PATCH /bookings/:id': 'Edited booking {ref}',
  'PATCH /bookings/:id/assign': 'Assigned a technician to booking {ref}',
  'PATCH /bookings/:id/status': 'Changed the status of booking {ref}',
  'PATCH /bookings/:id/confirm-schedule': 'Confirmed the visit time of booking {ref}',
  'PATCH /bookings/:id/complete': 'Force-completed booking {ref}',
  'PATCH /bookings/:id/verify': 'Force-completed booking {ref}',
  'PATCH /bookings/:id/cancel': 'Cancelled booking {ref}',
  'PATCH /bookings/:id/steps/:index': 'Updated a treatment step on booking {ref}',
  'POST /bookings/:id/regenerate-otp': 'Issued a new code for booking {ref}',
  'POST /bookings/:id/complete-work': 'Completed booking {ref} with the customer’s code',
  'POST /bookings/:id/notes': 'Added a note to booking {ref}',
  'DELETE /bookings/:id/notes/:noteId': 'Deleted a note on booking {ref}',
  'PATCH /bookings/:id/payment': 'Updated the payment of booking {ref}',
  'POST /services': 'Created a service',
  'PUT /services/order': 'Reordered the services',
  'PATCH /services/:id': 'Updated a service',
  'DELETE /services/:id': 'Deleted a service',
  'POST /admin/users': 'Created a user account',
  'PATCH /admin/users/:id': 'Updated a user account',
  'PATCH /admin/users/:id/password': 'Reset a password',
  'DELETE /admin/users/:id': 'Disabled a user account',
  'PUT /admin/technicians/:id/attendance/:date': 'Marked technician attendance',
  'POST /admin/offers': 'Created an offer',
  'PATCH /admin/offers/:id': 'Updated an offer',
  'DELETE /admin/offers/:id': 'Switched an offer off',
  'PATCH /admin/reviews/:id': 'Changed a review’s visibility',
  'POST /leave/:id/approve': 'Approved a leave request',
  'POST /leave/:id/reject': 'Rejected a leave request',
  'PATCH /settings/admin': 'Saved business settings',
  'PATCH /content/admin/home': 'Saved the home screen content',
  'PATCH /content/admin/app': 'Saved the app content',
  'PATCH /website/admin': 'Saved the website layout',
  'POST /admin/broadcast': 'Sent a broadcast',
};

const VERBS: Record<string, string> = { POST: 'Created', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };

const NOUNS: Record<string, string> = {
  booking: 'a booking',
  user: 'a user account',
  technician: 'a technician record',
  service: 'a service',
  offer: 'an offer',
  review: 'a review',
  settings: 'business settings',
  content: 'app content',
  blog: 'a blog post',
  gallery: 'a gallery photo',
  team: 'a team member',
  testimonial: 'a testimonial',
  message: 'a contact message',
  subscriber: 'a subscriber',
  website: 'the website',
  leave: 'a leave request',
  broadcast: 'a broadcast',
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export function bookingRefOf(id: string | undefined): string {
  return id && OBJECT_ID.test(id) ? `#${id.slice(-6).toUpperCase()}` : '';
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** "/bookings/:id/cancel" — the matched route pattern, without the API prefix or a trailing slash. */
function routePattern(req: Request, apiBase: string): string {
  const routePath = typeof req.route?.path === 'string' ? (req.route.path as string) : undefined;
  let full =
    routePath !== undefined
      ? `${req.baseUrl}${routePath}`
      : (req.originalUrl.split('?')[0] ?? '').replace(/\/[a-f0-9]{24}(?=\/|$)/gi, '/:id');
  if (apiBase && full.startsWith(apiBase)) full = full.slice(apiBase.length);
  full = full.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
  return full || '/';
}

function genericSummary(method: string, route: string, targetType: string | undefined, targetId: string | undefined): string {
  const known = SUMMARIES[`${method} ${route}`];
  const text = known ?? `${VERBS[method] ?? 'Changed'} ${NOUNS[targetType ?? ''] ?? 'a record'}`;
  return text.replace('{ref}', bookingRefOf(targetId)).replace(/\s{2,}/g, ' ').trim();
}

function cleanFields(names: unknown[]): string[] {
  const out: string[] = [];
  for (const name of names) {
    if (typeof name !== 'string') continue;
    const key = name.trim().slice(0, 40);
    if (!key || key === 'updatedAt' || out.includes(key)) continue;
    out.push(key);
    if (out.length >= 30) break;
  }
  return out;
}

function bodyFields(body: unknown): string[] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return cleanFields(Object.keys(body as Record<string, unknown>));
}

const NAME_TTL_MS = 5 * 60_000;
const names = new Map<string, { name: string; at: number }>();

async function actorName(id: string): Promise<string> {
  const hit = names.get(id);
  if (hit && Date.now() - hit.at < NAME_TTL_MS) return hit.name;
  const user = await User.findById(id).select('name').lean<{ name?: string }>();
  const name = user?.name ?? '';
  if (names.size > 500) names.clear();
  names.set(id, { name, at: Date.now() });
  return name;
}

async function record(req: Request, res: Response, apiBase: string): Promise<void> {
  const raw = res.locals.activity;
  const note: ActivityNote = raw && typeof raw === 'object' ? (raw as ActivityNote) : {};
  if (note.skip) return;
  const actorId = req.user?.id;
  if (!actorId) return;

  const route = routePattern(req, apiBase);
  const rule = AREA_RULES.find((r) => r.match.test(route));
  const targetType = note.targetType ?? rule?.target;
  const paramId = typeof req.params?.id === 'string' ? req.params.id : undefined;
  const targetId = note.targetId ?? paramId;
  const summary = clip(note.summary?.trim() || genericSummary(req.method, route, targetType, targetId), 300);
  const targetLabel = note.targetLabel ?? (targetType === 'booking' ? bookingRefOf(targetId) || undefined : undefined);

  await ActivityLog.create({
    actorId,
    actorName: await actorName(actorId),
    method: req.method,
    route: clip(route, 200),
    area: rule?.area ?? 'other',
    targetId: targetId ? clip(targetId, 64) : undefined,
    targetType,
    targetLabel: targetLabel ? clip(targetLabel, 120) : undefined,
    summary,
    fields: Array.isArray(note.fields) ? cleanFields(note.fields) : bodyFields(req.body),
    status: res.statusCode,
  });
}

export function activityLog(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method) || SKIP_PATHS.some((rx) => rx.test(req.path))) {
    next();
    return;
  }
  // The API router's mount path ("/api") — stripped from the stored route patterns.
  const apiBase = req.baseUrl;
  res.on('finish', () => {
    if (res.statusCode >= 400 || req.user?.role !== 'admin') return;
    void record(req, res, apiBase).catch((err) => {
      console.error('[activity] could not record an admin change', err);
    });
  });
  next();
}
