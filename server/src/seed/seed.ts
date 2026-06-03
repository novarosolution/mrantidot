import '../config/env';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db';
import { User, IUser } from '../models/User';
import { Service, IService } from '../models/Service';
import { Booking, BookingStatus, IBookingStep } from '../models/Booking';
import { Review } from '../models/Review';
import { Offer } from '../models/Offer';
import { SavedAddress } from '../models/SavedAddress';
import { PaymentMethod } from '../models/PaymentMethod';
import { Notification } from '../models/Notification';
import { TechnicianAttendance } from '../models/TechnicianAttendance';
import { computeAmount } from '../utils/booking';
import {
  appendTracking,
  buildOtpEntry,
} from '../utils/workOtp';
import { getAdminConfig } from '../utils/adminUser';
import type { ServiceCategory } from '../models/Service';
import type { ServiceTypeKey } from '../constants/serviceTypes';

const SEED_MARKER = 'mrantidot-stage-d';

type StepStatus = 'pending' | 'active' | 'done';

interface SeedUser {
  phone: string;
  password: string;
  role: IUser['role'];
  name: string;
  email: string;
  city: string;
  rating?: number;
  jobsDone?: number;
}

interface SeedService {
  name: string;
  iconKey: string;
  basePrice: number;
  shortDesc: string;
  stepTemplate: string[];
  category: ServiceCategory;
  serviceTypes?: ServiceTypeKey[];
}

function buildSeedUsers(): SeedUser[] {
  const admin = getAdminConfig();
  return [
    {
      phone: admin.phone,
      password: admin.password,
      role: 'admin',
      name: admin.name,
      email: admin.email,
      city: admin.city,
    },
    {
    phone: '9000000010',
    password: 'tech123',
    role: 'technician',
    name: 'Amit Sharma',
    email: 'amit.tech@mrantidot.com',
    city: 'Mumbai',
    rating: 4.8,
    jobsDone: 124,
  },
  {
    phone: '9000000011',
    password: 'tech123',
    role: 'technician',
    name: 'Priya Verma',
    email: 'priya.tech@mrantidot.com',
    city: 'Pune',
    rating: 4.6,
    jobsDone: 98,
  },
  {
    phone: '9000000012',
    password: 'tech123',
    role: 'technician',
    name: 'Karan Patel',
    email: 'karan.tech@mrantidot.com',
    city: 'Delhi',
    rating: 4.9,
    jobsDone: 156,
  },
  {
    phone: '9000000013',
    password: 'tech123',
    role: 'technician',
    name: 'Sneha Reddy',
    email: 'sneha.tech@mrantidot.com',
    city: 'Hyderabad',
    rating: 4.7,
    jobsDone: 87,
  },
  {
    phone: '9000000020',
    password: 'cust123',
    role: 'customer',
    name: 'Rohit Mehta',
    email: 'rohit@demo.com',
    city: 'Mumbai',
  },
  {
    phone: '9000000021',
    password: 'cust123',
    role: 'customer',
    name: 'Anita Desai',
    email: 'anita@demo.com',
    city: 'Pune',
  },
  {
    phone: '9000000022',
    password: 'cust123',
    role: 'customer',
    name: 'Vikram Singh',
    email: 'vikram@demo.com',
    city: 'Delhi',
  },
  ];
}

const USERS = buildSeedUsers();

