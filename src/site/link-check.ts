/**
 * src/site/link-check.ts — pure link extractor + verifier
 *
 * Design principles:
 * - Pure function with { readFile, walkDir, httpHead, readCache, writeCache } DI
 * - Closure-local renderer state (no module-level mutable state)
 * - URL scheme allowlist (T-CRIT-01)
 * - SSRF mitigation: private host block when checkExternal=true (T-CRIT-02)
 * - Cache file chmod 0600 after write (T-CRIT-03)
 * - No new npm dependencies (hand-rolled extractor, mirrors audit.ts)
 */

import { Marked, Renderer } from 'marked';
import { slugifyHeading } from './markdown.js';
import { chmod, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

// ============================================================================
// Public types
// ============================================================================

export type LinkElementType =
  | 'markdown-link'
  | 'markdown-image'
  | 'html-a'
  | 'html-img'
  | 'html-link'
  | 'html-script'
  | 'html-source'
  | 'html-iframe'
  | 'html-form';

export interface ExtractedLink {
  url: string;
  elementType: LinkElementType;
  sourceFile?: string;
}

export type LinkStatus =
  | 'ok'
  | 'broken-internal'
  | 'broken-anchor'
  | 'broken-external'
  | 'skipped';

export interface VerifiedLink extends ExtractedLink {
  status: LinkStatus;
  reason?: string;
  finalUrl?: string;
}

export interface LinkCheckOptions {
  readFile: (path: string) => Promise<string>;
  walkDir: (dir: string) => Promise<string[]>;
  /** Injected HEAD client; falls back to node:http/https when not provided. */
  httpHead?: (url: string) => Promise<{ status: number; finalUrl: string }>;
  readCache?: (path: string) => Promise<string>;
  writeCache?: (path: string, content: string) => Promise<void>;
  /** Path for the link check cache (default '.cache/link-check.json') */
  cachePath?: string;
  /** Enable external HEAD checks (default false) */
  checkExternal?: boolean;
  /** Allow RFC1918/loopback hosts in external checks (default false, T-CRIT-02) */
  allowPrivateHosts?: boolean;
  /** Timeout per HEAD request in ms (default 5000) */
  headTimeoutMs?: number;
  /** Maximum external HEAD requests per run (default 500) */
  requestBudget?: number;
}

// ============================================================================
// Markdown extractor (closure-local state — no module-level mutable state)
// ============================================================================

/**
 * Extract links from a markdown document.
 * Each call creates a fresh Marked instance so state never bleeds between calls.
 */
export function extractMarkdownLinks(
  markdown: string,
  sourceFile?: string,
): ExtractedLink[] {
  // Closure-local array — never shared across calls
  const extracted: ExtractedLink[] = [];

  const renderer = new Renderer();

  renderer.link = function ({ href, text: _text }: { href: string; text: string }): string {
    if (href) {
      extracted.push({ url: href, elementType: 'markdown-link', sourceFile });
    }
    return '';
  };

  renderer.image = function ({ href, title: _title, text: _text }: { href: string; title: string | null; text: string }): string {
    if (href) {
      extracted.push({ url: href, elementType: 'markdown-image', sourceFile });
    }
    return '';
  };

  const instance = new Marked();
  instance.use({ renderer });
  instance.parse(markdown); // side effect: populates extracted

  return extracted;
}

// ============================================================================
// HTML extractor (7 element types, regex-based, mirrors audit.ts idiom)
// ============================================================================

/** Element-type regex patterns for HTML link extraction. */
const HTML_LINK_PATTERNS: Array<{ type: LinkElementType; patterns: RegExp[] }> = [
  {
    type: 'html-a',
    patterns: [
      /href="([^"#][^"]*)"/gi,
      /href='([^'#][^']*)'/gi,
      /href=([^\s>"'][^\s>]*)/gi,
    ],
  },
  {
    type: 'html-img',
    patterns: [
      /src="([^"]*)"/gi,
      /src='([^']*)'/gi,
    ],
  },
  {
    type: 'html-link',
    patterns: [
      /<link[^>]+href="([^"]*)"/gi,
      /<link[^>]+href='([^']*)'/gi,
    ],
  },
  {
    type: 'html-script',
    patterns: [
      /<script[^>]+src="([^"]*)"/gi,
      /<script[^>]+src='([^']*)'/gi,
    ],
  },
  {
    type: 'html-source',
    patterns: [
      /<source[^>]+src="([^"]*)"/gi,
      /<source[^>]+src='([^']*)'/gi,
    ],
  },
  {
    type: 'html-iframe',
    patterns: [
      /<iframe[^>]+src="([^"]*)"/gi,
      /<iframe[^>]+src='([^']*)'/gi,
    ],
  },
  {
    type: 'html-form',
    patterns: [
      /<form[^>]+action="([^"]*)"/gi,
      /<form[^>]+action='([^']*)'/gi,
    ],
  },
];

