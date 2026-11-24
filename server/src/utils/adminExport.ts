import { once } from 'node:events';
import type { Response } from 'express';
import mongoose, { type Model } from 'mongoose';
import { User, sanitizeUser } from '../models/User';
import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { Offer } from '../models/Offer';
import { Review } from '../models/Review';
import { LeaveRequest, formatLeaveRequest } from '../models/LeaveRequest';
import { TechnicianAttendance, formatAttendance } from '../models/TechnicianAttendance';
import { Notification } from '../models/Notification';
import { SavedAddress } from '../models/SavedAddress';
import { PaymentMethod } from '../models/PaymentMethod';
import { PayAdjustment } from '../models/PayAdjustment';
import { Payout } from '../models/Payout';
import {
  BlogPost,
  ContactMessage,
  GalleryItem,
  Subscriber,
  TeamMember,
  Testimonial,
  WebsiteContent,
} from '../models/Website';
import { AppContent, DEFAULT_APP_CONFIG, DEFAULT_HOME_CONFIG } from '../models/AppContent';
import { AppError } from './AppError';
import { BUSINESS_TZ, dateFieldRange, dateKeyRange, parseDateRange } from './adminList';
import { getBusinessSettings, listLabel } from './businessSettings';
import { formatService } from './format';

/* ------------------------------------------------------------------ */
/* CSV basics                                                          */
/* ------------------------------------------------------------------ */

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = value instanceof Date ? istDateTime(value) : Array.isArray(value) ? value.join('; ') : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const istTime = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** "2026-11-23 14:05" in the business time zone (IST); '' for missing / invalid dates. */
function istDateTime(value: unknown): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  return `${istDate.format(d)} ${istTime.format(d)}`;
}

const idOf = (v: unknown): string => (v == null ? '' : String(v));
const refOf = (v: unknown): string => {
  const id = idOf(v);
  return id ? `#MA-${id.slice(-5).toUpperCase()}` : '';
};

type Doc = Record<string, unknown>;
type Range = { from?: string; to?: string };

/* ------------------------------------------------------------------ */
/* Datasets                                                            */
/* ------------------------------------------------------------------ */

type Labels = {
  property: (key?: unknown) => string;
  payment: (key?: unknown) => string;
  leave: (key?: unknown) => string;
};

type Dataset = {
  key: string;
  label: string;
  group: 'operations' | 'people' | 'catalog' | 'website' | 'app';
  /** CSV columns; datasets without them export as JSON only. */
  headers?: string[];
  count: (range: Range) => Promise<number>;
  /** Raw documents (lean, lookups joined) for CSV rows and the JSON backup. */
  cursor: (range: Range) => AsyncIterable<Doc>;
  /** One CSV row. */
  row?: (doc: Doc, labels: Labels) => Record<string, unknown>;
  /** JSON backup shape (secrets removed). */
  json?: (doc: Doc) => unknown;
};

function createdFilter(range: Range): Doc {
  const cond = dateFieldRange(range.from, range.to);
  return cond ? { createdAt: cond } : {};
}

/** Payouts: the date the money went out. */
function paidAtFilter(range: Range): Doc {
  const cond = dateFieldRange(range.from, range.to);
  return cond ? { paidAt: cond } : {};
}

/** Pay adjustments: their YYYY-MM-DD `date`. */
function dateKeyFilter(range: Range): Doc {
  const cond = dateKeyRange(range.from, range.to);
  return cond ? { date: cond } : {};
}

function bookingFilter(range: Range & { dateField?: string }): Doc {
  if (range.dateField === 'created') return createdFilter(range);
  const visit = dateKeyRange(range.from, range.to);
  return visit ? { 'schedule.date': visit } : {};
}

function lookupOne(from: string, localField: string, as: string, fields: string[]) {
  return [
    { $lookup: { from, localField, foreignField: '_id', as } },
    {
      $addFields: {
        [as]: {
          $let: {
            vars: { first: { $arrayElemAt: [`$${as}`, 0] } },
            in: Object.fromEntries(fields.map((f) => [f, `$$first.${f}`])),
          },
        },
      },
    },
  ];
}

