import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { Model } from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { env } from '../config/env';
import {
  BlogPost,
  ContactMessage,
  GalleryItem,
  Subscriber,
  TeamMember,
  Testimonial,
  type IWebsiteImage,
} from '../models/Website';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { notifyAdmins } from '../utils/notifications';
import { rateLimitKey } from '../utils/rateLimitKey';
import { revalidateWebsite } from '../utils/websiteRevalidate';
import { safeHref, safeImageUrl, applyWebsitePatch, formatWebsite, getOrCreateWebsite } from '../utils/websiteContent';
import { storeWebsiteImage, websiteImageUpload } from '../utils/websiteMedia';

/**
 * Public website (mranti/) data: layout/photos/lists, blog, gallery, team, testimonials, reviews,
 * contact form and newsletter. Admin endpoints live under /website/admin.
 */
export const websiteRouter = Router();

/* ---------- small helpers ---------- */

function str(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function image(value: unknown): IWebsiteImage {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return { url: safeImageUrl(v.url), alt: str(v.alt, 200) };
}

function strList(value: unknown, maxItems = 20, maxLen = 200): string[] {
  return (Array.isArray(value) ? value : []).map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Markdown only: no embedded data: images or raw <script>. */
function markdownBody(value: unknown): string {
  const v = typeof value === 'string' ? value.slice(0, 100_000) : '';
  if (/data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(v)) throw new AppError(400, 'Add photos with the photo button, not pasted image data.');
  return v.replace(/<\/?script[^>]*>/gi, '');
}

function idParam(req: Request): string {
  const id = String(req.params.id ?? '');
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new AppError(400, 'Invalid id');
  return id;
}

async function uniqueSlug(model: Model<{ slug: string }>, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'item';
  let slug = root;
  for (let i = 2; i < 200; i++) {
    const clash = await model.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id').lean();
    if (!clash) return slug;
    slug = `${root}-${i}`;
  }
  throw new AppError(400, 'Could not create a unique link for this item');
}

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 8 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  message: { error: 'Too many messages. Please try again a little later or call us.' },
});

const adminOnly = [requireAuth, requireRole('admin')];

/* ---------- public: layout, photos, lists ---------- */

websiteRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ website: formatWebsite(await getOrCreateWebsite()) });
  }),
);

/* ---------- public: blog ---------- */

function blogSummary(p: InstanceType<typeof BlogPost>) {
  const j = p.toJSON() as Record<string, unknown>;
  delete j.body;
  delete j.legacyHtml;
  return j;
}

websiteRouter.get(
  '/blog',
  asyncHandler(async (req, res) => {
    const tag = str(req.query.tag, 60);
    const filter: Record<string, unknown> = { status: 'published' };
    if (tag) filter.tags = tag;
    const posts = await BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).limit(200);
    res.json({ posts: posts.map(blogSummary) });
  }),
);

websiteRouter.get(
  '/blog/:slug',
  asyncHandler(async (req, res) => {
    const post = await BlogPost.findOne({ slug: str(req.params.slug, 120).toLowerCase(), status: 'published' });
    if (!post) throw new AppError(404, 'Post not found');
    const j = post.toJSON() as Record<string, unknown>;
    delete j.legacyHtml;
    res.json({ post: j });
  }),
);

/* ---------- public: gallery, team, testimonials ---------- */

websiteRouter.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const items = await GalleryItem.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  }),
);

websiteRouter.get(
  '/team',
  asyncHandler(async (_req, res) => {
    const members = await TeamMember.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ members: members.map((m) => m.toJSON()) });
  }),
);

websiteRouter.get(
  '/team/:slug',
  asyncHandler(async (req, res) => {
    const member = await TeamMember.findOne({ slug: str(req.params.slug, 120).toLowerCase(), active: true });
    if (!member) throw new AppError(404, 'Team member not found');
    res.json({ member: member.toJSON() });
  }),
);

websiteRouter.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const items = await Testimonial.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ testimonials: items.map((t) => t.toJSON()) });
  }),
);

/** Recent good app reviews with a comment (first name only) and the total review count. */
websiteRouter.get(
  '/reviews',
  asyncHandler(async (_req, res) => {
    const [reviews, total] = await Promise.all([
      Review.find({ hidden: { $ne: true }, stars: { $gte: 4 }, comment: { $exists: true, $ne: '' } })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      Review.countDocuments({ hidden: { $ne: true } }),
    ]);
    const names = await User.find({ _id: { $in: reviews.map((r) => r.customerId) } }).select('name').lean();
    const first = new Map(names.map((u) => [String(u._id), (u.name ?? '').split(' ')[0] || 'Customer']));
    res.json({
      total,
      reviews: reviews.map((r) => ({
        id: String(r._id),
        stars: r.stars,
        comment: r.comment,
        customerName: first.get(String(r.customerId)) ?? 'Customer',
        createdAt: r.createdAt,
      })),
    });
  }),
);

