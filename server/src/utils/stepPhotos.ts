import type { IBookingStep } from '../models/Booking';

export const MAX_STEP_PHOTOS = 6;

/** Normalize step photos — supports legacy single photoUrl + photoUrls[]. */
export function normalizeStepPhotoUrls(step: {
  photoUrl?: string | null;
  photoUrls?: string[] | null;
}): string[] {
  const urls: string[] = [];
  const push = (u: unknown) => {
    if (typeof u !== 'string') return;
    const trimmed = u.trim();
    if (!trimmed || urls.includes(trimmed)) return;
    urls.push(trimmed);
  };
  if (Array.isArray(step.photoUrls)) {
    for (const u of step.photoUrls) push(u);
  }
  push(step.photoUrl);
  return urls.slice(0, MAX_STEP_PHOTOS);
}

export function applyStepPhotos(step: IBookingStep, photoUrls: string[]): void {
  const urls = normalizeStepPhotoUrls({ photoUrls });
  step.photoUrls = urls;
  step.photoUrl = urls[0];
}
