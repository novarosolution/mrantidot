import { Types } from 'mongoose';
import { Booking, type IBooking } from '../models/Booking';
import { LeaveRequest } from '../models/LeaveRequest';
import { Service } from '../models/Service';
import { TechnicianAttendance } from '../models/TechnicianAttendance';
import { User, type IUser } from '../models/User';
import { AppError } from './AppError';
import { optionalDateKey, optionalObjectId, requireObjectId } from './adminList';
import { addressInServiceArea, getBusinessSettings, listLabel, type BusinessSettings } from './businessSettings';
import { localDateKey } from './dateKey';
import { technicianPublicRating } from './ratings';
import { scheduleWords } from './schedule';

/**
 * Who can take a visit, and why someone is a poor fit. One rule set for auto-assign
 * (`pickTechnicianForVisit`, utils/booking.ts) and the admin's assign picker (GET /admin/technicians/fit):
 *
 *   block — the assign endpoint refuses: off duty for a visit today, approved leave, a job in the same slot;
 *   warn  — allowed by hand, skipped by auto-assign: marked on leave in attendance, weekly day off,
 *           daily job cap reached, missing pest-type skill, address outside their cities / pincodes.
 */

/** Jobs that keep a technician busy (slot clash, open-job ranking). */
export const BUSY_JOB_STATUSES = ['confirmed', 'in_progress', 'awaiting_verification'];
/** Jobs that use up a day (the daily cap): the busy ones plus those already finished that day. */
const DAY_JOB_STATUSES = [...BUSY_JOB_STATUSES, 'completed'];

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PINCODE_RE = /^\d{6}$/;
const MAX_CITIES = 30;
const MAX_PINCODES = 300;
export const MAX_JOBS_PER_DAY = 20;

/** 0 = Sunday … 6 = Saturday for a `YYYY-MM-DD` key (calendar day, no time zone involved). */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export type FitCode = 'off_duty' | 'on_leave' | 'slot_clash' | 'weekly_off' | 'daily_cap' | 'skill' | 'area';
export type FitSeverity = 'block' | 'warn';
export type FitReason = { code: FitCode; severity: FitSeverity; text: string };

export type VisitContext = {
  /** Visit day (YYYY-MM-DD). Without it only skills, area and duty are checked. */
  date?: string;
  slot?: string;
  /** Pest types the service treats (Service.serviceTypes). */
  pestTypes?: string[];
  /** Visit address text (city / pincode are read from it). */
  address?: string;
  /** The booking being (re)assigned — never counted against anyone. */
  excludeBookingId?: Types.ObjectId | string;
};

export type TechnicianFit = {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  rating: number;
  jobsDone: number;
  available: boolean;
  fit: 'good' | 'warn' | 'blocked';
  /** False when the assign endpoint would refuse (a "block" reason). */
  canAssign: boolean;
  reasons: FitReason[];
  /** One line for the picker: the reasons, or how busy they are that day. */
  summary: string;
  jobsThatDay: number;
  maxJobsPerDay: number | null;
  openJobs: number;
};

type TechLean = Pick<
  IUser,
  'name' | 'phone' | 'city' | 'rating' | 'displayRating' | 'jobsDone' | 'available' | 'skills' | 'serviceCities' | 'servicePincodes' | 'offDays' | 'maxJobsPerDay'
> & { _id: Types.ObjectId };