/* ---------- public: contact form + newsletter ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

websiteRouter.post(
  '/contact',
  formLimiter,
  asyncHandler(async (req, res) => {
    // Honeypot: real people never fill the hidden "website" field.
    if (str(req.body?.website)) {
      res.status(201).json({ ok: true });
      return;
    }
    const name = str(req.body?.name, 80);
    const email = str(req.body?.email, 120).toLowerCase();
    const phone = str(req.body?.phone, 20);
    const message = str(req.body?.message, 2000);
    const service = str(req.body?.service, 120);
    if (!name) throw new AppError(400, 'Please enter your name');
    if (!EMAIL_RE.test(email) && phone.replace(/\D/g, '').length < 10) throw new AppError(400, 'Please enter a valid email or phone number');
    if (email && !EMAIL_RE.test(email)) throw new AppError(400, 'Please enter a valid email address');
    if (message.length < 10) throw new AppError(400, 'Please write a little more about what you need');
    const msg = await ContactMessage.create({ name, email, phone, service, message });
    try {
      await notifyAdmins(
        'New website message',
        `${name}${service ? ` · ${service}` : ''}: ${message.slice(0, 120)}`,
        'website_message',
      );
    } catch (err) {
      console.error('[website] notify admins failed', err);
    }
    res.status(201).json({ ok: true, id: String(msg._id) });
  }),
);

websiteRouter.post(
  '/subscribe',
  formLimiter,
  asyncHandler(async (req, res) => {
    if (str(req.body?.website)) {
      res.status(201).json({ ok: true });
      return;
    }
    const email = str(req.body?.email, 120).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new AppError(400, 'Please enter a valid email address');
    await Subscriber.updateOne({ email }, { $set: { active: true }, $setOnInsert: { email } }, { upsert: true });
    res.status(201).json({ ok: true });
  }),
);

/* ======================= admin ======================= */

const admin = Router();
websiteRouter.use('/admin', ...adminOnly, admin);

/** Layout, photos, lists, social, SEO, announcement. Send `updatedAt` to avoid overwriting a newer save. */
admin.patch(
  '/',
  asyncHandler(async (req, res) => {
    const doc = await getOrCreateWebsite();
    const sentAt = str(req.body?.updatedAt, 40);
    if (sentAt && doc.updatedAt && sentAt !== doc.updatedAt.toISOString()) {
      throw new AppError(409, 'Someone else saved the website meanwhile. Reload to see their changes, then save again.');
    }
    applyWebsitePatch(doc, (req.body ?? {}) as Record<string, unknown>);
    doc.set('updatedBy', req.user!.id);
    await doc.save();
    revalidateWebsite(['website']);
    res.json({ website: formatWebsite(doc) });
  }),
);

function handleMediaUpload(req: Request, res: Response, next: NextFunction): void {
  websiteImageUpload(req, res, (err: unknown) => {
    if (!err) return next();
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code === 'LIMIT_FILE_SIZE') return next(new AppError(400, 'Photo is too large. Max size is 8 MB.'));
    next(err instanceof AppError ? err : new AppError(400, err instanceof Error ? err.message : 'Upload failed'));
  });
}

admin.post(
  '/media',
  handleMediaUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'No photo received. Send multipart field "photo".');
    res.status(201).json(await storeWebsiteImage(req.file));
  }),
);

/** Small numbers for the admin hub (new messages badge etc.). */
admin.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [newMessages, posts, drafts, gallery, team, testimonials, subscribers] = await Promise.all([
      ContactMessage.countDocuments({ status: 'new' }),
      BlogPost.countDocuments({ status: 'published' }),
      BlogPost.countDocuments({ status: 'draft' }),
      GalleryItem.countDocuments({}),
      TeamMember.countDocuments({}),
      Testimonial.countDocuments({}),
      Subscriber.countDocuments({ active: true }),
    ]);
    res.json({ summary: { newMessages, posts, drafts, gallery, team, testimonials, subscribers } });
  }),
);

/* ---------- admin: blog ---------- */

function blogInput(body: Record<string, unknown>) {
  const status = body.status === 'published' ? 'published' : 'draft';
  return {
    title: str(body.title, 160),
    excerpt: str(body.excerpt, 300),
    cover: image(body.cover),
    body: markdownBody(body.body),
    tags: strList(body.tags, 8, 40),
    author: str(body.author, 80),
    status,
    seo: { title: str((body.seo as Record<string, unknown> | undefined)?.title, 70), description: str((body.seo as Record<string, unknown> | undefined)?.description, 200) },
  } as const;
}

