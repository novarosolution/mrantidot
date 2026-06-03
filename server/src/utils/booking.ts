import { Types } from 'mongoose';
import { Booking, IBooking, IBookingStep } from '../models/Booking';
import { IService } from '../models/Service';
import { User } from '../models/User';
import { AppError } from './AppError';
import { couponValue } from './coupons';

export async function computeAmount(basePrice: number, couponCode?: string) {
  const base = basePrice;
  const gst = Math.round(base * 0.18);
  const orderAmount = base + gst;
  const coupon = await couponValue(couponCode, orderAmount);
  const total = Math.max(0, orderAmount - coupon);
  return { base, gst, coupon, total };
}

export function buildStepsFromTemplate(template: string[]): IBookingStep[] {
  return template.map((title, index) => ({
    title,
    description: title,
    status: index === 0 ? 'active' : 'pending',
  }));
}

export async function assignLeastBusyTechnician(): Promise<Types.ObjectId | undefined> {
  const technicians = await User.find({
    role: 'technician',
    available: true,
    disabled: { $ne: true },
  }).select('_id');

  if (technicians.length === 0) return undefined;

  const counts = await Promise.all(
    technicians.map(async (tech) => {
      const count = await Booking.countDocuments({
        technicianId: tech._id,
        status: { $in: ['confirmed', 'in_progress', 'awaiting_verification'] },
      });
      return { id: tech._id, count };
    }),
  );

  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.id;
}

/** Resolve technician from customer booking: pick one tech, or leave unassigned for admin (auto). */
export async function resolveTechnicianForBooking(body: {
  technicianId?: string;
  assignmentMode?: string;
}): Promise<{ technicianId?: Types.ObjectId; assignmentMode: 'auto' | 'customer_pick' }> {
  if (body.technicianId) {
    const tech = await User.findOne({
      _id: body.technicianId,
      role: 'technician',
      available: { $ne: false },
      disabled: { $ne: true },
    });
    if (!tech) {
      throw new AppError(400, 'Selected technician is not available');
    }
    return { technicianId: tech._id, assignmentMode: 'customer_pick' };
  }

  const mode = body.assignmentMode === 'customer_pick' ? 'customer_pick' : 'auto';
  if (mode === 'customer_pick') {
    throw new AppError(400, 'Please select a technician or choose auto assign');
  }

  return { assignmentMode: 'auto' };
}

export function activateNextStep(steps: IBookingStep[]): IBookingStep[] {
  const updated = steps.map((s) => ({ ...s }));
  const allDone = updated.every((s) => s.status === 'done');
  if (allDone) return updated;

  const nextPending = updated.findIndex((s) => s.status === 'pending');
  if (nextPending >= 0) {
    updated[nextPending] = { ...updated[nextPending], status: 'active' };
  }
  return updated;
}

export function allStepsDone(steps: IBookingStep[]): boolean {
  return steps.length > 0 && steps.every((s) => s.status === 'done');
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_verification', 'cancelled'],
  awaiting_verification: ['completed'],
};

export function assertStatusTransition(current: string, next: string): void {
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new Error(`Invalid status transition from ${current} to ${next}`);
  }
}

export function initServiceSteps(service: IService): IBookingStep[] {
  const template =
    service.stepTemplate.length > 0
      ? service.stepTemplate
      : ['Arrival', 'Before', 'During', 'After', 'Sign-off'];
  return buildStepsFromTemplate(template);
}
