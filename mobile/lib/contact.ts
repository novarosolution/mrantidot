import { Linking } from 'react-native';
import { appToast } from '@/lib/toast';

function open(url: string) {
  Linking.openURL(url).catch(() => appToast.error('Could not open link', 'Please try again from your phone app'));
}

export function callPhone(phone: string) {
  open(`tel:${phone.replace(/[^\d+]/g, '')}`);
}

/** wa.me needs digits only with country code; bare 10-digit numbers are treated as Indian (+91). */
export function openWhatsApp(phone: string) {
  const n = phone.replace(/\D/g, '');
  open(`https://wa.me/${n.length === 10 ? `91${n}` : n}`);
}

export function sendEmail(email: string) {
  open(`mailto:${email}`);
}
