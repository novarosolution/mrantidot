import { User, sanitizeUser } from '../models/User';
import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { Offer } from '../models/Offer';
import { Review } from '../models/Review';
import { LeaveRequest, formatLeaveRequest } from '../models/LeaveRequest';
import { TechnicianAttendance, formatAttendance } from '../models/TechnicianAttendance';
import {
  AppContent,
  DEFAULT_APP_CONFIG,
  DEFAULT_HOME_CONFIG,
} from '../models/AppContent';
import { formatService } from './format';

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
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

export type AdminExportBundle = {
  exportedAt: string;
  version: 1;
  summary: {
    users: number;
    customers: number;
    technicians: number;
    admins: number;
    bookings: number;
    services: number;
    offers: number;
    reviews: number;
    leaveRequests: number;
    attendanceRecords: number;
  };
  users: Record<string, unknown>[];
  services: Record<string, unknown>[];
  offers: Record<string, unknown>[];
  bookings: ReturnType<typeof leanBooking>[];
  reviews: Record<string, unknown>[];
  leaveRequests: Record<string, unknown>[];
  attendance: Record<string, unknown>[];
  homeConfig: unknown;
  appConfig: unknown;
  csv: {
    users: string;
    customers: string;
    technicians: string;
    bookings: string;
    services: string;
    offers: string;
    reviews: string;
    leaveRequests: string;
    attendance: string;
  };
};

/** Full admin data dump — no password hashes, no live OTP secrets. */
export async function buildAdminExport(): Promise<AdminExportBundle> {
  const [
    users,
    services,
    offers,
    bookings,
    reviews,
    leaveDocs,
    attendanceDocs,
    homeDoc,
    appDoc,
  ] = await Promise.all([
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
    TechnicianAttendance.find().sort({ date: -1 }).limit(5000),
    AppContent.findOne({ key: 'home' }),
    AppContent.findOne({ key: 'app' }),
  ]);

  const techIds = [
    ...new Set(leaveDocs.map((l) => l.technicianId.toString())),
  ];
  const techs = await User.find({ _id: { $in: techIds } }).select('name phone');
  const techMap = new Map(techs.map((t) => [t._id.toString(), t]));

  const userRows = users.map((u) => sanitizeUser(u) as Record<string, unknown>);
  const serviceRows = services.map((s) => formatService(s) as Record<string, unknown>);
  const offerRows = offers.map((o) => o.toJSON() as Record<string, unknown>);
  const bookingRows = bookings.map((b) => leanBooking(b));
  const reviewRows = reviews.map((r) => r.toJSON() as Record<string, unknown>);
  const leaveRows = leaveDocs.map((l) =>
    formatLeaveRequest(l, techMap.get(l.technicianId.toString())) as Record<string, unknown>,
  );
  const attendanceRows = attendanceDocs.map(
    (a) => formatAttendance(a) as Record<string, unknown>,
  );

  const customers = userRows.filter((u) => u.role === 'customer');
  const technicians = userRows.filter((u) => u.role === 'technician');
  const admins = userRows.filter((u) => u.role === 'admin');

  const userCsvHeaders = [
    'id',
    'role',
    'name',
    'phone',
    'email',
    'city',
    'available',
    'disabled',
    'rating',
    'jobsDone',
    'payMode',
    'payPercent',
    'payFlat',
    'createdAt',
  ];
  const bookingCsvHeaders = [
    'id',
    'status',
    'customerId',
    'technicianId',
    'serviceId',
    'scheduleDate',
    'scheduleSlot',
    'scheduleTime',
    'address',
    'paymentMethod',
    'amountTotal',
    'amountBase',
    'amountGst',
    'amountCoupon',
    'couponCode',
    'propertyType',
    'workStartedAt',
    'workCompletedAt',
    'createdAt',
  ];

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
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
      services: rowsToCsv(
        ['id', 'name', 'category', 'basePrice', 'rating', 'active', 'iconKey', 'shortDesc'],
        serviceRows,
      ),
      offers: rowsToCsv(
        [
          'id',
          'code',
          'description',
          'discountType',
          'discount',
          'active',
          'expiresAt',
          'maxUses',
          'useCount',
          'minOrderAmount',
        ],
        offerRows,
      ),
      reviews: rowsToCsv(
        ['id', 'bookingId', 'technicianId', 'stars', 'comment', 'hidden', 'createdAt'],
        reviewRows,
      ),
      leaveRequests: rowsToCsv(
        [
          'id',
          'technicianId',
          'technicianName',
          'from',
          'to',
          'type',
          'status',
          'reason',
          'adminNote',
          'createdAt',
        ],
        leaveRows,
      ),
      attendance: rowsToCsv(
        [
          'id',
          'technicianId',
          'date',
          'status',
          'source',
          'checkedInAt',
          'checkedOutAt',
          'note',
        ],
        attendanceRows,
      ),
    },
  };
}
