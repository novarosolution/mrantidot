import mongoose, { Schema, Types } from 'mongoose';

/**
 * Business rules the admin can change without a code release (tax, slots, booking rules, lists,
 * service area, payments, app status, notification texts). One document, key 'business'.
 *
 * The rules are stored as one loose object and always read through `normalizeBusinessSettings`
 * (utils/businessSettings.ts), which fills anything missing from the built-in defaults — so new
 * fields added in code reach older documents automatically.
 */
export interface IBusinessSettingsDoc {
  key: string;
  settings: Record<string, unknown>;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<IBusinessSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'business' },
    settings: { type: Schema.Types.Mixed, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'business_settings', minimize: false },
);

export const BusinessSettingsModel = mongoose.model<IBusinessSettingsDoc>('BusinessSettings', businessSettingsSchema);
