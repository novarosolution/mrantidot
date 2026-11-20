import { body } from 'express-validator';
import type { IServiceOption } from '../models/Service';
import { safeImageUrl } from './websiteContent';

const LIST_FIELDS = ['highlights', 'included', 'excluded', 'notes'] as const;
const MAX_LIST = 20;
const MAX_LINE = 200;
const MAX_OPTIONS = 12;

/** express-validator rules for the admin-editable detail content (shared by create + update). */
export const serviceContentRules = [
  body('optionsTitle').optional().isString().isLength({ max: 60 }),
  body('options').optional().isArray({ max: MAX_OPTIONS }),
  body('options.*.label').optional().isString().trim().notEmpty().isLength({ max: 40 }),
  body('options.*.price').optional().isFloat({ min: 0, max: 1_000_000 }),
  body('options.*.note').optional().isString().isLength({ max: 80 }),
  body('durationMins').optional().isInt({ min: 0, max: 1440 }),
  ...LIST_FIELDS.flatMap((f) => [
    body(f).optional().isArray({ max: MAX_LIST }),
    body(`${f}.*`).optional().isString().isLength({ max: MAX_LINE }),
  ]),
];

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST);
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'option';
}

/** Trim the option list, drop blank rows and give every option a stable, unique key. */
export function cleanOptions(value: unknown): IServiceOption[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  const out: IServiceOption[] = [];
  for (const raw of value.slice(0, MAX_OPTIONS)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const label = typeof r.label === 'string' ? r.label.trim() : '';
    const price = Number(r.price);
    if (!label || !Number.isFinite(price) || price < 0) continue;
    let key = typeof r.key === 'string' && r.key.trim() ? r.key.trim().slice(0, 40) : slug(label);
    while (used.has(key)) key = `${key}-${used.size + 1}`;
    used.add(key);
    const note = typeof r.note === 'string' && r.note.trim() ? r.note.trim() : undefined;
    out.push({ key, label, price: Math.round(price), ...(note ? { note } : {}) });
  }
  return out;
}

/** Copy only the content fields the request actually sent, already cleaned. */
export function pickServiceContent(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.optionsTitle !== undefined) {
    out.optionsTitle = String(input.optionsTitle ?? '').trim() || 'Size of home';
  }
  if (input.options !== undefined) out.options = cleanOptions(input.options);
  if (input.durationMins !== undefined) out.durationMins = Math.max(0, Math.round(Number(input.durationMins) || 0));
  for (const f of LIST_FIELDS) {
    if (input[f] !== undefined) out[f] = cleanList(input[f]);
  }
  if (input.coverImage !== undefined) {
    const c = (input.coverImage && typeof input.coverImage === 'object' ? input.coverImage : {}) as Record<string, unknown>;
    out.coverImage = {
      url: safeImageUrl(c.url),
      alt: typeof c.alt === 'string' ? c.alt.trim().slice(0, 200) : '',
    };
  }
  return out;
}
