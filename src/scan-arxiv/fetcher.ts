import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import type { ArxivPaper, Fetcher } from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FetcherOptions {
  /** default 'http://export.arxiv.org/api/query' */
  baseUrl?: string;
  /** default 1000 (arxiv API limit is 2000; we play conservative) */
  maxResultsPerRequest?: number;
  /** default '.planning/arxiv-cache/api' */
  cacheDir?: string;
  noCache?: boolean;
  /** default 30_000 */
  timeoutMs?: number;
  /** default 3 with exponential backoff */
  retryAttempts?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'http://export.arxiv.org/api/query';
const DEFAULT_MAX_RESULTS = 1000;
const DEFAULT_CACHE_DIR = '.planning/arxiv-cache/api';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const INTER_PAGE_SLEEP_MS = 3_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a cache key hash from (month, categories, page).
 */
function cacheKey(month: string, categories: string[], page: number): string {
  const raw = `${month}|${[...categories].sort().join(',')}|${page}`;
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Compute the inclusive UTC date range for a given YYYY-MM month string.
 */
function monthBounds(month: string): { start: Date; end: Date } {
  const [yyyy, mm] = month.split('-').map(Number);
  const start = new Date(Date.UTC(yyyy, mm - 1, 1, 0, 0, 0));
  // Last day of the month: go to first of next month, subtract 1ms
  const end = new Date(Date.UTC(yyyy, mm, 1, 0, 0, 0) - 1);
  // Set to 23:59:59 on the last day (we already subtracted 1ms → 23:59:59.999; floor to :59)
  end.setUTCMilliseconds(0);
  return { start, end };
}

/**
 * Fetch a URL with retry + exponential backoff, honouring Retry-After headers.
 * Throws with a descriptive message that includes the URL.
 */
async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  retryAttempts: number,
  fetchFn: typeof fetch,
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let resp: Response;
      try {
        resp = await fetchFn(url, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (resp.status === 429 || resp.status === 503) {
        const retryAfter = resp.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2 ** attempt * 1000;
        await sleep(waitMs);
        continue;
      }

      if (!resp.ok) {
        throw new Error(`arxiv API returned HTTP ${resp.status} for URL: ${url}`);
      }

      return await resp.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retryAttempts - 1) {
        await sleep(2 ** attempt * 1000);
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url} after ${retryAttempts} attempts`);
}

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

interface AtomEntry {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  published?: unknown;
  updated?: unknown;
  author?: unknown;
  category?: unknown;
  link?: unknown;
}

interface AtomFeed {
  feed?: {
    entry?: AtomEntry | AtomEntry[];
  };
}

/**
 * Parse the atom XML text from arxiv into ArxivPaper[].
 * Drops entries missing required fields (with console.warn) rather than throwing.
 */
function parseAtomXml(xml: string, sourceUrl: string): ArxivPaper[] {
  let parsed: AtomFeed;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (tagName) => tagName === 'entry' || tagName === 'author' || tagName === 'category' || tagName === 'link',
      parseTagValue: true,
      trimValues: true,
    });
    parsed = parser.parse(xml) as AtomFeed;
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    throw new Error(`arxiv XML parse error at ${sourceUrl}: ${hint} — check that the response is valid Atom XML`);
  }

  const feed = parsed?.feed;
  if (!feed) {
    // Malformed — no <feed> root
    throw new Error(`arxiv XML parse error at ${sourceUrl}: no <feed> root element found — check that the response is valid Atom XML`);
  }

  const rawEntries = feed.entry;
  if (!rawEntries) {
    return [];
  }

  const entries: AtomEntry[] = Array.isArray(rawEntries) ? rawEntries : [rawEntries];
  const papers: ArxivPaper[] = [];

  for (const entry of entries) {
    // --- id ---
    const rawId = typeof entry.id === 'string' ? entry.id.trim() : '';
    if (!rawId) {
      console.warn('[arxiv-fetcher] Dropping entry: missing <id>');
      continue;
    }
    // e.g. "http://arxiv.org/abs/2605.12345v1" → "2605.12345"
    const idMatch = rawId.match(/\/abs\/(\d{4}\.\d{4,6})(v\d+)?$/);
    if (!idMatch) {
      console.warn(`[arxiv-fetcher] Dropping entry: cannot parse arxivId from id="${rawId}"`);
      continue;
    }
    const baseId = idMatch[1];
    const versionSuffix = idMatch[2] ?? '';
    const arxivId = baseId + versionSuffix; // e.g. "2605.12345v1"

    // --- title ---
    const rawTitle = entry.title;
    const title = typeof rawTitle === 'string' ? rawTitle.trim() : (rawTitle != null ? String(rawTitle).trim() : '');
    if (!title) {
      console.warn(`[arxiv-fetcher] Dropping entry ${arxivId}: missing <title>`);
      continue;
    }

    // --- summary (abstract) ---
    const rawSummary = entry.summary;
    if (rawSummary == null || rawSummary === '') {
      console.warn(`[arxiv-fetcher] Dropping entry ${arxivId}: missing <summary>`);
      continue;
    }
    const abstract = String(rawSummary).trim();

    // --- published / updated ---
    const rawPublished = entry.published;
    const rawUpdated = entry.updated;
    if (!rawPublished || !rawUpdated) {
      console.warn(`[arxiv-fetcher] Dropping entry ${arxivId}: missing <published> or <updated>`);
      continue;
    }
    const publishedAt = String(rawPublished).trim();
    const updatedAt = String(rawUpdated).trim();

    // --- authors ---
    const rawAuthor = entry.author;
    const authorArr = rawAuthor == null ? [] : (Array.isArray(rawAuthor) ? rawAuthor : [rawAuthor]);
    const authors: string[] = authorArr
      .map((a: unknown) => {
        if (typeof a === 'object' && a !== null && 'name' in a) {
          return String((a as Record<string, unknown>).name).trim();
        }
        return '';
      })
      .filter(Boolean);

    // --- categories ---
    const rawCategory = entry.category;
    const categoryArr = rawCategory == null ? [] : (Array.isArray(rawCategory) ? rawCategory : [rawCategory]);
    const categories: string[] = categoryArr
      .map((c: unknown) => {
        if (typeof c === 'object' && c !== null && '@_term' in c) {
          return String((c as Record<string, unknown>)['@_term']).trim();
        }
        return '';
      })
      .filter(Boolean);

    // --- links ---
    const rawLink = entry.link;
    const linkArr = rawLink == null ? [] : (Array.isArray(rawLink) ? rawLink : [rawLink]);
    let pdfUrl = '';
    let absUrl = '';
    for (const l of linkArr) {
      if (typeof l === 'object' && l !== null) {
        const lObj = l as Record<string, unknown>;
        const rel = String(lObj['@_rel'] ?? '');
        const href = String(lObj['@_href'] ?? '');
        const title = String(lObj['@_title'] ?? '');
        if (title === 'pdf' || rel === 'related') {
          // Normalise PDF URL: ensure it ends with .pdf
          pdfUrl = href.endsWith('.pdf') ? href : href + '.pdf';
        } else if (rel === 'alternate') {
          absUrl = href;
        }
      }
    }
    // Fallback: construct URLs from baseId
    if (!absUrl) absUrl = `http://arxiv.org/abs/${arxivId}`;
    if (!pdfUrl) pdfUrl = `http://arxiv.org/pdf/${arxivId}.pdf`;

    papers.push({
      arxivId,
      title,
      authors,
      abstract,
      categories,
      publishedAt,
      updatedAt,
      pdfUrl,
      absUrl,
    });
  }

  return papers;
}

/**
 * Deduplicate by base arxivId (strip version), keeping the entry with the most recent updatedAt.
 */
function deduplicate(papers: ArxivPaper[]): ArxivPaper[] {
  const map = new Map<string, ArxivPaper>();
  for (const paper of papers) {
    const baseId = paper.arxivId.replace(/v\d+$/, '');
    const existing = map.get(baseId);
    if (!existing || paper.updatedAt > existing.updatedAt) {
      map.set(baseId, paper);
    }
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// createFetcher
// ---------------------------------------------------------------------------

export function createFetcher(opts?: FetcherOptions): Fetcher {
  const baseUrl = opts?.baseUrl ?? DEFAULT_BASE_URL;
  const maxResultsPerRequest = opts?.maxResultsPerRequest ?? DEFAULT_MAX_RESULTS;
  const cacheDir = opts?.cacheDir ?? DEFAULT_CACHE_DIR;
  const noCache = opts?.noCache ?? false;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryAttempts = opts?.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;

  // Allow tests to inject a custom fetch function via a symbol on globalThis
  // (not part of the public API; only used in tests).
  function getFetch(): typeof fetch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).__arxivFetchOverride ?? fetch;
  }

  async function fetchPage(
    searchQuery: string,
    start: number,
  ): Promise<{ xml: string; url: string }> {
    const params = new URLSearchParams({
      search_query: searchQuery,
      start: String(start),
      max_results: String(maxResultsPerRequest),
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });
    const url = `${baseUrl}?${params.toString()}`;
    const xml = await fetchWithRetry(url, timeoutMs, retryAttempts, getFetch());
    return { xml, url };
  }

  function getCachedXml(key: string): string | null {
    if (noCache) return null;
    const path = join(cacheDir, `${key}.xml`);
    if (!existsSync(path)) return null;
    try {
      const stat = statSync(path);
      if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
      return readFileSync(path, 'utf8');
    } catch {
      return null;
    }
  }

  function setCachedXml(key: string, xml: string): void {
    if (noCache) return;
    try {
      if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
      writeFileSync(join(cacheDir, `${key}.xml`), xml, 'utf8');
    } catch (err) {
      console.warn(`[arxiv-fetcher] Cache write failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    async fetchMonth(month: string, categories: string[]): Promise<ArxivPaper[]> {
      const { start: monthStart, end: monthEnd } = monthBounds(month);

      const searchQuery = categories.map((c) => `cat:${c}`).join('+OR+');

      const allPapers: ArxivPaper[] = [];
      let page = 0;
      let done = false;

      while (!done) {
        const key = cacheKey(month, categories, page);
        let xml: string;
        let url: string;

        const cached = getCachedXml(key);
        if (cached !== null) {
          xml = cached;
          url = `${baseUrl} (cached page ${page})`;
        } else {
          const result = await fetchPage(searchQuery, page * maxResultsPerRequest);
          xml = result.xml;
          url = result.url;
          setCachedXml(key, xml);
          // Polite delay between real network pages (not on first page, not on cached)
          if (page > 0) {
            await sleep(INTER_PAGE_SLEEP_MS);
          }
        }

        const pagePapers = parseAtomXml(xml, url);
        console.log(`[arxiv-fetcher] page=${page} query="${searchQuery}" results=${pagePapers.length}`);

        if (pagePapers.length === 0) {
          // Exhausted results
          done = true;
        } else {
          // Since sorted descending by submittedDate, check if the last entry is older than monthStart
          // Include entries from this page that fall within range
          let foundOlderThanStart = false;
          for (const paper of pagePapers) {
            const pub = new Date(paper.publishedAt);
            if (pub < monthStart) {
              foundOlderThanStart = true;
              // Don't break — still add papers from this page that are in range
            } else {
              allPapers.push(paper);
            }
          }

          if (foundOlderThanStart || pagePapers.length < maxResultsPerRequest) {
            // We hit papers older than our window, or we got fewer than requested (last page)
            done = true;
          } else {
            page++;
          }
        }
      }

      // Date filter: only include papers in [monthStart, monthEnd]
      const filtered = allPapers.filter((p) => {
        const pub = new Date(p.publishedAt);
        return pub >= monthStart && pub <= monthEnd;
      });

      // Deduplicate by base arxivId
      const deduped = deduplicate(filtered);

      // Sort by publishedAt ASC for stable downstream ordering
      deduped.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

      console.log(`[arxiv-fetcher] month=${month} fetched=${allPapers.length} filtered=${filtered.length} deduped=${deduped.length}`);

      return deduped;
    },
  };
}
