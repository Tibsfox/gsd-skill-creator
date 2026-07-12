/**
 * Semantic Scholar / DBLP / PubMed adapter test suite.
 *
 * Tests response PARSING for the CS + biomedical index adapters. All fetch
 * calls are mocked -- no real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { SemanticScholarAdapter } from '../adapters/semantic-scholar.js';
import { DblpAdapter } from '../adapters/dblp.js';
import { PubMedAdapter } from '../adapters/pubmed.js';
import type { RawCitation } from '../../types/index.js';

// ============================================================================
// Test fixtures
// ============================================================================

const NOW = '2026-02-25T12:00:00Z';
const TEST_CACHE_DIR = join(process.cwd(), '.test-cache-index-adapters');

function makeRawCitation(overrides: Partial<RawCitation> = {}): RawCitation {
  return {
    text: 'Vaswani, A. (2017). Attention Is All You Need.',
    source_document: 'docs/foundations/transformers.md',
    extraction_method: 'bibliography',
    confidence: 0.9,
    timestamp: NOW,
    ...overrides,
  };
}

function mockFetch(response: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

/** URL-aware mock: returns esearch vs esummary responses for PubMed's two-step flow. */
function mockPubMedFetch(
  esearchResponse: unknown,
  esummaryResponse: unknown,
): typeof fetch {
  return vi.fn().mockImplementation((url: string) => {
    const body = url.includes('esummary') ? esummaryResponse : esearchResponse;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    });
  }) as unknown as typeof fetch;
}

// ============================================================================
// Test setup
// ============================================================================

beforeEach(() => {
  if (existsSync(TEST_CACHE_DIR)) rmSync(TEST_CACHE_DIR, { recursive: true });
  mkdirSync(TEST_CACHE_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_CACHE_DIR)) rmSync(TEST_CACHE_DIR, { recursive: true });
});

// ============================================================================
// Semantic Scholar
// ============================================================================

describe('SemanticScholarAdapter', () => {
  it('has the semantic-scholar source api name', () => {
    const adapter = new SemanticScholarAdapter({ cacheDir: TEST_CACHE_DIR });
    expect(adapter.name).toBe('semantic-scholar');
  });

  it('resolves a DOI to a CitedWork with confidence 0.99', async () => {
    const doi = '10.5555/attention';
    const fetchFn = mockFetch({
      paperId: 'abc123',
      externalIds: { DOI: doi },
      title: 'Attention Is All You Need',
      year: 2017,
      authors: [{ authorId: '1', name: 'Ashish Vaswani' }],
      journal: { name: 'NeurIPS', volume: '30', pages: '5998-6008' },
      publicationTypes: ['Conference'],
      openAccessPdf: { url: 'https://example.org/attention.pdf' },
    });
    const adapter = new SemanticScholarAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const result = await adapter.resolve(makeRawCitation({ text: 'See 10.5555/attention' }));

    expect(result).not.toBeNull();
    expect(result!.doi).toBe(doi);
    expect(result!.confidence).toBe(0.99);
    expect(result!.source_api).toBe('semantic-scholar');
    expect(result!.title).toBe('Attention Is All You Need');
    expect(result!.authors[0].family).toBe('Vaswani');
    expect(result!.authors[0].given).toBe('Ashish');
    expect(result!.type).toBe('conference');
    expect(result!.journal).toBe('NeurIPS');
  });

  it('searches by query and parses the data array', async () => {
    const fetchFn = mockFetch({
      total: 1,
      offset: 0,
      data: [
        {
          paperId: 'W789',
          title: 'Attention Is All You Need',
          year: 2017,
          authors: [{ name: 'Ashish Vaswani' }],
          publicationTypes: ['JournalArticle'],
        },
      ],
    });
    const adapter = new SemanticScholarAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('attention is all you need');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Attention Is All You Need');
    expect(results[0].type).toBe('article');
    expect(results[0].source_api).toBe('semantic-scholar');
  });
});

// ============================================================================
// DBLP
// ============================================================================

