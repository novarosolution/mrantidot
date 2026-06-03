import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: string;
  read: boolean;
  bookingId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = String(obj._id);
        if (obj.bookingId) obj.bookingId = String(obj.bookingId);
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