/** "a", "a or b", "a, b or c". */
function joinOr(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

/** Pest types of the visit the technician has no skill for (none when they have no skills = handle all). */
export function missingSkills(skills: string[] | undefined, pestTypes: string[] | undefined): string[] {
  if (!skills?.length || !pestTypes?.length) return [];
  return pestTypes.filter((p) => !skills.includes(p));
}

/** True when the address is in the technician's cities / pincodes (no list = anywhere; no address = can't tell). */
export function coversAddress(tech: { serviceCities?: string[]; servicePincodes?: string[] }, address?: string): boolean {
  const cities = tech.serviceCities ?? [];
  const pincodes = tech.servicePincodes ?? [];
  if (cities.length === 0 && pincodes.length === 0) return true;
  if (!address?.trim()) return true;
  return addressInServiceArea({ serviceArea: { mode: 'listed', cities, pincodes } }, { text: address });
}

/** Every active technician with their fit for the visit — good first, then warnings, then blocked. */
export async function evaluateTechnicians(ctx: VisitContext, settings?: BusinessSettings): Promise<TechnicianFit[]> {
  const s = settings ?? (await getBusinessSettings());
  const today = localDateKey();
  const date = ctx.date && DATE_RE.test(ctx.date) ? ctx.date : undefined;
  // Off duty only matters for today's visits (and for callers that give no date).
  const visitIsToday = !date || date <= today;
  const dayWord = date === today ? 'today' : 'that day';
  const slot = ctx.slot && ctx.slot !== 'custom' ? ctx.slot : undefined;

  const techs = await User.find({ role: 'technician', disabled: { $ne: true } })
    .select('name phone city rating displayRating jobsDone available skills serviceCities servicePincodes offDays maxJobsPerDay')
    .sort({ name: 1 })
    .lean<TechLean[]>();
  if (techs.length === 0) return [];
  const ids = techs.map((t) => t._id);
  const exclude = ctx.excludeBookingId ? new Types.ObjectId(String(ctx.excludeBookingId)) : undefined;
  const notThis = exclude ? { _id: { $ne: exclude } } : {};

  const countBy = (match: Record<string, unknown>) =>
    Booking.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { technicianId: { $in: ids }, ...notThis, ...match } },
      { $group: { _id: '$technicianId', n: { $sum: 1 } } },
    ]).then((rows) => new Map(rows.map((r) => [String(r._id), r.n])));
  const none = Promise.resolve([] as unknown[]);

  const [leaveIds, markedLeaveIds, clashIds, dayCounts, openCounts] = await Promise.all([
    date
      ? LeaveRequest.distinct('technicianId', { technicianId: { $in: ids }, status: 'approved', from: { $lte: date }, to: { $gte: date } }).exec()
      : none,
    date ? TechnicianAttendance.distinct('technicianId', { technicianId: { $in: ids }, date, status: 'leave' }).exec() : none,
    date && slot
      ? Booking.distinct('technicianId', {
          technicianId: { $in: ids },
          'schedule.date': date,
          'schedule.slot': slot,
          status: { $in: BUSY_JOB_STATUSES },
          ...notThis,
        }).exec()
      : none,
    date ? countBy({ 'schedule.date': date, status: { $in: DAY_JOB_STATUSES } }) : Promise.resolve(new Map<string, number>()),
    countBy({ status: { $in: BUSY_JOB_STATUSES } }),
  ]);
  const onLeave = new Set(leaveIds.map(String));
  const markedLeave = new Set(markedLeaveIds.map(String));
  const clash = new Set(clashIds.map(String));
  const weekday = date ? weekdayOf(date) : -1;
  const slotTime = slot ? scheduleWords({ date, slot }).time : '';
  const pestWord = (key: string) => listLabel(s.lists.pestTypes, key).toLowerCase();

  const rows = techs.map((t): TechnicianFit => {
    const id = String(t._id);
    const jobsThatDay = dayCounts.get(id) ?? 0;
    const openJobs = openCounts.get(id) ?? 0;
    const cap = typeof t.maxJobsPerDay === 'number' && t.maxJobsPerDay > 0 ? t.maxJobsPerDay : null;
    const reasons: FitReason[] = [];
    if (t.available === false && visitIsToday) reasons.push({ code: 'off_duty', severity: 'block', text: 'Off duty today' });
    if (onLeave.has(id)) reasons.push({ code: 'on_leave', severity: 'block', text: 'On leave' });
    else if (markedLeave.has(id)) reasons.push({ code: 'on_leave', severity: 'warn', text: 'Marked on leave' });
    if (clash.has(id)) reasons.push({ code: 'slot_clash', severity: 'block', text: slotTime ? `Has a job at ${slotTime}` : 'Has a job in this slot' });
    if (weekday >= 0 && (t.offDays ?? []).includes(weekday)) {
      reasons.push({ code: 'weekly_off', severity: 'warn', text: `Off on ${WEEKDAY_NAMES[weekday]}s` });
    }
    if (date && cap && jobsThatDay >= cap) {
      reasons.push({ code: 'daily_cap', severity: 'warn', text: `${jobsThatDay}/${cap} jobs ${dayWord}` });
    }
    const missing = missingSkills(t.skills, ctx.pestTypes);
    if (missing.length) reasons.push({ code: 'skill', severity: 'warn', text: `No ${joinOr(missing.map(pestWord))} skill` });
    if (!coversAddress(t, ctx.address)) reasons.push({ code: 'area', severity: 'warn', text: 'Outside their area' });

    const blocked = reasons.some((r) => r.severity === 'block');
    const fit: TechnicianFit['fit'] = blocked ? 'blocked' : reasons.length ? 'warn' : 'good';
    const busy = date
      ? jobsThatDay
        ? `${jobsThatDay}${cap ? `/${cap}` : ''} job${jobsThatDay === 1 && !cap ? '' : 's'} ${dayWord}`
        : `No jobs ${dayWord}`
      : `${openJobs} open job${openJobs === 1 ? '' : 's'}`;
    return {
      id,
      name: t.name,
      phone: t.phone,
      city: t.city,
      rating: technicianPublicRating(t),
      jobsDone: t.jobsDone ?? 0,
      available: t.available !== false,
      fit,
      canAssign: !blocked,
      reasons,
      summary: fit === 'good' ? busy : reasons.map((r) => r.text).join(' · '),
      jobsThatDay,
      maxJobsPerDay: cap,
      openJobs,
    };
  });

  const rank = { good: 0, warn: 1, blocked: 2 } as const;
  return rows.sort(
    (a, b) =>
      rank[a.fit] - rank[b.fit] ||
      a.reasons.length - b.reasons.length ||
      a.jobsThatDay - b.jobsThatDay ||
      a.openJobs - b.openJobs ||
      a.name.localeCompare(b.name),
  );
}

