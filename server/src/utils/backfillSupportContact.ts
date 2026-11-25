import { AppContent, DEFAULT_APP_CONFIG } from '../models/AppContent';

/** The first default support number had its digits mistyped; configs created from it still store it. */
export const LEGACY_DEFAULT_SUPPORT_PHONE = '+91 67007 00106';

/**
 * One-time fix for app configs that still hold the mistyped default number: switch calls to the
 * real number and, if WhatsApp was never set, use the same number there. It only matches while the
 * old number is stored, so once it has run (or an admin edited the phone) it never touches the config again.
 */
export async function backfillSupportContact(): Promise<boolean> {
  const legacy = { key: 'app', 'appConfig.support.phone': LEGACY_DEFAULT_SUPPORT_PHONE };
  await AppContent.updateOne(
    { ...legacy, $or: [{ 'appConfig.support.whatsapp': { $in: ['', null] } }, { 'appConfig.support.whatsapp': { $exists: false } }] },
    { $set: { 'appConfig.support.whatsapp': DEFAULT_APP_CONFIG.support.whatsapp } },
  );
  const res = await AppContent.updateOne(legacy, { $set: { 'appConfig.support.phone': DEFAULT_APP_CONFIG.support.phone } });
  if (res.modifiedCount > 0) {
    console.log(`[content] Support number corrected to ${DEFAULT_APP_CONFIG.support.phone}`);
  }
  return res.modifiedCount > 0;
}
