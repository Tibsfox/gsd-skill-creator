/**
 * Curl module barrel exports.
 *
 * Secure HTTP client with SSRF protection, authentication,
 * and educational labs teaching protocol fundamentals.
 * All types use Curl domain prefix per project convention.
 */

/* ---- Types ---- */
export type {
  CurlMethod,
  CurlAuth,
  CurlRequest,
  CurlResponse,
  CurlSecurityPolicy,
  CurlSecurityResult,
} from './types.js';

/* ---- HTTP Client ---- */
export {
  httpRequest,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
  httpPatch,
} from './client.js';

/* ---- Security ---- */
export { validateUrl, isPrivateIp, DEFAULT_SECURITY_POLICY } from './security.js';

/* ---- Auth ---- */
export {
  buildBasicAuth,
  buildBearerAuth,
  buildDigestAuth,
  buildAuthHeaders,
  redactHeaders,
  computeDigestResponse,
} from './auth.js';

/* ---- Cookies ---- */
export { CurlCookieJar } from './cookies.js';
export type { CurlCookie } from './types.js';

/* ---- Proxy ---- */
export { createProxyDispatcher, createHttpProxyDispatcher, createSocksProxyDispatcher } from './proxy.js';
export type { CurlProxyConfig } from './types.js';

/* ---- Certificates ---- */
export { createCertAgent } from './certs.js';
export type { CurlCertConfig, CurlRequestOptions } from './types.js';

/* ---- Labs ---- */
export { labs as curlLabs } from './labs.js';
export type { CurlLab, CurlLabStep } from './labs.js';