async function* aggregateCursor(model: Model<any>, pipeline: Doc[]): AsyncIterable<Doc> {
  const cursor = model.aggregate(pipeline as never[]).allowDiskUse(true).cursor({ batchSize: 300 });
  for await (const doc of cursor) yield doc as Doc;
}

async function* findCursor(model: Model<any>, filter: Doc, sort: Record<string, 1 | -1>): AsyncIterable<Doc> {
  const cursor = model.find(filter).sort(sort).lean().cursor({ batchSize: 500 });
  for await (const doc of cursor) yield doc as Doc;
}

async function* rawCursor(collection: string, filter: Doc, sort: Record<string, 1 | -1>): AsyncIterable<Doc> {
  const cursor = mongoose.connection.collection(collection).find(filter).sort(sort).batchSize(500);
  for await (const doc of cursor) yield doc as Doc;
}

const userHeaders = [
  'id', 'role', 'name', 'phone', 'email', 'city', 'available', 'disabled', 'rating', 'displayRating', 'jobsDone',
  'payMode', 'payPercent', 'payFlat', 'createdAt',
];
const userRow = (d: Doc) => ({ ...d, id: idOf(d._id), createdAt: d.createdAt });
const userJson = (d: Doc) => {
  const { passwordHash: _p, __v: _v, ...rest } = d;
  return rest;
};

function usersDataset(key: string, label: string, role?: string): Dataset {
  const filter = (range: Range) => ({ ...(role ? { role } : {}), ...createdFilter(range) });
  return {
    key,
    label,
    group: 'people',
    headers: userHeaders,
    count: (range) => User.countDocuments(filter(range)),
    cursor: (range) => findCursor(User, filter(range), { role: 1, name: 1 }),
    row: userRow,
    json: userJson,
  };
}

const PERSON = ['name', 'phone', 'email', 'role'];

