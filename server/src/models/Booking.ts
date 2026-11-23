import mongoose, { Document, Schema, Types } from 'mongoose';
import type { PropertyTypeKey } from '../constants/propertyTypes';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_verification'
  | 'completed'
  | 'cancelled';

export type StepStatus = 'pending' | 'active' | 'done';

export type PaymentMethod = 'upi_card' | 'pay_after';

export type AssignmentMode = 'auto' | 'customer_pick';

export type ScheduleMode = 'standard' | 'custom';

/** Admin-tracked payment state. Bookings saved before it existed have none (= unpaid). */
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

/** Where the booking was made: the customer app, the public website, or an admin on the customer's behalf. */
export type BookingSource = 'app' | 'website' | 'admin';

/** Internal note on a booking — admins only, never sent to customers or technicians. */
export interface IAdminNote {
  _id: Types.ObjectId;
  text: string;
  by?: Types.ObjectId;
  byName: string;
  at: Date;
}

/** Who cancelled a booking (name kept so the record survives the account being renamed or removed). */
export interface IBookingCancelActor {
  id?: Types.ObjectId;
  role: 'customer' | 'admin';
  name?: string;
}

export type TrackingEventType =
  | 'assigned'
  | 'start_otp_sent'
  | 'work_started'
  | 'step_done'
  | 'end_otp_sent'
  | 'work_completed'
  | 'cancelled'
  | 'admin_override'
  | 'schedule_confirmed'
  | 'rescheduled';

export interface IScheduleRequest {
  date: string;
  slot?: string;
  time?: string;
  notes?: string;
}

export interface IBookingSchedule {
  date: string;
  slot: string;
  time?: string;
}

export interface ITrackingEvent {
  at: Date;
  event: TrackingEventType;
  meta?: Record<string, unknown>;
}

export interface IWorkOtpEntry {
  codeHash: string;
  codeEnc: string;
  codeSuffix: string;
  expiresAt: Date;
  verifiedAt?: Date;
}

export interface IWorkOtp {
  start?: IWorkOtpEntry;
  end?: IWorkOtpEntry;
}

export interface IOtpAttempts {
  start: number;
  end: number;
  startLockedUntil?: Date;
  endLockedUntil?: Date;
}

export interface IBookingStep {
  title: string;
  description?: string;
  status: StepStatus;
  /** Primary / first photo (legacy + convenience). */
  photoUrl?: string;
  /** All progress photos for this step (up to MAX_STEP_PHOTOS). */
  photoUrls?: string[];
  capturedAt?: Date;
  geo?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  technicianId?: Types.ObjectId;
  assignmentMode: AssignmentMode;
  scheduleMode: ScheduleMode;
  scheduleRequest: IScheduleRequest;
  schedule: IBookingSchedule;
  scheduleConfirmedAt?: Date;
  /** Times the customer moved this visit (Business settings → Booking rules → max reschedules). */
  rescheduleCount?: number;
  /** Technician the customer asked for; auto-assign tries them first when they are free. */
  preferredTechnicianId?: Types.ObjectId;
  /** Built-in key (1bhk…) or one the admin added in Business settings → Lists → Property types. */
  propertyType?: PropertyTypeKey | (string & {});
  /** Size/package the customer picked — label and price locked at booking time. */
  option?: { key: string; label: string; price: number };
  address: string;
  amount: {
    base: number;
    gst: number;
    coupon: number;
    total: number;
    /** GST rate charged (missing on bookings made before rates were stored = 18). */
    gstPercent?: number;
  };
  /** Locked technician take-home when job is completed (admin pay rules). */
  technicianEarning?: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  steps: IBookingStep[];
  problemPhotos: string[];
  couponCode?: string;
  workOtp?: IWorkOtp;
  workStartedAt?: Date;
  workCompletedAt?: Date;
  tracking?: ITrackingEvent[];
  otpAttempts?: IOtpAttempts;
  /** Admin-tracked payment (default unpaid). */
  paymentStatus?: PaymentStatus;
  paidAt?: Date;
  /** Payment method key from Business settings → Payments, or 'cash'. */
  paidVia?: string;
  /** Transaction / receipt reference typed by the admin. */
  paymentRef?: string;
  refundedAt?: Date;
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: IBookingCancelActor;
  /** Internal admin notes (newest last). */
  adminNotes?: IAdminNote[];
  /** Admin who booked this visit on the customer's behalf. */
  createdByAdmin?: { id: Types.ObjectId; name: string };
  source?: BookingSource;
  createdAt: Date;
  updatedAt: Date;
}

const geoSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  { _id: false },
);

const bookingStepSchema = new Schema<IBookingStep>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'active', 'done'],
      default: 'pending',
    },
    photoUrl: { type: String },
    photoUrls: { type: [String], default: undefined },
    capturedAt: { type: Date },
    geo: { type: geoSchema },
  },
  { _id: false },
);

const amountSchema = new Schema(
  {
    base: { type: Number, required: true },
    gst: { type: Number, required: true },
    coupon: { type: Number, default: 0 },
    total: { type: Number, required: true },
    gstPercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const scheduleRequestSchema = new Schema(
  {
    date: { type: String, required: true },
    slot: { type: String },
    time: { type: String },
    notes: { type: String },
  },
  { _id: false },
);

const scheduleSchema = new Schema(
  {
    date: { type: String, required: true },
    slot: { type: String, required: true },
    time: { type: String },
  },
  { _id: false },
);

const workOtpEntrySchema = new Schema(
  {
    codeHash: { type: String, required: true },
    codeEnc: { type: String, required: true },
    codeSuffix: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
  },
  { _id: false },
);

const trackingEventSchema = new Schema(
  {
    at: { type: Date, required: true },
    event: {
      type: String,
      enum: [
        'assigned',
        'start_otp_sent',
        'work_started',
        'step_done',
        'end_otp_sent',
        'work_completed',
        'cancelled',
        'admin_override',
        'schedule_confirmed',
        'rescheduled',
      ],
      required: true,
    },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const adminNoteSchema = new Schema<IAdminNote>({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  by: { type: Schema.Types.ObjectId, ref: 'User' },
  byName: { type: String, default: '' },
  at: { type: Date, required: true },
});

const cancelActorSchema = new Schema<IBookingCancelActor>(
  {
    id: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['customer', 'admin'], required: true },
    name: { type: String, trim: true },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignmentMode: {
      type: String,
      enum: ['auto', 'customer_pick'],
      default: 'auto',
    },
    scheduleMode: {
      type: String,
      enum: ['standard', 'custom'],
      default: 'standard',
    },
    scheduleRequest: { type: scheduleRequestSchema, required: true },
    schedule: { type: scheduleSchema, required: true },
    scheduleConfirmedAt: { type: Date },
    rescheduleCount: { type: Number, min: 0, default: 0 },
    preferredTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    // Keys come from Business settings (built-in ones plus any the admin adds); the booking route checks them.
    propertyType: { type: String, trim: true, match: /^[a-z0-9_]{1,40}$/ },
    option: {
      type: new Schema({ key: String, label: String, price: Number }, { _id: false }),
      required: false,
    },
    address: { type: String, required: true },
    amount: { type: amountSchema, required: true },
    technicianEarning: { type: Number, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['upi_card', 'pay_after'],
      default: 'upi_card',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'in_progress',
        'awaiting_verification',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    steps: { type: [bookingStepSchema], default: [] },
    problemPhotos: { type: [String], default: [] },
    couponCode: { type: String },
    workOtp: {
      start: { type: workOtpEntrySchema },
      end: { type: workOtpEntrySchema },
    },
    workStartedAt: { type: Date },
    workCompletedAt: { type: Date },
    tracking: { type: [trackingEventSchema], default: [] },
    otpAttempts: {
      start: { type: Number, default: 0 },
      end: { type: Number, default: 0 },
      startLockedUntil: { type: Date },
      endLockedUntil: { type: Date },
    },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paidAt: { type: Date },
    paidVia: { type: String, trim: true, maxlength: 40 },
    paymentRef: { type: String, trim: true, maxlength: 120 },
    refundedAt: { type: Date },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    cancelledAt: { type: Date },
    cancelledBy: { type: cancelActorSchema },
    adminNotes: { type: [adminNoteSchema], default: undefined },
    createdByAdmin: {
      type: new Schema(
        { id: { type: Schema.Types.ObjectId, ref: 'User' }, name: { type: String, trim: true } },
        { _id: false },
      ),
    },
    source: { type: String, enum: ['app', 'website', 'admin'] },
  },
  { timestamps: true },
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
