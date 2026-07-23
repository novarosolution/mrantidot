import { Document, Types } from 'mongoose';
import { IUser } from '../models/User';
import { IService } from '../models/Service';
import { IBooking } from '../models/Booking';
import { IReview } from '../models/Review';
import { PROPERTY_TYPE_LABELS } from '../constants/propertyTypes';
import {
  decryptCode,
  getCustomerOtpCode,
  getOtpExpiresIn,
  otpRequiredForBooking,
} from './workOtp';
import { payConfigFromUser, resolveTechEarning, type TechPayConfig } from './techPay';
import { normalizeStepPhotoUrls } from './stepPhotos';

function oid(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function formatUser(user: IUser | null | undefined) {
  if (!user) return undefined;
  return user.toJSON();
}

export function formatService(service: IService) {
  const json = service.toJSON ? service.toJSON() : service;
  const obj = json as Record<string, unknown>;
  if (!obj.id && obj._id) obj.id = String(obj._id);
  return obj;
}

function sanitizeStepsForCustomer(
  steps: unknown[],
): Array<{
  title: string;
  status: string;
  photoUrl?: string;
  photoUrls?: string[];
  capturedAt?: string;
}> {
  if (!Array.isArray(steps)) return [];
  return steps.map((raw) => {
    const s = raw as Record<string, unknown>;
    const photoUrls = Array.isArray(s.photoUrls)
      ? (s.photoUrls as unknown[]).filter((u): u is string => typeof u === 'string')
      : undefined;
    const photoUrl =
      typeof s.photoUrl === 'string'
        ? s.photoUrl
        : photoUrls?.[0];
    return {
      title: String(s.title ?? 'Step'),
      status: String(s.status ?? 'pending'),
      photoUrl,
      ...(photoUrls?.length ? { photoUrls } : photoUrl ? { photoUrls: [photoUrl] } : {}),
      capturedAt: isoDate(s.capturedAt),
    };
  });
}

function customerContactForTech(
  customer: ReturnType<typeof formatUser> | string | undefined,
): { name: string; phone?: string } | undefined {
  if (!customer || typeof customer !== 'object') return undefined;
  return { name: customer.name, phone: customer.phone };
}

function formatTracking(booking: IBooking) {
  return (booking.tracking ?? []).map((t) => ({
    at: isoDate(t.at)!,
    event: t.event,
    meta: t.meta,
  }));
}

function formatWorkOtpForCustomer(booking: IBooking) {
  const startCode = getCustomerOtpCode(booking, 'start');
  const endCode = getCustomerOtpCode(booking, 'end');
  return {
    start: startCode
      ? { code: startCode, expiresIn: getOtpExpiresIn(booking.workOtp?.start) }
      : undefined,
    end: endCode
      ? { code: endCode, expiresIn: getOtpExpiresIn(booking.workOtp?.end) }
      : undefined,
  };
}

function formatWorkOtpForAdmin(booking: IBooking) {
  const start = booking.workOtp?.start;
  const end = booking.workOtp?.end;
  const startCode = start?.codeEnc && !start.verifiedAt ? decryptCode(start.codeEnc) : undefined;
  const endCode = end?.codeEnc && !end.verifiedAt ? decryptCode(end.codeEnc) : undefined;
  return {
    start: start
      ? {
          masked: `••••${start.codeSuffix}`,
          code: startCode,
          verifiedAt: isoDate(start.verifiedAt),
          expiresAt: isoDate(start.expiresAt),
        }
      : undefined,
    end: end
      ? {
          masked: `••••${end.codeSuffix}`,
          code: endCode,
          verifiedAt: isoDate(end.verifiedAt),
          expiresAt: isoDate(end.expiresAt),
        }
      : undefined,
  };
}

function formatBookingForTechnician(
  booking: IBooking,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const customer = customerContactForTech(
    base.customer as ReturnType<typeof formatUser> | string | undefined,
  );
  const status = String(base.status ?? '');
  const amount = base.amount as { total?: number } | undefined;
  const showPay =
    ['confirmed', 'completed', 'in_progress', 'awaiting_verification'].includes(status) &&
    amount?.total != null;
  const techPay =
    base.technician && typeof base.technician === 'object'
      ? payConfigFromUser(base.technician as TechPayConfig)
      : undefined;
  const techEarning = showPay
    ? resolveTechEarning(
        { technicianEarning: booking.technicianEarning, amount },
        techPay,
      )
    : undefined;
  return {
    id: base.id,
    serviceId: base.serviceId,
    service: base.service,
    schedule: base.schedule,
    scheduleMode: base.scheduleMode,
    scheduleRequest: base.scheduleRequest,
    scheduleConfirmedAt: base.scheduleConfirmedAt,
    propertyType: base.propertyType,
    propertyTypeLabel: base.propertyTypeLabel,
    address: base.address,
    status: base.status,
    assignmentMode: base.assignmentMode,
    steps: base.steps,
    problemPhotos: base.problemPhotos,
    otpRequired: otpRequiredForBooking(booking),
    workStartedAt: base.workStartedAt,
    workCompletedAt: base.workCompletedAt,
    tracking: formatTracking(booking),
    ...(showPay && amount?.total != null ? { jobValue: amount.total } : {}),
    ...(techEarning != null ? { techEarning } : {}),
    ...(customer ? { customer } : {}),
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

/** Role-aware booking payload — customers do not receive admin/ops fields. */
export function formatBookingForRole(
  booking: IBooking & { populate?: unknown },
  role: string,
): Record<string, unknown> {
  const base = formatBooking(booking) as Record<string, unknown>;
  if (role === 'customer') {
    return {
      ...base,
      customerId: undefined,
      customer: undefined,
      technicianId: undefined,
      technician: undefined,
      assignmentMode: undefined,
      steps: sanitizeStepsForCustomer(base.steps as unknown[]),
      workOtp: formatWorkOtpForCustomer(booking),
      tracking: formatTracking(booking),
    };
  }
  if (role === 'technician') {
    return formatBookingForTechnician(booking, base);
  }
  return {
    ...base,
    workOtp: formatWorkOtpForAdmin(booking),
    tracking: formatTracking(booking),
  };
}

export function formatBooking(booking: IBooking & { populate?: unknown }) {
  const raw = booking as IBooking & {
    customerId?: IUser | Types.ObjectId;
    serviceId?: IService | Types.ObjectId;
    technicianId?: IUser | Types.ObjectId;
  };

  const customer =
    raw.customerId && typeof raw.customerId === 'object' && 'email' in raw.customerId
      ? formatUser(raw.customerId as IUser)
      : oid(raw.customerId);

  const service =
    raw.serviceId && typeof raw.serviceId === 'object' && 'name' in raw.serviceId
      ? formatService(raw.serviceId as IService)
      : oid(raw.serviceId);

  const technician =
    raw.technicianId && typeof raw.technicianId === 'object' && 'email' in raw.technicianId
      ? formatUser(raw.technicianId as IUser)
      : raw.technicianId
        ? oid(raw.technicianId)
        : undefined;

  const doc = booking.toObject ? booking.toObject() : (booking as unknown as Record<string, unknown>);
  const id = String(doc._id ?? (doc as { id?: string }).id ?? '');

  const rawSteps = Array.isArray(doc.steps) ? doc.steps : [];
  const steps = rawSteps.map((raw: unknown) => {
    const s = raw as Record<string, unknown>;
    const photoUrls = normalizeStepPhotoUrls({
      photoUrl: typeof s.photoUrl === 'string' ? s.photoUrl : undefined,
      photoUrls: Array.isArray(s.photoUrls) ? (s.photoUrls as string[]) : undefined,
    });
    return {
      ...s,
      photoUrls,
      photoUrl: photoUrls[0],
      capturedAt: isoDate(s.capturedAt) ?? s.capturedAt,
    };
  });

  return {
    id,
    customerId: oid(doc.customerId),
    serviceId: oid(doc.serviceId),
    technicianId: oid(doc.technicianId),
    customer,
    service,
    technician,
    schedule: doc.schedule,
    scheduleMode: doc.scheduleMode ?? 'standard',
    scheduleRequest: doc.scheduleRequest,
    scheduleConfirmedAt: isoDate(doc.scheduleConfirmedAt),
    propertyType: doc.propertyType,
    propertyTypeLabel: doc.propertyType
      ? PROPERTY_TYPE_LABELS[doc.propertyType as keyof typeof PROPERTY_TYPE_LABELS]
      : undefined,
    address: doc.address,
    amount: doc.amount,
    technicianEarning:
      typeof doc.technicianEarning === 'number' ? doc.technicianEarning : undefined,
    paymentMethod: doc.paymentMethod,
    status: doc.status,
    assignmentMode: doc.assignmentMode ?? 'auto',
    steps,
    problemPhotos: Array.isArray(doc.problemPhotos) ? doc.problemPhotos : [],
    couponCode: doc.couponCode,
    workStartedAt: isoDate(doc.workStartedAt),
    workCompletedAt: isoDate(doc.workCompletedAt),
    otpRequired: otpRequiredForBooking(booking),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function formatReview(review: IReview) {
  const doc = review.toObject();
  return {
    id: review._id.toString(),
    bookingId: doc.bookingId.toString(),
    technicianId: doc.technicianId.toString(),
    customerId: doc.customerId.toString(),
    stars: doc.stars,
    tags: doc.tags,
    comment: doc.comment,
    photos: doc.photos,
    hidden: doc.hidden === true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
