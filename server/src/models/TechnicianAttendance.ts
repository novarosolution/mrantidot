import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent';
export type AttendanceSource = 'technician' | 'admin';

export interface ITechnicianAttendance extends Document {
  technicianId: Types.ObjectId;
  date: string;
  status: AttendanceStatus;
  checkedInAt: Date;
  source: AttendanceSource;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<ITechnicianAttendance>(
  {
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, trim: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    checkedInAt: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ['technician', 'admin'], required: true },
    note: { type: String, trim: true },
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

attendanceSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export const TechnicianAttendance = mongoose.model<ITechnicianAttendance>(
  'TechnicianAttendance',
  attendanceSchema,
);

export function formatAttendance(record: ITechnicianAttendance) {
  const doc = record.toObject ? record.toObject() : record;
  return {
    id: String(doc._id),
    technicianId: String(doc.technicianId),
    date: doc.date,
    status: doc.status,
    checkedInAt: doc.checkedInAt instanceof Date ? doc.checkedInAt.toISOString() : doc.checkedInAt,
    source: doc.source,
    note: doc.note,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
