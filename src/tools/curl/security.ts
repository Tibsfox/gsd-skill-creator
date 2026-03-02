/**
 * SSRF URL security validation.
 *
 * Validates URLs before any HTTP fetch call. Uses scheme allowlisting
 * (only http/https) and IP deny-listing (RFC-1918, loopback, link-local)
 * following OWASP SSRF prevention guidelines.
 */

import { promises as dns } from 'node:dns';
import { isIPv4, isIPv6 } from 'node:net';
import type { CurlSecurityPolicy, CurlSecurityResult } from './types.js';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const BLOCKED_IPV4_RANGES: Array<{ prefix: string; label: string }> = [
  { prefix: '10.', label: 'RFC-1918 Class A' },
  { prefix: '127.', label: 'Loopback' },
  { prefix: '169.254.', label: 'Link-local' },
  { prefix: '192.168.', label: 'RFC-1918 Class C' },
  { prefix: '0.', label: 'Unspecified' },
];

/**
 * Check if an IPv4 address is in the 172.16.0.0/12 private range.
 * The second octet must be between 16 and 31 inclusive.
 */
function is172Private(ip: string): boolean {
  const parts = ip.split('.');
  if (parts[0] !== '172') return false;
  const second = parseInt(parts[1], 10);
  return second >= 16 && second <= 31;
}

/**
 * Check if an IP address is private (RFC-1918, loopback, link-local, unspecified, or IPv6 loopback).
 */
export function isPrivateIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1' || ip === '::') return true;

  // IPv4 prefix checks
  for (const range of BLOCKED_IPV4_RANGES) {
    if (ip.startsWith(range.prefix)) return true;
  }

  // 172.16-31.x.x range check
  if (is172Private(ip)) return true;

  return false;
}

/**
 * Default security policy: only http/https schemes, block all private IPs.
 */
export const DEFAULT_SECURITY_POLICY: CurlSecurityPolicy = {
  allowedSchemes: new Set(['http:', 'https:']),
  blockedIpRanges: BLOCKED_IPV4_RANGES,
  blockLocalhost: true,
  blockLinkLocal: true,
  resolveHostnames: true,
};

/**
 * Validate a URL for SSRF safety before fetch.
 *
 * Checks:
 * 1. URL is parseable
 * 2. Scheme is in the allowlist (http/https only)
 * 3. Hostname is not localhost
 * 4. IP (or resolved IP from hostname) is not in any blocked range
 */
export async function validateUrl(raw: string): Promise<CurlSecurityResult> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { allowed: false, reason: 'Invalid URL' };
  }

  // Scheme allowlist check
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { allowed: false, reason: `Blocked scheme: ${parsed.protocol}` };
  }

  // Explicit localhost hostname check
  if (parsed.hostname === 'localhost') {
    return { allowed: false, reason: 'Blocked: localhost' };
  }

  // Resolve hostname to IP for validation
  let ip = parsed.hostname;

  // Strip IPv6 brackets for comparison
  if (ip.startsWith('[') && ip.endsWith(']')) {
    ip = ip.slice(1, -1);
  }

  // IPv6 loopback check
  if (ip === '::1' || ip === '::') {
    return { allowed: false, reason: 'Blocked: IPv6 loopback' };
  }

  // If it's a hostname (not IP literal), resolve via DNS
  if (!isIPv4(ip) && !isIPv6(ip)) {
    try {
      const resolved = await dns.lookup(ip);
      ip = resolved.address;
    } catch {
      return { allowed: false, reason: `DNS resolution failed for ${parsed.hostname}` };
    }
  }

  // IPv4 prefix range checks
  for (const range of BLOCKED_IPV4_RANGES) {
    if (ip.startsWith(range.prefix)) {
      return { allowed: false, reason: `Blocked: ${range.label} (${ip})`, resolvedIp: ip };
    }
  }

  // 172.16-31 range check (needs integer parsing, not prefix match)
  if (is172Private(ip)) {
    return { allowed: false, reason: `Blocked: RFC-1918 Class B (${ip})`, resolvedIp: ip };
  }

  return { allowed: true, resolvedIp: ip };
}
