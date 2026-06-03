import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { SavedAddress } from '../models/SavedAddress';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';

export const addressesRouter = Router();

addressesRouter.use(requireAuth, requireRole('customer'));

function runValidation(
  req: Parameters<typeof validationResult>[0],
  res: { status: (n: number) => { json: (o: object) => void } },
  next: () => void,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0]?.msg ?? 'Validation failed' });
    return;
  }
  next();
}

addressesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const addresses = await SavedAddress.find({ customerId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ addresses: addresses.map((a) => a.toJSON()) });
  }),
);

addressesRouter.post(
  '/',
  body('label').trim().notEmpty(),
  body('line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('pincode').optional().trim(),
  body('isDefault').optional().isBoolean(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    if (req.body.isDefault) {
      await SavedAddress.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }
    const address = await SavedAddress.create({
      customerId: req.user!.id,
      label: req.body.label,
      line1: req.body.line1,
      city: req.body.city,
      pincode: req.body.pincode,
      isDefault: req.body.isDefault ?? false,
    });
    res.status(201).json({ address: address.toJSON() });
  }),
);

addressesRouter.patch(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const address = await SavedAddress.findOne({ _id: req.params.id, customerId: req.user!.id });
    if (!address) throw new AppError(404, 'Address not found');
    if (req.body.isDefault) {
      await SavedAddress.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }
    Object.assign(address, req.body);
    await address.save();
    res.json({ address: address.toJSON() });
  }),
);

addressesRouter.delete(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const address = await SavedAddress.findOneAndDelete({ _id: req.params.id, customerId: req.user!.id });
    if (!address) throw new AppError(404, 'Address not found');
    res.json({ ok: true });
  }),
);