admin.get(
  '/blog',
  asyncHandler(async (_req, res) => {
    const posts = await BlogPost.find({}).sort({ updatedAt: -1 }).limit(500);
    res.json({ posts: posts.map(blogSummary) });
  }),
);

admin.get(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const post = await BlogPost.findById(idParam(req));
    if (!post) throw new AppError(404, 'Post not found');
    res.json({ post: post.toJSON() });
  }),
);

admin.post(
  '/blog',
  asyncHandler(async (req, res) => {
    const input = blogInput(req.body ?? {});
    if (!input.title) throw new AppError(400, 'Title is required');
    const slug = await uniqueSlug(BlogPost as unknown as Model<{ slug: string }>, str(req.body?.slug, 120) || input.title);
    const post = await BlogPost.create({ ...input, slug, publishedAt: input.status === 'published' ? new Date() : undefined });
    revalidateWebsite(['blog']);
    res.status(201).json({ post: post.toJSON() });
  }),
);

admin.patch(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const post = await BlogPost.findById(idParam(req));
    if (!post) throw new AppError(404, 'Post not found');
    const input = blogInput({ ...post.toObject(), ...(req.body ?? {}) });
    if (!input.title) throw new AppError(400, 'Title is required');
    const wantedSlug = str(req.body?.slug, 120);
    if (wantedSlug && slugify(wantedSlug) !== post.slug) {
      post.slug = await uniqueSlug(BlogPost as unknown as Model<{ slug: string }>, wantedSlug, String(post._id));
    }
    post.set(input);
    if (input.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    await post.save();
    revalidateWebsite(['blog']);
    res.json({ post: post.toJSON() });
  }),
);

admin.delete(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    await BlogPost.deleteOne({ _id: idParam(req) });
    revalidateWebsite(['blog']);
    res.json({ ok: true });
  }),
);

/* ---------- admin: gallery, team, testimonials (same list pattern) ---------- */

type Ordered = { sortOrder: number };

function reorderRoute(path: string, model: Model<Ordered>, tag: string) {
  admin.put(
    `${path}/order`,
    asyncHandler(async (req, res) => {
      const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter((x: unknown) => typeof x === 'string' && /^[a-f0-9]{24}$/i.test(x));
      await Promise.all(ids.map((id: string, i: number) => model.updateOne({ _id: id }, { $set: { sortOrder: (i + 1) * 10 } })));
      revalidateWebsite([tag]);
      res.json({ ok: true });
    }),
  );
}

function galleryInput(body: Record<string, unknown>) {
  return { image: image(body.image), title: str(body.title, 120), category: str(body.category, 60), active: body.active !== false };
}

admin.get(
  '/gallery',
  asyncHandler(async (_req, res) => {
    const items = await GalleryItem.find({}).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  }),
);
admin.post(
  '/gallery',
  asyncHandler(async (req, res) => {
    const input = galleryInput(req.body ?? {});
    if (!input.image.url) throw new AppError(400, 'Add a photo');
    const first = await GalleryItem.findOne({}).sort({ sortOrder: 1 }).select('sortOrder').lean();
    const item = await GalleryItem.create({ ...input, sortOrder: (first?.sortOrder ?? 1000) - 10 });
    revalidateWebsite(['gallery']);
    res.status(201).json({ item: item.toJSON() });
  }),
);
admin.patch(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const item = await GalleryItem.findById(idParam(req));
    if (!item) throw new AppError(404, 'Photo not found');
    const input = galleryInput({ ...item.toObject(), ...(req.body ?? {}) });
    if (!input.image.url) throw new AppError(400, 'Add a photo');
    item.set(input);
    await item.save();
    revalidateWebsite(['gallery']);
    res.json({ item: item.toJSON() });
  }),
);
admin.delete(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    await GalleryItem.deleteOne({ _id: idParam(req) });
    revalidateWebsite(['gallery']);
    res.json({ ok: true });
  }),
);
reorderRoute('/gallery', GalleryItem as unknown as Model<Ordered>, 'gallery');

function teamInput(body: Record<string, unknown>) {
  const socials = (body.socials && typeof body.socials === 'object' ? body.socials : {}) as Record<string, unknown>;
  const https = (v: unknown) => {
    const h = safeHref(v);
    return h.startsWith('https://') ? h : '';
  };
  const years = Number(body.years);
  return {
    name: str(body.name, 80),
    role: str(body.role, 120),
    photo: image(body.photo),
    bio: str(body.bio, 4000),
    education: str(body.education, 500),
    certifications: str(body.certifications, 2000),
    responsibilities: strList(body.responsibilities, 12, 160),
    expertise: str(body.expertise, 1000),
    years: Number.isFinite(years) && years > 0 ? Math.min(80, Math.round(years)) : undefined,
    email: str(body.email, 120),
    phone: str(body.phone, 20),
    socials: { facebook: https(socials.facebook), instagram: https(socials.instagram), linkedin: https(socials.linkedin), x: https(socials.x) },
    active: body.active !== false,
  };
}

