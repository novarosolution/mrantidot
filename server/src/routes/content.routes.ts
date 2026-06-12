import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import {
  AppContent,
  DEFAULT_APP_CONFIG,
  DEFAULT_BOOKING_COPY,
  DEFAULT_HOME_CONFIG,
  DEFAULT_HOME_PROMO,
  IAppConfig,
  IBookingCopyConfig,
  IHomeConfig,
} from '../models/AppContent';
import { Service } from '../models/Service';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

export const contentRouter = Router();

const HOME_KEY = 'home';
const APP_KEY = 'app';

async function getOrCreateHomeDoc() {
  let doc = await AppContent.findOne({ key: HOME_KEY });
  if (!doc) {
    doc = await AppContent.create({
      key: HOME_KEY,
      homePromo: DEFAULT_HOME_PROMO,
      homeConfig: DEFAULT_HOME_CONFIG,
    });
  }
  return doc;
}

async function getOrCreateAppDoc() {
  let doc = await AppContent.findOne({ key: APP_KEY });
  if (!doc) {
    doc = await AppContent.create({ key: APP_KEY, appConfig: DEFAULT_APP_CONFIG });
  }
  return doc;
}

function formatHomePromo(doc: Awaited<ReturnType<typeof getOrCreateHomeDoc>>) {
  const p = doc.homePromo ?? DEFAULT_HOME_PROMO;
  return {
    badge: p.badge,
    title: p.title,
    ctaLabel: p.ctaLabel,
    serviceId: p.serviceId ? String(p.serviceId) : undefined,
    active: p.active !== false,
  };
}

function formatHomeConfig(doc: Awaited<ReturnType<typeof getOrCreateHomeDoc>>) {
  const c = doc.homeConfig ?? DEFAULT_HOME_CONFIG;
  const titles = c.sectionTitles ?? DEFAULT_HOME_CONFIG.sectionTitles;
  return {
    featuredServiceId: c.featuredServiceId ? String(c.featuredServiceId) : undefined,
    sectionTitles: {
      services: titles.services ?? DEFAULT_HOME_CONFIG.sectionTitles.services,
      popular: titles.popular ?? DEFAULT_HOME_CONFIG.sectionTitles.popular,
    },
    searchPlaceholder: c.searchPlaceholder ?? DEFAULT_HOME_CONFIG.searchPlaceholder,
    servicesSubtitle: c.servicesSubtitle ?? DEFAULT_HOME_CONFIG.servicesSubtitle,
    servicesActionLabel: c.servicesActionLabel ?? DEFAULT_HOME_CONFIG.servicesActionLabel,
    popularActionLabel: c.popularActionLabel ?? DEFAULT_HOME_CONFIG.popularActionLabel,
    categoryChips:
      c.categoryChips?.length > 0 ? c.categoryChips.map((ch) => ({
          label: ch.label,
          category: ch.category || undefined,
        }))
      : DEFAULT_HOME_CONFIG.categoryChips,
  };
}

