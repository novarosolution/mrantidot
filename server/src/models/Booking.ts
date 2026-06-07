import mongoose, { Document, Schema, Types } from 'mongoose';
import type { PropertyTypeKey } from '../constants/propertyTypes';
import { PROPERTY_TYPE_KEYS } from '../constants/propertyTypes';

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
  photoUrl?: string;
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
  propertyType?: PropertyTypeKey;
  address: string;
  amount: {
    base: number;
    gst: number;
    coupon: number;
    total: number;
  };
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
      ],
      required: true,
    },
    meta: { type: Schema.Types.Mixed },
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
    propertyType: { type: String, enum: PROPERTY_TYPE_KEYS },
    address: { type: String, required: true },
    amount: { type: amountSchema, required: true },
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
  },
  { timestamps: true },
);

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
