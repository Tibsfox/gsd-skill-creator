/**
 * fetcher.test.ts — 10 unit tests, no network access.
 * All network calls are either avoided (cache) or intercepted via globalThis.__arxivFetchOverride.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFetcher } from './fetcher.js';
import type { ArxivPaper } from './types.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const FIXTURE_PATH = join(
  new URL('.', import.meta.url).pathname,
  '__fixtures__/arxiv-sample.xml',
);

function fixtureXml(): string {
  return readFileSync(FIXTURE_PATH, 'utf8');
}

/** Build a minimal valid arxiv Atom XML with the given entries injected. */
function buildAtomXml(entries: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>0</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <opensearch:itemsPerPage>1000</opensearch:itemsPerPage>
  ${entries}
</feed>`;
}

/** Build a single valid entry string. */
function buildEntry(
  id: string,
  title: string,
  summary: string | null,
  published: string,
  updated: string,
  authors: string[] = ['Test Author'],
  categories: string[] = ['cs.AI'],
): string {
  const authorXml = authors.map((a) => `<author><name>${a}</name></author>`).join('\n  ');
  const categoryXml = categories.map((c) => `<category term="${c}" scheme="http://arxiv.org/schemas/atom"/>`).join('\n  ');
  const summaryXml = summary !== null ? `<summary>${summary}</summary>` : '';
  return `<entry>
    <id>http://arxiv.org/abs/${id}</id>
    <updated>${updated}</updated>
    <published>${published}</published>
    <title>${title}</title>
    ${summaryXml}
    ${authorXml}
    ${categoryXml}
    <link href="http://arxiv.org/abs/${id}" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/${id}" rel="related" type="application/pdf"/>
  </entry>`;
}

// ---------------------------------------------------------------------------
// Setup: intercept fetch; use a temp cache dir per test
// ---------------------------------------------------------------------------

const TEMP_CACHE = join(
  new URL('.', import.meta.url).pathname,
  '__fixtures__/__test-cache__',
);

function makeMockFetch(xml: string): typeof fetch {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => xml,
    headers: new Headers(),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  // Reset any fetch override before each test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).__arxivFetchOverride;
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).__arxivFetchOverride;
});

// ---------------------------------------------------------------------------
// Test 1: Parses 5-entry fixture into the right shape; 4 papers returned (entry 4 dropped)
// ---------------------------------------------------------------------------
describe('fetcher unit tests', () => {
  it('test 1: parses fixture XML — 4 papers returned (entry 4 missing summary is dropped)', async () => {
    const xml = fixtureXml();
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true, maxResultsPerRequest: 1000 });
    // Use month=2026-05 and request all categories from the fixture
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI', 'cs.CL', 'cs.LG', 'cs.MA']);

    // Entry 4 (missing summary) is dropped; entry 2 (April) is filtered out by date
    // So we expect entries 1, 3, 5 → 3 papers from fixture in May
    expect(papers.length).toBe(3);

    // Check shape of first paper
    const p0 = papers[0];
    expect(p0).toHaveProperty('arxivId');
    expect(p0).toHaveProperty('title');
    expect(p0).toHaveProperty('authors');
    expect(p0).toHaveProperty('abstract');
    expect(p0).toHaveProperty('categories');
    expect(p0).toHaveProperty('publishedAt');
    expect(p0).toHaveProperty('updatedAt');
    expect(p0).toHaveProperty('pdfUrl');
    expect(p0).toHaveProperty('absUrl');

    // Verify all returned papers are in May
    for (const paper of papers) {
      const pub = new Date(paper.publishedAt);
      expect(pub.getUTCFullYear()).toBe(2026);
      expect(pub.getUTCMonth()).toBe(4); // 0-indexed May
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2: Date filter excludes the April entry when month=2026-05
  // ---------------------------------------------------------------------------
  it('test 2: date filter excludes the April 2026 entry when month=2026-05', async () => {
    const xml = fixtureXml();
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI', 'cs.CL', 'cs.LG', 'cs.MA']);

    const aprilPaper = papers.find((p) => p.arxivId.startsWith('2604.'));
    expect(aprilPaper).toBeUndefined();

    // The cs.CL paper 2604.99999 from April should be absent
    const byId = papers.find((p) => p.arxivId.includes('99999'));
    expect(byId).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Test 3: Date filter includes the boundary entry at 2026-05-31T23:30Z
  // ---------------------------------------------------------------------------
  it('test 3: date filter includes the boundary entry at 2026-05-31T23:30Z', async () => {
    const xml = fixtureXml();
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI', 'cs.CL', 'cs.LG', 'cs.MA', 'cs.SE']);

    const boundary = papers.find((p) => p.publishedAt === '2026-05-31T23:30:00Z');
    expect(boundary).toBeDefined();
    expect(boundary?.arxivId).toContain('44444');
  });

  // ---------------------------------------------------------------------------
  // Test 4: Deduplication — keeps the entry with the later updatedAt (v2 over v1)
  // ---------------------------------------------------------------------------
  it('test 4: deduplicates same paper v1/v2 — keeps v2 by updatedAt', async () => {
    const v1 = buildEntry(
      '2605.55555v1',
      'Dedup Test Paper',
      'Abstract text.',
      '2026-05-01T10:00:00Z',
      '2026-05-01T10:00:00Z',
    );
    const v2 = buildEntry(
      '2605.55555v2',
      'Dedup Test Paper Revised',
      'Revised abstract text.',
      '2026-05-01T10:00:00Z',
      '2026-05-10T14:00:00Z', // later updatedAt
    );
    const xml = buildAtomXml(v1 + v2);
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI']);

    // Should be deduplicated to 1
    const deduped = papers.filter((p) => p.arxivId.includes('55555'));
    expect(deduped.length).toBe(1);
    // Should keep v2 (later updatedAt)
    expect(deduped[0].arxivId).toBe('2605.55555v2');
    expect(deduped[0].abstract).toContain('Revised');
  });

  // ---------------------------------------------------------------------------
  // Test 5: Sorted by publishedAt ASC in output
  // ---------------------------------------------------------------------------
  it('test 5: output is sorted by publishedAt ASC', async () => {
    const xml = fixtureXml();
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI', 'cs.CL', 'cs.LG', 'cs.MA']);

    for (let i = 1; i < papers.length; i++) {
      expect(papers[i].publishedAt >= papers[i - 1].publishedAt).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 6: Caches parsed result; second call uses cache (zero network calls)
  // ---------------------------------------------------------------------------
  it('test 6: caches result; second call makes zero network calls', async () => {
    const xml = buildAtomXml(
      buildEntry('2605.77777v1', 'Cache Test Paper', 'Some abstract.', '2026-05-05T10:00:00Z', '2026-05-05T10:00:00Z'),
    );
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({
      cacheDir: TEMP_CACHE,
      maxResultsPerRequest: 1000,
    });

    // First call — hits network
    const result1 = await fetcher.fetchMonth('2026-05', ['cs.AI']);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call — should hit cache, zero new network calls
    const result2 = await fetcher.fetchMonth('2026-05', ['cs.AI']);
    expect(mockFetch).toHaveBeenCalledTimes(1); // still 1, no additional call

    expect(result1).toEqual(result2);
  });

  // ---------------------------------------------------------------------------
  // Test 7: noCache: true skips the cache
  // ---------------------------------------------------------------------------
  it('test 7: noCache=true skips cache and always hits network', async () => {
    const xml = buildAtomXml(
      buildEntry('2605.88888v1', 'NoCache Paper', 'Abstract.', '2026-05-06T08:00:00Z', '2026-05-06T08:00:00Z'),
    );
    const mockFetch = makeMockFetch(xml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });

    await fetcher.fetchMonth('2026-05', ['cs.AI']);
    await fetcher.fetchMonth('2026-05', ['cs.AI']);

    // Both calls should have hit the network
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // Test 8: Malformed XML throws a clear error including the URL and a hint
  // ---------------------------------------------------------------------------
  it('test 8: malformed XML throws a clear error with URL and hint', async () => {
    const malformedXml = `<?xml version="1.0"?><feed><entry><unclosed>`;
    const mockFetch = makeMockFetch(malformedXml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });

    // fast-xml-parser is lenient; test a feed with no <feed> root element at all
    const noFeedXml = `<?xml version="1.0"?><notafeed><something/></notafeed>`;
    const mockFetch2 = makeMockFetch(noFeedXml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch2;

    await expect(fetcher.fetchMonth('2026-05', ['cs.AI'])).rejects.toThrow(
      /arxiv XML parse error/,
    );
    await expect(fetcher.fetchMonth('2026-05', ['cs.AI'])).rejects.toThrow(
      /check that the response is valid Atom XML/,
    );
  });

  // ---------------------------------------------------------------------------
  // Test 9: Empty response (<feed> with no entries) returns [] without error
  // ---------------------------------------------------------------------------
  it('test 9: empty feed returns [] without error', async () => {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>0</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <opensearch:itemsPerPage>1000</opensearch:itemsPerPage>
</feed>`;
    const mockFetch = makeMockFetch(emptyXml);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ noCache: true });
    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI']);

    expect(papers).toEqual([]);
    expect(Array.isArray(papers)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Test 10: Custom baseUrl is honored
  // ---------------------------------------------------------------------------
  it('test 10: custom baseUrl is honored in the request URL', async () => {
    const customBase = 'http://custom-arxiv-mirror.example.com/api/query';
    const xml = buildAtomXml(
      buildEntry('2605.12999v1', 'Custom Base Paper', 'Abstract.', '2026-05-07T09:00:00Z', '2026-05-07T09:00:00Z'),
    );
    const mockFetch = vi.fn(async (url: string | Request | URL) => ({
      ok: true,
      status: 200,
      text: async () => xml,
      headers: new Headers(),
    })) as unknown as typeof fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__arxivFetchOverride = mockFetch;

    const fetcher = createFetcher({ baseUrl: customBase, noCache: true });
    await fetcher.fetchMonth('2026-05', ['cs.AI']);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = String((mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(calledUrl.startsWith(customBase)).toBe(true);
  });
});
