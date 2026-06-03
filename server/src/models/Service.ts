import mongoose, { Document, Schema } from 'mongoose';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '../constants/serviceTypes';

export type ServiceCategory = 'residential' | 'commercial' | 'cleaning' | 'general';

export interface IService extends Document {
  name: string;
  iconKey: string;
  basePrice: number;
  shortDesc: string;
  rating: number;
  category: ServiceCategory;
  /** Pest/treatment types covered — e.g. ant, cockroach (multiple allowed). */
  serviceTypes: ServiceTypeKey[];
  active: boolean;
  stepTemplate: string[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    iconKey: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    shortDesc: { type: String, required: true, trim: true },
    rating: { type: Number, default: 4.8 },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'cleaning', 'general'],
      default: 'general',
    },
    serviceTypes: {
      type: [String],
      enum: SERVICE_TYPE_KEYS,
      default: [],
    },
    active: { type: Boolean, default: true },
    stepTemplate: { type: [String], default: [] },
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

export const Service = mongoose.model<IService>('Service', serviceSchema);
