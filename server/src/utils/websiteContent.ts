import { AppContent, DEFAULT_CUSTOMER_UI_COPY } from '../models/AppContent';
import {
  WEBSITE_ICON_KEYS,
  WebsiteContent,
  type IWebsiteContent,
  type IWebsiteImage,
  type IWebsiteSection,
} from '../models/Website';
import { AppError } from './AppError';

/** Sections each page can show, in their default order. The website has one component per key. */
export const HOME_SECTIONS = ['hero', 'offers', 'services', 'why', 'process', 'sectors', 'mission', 'reviews', 'team', 'blog', 'faq', 'app', 'cta'] as const;
export const ABOUT_SECTIONS = ['intro', 'stats', 'mission', 'science', 'why', 'team', 'faq', 'cta'] as const;

/** Sections that show a list of items get an admin-set item count. */
const DEFAULT_LIMITS: Record<string, number> = { offers: 3, services: 8, reviews: 6, team: 4, blog: 3 };
const MAX_LIMIT = 24;

export const SEO_PAGES = ['home', 'services', 'about', 'blog', 'gallery', 'team', 'contact'] as const;

const LIST_CAPS = { stats: 8, why: 8, steps: 8, sectors: 16, science: 8, aboutPoints: 12, heroChips: 8, whyImages: 2 };

export type WebsiteView = {
  pages: { home: IWebsiteSection[]; about: IWebsiteSection[] };
  images: IWebsiteContent['images'];
  lists: IWebsiteContent['lists'];
  social: IWebsiteContent['social'];
  seo: Record<string, { title: string; description: string }>;
  announcement: IWebsiteContent['announcement'];
  updatedAt: string;
};

/* ---------- helpers ---------- */

