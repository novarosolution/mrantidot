/**
 * One-time import of the old website's own database (blog, gallery, team, testimonials, contact
 * messages, subscribers) into the API database, so everything is managed from the app admin.
 *
 *   WEB_MONGODB_URI=<old website db>  npm run import:website              # dry run: prints what would change
 *   WEB_MONGODB_URI=<old website db>  npm run import:website -- --apply   # writes
 *   ... --apply --upload-images   # also copies the site's bundled /frontend photos to Vercel Blob (needs BLOB_READ_WRITE_TOKEN)
 *
 * Without WEB_MONGODB_URI (or when a collection there is empty) it seeds from the bundled defaults
 * in mranti/lib. Safe to run again: items are matched by legacyId, so nothing is duplicated.
 * Old users, bookings and offers are not imported (customers and bookings already live in the API).
 */
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import mongoose, { type Model } from 'mongoose';
import TurndownService from 'turndown';
import { put } from '@vercel/blob';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { BlogPost, ContactMessage, GalleryItem, Subscriber, TeamMember, Testimonial } from '../models/Website';

const APPLY = process.argv.includes('--apply');
/** Whether this run writes (set per call so the server can seed local dev data at startup). */
let writing = APPLY;
const UPLOAD = process.argv.includes('--upload-images');
const MRANTI = path.resolve(__dirname, '../../../mranti');

type Row = Record<string, unknown>;
type Report = { created: number; updated: number; skipped: string[] };

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });

function s(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function toMarkdown(html: unknown): string {
  const h = s(html);
  if (!h) return '';
  if (!/<[a-z][\s\S]*>/i.test(h)) return h;
  return turndown.turndown(h).replace(/\n{3,}/g, '\n\n').trim();
}

function date(v: unknown): Date | undefined {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/* ---------- images: keep https (Blob) URLs, optionally move bundled /frontend files to Blob ---------- */

const uploaded = new Map<string, string>();
let sharp: ((input: Buffer) => { rotate(): { resize(o: object): { webp(o: object): { toBuffer(): Promise<Buffer> } } } }) | null = null;

async function imageUrl(raw: unknown): Promise<string> {
  const url = s(raw);
  if (!url) return '';
  if (/^https:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return '';
  if (!UPLOAD || !env.blobToken || !writing) return url;
  if (uploaded.has(url)) return uploaded.get(url)!;
  const file = path.join(MRANTI, 'public', url);
  try {
    const original = await fs.readFile(file);
    if (!sharp) sharp = createRequire(path.join(MRANTI, 'package.json'))('sharp');
    const body = await sharp!(original).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const name = path.basename(url).replace(/\.[a-z]+$/i, '');
    const blob = await put(`website/imported/${name}.webp`, body, {
      access: 'public',
      token: env.blobToken,
      contentType: 'image/webp',
      addRandomSuffix: true,
    });
    uploaded.set(url, blob.url);
    return blob.url;
  } catch (err) {
    console.warn(`  ! could not upload ${url}: ${err instanceof Error ? err.message : err}`);
    return url;
  }
}

/* ---------- sources ---------- */

async function readJson(file: string): Promise<Row[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(MRANTI, 'lib', file), 'utf8')) as Row[];
  } catch {
    return [];
  }
}

async function readGalleryDefaults(): Promise<Row[]> {
  try {
    const mod = (await import(pathToFileURL(path.join(MRANTI, 'lib', 'gallery-data.ts')).href)) as { galleryItems?: Row[] };
    return (mod.galleryItems ?? []).map((g, i) => ({ ...g, sequence: i + 1, status: 'active' }));
  } catch {
    return [];
  }
}

async function oldCollection(conn: mongoose.Connection | null, name: string): Promise<Row[]> {
  if (!conn?.db) return [];
  return (await conn.db.collection(name).find({}).toArray()) as unknown as Row[];
}

/* ---------- upsert ---------- */

