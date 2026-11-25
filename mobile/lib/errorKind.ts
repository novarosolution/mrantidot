import axios from 'axios';

/**
 * What kind of failure a load hit, so screens can show friendly, admin-editable copy instead of
 * raw transport errors (which carry codes and the API address).
 *
 * - `offline`: no connection / DNS / timeout / refused
 * - `server`:  5xx, HTML instead of JSON, or anything that would leak a URL
 * - `message`: a real message from the API ("Booking not found") — safe to show as is
 */
export type ErrorKind = 'offline' | 'server' | 'message';

/** Machine codes `getApiErrorMessage` embeds for transport failures. */
const OFFLINE_CODES = /\b(ERR_NETWORK|NETWORK_ERROR|ECONNABORTED|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ECONNRESET|EAI_AGAIN)\b|CLEARTEXT/i;
const SERVER_CODES = /^\s*5\d\d\b|\b5\d\d (Server Error|Bad Gateway|Service Unavailable|Gateway Timeout|Internal Server Error)\b|returned HTML/i;
const HAS_URL = /\bhttps?:\/\/|\b\d{1,3}(\.\d{1,3}){3}(:\d+)?\b/;

export function errorKind(error: unknown): ErrorKind {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'offline';
    return error.response.status >= 500 ? 'server' : 'message';
  }
  const text = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  if (!text.trim()) return 'server';
  if (OFFLINE_CODES.test(text)) return 'offline';
  if (SERVER_CODES.test(text) || HAS_URL.test(text)) return 'server';
  return 'message';
}
