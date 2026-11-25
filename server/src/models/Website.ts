import mongoose, { Schema, Types } from 'mongoose';

/**
 * Public website (mranti/) content that is not plain text: section layout, photos, lists, SEO.
 * Text labels stay in AppContent.customerUi (`web*` keys). One document, key 'website'.
 */

export const WEBSITE_ICON_KEYS = [
  'badge', 'leaf', 'wind', 'shield', 'microscope', 'clipboard', 'spray', 'repeat', 'heart', 'hotel', 'users',
  'building', 'pill', 'shopping', 'school', 'warehouse', 'clock', 'star', 'sparkles', 'home', 'bug', 'flask',
] as const;
export type WebsiteIconKey = (typeof WEBSITE_ICON_KEYS)[number];

export interface IWebsiteImage {
  url: string;
  alt: string;
}

/** Pages that can have their own header photo (falls back to `images.pageHeader`). */
export const WEBSITE_PAGE_HEADER_KEYS = ['services', 'about', 'blog', 'gallery', 'team', 'contact'] as const;
export type WebsitePageHeaderKey = (typeof WEBSITE_PAGE_HEADER_KEYS)[number];

export interface IWebsiteClient {
  name: string;
  logo: string;
}

export interface IWebsiteSection {
  key: string;
  visible: boolean;
  limit?: number;
}

export interface IWebsiteContent {
  key: string;
  pages: { home: IWebsiteSection[]; about: IWebsiteSection[] };
  images: {
    hero: IWebsiteImage;
    about: IWebsiteImage;
    why: IWebsiteImage[];
    og: IWebsiteImage;
    pageHeader: IWebsiteImage;
    /** Full-screen hero slideshow. Undefined until first saved, so new defaults reach older documents. */
    heroSlides?: IWebsiteImage[];
    pageHeaders?: Partial<Record<WebsitePageHeaderKey, IWebsiteImage>>;
  };
  lists: {
    stats: Array<{ value: string; label: string }>;
    why: Array<{ title: string; text: string; icon: string }>;
    steps: Array<{ title: string; text: string; icon: string }>;
    sectors: Array<{ name: string; icon: string }>;
    science: Array<{ title: string; text: string }>;
    aboutPoints: string[];
    heroChips: string[];
    /** "Trusted by" client logos. Undefined until first saved. */
    clients?: IWebsiteClient[];
  };
  social: { facebook: string; instagram: string; youtube: string; linkedin: string; x: string };
  seo: Record<string, { title: string; description: string }>;
  announcement: { mode: 'offer' | 'custom' | 'off'; text: string; link: string };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IWebsiteImage>({ url: { type: String, default: '' }, alt: { type: String, default: '' } }, { _id: false });
const sectionSchema = new Schema<IWebsiteSection>(
  { key: { type: String, required: true }, visible: { type: Boolean, default: true }, limit: { type: Number } },
  { _id: false },
);
const seoSchema = new Schema({ title: { type: String, default: '' }, description: { type: String, default: '' } }, { _id: false });

const websiteContentSchema = new Schema<IWebsiteContent>(
  {
    key: { type: String, required: true, unique: true, default: 'website' },
    pages: {
      home: { type: [sectionSchema], default: [] },
      about: { type: [sectionSchema], default: [] },
    },
    images: {
      hero: { type: imageSchema, default: () => ({}) },
      about: { type: imageSchema, default: () => ({}) },
      why: { type: [imageSchema], default: [] },
      og: { type: imageSchema, default: () => ({}) },
      pageHeader: { type: imageSchema, default: () => ({}) },
      heroSlides: { type: [imageSchema], default: undefined },
      pageHeaders: {
        type: new Schema(
          Object.fromEntries(WEBSITE_PAGE_HEADER_KEYS.map((k) => [k, { type: imageSchema, default: () => ({}) }])),
          { _id: false },
        ),
        default: undefined,
      },
    },
    lists: {
      stats: { type: [new Schema({ value: String, label: String }, { _id: false })], default: [] },
      why: { type: [new Schema({ title: String, text: String, icon: String }, { _id: false })], default: [] },
      steps: { type: [new Schema({ title: String, text: String, icon: String }, { _id: false })], default: [] },
      sectors: { type: [new Schema({ name: String, icon: String }, { _id: false })], default: [] },
      science: { type: [new Schema({ title: String, text: String }, { _id: false })], default: [] },
      aboutPoints: { type: [String], default: [] },
      heroChips: { type: [String], default: [] },
      clients: { type: [new Schema({ name: String, logo: String }, { _id: false })], default: undefined },
    },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      x: { type: String, default: '' },
    },
    seo: { type: Map, of: seoSchema, default: () => new Map() },
    announcement: {
      mode: { type: String, enum: ['offer', 'custom', 'off'], default: 'offer' },
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'web_content' },
);

export const WebsiteContent = mongoose.model<IWebsiteContent>('WebsiteContent', websiteContentSchema);

/* ---------- Collections moved from the old website database ---------- */

const legacyId = { type: String, unique: true, sparse: true };
const toJSON = {
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.deletedAt;
    delete ret.deletedBy;
    return ret;
  },
};

