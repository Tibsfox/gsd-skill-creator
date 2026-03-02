/**
 * Curl HTTP client with SSRF security gate.
 *
 * Every request is validated through validateUrl() before calling fetch.
 * Supports all standard HTTP methods with typed request/response,
 * auth header injection, and credential-redacted debug output.
 */

import { validateUrl } from './security.js';
import { buildAuthHeaders, buildDigestAuth, redactHeaders, computeDigestResponse } from './auth.js';
import type { CurlRequest, CurlResponse } from './types.js';

/**
 * Parse WWW-Authenticate: Digest challenge header into params.
 */
function parseDigestChallenge(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  // Remove "Digest " prefix
  const content = header.replace(/^Digest\s+/i, '');
  // Match key="value" or key=value patterns
  const regex = /(\w+)=(?:"([^"]*)"|([\w-]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    params[match[1]] = match[2] ?? match[3];
  }
  return params;
}

/**
 * Core HTTP request function with SSRF security gate.
 *
 * 1. Validates URL through validateUrl() -- blocked URLs never reach fetch
 * 2. Injects auth headers if auth is provided
 * 3. For Digest auth: handles 401 challenge-response automatically
 * 4. Returns typed CurlResponse with optional redacted debug output
 */
export async function httpRequest(req: CurlRequest): Promise<CurlResponse> {
  // SSRF security gate -- must pass before any fetch
  const validation = await validateUrl(req.url);
  if (!validation.allowed) {
    return {
      status: 0,
      statusText: 'BLOCKED',
      headers: {},
      body: '',
      blocked: true,
      blockReason: validation.reason,
    };
  }

  // Build request headers
  const headers = new Headers(req.headers);

  // Inject auth headers (for non-digest, or digest with pre-supplied challenge params)
  if (req.auth) {
    const authHeaders = await buildAuthHeaders(req.auth, req.method, req.url);
    for (const [k, v] of Object.entries(authHeaders)) {
      headers.set(k, v);
    }
  }

  // Execute fetch
  const fetchOpts: RequestInit = {
    method: req.method,
    headers,
    body: req.body,
    signal: req.timeout ? AbortSignal.timeout(req.timeout) : undefined,
    redirect: req.followRedirects === false ? 'manual' : 'follow',
  };

  let response = await globalThis.fetch(req.url, fetchOpts);

  // Digest auth challenge-response: if 401 with WWW-Authenticate: Digest, retry
  if (response.status === 401 && req.auth?.type === 'digest') {
    const wwwAuth = response.headers.get('www-authenticate');
    if (wwwAuth && wwwAuth.toLowerCase().startsWith('digest')) {
      const challenge = parseDigestChallenge(wwwAuth);
      const parsed = new URL(req.url);

      // Generate cnonce and nc for qop=auth
      const cnonce = Math.random().toString(36).slice(2);
      const nc = '00000001';

      const digestHeaders = buildDigestAuth({
        username: req.auth.username ?? '',
        password: req.auth.password ?? '',
        realm: challenge.realm ?? '',
        nonce: challenge.nonce ?? '',
        method: req.method,
        uri: parsed.pathname,
        qop: challenge.qop,
        nc: challenge.qop ? nc : undefined,
        cnonce: challenge.qop ? cnonce : undefined,
        opaque: challenge.opaque,
      });

      // Retry with Digest Authorization
      const retryHeaders = new Headers(req.headers);
      for (const [k, v] of Object.entries(digestHeaders)) {
        retryHeaders.set(k, v);
      }

      response = await globalThis.fetch(req.url, {
        ...fetchOpts,
        headers: retryHeaders,
      });
    }
  }

  // Read response
  const body = await response.text();
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => { responseHeaders[k] = v; });

  // Build request headers record for debug
  const requestHeadersRecord: Record<string, string> = {};
  headers.forEach((v, k) => { requestHeadersRecord[k] = v; });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body,
    blocked: false,
    debug: req.debug ? {
      requestHeaders: redactHeaders(requestHeadersRecord),
      responseHeaders: redactHeaders(responseHeaders),
    } : undefined,
  };
}

/** GET convenience method. */
export async function httpGet(url: string, opts?: Partial<CurlRequest>): Promise<CurlResponse> {
  return httpRequest({ url, method: 'GET', ...opts });
}

/** POST convenience method. */
export async function httpPost(url: string, opts?: Partial<CurlRequest>): Promise<CurlResponse> {
  return httpRequest({ url, method: 'POST', ...opts });
}

/** PUT convenience method. */
export async function httpPut(url: string, opts?: Partial<CurlRequest>): Promise<CurlResponse> {
  return httpRequest({ url, method: 'PUT', ...opts });
}

/** DELETE convenience method. */
export async function httpDelete(url: string, opts?: Partial<CurlRequest>): Promise<CurlResponse> {
  return httpRequest({ url, method: 'DELETE', ...opts });
}

/** PATCH convenience method. */
export async function httpPatch(url: string, opts?: Partial<CurlRequest>): Promise<CurlResponse> {
  return httpRequest({ url, method: 'PATCH', ...opts });
}
