import '../types/express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { User, sanitizeUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/token';
import { ensureDefaultPaymentMethods } from '../utils/ensurePaymentMethods';
import { normalizePhone, phoneLookupVariants } from '../utils/phone';
import { normalizeLoginEmail } from '../utils/email';
import { findEnvAdminForLogin, isLegacyAdminIdentifier } from '../utils/adminUser';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

export const authRouter = Router();

const MOCK_OTP = '4700';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findUserForLogin(identifier: string) {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');

  if (!isEmail) {
    return User.findOne({ phone: { $in: phoneLookupVariants(trimmed) } }).select('+passwordHash');
  }

  if (isLegacyAdminIdentifier(trimmed)) {
    const envAdmin = await findEnvAdminForLogin();
    if (envAdmin) return envAdmin;
  }

  const normalized = normalizeLoginEmail(trimmed);
  const primary = await User.findOne({ email: normalized }).select('+passwordHash');
  if (primary) return primary;

  const lower = trimmed.toLowerCase();
  if (lower !== normalized) {
    const alt = await User.findOne({ email: lower }).select('+passwordHash');
    if (alt) return alt;
  }

  return User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(lower)}$`, 'i') },
  }).select('+passwordHash');
}

function runValidation(
  req: Parameters<typeof validationResult>[0],
  res: { status: (code: number) => { json: (body: object) => void } },
  next: () => void,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0]?.msg ?? 'Validation failed' });
    return;
  }
  next();
}

authRouter.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('city').optional().trim(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const { name, phone, email, password, city } = req.body as {
      name: string;
      phone: string;
      email: string;
      password: string;
      city?: string;
    };

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeLoginEmail(email);
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      throw new AppError(400, 'Phone already registered');
    }
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new AppError(400, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);
    const user = await User.create({
      role: 'customer',
      name,
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
      city,
    });

    await ensureDefaultPaymentMethods(user._id);

    const token = signToken({ id: user._id.toString(), role: user.role });
    res.status(201).json({ token, user: sanitizeUser(user) });
  }),
);

authRouter.post(
  '/login',
  body('identifier').trim().notEmpty().withMessage('Identifier is required'),
  body('password')
    .custom((value) => typeof value === 'string' && value.trim().length > 0)
    .withMessage('Password is required'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as { identifier: string; password: string };
    const pass = password.trim();

    const user = await findUserForLogin(identifier);

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(pass, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.disabled === true || (user.available === false && user.role !== 'technician')) {
      throw new AppError(403, 'This account has been disabled. Contact support.');
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    const publicUser = await User.findById(user._id);
    if (!publicUser) {
      throw new AppError(401, 'Invalid credentials');
    }
    res.json({ token, user: sanitizeUser(publicUser) });
  }),
);

authRouter.post(
  '/otp/send',
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (_req, res) => {
    res.json({ ok: true });
  }),
);

authRouter.post(
  '/otp/verify',
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const { phone, code } = req.body as { phone: string; code: string };

    if (code !== MOCK_OTP) {
      throw new AppError(400, 'Invalid OTP code');
    }

    const normalizedPhone = normalizePhone(phone);
    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      const passwordHash = await bcrypt.hash(`otp-${normalizedPhone}-${Date.now()}`, 12);
      user = await User.create({
        role: 'customer',
        name: 'Customer',
        phone: normalizedPhone,
        email: `${phone.trim().replace(/\D/g, '')}@otp.mrantidot.local`,
        passwordHash,
      });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });
    res.json({ token, user: sanitizeUser(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError(401, 'User not found');
    }
    res.json({ user: sanitizeUser(user) });
  }),
);

authRouter.patch(
  '/me',
  requireAuth,
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('city').optional().trim(),
  body('phone').optional().trim().notEmpty(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const updates: Record<string, string> = {};
    const { name, email, city, phone } = req.body as {
      name?: string;
      email?: string;
      city?: string;
      phone?: string;
    };

    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      const taken = await User.findOne({ phone: normalizedPhone, _id: { $ne: req.user!.id } });
      if (taken) {
        throw new AppError(400, 'Phone already registered');
      }
      updates.phone = normalizedPhone;
    }

    const user = await User.findByIdAndUpdate(req.user!.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ user: sanitizeUser(user) });
  }),
);
