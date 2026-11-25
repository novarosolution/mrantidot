import { Platform } from 'react-native';

/**
 * Keyboard helpers for the admin web (shortcuts, Escape handling). Inert on iOS / Android.
 */

/** The key went to a text field (input, textarea, select or contenteditable) — shortcuts stay quiet. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (Platform.OS !== 'web' || !target || typeof (target as HTMLElement).tagName !== 'string') return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return el.isContentEditable === true;
}

/** A dialog, sheet or the command palette is open (react-native-web modals carry aria-modal). */
export function webModalOpen(): boolean {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  return document.querySelector('[aria-modal="true"]') != null;
}

/** "⌘" on Apple keyboards, "Ctrl" elsewhere — for shortcut hints. */
export function modKeyLabel(): string {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'Ctrl';
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad/i.test(platform) ? '⌘' : 'Ctrl';
}

/**
 * Sets the browser's native tooltip (`title`) on a react-native-web element — for icon-only buttons.
 * Use as a ref callback: `ref={webTitle('Refresh')}`. No-op on native.
 */
export function webTitle(label: string | undefined) {
  return (node: unknown) => {
    if (Platform.OS !== 'web' || !node || !label) return;
    const el = node as { setAttribute?: (name: string, value: string) => void };
    el.setAttribute?.('title', label);
  };
}
