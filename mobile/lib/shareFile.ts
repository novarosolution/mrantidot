import { Platform, Share } from 'react-native';

export type ShareTextFileResult = 'downloaded' | 'shared';

/**
 * Hands a text export (CSV / JSON / plain report) to the user. Browsers download it as `filename`
 * via an `<a download>` link; iOS / Android open the system share sheet with the text as the message
 * (unchanged from the original `Share.share` behaviour, `title` defaults to the filename).
 */
export async function shareTextFile({
  filename,
  mimeType,
  content,
  title,
}: {
  filename: string;
  mimeType: string;
  content: string;
  /** Share-sheet title on native. */
  title?: string;
}): Promise<ShareTextFileResult> {
  if (Platform.OS !== 'web') {
    await Share.share({ title: title ?? filename, message: content });
    return 'shared';
  }

  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    throw new Error('Downloads are not supported in this browser');
  }
  const type = mimeType.includes('charset') ? mimeType : `${mimeType};charset=utf-8`;
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    // Give the browser a moment to start the download before the object URL goes away.
    setTimeout(() => URL.revokeObjectURL(href), 1500);
  }
  return 'downloaded';
}
