import mongoose, { Document, Schema, Types } from 'mongoose';

export type LeaveType = 'casual' | 'sick' | 'emergency' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ILeaveRequest extends Document {
  technicianId: Types.ObjectId;
  from: string;
  to: string;
  type: LeaveType;
  status: LeaveStatus;
  reason?: string;
  adminNote?: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeaveRequest>(
  {
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['casual', 'sick', 'emergency', 'other'],
      required: true,
      default: 'casual',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      required: true,
      default: 'pending',
      index: true,
    },
    reason: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
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

leaveSchema.index({ technicianId: 1, from: 1, to: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveSchema);

export function formatLeaveRequest(
  doc: ILeaveRequest,
  tech?: { name?: string; phone?: string } | null,
) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    technicianId: String(o.technicianId),
    technicianName: tech?.name,
    technicianPhone: tech?.phone,
    from: o.from,
    to: o.to,
    type: o.type,
    status: o.status,
    reason: o.reason,
    adminNote: o.adminNote,
    decidedBy: o.decidedBy ? String(o.decidedBy) : undefined,
    decidedAt: o.decidedAt instanceof Date ? o.decidedAt.toISOString() : o.decidedAt,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  };
}
