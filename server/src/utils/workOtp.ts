import crypto from 'crypto';
import { env } from '../config/env';
import { IBooking, IWorkOtpEntry, TrackingEventType } from '../models/Booking';

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function otpKey(): Buffer {
  return crypto.scryptSync(env.jwtSecret, 'mrantidot-work-otp', 32);
}

export function generateWorkOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(OTP_LENGTH, '0');
}

export function hashWorkOtp(code: string): string {
  return crypto.createHmac('sha256', env.jwtSecret).update(code).digest('hex');
}

export function verifyWorkOtp(code: string, hash: string): boolean {
  const candidate = hashWorkOtp(code);
  try {
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
  } catch {
    return false;
  }
}

function encryptCode(code: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', otpKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptCode(codeEnc: string): string | undefined {
  try {
    const [ivHex, tagHex, dataHex] = codeEnc.split(':');
    if (!ivHex || !tagHex || !dataHex) return undefined;
    const decipher = crypto.createDecipheriv('aes-256-gcm', otpKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return undefined;
  }
}

export function maskOtpCode(code: string): string {
  if (code.length < 2) return '••••••';
  return `••••${code.slice(-2)}`;
}

function otpExpiry(): Date {
  return new Date(Date.now() + env.workOtpTtlMinutes * 60 * 1000);
}

function isExpired(entry?: IWorkOtpEntry): boolean {
  if (!entry?.expiresAt) return true;
  return new Date(entry.expiresAt).getTime() <= Date.now();
}

function isLocked(booking: IBooking, type: 'start' | 'end'): boolean {
  const lockUntil = booking.otpAttempts?.[`${type}LockedUntil` as 'startLockedUntil' | 'endLockedUntil'];
  if (!lockUntil) return false;
  return new Date(lockUntil).getTime() > Date.now();
}

function recordFailedAttempt(booking: IBooking, type: 'start' | 'end'): void {
  if (!booking.otpAttempts) {
    booking.otpAttempts = { start: 0, end: 0 };
  }
  const countKey = type;
  booking.otpAttempts[countKey] = (booking.otpAttempts[countKey] ?? 0) + 1;
  if (booking.otpAttempts[countKey]! >= MAX_ATTEMPTS) {
    const lockKey = type === 'start' ? 'startLockedUntil' : 'endLockedUntil';
    booking.otpAttempts[lockKey] = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    booking.otpAttempts[countKey] = 0;
  }
  booking.markModified('otpAttempts');
}

function clearAttempts(booking: IBooking, type: 'start' | 'end'): void {
  if (!booking.otpAttempts) return;
  booking.otpAttempts[type] = 0;
  const lockKey = type === 'start' ? 'startLockedUntil' : 'endLockedUntil';
  delete booking.otpAttempts[lockKey];
  booking.markModified('otpAttempts');
}

export function appendTracking(
  booking: IBooking,
  event: TrackingEventType,
  meta?: Record<string, unknown>,
): void {
  if (!booking.tracking) booking.tracking = [];
  booking.tracking.push({ at: new Date(), event, meta });
  booking.markModified('tracking');
}

/** Issue start OTP when technician is assigned. Returns plaintext for notifications only. */
export function issueStartOtp(booking: IBooking): string {
  const code = generateWorkOtp();
  if (!booking.workOtp) booking.workOtp = {};
  booking.workOtp.start = {
    codeHash: hashWorkOtp(code),
    codeEnc: encryptCode(code),
    codeSuffix: code.slice(-2),
    expiresAt: otpExpiry(),
  };
  booking.markModified('workOtp');
  appendTracking(booking, 'start_otp_sent');
  return code;
}

/** Issue end OTP when all treatment steps are done. */
export function issueEndOtp(booking: IBooking): string {
  const code = generateWorkOtp();
  if (!booking.workOtp) booking.workOtp = {};
  booking.workOtp.end = {
    codeHash: hashWorkOtp(code),
    codeEnc: encryptCode(code),
    codeSuffix: code.slice(-2),
    expiresAt: otpExpiry(),
  };
  booking.markModified('workOtp');
  appendTracking(booking, 'end_otp_sent');
  return code;
}

export function getCustomerOtpCode(booking: IBooking, type: 'start' | 'end'): string | undefined {
  const entry = booking.workOtp?.[type];
  if (!entry || entry.verifiedAt || isExpired(entry)) return undefined;
  return entry.codeEnc ? decryptCode(entry.codeEnc) : undefined;
}

export function getOtpExpiresIn(entry?: IWorkOtpEntry): number {
  if (!entry?.expiresAt || entry.verifiedAt) return 0;
  return Math.max(0, Math.floor((new Date(entry.expiresAt).getTime() - Date.now()) / 1000));
}

export function verifyStartOtp(booking: IBooking, code: string): void {
  if (booking.status !== 'confirmed') {
    throw new Error('Booking is not ready to start');
  }
  if (!booking.technicianId) {
    throw new Error('No technician assigned');
  }
  if (isLocked(booking, 'start')) {
    throw new Error('Too many failed attempts. Try again later or ask customer for a new code.');
  }
  const entry = booking.workOtp?.start;
  if (!entry || entry.verifiedAt) {
    throw new Error('Start code is not available');
  }
  if (isExpired(entry)) {
    throw new Error('Start code has expired. Ask the customer to refresh their code.');
  }
  if (!verifyWorkOtp(code, entry.codeHash)) {
    recordFailedAttempt(booking, 'start');
    throw new Error('Invalid start code');
  }
  entry.verifiedAt = new Date();
  booking.workStartedAt = new Date();
  booking.status = 'in_progress';
  booking.markModified('workOtp');
  clearAttempts(booking, 'start');
  appendTracking(booking, 'work_started');
}

export function verifyEndOtp(booking: IBooking, code: string): void {
  if (booking.status !== 'awaiting_verification') {
    throw new Error('Booking is not awaiting completion code');
  }
  if (isLocked(booking, 'end')) {
    throw new Error('Too many failed attempts. Try again later or ask customer for a new code.');
  }
  const entry = booking.workOtp?.end;
  if (!entry || entry.verifiedAt) {
    throw new Error('End code is not available');
  }
  if (isExpired(entry)) {
    throw new Error('End code has expired. Ask the customer to refresh their code.');
  }
  if (!verifyWorkOtp(code, entry.codeHash)) {
    recordFailedAttempt(booking, 'end');
    throw new Error('Invalid end code');
  }
  entry.verifiedAt = new Date();
  booking.workCompletedAt = new Date();
  booking.status = 'completed';
  booking.markModified('workOtp');
  clearAttempts(booking, 'end');
  appendTracking(booking, 'work_completed');
}

export function regenerateOtp(booking: IBooking, type: 'start' | 'end'): string {
  if (type === 'start') {
    if (booking.status !== 'confirmed' || !booking.technicianId) {
      throw new Error('Cannot regenerate start code for this booking');
    }
    if (booking.workOtp?.start?.verifiedAt) {
      throw new Error('Work has already started');
    }
    return issueStartOtp(booking);
  }
  if (booking.status !== 'awaiting_verification') {
    throw new Error('Cannot regenerate end code for this booking');
  }
  if (booking.workOtp?.end?.verifiedAt) {
    throw new Error('Work is already completed');
  }
  return issueEndOtp(booking);
}

export function buildOtpEntry(code: string, verified = false): IWorkOtpEntry {
  return {
    codeHash: hashWorkOtp(code),
    codeEnc: encryptCode(code),
    codeSuffix: code.slice(-2),
    expiresAt: otpExpiry(),
    ...(verified ? { verifiedAt: new Date() } : {}),
  };
}

export function otpRequiredForBooking(booking: IBooking): 'start' | 'end' | null {
  if (booking.status === 'confirmed' && booking.technicianId && !booking.workOtp?.start?.verifiedAt) {
    return 'start';
  }
  if (booking.status === 'awaiting_verification' && !booking.workOtp?.end?.verifiedAt) {
    return 'end';
  }
  return null;
}