function mergeHomeConfig(
  current: IHomeConfig,
  patch: Record<string, unknown>,
): IHomeConfig {
  const next: IHomeConfig = {
    sectionTitles: { ...current.sectionTitles },
    searchPlaceholder: current.searchPlaceholder ?? DEFAULT_HOME_CONFIG.searchPlaceholder,
    servicesSubtitle: current.servicesSubtitle ?? DEFAULT_HOME_CONFIG.servicesSubtitle,
    servicesActionLabel: current.servicesActionLabel ?? DEFAULT_HOME_CONFIG.servicesActionLabel,
    popularActionLabel: current.popularActionLabel ?? DEFAULT_HOME_CONFIG.popularActionLabel,
    categoryChips: [...(current.categoryChips ?? DEFAULT_HOME_CONFIG.categoryChips)],
    featuredServiceId: current.featuredServiceId,
  };
  const cfg = patch.homeConfig as Record<string, unknown> | undefined;
  if (!cfg || typeof cfg !== 'object') return next;

  if (cfg.featuredServiceId === null || cfg.featuredServiceId === '') {
    next.featuredServiceId = undefined;
  } else if (typeof cfg.featuredServiceId === 'string' && cfg.featuredServiceId) {
    next.featuredServiceId = new Types.ObjectId(cfg.featuredServiceId);
  }

  const titles = cfg.sectionTitles as Record<string, unknown> | undefined;
  if (titles && typeof titles === 'object') {
    if (typeof titles.services === 'string') next.sectionTitles.services = titles.services;
    if (typeof titles.popular === 'string') next.sectionTitles.popular = titles.popular;
  }

  if (typeof cfg.searchPlaceholder === 'string') next.searchPlaceholder = cfg.searchPlaceholder;
  if (typeof cfg.servicesSubtitle === 'string') next.servicesSubtitle = cfg.servicesSubtitle;
  if (typeof cfg.servicesActionLabel === 'string') next.servicesActionLabel = cfg.servicesActionLabel;
  if (typeof cfg.popularActionLabel === 'string') next.popularActionLabel = cfg.popularActionLabel;

  if (Array.isArray(cfg.categoryChips)) {
    next.categoryChips = cfg.categoryChips
      .filter((ch): ch is { label: string; category?: string } => {
        return typeof ch === 'object' && ch !== null && typeof (ch as { label?: string }).label === 'string';
      })
      .map((ch) => ({
        label: ch.label.trim(),
        category: typeof ch.category === 'string' && ch.category ? ch.category : undefined,
      }));
  }

  return next;
}

async function resolveActiveServiceId(id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  const service = await Service.findOne({ _id: id, active: true }).select('_id');
  return service ? String(service._id) : undefined;
}

async function formatHomePromoResolved(doc: Awaited<ReturnType<typeof getOrCreateHomeDoc>>) {
  const p = doc.homePromo ?? DEFAULT_HOME_PROMO;
  const serviceId = await resolveActiveServiceId(p.serviceId ? String(p.serviceId) : undefined);
  return {
    badge: p.badge,
    title: p.title,
    ctaLabel: p.ctaLabel,
    serviceId,
    active: p.active !== false,
  };
}

async function formatHomeConfigResolved(doc: Awaited<ReturnType<typeof getOrCreateHomeDoc>>) {
  const c = doc.homeConfig ?? DEFAULT_HOME_CONFIG;
  const titles = c.sectionTitles ?? DEFAULT_HOME_CONFIG.sectionTitles;
  const featuredServiceId = await resolveActiveServiceId(
    c.featuredServiceId ? String(c.featuredServiceId) : undefined,
  );
  return {
    featuredServiceId,
    sectionTitles: {
      services: titles.services ?? DEFAULT_HOME_CONFIG.sectionTitles.services,
      popular: titles.popular ?? DEFAULT_HOME_CONFIG.sectionTitles.popular,
    },
    searchPlaceholder: c.searchPlaceholder ?? DEFAULT_HOME_CONFIG.searchPlaceholder,
    servicesSubtitle: c.servicesSubtitle ?? DEFAULT_HOME_CONFIG.servicesSubtitle,
    servicesActionLabel: c.servicesActionLabel ?? DEFAULT_HOME_CONFIG.servicesActionLabel,
    popularActionLabel: c.popularActionLabel ?? DEFAULT_HOME_CONFIG.popularActionLabel,
    categoryChips:
      c.categoryChips?.length > 0
        ? c.categoryChips.map((ch) => ({
            label: ch.label,
            category: ch.category || undefined,
          }))
        : DEFAULT_HOME_CONFIG.categoryChips,
  };
}

contentRouter.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const doc = await getOrCreateHomeDoc();
    const promo = await formatHomePromoResolved(doc);
    const homeConfig = await formatHomeConfigResolved(doc);
    if (!promo.active) {
      res.json({
        promo: { ...DEFAULT_HOME_PROMO, active: false },
        homeConfig,
      });
      return;
    }
    res.json({ promo, homeConfig });
  }),
);

