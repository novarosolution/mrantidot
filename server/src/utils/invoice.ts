import { AppContent, DEFAULT_APP_CONFIG } from '../models/AppContent';
import type { IBooking } from '../models/Booking';
import type { IService } from '../models/Service';
import type { IUser } from '../models/User';
import { getBusinessSettings, listLabel } from './businessSettings';
import { formatScheduleSummary } from './schedule';

function asUser(value: unknown): IUser | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (!('name' in value)) return undefined;
  return value as IUser;
}

function asService(value: unknown): IService | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (!('name' in value)) return undefined;
  return value as IService;
}

function oid(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function iso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export type BookingInvoice = {
  invoiceNumber: string;
  issuedAt: string;
  brand: { name: string; tagline: string };
  support: { phone: string; email: string; hours?: string };
  /** Business details printed on the invoice (Business settings → Tax & invoice); empty fields are left out. */
  seller: { legalName?: string; gstin?: string; address?: string };
  /** GST rate the booking was charged at, and its line label ("GST (18%)"). */
  tax: { gstPercent: number; label: string };
  /** Closing line (admin footer, or the built-in thank-you). */
  footer: string;
  booking: {
    id: string;
    status: string;
    createdAt?: string;
    completedAt?: string;
    scheduleLabel: string;
    scheduleDate: string;
    scheduleSlot: string;
    scheduleTime?: string;
    address: string;
    propertyType?: string;
    propertyTypeLabel?: string;
    paymentMethod: string;
    paymentMethodLabel: string;
    couponCode?: string;
  };
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
  };
  technician?: {
    id: string;
    name: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    category?: string;
    categoryLabel?: string;
    shortDesc?: string;
    iconKey?: string;
    serviceTypes: string[];
    serviceTypeLabels: string[];
    basePrice?: number;
  };
  steps: Array<{
    title: string;
    status: string;
    photoCount: number;
    capturedAt?: string;
  }>;
  amount: {
    base: number;
    gst: number;
    coupon: number;
    total: number;
  };
  text: string;
};

const DEFAULT_FOOTER = 'Thank you for choosing trusted pest control & home care.';

function buildInvoiceText(invoice: Omit<BookingInvoice, 'text'>): string {
  const lines: string[] = [
    invoice.brand.name.toUpperCase(),
    invoice.brand.tagline,
  ];
  if (invoice.seller.legalName) lines.push(invoice.seller.legalName);
  if (invoice.seller.address) lines.push(invoice.seller.address);
  if (invoice.seller.gstin) lines.push(`GSTIN ${invoice.seller.gstin}`);
  lines.push(
    '',
    'TAX INVOICE / SERVICE RECEIPT',
    `Invoice  ${invoice.invoiceNumber}`,
    `Issued   ${new Date(invoice.issuedAt).toLocaleString('en-IN')}`,
    `Status   ${invoice.booking.status.replace(/_/g, ' ')}`,
    '',
    '— Bill to —',
    invoice.customer.name,
  );

  if (invoice.customer.phone) lines.push(`Phone  ${invoice.customer.phone}`);
  if (invoice.customer.email) lines.push(`Email  ${invoice.customer.email}`);
  if (invoice.customer.city) lines.push(`City   ${invoice.customer.city}`);

  lines.push('', '— Service details —', invoice.service.name);
  if (invoice.service.category) lines.push(`Category   ${invoice.service.categoryLabel || invoice.service.category}`);
  if (invoice.service.shortDesc) lines.push(invoice.service.shortDesc);
  if (invoice.service.serviceTypeLabels.length) {
    lines.push(`Coverage   ${invoice.service.serviceTypeLabels.join(', ')}`);
  }
  if (invoice.booking.propertyTypeLabel) {
    lines.push(`Property   ${invoice.booking.propertyTypeLabel}`);
  }
  lines.push(`Visit      ${invoice.booking.scheduleLabel}`);
  lines.push(`Address    ${invoice.booking.address}`);
  if (invoice.technician) {
    lines.push(`Technician ${invoice.technician.name}`);
  }
  if (invoice.booking.couponCode) {
    lines.push(`Coupon     ${invoice.booking.couponCode}`);
  }
  lines.push(`Payment    ${invoice.booking.paymentMethodLabel}`);

  if (invoice.steps.length) {
    lines.push('', '— Treatment steps —');
    invoice.steps.forEach((step, i) => {
      const mark = step.status === 'done' ? '✓' : '·';
      const photos = step.photoCount > 0 ? ` (${step.photoCount} photo${step.photoCount === 1 ? '' : 's'})` : '';
      lines.push(`  ${mark} ${i + 1}. ${step.title}${photos}`);
    });
  }

  lines.push(
    '',
    '— Charges —',
    `Service         ${rupee(invoice.amount.base)}`,
  );
  if (invoice.amount.coupon > 0) {
    lines.push(`Coupon discount -${rupee(invoice.amount.coupon)}`);
  }
  lines.push(
    `${invoice.tax.label.padEnd(15)} ${rupee(invoice.amount.gst)}`,
    `TOTAL           ${rupee(invoice.amount.total)}`,
    '',
  );

  if (invoice.support.phone || invoice.support.email) {
    lines.push('— Support —');
    if (invoice.support.phone) lines.push(`Phone  ${invoice.support.phone}`);
    if (invoice.support.email) lines.push(`Email  ${invoice.support.email}`);
    if (invoice.support.hours) lines.push(`Hours  ${invoice.support.hours}`);
    lines.push('');
  }

  lines.push(invoice.footer, `Booking ID ${invoice.booking.id}`);
  return lines.join('\n');
}

