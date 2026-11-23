import { Types } from 'mongoose';
import { Notification, type INotificationLink } from '../models/Notification';
import { IBooking } from '../models/Booking';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { fillTemplate, messageFor } from './businessSettings';
import { scheduleWords } from './schedule';

/**
 * In-app notifications. Booking texts come from Business settings → Messages (`messageFor`), keyed
 * "<event>.<audience>", with {service} {ref} {date} {time} filled in; the built-in texts are the fallback.
 * An event only reaches the audiences that have a text for it.
 */

export type NotifyAudience = 'customer' | 'tech' | 'admin';

export type BookingNotifyEvent =
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_verification'
  | 'completed'
  | 'cancelled'
  | 'schedule_requested'
  | 'schedule_confirmed'
  | 'reschedule_requested'
  | 'rescheduled';

export type WorkOtpNotifyEvent = 'start_otp_ready' | 'end_otp_ready' | 'work_started' | 'work_completed';

function refId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export async function notifyUser(
  userId: string | Types.ObjectId,
  title: string,
  body: string,
  type: string,
  bookingId?: string | Types.ObjectId,
): Promise<void> {
  await Notification.create({
    userId,
    title,
    body,
    type,
    read: false,
    bookingId: bookingId ?? undefined,
  });
}

/**
 * The same in-app notification for many people (admin broadcasts), written in batches of 1,000.
 * Returns how many were created.
 */
export async function notifyUsersBulk(
  userIds: (string | Types.ObjectId)[],
  message: { title: string; body: string; type: string; link?: INotificationLink; broadcastId?: Types.ObjectId },
): Promise<number> {
  const BATCH = 1000;
  let created = 0;
  for (let i = 0; i < userIds.length; i += BATCH) {
    const docs = userIds.slice(i, i + BATCH).map((userId) => ({
      userId,
      title: message.title,
      body: message.body,
      type: message.type,
      read: false,
      ...(message.link ? { link: message.link } : {}),
      ...(message.broadcastId ? { broadcastId: message.broadcastId } : {}),
    }));
    const inserted = await Notification.insertMany(docs, { ordered: false });
    created += inserted.length;
  }
  return created;
}

export async function notifyAdmins(
  title: string,
  body: string,
  type: string,
  bookingId?: string | Types.ObjectId,
): Promise<void> {
  const admins = await User.find({ role: 'admin', disabled: { $ne: true } }).select('_id');
  await Promise.all(admins.map((a) => notifyUser(a._id, title, body, type, bookingId)));
}

export async function notifyAdminsForBooking(
  bookingId: string | Types.ObjectId,
  title: string,
  body: string,
  type: string,
): Promise<void> {
  await notifyAdmins(title, body, type, bookingId);
}

/** Placeholder values for a booking: {service} {ref} {date} {time}. */
export async function bookingTemplateVars(booking: IBooking): Promise<Record<string, string>> {
  const svc = booking.serviceId as unknown;
  let service = '';
  if (svc && typeof svc === 'object' && 'name' in svc) {
    service = String((svc as { name?: unknown }).name ?? '');
  } else if (svc) {
    const doc = await Service.findById(svc).select('name').lean<{ name?: string }>();
    service = doc?.name ?? '';
  }
  const id = String(booking._id ?? '');
  const { date, time } = scheduleWords(booking.schedule ?? booking.scheduleRequest);
  return { service, ref: id ? `#${id.slice(-6).toUpperCase()}` : '', date, time };
}

/** Title + body for an event and audience with placeholders filled; undefined when there is no text. */
export async function bookingMessage(
  booking: IBooking,
  event: string,
  audience: NotifyAudience,
  vars?: Record<string, string>,
): Promise<{ title: string; body: string } | undefined> {
  const tpl = await messageFor(event, audience);
  if (!tpl) return undefined;
  const v = vars ?? (await bookingTemplateVars(booking));
  return { title: fillTemplate(tpl.title, v) || tpl.title, body: fillTemplate(tpl.body, v) };
}

/** One templated message to one person (e.g. the technician who just lost a rescheduled job). */
export async function notifyUserFromTemplate(
  userId: string | Types.ObjectId,
  booking: IBooking,
  event: string,
  audience: NotifyAudience,
  type = event,
): Promise<void> {
  const msg = await bookingMessage(booking, event, audience);
  if (msg) await notifyUser(userId, msg.title, msg.body, type, booking._id as Types.ObjectId);
}

async function sendEvent(
  booking: IBooking,
  event: string,
  options: { notifyAdmin?: boolean; audiences?: NotifyAudience[] } = {},
): Promise<void> {
  const customerId = refId(booking.customerId);
  const techId = refId(booking.technicianId);
  const bid = booking._id as Types.ObjectId;
  const wants = (a: NotifyAudience) => !options.audiences || options.audiences.includes(a);
  const vars = await bookingTemplateVars(booking);

  if (customerId && wants('customer')) {
    const msg = await bookingMessage(booking, event, 'customer', vars);
    if (msg) await notifyUser(customerId, msg.title, msg.body, event, bid);
  }
  if (techId && wants('tech')) {
    const msg = await bookingMessage(booking, event, 'tech', vars);
    if (msg) await notifyUser(techId, msg.title, msg.body, event, bid);
  }
  if (options.notifyAdmin !== false && wants('admin')) {
    const msg = await bookingMessage(booking, event, 'admin', vars);
    if (msg) await notifyAdmins(msg.title, msg.body, `admin_${event}`, bid);
  }
}

export async function notifyWorkOtpEvent(booking: IBooking, event: WorkOtpNotifyEvent): Promise<void> {
  await sendEvent(booking, event);
}

/**
 * Booking status messages. `notifyAdmin: false` skips the admins; `audiences` limits who hears about it
 * (default: everyone the event has a text for — customer / assigned technician / admins).
 */
export async function notifyBookingEvent(
  booking: IBooking,
  event: BookingNotifyEvent,
  options?: { notifyAdmin?: boolean; audiences?: NotifyAudience[] },
): Promise<void> {
  await sendEvent(booking, event, options);
}
