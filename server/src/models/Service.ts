import mongoose, { Document, Schema } from 'mongoose';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '../constants/serviceTypes';

export type ServiceCategory = 'residential' | 'commercial' | 'cleaning' | 'general';

/** One bookable size/package (e.g. "2 BHK") — when a service has options, the booking is priced from the picked one. */
export interface IServiceOption {
  key: string;
  label: string;
  price: number;
  /** Short helper line under the label, e.g. "Up to 1,000 sq ft". */
  note?: string;
}

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
  /** Admin-set display position — lower shows first in every list. */
  sortOrder: number;
  /** Pinned into the home "Most booked" rail (in sortOrder). None pinned → ranked by bookings. */
  showInPopular: boolean;
  /** Listed in the home "All services" section. */
  showOnHome: boolean;
  /** Heading above the options picker, e.g. "Size of home". */
  optionsTitle: string;
  options: IServiceOption[];
  /** Approx. visit length in minutes (0 = derive from steps). */
  durationMins: number;
  /** Short bullets shown on service rows. */
  highlights: string[];
  /** "What is included" — admin-written lines. */
  included: string[];
  /** "What is excluded?" */
  excluded: string[];
  /** "Please note" */
  notes: string[];
  /** Optional photo for website cards/detail (pest art is the fallback). */
  coverImage?: { url: string; alt: string };
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IServiceOption>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
  },
  { _id: false },
);

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
    sortOrder: { type: Number, default: 1000 },
    showInPopular: { type: Boolean, default: false },
    showOnHome: { type: Boolean, default: true },
    optionsTitle: { type: String, trim: true, default: 'Size of home' },
    options: { type: [optionSchema], default: [] },
    durationMins: { type: Number, min: 0, default: 0 },
    highlights: { type: [String], default: [] },
    included: { type: [String], default: [] },
    excluded: { type: [String], default: [] },
    notes: { type: [String], default: [] },
    coverImage: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
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