const SERVICES: SeedService[] = [
  {
    name: 'AC Service & Repair',
    iconKey: 'snowflake',
    basePrice: 599,
    shortDesc: 'Split/window AC service, gas check, and minor repairs',
    category: 'residential',
    stepTemplate: [
      'Arrival & safety check',
      'Before unit condition',
      'Service in progress',
      'After service verification',
      'Customer sign-off',
    ],
  },
  {
    name: 'Pest Control',
    iconKey: 'bug',
    basePrice: 899,
    shortDesc: 'Cockroach, ant, and general pest treatment for home',
    category: 'residential',
    serviceTypes: ['ant', 'cockroach', 'general'],
    stepTemplate: [
      'Site inspection',
      'Treatment application',
      'Post-treatment photos',
      'Safety briefing',
    ],
  },
  {
    name: 'Ant Control Treatment',
    iconKey: 'spray',
    basePrice: 649,
    shortDesc: 'Targeted ant colony treatment for kitchen, bathroom, and entry points',
    category: 'residential',
    serviceTypes: ['ant'],
    stepTemplate: [
      'Nest & trail inspection',
      'Gel / spray application',
      'Barrier treatment',
      'Follow-up checklist',
    ],
  },
  {
    name: 'Plumbing',
    iconKey: 'droplets',
    basePrice: 449,
    shortDesc: 'Leaks, taps, blockages, and fixture fixes',
    category: 'commercial',
    stepTemplate: [
      'Arrival check-in',
      'Before work',
      'Work in progress',
      'After completion',
      'Sign-off',
    ],
  },
  {
    name: 'Electrical',
    iconKey: 'zap',
    basePrice: 499,
    shortDesc: 'Wiring checks, switches, MCB, and light installs',
    category: 'commercial',
    stepTemplate: [
      'Arrival & isolation',
      'Before panel/fixture',
      'Work underway',
      'Final safety test',
      'Customer sign-off',
    ],
  },
  {
    name: 'Deep Home Cleaning',
    iconKey: 'sparkles',
    basePrice: 1299,
    shortDesc: 'Full home deep clean — kitchen, baths, living areas',
    category: 'cleaning',
    stepTemplate: [
      'Arrival walkthrough',
      'Before photos',
      'Cleaning in progress',
      'Final inspection',
    ],
  },
  {
    name: 'Appliance Repair',
    iconKey: 'wrench',
    basePrice: 399,
    shortDesc: 'Washing machine, fridge, microwave diagnostics & repair',
    category: 'general',
    stepTemplate: [
      'Arrival',
      'Diagnosis',
      'Repair/replace part',
      'Test run',
      'Sign-off',
    ],
  },
];

function doneStep(title: string, index: number, address: string): IBookingStep {
  const capturedAt = new Date();
  capturedAt.setHours(capturedAt.getHours() - (5 - index));
  return {
    title,
    description: title,
    status: 'done',
    photoUrl: `/uploads/seed-${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`,
    capturedAt,
    geo: {
      lat: 19.076 + index * 0.002,
      lng: 72.8777 + index * 0.002,
      address,
    },
  };
}

function buildStepsForStatus(
  template: string[],
  status: BookingStatus,
  address: string,
): IBookingStep[] {
  if (status === 'pending' || status === 'confirmed') {
    return template.map((title, i) => ({
      title,
      description: title,
      status: (i === 0 ? 'active' : 'pending') as StepStatus,
    }));
  }

  if (status === 'cancelled') {
    return template.map((title) => ({
      title,
      description: title,
      status: 'pending' as StepStatus,
    }));
  }

  if (status === 'in_progress') {
    const doneCount = Math.min(2, template.length - 1);
    return template.map((title, i) => {
      if (i < doneCount) return doneStep(title, i, address);
      if (i === doneCount) {
        return { title, description: title, status: 'active' as StepStatus };
      }
      return { title, description: title, status: 'pending' as StepStatus };
    });
  }

  // awaiting_verification, completed — all steps done with photo + geo
  return template.map((title, i) => doneStep(title, i, address));
}

async function upsertUser(entry: SeedUser): Promise<IUser> {
  const passwordHash = await bcrypt.hash(entry.password, 12);
  const user = await User.findOneAndUpdate(
    { phone: entry.phone },
    {
      role: entry.role,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      passwordHash,
      city: entry.city,
      rating: entry.rating ?? 0,
      jobsDone: entry.jobsDone ?? 0,
      available: true,
    },
    { upsert: true, new: true },
  );
  return user;
}

