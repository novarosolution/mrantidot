import mongoose, { Document, Schema } from 'mongoose';
import { normalizePhone } from '../utils/phone';

export type UserRole = 'customer' | 'technician' | 'admin';

export interface IUser extends Document {
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  city?: string;
  rating: number;
  jobsDone: number;
  available: boolean;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    jobsDone: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
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
