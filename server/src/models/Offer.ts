import mongoose, { Document, Schema } from 'mongoose';

export type OfferDiscountType = 'fixed' | 'percent';

export interface IOffer extends Document {
  code: string;
  discount: number;
  discountType: OfferDiscountType;
  description: string;
  active: boolean;
  expiresAt?: Date;
  maxUses?: number;
  useCount: number;
  minOrderAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
    description: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    maxUses: { type: Number, min: 1 },
    useCount: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = String(obj._id);
        delete obj._id;
        delete obj.__v;
        if (obj.expiresAt) obj.expiresAt = (obj.expiresAt as Date).toISOString();
        return obj;
      },
    },
  },
);

export const Offer = mongoose.model<IOffer>('Offer', offerSchema);

export function isOfferCurrentlyValid(offer: IOffer, orderAmount?: number): boolean {
  if (!offer.active) return false;
  if (offer.expiresAt && offer.expiresAt < new Date()) return false;
  if (offer.maxUses != null && offer.useCount >= offer.maxUses) return false;
  if (offer.minOrderAmount != null && orderAmount != null && orderAmount < offer.minOrderAmount) {
    return false;
  }
  return true;
}

export function computeOfferDiscount(offer: IOffer, orderAmount: number): number {
  if (offer.discountType === 'percent') {
    return Math.min(orderAmount, Math.round((orderAmount * offer.discount) / 100));
  }
  return Math.min(orderAmount, offer.discount);
}