/**
 * Extract links from an HTML document.
 * Handles all 7 element types, single/double quotes, uppercase tags, any attribute order.
 */
export function extractHtmlLinks(
  html: string,
  sourceFile: string,
): ExtractedLink[] {
  const extracted: ExtractedLink[] = [];
  const seen = new Set<string>(); // deduplicate url+type combos

  for (const { type, patterns } of HTML_LINK_PATTERNS) {
    for (const pattern of patterns) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (!url || url.trim() === '') continue;
        const key = `${type}:${url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        extracted.push({ url, elementType: type, sourceFile });
      }
    }
  }

  return extracted;
}

// ============================================================================
// URL utilities
// ============================================================================

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:']);
const PLACEHOLDER_BASE = 'http://placeholder.invalid/';

/** Classify a URL's scheme and form. */
function classifyUrl(url: string): {
  isFragment: boolean;
  isRelative: boolean;
  isProtocolRelative: boolean;
  isExternal: boolean;
  isSafeScheme: boolean;
  parsed?: URL;
} {
  if (url.startsWith('#')) {
    return { isFragment: true, isRelative: false, isProtocolRelative: false, isExternal: false, isSafeScheme: true };
  }
  if (url.startsWith('//')) {
    const parsed = new URL('https:' + url);
    return { isFragment: false, isRelative: false, isProtocolRelative: true, isExternal: true, isSafeScheme: true, parsed };
  }
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || !url.includes(':')) {
    return { isFragment: false, isRelative: !url.startsWith('/'), isProtocolRelative: false, isExternal: false, isSafeScheme: true };
  }
  try {
    const parsed = new URL(url);
    const isSafe = SAFE_SCHEMES.has(parsed.protocol);
    const isExternal = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return { isFragment: false, isRelative: false, isProtocolRelative: false, isExternal, isSafeScheme: isSafe, parsed };
  } catch {
    return { isFragment: false, isRelative: false, isProtocolRelative: false, isExternal: false, isSafeScheme: false };
  }
}

/**
 * Normalize an absolute URL path to match builtUrls format.
 * /foo → /foo/, /foo/index.html → /foo/, /index.html → /
 */
function normalizeInternalUrl(url: string): string {
  const hashIdx = url.indexOf('#');
  let path = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1) : undefined;
  // Canonicalize /dir/index.html → /dir/ and /index.html → / to match builtUrls
  if (path === '/index.html' || path === 'index.html') {
    path = '/';
  } else if (path.endsWith('/index.html')) {
    path = path.slice(0, -'index.html'.length);
  }
  const normalized = path.endsWith('/') ? path : path + '/';
  return fragment !== undefined ? normalized + '#' + fragment : normalized;
}

/**
 * Map a source file path to its served page URL, matching the builtUrls
 * convention used by runLinkCheck: `foo/index.html` → `/foo/`, `index.html` → `/`.
 */
function sourceFileToPageUrl(sourceFile: string): string {
  if (sourceFile === 'index.html') return '/';
  if (sourceFile.endsWith('/index.html')) {
    return '/' + sourceFile.slice(0, -'/index.html'.length) + '/';
  }
  return '/' + sourceFile;
}

/**
 * Resolve a relative URL to an absolute path based on the source file.
 */
function resolveRelativeUrl(url: string, sourceFile: string): string {
  // Convert source file to a URL path
  const sourcePath = '/' + sourceFile;
  const sourceDir = sourcePath.endsWith('/index.html')
    ? sourcePath.slice(0, -'index.html'.length)
    : sourcePath.slice(0, sourcePath.lastIndexOf('/') + 1);

  try {
    const resolved = new URL(url, PLACEHOLDER_BASE + sourceDir.slice(1));
    return resolved.pathname + (resolved.hash || '');
  } catch {
    return url;
  }
}

// ============================================================================
// Private host block (SSRF mitigation T-CRIT-02)
// ============================================================================

const PRIVATE_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_PATTERNS.some((p) => p.test(hostname));
}

// ============================================================================
// Cache helpers
// ============================================================================

interface CacheEntry {
  status: number;
  checkedAt: string;
  finalUrl: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function readCacheData(
  opts: LinkCheckOptions,
): Promise<Record<string, CacheEntry>> {
  if (!opts.readCache) return {};
  const path = opts.cachePath ?? '.cache/link-check.json';
  try {
    const raw = await opts.readCache(path);
    return JSON.parse(raw) as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

async function writeCacheData(
  data: Record<string, CacheEntry>,
  opts: LinkCheckOptions,
): Promise<void> {
  if (!opts.writeCache) return;
  const path = opts.cachePath ?? '.cache/link-check.json';
  await opts.writeCache(path, JSON.stringify(data, null, 2));
  // chmod 0600 for cache poisoning mitigation (T-CRIT-03)
  // Only attempt if writeCache is the real FS (no-op in tests)
  try {
    await chmod(path, 0o600);
  } catch {
    // Ignore — in tests the path may not exist on disk
  }
}

function isCacheFresh(entry: CacheEntry): boolean {
  const age = Date.now() - new Date(entry.checkedAt).getTime();
  return age < CACHE_TTL_MS;
}

// ============================================================================
// verifyLinks
// ============================================================================

/**
 * Verify a list of extracted links against known built URLs and heading slugs.
 *
 * @param links - Links to verify
 * @param builtUrls - Set of known URL paths from the build output
 * @param headingSlugsByPage - Map of page URL → Set of heading slugs
 * @param opts - Options including DI for HTTP and cache
 */
export async function verifyLinks(
  links: ExtractedLink[],
  builtUrls: Set<string>,
  headingSlugsByPage: Map<string, Set<string>>,
  opts: LinkCheckOptions,
): Promise<VerifiedLink[]> {
  const checkExternal = opts.checkExternal ?? false;
  const allowPrivateHosts = opts.allowPrivateHosts ?? false;
  const requestBudget = opts.requestBudget ?? 500;
  let externalRequestCount = 0;

  // Load cache once
  const cache = await readCacheData(opts);
  let cacheModified = false;

  const results: VerifiedLink[] = [];

  for (const link of links) {
    const { url, elementType, sourceFile } = link;

    if (!url || url.trim() === '') continue;

    const classification = classifyUrl(url);

    // --- Fragment-only anchor (#slug) ---
    if (classification.isFragment) {
      const slug = url.slice(1);
      if (!sourceFile) {
        // No source context — can't resolve which page the fragment belongs to
        results.push({ ...link, status: 'ok' });
        continue;
      }
      const pageUrl = sourceFileToPageUrl(sourceFile);
      const slugs = headingSlugsByPage.get(pageUrl);
      if (slugs && !slugs.has(slug)) {
        results.push({ ...link, status: 'broken-anchor', reason: 'anchor-not-found' });
        continue;
      }
      results.push({ ...link, status: 'ok' });
      continue;
    }

    // --- Unsafe scheme (javascript:, data:, file:) ---
    if (!classification.isSafeScheme) {
      results.push({ ...link, status: 'skipped', reason: 'unsafe-scheme' });
      continue;
    }

    // --- Relative URL ---
    if (classification.isRelative) {
      const resolvedPath = sourceFile
        ? resolveRelativeUrl(url, sourceFile)
        : url;
      const normalized = normalizeInternalUrl(resolvedPath);
      const hashIdx = normalized.indexOf('#');
      const pagePath = hashIdx >= 0 ? normalized.slice(0, hashIdx) : normalized;
      const fragment = hashIdx >= 0 ? normalized.slice(hashIdx + 1) : undefined;

      if (!builtUrls.has(pagePath)) {
        results.push({ ...link, status: 'broken-internal', reason: 'relative-not-found' });
        continue;
      }
      if (fragment !== undefined) {
        const slugs = headingSlugsByPage.get(pagePath);
        if (slugs && !slugs.has(fragment)) {
          results.push({ ...link, status: 'broken-anchor', reason: 'anchor-not-found' });
          continue;
        }
      }
      results.push({ ...link, status: 'ok' });
      continue;
    }

    // --- External or protocol-relative URL ---
    if (classification.isExternal || classification.isProtocolRelative) {
      if (!checkExternal) {
        results.push({ ...link, status: 'skipped', reason: 'external-check-disabled' });
        continue;
      }

      // Normalize protocol-relative to https
      const effectiveUrl = url.startsWith('//')
        ? 'https:' + url
        : url;

      // Private host block (T-CRIT-02)
      if (!allowPrivateHosts) {
        try {
          const parsed = new URL(effectiveUrl);
          if (isPrivateHost(parsed.hostname)) {
            results.push({ ...link, status: 'skipped', reason: 'private-host-blocked' });
            continue;
          }
        } catch {
          results.push({ ...link, status: 'skipped', reason: 'invalid-url' });
          continue;
        }
      }

      // Cache check
      const cached = cache[effectiveUrl];
      if (cached && isCacheFresh(cached)) {
        const status = cached.status >= 200 && cached.status < 400 ? 'ok' : 'broken-external';
        results.push({ ...link, status, finalUrl: cached.finalUrl });
        continue;
      }

      // Budget check
      if (externalRequestCount >= requestBudget) {
        results.push({ ...link, status: 'skipped', reason: 'budget-exhausted' });
        continue;
      }

      // HEAD request
      externalRequestCount++;
      try {
        const httpHead = opts.httpHead ?? makeDefaultHttpHead(opts.headTimeoutMs ?? 5000);
        const { status: httpStatus, finalUrl } = await httpHead(effectiveUrl);

        // Update cache
        cache[effectiveUrl] = {
          status: httpStatus,
          checkedAt: new Date().toISOString(),
          finalUrl,
        };
        cacheModified = true;

        const linkStatus = httpStatus >= 200 && httpStatus < 400 ? 'ok' : 'broken-external';
        results.push({ ...link, status: linkStatus, finalUrl });
      } catch (err) {
        results.push({ ...link, status: 'broken-external', reason: String(err) });
      }
      continue;
    }

    // --- Internal absolute URL (/path/) ---
    const normalized = normalizeInternalUrl(url);
    const hashIdx = normalized.indexOf('#');
    const pagePath = hashIdx >= 0 ? normalized.slice(0, hashIdx) : normalized;
    const fragment = hashIdx >= 0 ? normalized.slice(hashIdx + 1) : undefined;

    if (!builtUrls.has(pagePath)) {
      results.push({ ...link, status: 'broken-internal', reason: 'page-not-found' });
      continue;
    }

    if (fragment !== undefined) {
      const slugs = headingSlugsByPage.get(pagePath);
      if (slugs && !slugs.has(fragment)) {
        results.push({ ...link, status: 'broken-anchor', reason: 'anchor-not-found' });
        continue;
      }
    }

    results.push({ ...link, status: 'ok' });
  }

  // Write updated cache
  if (cacheModified) {
    await writeCacheData(cache, opts);
  }

  return results;
}

// ============================================================================
// Default HTTP HEAD client (used when httpHead is not injected)
// ============================================================================

function makeDefaultHttpHead(
  timeoutMs: number,
): (url: string) => Promise<{ status: number; finalUrl: string }> {
  return async (url: string) => {
    const { request: httpRequest } = await import('node:http');
    const { request: httpsRequest } = await import('node:https');

    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const reqFn = isHttps ? httpsRequest : httpRequest;

      const options = {
        method: 'HEAD',
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        timeout: timeoutMs,
      };

      const req = reqFn(options, (res) => {
        resolve({ status: res.statusCode ?? 0, finalUrl: url });
        res.resume();
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HEAD request timed out: ${url}`));
      });
      req.on('error', reject);
      req.end();
    });
  };
}

