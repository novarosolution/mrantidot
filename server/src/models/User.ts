import mongoose, { Document, Schema, Types } from 'mongoose';
import { normalizePhone } from '../utils/phone';

export type UserRole = 'customer' | 'technician' | 'admin';

/** Internal note on a customer — admins only, never sent to the customer. */
export interface IUserAdminNote {
  _id: Types.ObjectId;
  text: string;
  by?: Types.ObjectId;
  byName: string;
  at: Date;
}

/** Admin's VIP decision for a customer; null / missing = the Business settings rule decides. */
export type VipOverride = 'vip' | 'not_vip';

export interface IUser extends Document {
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  city?: string;
  /** Real average from customer reviews (updated automatically). */
  rating: number;
  /** Public rating override set by admin; customers see this when set. */
  displayRating?: number | null;
  jobsDone: number;
  available: boolean;
  disabled: boolean;
  /** Technician pay: percent of job total, or flat ₹ per completed job. */
  payMode?: 'percent' | 'flat';
  payPercent?: number;
  payFlat?: number;
  /**
   * Technician coverage (auto-assign and the assign picker use it):
   * pest-type keys they treat (Business settings → Lists → Pest names; empty = every type),
   * cities / pincodes they cover (a subset of the business service area; both empty = anywhere),
   * weekly days off (0 = Sunday … 6 = Saturday) and the most jobs they take in a day (null = no cap).
   */
  skills: string[];
  serviceCities: string[];
  servicePincodes: string[];
  offDays: number[];
  maxJobsPerDay?: number | null;
  /** Customer CRM — admins only (never in the customer's own JSON, see `adminUserJson`). */
  adminNotes: IUserAdminNote[];
  tags: string[];
  vipOverride?: VipOverride | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminNoteSchema = new Schema<IUserAdminNote>(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, required: true, trim: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

/** Admin-only fields stripped from every default user JSON (`/auth/me`, bookings, lists). */
const ADMIN_ONLY_FIELDS = ['adminNotes', 'tags', 'vipOverride'] as const;
/** Technician-only fields, left out of other accounts' JSON. */
const TECHNICIAN_FIELDS = ['skills', 'serviceCities', 'servicePincodes', 'offDays', 'maxJobsPerDay'] as const;

const userSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['customer', 'technician', 'admin'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    city: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    displayRating: { type: Number, default: null, min: 0, max: 5 },
    jobsDone: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    payMode: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    payPercent: { type: Number, default: 100, min: 0, max: 100 },
    payFlat: { type: Number, default: 0, min: 0 },
    skills: { type: [String], default: [] },
    serviceCities: { type: [String], default: [] },
    servicePincodes: { type: [String], default: [] },
    offDays: { type: [Number], default: [] },
    maxJobsPerDay: { type: Number, default: null, min: 1, max: 50 },
    adminNotes: { type: [adminNoteSchema], default: [] },
    tags: { type: [String], default: [] },
    vipOverride: { type: String, enum: ['vip', 'not_vip'], default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = String(obj._id);
        delete obj._id;
        delete obj.__v;
        delete obj.passwordHash;
        for (const field of ADMIN_ONLY_FIELDS) delete obj[field];
        if (obj.role !== 'technician') for (const field of TECHNICIAN_FIELDS) delete obj[field];
        return obj;
      },
    },
  },
);

userSchema.pre('save', function normalizePhoneField(next) {
  if (this.isModified('phone') && typeof this.phone === 'string') {
    this.phone = normalizePhone(this.phone);
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);

export function sanitizeUser(user: IUser): Record<string, unknown> {
  return user.toJSON();
}

/** One customer note as the admin apps read it. */
export function formatAdminNote(note: IUserAdminNote) {
  return {
    id: String(note._id),
    text: note.text,
    by: note.by ? String(note.by) : undefined,
    byName: note.byName,
    at: note.at instanceof Date ? note.at.toISOString() : String(note.at),
  };
}

/** Admin view of an account: the usual JSON plus the CRM fields (notes newest first, tags, VIP override). */
export function adminUserJson(user: IUser): Record<string, unknown> {
  const json = sanitizeUser(user);
  const notes = [...(user.adminNotes ?? [])].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  json.adminNotes = notes.map(formatAdminNote);
  json.tags = [...(user.tags ?? [])];
  json.vipOverride = user.vipOverride ?? null;
  return json;
}
