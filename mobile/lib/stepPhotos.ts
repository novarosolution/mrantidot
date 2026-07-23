import type { BookingStep } from '@/types/api';

export const MAX_STEP_PHOTOS = 6;

/** All progress photos for a step (supports legacy single photoUrl). */
export function stepPhotoUrls(step: Pick<BookingStep, 'photoUrl' | 'photoUrls'>): string[] {
  const urls: string[] = [];
  const push = (u?: string | null) => {
    if (!u || urls.includes(u)) return;
    urls.push(u);
  };
  if (Array.isArray(step.photoUrls)) {
    for (const u of step.photoUrls) push(u);
  }
  push(step.photoUrl);
  return urls.slice(0, MAX_STEP_PHOTOS);
}
