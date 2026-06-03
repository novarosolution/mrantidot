import { config } from './config';

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