/**
 * Auto-assign's pick: a technician with no reason against them at all, the customer's pick when that
 * one is free, else the fewest jobs that day, then the fewest open jobs.
 */
export async function pickTechnicianForVisit(
  ctx: VisitContext & { prefer?: Types.ObjectId | string },
): Promise<Types.ObjectId | undefined> {
  const free = (await evaluateTechnicians(ctx)).filter((f) => f.reasons.length === 0);
  if (free.length === 0) return undefined;
  const preferred = ctx.prefer ? free.find((f) => f.id === String(ctx.prefer)) : undefined;
  const pick = preferred ?? [...free].sort((a, b) => a.jobsThatDay - b.jobsThatDay || a.openJobs - b.openJobs)[0];
  return new Types.ObjectId(pick.id);
}

/** Pest types of a booking's service (works with a populated or a plain service reference). */
async function servicePestTypes(serviceRef: unknown): Promise<string[]> {
  if (!serviceRef) return [];
  if (typeof serviceRef === 'object' && !(serviceRef instanceof Types.ObjectId)) {
    // Populated service: use its list when it came with one (a narrow populate may have left it out).
    const list = (serviceRef as { serviceTypes?: unknown }).serviceTypes;
    if (Array.isArray(list) && list.length > 0) return list.map(String);
  }
  const id = typeof serviceRef === 'object' && '_id' in (serviceRef as object) ? (serviceRef as { _id: unknown })._id : serviceRef;
  if (!Types.ObjectId.isValid(String(id))) return [];
  const svc = await Service.findById(id).select('serviceTypes').lean<{ serviceTypes?: string[] }>();
  return svc?.serviceTypes ?? [];
}

/** The rules' input for an existing booking. */
export async function visitContextForBooking(booking: IBooking): Promise<VisitContext> {
  return {
    date: booking.schedule?.date,
    slot: booking.schedule?.slot,
    address: booking.address,
    pestTypes: await servicePestTypes(booking.serviceId),
    excludeBookingId: booking._id as Types.ObjectId,
  };
}

/**
 * GET /admin/technicians/fit — `bookingId`, or (for a booking not made yet) `serviceId` + `date` + optional
 * `slot` / `address`. Answers the visit plus every active technician with fit, reasons and how busy they are.
 */
