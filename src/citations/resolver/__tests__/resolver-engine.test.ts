/**
 * Resolver engine test suite.
 *
 * Tests remaining adapters (NASA NTRS, GitHub, Archive.org, generic web),
 * deduplication module, and the ResolverEngine cascade orchestrator.
 * All fetch calls are mocked -- no real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { NasaNtrsAdapter } from '../adapters/nasa-ntrs.js';
import { GitHubAdapter } from '../adapters/github.js';
import { ArchiveOrgAdapter } from '../adapters/archive-org.js';
import { GenericWebAdapter } from '../adapters/generic-web.js';
import { CrossRefAdapter } from '../adapters/crossref.js';
import { OpenAlexAdapter } from '../adapters/openalex.js';
import { deduplicateCitations } from '../dedup.js';
import { ResolverEngine, type CitationStorePort } from '../resolver-engine.js';
import type { RawCitation, CitedWork } from '../../types/index.js';

// ============================================================================
// Test fixtures
// ============================================================================

const NOW = '2026-02-25T12:00:00Z';
const TEST_CACHE_DIR = join(process.cwd(), '.test-cache-resolver-engine');

function makeRawCitation(overrides: Partial<RawCitation> = {}): RawCitation {
  return {
    text: 'Knuth, D. (1997). The Art of Computer Programming.',
    source_document: 'docs/foundations/algorithms.md',
    extraction_method: 'bibliography',
    confidence: 0.92,
    timestamp: NOW,
    ...overrides,
  };
}

function makeCitedWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: 'test-work-1',
    title: 'The Art of Computer Programming',
    authors: [{ family: 'Knuth', given: 'Donald' }],
    year: 1997,
    type: 'book',
    source_api: 'crossref',
    confidence: 0.95,
    first_seen: NOW,
    cited_by: [],
    tags: [],
    raw_citations: [],
    verified: false,
    ...overrides,
  };
}

function mockFetch(response: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(typeof response === 'string' ? response : JSON.stringify(response)),
  }) as unknown as typeof fetch;
}

function mockFetchSequence(responses: Array<{ data: unknown; status?: number }>): typeof fetch {
  const fn = vi.fn();
  for (const { data, status } of responses) {
    const s = status ?? 200;
    fn.mockResolvedValueOnce({
      ok: s >= 200 && s < 300,
      status: s,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    });
  }
  return fn as unknown as typeof fetch;
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  if (existsSync(TEST_CACHE_DIR)) rmSync(TEST_CACHE_DIR, { recursive: true });
  mkdirSync(TEST_CACHE_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_CACHE_DIR)) rmSync(TEST_CACHE_DIR, { recursive: true });
});

// ============================================================================
// NASA NTRS adapter tests
// ============================================================================

describe('NasaNtrsAdapter', () => {
  it('resolves a NASA report number to a CitedWork', async () => {
    const fetchFn = mockFetch({
      results: [
        {
          id: 19700012345,
          title: 'Apollo Guidance Computer Design',
          authorAffiliations: [
            { meta: { author: { name: 'Hall, Eldon C.' } } },
          ],
          publications: [
            { publicationDate: '1969-01-01', reportNumber: 'NASA-SP-350' },
          ],
          stiType: 'SP',
          center: { name: 'Johnson Space Center' },
        },
      ],
      totalCount: 1,
    });
    const adapter = new NasaNtrsAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const citation = makeRawCitation({
      text: 'Hall, E. (1969). Apollo Guidance Computer Design. NASA-SP-350.',
    });
    const result = await adapter.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.source_api).toBe('nasa-ntrs');
    expect(result!.title).toBe('Apollo Guidance Computer Design');
    expect(result!.authors[0].family).toBe('Hall');
  });
});

// ============================================================================
// GitHub adapter tests
// ============================================================================

describe('GitHubAdapter', () => {
  it('resolves a GitHub URL to a CitedWork', async () => {
    const fetchFn = mockFetchSequence([
      {
        data: {
          full_name: 'torvalds/linux',
          name: 'linux',
          description: 'Linux kernel source tree',
          html_url: 'https://github.com/torvalds/linux',
          owner: { login: 'torvalds' },
          created_at: '2011-09-04T22:48:12Z',
          topics: ['kernel', 'os'],
        },
      },
      { data: '', status: 404 }, // No CITATION.cff
    ]);
    const adapter = new GitHubAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const citation = makeRawCitation({
      text: 'Linux kernel. https://github.com/torvalds/linux',
    });
    const result = await adapter.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.source_api).toBe('github');
    expect(result!.type).toBe('repository');
    expect(result!.title).toBe('linux');
    expect(result!.url).toBe('https://github.com/torvalds/linux');
  });

  it('parses CITATION.cff when available', async () => {
    const cffContent = [
      'title: My Research Tool',
      'doi: 10.5281/zenodo.1234',
      'date-released: 2023-06-15',
      'authors:',
      '  - family-names: Smith',
      '    given-names: Jane',
      '    orcid: https://orcid.org/0000-0001-2345-6789',
      '  - family-names: Doe',
      '    given-names: John',
    ].join('\n');

    const fetchFn = mockFetchSequence([
      {
        data: {
          full_name: 'smith/tool',
          name: 'tool',
          html_url: 'https://github.com/smith/tool',
          owner: { login: 'smith' },
          created_at: '2023-01-01T00:00:00Z',
          topics: [],
        },
      },
      { data: cffContent }, // CITATION.cff content
    ]);
    const adapter = new GitHubAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const citation = makeRawCitation({
      text: 'Smith (2023). My Research Tool. https://github.com/smith/tool',
    });
    const result = await adapter.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('My Research Tool');
    expect(result!.doi).toBe('10.5281/zenodo.1234');
    expect(result!.authors[0].family).toBe('Smith');
    expect(result!.authors[0].given).toBe('Jane');
    expect(result!.authors.length).toBe(2);
    expect(result!.confidence).toBe(0.95);
  });
});

// ============================================================================
// Archive.org adapter tests
// ============================================================================

describe('ArchiveOrgAdapter', () => {
  it('resolves a URL via Wayback Machine', async () => {
    const fetchFn = mockFetch({
      url: 'https://example.com/old-page',
      archived_snapshots: {
        closest: {
          status: '200',
          available: true,
          url: 'https://web.archive.org/web/20200101/https://example.com/old-page',
          timestamp: '20200101120000',
        },
      },
    });
    const adapter = new ArchiveOrgAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const citation = makeRawCitation({
      text: 'Reference material at https://example.com/old-page',
    });
    const result = await adapter.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.source_api).toBe('archive-org');
    expect(result!.type).toBe('website');
    expect(result!.url).toContain('web.archive.org');
    expect(result!.confidence).toBe(0.70);
  });
});

// ============================================================================
// Generic web adapter tests
// ============================================================================

describe('GenericWebAdapter', () => {
  it('extracts minimal metadata from citation text', async () => {
    const adapter = new GenericWebAdapter({ cacheDir: TEST_CACHE_DIR });

    const citation = makeRawCitation({
      text: 'Smith, J. (2020). "Introduction to Testing". Publisher Corp.',
    });
    const result = await adapter.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.source_api).toBe('extracted');
    expect(result!.title).toBe('Introduction to Testing');
    expect(result!.confidence).toBeLessThanOrEqual(0.60);
    expect(result!.confidence).toBeGreaterThan(0);
    expect(result!.tags).toContain('extracted');
  });
});

// ============================================================================
// Deduplication tests
// ============================================================================

describe('deduplicateCitations', () => {
  it('merges duplicates with same DOI', () => {
    const citations = [
      makeRawCitation({ text: 'Smith 2020. 10.1234/test', confidence: 0.80 }),
      makeRawCitation({ text: 'Smith, J. 10.1234/test', confidence: 0.90 }),
      makeRawCitation({ text: 'Another. doi: 10.1234/test.', confidence: 0.70 }),
      makeRawCitation({ text: 'Smith 2020. doi 10.1234/test info', confidence: 0.60 }),
      makeRawCitation({ text: '10.1234/test as cited by ...', confidence: 0.50 }),
    ];

    const result = deduplicateCitations(citations);

    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.90); // Highest confidence kept
  });

  it('preserves unique citations', () => {
    const citations = [
      makeRawCitation({ text: 'Knuth, D. (1997). The Art of Computer Programming.' }),
      makeRawCitation({ text: 'Shannon, C. (1948). A Mathematical Theory of Communication.' }),
      makeRawCitation({ text: 'Turing, A. (1950). Computing Machinery and Intelligence.' }),
    ];

    const result = deduplicateCitations(citations);

    expect(result).toHaveLength(3);
  });
});

// ============================================================================
// ResolverEngine cascade tests
// ============================================================================

describe('ResolverEngine', () => {
  it('stops at high confidence result from first adapter', async () => {
    const crossrefFetch = mockFetch({
      status: 'ok',
      message: {
        DOI: '10.1234/test',
        title: ['The Art of Computer Programming'],
        author: [{ family: 'Knuth', given: 'Donald' }],
        'published-print': { 'date-parts': [[1997]] },
        type: 'book',
      },
    });
    const openalexFetch = vi.fn() as unknown as typeof fetch;

    const crossref = new CrossRefAdapter({ fetchFn: crossrefFetch, cacheDir: TEST_CACHE_DIR });
    const openalex = new OpenAlexAdapter({ fetchFn: openalexFetch, cacheDir: TEST_CACHE_DIR });

    const engine = new ResolverEngine([crossref, openalex]);
    const citation = makeRawCitation({ text: 'Knuth 10.1234/test' });
    const result = await engine.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(0.99);
    expect(result!.source_api).toBe('crossref');
    // OpenAlex should NOT have been called
    expect(openalexFetch).not.toHaveBeenCalled();
  });

  it('continues cascade at medium confidence and picks best', async () => {
    // CrossRef returns medium confidence (no DOI match, partial title)
    const crossrefFetch = mockFetch({
      status: 'ok',
      message: {
        items: [
          {
            title: ['Different Title About Similar Topic'],
            author: [{ family: 'Knuth', given: 'Donald' }],
            'published-print': { 'date-parts': [[1997]] },
            type: 'book',
          },
        ],
        'total-results': 1,
      },
    });
    // OpenAlex returns high confidence (DOI match)
    const openalexFetch = mockFetch({
      results: [
        {
          id: 'W123',
          doi: 'https://doi.org/10.9999/exact',
          title: 'The Art of Computer Programming',
          authorships: [{ author: { display_name: 'Donald Knuth' }, institutions: [] }],
          publication_year: 1997,
          type: 'book',
        },
      ],
      meta: { count: 1 },
    });

    const crossref = new CrossRefAdapter({ fetchFn: crossrefFetch, cacheDir: TEST_CACHE_DIR });
    const openalex = new OpenAlexAdapter({ fetchFn: openalexFetch, cacheDir: TEST_CACHE_DIR });

    const engine = new ResolverEngine([crossref, openalex]);
    const citation = makeRawCitation({
      text: 'Knuth, D. (1997). The Art of Computer Programming.',
    });
    const result = await engine.resolve(citation);

    expect(result).not.toBeNull();
    // OpenAlex was tried and found DOI-less text match
    expect(openalexFetch).toHaveBeenCalled();
  });

  it('returns null when all adapters return low confidence', async () => {
    const fetchFn = mockFetch({
      status: 'ok',
      message: { items: [], 'total-results': 0 },
    });

    const crossref = new CrossRefAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });
    const engine = new ResolverEngine([crossref]);

    const citation = makeRawCitation({ text: 'Some obscure citation with no match' });
    const result = await engine.resolve(citation);

    expect(result).toBeNull();
  });

  it('resolves a batch with correct resolved/unresolved split', async () => {
    // First citation: resolvable with DOI
    const crossrefFetch = mockFetchSequence([
      // First resolve: DOI match
      {
        data: {
          status: 'ok',
          message: {
            DOI: '10.1234/found',
            title: ['Found Paper'],
            author: [{ family: 'Smith', given: 'J.' }],
            'published-print': { 'date-parts': [[2020]] },
            type: 'journal-article',
          },
        },
      },
      // Second resolve: empty results
      {
        data: { status: 'ok', message: { items: [], 'total-results': 0 } },
      },
      // Third resolve: DOI match
      {
        data: {
          status: 'ok',
          message: {
            DOI: '10.5678/also-found',
            title: ['Another Paper'],
            author: [{ family: 'Doe', given: 'A.' }],
            'published-print': { 'date-parts': [[2021]] },
            type: 'journal-article',
          },
        },
      },
    ]);

    const crossref = new CrossRefAdapter({ fetchFn: crossrefFetch, cacheDir: TEST_CACHE_DIR });
    const engine = new ResolverEngine([crossref]);

    const citations = [
      makeRawCitation({ text: 'Smith 2020. 10.1234/found' }),
      makeRawCitation({ text: 'Unknown obscure reference' }),
      makeRawCitation({ text: 'Doe 2021. 10.5678/also-found' }),
    ];

    const result = await engine.resolveBatch(citations);

    expect(result.resolved.length).toBe(2);
    expect(result.unresolved.length).toBe(1);
    expect(result.stats.total_attempted).toBe(3);
    expect(result.stats.resolved_count).toBe(2);
  });

  it('checks local store before trying adapters', async () => {
    const storedWork = makeCitedWork({
      doi: '10.1234/cached',
      confidence: 0.95,
    });

    const store: CitationStorePort = {
      findByDoi: vi.fn().mockResolvedValue(storedWork),
      findByIsbn: vi.fn().mockResolvedValue(null),
      findByTitle: vi.fn().mockResolvedValue([]),
    };

    const fetchFn = vi.fn() as unknown as typeof fetch;
    const crossref = new CrossRefAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });
    const engine = new ResolverEngine([crossref], { store });

    const citation = makeRawCitation({ text: 'See 10.1234/cached for details' });
    const result = await engine.resolve(citation);

    expect(result).not.toBeNull();
    expect(result!.doi).toBe('10.1234/cached');
    // Adapter should NOT have been called since store returned high confidence
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('enforces SAFE-01: adapters return metadata only, no full text', async () => {
    // Verify that resolved works don't contain full text content
    const fetchFn = mockFetch({
      status: 'ok',
      message: {
        DOI: '10.1234/safe',
        title: ['A Paywalled Paper'],
        author: [{ family: 'Author', given: 'Test' }],
        'published-print': { 'date-parts': [[2023]] },
        type: 'journal-article',
        // CrossRef response may include abstract but NOT full text
        abstract: '<p>This is an abstract.</p>',
      },
    });

    const crossref = new CrossRefAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });
    const engine = new ResolverEngine([crossref]);

    const citation = makeRawCitation({ text: 'Author 10.1234/safe' });
    const result = await engine.resolve(citation);

    expect(result).not.toBeNull();
    // CitedWork schema has no 'content' or 'fullText' field
    expect(result!).not.toHaveProperty('content');
    expect(result!).not.toHaveProperty('fullText');
    expect(result!).not.toHaveProperty('abstract');
    // Only metadata fields present
    expect(result!.title).toBeDefined();
    expect(result!.authors).toBeDefined();
    expect(result!.doi).toBeDefined();
  });
});
