import { Types } from 'mongoose';
import { PaymentMethod } from '../models/PaymentMethod';
import { getBusinessSettings } from './businessSettings';

/**
 * A customer's first payment methods: the ones switched on in Business settings → Payments, with the
 * admin's names, in the admin's order (the first is the default). Existing rows are never touched.
 */
export async function ensureDefaultPaymentMethods(
  customerId: string | Types.ObjectId,
): Promise<void> {
  const count = await PaymentMethod.countDocuments({ customerId });
  if (count > 0) return;

  const { payments } = await getBusinessSettings();
  const methods = payments.methods.filter((m) => m.active);
  if (methods.length === 0) return;

  await PaymentMethod.insertMany(
    methods.map((m, i) => ({
      customerId,
      type: m.key,
      label: m.label,
      ...(m.key === 'upi_card' ? { details: '' } : {}),
      isDefault: i === 0,
    })),
  );
}