export async function technicianFitReport(query: Record<string, unknown>) {
  const settings = await getBusinessSettings();
  let ctx: VisitContext;
  let visit: Record<string, unknown>;
  let currentId: string | undefined;
  let preferredId: string | undefined;

  if (query.bookingId !== undefined && query.bookingId !== '') {
    const id = requireObjectId(query.bookingId, 'bookingId');
    const booking = await Booking.findById(id).populate('serviceId', 'name serviceTypes');
    if (!booking) throw new AppError(404, 'Booking not found');
    ctx = await visitContextForBooking(booking);
    currentId = booking.technicianId ? String(booking.technicianId) : undefined;
    preferredId = booking.preferredTechnicianId ? String(booking.preferredTechnicianId) : undefined;
    const service = booking.serviceId as unknown as { name?: string } | null;
    visit = {
      bookingId: String(booking._id),
      ref: `#${String(booking._id).slice(-6).toUpperCase()}`,
      status: booking.status,
      serviceName: service?.name ?? 'Service',
      address: booking.address,
    };
  } else {
    const serviceId = optionalObjectId(query.serviceId, 'serviceId');
    const date = optionalDateKey(query.date, 'date');
    const service = serviceId ? await Service.findById(serviceId).select('name serviceTypes').lean<{ name?: string; serviceTypes?: string[] }>() : null;
    if (serviceId && !service) throw new AppError(404, 'Service not found');
    ctx = {
      date,
      slot: typeof query.slot === 'string' ? query.slot.slice(0, 20) : undefined,
      address: typeof query.address === 'string' ? query.address.slice(0, 400) : undefined,
      pestTypes: service?.serviceTypes ?? [],
    };
    visit = { serviceName: service?.name, address: ctx.address };
  }

  const technicians = await evaluateTechnicians(ctx, settings);
  const { date: dateWords, time } = scheduleWords(ctx.date ? { date: ctx.date, slot: ctx.slot } : undefined);
  return {
    visit: {
      ...visit,
      date: ctx.date,
      slot: ctx.slot,
      when: [dateWords, time].filter(Boolean).join(' · '),
      pestTypes: (ctx.pestTypes ?? []).map((key) => ({ key, label: listLabel(settings.lists.pestTypes, key) })),
    },
    technicians: technicians.map((t) => ({ ...t, current: t.id === currentId, preferred: t.id === preferredId })),
    counts: {
      good: technicians.filter((t) => t.fit === 'good').length,
      warn: technicians.filter((t) => t.fit === 'warn').length,
      blocked: technicians.filter((t) => t.fit === 'blocked').length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Editing coverage (admin user create / update)                       */
/* ------------------------------------------------------------------ */

export type TechnicianCoverage = Pick<IUser, 'skills' | 'serviceCities' | 'servicePincodes' | 'offDays'> & {
  maxJobsPerDay: number | null;
};

export const COVERAGE_FIELDS = ['skills', 'serviceCities', 'servicePincodes', 'offDays', 'maxJobsPerDay'] as const;

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Cleans the coverage fields an admin sent (only those present). Skills must be pest types from Business
 * settings; cities / pincodes must be in the business service area when it lists them (values the technician
 * already has stay, so an area change never blocks other edits); at least one working day; cap 1–20 or empty.
 */
export function cleanTechnicianCoverage(
  body: Record<string, unknown>,
  current: Partial<TechnicianCoverage> | undefined,
  settings: BusinessSettings,
): Partial<TechnicianCoverage> {
  const out: Partial<TechnicianCoverage> = {};
  const listed = settings.serviceArea.mode === 'listed';

  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills)) throw new AppError(400, 'Skills must be a list of pest types');
    const known = new Set(settings.lists.pestTypes.map((p) => p.key));
    const skills: string[] = [];
    for (const raw of body.skills) {
      const key = String(raw).trim().toLowerCase();
      if (!known.has(key)) throw new AppError(400, `“${String(raw)}” is not a pest type in Business settings`);
      if (!skills.includes(key)) skills.push(key);
    }
    out.skills = skills;
  }

  if (body.serviceCities !== undefined) {
    if (!Array.isArray(body.serviceCities)) throw new AppError(400, 'Cities must be a list');
    const had = current?.serviceCities ?? [];
    const cities: string[] = [];
    for (const raw of body.serviceCities) {
      const text = String(raw).replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!text || cities.some((c) => sameText(c, text))) continue;
      const kept = had.find((c) => sameText(c, text));
      const area = settings.serviceArea.cities.find((c) => sameText(c, text));
      if (listed && !kept && !area) throw new AppError(400, `${text} is not in your service area (Business settings → Service area)`);
      cities.push(area ?? kept ?? text);
    }
    if (cities.length > MAX_CITIES) throw new AppError(400, `Pick at most ${MAX_CITIES} cities`);
    out.serviceCities = cities;
  }

  if (body.servicePincodes !== undefined) {
    if (!Array.isArray(body.servicePincodes)) throw new AppError(400, 'Pincodes must be a list');
    const had = current?.servicePincodes ?? [];
    const pins: string[] = [];
    for (const raw of body.servicePincodes) {
      const pin = String(raw).replace(/\s+/g, '');
      if (!pin || pins.includes(pin)) continue;
      if (!PINCODE_RE.test(pin)) throw new AppError(400, `${pin} is not a 6-digit pincode`);
      if (listed && !had.includes(pin) && !settings.serviceArea.pincodes.includes(pin)) {
        throw new AppError(400, `${pin} is not in your service area (Business settings → Service area)`);
      }
      pins.push(pin);
    }
    if (pins.length > MAX_PINCODES) throw new AppError(400, `Pick at most ${MAX_PINCODES} pincodes`);
    out.servicePincodes = pins;
  }

  if (body.offDays !== undefined) {
    if (!Array.isArray(body.offDays)) throw new AppError(400, 'Days off must be a list of weekdays');
    const days = [...new Set(body.offDays.map((d) => Number(d)))].sort((a, b) => a - b);
    if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw new AppError(400, 'Days off must be weekdays 0 (Sunday) to 6 (Saturday)');
    if (days.length === 7) throw new AppError(400, 'Keep at least one working day');
    out.offDays = days;
  }

  if (body.maxJobsPerDay !== undefined) {
    const raw = body.maxJobsPerDay;
    if (raw === null || raw === '' || raw === 0 || raw === '0') out.maxJobsPerDay = null;
    else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > MAX_JOBS_PER_DAY) {
        throw new AppError(400, `Max jobs per day must be 1–${MAX_JOBS_PER_DAY}, or empty for no limit`);
      }
      out.maxJobsPerDay = n;
    }
  }
  return out;
}