admin.get(
  '/team',
  asyncHandler(async (_req, res) => {
    const members = await TeamMember.find({}).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ members: members.map((m) => m.toJSON()) });
  }),
);
admin.post(
  '/team',
  asyncHandler(async (req, res) => {
    const input = teamInput(req.body ?? {});
    if (!input.name) throw new AppError(400, 'Name is required');
    const slug = await uniqueSlug(TeamMember as unknown as Model<{ slug: string }>, str(req.body?.slug, 120) || input.name);
    const member = await TeamMember.create({ ...input, slug });
    revalidateWebsite(['team']);
    res.status(201).json({ member: member.toJSON() });
  }),
);
admin.patch(
  '/team/:id',
  asyncHandler(async (req, res) => {
    const member = await TeamMember.findById(idParam(req));
    if (!member) throw new AppError(404, 'Team member not found');
    const input = teamInput({ ...member.toObject(), ...(req.body ?? {}) });
    if (!input.name) throw new AppError(400, 'Name is required');
    member.set(input);
    await member.save();
    revalidateWebsite(['team']);
    res.json({ member: member.toJSON() });
  }),
);
admin.delete(
  '/team/:id',
  asyncHandler(async (req, res) => {
    await TeamMember.deleteOne({ _id: idParam(req) });
    revalidateWebsite(['team']);
    res.json({ ok: true });
  }),
);
reorderRoute('/team', TeamMember as unknown as Model<Ordered>, 'team');

function testimonialInput(body: Record<string, unknown>) {
  const rating = Number(body.rating);
  return {
    name: str(body.name, 80),
    role: str(body.role, 120),
    quote: str(body.quote, 1000),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
    photo: image(body.photo),
    active: body.active !== false,
  };
}

admin.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const items = await Testimonial.find({}).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ testimonials: items.map((t) => t.toJSON()) });
  }),
);
admin.post(
  '/testimonials',
  asyncHandler(async (req, res) => {
    const input = testimonialInput(req.body ?? {});
    if (!input.name || !input.quote) throw new AppError(400, 'Name and quote are required');
    const item = await Testimonial.create(input);
    revalidateWebsite(['testimonials']);
    res.status(201).json({ testimonial: item.toJSON() });
  }),
);
admin.patch(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    const item = await Testimonial.findById(idParam(req));
    if (!item) throw new AppError(404, 'Testimonial not found');
    const input = testimonialInput({ ...item.toObject(), ...(req.body ?? {}) });
    if (!input.name || !input.quote) throw new AppError(400, 'Name and quote are required');
    item.set(input);
    await item.save();
    revalidateWebsite(['testimonials']);
    res.json({ testimonial: item.toJSON() });
  }),
);
admin.delete(
  '/testimonials/:id',
  asyncHandler(async (req, res) => {
    await Testimonial.deleteOne({ _id: idParam(req) });
    revalidateWebsite(['testimonials']);
    res.json({ ok: true });
  }),
);
reorderRoute('/testimonials', Testimonial as unknown as Model<Ordered>, 'testimonials');

/* ---------- admin: messages + subscribers ---------- */

admin.get(
  '/messages',
  asyncHandler(async (req, res) => {
    const status = str(req.query.status, 20);
    const filter = ['new', 'read', 'replied'].includes(status) ? { status } : {};
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ messages: messages.map((m) => m.toJSON()) });
  }),
);
admin.patch(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const status = str(req.body?.status, 20);
    if (!['new', 'read', 'replied'].includes(status)) throw new AppError(400, 'Invalid status');
    const msg = await ContactMessage.findByIdAndUpdate(idParam(req), { $set: { status } }, { new: true });
    if (!msg) throw new AppError(404, 'Message not found');
    res.json({ message: msg.toJSON() });
  }),
);
admin.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    await ContactMessage.deleteOne({ _id: idParam(req) });
    res.json({ ok: true });
  }),
);

admin.get(
  '/subscribers',
  asyncHandler(async (_req, res) => {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 }).limit(5000);
    res.json({ subscribers: subscribers.map((s) => s.toJSON()) });
  }),
);
admin.patch(
  '/subscribers/:id',
  asyncHandler(async (req, res) => {
    const sub = await Subscriber.findByIdAndUpdate(idParam(req), { $set: { active: req.body?.active !== false } }, { new: true });
    if (!sub) throw new AppError(404, 'Subscriber not found');
    res.json({ subscriber: sub.toJSON() });
  }),
);
admin.delete(
  '/subscribers/:id',
  asyncHandler(async (req, res) => {
    await Subscriber.deleteOne({ _id: idParam(req) });
    res.json({ ok: true });
  }),
);
