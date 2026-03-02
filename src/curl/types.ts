/**
 * Curl module type definitions.
 *
 * Curl-prefixed interfaces for the secure HTTP client,
 * authentication, and SSRF security validation layer.
 */

export type CurlMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export interface CurlAuth {
  type: 'basic' | 'bearer' | 'digest';
  username?: string;
  password?: string;
  token?: string;
  /** For digest: server challenge params from 401 response */
  realm?: string;
  nonce?: string;
  qop?: string;
}

export interface CurlRequest {
  url: string;
  method: CurlMethod;
  headers?: Record<string, string>;
  auth?: CurlAuth;
  body?: string;
  timeout?: number;
  followRedirects?: boolean;
  debug?: boolean;
}

export interface CurlResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  blocked: boolean;
  blockReason?: string;
  debug?: {
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
  };
}

export interface CurlSecurityPolicy {
  allowedSchemes: Set<string>;
  blockedIpRanges: Array<{ prefix: string; label: string }>;
  blockLocalhost: boolean;
  blockLinkLocal: boolean;
  resolveHostnames: boolean;
}

export interface CurlSecurityResult {
  allowed: boolean;
  reason?: string;
  resolvedIp?: string;
}