contentRouter.get(
  '/admin/home',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const doc = await getOrCreateHomeDoc();
    res.json({
      promo: await formatHomePromoResolved(doc),
      homeConfig: await formatHomeConfigResolved(doc),
    });
  }),
);

contentRouter.patch(
  '/admin/home',
  requireAuth,
  requireRole('admin'),
  body('badge').optional().trim().isLength({ max: 80 }),
  body('title').optional().trim().isLength({ max: 120 }),
  body('ctaLabel').optional().trim().isLength({ max: 40 }),
  body('serviceId').optional({ nullable: true }),
  body('active').optional().isBoolean(),
  body('homeConfig').optional().isObject(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0]?.msg ?? 'Validation failed' });
      return;
    }
    const doc = await getOrCreateHomeDoc();
    const nextPromo = { ...(doc.homePromo ?? DEFAULT_HOME_PROMO) };
    if (typeof req.body.badge === 'string') nextPromo.badge = req.body.badge;
    if (typeof req.body.title === 'string') nextPromo.title = req.body.title;
    if (typeof req.body.ctaLabel === 'string') nextPromo.ctaLabel = req.body.ctaLabel;
    if (req.body.serviceId === null || req.body.serviceId === '') {
      nextPromo.serviceId = undefined;
    } else if (typeof req.body.serviceId === 'string' && req.body.serviceId) {
      nextPromo.serviceId = new Types.ObjectId(req.body.serviceId);
    }
    if (typeof req.body.active === 'boolean') nextPromo.active = req.body.active;

    const currentConfig = doc.homeConfig ?? DEFAULT_HOME_CONFIG;
    const nextConfig = req.body.homeConfig
      ? mergeHomeConfig(currentConfig, req.body)
      : currentConfig;

    doc.homePromo = nextPromo;
    doc.homeConfig = nextConfig;
    await doc.save();
    res.json({
      promo: await formatHomePromoResolved(doc),
      homeConfig: await formatHomeConfigResolved(doc),
    });
  }),
);

