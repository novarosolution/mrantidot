import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { IBooking } from '../models/Booking';
import { User } from '../models/User';

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

async function notifyAdmins(
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

export async function notifyWorkOtpEvent(
  booking: IBooking,
  event: 'start_otp_ready' | 'end_otp_ready' | 'work_started' | 'work_completed',
): Promise<void> {
  const customerId = refId(booking.customerId);
  const techId = refId(booking.technicianId);
  const bid = booking._id;

  const messages: Record<
    string,
    {
      customer?: { title: string; body: string };
      tech?: { title: string; body: string };
      admin?: { title: string; body: string };
    }
  > = {
    start_otp_ready: {
      customer: {
        title: 'Start code ready',
        body: 'Share your start code with the technician when they arrive.',
      },
      tech: {
        title: 'Ask for start code',
        body: 'Ask the customer for their start code to begin the job.',
      },
      admin: { title: 'Start OTP issued', body: 'Customer received a start code for this booking.' },
    },
    end_otp_ready: {
      customer: {
        title: 'Completion code ready',
        body: 'Share your end code with the technician to finish the job.',
      },
      tech: {
        title: 'Ask for end code',
        body: 'Ask the customer for their completion code to finish the job.',
      },
      admin: { title: 'End OTP issued', body: 'Customer received a completion code for this booking.' },
    },
    work_started: {
      customer: { title: 'Work started', body: 'Your technician has started the treatment.' },
      tech: { title: 'Job started', body: 'You have started this job on site.' },
      admin: { title: 'Work started', body: 'Technician verified the start code and began work.' },
    },
    work_completed: {
      customer: { title: 'Service completed', body: 'Thank you! You can leave a review for your technician.' },
      tech: { title: 'Job completed', body: 'Completion code verified. Great work!' },
      admin: { title: 'Job completed', body: 'End code verified and booking marked complete.' },
    },
  };

  const msg = messages[event];
  if (customerId && msg?.customer) {
    await notifyUser(customerId, msg.customer.title, msg.customer.body, event, bid);
  }
  if (techId && msg?.tech) {
    await notifyUser(techId, msg.tech.title, msg.tech.body, event, bid);
  }
  if (msg?.admin) {
    await notifyAdmins(msg.admin.title, msg.admin.body, `admin_${event}`, bid);
  }
}

export async function notifyBookingEvent(
  booking: IBooking,
  event:
    | 'confirmed'
    | 'assigned'
    | 'in_progress'
    | 'awaiting_verification'
    | 'completed'
    | 'cancelled'
    | 'schedule_requested'
    | 'schedule_confirmed',
  options?: { notifyAdmin?: boolean },
): Promise<void> {
  const customerId = refId(booking.customerId);
  const techId = refId(booking.technicianId);
  const bid = booking._id;

  const messages: Record<
    string,
    {
      customer?: { title: string; body: string };
      tech?: { title: string; body: string };
      admin?: { title: string; body: string };
    }
  > = {
    confirmed: {
      customer: { title: 'Booking confirmed', body: 'Your service has been confirmed. We will assign a service expert shortly.' },
      admin: { title: 'New booking', body: 'A customer placed a new booking. Review and assign if needed.' },
    },
    assigned: {
      customer: { title: 'Visit scheduled', body: 'A service expert has been assigned. Your start code is ready when they arrive.' },
      tech: { title: 'New job assigned', body: 'You have been assigned a new service job.' },
    },
    in_progress: {
      customer: { title: 'Service in progress', body: 'Treatment has started at your location.' },
    },
    awaiting_verification: {
      customer: { title: 'Verify your service', body: 'Please review photos and verify job completion.' },
      admin: { title: 'Job awaiting verification', body: 'A booking is ready for admin review and verification.' },
    },
    completed: {
      customer: { title: 'Service completed', body: 'Thank you! You can leave a review for your visit.' },
      tech: { title: 'Job completed', body: 'Customer verified the job. Great work!' },
    },
    cancelled: {
      customer: { title: 'Booking cancelled', body: 'Your booking has been cancelled.' },
      tech: { title: 'Job cancelled', body: 'A assigned job was cancelled.' },
      admin: { title: 'Booking cancelled', body: 'A booking was cancelled and may need follow-up.' },
    },
    schedule_requested: {
      customer: {
        title: 'Booking request received',
        body: 'We received your booking. Our team will confirm your visit time shortly.',
      },
      admin: {
        title: 'Schedule to confirm',
        body: 'A customer requested a visit. Review and confirm the schedule.',
      },
    },
    schedule_confirmed: {
      customer: {
        title: 'Visit scheduled',
        body: 'Your visit time has been confirmed. We will assign a service expert shortly.',
      },
    },
  };

  const msg = messages[event];
  if (customerId && msg?.customer) {
    await notifyUser(customerId, msg.customer.title, msg.customer.body, event, bid);
  }
  if (techId && msg?.tech) {
    await notifyUser(techId, msg.tech.title, msg.tech.body, event, bid);
  }
  const notifyAdmin = options?.notifyAdmin !== false;
  if (notifyAdmin && msg?.admin) {
    await notifyAdmins(msg.admin.title, msg.admin.body, `admin_${event}`, bid);
  }
}
