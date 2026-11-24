import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * A one-off change to what a technician is owed (Payroll → Add adjustment): `amount` > 0 is a bonus,
 * < 0 a deduction. Counted in the payroll of the range that holds `date` (YYYY-MM-DD, business day).
 */
export interface IPayAdjustment extends Document {
  technicianId: Types.ObjectId;
  date: string;
  /** Whole rupees, never 0. */
  amount: number;
  reason: string;
  createdBy: Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payAdjustmentSchema = new Schema<IPayAdjustment>(
  {
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    amount: {
      type: Number,
      required: true,
      validate: { validator: (n: number) => Number.isFinite(n) && n !== 0, message: 'Enter a bonus or a deduction amount' },
    },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, trim: true },
  },
  { timestamps: true },
);

payAdjustmentSchema.index({ technicianId: 1, date: -1 });
payAdjustmentSchema.index({ date: 1 });

export const PayAdjustment = mongoose.model<IPayAdjustment>('PayAdjustment', payAdjustmentSchema);