function strBookingField(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function formatBookingCopy(raw?: Partial<IBookingCopyConfig>): IBookingCopyConfig {
  const d = DEFAULT_BOOKING_COPY;
  const b = raw ?? {};
  const out = { ...d };
  for (const key of Object.keys(d) as (keyof IBookingCopyConfig)[]) {
    out[key] = strBookingField(b[key], d[key]);
  }
  return out;
}

function formatAppConfig(doc: Awaited<ReturnType<typeof getOrCreateAppDoc>>): IAppConfig {
  const a = doc.appConfig ?? DEFAULT_APP_CONFIG;
  const d = DEFAULT_APP_CONFIG;
  return {
    support: {
      phone: a.support?.phone ?? d.support.phone,
      email: a.support?.email ?? d.support.email,
      whatsapp: a.support?.whatsapp ?? d.support.whatsapp,
      hours: a.support?.hours ?? d.support.hours,
    },
    branding: {
      name: a.branding?.name ?? d.branding.name,
      tagline: a.branding?.tagline ?? d.branding.tagline,
    },
    trust: {
      guaranteeText: a.trust?.guaranteeText ?? d.trust.guaranteeText,
      badges: a.trust?.badges?.length ? a.trust.badges : d.trust.badges,
    },
    onboarding: {
      slides: a.onboarding?.slides?.length ? a.onboarding.slides : d.onboarding.slides,
      trustChips: a.onboarding?.trustChips?.length ? a.onboarding.trustChips : d.onboarding.trustChips,
    },
    legal: {
      termsMarkdown: a.legal?.termsMarkdown ?? d.legal.termsMarkdown,
      privacyMarkdown: a.legal?.privacyMarkdown ?? d.legal.privacyMarkdown,
    },
    aboutMarkdown: a.aboutMarkdown ?? d.aboutMarkdown,
    faq: a.faq?.length ? a.faq : d.faq,
    booking: formatBookingCopy(a.booking),
  };
}

function asString(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function asStringArray(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim());
}

function mergeAppConfig(current: IAppConfig, patch: Record<string, unknown>): IAppConfig {
  const next: IAppConfig = JSON.parse(JSON.stringify(current));

  const support = patch.support as Record<string, unknown> | undefined;
  if (support && typeof support === 'object') {
    next.support.phone = asString(support.phone, next.support.phone);
    next.support.email = asString(support.email, next.support.email);
    next.support.whatsapp = asString(support.whatsapp, next.support.whatsapp ?? '');
    next.support.hours = asString(support.hours, next.support.hours ?? '');
  }

  const branding = patch.branding as Record<string, unknown> | undefined;
  if (branding && typeof branding === 'object') {
    next.branding.name = asString(branding.name, next.branding.name);
    next.branding.tagline = asString(branding.tagline, next.branding.tagline);
  }

  const trust = patch.trust as Record<string, unknown> | undefined;
  if (trust && typeof trust === 'object') {
    next.trust.guaranteeText = asString(trust.guaranteeText, next.trust.guaranteeText);
    if (Array.isArray(trust.badges)) next.trust.badges = asStringArray(trust.badges, next.trust.badges);
  }

  const onboarding = patch.onboarding as Record<string, unknown> | undefined;
  if (onboarding && typeof onboarding === 'object') {
    if (Array.isArray(onboarding.slides)) {
      next.onboarding.slides = onboarding.slides
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null && typeof (s as { title?: unknown }).title === 'string')
        .map((s) => ({
          title: asString(s.title, ''),
          subtitle: asString(s.subtitle, ''),
          icon: typeof s.icon === 'string' && s.icon ? s.icon : undefined,
        }));
    }
    if (Array.isArray(onboarding.trustChips)) {
      next.onboarding.trustChips = asStringArray(onboarding.trustChips, next.onboarding.trustChips);
    }
  }

  const legal = patch.legal as Record<string, unknown> | undefined;
  if (legal && typeof legal === 'object') {
    next.legal.termsMarkdown = asString(legal.termsMarkdown, next.legal.termsMarkdown);
    next.legal.privacyMarkdown = asString(legal.privacyMarkdown, next.legal.privacyMarkdown);
  }

  if (typeof patch.aboutMarkdown === 'string') next.aboutMarkdown = patch.aboutMarkdown;

  if (Array.isArray(patch.faq)) {
    next.faq = patch.faq
      .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null && typeof (f as { q?: unknown }).q === 'string')
      .map((f) => ({ q: asString(f.q, ''), a: asString(f.a, '') }))
      .filter((f) => f.q.trim().length > 0);
  }

  const booking = patch.booking as Record<string, unknown> | undefined;
  if (booking && typeof booking === 'object') {
    next.booking = formatBookingCopy({ ...next.booking, ...booking } as Partial<IBookingCopyConfig>);
  }

  return next;
}

contentRouter.get(
  '/app',
  asyncHandler(async (_req, res) => {
    const doc = await getOrCreateAppDoc();
    res.json({ app: formatAppConfig(doc) });
  }),
);

contentRouter.get(
  '/admin/app',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const doc = await getOrCreateAppDoc();
    res.json({ app: formatAppConfig(doc) });
  }),
);

contentRouter.patch(
  '/admin/app',
  requireAuth,
  requireRole('admin'),
  body('support').optional().isObject(),
  body('branding').optional().isObject(),
  body('trust').optional().isObject(),
  body('onboarding').optional().isObject(),
  body('legal').optional().isObject(),
  body('aboutMarkdown').optional().isString(),
  body('faq').optional().isArray(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0]?.msg ?? 'Validation failed' });
      return;
    }
    const doc = await getOrCreateAppDoc();
    const current = formatAppConfig(doc);
    doc.appConfig = mergeAppConfig(current, req.body);
    await doc.save();
    res.json({ app: formatAppConfig(doc) });
  }),
);
