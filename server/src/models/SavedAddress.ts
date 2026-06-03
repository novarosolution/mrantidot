import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedAddress extends Document {
  customerId: Types.ObjectId;
  label: string;
  line1: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const savedAddressSchema = new Schema<ISavedAddress>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = String(obj._id);
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

export const SavedAddress = mongoose.model<ISavedAddress>('SavedAddress', savedAddressSchema);

export function formatAddressLine(addr: ISavedAddress): string {
  const parts = [addr.line1, addr.city, addr.pincode].filter(Boolean);
  return parts.join(', ');
}
