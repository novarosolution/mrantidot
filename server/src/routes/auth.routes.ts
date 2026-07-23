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
import {
  findEnvAdminForLogin,
  isAcceptedAdminPassword,
  isEnvAdminIdentifier,
  isLegacyAdminIdentifier,
  upsertAdminUser,
} from '../utils/adminUser';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { isDbConnected } from '../config/db';
import { env } from '../config/env';

export const authRouter = Router();

const MOCK_OTP = '4700';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findUserForLogin(identifier: string) {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');

  // Env / legacy admin aliases always resolve to the configured admin account.
  if (isEnvAdminIdentifier(trimmed)) {
    const envAdmin = await findEnvAdminForLogin();
    if (envAdmin) return envAdmin;
  }

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
    if (!isDbConnected()) {
      throw new AppError(503, 'Database is not connected. Restart the API and check MONGO_URI.');
    }

    const { identifier, password } = req.body as { identifier: string; password: string };
    const pass = password.trim();

    let user = await findUserForLogin(identifier);

    // Env admin may be missing after a fresh DB / failed startup sync — repair then retry.
    if (!user && isEnvAdminIdentifier(identifier)) {
      await upsertAdminUser();
      user = await findEnvAdminForLogin();
    }

    if (!user?.passwordHash) {
      if (!env.isProduction) {
        console.warn(`[auth] login 401 — no user for "${identifier.trim()}"`);
      }
      throw new AppError(401, 'Invalid credentials');
    }

    let valid = await bcrypt.compare(pass, user.passwordHash);
    if (!valid && isEnvAdminIdentifier(identifier) && isAcceptedAdminPassword(pass)) {
      // Env password or (dev) legacy demo password — re-sync hash from ADMIN_PASSWORD.
      await upsertAdminUser();
      user = await findEnvAdminForLogin();
      if (!user?.passwordHash) {
        throw new AppError(401, 'Invalid credentials');
      }
      valid =
        (await bcrypt.compare(pass, user.passwordHash)) ||
        (!env.isProduction && isAcceptedAdminPassword(pass));
    }

    if (!valid) {
      if (!env.isProduction) {
        console.warn(`[auth] login 401 — bad password for "${identifier.trim()}"`);
      }
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.disabled === true) {
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
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(503, 'SMS OTP is not configured. Please sign in with email and password.');
    }
    res.json({ ok: true, mock: true, hint: MOCK_OTP });
  }),
);

authRouter.post(
  '/otp/verify',
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const { phone, code } = req.body as { phone: string; code: string };

    if (process.env.NODE_ENV === 'production') {
      throw new AppError(503, 'SMS OTP is not configured. Please sign in with email and password.');
    }

    if (code !== MOCK_OTP) {
      throw new AppError(400, 'Invalid OTP code');
    }

    const normalizedPhone = normalizePhone(phone);
    let user = await User.findOne({ phone: { $in: phoneLookupVariants(phone) } });

    if (!user) {
      const passwordHash = await bcrypt.hash(`otp-${normalizedPhone}-${Date.now()}`, 12);
      user = await User.create({
        role: 'customer',
        name: 'Customer',
        phone: normalizedPhone,
        email: `${normalizedPhone}@otp.mrantidot.local`,
        passwordHash,
      });
    }

    if (user.disabled === true) {
      throw new AppError(403, 'This account has been disabled. Contact support.');
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
    if (email !== undefined) {
      const normalizedEmail = normalizeLoginEmail(email);
      const taken = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user!.id } });
      if (taken) {
        throw new AppError(400, 'Email already registered');
      }
      updates.email = normalizedEmail;
    }
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
