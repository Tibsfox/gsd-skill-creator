/**
 * Curl educational labs.
 *
 * Three exercises teaching HTTP protocol fundamentals, authentication
 * patterns, and SSRF security concepts. Each lab has steps with
 * instructions and a verify() function that works without network calls.
 *
 * Follows the BbsLab/BbsLabStep pattern from src/bbs-pack/shared/types.ts.
 */

import { isPrivateIp } from './security.js';

export interface CurlLabStep {
  instruction: string;
  expected_observation: string;
  learn_note: string;
}

export interface CurlLab {
  id: string;
  title: string;
  steps: CurlLabStep[];
  verify: () => boolean;
}

// ---------------------------------------------------------------------------
// Lab 01: Anatomy of an HTTP Request
// ---------------------------------------------------------------------------

const lab01: CurlLab = {
  id: 'curl-lab-01',
  title: 'Anatomy of an HTTP Request',
  steps: [
    {
      instruction: 'Construct a CurlRequest for GET https://httpbin.org/get with an Accept: application/json header.',
      expected_observation: 'The request object has method: "GET", url, and headers. No body for GET requests.',
      learn_note: 'HTTP requests have four parts: method (verb), URL (resource), headers (metadata), and optional body (payload). GET requests never have a body -- the URL IS the query.',
    },
    {
      instruction: 'Construct a CurlRequest for POST https://httpbin.org/post with a JSON body {"name":"test"} and Content-Type: application/json.',
      expected_observation: 'POST requests include a body with content. The Content-Type header tells the server how to parse the body.',
      learn_note: 'POST, PUT, and PATCH methods carry a request body. The Content-Type header is the contract between client and server about the body format. application/json is the modern standard; older APIs use application/x-www-form-urlencoded.',
    },
    {
      instruction: 'Examine a CurlResponse with status 200, headers, and body. Identify which status codes mean success vs error.',
      expected_observation: 'Status 200 = OK, 201 = Created, 301 = Redirect, 400 = Bad Request, 401 = Unauthorized, 404 = Not Found, 500 = Server Error.',
      learn_note: 'HTTP status codes are grouped: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error. The first digit tells you the category. A 4xx means YOU made an error; a 5xx means the SERVER had an error.',
    },
  ],
  verify: () => {
    // Verify: a well-formed GET request has method, URL, headers, and no body
    const req = { url: 'https://httpbin.org/get', method: 'GET' as const, headers: { accept: 'application/json' } };
    return (
      req.method === 'GET' &&
      req.url.startsWith('https://') &&
      req.headers.accept === 'application/json' &&
      !('body' in req)
    );
  },
};

// ---------------------------------------------------------------------------
// Lab 02: Authentication Patterns
// ---------------------------------------------------------------------------

const lab02: CurlLab = {
  id: 'curl-lab-02',
  title: 'Authentication Patterns',
  steps: [
    {
      instruction: 'Construct a Basic auth header for username "admin" and password "secret". Base64-encode the credentials.',
      expected_observation: 'Authorization: Basic YWRtaW46c2VjcmV0 -- the base64 encoding of "admin:secret".',
      learn_note: 'Basic auth sends credentials in every request as base64(username:password). It is NOT encryption -- base64 is trivially reversible. Basic auth is only safe over HTTPS. Despite being "basic", it remains widely used for API keys and service-to-service auth.',
    },
    {
      instruction: 'Construct a Bearer auth header for token "eyJhbGciOiJIUzI1NiJ9". Examine the Authorization header format.',
      expected_observation: 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9 -- the token is sent as-is, not encoded.',
      learn_note: 'Bearer tokens (usually JWTs) are opaque to the HTTP layer -- the server validates the token internally. Unlike Basic auth, the token does not contain the raw password. Tokens expire and can be revoked, making them more secure than long-lived passwords.',
    },
    {
      instruction: 'Examine the Digest auth challenge-response flow. First request gets 401 with WWW-Authenticate, second includes computed response.',
      expected_observation: 'Digest auth is a two-step flow: the server sends a nonce in the 401 challenge, the client computes MD5(HA1:nonce:HA2) and sends it back.',
      learn_note: 'Digest auth never sends the password over the wire. Instead, it proves knowledge of the password via MD5 hash computation. The nonce prevents replay attacks. However, MD5 is considered weak by modern standards -- prefer Bearer tokens for new APIs.',
    },
    {
      instruction: 'Compare which headers should be redacted from debug output: Authorization, Cookie, Set-Cookie, Proxy-Authorization.',
      expected_observation: 'All four headers contain credentials or session tokens that must never appear in logs, error messages, or debug output.',
      learn_note: 'Credential leakage through log files is a top-10 OWASP vulnerability. Always redact auth-related headers before logging. This includes Authorization (all schemes), Cookie (session tokens), Set-Cookie (new sessions), and Proxy-Authorization (proxy credentials).',
    },
  ],
  verify: () => {
    // Verify: Basic auth for admin:secret produces correct base64
    const encoded = Buffer.from('admin:secret').toString('base64');
    const header = `Basic ${encoded}`;
    return header === 'Basic YWRtaW46c2VjcmV0';
  },
};

