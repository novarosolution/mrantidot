import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  technicianId: Types.ObjectId;
  customerId: Types.ObjectId;
  stars: number;
  tags: string[];
  comment?: string;
  photos: string[];
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    tags: { type: [String], default: [] },
    comment: { type: String },
    photos: { type: [String], default: [] },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