/* ---------- Soft delete ("Undo" + Recently deleted in the admin) ---------- */

/** Days a deleted blog post / photo / team member / testimonial / message / subscriber can be restored. */
export const WEBSITE_TRASH_DAYS = 30;
const TRASH_TTL_SECONDS = WEBSITE_TRASH_DAYS * 24 * 60 * 60;

export interface ISoftDeletable {
  /** Set when an admin deletes the item: hidden everywhere until restored, removed for good after 30 days. */
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

/**
 * Query option that also returns deleted items: `Model.findOne(filter).setOptions(WITH_DELETED)`.
 * A filter that names `deletedAt` itself (e.g. `{ deletedAt: { $ne: null } }` for the trash) needs no option.
 */
export const WITH_DELETED = { withDeleted: true } as const;

/**
 * Adds `deletedAt` / `deletedBy`, hides deleted items from every find / findOne / count / findOneAndUpdate
 * (admin lists, the public website API, search, data export…) and lets MongoDB's TTL monitor purge them
 * 30 days after deletion. Plain updateOne / deleteMany are left alone (reorder, newsletter re-subscribe).
 */
function softDeletable<T>(schema: Schema<T>): Schema<T> {
  (schema as unknown as Schema<ISoftDeletable>).add({ deletedAt: { type: Date }, deletedBy: { type: Schema.Types.ObjectId, ref: 'User' } });
  schema.index({ deletedAt: 1 }, { expireAfterSeconds: TRASH_TTL_SECONDS });
  schema.pre(['find', 'findOne', 'countDocuments', 'findOneAndUpdate', 'distinct'], function hideDeleted() {
    if (this.getOptions().withDeleted === true) return;
    if (Object.prototype.hasOwnProperty.call(this.getFilter(), 'deletedAt')) return;
    this.where({ deletedAt: null });
  });
  return schema;
}

export interface IBlogPost extends ISoftDeletable {
  title: string;
  slug: string;
  excerpt: string;
  cover: IWebsiteImage;
  body: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  seo: { title: string; description: string };
  legacyId?: string;
  legacyHtml?: string;
}

export const BlogPost = mongoose.model<IBlogPost>(
  'WebBlogPost',
  softDeletable(new Schema<IBlogPost>(
    {
      title: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
      excerpt: { type: String, default: '', trim: true },
      cover: { type: imageSchema, default: () => ({}) },
      body: { type: String, default: '' },
      tags: { type: [String], default: [] },
      author: { type: String, default: '', trim: true },
      status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
      publishedAt: { type: Date, index: true },
      seo: { type: seoSchema, default: () => ({}) },
      legacyId,
      legacyHtml: { type: String },
    },
    { timestamps: true, collection: 'web_blog_posts', toJSON },
  )),
);

export interface IGalleryItem extends ISoftDeletable {
  image: IWebsiteImage;
  title: string;
  category: string;
  sortOrder: number;
  active: boolean;
  legacyId?: string;
}

export const GalleryItem = mongoose.model<IGalleryItem>(
  'WebGalleryItem',
  softDeletable(new Schema<IGalleryItem>(
    {
      image: { type: imageSchema, required: true },
      title: { type: String, default: '', trim: true },
      category: { type: String, default: '', trim: true },
      sortOrder: { type: Number, default: 1000, index: true },
      active: { type: Boolean, default: true },
      legacyId,
    },
    { timestamps: true, collection: 'web_gallery', toJSON },
  )),
);

export interface ITeamMember extends ISoftDeletable {
  name: string;
  slug: string;
  role: string;
  photo: IWebsiteImage;
  bio: string;
  education: string;
  certifications: string;
  responsibilities: string[];
  expertise: string;
  years?: number;
  email: string;
  phone: string;
  socials: { facebook: string; instagram: string; linkedin: string; x: string };
  sortOrder: number;
  active: boolean;
  legacyId?: string;
}

export const TeamMember = mongoose.model<ITeamMember>(
  'WebTeamMember',
  softDeletable(new Schema<ITeamMember>(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
      role: { type: String, default: '', trim: true },
      photo: { type: imageSchema, default: () => ({}) },
      bio: { type: String, default: '' },
      education: { type: String, default: '' },
      certifications: { type: String, default: '' },
      responsibilities: { type: [String], default: [] },
      expertise: { type: String, default: '' },
      years: { type: Number },
      email: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      socials: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        x: { type: String, default: '' },
      },
      sortOrder: { type: Number, default: 1000, index: true },
      active: { type: Boolean, default: true },
      legacyId,
    },
    { timestamps: true, collection: 'web_team', toJSON },
  )),
);

