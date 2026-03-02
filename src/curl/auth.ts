/**
 * Curl authentication header construction and credential redaction.
 *
 * Supports Basic (base64), Bearer (token), and Digest (RFC 2617)
 * authentication. All sensitive headers are redacted from debug output.
 */

import { createHash } from 'node:crypto';
import type { CurlAuth } from './types.js';

/** Headers that contain credentials and must be redacted in debug output. */
const REDACTED_HEADERS = new Set([
  'authorization', 'cookie', 'set-cookie', 'proxy-authorization',
]);

/**
 * Replace sensitive header values with [REDACTED].
 * Case-insensitive key comparison.
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = REDACTED_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return result;
}

/**
 * Build Basic auth header: base64-encoded username:password.
 */
export function buildBasicAuth(username: string, password: string): Record<string, string> {
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

/**
 * Build Bearer auth header: token in Authorization header.
 */
export function buildBearerAuth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Compute MD5 hex digest.
 */
function md5(str: string): string {
  return createHash('md5').update(str).digest('hex');
}

/**
 * Compute Digest auth response per RFC 2617.
 *
 * Without qop: response = MD5(HA1:nonce:HA2)
 * With qop=auth: response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
 *
 * Where HA1 = MD5(username:realm:password) and HA2 = MD5(method:uri).
 */
export function computeDigestResponse(
  username: string, password: string, realm: string,
  nonce: string, method: string, uri: string,
  qop?: string, nc?: string, cnonce?: string,
): string {
  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  if (qop === 'auth') {
    return md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  }
  return md5(`${ha1}:${nonce}:${ha2}`);
}

/**
 * Build Digest auth Authorization header from challenge parameters.
 */
export function buildDigestAuth(params: {
  username: string;
  password: string;
  realm: string;
  nonce: string;
  method: string;
  uri: string;
  qop?: string;
  nc?: string;
  cnonce?: string;
  opaque?: string;
}): Record<string, string> {
  const { username, password, realm, nonce, method, uri, qop, nc, cnonce, opaque } = params;

  const response = computeDigestResponse(username, password, realm, nonce, method, uri, qop, nc, cnonce);

  let header = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;

  if (qop) {
    header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }
  if (opaque) {
    header += `, opaque="${opaque}"`;
  }

  return { Authorization: header };
}

/**
 * Dispatcher: build auth headers based on auth type.
 */
export async function buildAuthHeaders(
  auth: CurlAuth, method: string, url: string,
): Promise<Record<string, string>> {
  switch (auth.type) {
    case 'basic':
      return buildBasicAuth(auth.username ?? '', auth.password ?? '');
    case 'bearer':
      return buildBearerAuth(auth.token ?? '');
    case 'digest': {
      const parsed = new URL(url);
      return buildDigestAuth({
        username: auth.username ?? '',
        password: auth.password ?? '',
        realm: auth.realm ?? '',
        nonce: auth.nonce ?? '',
        method,
        uri: parsed.pathname,
        qop: auth.qop,
      });
    }
    default:
      return {};
  }
}