describe('DblpAdapter', () => {
  it('has the dblp source api name', () => {
    const adapter = new DblpAdapter({ cacheDir: TEST_CACHE_DIR });
    expect(adapter.name).toBe('dblp');
  });

  it('parses a search hit array into CitedWorks', async () => {
    const fetchFn = mockFetch({
      result: {
        hits: {
          hit: [
            {
              info: {
                authors: {
                  author: [
                    { '@pid': '1', text: 'Ashish Vaswani' },
                    { '@pid': '2', text: 'Noam Shazeer' },
                  ],
                },
                title: 'Attention Is All You Need.',
                venue: 'NeurIPS',
                volume: '30',
                pages: '5998-6008',
                year: '2017',
                type: 'Conference and Workshop Papers',
                key: 'conf/nips/VaswaniSPUJGKP17',
                doi: '10.5555/attention',
                ee: 'https://example.org/attention',
              },
            },
          ],
        },
      },
    });
    const adapter = new DblpAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('attention is all you need');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Attention Is All You Need');
    expect(results[0].authors).toHaveLength(2);
    expect(results[0].authors[0].family).toBe('Vaswani');
    expect(results[0].doi).toBe('10.5555/attention');
    expect(results[0].type).toBe('conference');
    expect(results[0].source_api).toBe('dblp');
  });

  it('handles a single hit returned as an object (not array)', async () => {
    const fetchFn = mockFetch({
      result: {
        hits: {
          hit: {
            info: {
              authors: { author: { '@pid': '1', text: 'Donald E. Knuth' } },
              title: 'The Art of Computer Programming',
              year: '1997',
              type: 'Books and Theses',
              key: 'books/aw/Knuth97',
            },
          },
        },
      },
    });
    const adapter = new DblpAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('art of computer programming');

    expect(results).toHaveLength(1);
    expect(results[0].authors).toHaveLength(1);
    expect(results[0].authors[0].family).toBe('Knuth');
    expect(results[0].type).toBe('book');
  });

  it('strips DBLP homonym disambiguation numbers from author names', async () => {
    const fetchFn = mockFetch({
      result: {
        hits: {
          hit: {
            info: {
              authors: { author: { '@pid': '1', text: 'Wei Wang 0001' } },
              title: 'A Paper',
              year: '2020',
              type: 'Journal Articles',
              key: 'journals/x/Wang20',
            },
          },
        },
      },
    });
    const adapter = new DblpAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('a paper');

    expect(results[0].authors[0].family).toBe('Wang');
    expect(results[0].authors[0].given).toBe('Wei');
  });
});

// ============================================================================
// PubMed
// ============================================================================

describe('PubMedAdapter', () => {
  it('has the pubmed source api name', () => {
    const adapter = new PubMedAdapter({ cacheDir: TEST_CACHE_DIR });
    expect(adapter.name).toBe('pubmed');
  });

  it('runs the esearch -> esummary flow and parses a summary', async () => {
    const fetchFn = mockPubMedFetch(
      { esearchresult: { idlist: ['33333333'], count: '1' } },
      {
        result: {
          uids: ['33333333'],
          '33333333': {
            uid: '33333333',
            title: 'CRISPR-Cas9 genome editing.',
            authors: [
              { name: 'Doudna JA', authtype: 'Author' },
              { name: 'Charpentier E', authtype: 'Author' },
            ],
            pubdate: '2014 Nov',
            articleids: [
              { idtype: 'pubmed', value: '33333333' },
              { idtype: 'doi', value: '10.1126/science.1258096' },
            ],
            fulljournalname: 'Science',
            volume: '346',
            issue: '6213',
            pages: '1258096',
            pubtype: ['Journal Article', 'Review'],
          },
        },
      },
    );
    const adapter = new PubMedAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('CRISPR-Cas9 genome editing');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('CRISPR-Cas9 genome editing');
    expect(results[0].authors).toHaveLength(2);
    expect(results[0].authors[0].family).toBe('Doudna');
    expect(results[0].authors[0].given).toBe('JA');
    expect(results[0].year).toBe(2014);
    expect(results[0].doi).toBe('10.1126/science.1258096');
    expect(results[0].journal).toBe('Science');
    expect(results[0].type).toBe('article');
    expect(results[0].source_api).toBe('pubmed');
  });

  it('resolves a DOI with high confidence', async () => {
    const fetchFn = mockPubMedFetch(
      { esearchresult: { idlist: ['33333333'] } },
      {
        result: {
          uids: ['33333333'],
          '33333333': {
            uid: '33333333',
            title: 'CRISPR-Cas9 genome editing',
            authors: [{ name: 'Doudna JA', authtype: 'Author' }],
            pubdate: '2014',
            articleids: [{ idtype: 'doi', value: '10.1126/science.1258096' }],
            fulljournalname: 'Science',
            pubtype: ['Journal Article'],
          },
        },
      },
    );
    const adapter = new PubMedAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const result = await adapter.resolve(
      makeRawCitation({ text: 'Doudna (2014). 10.1126/science.1258096' }),
    );

    expect(result).not.toBeNull();
    expect(result!.doi).toBe('10.1126/science.1258096');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('returns empty when esearch yields no ids', async () => {
    const fetchFn = mockPubMedFetch({ esearchresult: { idlist: [] } }, { result: {} });
    const adapter = new PubMedAdapter({ fetchFn, cacheDir: TEST_CACHE_DIR });

    const results = await adapter.search('no such thing');
    expect(results).toHaveLength(0);
  });
});
