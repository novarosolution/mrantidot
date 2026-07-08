import '../types/express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PaymentMethod } from '../models/PaymentMethod';
import { requireAuth, requireRole } from '../middleware/auth';
import { ensureDefaultPaymentMethods } from '../utils/ensurePaymentMethods';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/error';

export const paymentMethodsRouter = Router();

paymentMethodsRouter.use(requireAuth, requireRole('customer'));

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

paymentMethodsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureDefaultPaymentMethods(req.user!.id);
    const methods = await PaymentMethod.find({ customerId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ paymentMethods: methods.map((m) => m.toJSON()) });
  }),
);

paymentMethodsRouter.post(
  '/',
  body('type').isIn(['upi_card', 'pay_after']),
  body('label').trim().notEmpty(),
  body('details').optional().trim(),
  body('isDefault').optional().isBoolean(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    if (req.body.isDefault) {
      await PaymentMethod.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }
    const method = await PaymentMethod.create({
      customerId: req.user!.id,
      type: req.body.type,
      label: req.body.label,
      details: req.body.details,
      isDefault: req.body.isDefault ?? false,
    });
    res.status(201).json({ paymentMethod: method.toJSON() });
  }),
);

paymentMethodsRouter.patch(
  '/:id',
  param('id').isMongoId(),
  body('type').optional().isIn(['upi_card', 'pay_after']),
  body('label').optional().trim().notEmpty(),
  body('details').optional().trim(),
  body('isDefault').optional().isBoolean(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const method = await PaymentMethod.findOne({ _id: req.params.id, customerId: req.user!.id });
    if (!method) throw new AppError(404, 'Payment method not found');
    if (req.body.isDefault) {
      await PaymentMethod.updateMany({ customerId: req.user!.id }, { isDefault: false });
    }
    // Whitelist editable fields only — never let the client overwrite customerId/_id.
    const { type, label, details, isDefault } = req.body as {
      type?: 'upi_card' | 'pay_after';
      label?: string;
      details?: string;
      isDefault?: boolean;
    };
    if (type !== undefined) method.type = type;
    if (label !== undefined) method.label = label;
    if (details !== undefined) method.details = details;
    if (isDefault !== undefined) method.isDefault = isDefault;
    await method.save();
    res.json({ paymentMethod: method.toJSON() });
  }),
);

paymentMethodsRouter.delete(
  '/:id',
  param('id').isMongoId(),
  (req, res, next) => runValidation(req, res, next),
  asyncHandler(async (req, res) => {
    const method = await PaymentMethod.findOneAndDelete({ _id: req.params.id, customerId: req.user!.id });
    if (!method) throw new AppError(404, 'Payment method not found');
    res.json({ ok: true });
  }),
);
