import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import {
  defaultBusinessSettings,
  getBusinessSettings,
  publicBusinessSettings,
  saveBusinessSettings,
} from '../utils/businessSettings';
import { revalidateWebsite } from '../utils/websiteRevalidate';

/**
 * Business rules (tax, slots, booking rules, lists, service area, payments, app status, messages).
 *   GET   /api/settings          public subset (apps + website)
 *   GET   /api/settings/admin    everything, incl. notification texts (admin) + the built-in `defaults`
 *   PATCH /api/settings/admin    replace the groups sent; send `updatedAt` from the last read
 */
export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getBusinessSettings();
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ settings: publicBusinessSettings(settings) });
  }),
);

const admin = Router();
settingsRouter.use('/admin', requireAuth, requireRole('admin'), admin);

admin.get(
  '/',
  asyncHandler(async (_req, res) => {
    // `defaults` lets the admin screen offer "reset to default" (notification texts, lists…).
    res.json({ settings: await getBusinessSettings(), defaults: defaultBusinessSettings() });
  }),
);

admin.patch(
  '/',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const sentAt = typeof body.updatedAt === 'string' ? body.updatedAt : undefined;
    const settings = await saveBusinessSettings(body, req.user!.id, sentAt);
    revalidateWebsite(['settings', 'content']);
    res.json({ settings });
  }),
);
