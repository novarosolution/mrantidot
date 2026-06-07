export type UserRole = 'customer' | 'technician' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_verification'
  | 'completed'
  | 'cancelled';

export type ServiceCategory = 'residential' | 'commercial' | 'cleaning' | 'general';

export type ServiceTypeKey =
  | 'ant'
  | 'cockroach'
  | 'rodent'
  | 'mosquito'
  | 'termite'
  | 'bed_bug'
  | 'bird'
  | 'flea'
  | 'spider'
  | 'lizard'
  | 'bee'
  | 'wood_borer'
  | 'general'
  | 'fumigation'
  | 'deep_cleaning'
  | 'silo';

export type PropertyTypeKey =
  | '1bhk'
  | '2bhk'
  | '3bhk'
  | '4bhk'
  | 'bungalow'
  | 'office'
  | 'cafe_restaurant'
  | 'hotel'
  | 'warehouse'
  | 'factory';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  city?: string;
  rating?: number;
  jobsDone?: number;
  available?: boolean;
  disabled?: boolean;
  /** Primary env-configured admin; role cannot be changed */
  protected?: boolean;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  iconKey: string;
  basePrice: number;
  shortDesc: string;
  rating?: number;
  category?: ServiceCategory;
  serviceTypes?: ServiceTypeKey[];
  active?: boolean;
  stepTemplate?: string[];
  stats?: ServiceStats;
}

export interface HomePromo {
  badge: string;
  title: string;
  ctaLabel: string;
  serviceId?: string;
  active: boolean;
}

export interface HomeCategoryChip {
  label: string;
  category?: string;
}

export interface HomeConfig {
  featuredServiceId?: string;
  sectionTitles: { services: string; popular: string };
  searchPlaceholder: string;
  servicesActionLabel: string;
  popularActionLabel: string;
  categoryChips: HomeCategoryChip[];
}

export interface SupportConfig {
  phone: string;
  email: string;
  whatsapp?: string;
  hours?: string;
}

export interface BrandingConfig {
  name: string;
  tagline: string;
}

export interface TrustConfig {
  guaranteeText: string;
  badges: string[];
}

export interface OnboardingSlide {
  title: string;
  subtitle: string;
  icon?: string;
}

export interface OnboardingConfig {
  slides: OnboardingSlide[];
  trustChips: string[];
}

export interface LegalConfig {
  termsMarkdown: string;
  privacyMarkdown: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BookingCopyConfig {
  scheduleStepTitle: string;
  scheduleStepSubtitle: string;
  standardModeLabel: string;
  customModeLabel: string;
  customNotesPlaceholder: string;
  pendingCustomerTitle: string;
  pendingCustomerHint: string;
  pendingFactsSubtitle: string;
  pendingReviewNote: string;
  requestSubmittedToast: string;
  adminRequestTitle: string;
  adminConfirmTitle: string;
  adminConfirmHint: string;
  adminConfirmButton: string;
}

export interface AppConfig {
  support: SupportConfig;
  branding: BrandingConfig;
  trust: TrustConfig;
  onboarding: OnboardingConfig;
  legal: LegalConfig;
  aboutMarkdown: string;
  faq: FaqItem[];
  booking?: BookingCopyConfig;
}

export interface BookingStatusCounts {
  total: number;
  byStatus: Record<string, number>;
}

export interface ServiceStats {
  bookingCount: number;
  avgRating: number | null;
  reviewCount: number;
}

export interface ServiceReview {
  id: string;
  stars: number;
  tags: string[];
  comment?: string;
  customerName: string;
  createdAt?: string;
}

export interface AdminReview {
  id: string;
  bookingId: string;
  stars: number;
  tags: string[];
  comment?: string;
  hidden: boolean;
  customerName: string;
  serviceName: string;
  createdAt?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
}

export interface PaymentMethodRecord {
  id: string;
  type: 'upi_card' | 'pay_after';
  label: string;
  details?: string;
  isDefault: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  bookingId?: string;
  createdAt?: string;
}

export type OfferDiscountType = 'fixed' | 'percent';

export interface Offer {
  id: string;
  code: string;
  discount: number;
  discountType?: OfferDiscountType;
  description: string;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  useCount?: number;
  minOrderAmount?: number;
}

export interface BookingStep {
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'done';
  photoUrl?: string;
  capturedAt?: string;
  geo?: { lat: number; lng: number; address: string };
}

export interface BookingAmount {
  base: number;
  gst: number;
  coupon: number;
  total: number;
}

export interface AvailableTechnician {
  id: string;
  name: string;
  rating: number;
  jobsDone: number;
  city?: string;
}

export type AssignmentMode = 'auto' | 'customer_pick';

export type TrackingEventType =
  | 'assigned'
  | 'start_otp_sent'
  | 'work_started'
  | 'step_done'
  | 'end_otp_sent'
  | 'work_completed'
  | 'cancelled'
  | 'admin_override'
  | 'schedule_confirmed';

export interface TrackingEvent {
  at: string;
  event: TrackingEventType;
  meta?: Record<string, unknown>;
}

export interface WorkOtpView {
  start?: { code: string; expiresIn: number };
  end?: { code: string; expiresIn: number };
}

export interface WorkOtpAdminView {
  start?: { masked: string; verifiedAt?: string; expiresAt?: string };
  end?: { masked: string; verifiedAt?: string; expiresAt?: string };
}

export type ScheduleMode = 'standard' | 'custom';

export interface ScheduleRequest {
  date: string;
  slot?: string;
  time?: string;
  notes?: string;
}

export interface BookingSchedule {
  date: string;
  slot: string;
  time?: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduleMode?: ScheduleMode;
  scheduleRequest?: ScheduleRequest;
  schedule: BookingSchedule;
  scheduleConfirmedAt?: string;
  propertyType?: PropertyTypeKey;
  propertyTypeLabel?: string;
  address: string;
  amount: BookingAmount;
  paymentMethod: string;
  assignmentMode?: AssignmentMode;
  steps: BookingStep[];
  problemPhotos: string[];
  couponCode?: string;
  service?: Service | string;
  customer?: User | string;
  technician?: User | string;
  workOtp?: WorkOtpView | WorkOtpAdminView;
  workStartedAt?: string;
  workCompletedAt?: string;
  tracking?: TrackingEvent[];
  otpRequired?: 'start' | 'end' | null;
  createdAt?: string;
  /** Technician view — job total for assigned active/completed jobs only */
  jobValue?: number;
}

export interface Review {
  id: string;
  bookingId: string;
  technicianId: string;
  customerId: string;
  stars: number;
  tags: string[];
  comment?: string;
  photos: string[];
}

export interface TechnicianStats {
  assigned: number;
  inProgress: number;
  completed: number;
  awaitingVerification?: number;
  rating: number;
  jobsDone: number;
  earnings: number;
  month?: string;
  attendance?: Record<string, DayAttendanceStatus>;
  todayStatus?: DayAttendanceStatus;
  analytics?: TechnicianAnalytics;
  jobVisits?: JobVisitSummary[];
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  periodCount: number;
}

export interface AdminStats {
  totalBookings: number;
  byStatus: Record<string, number>;
  statusBreakdown?: StatusBreakdownItem[];
  periodPending?: number;
  pendingBookings?: Booking[];
  revenueCompleted: number;
  periodRevenue?: number;
  periodBookings?: number;
  customers: number;
  technicians: number;
  topServices: { serviceId: string; name: string; count: number }[];
  recentBookings: Booking[];
  revenueByMonth?: { label: string; amount: number }[];
  deltas?: {
    revenue: string;
    bookings: string;
    activeJobs: string;
    customers: string;
    pending?: string;
  };
  period?: string;
}

export interface AdminCustomer extends User {
  bookingCount: number;
  totalSpend: number;
  lastBookingAt?: string;
  statusTag: 'active' | 'inactive' | 'vip';
}

export interface AdminCustomersResponse {
  customers: AdminCustomer[];
  summary: { total: number; new: number; vip: number };
}

export interface AdminTechnician extends User {
  activeJobs?: number;
  completedJobs?: number;
  lastJobDate?: string;
}

export interface TechnicianDetailStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  earnings: number;
  lastJobDate?: string;
  reviewCount: number;
}

