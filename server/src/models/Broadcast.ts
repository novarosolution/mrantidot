import mongoose, { Document, Schema, Types } from 'mongoose';
import { notificationLinkSchema, type INotificationLink } from './Notification';

/** Who an admin broadcast goes to. `user` = one person (`userId`). */
export const BROADCAST_AUDIENCES = ['customers', 'technicians', 'everyone', 'user'] as const;
export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number];

/** History of in-app notices an admin sent (one in-app notification per recipient). */
export interface IBroadcast extends Document {
  senderId: Types.ObjectId;
  senderName: string;
  audience: BroadcastAudience;
  userId?: Types.ObjectId;
  userName?: string;
  title: string;
  body: string;
  link?: INotificationLink;
  recipientCount: number;
  createdAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, default: '' },
    audience: { type: String, enum: BROADCAST_AUDIENCES, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    body: { type: String, required: true, trim: true, maxlength: 300 },
    link: { type: notificationLinkSchema },
    recipientCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ senderId: 1, createdAt: -1 });

export const Broadcast = mongoose.model<IBroadcast>('Broadcast', broadcastSchema);

export function formatBroadcast(doc: IBroadcast, readCount = 0) {
  const link = doc.link
    ? {
        kind: doc.link.kind,
        serviceId: doc.link.serviceId ? String(doc.link.serviceId) : undefined,
        url: doc.link.url,
        label: doc.link.label,
      }
    : undefined;
  return {
    id: String(doc._id),
    sender: { id: String(doc.senderId), name: doc.senderName || 'Admin' },
    audience: doc.audience,
    user: doc.userId ? { id: String(doc.userId), name: doc.userName ?? '' } : undefined,
    title: doc.title,
    body: doc.body,
    link,
    recipientCount: doc.recipientCount ?? 0,
    readCount,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ''),
  };
}
