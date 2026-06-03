import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentMethodType = 'upi_card' | 'pay_after';

export interface IPaymentMethod extends Document {
  customerId: Types.ObjectId;
  type: PaymentMethodType;
  label: string;
  details?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['upi_card', 'pay_after'], required: true },
    label: { type: String, required: true, trim: true },
    details: { type: String, trim: true },
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

export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
