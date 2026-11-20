import type { LucideIcon } from 'lucide-react-native';
import {
  BadgeCheck,
  Building2,
  Bug,
  ClipboardList,
  Clock,
  FlaskConical,
  Heart,
  Hotel,
  House,
  Leaf,
  Microscope,
  Pill,
  Repeat,
  School,
  Shield,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Star,
  Users,
  Warehouse,
  Wind,
} from 'lucide-react-native';
import type { WebsiteIconKey, WebsitePageKey, WebsiteSeoPage } from '@/types/api';

/** Plain-English names for the website's page blocks (admin screens are not CMS-managed). */
export const WEBSITE_SECTION_META: Record<WebsitePageKey, Record<string, { name: string; desc: string }>> = {
  home: {
    hero: { name: 'Hero banner', desc: 'Big headline, photo and booking buttons at the top' },
    offers: { name: 'Offers', desc: 'Live coupon codes from the Offers screen' },
    services: { name: 'Services', desc: 'Service cards from the catalog' },
    why: { name: 'Why choose us', desc: 'Reasons to trust you, with two photos' },
    process: { name: 'How it works', desc: 'Your step-by-step treatment process' },
    sectors: { name: 'Sectors we serve', desc: 'Hospitals, hotels, offices and more' },
    mission: { name: 'Our mission', desc: 'Short mission statement block' },
    reviews: { name: 'Customer reviews', desc: 'Recent 4★+ reviews and testimonials' },
    team: { name: 'Our team', desc: 'Team member cards' },
    blog: { name: 'Latest articles', desc: 'Newest published blog posts' },
    faq: { name: 'FAQ', desc: 'Questions from the Legal tab' },
    app: { name: 'Get the app', desc: 'App download promo' },
    cta: { name: 'Call to action', desc: 'Closing "Book now / Call us" strip' },
  },
  about: {
    intro: { name: 'Intro', desc: 'About headline, photo and highlights' },
    stats: { name: 'Numbers', desc: 'Years, success rate and other stats' },
    mission: { name: 'Our mission', desc: 'Mission and vision text' },
    science: { name: 'Our method', desc: 'The science steps behind each treatment' },
    why: { name: 'Why choose us', desc: 'Reasons to trust you' },
    team: { name: 'Our team', desc: 'Team member cards' },
    faq: { name: 'FAQ', desc: 'Questions from the Legal tab' },
    cta: { name: 'Call to action', desc: 'Closing "Book now / Call us" strip' },
  },
};

export function websiteSectionMeta(page: WebsitePageKey, key: string): { name: string; desc: string } {
  return WEBSITE_SECTION_META[page][key] ?? { name: key.charAt(0).toUpperCase() + key.slice(1), desc: 'Website block' };
}

/** Item-count range for list sections (offers, services, reviews, team, blog). */
export const WEBSITE_LIMIT_MIN = 1;
export const WEBSITE_LIMIT_MAX = 24;

/** Icon keys the website understands, each drawn with a lucide icon in the admin picker. */
export const WEBSITE_ICONS: Record<WebsiteIconKey, { icon: LucideIcon; label: string }> = {
  badge: { icon: BadgeCheck, label: 'Badge' },
  leaf: { icon: Leaf, label: 'Leaf' },
  wind: { icon: Wind, label: 'Wind' },
  shield: { icon: Shield, label: 'Shield' },
  microscope: { icon: Microscope, label: 'Microscope' },
  clipboard: { icon: ClipboardList, label: 'Clipboard' },
  spray: { icon: SprayCan, label: 'Spray' },
  repeat: { icon: Repeat, label: 'Repeat' },
  heart: { icon: Heart, label: 'Heart' },
  hotel: { icon: Hotel, label: 'Hotel' },
  users: { icon: Users, label: 'People' },
  building: { icon: Building2, label: 'Building' },
  pill: { icon: Pill, label: 'Pill' },
  shopping: { icon: ShoppingBag, label: 'Shopping' },
  school: { icon: School, label: 'School' },
  warehouse: { icon: Warehouse, label: 'Warehouse' },
  clock: { icon: Clock, label: 'Clock' },
  star: { icon: Star, label: 'Star' },
  sparkles: { icon: Sparkles, label: 'Sparkles' },
  home: { icon: House, label: 'Home' },
  bug: { icon: Bug, label: 'Bug' },
  flask: { icon: FlaskConical, label: 'Flask' },
};

export const WEBSITE_ICON_KEYS = Object.keys(WEBSITE_ICONS) as WebsiteIconKey[];

export function websiteIcon(key: string | undefined): LucideIcon {
  return (key && WEBSITE_ICONS[key as WebsiteIconKey]?.icon) || BadgeCheck;
}

export const WEBSITE_SEO_PAGES: { key: WebsiteSeoPage; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'services', label: 'Services' },
  { key: 'about', label: 'About' },
  { key: 'blog', label: 'Blog' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'team', label: 'Team' },
  { key: 'contact', label: 'Contact' },
];

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 200;

/** Same rules as the server's slugify — lower-case words joined by dashes. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Social / profile links must be https (the server drops anything else). */
export function isHttpsUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  return /^https:\/\/[^\s]+\.[^\s]+$/i.test(v);
}

/** Announcement link: a site path (`/offers`) or an https / tel: / mailto: link. */
export function isSafeLink(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.startsWith('/') && !v.startsWith('//')) return true;
  return /^https:\/\/[^\s]+$/i.test(v) || /^(tel|mailto):[^\s]+$/i.test(v);
}