/**
 * Extra filters for GET /admin/technicians: `skill` (can treat it — no skills = treats all), `city` (covers
 * it — no area = anywhere), `worksOn` (0–6, not a weekly day off). Undefined when none is set.
 */
export function technicianCoverageFilter(query: Record<string, unknown>): Record<string, unknown> | undefined {
  const and: Record<string, unknown>[] = [];
  const noList = (field: string) => ({ $or: [{ [field]: { $exists: false } }, { [field]: { $size: 0 } }] });
  if (typeof query.skill === 'string' && query.skill.trim()) {
    const skill = query.skill.trim().toLowerCase();
    if (!/^[a-z0-9_]{1,40}$/.test(skill)) throw new AppError(400, 'Unknown skill');
    and.push({ $or: [{ skills: skill }, noList('skills')] });
  }
  if (typeof query.city === 'string' && query.city.trim()) {
    const city = query.city.trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    and.push({ $or: [{ serviceCities: new RegExp(`^${city}$`, 'i') }, { $and: [noList('serviceCities'), noList('servicePincodes')] }] });
  }
  if (query.worksOn !== undefined && query.worksOn !== '') {
    const day = Number(query.worksOn);
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new AppError(400, 'worksOn must be 0 (Sunday) to 6 (Saturday)');
    and.push({ offDays: { $ne: day } });
  }
  return and.length ? { $and: and } : undefined;
}
