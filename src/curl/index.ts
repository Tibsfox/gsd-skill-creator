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

/* ---- Labs ---- */
export { labs as curlLabs } from './labs.js';
export type { CurlLab, CurlLabStep } from './labs.js';