export interface ITestimonial extends ISoftDeletable {
  name: string;
  role: string;
  quote: string;
  rating: number;
  photo: IWebsiteImage;
  sortOrder: number;
  active: boolean;
  legacyId?: string;
}

export const Testimonial = mongoose.model<ITestimonial>(
  'WebTestimonial',
  softDeletable(new Schema<ITestimonial>(
    {
      name: { type: String, required: true, trim: true },
      role: { type: String, default: '', trim: true },
      quote: { type: String, required: true, trim: true },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      photo: { type: imageSchema, default: () => ({}) },
      sortOrder: { type: Number, default: 1000, index: true },
      active: { type: Boolean, default: true },
      legacyId,
    },
    { timestamps: true, collection: 'web_testimonials', toJSON },
  )),
);

export interface IContactMessage extends ISoftDeletable {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  legacyId?: string;
  createdAt: Date;
}

export const ContactMessage = mongoose.model<IContactMessage>(
  'WebContactMessage',
  softDeletable(new Schema<IContactMessage>(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true },
      service: { type: String, default: '', trim: true },
      message: { type: String, required: true, trim: true },
      status: { type: String, enum: ['new', 'read', 'replied'], default: 'new', index: true },
      legacyId,
    },
    { timestamps: true, collection: 'web_contact_messages', toJSON },
  )),
);

export interface ISubscriber extends ISoftDeletable {
  email: string;
  active: boolean;
  legacyId?: string;
}

export const Subscriber = mongoose.model<ISubscriber>(
  'WebSubscriber',
  softDeletable(new Schema<ISubscriber>(
    {
      email: { type: String, required: true, unique: true, trim: true, lowercase: true },
      active: { type: Boolean, default: true },
      legacyId,
    },
    { timestamps: true, collection: 'web_subscribers', toJSON },
  )),
);
