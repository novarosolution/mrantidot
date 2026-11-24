import type {
  AdminCustomer,
  AdminReview,
  AdminTechnician,
  Booking,
  BookingStatus,
  LeaveRequest,
  Offer,
  PayrollRow,
  TeamAttendanceStats,
  User,
} from '@/types/api';

/**
 * Response shapes of the paged admin endpoints (server/src/utils/adminLists.ts, bookingList.ts,
 * adminDashboard.ts, leave.routes.ts, adminExport.ts). Every list keeps its array key and adds `PageMeta`.
 */

export type PageMeta = {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type SortOrder = 'asc' | 'desc';
export type ListSort = { key: string; order: SortOrder };

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/* ─── Bookings ───────────────────────────────────────────────────────── */

export type BookingStatusGroup = 'active' | 'live' | 'closed';

/** `withCounts=1`: counts for the same filters except status (chips). */
export type BookingListStatusCounts = Record<'all' | BookingStatus | BookingStatusGroup, number>;

export type AdminBookingsPage = PageMeta & {
  bookings: Booking[];
  statusCounts?: BookingListStatusCounts;
};

/** Query for GET /bookings (admin). Only set keys are sent. */
export type AdminBookingQuery = {
  status?: string;
  technicianId?: string;
  customerId?: string;
  serviceId?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: string;
  /** Where the booking was made; `unknown` = saved before the source was recorded. */
  source?: 'app' | 'website' | 'admin' | 'unknown';
  from?: string;
  to?: string;
  dateField?: 'visit' | 'created' | 'completed';
  q?: string;
  sort?: 'visit' | 'created' | 'amount' | 'updated';
  order?: SortOrder;
};

/* ─── People ─────────────────────────────────────────────────────────── */

export type AdminUserRow = User & { protected?: boolean };

export type AdminUsersPage = PageMeta & {
  users: AdminUserRow[];
  counts: { all: number; customer: number; technician: number; admin: number };
};

export type AdminTechnicianRow = AdminTechnician & { onLeaveToday?: boolean };

export type AdminTechniciansPage = PageMeta & {
  technicians: AdminTechnicianRow[];
  counts: { all: number; available: number; offDuty: number; disabled: number; onLeave: number };
};

export type CustomerStatusFilter = 'all' | 'active' | 'inactive' | 'vip' | 'disabled' | 'new';

export type AdminCustomersPage = PageMeta & {
  customers: AdminCustomer[];
  summary: { total: number; new: number; vip: number; disabled: number };
  counts: Record<CustomerStatusFilter, number>;
  vipRule: { vipSpend: number; vipBookings: number };
};

/* ─── Offers / reviews ─────────────────────────────────────────────────── */

export type AdminOffersPage = PageMeta & {
  offers: Offer[];
  counts: { all: number; active: number; inactive: number; expired: number };
};

export type AdminReviewRow = AdminReview & {
  technicianId?: string;
  customerId?: string;
  customerFullName?: string;
  technicianName?: string;
};

export type ReviewBreakdown = Record<'1' | '2' | '3' | '4' | '5', number>;

export type AdminReviewsPage = PageMeta & {
  reviews: AdminReviewRow[];
  /** Over every review matching the filters except `rating`. */
  summary: { count: number; average: number; hidden: number; breakdown: ReviewBreakdown };
};

/* ─── Leave ────────────────────────────────────────────────────────────── */

export type AdminLeaveRow = Omit<LeaveRequest, 'type'> & {
  /** Key from Business settings → Lists → Leave types. */
  type: string;
  days: number;
  decidedAt?: string;
  decidedBy?: string;
  decidedByName?: string;
  updatedAt?: string;
};

export type LeaveStatusFilter = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all';

export type AdminLeavePage = PageMeta & {
  leaves: AdminLeaveRow[];
  counts: Record<LeaveStatusFilter, number>;
};

/* ─── Payroll ──────────────────────────────────────────────────────────── */

export type PayrollJob = {
  bookingId: string;
  ref: string;
  date: string;
  slot: string;
  serviceName: string;
  option?: string;
  customerName: string;
  customerPhone?: string;
  jobValue: number;
  earning: number;
  /** Take-home locked when the job was completed (else computed from the current pay rule). */
  locked: boolean;
  completedAt?: string;
};

export type PayrollTechRow = PayrollRow & { jobValue: number; jobs?: PayrollJob[] };

export type PayrollPage = {
  from: string;
  to: string;
  month: string;
  days: number;
  totalEarnings: number;
  totalJobs: number;
  totalJobValue: number;
  technicians: PayrollTechRow[];
};

/* ─── Technician detail (month-scoped) ─────────────────────────────────── */

export type TechnicianDetailStatsV2 = {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  pendingJobs?: number;
  inProgressJobs?: number;
  awaitingVerificationJobs?: number;
  earnings: number;
  monthEarnings?: number;
  lastJobDate?: string;
  reviewCount: number;
  paySummary?: string;
};

/* ─── Data export ──────────────────────────────────────────────────────── */

export type ExportDatasetGroup = 'operations' | 'people' | 'catalog' | 'website' | 'app';

export type ExportDatasetInfo = {
  key: string;
  label: string;
  group: ExportDatasetGroup;
  count: number;
  formats: ('csv' | 'json')[];
};

export type ExportSummary = {
  range: { from: string | null; to: string | null; dateField: 'visit' | 'created' };
  datasets: ExportDatasetInfo[];
};

/* ─── Dashboard / reports (GET /stats/admin) ───────────────────────────── */

export type PctDelta = number | null;

export type DashboardSeriesPoint = {
  /** YYYY-MM-DD (daily buckets) or YYYY-MM (monthly). */
  key: string;
  label: string;
  /** Completed-job revenue incl. GST. */
  revenue: number;
  net: number;
  gst: number;
  jobs: number;
  /** Bookings created. */
  bookings: number;
};

export type DashboardStats = {
  range: {
    from: string;
    to: string;
    days: number;
    bucket: 'day' | 'month';
    previousFrom: string;
    previousTo: string;
  };
  today: string;
  timeZone: string;
  generatedAt: string;
  revenue: {
    total: number;
    net: number;
    gst: number;
    coupon: number;
    jobs: number;
    couponJobs: number;
    avgOrderValue: number;
    previous: { total: number; net: number; gst: number; jobs: number; avgOrderValue: number };
    delta: { total: PctDelta; net: PctDelta; jobs: PctDelta; avgOrderValue: PctDelta };
  };
  bookings: {
    created: number;
    previous: number;
    delta: PctDelta;
    byStatus: { status: BookingStatus; count: number }[];
    completionRate: number;
    cancellationRate: number;
    previousCancellationRate: number;
  };
  people: {
    newCustomers: number;
    previousNewCustomers: number;
    delta: PctDelta;
    totalCustomers: number;
    totalTechnicians: number;
    activeTechnicians: number;
    techniciansOnLeaveToday: number;
  };
  snapshot: {
    pending: number;
    confirmed: number;
    inProgress: number;
    awaitingVerification: number;
    activeJobs: number;
    open: number;
    unassigned: number;
    todayVisits: number;
    overdue: number;
  };
  reviews: {
    count: number;
    average: number;
    lowRatings: number;
    previousCount: number;
    previousAverage: number;
    allTimeCount: number;
    allTimeAverage: number;
  };
  series: DashboardSeriesPoint[];
  topServices: { serviceId: string; name: string; jobs: number; revenue: number; count: number }[];
  topCustomers: { id: string; name: string; phone?: string; jobs: number; spend: number }[];
  leaderboard: {
    id: string;
    name: string;
    phone?: string;
    jobs: number;
    revenue: number;
    rating: number;
    reviewsInRange: number;
    ratingInRange: number | null;
  }[];
  payments: {
    methods: { key: string; label: string; count: number; amount: number }[];
    statuses: { key: 'paid' | 'unpaid' | 'refunded'; label: string; count: number; amount: number }[];
  };
  catalog: { services: number; activeServices: number; offers: number; activeOffers: number; offerRedemptions: number };
  todaySchedule: Booking[];
  pendingQueue: {
    counts: {
      pending: number;
      unassigned: number;
      awaitingVerification: number;
      overdue: number;
      leaveRequests: number;
      lowRatings: number;
    };
    bookings: Booking[];
  };
};

export type TeamAttendanceRange = TeamAttendanceStats & {
  from: string;
  to: string;
  technicians: { id: string; name: string; present: number; absent: number; leave: number; rate: number }[];
};
