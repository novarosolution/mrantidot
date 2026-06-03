import { SavedAddress, formatAddressLine } from '../models/SavedAddress';
import { AppError } from './AppError';

export async function resolveAddressString(
  customerId: string,
  addressId?: string,
  addressText?: string,
): Promise<string> {
  if (addressId) {
    const saved = await SavedAddress.findOne({ _id: addressId, customerId });
    if (!saved) throw new AppError(400, 'Invalid addressId');
    return formatAddressLine(saved);
  }
  if (addressText?.trim()) return addressText.trim();
  throw new AppError(400, 'address or addressId is required');
}