async function upsertService(entry: SeedService): Promise<IService> {
  const service = await Service.findOneAndUpdate(
    { name: entry.name },
    {
      name: entry.name,
      iconKey: entry.iconKey,
      basePrice: entry.basePrice,
      shortDesc: entry.shortDesc,
      stepTemplate: entry.stepTemplate,
      category: entry.category,
      serviceTypes: entry.serviceTypes ?? [],
      active: true,
      rating: 4.8,
    },
    { upsert: true, new: true },
  );
  return service;
}

async function seed(): Promise<void> {
  await connectDb();

  for (const indexName of ['slug_1', 'email_1']) {
    try {
      await Service.collection.dropIndex(indexName);
    } catch {
      /* legacy service index */
    }
    try {
      await User.collection.dropIndex(indexName);
    } catch {
      /* legacy user index */
    }
  }

  const seedPhones = USERS.map((u) => u.phone);
  await User.deleteMany({ phone: { $nin: seedPhones } });

  const users = await Promise.all(USERS.map(upsertUser));

  const seedServiceNames = SERVICES.map((s) => s.name);
  await Service.deleteMany({ name: { $nin: seedServiceNames } });
  const services = await Promise.all(SERVICES.map(upsertService));

  const byPhone = (phone: string) => users.find((u) => u.phone === phone)!;
  const techs = ['9000000010', '9000000011', '9000000012', '9000000013'].map(byPhone);
  const customers = ['9000000020', '9000000021', '9000000022'].map(byPhone);
  const serviceByName = (name: string) => services.find((s) => s.name === name)!;

  // Idempotent booking/review reset — same end state on every run
  await Review.deleteMany({});
  await Booking.deleteMany({});

  const addresses = [
    '12 Marine Drive, Mumbai',
    '45 FC Road, Pune',
    '88 Connaught Place, Delhi',
  ];

  type BookingSeed = {
    status: BookingStatus;
    serviceName: string;
    customerIdx: number;
    techIdx: number;
    dayOffset: number;
    couponCode?: string;
    paymentMethod?: 'upi_card' | 'pay_after';
    scheduleMode?: 'standard' | 'custom';
    customTime?: string;
  };

  function scheduleDateFromOffset(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  const bookingPlan: BookingSeed[] = [
    {
      status: 'pending',
      serviceName: 'Plumbing',
      customerIdx: 0,
      techIdx: 0,
      dayOffset: 5,
      scheduleMode: 'standard',
    },
    {
      status: 'pending',
      serviceName: 'Electrical',
      customerIdx: 1,
      techIdx: 1,
      dayOffset: 3,
      scheduleMode: 'custom',
      customTime: '15:30',
    },
    { status: 'confirmed', serviceName: 'Electrical', customerIdx: 1, techIdx: 1, dayOffset: -7 },
    { status: 'in_progress', serviceName: 'AC Service & Repair', customerIdx: 2, techIdx: 2, dayOffset: 0 },
    {
      status: 'awaiting_verification',
      serviceName: 'Pest Control',
      customerIdx: 0,
      techIdx: 3,
      dayOffset: -1,
      couponCode: 'FIRST50',
    },
    {
      status: 'completed',
      serviceName: 'Deep Home Cleaning',
      customerIdx: 1,
      techIdx: 0,
      dayOffset: -3,
      couponCode: 'ANTIDOT100',
    },
    {
      status: 'completed',
      serviceName: 'Appliance Repair',
      customerIdx: 2,
      techIdx: 1,
      dayOffset: -5,
    },
    {
      status: 'completed',
      serviceName: 'Plumbing',
      customerIdx: 0,
      techIdx: 2,
      dayOffset: -10,
      paymentMethod: 'pay_after',
    },
    { status: 'cancelled', serviceName: 'Electrical', customerIdx: 2, techIdx: 3, dayOffset: 2 },
  ];

  const createdBookings = [];

  for (let i = 0; i < bookingPlan.length; i++) {
    const plan = bookingPlan[i]!;
    const service = serviceByName(plan.serviceName);
    const customer = customers[plan.customerIdx]!;
    const technician = techs[plan.techIdx]!;
    const address = addresses[plan.customerIdx]!;
    const scheduleDate = scheduleDateFromOffset(plan.dayOffset);
    const scheduleMode = plan.scheduleMode ?? 'standard';
    const schedule =
      scheduleMode === 'custom'
        ? { date: scheduleDate, slot: 'custom', time: plan.customTime ?? '14:00' }
        : {
            date: scheduleDate,
            slot: i % 2 === 0 ? '09:00-11:00' : '14:00-16:00',
          };
    const scheduleRequest =
      scheduleMode === 'custom'
        ? { date: scheduleDate, time: plan.customTime ?? '14:00' }
        : { date: scheduleDate, slot: schedule.slot };
    const amount = await computeAmount(service.basePrice, plan.couponCode);
    const steps = buildStepsForStatus(service.stepTemplate, plan.status, address);

    const booking = await Booking.create({
      customerId: customer._id,
      serviceId: service._id,
      technicianId: plan.status === 'pending' ? undefined : technician._id,
      assignmentMode: 'customer_pick',
      scheduleMode,
      scheduleRequest,
      schedule,
      scheduleConfirmedAt: plan.status !== 'pending' ? new Date() : undefined,
      address,
      amount,
      paymentMethod: plan.paymentMethod ?? 'upi_card',
      status: plan.status,
      steps,
      problemPhotos: [`/uploads/seed-problem-${i + 1}.jpg`],
      couponCode: plan.couponCode,
    });

    if (plan.status !== 'cancelled' && plan.status !== 'pending') {
      appendTracking(booking, 'assigned');
      appendTracking(booking, 'start_otp_sent');
      booking.workOtp = {
        start: buildOtpEntry('100001', ['in_progress', 'awaiting_verification', 'completed'].includes(plan.status)),
      };
      if (['in_progress', 'awaiting_verification', 'completed'].includes(plan.status)) {
        const slotStart = new Date(`${schedule.date}T10:30:00`);
        booking.workStartedAt = slotStart;
        appendTracking(booking, 'work_started');
      }
      if (['awaiting_verification', 'completed'].includes(plan.status)) {
        appendTracking(booking, 'end_otp_sent');
        booking.workOtp.end = buildOtpEntry('200002', plan.status === 'completed');
      }
      if (plan.status === 'completed') {
        const slotEnd = new Date(`${schedule.date}T12:45:00`);
        booking.workCompletedAt = slotEnd;
        appendTracking(booking, 'work_completed');
      }
      booking.markModified('workOtp');
      booking.markModified('tracking');
      await booking.save();
    }

    createdBookings.push(booking);
  }

  const completed = createdBookings.filter((b) => b.status === 'completed');

  const reviewData = [
    {
      booking: completed[0]!,
      stars: 5,
      tags: ['on-time', 'professional'],
      comment: 'Spotless deep clean. Highly recommend!',
    },
    {
      booking: completed[1]!,
      stars: 4,
      tags: ['skilled', 'friendly'],
      comment: 'Fixed our washing machine quickly.',
    },
    {
      booking: completed[2]!,
      stars: 5,
      tags: ['neat work'],
      comment: 'Plumbing issue resolved same visit.',
    },
  ];

  for (const r of reviewData) {
    await Review.create({
      bookingId: r.booking._id,
      technicianId: r.booking.technicianId!,
      customerId: r.booking.customerId,
      stars: r.stars,
      tags: r.tags,
      comment: r.comment,
      photos: [`/uploads/seed-review-${r.stars}.jpg`],
    });
  }

  await Offer.deleteMany({});
  await Offer.insertMany([
    { code: 'ANTIDOT100', discount: 100, description: 'Any service booking', active: true },
    { code: 'FIRST50', discount: 50, description: 'First booking discount', active: true },
  ]);

  await SavedAddress.deleteMany({});
  await PaymentMethod.deleteMany({});
  await Notification.deleteMany({});

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]!;
    await SavedAddress.create({
      customerId: customer._id,
      label: 'Home',
      line1: addresses[i]!.split(',')[0] ?? addresses[i]!,
      city: customer.city ?? 'Mumbai',
      isDefault: true,
    });
    await SavedAddress.create({
      customerId: customer._id,
      label: 'Office',
      line1: `Office Block ${i + 1}`,
      city: customer.city ?? 'Mumbai',
      isDefault: false,
    });
    await PaymentMethod.create({
      customerId: customer._id,
      type: 'upi_card',
      label: 'UPI',
      details: 'demo@upi',
      isDefault: true,
    });
    await PaymentMethod.create({
      customerId: customer._id,
      type: 'pay_after',
      label: 'Pay after service',
      isDefault: false,
    });
  }

  for (const booking of createdBookings) {
    await Notification.create({
      userId: booking.customerId,
      title: 'Booking update',
      body: `Your ${booking.status.replace(/_/g, ' ')} booking is in the system.`,
      type: booking.status,
      read: false,
      bookingId: booking._id,
    });
    if (booking.technicianId) {
      await Notification.create({
        userId: booking.technicianId,
        title: 'Job update',
        body: `Assigned job status: ${booking.status}`,
        type: booking.status,
        read: false,
        bookingId: booking._id,
      });
    }
  }

  // Sample attendance for last 14 days (mix of present / absent)
  await TechnicianAttendance.deleteMany({ technicianId: { $in: techs.map((t) => t._id) } });
  const today = new Date();
  for (const tech of techs.slice(0, 3)) {
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const present = i % 4 !== 0;
      await TechnicianAttendance.create({
        technicianId: tech._id,
        date,
        status: present ? 'present' : 'absent',
        checkedInAt: new Date(`${date}T09:00:00`),
        source: 'technician',
      });
    }
  }

  // Recompute technician ratings from reviews (idempotent after re-seed)
  for (const tech of techs) {
    const agg = await Review.aggregate([
      { $match: { technicianId: tech._id } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await User.findByIdAndUpdate(tech._id, {
        rating: Math.round((agg[0].avg as number) * 10) / 10,
        jobsDone: agg[0].count as number,
      });
    }
  }

  const [userCount, serviceCount, bookingCount, reviewCount] = await Promise.all([
    User.countDocuments(),
    Service.countDocuments({ active: true }),
    Booking.countDocuments(),
    Review.countDocuments(),
  ]);

  const statusCounts = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  console.log('\n========================================');
  console.log('  Mr Antidot — Stage D seed complete');
  console.log('========================================\n');
  console.log('Counts:');
  console.log(`  Users:      ${userCount} (1 admin, 4 technicians, 3 customers)`);
  console.log(`  Services:   ${serviceCount}`);
  console.log(`  Bookings:   ${bookingCount}`);
  console.log('  By status:');
  for (const row of statusCounts) {
    console.log(`    ${row._id}: ${row.count}`);
  }
  console.log(`  Reviews:    ${reviewCount}`);
  console.log(`\nMarker: ${SEED_MARKER} (bookings/reviews refreshed each run)\n`);
  const adminCfg = getAdminConfig();
  console.log('Login cheatsheet (identifier = phone OR email):');
  console.log('  Role        Phone        Password');
  console.log('  ----------  -----------  ----------');
  console.log(`  Admin       ${adminCfg.phone.padEnd(11)} ${adminCfg.password}  (${adminCfg.email})`);
  console.log('  Technician  9000000010   tech123');
  console.log('  Technician  9000000011   tech123');
  console.log('  Technician  9000000012   tech123');
  console.log('  Technician  9000000013   tech123');
  console.log('  Customer    9000000020   cust123');
  console.log('  Customer    9000000021   cust123');
  console.log('  Customer    9000000022   cust123');
  console.log('\nEmails: admin@mrantidot.com, *@mrantidot.com / *@demo.com');
  console.log('========================================\n');

  await disconnectDb();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
