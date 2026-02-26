/**
 * BibliographyFormatter, BibTeX, and APA7 format tests.
 *
 * Validates: key generation, key dedup, LaTeX escaping, entry type mapping,
 * APA7 author rules (1/2/3-20/21+), scope filtering, sorting, and the
 * formatter orchestrator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

import type { CitedWork } from '../../types/index.js';
import {
  formatBibtexEntry,
  formatBibtexBibliography,
  generateBibtexKey,
  deduplicateBibtexKeys,
  escapeLatex,
  formatApa7Entry,
  formatApa7Bibliography,
  formatApa7Authors,
  BibliographyFormatter,
} from '../index.js';
import { CitationStore } from '../../store/index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-01-01T00:00:00Z';

function makeWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: 'test-id-1',
    title: 'Progressive Relaxation Techniques',
    authors: [{ family: 'Jacobson', given: 'Edmund' }],
    year: 1938,
    type: 'book',
    source_api: 'manual',
    confidence: 1.0,
    first_seen: NOW,
    cited_by: [],
    tags: ['relaxation'],
    verified: true,
    raw_citations: [],
    ...overrides,
  };
}

function makeArticle(overrides: Partial<CitedWork> = {}): CitedWork {
  return makeWork({
    id: 'article-1',
    title: 'Efficacy of Abbreviated Progressive Muscle Relaxation',
    authors: [
      { family: 'Carlson', given: 'Charles R.' },
      { family: 'Hoyle', given: 'Rick H.' },
    ],
    year: 1993,
    type: 'article',
    journal: 'Journal of Consulting and Clinical Psychology',
    volume: '61',
    issue: '6',
    pages: '1059-1067',
    doi: '10.1037/0022-006X.61.6.1059',
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// BibTeX format tests
// ---------------------------------------------------------------------------

describe('BibTeX format', () => {
  it('formats a journal article as @article entry', () => {
    const entry = formatBibtexEntry(makeArticle());
    expect(entry).toContain('@article{');
    expect(entry).toContain('author = {Carlson, Charles R. and Hoyle, Rick H.}');
    expect(entry).toContain('journal = {Journal of Consulting and Clinical Psychology}');
    expect(entry).toContain('volume = {61}');
    expect(entry).toContain('number = {6}');
    expect(entry).toContain('pages = {1059-1067}');
    expect(entry).toContain('doi = {10.1037/0022-006X.61.6.1059}');
  });

  it('formats a book with ISBN as @book entry', () => {
    const work = makeWork({ isbn: '978-0-521-80926-9' });
    const entry = formatBibtexEntry(work);
    expect(entry).toContain('@book{');
    expect(entry).toContain('isbn = {978-0-521-80926-9}');
    expect(entry).toContain('author = {Jacobson, Edmund}');
  });

  it('generates keys as {family}{year}{word} lowercase', () => {
    const key = generateBibtexKey(makeWork());
    expect(key).toBe('jacobson1938progressive');
  });

  it('deduplicates colliding keys with a/b suffixes', () => {
    const work1 = makeWork({ id: 'w1', title: 'Progressive Methods' });
    const work2 = makeWork({ id: 'w2', title: 'Progressive Techniques' });
    // Both generate "jacobson1938progressive"
    const keyMap = deduplicateBibtexKeys([work1, work2]);
    expect(keyMap.get('w1')).toBe('jacobson1938progressivea');
    expect(keyMap.get('w2')).toBe('jacobson1938progressiveb');
  });

  it('escapes LaTeX special characters', () => {
    expect(escapeLatex('R&D')).toBe('R\\&D');
    expect(escapeLatex('100%')).toBe('100\\%');
    expect(escapeLatex('$50')).toBe('\\$50');
    expect(escapeLatex('#1')).toBe('\\#1');
    expect(escapeLatex('under_score')).toBe('under\\_score');
    expect(escapeLatex('{braces}')).toBe('\\{braces\\}');
  });

  it('maps entry types correctly', () => {
    expect(formatBibtexEntry(makeWork({ type: 'article' }))).toContain('@article{');
    expect(formatBibtexEntry(makeWork({ type: 'book' }))).toContain('@book{');
    expect(formatBibtexEntry(makeWork({ type: 'chapter' }))).toContain('@inbook{');
    expect(formatBibtexEntry(makeWork({ type: 'report' }))).toContain('@techreport{');
    expect(formatBibtexEntry(makeWork({ type: 'thesis' }))).toContain('@phdthesis{');
    expect(formatBibtexEntry(makeWork({ type: 'conference' }))).toContain('@inproceedings{');
    expect(formatBibtexEntry(makeWork({ type: 'website' }))).toContain('@misc{');
    expect(formatBibtexEntry(makeWork({ type: 'repository' }))).toContain('@misc{');
  });

  it('handles LaTeX escaping in title and author fields', () => {
    const work = makeWork({
      title: 'R&D in $100M Projects',
      authors: [{ family: 'O\'Brien', given: 'James' }],
    });
    const entry = formatBibtexEntry(work);
    expect(entry).toContain('R\\&D in \\$100M Projects');
  });
});

// ---------------------------------------------------------------------------
// APA7 format tests
// ---------------------------------------------------------------------------

describe('APA7 format', () => {
  it('formats single author correctly', () => {
    const entry = formatApa7Entry(makeWork());
    expect(entry).toMatch(/^Jacobson, E\. \(1938\)\./);
  });

  it('formats two authors with ampersand', () => {
    const entry = formatApa7Entry(makeArticle());
    expect(entry).toContain('Carlson, C. R., & Hoyle, R. H.');
  });

  it('formats 3-20 authors with all listed and ampersand', () => {
    const authors = Array.from({ length: 5 }, (_, i) => ({
      family: `Author${i + 1}`,
      given: `Given${i + 1}`,
    }));
    const entry = formatApa7Entry(makeWork({ authors }));
    expect(entry).toContain('Author1, G.');
    expect(entry).toContain('Author4, G.');
    expect(entry).toContain(', & Author5, G.');
  });

  it('formats 21+ authors with first 19, ellipsis, last', () => {
    const authors = Array.from({ length: 25 }, (_, i) => ({
      family: `Family${String(i + 1).padStart(2, '0')}`,
      given: `Given${i + 1}`,
    }));
    const formatted = formatApa7Authors(authors);
    // Should contain first 19 authors
    expect(formatted).toContain('Family01, G.');
    expect(formatted).toContain('Family19, G.');
    // Should NOT contain authors 20-24
    expect(formatted).not.toContain('Family20');
    // Should contain ellipsis and last author
    expect(formatted).toContain('...');
    expect(formatted).toContain('Family25, G.');
  });

  it('renders DOI as https://doi.org/ link', () => {
    const entry = formatApa7Entry(makeArticle());
    expect(entry).toContain('https://doi.org/10.1037/0022-006X.61.6.1059');
  });

  it('italicizes book titles but not article titles', () => {
    const bookEntry = formatApa7Entry(makeWork({ type: 'book' }));
    expect(bookEntry).toContain('*Progressive Relaxation Techniques*');

    const articleEntry = formatApa7Entry(makeArticle());
    // Article title should not be wrapped in *
    const titlePart = 'Efficacy of Abbreviated Progressive Muscle Relaxation.';
    expect(articleEntry).toContain(titlePart);
    expect(articleEntry).not.toContain(`*${titlePart}*`);
  });

  it('includes journal, volume, issue, and pages for articles', () => {
    const entry = formatApa7Entry(makeArticle());
    expect(entry).toContain('*Journal of Consulting and Clinical Psychology*');
    expect(entry).toContain('*61*');
    expect(entry).toContain('(6)');
    expect(entry).toContain('1059-1067');
  });
});

// ---------------------------------------------------------------------------
// BibliographyFormatter orchestrator tests
// ---------------------------------------------------------------------------

describe('BibliographyFormatter', () => {
  let tmpDir: string;
  let store: CitationStore;
  let formatter: BibliographyFormatter;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bib-test-'));
    store = new CitationStore(path.join(tmpDir, 'db'));
    await store.init();
    formatter = new BibliographyFormatter(store);
  });

  it('returns all works with scope "all"', async () => {
    await store.add(makeWork({ id: 'w1', tags: ['physics'] }));
    await store.add(makeArticle({ id: 'w2', tags: ['psychology'] }));

    const result = await formatter.generate({
      format: 'bibtex',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });

    expect(result).toContain('@book{');
    expect(result).toContain('@article{');
  });

  it('filters by domain tag', async () => {
    await store.add(makeWork({ id: 'w1', tags: ['physics'] }));
    await store.add(makeArticle({ id: 'w2', tags: ['psychology'] }));

    const result = await formatter.generateForDomain('physics', {
      format: 'bibtex',
      scope: 'domain',
      sortBy: 'author',
      includeUnverified: true,
    });

    expect(result).toContain('@book{');
    expect(result).not.toContain('@article{');
  });

  it('sorts by year chronologically', async () => {
    await store.add(makeWork({ id: 'w1', year: 2020 }));
    await store.add(makeArticle({ id: 'w2', year: 1993 }));

    const result = await formatter.generate({
      format: 'apa7',
      scope: 'all',
      sortBy: 'year',
      includeUnverified: true,
    });

    const idx1993 = result.indexOf('1993');
    const idx2020 = result.indexOf('2020');
    expect(idx1993).toBeLessThan(idx2020);
  });

  it('sorts by author alphabetically', async () => {
    await store.add(makeWork({ id: 'w1', authors: [{ family: 'Zimmerman', given: 'Z.' }] }));
    await store.add(makeArticle({ id: 'w2', authors: [{ family: 'Adams', given: 'A.' }] }));

    const result = await formatter.generate({
      format: 'apa7',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });

    const idxAdams = result.indexOf('Adams');
    const idxZimmerman = result.indexOf('Zimmerman');
    expect(idxAdams).toBeLessThan(idxZimmerman);
  });

  it('returns empty string for empty store', async () => {
    const result = await formatter.generate({
      format: 'bibtex',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });

    expect(result).toBe('');
  });

  it('filters unverified works when includeUnverified is false', async () => {
    await store.add(makeWork({ id: 'w1', verified: true }));
    await store.add(makeArticle({ id: 'w2', verified: false }));

    const result = await formatter.generate({
      format: 'bibtex',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: false,
    });

    expect(result).toContain('@book{');
    expect(result).not.toContain('@article{');
  });

  it('throws for unsupported format', async () => {
    await expect(
      formatter.generate({
        format: 'nonexistent' as any,
        scope: 'all',
        sortBy: 'author',
        includeUnverified: true,
      }),
    ).rejects.toThrow('Unsupported bibliography format: nonexistent');
  });
});
