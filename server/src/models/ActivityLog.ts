import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Admin audit trail: one entry per successful admin change (POST / PUT / PATCH / DELETE), written by
 * middleware/activityLog.ts after the response is sent. Entries expire after a year.
 * Only field NAMES are kept — never values — so passwords, codes and tokens are never stored.
 */
export const ACTIVITY_AREAS = [
  'bookings',
  'users',
  'services',
  'offers',
  'reviews',
  'settings',
  'content',
  'website',
  'leave',
  'attendance',
  'payroll',
  'broadcast',
  'other',
] as const;

export type ActivityArea = (typeof ACTIVITY_AREAS)[number];

export interface IActivityLog extends Document {
  actorId: Types.ObjectId;
  actorName: string;
  method: string;
  /** Route pattern, e.g. "/bookings/:id/cancel" (without the /api prefix). */
  route: string;
  area: ActivityArea;
  targetId?: string;
  /** What `targetId` points at: booking, user, technician, service, offer, review, blog… */
  targetType?: string;
  /** Short human name of the target ("#A1B2C3", "Ravi Kumar"). */
  targetLabel?: string;
  summary: string;
  fields: string[];
  status: number;
  createdAt: Date;
}

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, default: '' },
    method: { type: String, required: true },
    route: { type: String, required: true },
    area: { type: String, enum: ACTIVITY_AREAS, default: 'other' },
    targetId: { type: String },
    targetType: { type: String },
    targetLabel: { type: String },
    summary: { type: String, required: true },
    fields: { type: [String], default: [] },
    status: { type: Number, default: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'activity_logs' },
);

// TTL: MongoDB removes entries a year after they were written (also serves newest-first sorting).
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS });
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ area: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

export function formatActivity(doc: IActivityLog | (Record<string, unknown> & { _id: unknown })) {
  const d = doc as unknown as Record<string, unknown>;
  const at = d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt ?? '');
  return {
    id: String(d._id),
    actor: { id: String(d.actorId ?? ''), name: String(d.actorName ?? '') || 'Admin' },
    method: String(d.method ?? ''),
    route: String(d.route ?? ''),
    area: (d.area as ActivityArea) ?? 'other',
    targetId: typeof d.targetId === 'string' ? d.targetId : undefined,
    targetType: typeof d.targetType === 'string' ? d.targetType : undefined,
    targetLabel: typeof d.targetLabel === 'string' ? d.targetLabel : undefined,
    summary: String(d.summary ?? ''),
    fields: Array.isArray(d.fields) ? (d.fields as unknown[]).map(String) : [],
    at,
  };
}