function str(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function icon(value: unknown, fallback: string): string {
  const v = str(value, 40);
  return (WEBSITE_ICON_KEYS as readonly string[]).includes(v) ? v : fallback;
}

/** Relative site path, https URL, tel:, mailto: — never javascript: or protocol-relative. */
export function safeHref(value: unknown): string {
  const v = str(value, 500);
  if (!v) return '';
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (/^https:\/\/[^\s]+$/i.test(v) || /^(tel|mailto):[^\s]+$/i.test(v)) return v;
  return '';
}

/** Images must come from our uploads, the website's own static files, or the Vercel Blob store. */
export function safeImageUrl(value: unknown): string {
  const v = str(value, 600);
  if (!v) return '';
  if (/^\/(uploads|frontend|pests|images)\/[\w./%-]+$/i.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com')) return v;
  } catch {
    // not a URL
  }
  return '';
}

function image(value: unknown): IWebsiteImage {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return { url: safeImageUrl(v.url), alt: str(v.alt, 200) };
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Keep known keys in the saved order, drop unknown/duplicate ones, append keys added in code later. */
export function normalizeSections(saved: unknown, registry: readonly string[]): IWebsiteSection[] {
  const seen = new Set<string>();
  const out: IWebsiteSection[] = [];
  for (const raw of arr(saved)) {
    const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const key = str(s.key, 40);
    if (!registry.includes(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(section(key, s.visible !== false, s.limit));
  }
  for (const key of registry) {
    if (!seen.has(key)) out.push(section(key, true, undefined));
  }
  return out;
}

function section(key: string, visible: boolean, limit: unknown): IWebsiteSection {
  const base = DEFAULT_LIMITS[key];
  if (base === undefined) return { key, visible };
  const n = typeof limit === 'number' && Number.isFinite(limit) ? Math.round(limit) : base;
  return { key, visible, limit: Math.min(MAX_LIMIT, Math.max(1, n)) };
}

/* ---------- defaults (seeded from the admin's current website text) ---------- */

/** Starter text for the website lists (these used to be fixed copy keys; kept here to seed new databases). */
const STARTER_COPY: Record<string, string> = {
  webAboutPoints: 'Certified & trained experts, Eco-safe treatments, Guaranteed results, Odour-free solutions, 24/7 support',
  webScience1Text: 'Identify the pest species and infestation level.',
  webScience1Title: 'Pest analysis',
  webScience2Text: 'Select the most effective product based on research.',
  webScience2Title: 'Chemical research',
  webScience3Text: 'Determine a safe and effective dosage for your space.',
  webScience3Title: 'Dosage calculation',
  webScience4Text: 'Apply the treatment following strict safety standards.',
  webScience4Title: 'Safe application',
  webSectorsList: 'Hospitals & clinics, Hotels & hospitality, Housing societies, IT & corporate offices, Pharmaceutical, Retail & malls, Education, Warehouses & supply chains',
  webSeoDescription: 'Book safe, eco-friendly pest control, termite, bed bug, mosquito and deep cleaning services from certified Mr Antidot experts. Upfront prices, verified technicians and guaranteed results.',
  webSeoTitle: 'Mr Antidot — Pest Control & Hygiene Management',
  webSocialFacebook: 'https://www.facebook.com/profile.php?id=61586995831762',
  webSocialInstagram: 'https://www.instagram.com/mr_antidot_india',
  webSocialLinkedin: '',
  webSocialYoutube: '',
  webStat1Label: 'Years of industry experience',
  webStat1Value: '8+',
  webStat2Label: 'Pest control success rate',
  webStat2Value: '95%',
  webStat3Label: 'Support & emergency visits',
  webStat3Value: '24/7',
  webStat4Label: 'Satisfaction guarantee',
  webStat4Value: '100%',
  webStep1Text: 'We analyse pest activity and hygiene conditions.',
  webStep1Title: 'Inspection & assessment',
  webStep2Text: 'We design solutions based on your specific problem.',
  webStep2Title: 'Customised treatment plan',
  webStep3Text: 'Our trained technicians apply safe and effective treatments.',
  webStep3Title: 'Professional treatment',
  webStep4Text: 'We recommend follow-up visits to stop pests coming back.',
  webStep4Title: 'Prevention & maintenance',
  webWhy1Text: 'Background-checked technicians trained in safe chemical handling and dosage.',
  webWhy1Title: 'Certified & trained experts',
  webWhy2Text: 'Government-approved, eco-safe products with clear precautions for children, pets and food areas.',
  webWhy2Title: 'Safe for families & pets',
  webWhy3Text: 'Comfortable treatments without unpleasant chemical smells.',
  webWhy3Title: 'Odour-free treatments',
  webWhy4Text: 'Long-lasting protection, with follow-up visits whenever you need them.',
  webWhy4Title: 'Guaranteed results',
};

async function currentCopy(): Promise<Record<string, string>> {
  const doc = await AppContent.findOne({ key: 'app' }).lean();
  const saved = (doc?.appConfig?.customerUi ?? {}) as Record<string, unknown>;
  const copy: Record<string, string> = { ...STARTER_COPY, ...(DEFAULT_CUSTOMER_UI_COPY as unknown as Record<string, string>) };
  for (const [k, v] of Object.entries(saved)) if (typeof v === 'string' && v.trim()) copy[k] = v;
  return copy;
}

function splitList(text: string | undefined): string[] {
  return (text ?? '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

const WHY_ICONS = ['badge', 'leaf', 'wind', 'shield'];
const STEP_ICONS = ['microscope', 'clipboard', 'spray', 'repeat'];
const SECTOR_ICONS = ['heart', 'hotel', 'users', 'building', 'pill', 'shopping', 'school', 'warehouse'];

export function websiteDefaults(copy: Record<string, string>): Omit<IWebsiteContent, 'key' | 'createdAt' | 'updatedAt'> {
  const n = [1, 2, 3, 4];
  return {
    pages: { home: normalizeSections([], HOME_SECTIONS), about: normalizeSections([], ABOUT_SECTIONS) },
    images: {
      hero: { url: '/frontend/images/about-us-image-1-prime.jpg', alt: 'Mr Antidot technician spraying a garden' },
      about: { url: '/frontend/images/about-us-image-1.jpg', alt: 'Mr Antidot pest control treatment' },
      why: [
        { url: '/frontend/images/why-choose-us-img-1-prime.png', alt: 'Technician treating a home' },
        { url: '/frontend/images/why-choose-us-img-2-prime.png', alt: 'Technician treating a restaurant' },
      ],
      og: { url: '/frontend/logo.png', alt: 'Mr Antidot' },
      pageHeader: { url: '', alt: '' },
    },
    lists: {
      stats: n.map((i) => ({ value: copy[`webStat${i}Value`] ?? '', label: copy[`webStat${i}Label`] ?? '' })).filter((s) => s.value),
      why: n
        .map((i) => ({ title: copy[`webWhy${i}Title`] ?? '', text: copy[`webWhy${i}Text`] ?? '', icon: WHY_ICONS[i - 1] }))
        .filter((s) => s.title),
      steps: n
        .map((i) => ({ title: copy[`webStep${i}Title`] ?? '', text: copy[`webStep${i}Text`] ?? '', icon: STEP_ICONS[i - 1] }))
        .filter((s) => s.title),
      sectors: splitList(copy.webSectorsList).map((name, i) => ({ name, icon: SECTOR_ICONS[i % SECTOR_ICONS.length] })),
      science: n.map((i) => ({ title: copy[`webScience${i}Title`] ?? '', text: copy[`webScience${i}Text`] ?? '' })).filter((s) => s.title),
      aboutPoints: splitList(copy.webAboutPoints),
      heroChips: [],
    },
    social: {
      facebook: copy.webSocialFacebook ?? '',
      instagram: copy.webSocialInstagram ?? '',
      youtube: copy.webSocialYoutube ?? '',
      linkedin: copy.webSocialLinkedin ?? '',
      x: '',
    },
    seo: { home: { title: copy.webSeoTitle ?? '', description: copy.webSeoDescription ?? '' } },
    announcement: { mode: 'offer', text: '', link: '' },
  };
}

export async function getOrCreateWebsite() {
  let doc = await WebsiteContent.findOne({ key: 'website' });
  if (!doc) {
    const defaults = websiteDefaults(await currentCopy());
    try {
      doc = await WebsiteContent.create({ key: 'website', ...defaults });
    } catch {
      // Created by a parallel request.
      doc = await WebsiteContent.findOne({ key: 'website' });
    }
  }
  if (!doc) throw new AppError(500, 'Website content unavailable');
  return doc;
}

export function formatWebsite(doc: Awaited<ReturnType<typeof getOrCreateWebsite>>): WebsiteView {
  const o = doc.toObject() as IWebsiteContent;
  const seoMap = doc.seo instanceof Map ? Object.fromEntries(doc.seo) : (o.seo as Record<string, { title: string; description: string }>) ?? {};
  const seo: WebsiteView['seo'] = {};
  for (const page of SEO_PAGES) {
    const s = seoMap[page] as { title?: string; description?: string } | undefined;
    seo[page] = { title: s?.title ?? '', description: s?.description ?? '' };
  }
  return {
    pages: { home: normalizeSections(o.pages?.home, HOME_SECTIONS), about: normalizeSections(o.pages?.about, ABOUT_SECTIONS) },
    images: {
      hero: image(o.images?.hero),
      about: image(o.images?.about),
      why: arr(o.images?.why).map(image).slice(0, LIST_CAPS.whyImages),
      og: image(o.images?.og),
      pageHeader: image(o.images?.pageHeader),
    },
    lists: {
      stats: arr(o.lists?.stats) as WebsiteView['lists']['stats'],
      why: arr(o.lists?.why) as WebsiteView['lists']['why'],
      steps: arr(o.lists?.steps) as WebsiteView['lists']['steps'],
      sectors: arr(o.lists?.sectors) as WebsiteView['lists']['sectors'],
      science: arr(o.lists?.science) as WebsiteView['lists']['science'],
      aboutPoints: arr(o.lists?.aboutPoints) as string[],
      heroChips: arr(o.lists?.heroChips) as string[],
    },
    social: {
      facebook: o.social?.facebook ?? '',
      instagram: o.social?.instagram ?? '',
      youtube: o.social?.youtube ?? '',
      linkedin: o.social?.linkedin ?? '',
      x: o.social?.x ?? '',
    },
    seo,
    announcement: {
      mode: o.announcement?.mode ?? 'offer',
      text: o.announcement?.text ?? '',
      link: o.announcement?.link ?? '',
    },
    updatedAt: (o.updatedAt ?? new Date()).toISOString(),
  };
}

/**
 * Applies an admin PATCH. Every group that is present replaces the saved one as a whole (so lists
 * can be emptied); groups that are absent stay as they are.
 */
export function applyWebsitePatch(doc: Awaited<ReturnType<typeof getOrCreateWebsite>>, body: Record<string, unknown>): void {
  const pages = body.pages as Record<string, unknown> | undefined;
  if (pages && typeof pages === 'object') {
    if ('home' in pages) doc.set('pages.home', normalizeSections(pages.home, HOME_SECTIONS));
    if ('about' in pages) doc.set('pages.about', normalizeSections(pages.about, ABOUT_SECTIONS));
  }

  const images = body.images as Record<string, unknown> | undefined;
  if (images && typeof images === 'object') {
    for (const k of ['hero', 'about', 'og', 'pageHeader'] as const) if (k in images) doc.set(`images.${k}`, image(images[k]));
    if ('why' in images) doc.set('images.why', arr(images.why).map(image).filter((i) => i.url).slice(0, LIST_CAPS.whyImages));
  }

  const lists = body.lists as Record<string, unknown> | undefined;
  if (lists && typeof lists === 'object') {
    if ('stats' in lists)
      doc.set('lists.stats', arr(lists.stats).map((x) => rec(x)).map((x) => ({ value: str(x.value, 20), label: str(x.label, 80) })).filter((x) => x.value || x.label).slice(0, LIST_CAPS.stats));
    if ('why' in lists)
      doc.set('lists.why', arr(lists.why).map((x) => rec(x)).map((x, i) => ({ title: str(x.title, 80), text: str(x.text, 300), icon: icon(x.icon, WHY_ICONS[i % 4]) })).filter((x) => x.title).slice(0, LIST_CAPS.why));
    if ('steps' in lists)
      doc.set('lists.steps', arr(lists.steps).map((x) => rec(x)).map((x, i) => ({ title: str(x.title, 80), text: str(x.text, 300), icon: icon(x.icon, STEP_ICONS[i % 4]) })).filter((x) => x.title).slice(0, LIST_CAPS.steps));
    if ('sectors' in lists)
      doc.set('lists.sectors', arr(lists.sectors).map((x) => rec(x)).map((x, i) => ({ name: str(x.name, 80), icon: icon(x.icon, SECTOR_ICONS[i % SECTOR_ICONS.length]) })).filter((x) => x.name).slice(0, LIST_CAPS.sectors));
    if ('science' in lists)
      doc.set('lists.science', arr(lists.science).map((x) => rec(x)).map((x) => ({ title: str(x.title, 80), text: str(x.text, 300) })).filter((x) => x.title).slice(0, LIST_CAPS.science));
    if ('aboutPoints' in lists) doc.set('lists.aboutPoints', arr(lists.aboutPoints).map((x) => str(x, 80)).filter(Boolean).slice(0, LIST_CAPS.aboutPoints));
    if ('heroChips' in lists) doc.set('lists.heroChips', arr(lists.heroChips).map((x) => str(x, 40)).filter((x) => /^[a-f0-9]{24}$/i.test(x)).slice(0, LIST_CAPS.heroChips));
  }

  const social = body.social as Record<string, unknown> | undefined;
  if (social && typeof social === 'object') {
    for (const k of ['facebook', 'instagram', 'youtube', 'linkedin', 'x'] as const) {
      if (k in social) {
        const href = safeHref(social[k]);
        doc.set(`social.${k}`, href.startsWith('https://') ? href : '');
      }
    }
  }

  const seo = body.seo as Record<string, unknown> | undefined;
  if (seo && typeof seo === 'object') {
    for (const page of SEO_PAGES) {
      if (!(page in seo)) continue;
      const s = rec(seo[page]);
      doc.set(`seo.${page}`, { title: str(s.title, 70), description: str(s.description, 200) });
    }
  }

  const ann = body.announcement as Record<string, unknown> | undefined;
  if (ann && typeof ann === 'object') {
    const mode = ann.mode === 'custom' || ann.mode === 'off' ? ann.mode : 'offer';
    doc.set('announcement', { mode, text: str(ann.text, 160), link: safeHref(ann.link) });
  }
}

function rec(x: unknown): Record<string, unknown> {
  return x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
}