// ============================================================================
// runLinkCheck — walk buildDir, extract links, verify
// ============================================================================

/**
 * Walk a build directory, extract all links from HTML and markdown files,
 * verify them, and return the flat verified list.
 */
export async function runLinkCheck(
  buildDir: string,
  opts: LinkCheckOptions,
): Promise<VerifiedLink[]> {
  const { readFile, walkDir } = opts;

  const allFiles = await walkDir(buildDir);
  const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
  const mdFiles = allFiles.filter((f) => f.endsWith('.md'));

  // Build set of known URLs from HTML output (same logic as audit.ts:81-89)
  const builtUrls = new Set<string>();
  for (const file of htmlFiles) {
    if (file === 'index.html') {
      builtUrls.add('/');
    } else if (file.endsWith('/index.html')) {
      const slug = file.slice(0, -'/index.html'.length);
      builtUrls.add(`/${slug}/`);
    }
  }

  // Build heading slug map from HTML files (parse <h1..h6 id="..."> attributes)
  const headingSlugsByPage = new Map<string, Set<string>>();
  const headingIdRe = /<h[1-6][^>]+id="([^"]+)"/gi;

  for (const file of htmlFiles) {
    const pageUrl = file === 'index.html' ? '/' : `/${file.slice(0, -'/index.html'.length)}/`;
    const content = await readFile(`${buildDir}/${file}`);
    const slugs = new Set<string>();
    let m: RegExpExecArray | null;
    headingIdRe.lastIndex = 0;
    while ((m = headingIdRe.exec(content)) !== null) {
      slugs.add(m[1]!);
    }
    if (slugs.size > 0) {
      headingSlugsByPage.set(pageUrl, slugs);
    }
  }

  // Extract links from all files
  const allLinks: ExtractedLink[] = [];

  for (const file of htmlFiles) {
    const content = await readFile(`${buildDir}/${file}`);
    const htmlLinks = extractHtmlLinks(content, file);
    allLinks.push(...htmlLinks);
  }

  for (const file of mdFiles) {
    const content = await readFile(`${buildDir}/${file}`);
    const mdLinks = extractMarkdownLinks(content, file);
    allLinks.push(...mdLinks);
  }

  return verifyLinks(allLinks, builtUrls, headingSlugsByPage, opts);
}
