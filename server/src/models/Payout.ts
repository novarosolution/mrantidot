import mongoose, { Document, Schema, Types } from 'mongoose';

export type PayoutMethod = 'cash' | 'upi' | 'bank' | 'other';

export const PAYOUT_METHODS: readonly PayoutMethod[] = ['cash', 'upi', 'bank', 'other'];

/**
 * Money paid to a technician for a pay period (Payroll → Record payout). `periodFrom` / `periodTo` are the
 * business days (YYYY-MM-DD) the payout settles; payroll counts it for any range that holds that whole period.
 */
export interface IPayout extends Document {
  technicianId: Types.ObjectId;
  periodFrom: string;
  periodTo: string;
  /** Whole rupees, > 0. */
  amount: number;
  method: PayoutMethod;
  /** UPI / bank transaction id, receipt number… */
  reference?: string;
  paidAt: Date;
  note?: string;
  createdBy: Types.ObjectId;
  /** Kept so the record still reads well if the admin account is renamed or removed. */
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const payoutSchema = new Schema<IPayout>(
  {
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    periodFrom: { type: String, required: true, match: DATE_KEY },
    periodTo: { type: String, required: true, match: DATE_KEY },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    reference: { type: String, trim: true, maxlength: 120 },
    paidAt: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, trim: true },
  },
  { timestamps: true },
);

payoutSchema.index({ technicianId: 1, periodTo: -1 });
payoutSchema.index({ periodFrom: 1, periodTo: 1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