export const EXPORT_DATASETS: Dataset[] = [
  {
    key: 'bookings',
    label: 'Bookings',
    group: 'operations',
    headers: [
      'ref', 'bookingId', 'createdAt', 'source', 'bookedByAdmin', 'visitDate', 'visitSlot', 'visitTime', 'status',
      'customerName', 'customerPhone', 'customerEmail', 'technicianName', 'technicianPhone', 'service', 'sizeOption',
      'propertyType', 'address', 'paymentMethod', 'paymentStatus', 'paidAt', 'paidVia', 'paymentRef', 'baseAmount',
      'gstPercent', 'gst', 'coupon', 'couponCode', 'adjustments', 'adjustmentLines', 'total', 'technicianEarning',
      'workStartedAt', 'workCompletedAt',
      'rescheduleCount', 'cancelReason', 'cancelledAt',
    ],
    count: (range) => Booking.countDocuments(bookingFilter(range)),
    cursor: (range) =>
      aggregateCursor(Booking, [
        { $match: bookingFilter(range) },
        { $sort: { 'schedule.date': -1, createdAt: -1 } },
        { $project: { workOtp: 0, otpAttempts: 0 } },
        ...lookupOne('users', 'customerId', 'customer', PERSON),
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
        ...lookupOne('services', 'serviceId', 'service', ['name']),
      ]),
    row: (d, labels) => {
      const schedule = (d.schedule ?? {}) as Doc;
      const amount = (d.amount ?? {}) as Doc;
      const customer = (d.customer ?? {}) as Doc;
      const technician = (d.technician ?? {}) as Doc;
      const service = (d.service ?? {}) as Doc;
      const option = (d.option ?? {}) as Doc;
      return {
        ref: refOf(d._id),
        bookingId: idOf(d._id),
        createdAt: d.createdAt,
        source: d.source ?? '',
        bookedByAdmin: (d.createdByAdmin as Doc | undefined)?.name ?? '',
        visitDate: schedule.date,
        visitSlot: schedule.slot,
        visitTime: schedule.time,
        status: d.status,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        technicianName: technician.name,
        technicianPhone: technician.phone,
        service: service.name,
        sizeOption: option.label,
        propertyType: labels.property(d.propertyType),
        address: d.address,
        paymentMethod: labels.payment(d.paymentMethod),
        paymentStatus: d.paymentStatus ?? 'unpaid',
        paidAt: d.paidAt,
        paidVia: d.paidVia,
        paymentRef: d.paymentRef,
        baseAmount: amount.base,
        gstPercent: amount.gstPercent ?? 18,
        gst: amount.gst,
        coupon: amount.coupon,
        couponCode: d.couponCode,
        // Admin extra charges (+) and discounts (−) before GST: the net, then each line.
        adjustments: amount.adjustments ?? 0,
        adjustmentLines: ((d.adjustments ?? []) as Doc[]).map(
          (a) => `${String(a.label ?? '')} ${Number(a.amount) < 0 ? '-' : '+'}${Math.abs(Number(a.amount) || 0)}`,
        ),
        total: amount.total,
        technicianEarning: d.technicianEarning,
        workStartedAt: d.workStartedAt,
        workCompletedAt: d.workCompletedAt,
        rescheduleCount: d.rescheduleCount ?? 0,
        cancelReason: d.cancelReason,
        cancelledAt: d.cancelledAt,
      };
    },
    json: (d) => d,
  },
  {
    key: 'reviews',
    label: 'Reviews',
    group: 'operations',
    headers: ['id', 'bookingRef', 'stars', 'comment', 'tags', 'customerName', 'technicianName', 'hidden', 'createdAt'],
    count: (range) => Review.countDocuments(createdFilter(range)),
    cursor: (range) =>
      aggregateCursor(Review, [
        { $match: createdFilter(range) },
        { $sort: { createdAt: -1 } },
        ...lookupOne('users', 'customerId', 'customer', PERSON),
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
      ]),
    row: (d) => ({
      ...d,
      id: idOf(d._id),
      bookingRef: refOf(d.bookingId),
      customerName: (d.customer as Doc | undefined)?.name,
      technicianName: (d.technician as Doc | undefined)?.name,
    }),
    json: (d) => d,
  },
  {
    key: 'leaveRequests',
    label: 'Leave requests',
    group: 'operations',
    headers: ['id', 'technicianName', 'technicianPhone', 'from', 'to', 'type', 'status', 'reason', 'adminNote', 'decidedAt', 'createdAt'],
    count: (range) => LeaveRequest.countDocuments(leaveFilter(range)),
    cursor: (range) =>
      aggregateCursor(LeaveRequest, [
        { $match: leaveFilter(range) },
        { $sort: { from: -1 } },
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
      ]),
    row: (d, labels) => ({
      ...d,
      id: idOf(d._id),
      technicianName: (d.technician as Doc | undefined)?.name,
      technicianPhone: (d.technician as Doc | undefined)?.phone,
      type: labels.leave(d.type),
    }),
    json: (d) => d,
  },
  {
    key: 'attendance',
    label: 'Attendance',
    group: 'operations',
    headers: ['id', 'technicianName', 'date', 'status', 'source', 'checkedInAt', 'checkedOutAt', 'note'],
    count: (range) => TechnicianAttendance.countDocuments(attendanceFilter(range)),
    cursor: (range) =>
      aggregateCursor(TechnicianAttendance, [
        { $match: attendanceFilter(range) },
        { $sort: { date: -1 } },
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
      ]),
    row: (d) => ({ ...d, id: idOf(d._id), technicianName: (d.technician as Doc | undefined)?.name }),
    json: (d) => d,
  },
  {
    key: 'payouts',
    label: 'Technician payouts',
    group: 'operations',
    headers: [
      'id', 'technicianName', 'technicianPhone', 'periodFrom', 'periodTo', 'amount', 'method', 'reference', 'paidAt',
      'note', 'recordedBy', 'createdAt',
    ],
    count: (range) => Payout.countDocuments(paidAtFilter(range)),
    cursor: (range) =>
      aggregateCursor(Payout, [
        { $match: paidAtFilter(range) },
        { $sort: { paidAt: -1 } },
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
      ]),
    row: (d) => {
      const technician = (d.technician ?? {}) as Doc;
      return {
        id: idOf(d._id),
        technicianName: technician.name,
        technicianPhone: technician.phone,
        periodFrom: d.periodFrom,
        periodTo: d.periodTo,
        amount: d.amount,
        method: d.method,
        reference: d.reference,
        paidAt: d.paidAt,
        note: d.note,
        recordedBy: d.createdByName,
        createdAt: d.createdAt,
      };
    },
    json: (d) => d,
  },
  {
    key: 'payAdjustments',
    label: 'Pay adjustments',
    group: 'operations',
    headers: ['id', 'technicianName', 'technicianPhone', 'date', 'type', 'amount', 'reason', 'recordedBy', 'createdAt'],
    count: (range) => PayAdjustment.countDocuments(dateKeyFilter(range)),
    cursor: (range) =>
      aggregateCursor(PayAdjustment, [
        { $match: dateKeyFilter(range) },
        { $sort: { date: -1, createdAt: -1 } },
        ...lookupOne('users', 'technicianId', 'technician', PERSON),
      ]),
    row: (d) => {
      const technician = (d.technician ?? {}) as Doc;
      return {
        id: idOf(d._id),
        technicianName: technician.name,
        technicianPhone: technician.phone,
        date: d.date,
        type: Number(d.amount) < 0 ? 'deduction' : 'bonus',
        amount: d.amount,
        reason: d.reason,
        recordedBy: d.createdByName,
        createdAt: d.createdAt,
      };
    },
    json: (d) => d,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    group: 'operations',
    headers: ['id', 'userName', 'userRole', 'title', 'body', 'type', 'read', 'bookingRef', 'createdAt'],
    count: (range) => Notification.countDocuments(createdFilter(range)),
    cursor: (range) =>
      aggregateCursor(Notification, [
        { $match: createdFilter(range) },
        { $sort: { createdAt: -1 } },
        ...lookupOne('users', 'userId', 'user', PERSON),
      ]),
    row: (d) => ({
      ...d,
      id: idOf(d._id),
      userName: (d.user as Doc | undefined)?.name,
      userRole: (d.user as Doc | undefined)?.role,
      bookingRef: d.bookingId ? refOf(d.bookingId) : '',
    }),
    json: (d) => d,
  },
  {
    key: 'activity',
    label: 'Admin activity log',
    group: 'operations',
    headers: ['createdAt', 'actorName', 'area', 'summary', 'method', 'route', 'targetType', 'targetLabel', 'fields', 'status'],
    count: (range) => mongoose.connection.collection('activity_logs').countDocuments(createdFilter(range)),
    cursor: (range) => rawCursor('activity_logs', createdFilter(range), { createdAt: -1 }),
    row: (d) => d,
    json: (d) => d,
  },
  usersDataset('customers', 'Customers', 'customer'),
  usersDataset('technicians', 'Technicians', 'technician'),
  usersDataset('users', 'All users'),
  {
    key: 'addresses',
    label: 'Saved addresses',
    group: 'people',
    headers: ['id', 'customerName', 'customerPhone', 'label', 'line1', 'city', 'pincode', 'isDefault', 'createdAt'],
    count: (range) => SavedAddress.countDocuments(createdFilter(range)),
    cursor: (range) =>
      aggregateCursor(SavedAddress, [
        { $match: createdFilter(range) },
        { $sort: { createdAt: -1 } },
        ...lookupOne('users', 'customerId', 'customer', PERSON),
      ]),
    row: (d) => ({
      ...d,
      id: idOf(d._id),
      customerName: (d.customer as Doc | undefined)?.name,
      customerPhone: (d.customer as Doc | undefined)?.phone,
    }),
    json: (d) => d,
  },
  {
    key: 'paymentMethods',
    label: 'Payment methods',
    group: 'people',
    headers: ['id', 'customerName', 'customerPhone', 'type', 'label', 'details', 'isDefault', 'createdAt'],
    count: (range) => PaymentMethod.countDocuments(createdFilter(range)),
    cursor: (range) =>
      aggregateCursor(PaymentMethod, [
        { $match: createdFilter(range) },
        { $sort: { createdAt: -1 } },
        ...lookupOne('users', 'customerId', 'customer', PERSON),
      ]),
    row: (d, labels) => ({
      ...d,
      id: idOf(d._id),
      customerName: (d.customer as Doc | undefined)?.name,
      customerPhone: (d.customer as Doc | undefined)?.phone,
      type: labels.payment(d.type),
    }),
    json: (d) => d,
  },
  {
    key: 'services',
    label: 'Services',
    group: 'catalog',
    headers: ['id', 'name', 'category', 'basePrice', 'options', 'durationMins', 'serviceTypes', 'rating', 'active', 'createdAt'],
    count: (range) => Service.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(Service, createdFilter(range), { sortOrder: 1, name: 1 }),
    row: (d) => ({
      ...d,
      id: idOf(d._id),
      options: Array.isArray(d.options)
        ? (d.options as Doc[]).map((o) => `${String(o.label ?? o.key ?? '')}: ${String(o.price ?? '')}`)
        : '',
    }),
    json: (d) => d,
  },
  {
    key: 'offers',
    label: 'Offers',
    group: 'catalog',
    headers: ['id', 'code', 'description', 'discountType', 'discount', 'minOrderAmount', 'maxUses', 'useCount', 'active', 'expiresAt', 'createdAt'],
    count: (range) => Offer.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(Offer, createdFilter(range), { createdAt: -1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'webBlog',
    label: 'Website blog',
    group: 'website',
    headers: ['id', 'title', 'slug', 'status', 'author', 'tags', 'publishedAt', 'excerpt', 'createdAt'],
    count: (range) => BlogPost.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(BlogPost, createdFilter(range), { createdAt: -1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'webGallery',
    label: 'Website gallery',
    group: 'website',
    headers: ['id', 'title', 'category', 'imageUrl', 'active', 'sortOrder', 'createdAt'],
    count: (range) => GalleryItem.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(GalleryItem, createdFilter(range), { sortOrder: 1 }),
    row: (d) => ({ ...d, id: idOf(d._id), imageUrl: (d.image as Doc | undefined)?.url }),
    json: (d) => d,
  },
  {
    key: 'webTeam',
    label: 'Website team',
    group: 'website',
    headers: ['id', 'name', 'role', 'email', 'phone', 'years', 'active', 'sortOrder', 'createdAt'],
    count: (range) => TeamMember.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(TeamMember, createdFilter(range), { sortOrder: 1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'webTestimonials',
    label: 'Website testimonials',
    group: 'website',
    headers: ['id', 'name', 'role', 'rating', 'quote', 'active', 'sortOrder', 'createdAt'],
    count: (range) => Testimonial.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(Testimonial, createdFilter(range), { sortOrder: 1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'webMessages',
    label: 'Website messages',
    group: 'website',
    headers: ['id', 'name', 'email', 'phone', 'service', 'message', 'status', 'createdAt'],
    count: (range) => ContactMessage.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(ContactMessage, createdFilter(range), { createdAt: -1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'webSubscribers',
    label: 'Newsletter subscribers',
    group: 'website',
    headers: ['id', 'email', 'active', 'createdAt'],
    count: (range) => Subscriber.countDocuments(createdFilter(range)),
    cursor: (range) => findCursor(Subscriber, createdFilter(range), { createdAt: -1 }),
    row: (d) => ({ ...d, id: idOf(d._id) }),
    json: (d) => d,
  },
  {
    key: 'websiteContent',
    label: 'Website layout & photos',
    group: 'website',
    count: async () => WebsiteContent.countDocuments({}),
    cursor: () => findCursor(WebsiteContent, {}, { _id: 1 }),
    json: (d) => d,
  },
  {
    key: 'appContent',
    label: 'App content & home',
    group: 'app',
    count: async () => AppContent.countDocuments({}),
    cursor: () => findCursor(AppContent, {}, { key: 1 }),
    json: (d) => d,
  },
];

function leaveFilter(range: Range): Doc {
  // Leave that overlaps the range at all.
  const filter: Doc = {};
  if (range.from) filter.to = { $gte: range.from };
  if (range.to) filter.from = { $lte: range.to };
  return filter;
}

function attendanceFilter(range: Range): Doc {
  const date = dateKeyRange(range.from, range.to);
  return date ? { date } : {};
}

const DATASET_BY_KEY = new Map(EXPORT_DATASETS.map((d) => [d.key, d]));

/** Datasets named in `datasets=a,b` (all when empty); 400 on unknown names. */
export function pickDatasets(raw: unknown): Dataset[] {
  if (typeof raw !== 'string' || !raw.trim()) return EXPORT_DATASETS;
  const keys = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
  const unknown = keys.filter((k) => !DATASET_BY_KEY.has(k));
  if (unknown.length) throw new AppError(400, `Unknown dataset: ${unknown.join(', ')}`);
  return keys.map((k) => DATASET_BY_KEY.get(k)!);
}

/** `from` / `to` (YYYY-MM-DD) plus `dateField` (visit | created) for bookings. */
export function parseExportRange(query: Record<string, unknown>): Range & { dateField?: string } {
  const { from, to } = parseDateRange(query);
  const dateField = query.dateField === 'created' ? 'created' : 'visit';
  return { from, to, dateField };
}

async function loadLabels(): Promise<Labels> {
  const s = await getBusinessSettings();
  const label = (items: { key: string; label: string }[]) => (key?: unknown) =>
    typeof key === 'string' && key ? listLabel(items, key) : '';
  return {
    property: label(s.lists.propertyTypes),
    payment: label(s.payments.methods),
    leave: label(s.lists.leaveTypes),
  };
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

/** Row counts per dataset for the range — the data-export screen shows these before anything downloads. */
export async function exportSummary(range: Range & { dateField?: string }) {
  const counts = await Promise.all(EXPORT_DATASETS.map((d) => d.count(range).catch(() => 0)));
  return {
    range: { from: range.from ?? null, to: range.to ?? null, dateField: range.dateField ?? 'visit' },
    datasets: EXPORT_DATASETS.map((d, i) => ({
      key: d.key,
      label: d.label,
      group: d.group,
      count: counts[i],
      formats: d.headers ? ['csv', 'json'] : ['json'],
    })),
  };
}

/** Buffered writer that respects back-pressure (large exports never sit in memory). */
function streamWriter(res: Response) {
  let buffer = '';
  return {
    async write(text: string) {
      buffer += text;
      if (buffer.length >= 64 * 1024) {
        const chunk = buffer;
        buffer = '';
        if (!res.write(chunk)) await once(res, 'drain');
      }
    },
    async end() {
      if (buffer) res.write(buffer);
      buffer = '';
      res.end();
    },
  };
}

function rangeSuffix(range: Range): string {
  if (range.from && range.to) return `-${range.from}_to_${range.to}`;
  if (range.from) return `-from-${range.from}`;
  if (range.to) return `-to-${range.to}`;
  return '';
}

/** Streams one dataset as CSV (UTF-8 with BOM so Excel shows ₹ and names correctly). No row cap. */
export async function streamExportCsv(res: Response, datasetKey: unknown, range: Range & { dateField?: string }) {
  const dataset = typeof datasetKey === 'string' ? DATASET_BY_KEY.get(datasetKey) : undefined;
  if (!dataset) throw new AppError(400, 'Pick a dataset to export');
  if (!dataset.headers || !dataset.row) throw new AppError(400, `${dataset.label} is available as JSON only`);
  const labels = await loadLabels();
  const headers = dataset.headers;
  const row = dataset.row;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mrantidot-${dataset.key}${rangeSuffix(range)}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  const out = streamWriter(res);
  try {
    await out.write(`\uFEFF${headers.join(',')}\n`);
    for await (const doc of dataset.cursor(range)) {
      const values = row(doc, labels);
      await out.write(`${headers.map((h) => csvEscape(values[h])).join(',')}\n`);
    }
    await out.end();
  } catch (err) {
    res.destroy(err as Error);
  }
}

/** Streams a JSON backup of the chosen datasets: `{ exportedAt, version, range, datasets: { key: [...] } }`. */
export async function streamExportJson(res: Response, datasets: Dataset[], range: Range & { dateField?: string }) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mrantidot-backup${rangeSuffix(range)}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  const out = streamWriter(res);
  try {
    const head = {
      exportedAt: new Date().toISOString(),
      version: 2,
      timeZone: BUSINESS_TZ,
      range: { from: range.from ?? null, to: range.to ?? null, dateField: range.dateField ?? 'visit' },
    };
    await out.write(`${JSON.stringify(head).slice(0, -1)},"datasets":{`);
    let firstSet = true;
    for (const dataset of datasets) {
      await out.write(`${firstSet ? '' : ','}${JSON.stringify(dataset.key)}:[`);
      firstSet = false;
      let first = true;
      for await (const doc of dataset.cursor(range)) {
        const value = dataset.json ? dataset.json(doc) : doc;
        await out.write(`${first ? '' : ','}${JSON.stringify(value)}`);
        first = false;
      }
      await out.write(']');
    }
    await out.write('}}');
    await out.end();
  } catch (err) {
    res.destroy(err as Error);
  }
}

/* ------------------------------------------------------------------ */
/* Legacy bundle (older app builds call GET /admin/export with no params) */
/* ------------------------------------------------------------------ */

function leanBooking(doc: {
  _id: unknown;
  customerId?: unknown;
  technicianId?: unknown;
  serviceId?: unknown;
  status?: string;
  schedule?: { date?: string; slot?: string; time?: string };
  address?: string;
  paymentMethod?: string;
  amount?: { total?: number; base?: number; gst?: number; coupon?: number };
  couponCode?: string;
  propertyType?: string;
  createdAt?: Date;
  updatedAt?: Date;
  workStartedAt?: Date;
  workCompletedAt?: Date;
}) {
  return {
    id: String(doc._id),
    customerId: doc.customerId ? String(doc.customerId) : '',
    technicianId: doc.technicianId ? String(doc.technicianId) : '',
    serviceId: doc.serviceId ? String(doc.serviceId) : '',
    status: doc.status ?? '',
    scheduleDate: doc.schedule?.date ?? '',
    scheduleSlot: doc.schedule?.slot ?? '',
    scheduleTime: doc.schedule?.time ?? '',
    address: doc.address ?? '',
    paymentMethod: doc.paymentMethod ?? '',
    amountTotal: doc.amount?.total ?? '',
    amountBase: doc.amount?.base ?? '',
    amountGst: doc.amount?.gst ?? '',
    amountCoupon: doc.amount?.coupon ?? '',
    couponCode: doc.couponCode ?? '',
    propertyType: doc.propertyType ?? '',
    workStartedAt: doc.workStartedAt?.toISOString?.() ?? '',
    workCompletedAt: doc.workCompletedAt?.toISOString?.() ?? '',
    createdAt: doc.createdAt?.toISOString?.() ?? '',
    updatedAt: doc.updatedAt?.toISOString?.() ?? '',
  };
}

/** Full admin data dump (legacy shape for older app builds) — no password hashes, no live OTP secrets. */
export async function buildAdminExport() {
  const [users, services, offers, bookings, reviews, leaveDocs, attendanceDocs, homeDoc, appDoc] = await Promise.all([
    User.find().sort({ role: 1, name: 1 }),
    Service.find().sort({ name: 1 }),
    Offer.find().sort({ createdAt: -1 }),
    Booking.find()
      .select(
        'customerId technicianId serviceId status schedule address paymentMethod amount couponCode propertyType workStartedAt workCompletedAt createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .lean(),
    Review.find().sort({ createdAt: -1 }),
    LeaveRequest.find().sort({ createdAt: -1 }),
    TechnicianAttendance.find().sort({ date: -1 }),
    AppContent.findOne({ key: 'home' }),
    AppContent.findOne({ key: 'app' }),
  ]);

  const techIds = [...new Set(leaveDocs.map((l) => l.technicianId.toString()))];
  const techs = await User.find({ _id: { $in: techIds } }).select('name phone');
  const techMap = new Map(techs.map((t) => [t._id.toString(), t]));

  const userRows = users.map((u) => sanitizeUser(u) as Record<string, unknown>);
  const serviceRows = services.map((s) => formatService(s) as Record<string, unknown>);
  const offerRows = offers.map((o) => o.toJSON() as Record<string, unknown>);
  const bookingRows = bookings.map((b) => leanBooking(b));
  const reviewRows = reviews.map((r) => r.toJSON() as Record<string, unknown>);
  const leaveRows = leaveDocs.map(
    (l) => formatLeaveRequest(l, techMap.get(l.technicianId.toString())) as Record<string, unknown>,
  );
  const attendanceRows = attendanceDocs.map((a) => formatAttendance(a) as Record<string, unknown>);

  const customers = userRows.filter((u) => u.role === 'customer');
  const technicians = userRows.filter((u) => u.role === 'technician');
  const admins = userRows.filter((u) => u.role === 'admin');

  const userCsvHeaders = [
    'id', 'role', 'name', 'phone', 'email', 'city', 'available', 'disabled', 'rating', 'jobsDone', 'payMode',
    'payPercent', 'payFlat', 'createdAt',
  ];
  const bookingCsvHeaders = [
    'id', 'status', 'customerId', 'technicianId', 'serviceId', 'scheduleDate', 'scheduleSlot', 'scheduleTime',
    'address', 'paymentMethod', 'amountTotal', 'amountBase', 'amountGst', 'amountCoupon', 'couponCode',
    'propertyType', 'workStartedAt', 'workCompletedAt', 'createdAt',
  ];

  return {
    exportedAt: new Date().toISOString(),
    version: 1 as const,
    summary: {
      users: userRows.length,
      customers: customers.length,
      technicians: technicians.length,
      admins: admins.length,
      bookings: bookingRows.length,
      services: serviceRows.length,
      offers: offerRows.length,
      reviews: reviewRows.length,
      leaveRequests: leaveRows.length,
      attendanceRecords: attendanceRows.length,
    },
    users: userRows,
    services: serviceRows,
    offers: offerRows,
    bookings: bookingRows,
    reviews: reviewRows,
    leaveRequests: leaveRows,
    attendance: attendanceRows,
    homeConfig: homeDoc?.homeConfig ?? DEFAULT_HOME_CONFIG,
    appConfig: appDoc?.appConfig ?? DEFAULT_APP_CONFIG,
    csv: {
      users: rowsToCsv(userCsvHeaders, userRows),
      customers: rowsToCsv(userCsvHeaders, customers),
      technicians: rowsToCsv(userCsvHeaders, technicians),
      bookings: rowsToCsv(bookingCsvHeaders, bookingRows),
      services: rowsToCsv(['id', 'name', 'category', 'basePrice', 'rating', 'active', 'iconKey', 'shortDesc'], serviceRows),
      offers: rowsToCsv(
        ['id', 'code', 'description', 'discountType', 'discount', 'active', 'expiresAt', 'maxUses', 'useCount', 'minOrderAmount'],
        offerRows,
      ),
      reviews: rowsToCsv(['id', 'bookingId', 'technicianId', 'stars', 'comment', 'hidden', 'createdAt'], reviewRows),
      leaveRequests: rowsToCsv(
        ['id', 'technicianId', 'technicianName', 'from', 'to', 'type', 'status', 'reason', 'adminNote', 'createdAt'],
        leaveRows,
      ),
      attendance: rowsToCsv(
        ['id', 'technicianId', 'date', 'status', 'source', 'checkedInAt', 'checkedOutAt', 'note'],
        attendanceRows,
      ),
    },
  };
}