export interface AttendanceTrendBucket {
  label: string;
  present: number;
  absent: number;
}

export interface JobsTrendBucket {
  label: string;
  completed: number;
  earnings: number;
}

export interface GlobalPendingSummary {
  count: number;
  periodCount: number;
  bookings: Booking[];
}

export type TechnicianMetricKey =
  | 'attendance_rate'
  | 'days_present'
  | 'days_absent'
  | 'completion_rate'
  | 'jobs_started'
  | 'jobs_completed'
  | 'jobs_no_show'
  | 'avg_visit'
  | 'pending_global'
  | 'status_pending'
  | 'status_confirmed'
  | 'status_in_progress'
  | 'status_awaiting_verification'
  | 'status_completed'
  | 'status_cancelled'
  | 'week_jobs'
  | 'week_earnings'
  | 'week_attendance'
  | 'active'
  | 'in_progress'
  | 'verify'
  | 'completed'
  | 'earnings';

export interface TechnicianDetailResponse {
  technician: User;
  bookings: Booking[];
  stats: TechnicianDetailStats;
  reviews: Review[];
  calendar: Record<string, number>;
  month?: string;
  attendance?: Record<string, DayAttendanceStatus>;
  analytics?: TechnicianAnalytics;
  jobVisits?: JobVisitSummary[];
  globalPending?: GlobalPendingSummary;
  statusBreakdown?: StatusBreakdownItem[];
  attendanceTrend?: AttendanceTrendBucket[];
  jobsTrend?: JobsTrendBucket[];
}

export type DayAttendanceStatus = 'came' | 'not_came' | 'pending' | 'future';

export type JobVisitStatus =
  | 'completed'
  | 'in_progress'
  | 'no_show'
  | 'scheduled'
  | 'cancelled';

export interface JobVisitSummary {
  bookingId: string;
  date: string;
  slot: string;
  status: JobVisitStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
}

export interface TechnicianAnalytics {
  daysPresent: number;
  daysAbsent: number;
  daysPending: number;
  attendanceRate: number;
  jobsScheduled: number;
  jobsCompleted: number;
  completionRate: number;
  jobsStarted?: number;
  jobsNoShow?: number;
  avgVisitMinutes?: number;
}

export interface TeamAttendanceStats {
  period: string;
  month: string;
  totalTechnicians: number;
  checkedInToday: number;
  averageAttendanceRate: number;
  lowAttendance: { id: string; name: string; rate: number }[];
}

export interface AttendanceRecord {
  id: string;
  technicianId: string;
  date: string;
  status: 'present' | 'absent';
  checkedInAt: string;
  source: 'technician' | 'admin';
  note?: string;
}