/** Build a premium client invoice from a populated booking. */
export async function buildBookingInvoice(booking: IBooking): Promise<BookingInvoice> {
  const [appDoc, settings] = await Promise.all([AppContent.findOne({ key: 'app' }), getBusinessSettings()]);
  const branding = appDoc?.appConfig?.branding ?? DEFAULT_APP_CONFIG.branding;
  const support = appDoc?.appConfig?.support ?? DEFAULT_APP_CONFIG.support;

  const customer = asUser(booking.customerId);
  const technician = asUser(booking.technicianId);
  const service = asService(booking.serviceId);
  const bookingId = oid(booking._id);
  const invoiceNumber = `${settings.invoice.prefix}${bookingId.slice(-8).toUpperCase()}`;
  const propertyType = booking.propertyType;
  const propertyTypeLabel = propertyType ? listLabel(settings.lists.propertyTypes, propertyType) : undefined;
  // The rate is stored with the amount; bookings made before it was stored were all charged 18%.
  const storedPct = (booking.amount as { gstPercent?: unknown } | undefined)?.gstPercent;
  const gstPercent = typeof storedPct === 'number' && Number.isFinite(storedPct) ? storedPct : 18;
  const serviceTypes: string[] = Array.isArray(service?.serviceTypes) ? [...service.serviceTypes] : [];

  const steps = (booking.steps ?? []).map((s) => {
    const photoUrls = Array.isArray(s.photoUrls)
      ? s.photoUrls.filter((u): u is string => typeof u === 'string')
      : [];
    const photoCount = photoUrls.length || (s.photoUrl ? 1 : 0);
    return {
      title: s.title,
      status: s.status,
      photoCount,
      capturedAt: iso(s.capturedAt),
    };
  });

  const amount = {
    base: booking.amount?.base ?? 0,
    gst: booking.amount?.gst ?? 0,
    coupon: booking.amount?.coupon ?? 0,
    total: booking.amount?.total ?? 0,
  };

  const core: Omit<BookingInvoice, 'text'> = {
    invoiceNumber,
    issuedAt: new Date().toISOString(),
    brand: {
      name: branding.name || 'Mr Antidot',
      tagline: branding.tagline || 'Trusted pest control & home services',
    },
    support: {
      phone: support.phone,
      email: support.email,
      hours: support.hours,
    },
    seller: {
      ...(settings.invoice.legalName ? { legalName: settings.invoice.legalName } : {}),
      ...(settings.invoice.gstin ? { gstin: settings.invoice.gstin } : {}),
      ...(settings.invoice.address ? { address: settings.invoice.address } : {}),
    },
    tax: { gstPercent, label: `GST (${gstPercent}%)` },
    footer: settings.invoice.footer || DEFAULT_FOOTER,
    booking: {
      id: bookingId,
      status: booking.status,
      createdAt: iso(booking.createdAt),
      completedAt: iso(booking.workCompletedAt),
      scheduleLabel: formatScheduleSummary(booking.schedule),
      scheduleDate: booking.schedule?.date ?? '',
      scheduleSlot: booking.schedule?.slot ?? '',
      scheduleTime: booking.schedule?.time,
      address: booking.address,
      propertyType,
      propertyTypeLabel,
      paymentMethod: booking.paymentMethod,
      paymentMethodLabel: listLabel(settings.payments.methods, booking.paymentMethod),
      couponCode: booking.couponCode,
    },
    customer: {
      id: customer ? oid(customer._id) : oid(booking.customerId),
      name: customer?.name ?? 'Customer',
      phone: customer?.phone,
      email: customer?.email,
      city: customer?.city,
    },
    technician: technician
      ? {
          id: oid(technician._id),
          name: technician.name,
          phone: technician.phone,
        }
      : undefined,
    service: {
      id: service ? oid(service._id) : oid(booking.serviceId),
      name: service?.name ?? 'Service',
      category: service?.category,
      categoryLabel: service?.category ? listLabel(settings.lists.categories, service.category) : undefined,
      shortDesc: service?.shortDesc,
      iconKey: service?.iconKey,
      serviceTypes,
      serviceTypeLabels: serviceTypes.map((t) => listLabel(settings.lists.pestTypes, t)),
      basePrice: service?.basePrice,
    },
    steps,
    amount,
  };

  return { ...core, text: buildInvoiceText(core) };
}
