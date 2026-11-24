import { useEffect, useRef } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { appToast } from '@/lib/toast';

/**
 * Website deletes are soft (server: DELETE /website/admin/:kind/:id): the item leaves the site at once, the
 * toast offers "Undo" for a few seconds, and Recently deleted can bring it back for 30 days.
 */
export type WebsiteTrashKind = 'blog' | 'gallery' | 'team' | 'testimonials' | 'messages' | 'subscribers';

/** How long the "Deleted · Undo" toast stays up. */
export const UNDO_TOAST_MS = 8000;

/** Days a deleted item stays in Recently deleted (server: WEBSITE_TRASH_DAYS). */
export const WEBSITE_TRASH_DAYS = 30;

export const TRASH_KIND_LABELS: Record<WebsiteTrashKind, { one: string; many: string }> = {
  blog: { one: 'Blog post', many: 'Blog' },
  gallery: { one: 'Gallery photo', many: 'Gallery' },
  team: { one: 'Team member', many: 'Team' },
  testimonials: { one: 'Testimonial', many: 'Testimonials' },
  messages: { one: 'Message', many: 'Messages' },
  subscribers: { one: 'Subscriber', many: 'Subscribers' },
};

const TOAST_TEXT: Record<WebsiteTrashKind, { deleted: string; restored: string }> = {
  blog: { deleted: 'Post deleted', restored: 'Post restored' },
  gallery: { deleted: 'Photo deleted', restored: 'Photo restored' },
  team: { deleted: 'Team member deleted', restored: 'Team member restored' },
  testimonials: { deleted: 'Testimonial deleted', restored: 'Testimonial restored' },
  messages: { deleted: 'Message deleted', restored: 'Message restored' },
  subscribers: { deleted: 'Subscriber deleted', restored: 'Subscriber restored' },
};

/** One row of `GET /website/admin/trash`. */
export interface WebsiteTrashItem {
  kind: WebsiteTrashKind;
  id: string;
  title: string;
  subtitle?: string;
  photoUrl?: string;
  /** ISO times. */
  deletedAt: string;
  purgeAt: string;
  deletedBy?: string;
}

type Listener = (kind: WebsiteTrashKind, id: string) => void;
const restoredListeners = new Set<Listener>();

/** Lists reload when one of their items comes back (Undo pressed after leaving the editor, Recently deleted…). */
export function useWebsiteItemRestored(kinds: WebsiteTrashKind | WebsiteTrashKind[], onRestored: (id: string) => void): void {
  const ref = useRef(onRestored);
  ref.current = onRestored;
  const key = Array.isArray(kinds) ? kinds.join(',') : kinds;
  useEffect(() => {
    const wanted = new Set(key.split(','));
    const listener: Listener = (kind, id) => {
      if (wanted.has(kind)) ref.current(id);
    };
    restoredListeners.add(listener);
    return () => {
      restoredListeners.delete(listener);
    };
  }, [key]);
}

/** Restore from the toast or Recently deleted. Resolves true when it is back. */
export async function restoreWebsiteItem(kind: WebsiteTrashKind, id: string, opts: { quiet?: boolean } = {}): Promise<boolean> {
  try {
    await api.post(`/website/admin/${kind}/${id}/restore`, undefined, { skipErrorToast: true });
    haptic('success');
    if (!opts.quiet) appToast.success(TOAST_TEXT[kind].restored);
    restoredListeners.forEach((listener) => listener(kind, id));
    return true;
  } catch (err) {
    haptic('error');
    appToast.error(getApiErrorMessage(err, 'Could not restore it'));
    return false;
  }
}

/**
 * Deletes one website item and shows "… deleted · Undo" for ~8 s. Resolves true when deleted (the caller
 * removes it from its list / leaves the editor); on failure an error toast is shown and it resolves false.
 */
export async function deleteWebsiteItem(kind: WebsiteTrashKind, id: string, fallbackError = 'Could not delete it'): Promise<boolean> {
  try {
    await api.delete(`/website/admin/${kind}/${id}`, { skipErrorToast: true });
    haptic('success');
    appToast({
      type: 'success',
      title: TOAST_TEXT[kind].deleted,
      message: `Kept in Recently deleted for ${WEBSITE_TRASH_DAYS} days.`,
      actionLabel: 'Undo',
      onAction: () => void restoreWebsiteItem(kind, id),
      duration: UNDO_TOAST_MS,
    });
    return true;
  } catch (err) {
    haptic('error');
    appToast.error(getApiErrorMessage(err, fallbackError));
    return false;
  }
}