async function upsert(
  model: Model<any>,
  legacyId: string,
  data: Row,
  report: Report,
  slug?: string,
): Promise<void> {
  const existing = await model.findOne({ legacyId }).select('_id').lean();
  if (!existing && slug) {
    const clash = await model.findOne({ slug }).select('_id legacyId').lean<{ legacyId?: string }>();
    if (clash) {
      report.skipped.push(`slug "${slug}" already used by another item (legacyId ${clash.legacyId ?? 'none'})`);
      return;
    }
  }
  if (existing) report.updated++;
  else report.created++;
  if (writing) await model.updateOne({ legacyId }, { $set: { ...data, legacyId } }, { upsert: true });
}

async function importAll(old: mongoose.Connection | null, options: { apply?: boolean } = {}): Promise<Record<string, Report>> {
  writing = options.apply ?? APPLY;
  const reports: Record<string, Report> = {};
  const fresh = (): Report => ({ created: 0, updated: 0, skipped: [] });

  // Blog
  reports.blog = fresh();
  let blogs = await oldCollection(old, 'blogs');
  const blogPrefix = blogs.length ? 'old' : 'default';
  if (!blogs.length) blogs = await readJson('default-blogs.json');
  for (const [i, b] of blogs.entries()) {
    const slug = s(b.slug).toLowerCase();
    if (!slug || !s(b.title)) continue;
    const published =
      date(b.created_time) ?? (typeof b.daysAgo === 'number' ? new Date(Date.now() - b.daysAgo * 86400000) : new Date(Date.now() - i * 86400000));
    await upsert(
      BlogPost,
      `${blogPrefix}:${b._id ? String(b._id) : slug}`,
      {
        title: s(b.title),
        slug,
        excerpt: s(b.excerpt),
        cover: { url: await imageUrl(b.image_path ?? b.thumbnail), alt: s(b.title) },
        body: toMarkdown(b.content),
        legacyHtml: s(b.content) || undefined,
        tags: Array.isArray(b.tags) ? (b.tags as unknown[]).map(s).filter(Boolean) : [],
        author: s(b.author),
        status: s(b.status) === 'draft' ? 'draft' : 'published',
        publishedAt: published,
        seo: { title: s(b.meta_title), description: s(b.meta_description) },
      },
      reports.blog,
      slug,
    );
  }

  // Gallery
  reports.gallery = fresh();
  let gallery = await oldCollection(old, 'galleries');
  const galleryPrefix = gallery.length ? 'old' : 'default';
  if (!gallery.length) gallery = await readGalleryDefaults();
  for (const [i, g] of gallery.entries()) {
    const src = s(g.src);
    if (!src) continue;
    await upsert(
      GalleryItem,
      `${galleryPrefix}:${g._id ? String(g._id) : src}`,
      {
        image: { url: await imageUrl(src), alt: s(g.alt) || s(g.title) },
        title: s(g.title),
        category: s(g.category),
        sortOrder: (Number(g.sequence) || i + 1) * 10,
        active: s(g.status) !== 'inactive',
      },
      reports.gallery,
    );
  }

  // Team
  reports.team = fresh();
  let team = await oldCollection(old, 'teams');
  const teamPrefix = team.length ? 'old' : 'default';
  if (!team.length) team = await readJson('default-team.json');
  for (const [i, m] of team.entries()) {
    const slug = s(m.slug).toLowerCase();
    if (!slug || !s(m.name)) continue;
    const https = (v: unknown) => (/^https:\/\//i.test(s(v)) ? s(v) : '');
    await upsert(
      TeamMember,
      `${teamPrefix}:${m._id ? String(m._id) : slug}`,
      {
        name: s(m.name),
        slug,
        role: s(m.designation),
        photo: { url: await imageUrl(m.profile_image), alt: s(m.name) },
        bio: toMarkdown(m.description),
        education: s(m.education),
        certifications: toMarkdown(m.certifications),
        responsibilities: Array.isArray(m.key_responsibilities) ? (m.key_responsibilities as unknown[]).map(s).filter(Boolean) : [],
        expertise: toMarkdown(m.skill_expertise),
        years: Number(m.experience_years) > 0 ? Number(m.experience_years) : undefined,
        email: s(m.email),
        phone: s(m.phone),
        socials: { facebook: https(m.facebook), instagram: https(m.instagram), linkedin: https(m.linkedin), x: https(m.twitter) },
        sortOrder: (Number(m.sequence) || i + 1) * 10,
        active: s(m.status) !== 'inactive',
      },
      reports.team,
      slug,
    );
  }

  // Testimonials
  reports.testimonials = fresh();
  let testimonials = await oldCollection(old, 'testimonials');
  const tPrefix = testimonials.length ? 'old' : 'default';
  if (!testimonials.length) testimonials = await readJson('default-testimonials.json');
  for (const [i, t] of testimonials.entries()) {
    const quote = s(t.quote).replace(/^["“”']+|["“”']+$/g, '');
    if (!s(t.name) || !quote) continue;
    await upsert(
      Testimonial,
      `${tPrefix}:${t._id ? String(t._id) : `${s(t.name)}-${i}`}`,
      {
        name: s(t.name),
        role: s(t.role),
        quote,
        rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
        photo: { url: await imageUrl(t.image), alt: s(t.name) },
        sortOrder: (Number(t.sequence) || i + 1) * 10,
        active: s(t.status) !== 'inactive',
      },
      reports.testimonials,
    );
  }

  // Contact messages + subscribers (only from the old database)
  reports.messages = fresh();
  for (const c of await oldCollection(old, 'contacts')) {
    if (!s(c.name) || !s(c.message)) continue;
    const status = ['new', 'read', 'replied'].includes(s(c.status)) ? s(c.status) : 'read';
    await upsert(
      ContactMessage,
      `old:${String(c._id)}`,
      {
        name: s(c.name),
        email: s(c.email).toLowerCase(),
        phone: s(c.phone) === '—' ? '' : s(c.phone),
        service: s(c.service),
        message: s(c.message),
        status,
        createdAt: date(c.created_time) ?? date(c.createdAt),
      },
      reports.messages,
    );
  }

  reports.subscribers = fresh();
  for (const sub of await oldCollection(old, 'subscribes')) {
    const email = s(sub.email).toLowerCase();
    if (!email) continue;
    const exists = await Subscriber.findOne({ email, legacyId: { $ne: `old:${String(sub._id)}` } }).select('_id').lean();
    if (exists) {
      reports.subscribers.skipped.push(`${email} already subscribed`);
      continue;
    }
    await upsert(Subscriber, `old:${String(sub._id)}`, { email, active: s(sub.status) !== 'inactive' }, reports.subscribers);
  }

  return reports;
}

async function main(): Promise<void> {
  console.log(`Website import — ${APPLY ? 'APPLY (writing)' : 'dry run (nothing is written; add --apply)'}`);
  await connectDb();
  const uri = process.env.WEB_MONGODB_URI?.trim();
  let old: mongoose.Connection | null = null;
  if (uri) {
    old = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    console.log('Connected to the old website database');
  } else {
    console.log('WEB_MONGODB_URI not set — using the bundled default content only');
  }
  try {
    const reports = await importAll(old);
    for (const [name, r] of Object.entries(reports)) {
      console.log(`${name.padEnd(13)} new ${r.created}, updated ${r.updated}, skipped ${r.skipped.length}`);
      for (const why of r.skipped) console.log(`  - ${why}`);
    }
    if (uploaded.size) console.log(`Uploaded ${uploaded.size} bundled photo(s) to Vercel Blob`);
  } finally {
    await old?.close();
    await disconnectDb();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/** Local development: fill empty website collections with the bundled defaults (never in production). */
export async function seedWebsiteDefaults(): Promise<void> {
  if (env.isProduction) return;
  const counts = await Promise.all([BlogPost, GalleryItem, TeamMember, Testimonial].map((m) => (m as Model<any>).estimatedDocumentCount()));
  if (counts.some((n) => n > 0)) return;
  const reports = await importAll(null, { apply: true });
  const total = Object.values(reports).reduce((n, r) => n + r.created, 0);
  if (total) console.log(`[website] Seeded ${total} default website item(s) for local development`);
}

export { importAll };
