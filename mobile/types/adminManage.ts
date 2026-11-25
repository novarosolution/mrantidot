/**
 * Admin management shapes: technician coverage + assign fit, customer CRM (notes, tags, VIP override,
 * addresses), review replies, offer usage. Server: routes/adminManage.routes.ts, utils/technicianFit.ts,
 * utils/offerStats.ts, routes/leave.routes.ts (admin leave), routes/services.routes.ts (duplicate).
 */
import type { AdminCustomer, Offer, SavedAddress, ServiceReview, User } from './api';
import type { AdminLeaveRow, AdminReviewRow, AdminTechnicianRow } from './adminLists';

/* ─── Technician coverage ──────────────────────────────────────────── */

/** On technician accounts (GET /admin/users/:id, /admin/technicians, /auth/me for the technician). */
export type TechnicianCoverage = {
  /** Pest-type keys from Business settings → Lists → Pest names; empty = treats every type. */
  skills?: string[];
  /** Cities / pincodes they cover (a subset of the service area); both empty = anywhere. */
  serviceCities?: string[];
  servicePincodes?: string[];
  /** Weekly days off: 0 = Sunday … 6 = Saturday. */
  offDays?: number[];
  /** Most jobs in a day; null / missing = no limit. */
  maxJobsPerDay?: number | null;
};

export type TechnicianUser = User & TechnicianCoverage;
export type TechnicianListRow = AdminTechnicianRow & TechnicianCoverage;

/** PATCH /admin/users/:id (technicians) — coverage fields; each one sent replaces the saved list. */
export type TechnicianCoveragePatch = {
  skills?: string[];
  serviceCities?: string[];
  servicePincodes?: string[];
  offDays?: number[];
  maxJobsPerDay?: number | null;
};

/* ─── Assign fit (GET /admin/technicians/fit?bookingId=) ───────────── */

export type FitSeverity = 'block' | 'warn';
export type FitCode = 'off_duty' | 'on_leave' | 'slot_clash' | 'weekly_off' | 'daily_cap' | 'skill' | 'area';
export type FitReason = { code: FitCode; severity: FitSeverity; text: string };

export type TechnicianFitRow = {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  rating: number;
  jobsDone: number;
  available: boolean;
  /** good = no reason against them; warn = can be assigned by hand; blocked = the server refuses. */
  fit: 'good' | 'warn' | 'blocked';
  canAssign: boolean;
  reasons: FitReason[];
  /** "Off on Sundays · No termite skill", or "2/3 jobs today" for a good fit. */
  summary: string;
  jobsThatDay: number;
  maxJobsPerDay: number | null;
  openJobs: number;
  /** Assigned to this booking now. */
  current: boolean;
  /** The customer asked for them. */
  preferred: boolean;
};

export type TechnicianFitReport = {
  visit: {
    bookingId?: string;
    ref?: string;
    status?: string;
    serviceName?: string;
    address?: string;
    date?: string;
    slot?: string;
    /** "Sun, 29 Nov · 10 AM – 12 PM". */
    when: string;
    pestTypes: { key: string; label: string }[];
  };
  /** Good first, then warnings, then blocked. Disabled accounts are left out. */
  technicians: TechnicianFitRow[];
  counts: { good: number; warn: number; blocked: number };
};

/* ─── Leave entered by an admin ─────────────────────────────────────── */

export type AdminLeaveRowV2 = AdminLeaveRow & {
  source?: 'technician' | 'admin';
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
};

/** A visit the technician still holds on their leave days. */
export type LeaveJobConflict = {
  bookingId: string;
  ref: string;
  date?: string;
  slot?: string;
  status: string;
  serviceName: string;
};

/** POST /leave/admin { technicianId, from, to, type, note? } → 201. */
export type AdminLeaveCreateResponse = { leave: AdminLeaveRowV2; jobs: LeaveJobConflict[] };

/* ─── Customer CRM ──────────────────────────────────────────────────── */

export type CustomerNote = { id: string; text: string; by?: string; byName: string; at: string };

export type VipOverride = 'vip' | 'not_vip';

/** Admin-only fields on a customer (GET /admin/customers/:id). */
export type CustomerCrm = {
  /** Newest first. */
  adminNotes?: CustomerNote[];
  tags?: string[];
  vipOverride?: VipOverride | null;
};

export type AdminCustomerProfile = User & CustomerCrm;

/** GET /admin/customers rows — tags, override and how many notes (never the note text). */
export type AdminCustomerRow = AdminCustomer & { tags?: string[]; vipOverride?: VipOverride | null; noteCount?: number };

export type CustomerTagCount = { tag: string; count: number };

/** Saved address as the admin reads it: false = outside Business settings → Service area. */
export type AdminSavedAddress = SavedAddress & { inServiceArea?: boolean };

export type AddressInput = { label: string; line1: string; city: string; pincode?: string; isDefault?: boolean };

/* ─── Reviews ───────────────────────────────────────────────────────── */

export type AdminReviewReply = { text: string; byId?: string; byName: string; at: string; editedAt?: string };

export type AdminReviewRowV2 = AdminReviewRow & { reply?: AdminReviewReply | null };

/** What customers and the website see of a reply (no admin name). */
export type PublicReviewReply = { text: string; at: string };

export type ServiceReviewWithReply = ServiceReview & { reply?: PublicReviewReply };

/* ─── Offers ────────────────────────────────────────────────────────── */

export type OfferStats = {
  /** Bookings with the code that were not cancelled. */
  uses: number;
  completed: number;
  cancelled: number;
  discountGiven: number;
  /** ₹ of the completed bookings with the code (incl. GST). */
  revenue: number;
  bookedValue: number;
  customers: number;
  lastUsedAt: string | null;
};

export type OfferWithStats = Offer & { stats?: OfferStats; createdAt?: string };

export type OfferRecentUse = {
  bookingId: string;
  ref: string;
  status: string;
  createdAt: string;
  date?: string;
  customerName: string;
  serviceName: string;
  discount: number;
  total: number;
};

/** GET /admin/offers/:id */
export type AdminOfferDetail = { offer: OfferWithStats; stats?: OfferStats; recent: OfferRecentUse[] };
