import { isIP } from 'node:net';
import { fail, text } from '../platform/store';

export function publicSourceUrl(input: unknown): string {
  let url: URL;
  try { url = new URL(text(input, 'Source URL', 2000)); } catch { return fail('INVALID_SOURCE_URL'); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  // No network requests are made here. IP literals and non-public host names cannot enter remote research requests.
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isIP(host) || !host.includes('.') || /\.(local|internal|localhost|test|invalid|lan|home|arpa)$/.test(host) || !/^[a-z0-9.-]+$/.test(host)) fail('SOURCE_URL_DENIED');
  if ([...url.searchParams.keys()].some(key => /token|password|secret|api.?key|auth|signature|session|credential|cookie/i.test(key))) fail('SOURCE_CREDENTIALS_DENIED');
  url.hash = '';
  return url.toString();
}
