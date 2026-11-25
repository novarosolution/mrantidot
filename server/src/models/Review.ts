import mongoose, { Document, Schema, Types } from 'mongoose';

/** The business's public answer to a review (one per review; customers see the text and time). */
export interface IReviewReply {
  text: string;
  /** Admin who wrote / last edited it — shown in the admin only. */
  byId?: Types.ObjectId;
  byName: string;
  at: Date;
  editedAt?: Date;
}

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  technicianId: Types.ObjectId;
  customerId: Types.ObjectId;
  stars: number;
  tags: string[];
  comment?: string;
  photos: string[];
  hidden: boolean;
  reply?: IReviewReply | null;
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReviewReply>(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    byId: { type: Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, required: true, trim: true },
    at: { type: Date, required: true },
    editedAt: { type: Date },
  },
  { _id: false },
);

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
    reply: { type: replySchema, default: null },
  },
  { timestamps: true },
);

reviewSchema.index({ bookingId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

/** Reply as customers / the website see it (no admin name). */
export function publicReviewReply(reply: IReviewReply | null | undefined): { text: string; at: string } | undefined {
  if (!reply?.text) return undefined;
  return { text: reply.text, at: new Date(reply.editedAt ?? reply.at).toISOString() };
}

/** Reply as the admin reads it. */
export function adminReviewReply(reply: IReviewReply | null | undefined) {
  if (!reply?.text) return null;
  return {
    text: reply.text,
    byId: reply.byId ? String(reply.byId) : undefined,
    byName: reply.byName,
    at: new Date(reply.at).toISOString(),
    editedAt: reply.editedAt ? new Date(reply.editedAt).toISOString() : undefined,
  };
}
