import { Types } from 'mongoose';
import { PaymentMethod } from '../models/PaymentMethod';

export async function ensureDefaultPaymentMethods(
  customerId: string | Types.ObjectId,
): Promise<void> {
  const count = await PaymentMethod.countDocuments({ customerId });
  if (count > 0) return;

  await PaymentMethod.insertMany([
    {
      customerId,
      type: 'upi_card',
      label: 'UPI / Card',
      details: '',
      isDefault: true,
    },
    {
      customerId,
      type: 'pay_after',
      label: 'Pay after service',
      isDefault: false,
    },
  ]);
}
