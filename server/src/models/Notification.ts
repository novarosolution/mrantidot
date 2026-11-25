import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Where a notification opens (broadcasts): a service page, the offers screen, or an https web page.
 * `label` is a display name saved at send time (e.g. the service name).
 */
export interface INotificationLink {
  kind: 'service' | 'offers' | 'url';
  serviceId?: Types.ObjectId;
  url?: string;
  label?: string;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: string;
  read: boolean;
  bookingId?: Types.ObjectId;
  link?: INotificationLink;
  /** Set on notifications sent by an admin broadcast. */
  broadcastId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const notificationLinkSchema = new Schema<INotificationLink>(
  {
    kind: { type: String, enum: ['service', 'offers', 'url'], required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    url: { type: String, trim: true, maxlength: 500 },
    label: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    link: { type: notificationLinkSchema },
    broadcastId: { type: Schema.Types.ObjectId, ref: 'Broadcast' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = String(obj._id);
        if (obj.bookingId) obj.bookingId = String(obj.bookingId);
        if (obj.broadcastId) obj.broadcastId = String(obj.broadcastId);
        const link = obj.link as Record<string, unknown> | undefined;
        if (link && link.serviceId) obj.link = { ...link, serviceId: String(link.serviceId) };
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

// Inbox paging (newest first per person) and broadcast read counts.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index(
  { broadcastId: 1, read: 1 },
  { partialFilterExpression: { broadcastId: { $exists: true } } },
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
