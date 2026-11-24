import { Linking } from 'react-native';
import { appToast } from '@/lib/toast';

/** Toast text when the phone / WhatsApp / mail app can't be opened — pass the admin copy from screens. */
export type ContactFailCopy = { contactOpenFailed: string; contactOpenFailedSub: string };

const FALLBACK: ContactFailCopy = {
  contactOpenFailed: 'Could not open link',
  contactOpenFailedSub: 'Please try again from your phone app',
};

function open(url: string, copy: ContactFailCopy = FALLBACK) {
  Linking.openURL(url).catch(() => appToast.error(copy.contactOpenFailed, copy.contactOpenFailedSub));
}

export function callPhone(phone: string, copy?: ContactFailCopy) {
  open(`tel:${phone.replace(/[^\d+]/g, '')}`, copy);
}

/** wa.me needs digits only with country code; bare 10-digit numbers are treated as Indian (+91). */
export function openWhatsApp(phone: string, copy?: ContactFailCopy) {
  const n = phone.replace(/\D/g, '');
  open(`https://wa.me/${n.length === 10 ? `91${n}` : n}`, copy);
}

export function sendEmail(email: string, copy?: ContactFailCopy) {
  open(`mailto:${email}`, copy);
}

/** Opens an admin-provided web link (notifications, banners) — only http(s), never app schemes. */
export function openExternalUrl(url: string, copy?: ContactFailCopy): boolean {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  open(trimmed, copy);
  return true;
}