// ---------------------------------------------------------------------------
// Lab 03: SSRF Attack Vectors
// ---------------------------------------------------------------------------

const lab03: CurlLab = {
  id: 'curl-lab-03',
  title: 'SSRF Attack Vectors and Prevention',
  steps: [
    {
      instruction: 'Classify these URLs as safe or dangerous: http://example.com, file:///etc/passwd, http://127.0.0.1/admin, https://api.github.com.',
      expected_observation: 'http://example.com and https://api.github.com are safe (public, http/https). file:///etc/passwd (file scheme) and http://127.0.0.1 (loopback) are dangerous.',
      learn_note: 'SSRF (Server-Side Request Forgery) tricks a server into making requests to internal resources. The attacker controls the URL -- if the server fetches file:///etc/passwd, it reads local files. If it fetches http://169.254.169.254, it accesses cloud metadata with IAM credentials.',
    },
    {
      instruction: 'Examine IP obfuscation: http://0x7f000001/ is the same as http://127.0.0.1/. Try decimal: http://2130706433/.',
      expected_observation: 'Hex (0x7f000001), octal (0177.0.0.1), and decimal (2130706433) all resolve to 127.0.0.1 -- the WHATWG URL parser normalizes them.',
      learn_note: 'Attackers use IP obfuscation to bypass naive string-matching blocklists. The WHATWG URL parser (used by new URL()) normalizes all IP formats to dotted-decimal. Always parse URLs through new URL() before checking IPs -- never use regex or string matching on raw URLs.',
    },
    {
      instruction: 'Explain why an allowlist (only http/https) is better than a denylist (block file, ftp, gopher, ...) for scheme validation.',
      expected_observation: 'A denylist can always be bypassed by a scheme you forgot to block (jar:, dict:, javascript:). An allowlist blocks everything except the two schemes you explicitly permit.',
      learn_note: 'OWASP recommends allowlisting over denylisting for SSRF prevention. The allowlist approach has zero false negatives: if a new scheme is invented tomorrow, it is automatically blocked. The denylist approach requires constant maintenance and will always miss edge cases.',
    },
    {
      instruction: 'Identify which RFC-1918 ranges must be blocked: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, and special addresses 127.0.0.0/8, 169.254.0.0/16, 0.0.0.0.',
      expected_observation: '10.x.x.x, 172.16-31.x.x, 192.168.x.x (private), 127.x.x.x (loopback), 169.254.x.x (link-local/AWS metadata), 0.0.0.0 (unspecified) -- all must be blocked.',
      learn_note: 'The 172.16.0.0/12 range is tricky: only 172.16.x.x through 172.31.x.x are private. 172.15.x.x and 172.32.x.x are public. Simple prefix matching (starts with "172.16.") misses 172.17-31. You must parse the second octet as an integer and check 16 <= octet <= 31.',
    },
  ],
  verify: () => {
    // Verify: student can classify URLs correctly using isPrivateIp
    const dangerousIps = ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1'];
    const safeIps = ['93.184.216.34', '140.82.121.6', '8.8.8.8'];

    const allDangerousBlocked = dangerousIps.every(ip => isPrivateIp(ip));
    const allSafeAllowed = safeIps.every(ip => !isPrivateIp(ip));

    return allDangerousBlocked && allSafeAllowed;
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const labs: CurlLab[] = [lab01, lab02, lab03];
