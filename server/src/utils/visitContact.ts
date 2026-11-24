import { AppError } from './AppError';
import { normalizePhone } from './phone';

export interface VisitContact {
  name: string;
  phone: string;
}

/**
 * The person at the property when a booking is for someone other than the account holder.
 * Returns undefined when the request carries no contact; throws a 400 when it is half-filled or invalid,
 * so the visit never goes out with a name nobody can call.
 */
export function parseVisitContact(input: unknown): VisitContact | undefined {
  if (input == null || input === '') return undefined;
  if (typeof input !== 'object') throw new AppError(400, 'Visit contact is invalid');
  const raw = input as { name?: unknown; phone?: unknown };
  const name = typeof raw.name === 'string' ? raw.name.replace(/\s+/g, ' ').trim() : '';
  const phoneRaw = typeof raw.phone === 'string' ? raw.phone : typeof raw.phone === 'number' ? String(raw.phone) : '';
  if (!name && !phoneRaw.trim()) return undefined;
  if (name.length < 2 || name.length > 60) {
    throw new AppError(400, 'Enter the name of the person who will be at the property (2–60 letters)');
  }
  const phone = normalizePhone(phoneRaw);
  if (!/^[0-9]{10}$/.test(phone)) {
    throw new AppError(400, 'Enter a valid 10-digit mobile number for the person at the property');
  }
  return { name, phone };
}
