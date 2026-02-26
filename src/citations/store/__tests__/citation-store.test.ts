/**
 * Citation store test suite.
 *
 * Validates JSONL-backed CitationStore: CRUD operations, deduplication
 * by DOI/ISBN/title similarity, index lookups, compaction, export/import,
 * unresolved queue, and index rebuild. Each test uses an isolated temp
 * directory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  CitationStore,
  normalizeTitle,
  titleSimilarity,
  generateCitationId,
} from '../citation-db.js';
import type { CitedWork, RawCitation } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-02-25T12:00:00Z';

function makeWork(overrides: Partial<CitedWork> = {}): CitedWork {
  const base: CitedWork = {
    id: '',
    title: 'The Art of Computer Programming',
    authors: [{ family: 'Knuth', given: 'Donald' }],
    year: 1997,
    doi: '10.1234/taocp',
    type: 'book',
    source_api: 'crossref',
    confidence: 0.95,
    first_seen: NOW,
    cited_by: [{
      artifact_type: 'documentation',
      artifact_path: 'docs/foundations/algorithms.md',
      artifact_name: 'Algorithm Foundations',
      timestamp: NOW,
    }],
    tags: ['algorithms', 'computer-science'],
    verified: true,
    raw_citations: [{
      text: 'Knuth, D. (1997). The Art of Computer Programming.',
      source_document: 'docs/foundations/algorithms.md',
      extraction_method: 'bibliography',
      confidence: 0.92,
      timestamp: NOW,
    }],
    ...overrides,
  };
  // Generate ID if not explicitly set
  if (!base.id) {
    base.id = generateCitationId(base.title, base.authors[0].family, base.year);
  }
  return base;
}

function makeRawCitation(overrides: Partial<RawCitation> = {}): RawCitation {
  return {
    text: 'Some unresolved citation text',
    source_document: 'docs/test.md',
    extraction_method: 'narrative',
    confidence: 0.5,
    timestamp: NOW,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let tmpDir: string;
let store: CitationStore;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-store-test-'));
  store = new CitationStore(tmpDir);
  await store.init();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CitationStore', () => {
  // 1. Add and retrieve
  it('adds and retrieves a CitedWork by ID', async () => {
    const work = makeWork();
    const id = await store.add(work);
    const retrieved = await store.get(id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.title).toBe('The Art of Computer Programming');
    expect(retrieved!.authors[0].family).toBe('Knuth');
    expect(retrieved!.year).toBe(1997);
  });

  // 2. Dedup by DOI
  it('deduplicates by DOI and merges provenance', async () => {
    const work1 = makeWork({ doi: '10.1234/shared-doi' });
    const work2 = makeWork({
      doi: '10.1234/shared-doi',
      title: 'Different Title Entirely',
      cited_by: [{
        artifact_type: 'skill',
        artifact_path: 'skills/test.md',
        artifact_name: 'Test Skill',
        timestamp: NOW,
      }],
      raw_citations: [{
        text: 'A different raw citation text.',
        source_document: 'skills/test.md',
        extraction_method: 'inline-apa',
        confidence: 0.8,
        timestamp: NOW,
      }],
    });

    const id1 = await store.add(work1);
    const id2 = await store.add(work2);

    expect(id2).toBe(id1);
    expect(await store.count()).toBe(1);

    const merged = await store.get(id1);
    expect(merged!.cited_by.length).toBe(2);
    expect(merged!.raw_citations.length).toBe(2);
  });

  // 3. Dedup by ISBN
  it('deduplicates by ISBN', async () => {
    const work1 = makeWork({
      doi: undefined,
      isbn: '978-0-201-89683-1',
    });
    const work2 = makeWork({
      doi: undefined,
      isbn: '978-0-201-89683-1',
      title: 'Completely Different Title',
      cited_by: [{
        artifact_type: 'skill',
        artifact_path: 'skills/other.md',
        artifact_name: 'Other Skill',
        timestamp: NOW,
      }],
    });

    const id1 = await store.add(work1);
    const id2 = await store.add(work2);

    expect(id2).toBe(id1);
    expect(await store.count()).toBe(1);
  });

  // 4. Dedup by title similarity
  it('deduplicates by title similarity with same author and year +/-1', async () => {
    const work1 = makeWork({
      doi: undefined,
      isbn: undefined,
      title: 'The Art of Computer Programming Volume 1',
    });
    const work2 = makeWork({
      doi: undefined,
      isbn: undefined,
      title: 'The Art of Computer Programming Volume I',
      year: 1998,
    });

    const id1 = await store.add(work1);
    const id2 = await store.add(work2);

    expect(id2).toBe(id1);
    expect(await store.count()).toBe(1);
  });

  // 5. No false dedup
  it('does not falsely deduplicate different works by same author', async () => {
    const work1 = makeWork({
      doi: undefined,
      isbn: undefined,
      title: 'The Art of Computer Programming',
    });
    const work2 = makeWork({
      doi: undefined,
      isbn: undefined,
      title: 'Surreal Numbers',
      year: 1974,
    });

    await store.add(work1);
    await store.add(work2);

    expect(await store.count()).toBe(2);
  });

  // 6. Find by DOI
  it('finds work by DOI', async () => {
    const work = makeWork({ doi: '10.9999/unique-doi' });
    await store.add(work);

    const found = await store.findByDoi('10.9999/unique-doi');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('The Art of Computer Programming');
  });

  // 7. Find by ISBN
  it('finds work by ISBN (normalizes hyphens)', async () => {
    const work = makeWork({
      doi: undefined,
      isbn: '978-0-201-89683-1',
    });
    await store.add(work);

    const found = await store.findByIsbn('9780201896831');
    expect(found).not.toBeNull();
    expect(found!.isbn).toBe('978-0-201-89683-1');
  });

  // 8. Find by author
  it('finds all works by author family name', async () => {
    const work1 = makeWork({ doi: '10.111/a' });
    const work2 = makeWork({
      doi: '10.222/b',
      title: 'Surreal Numbers',
      year: 1974,
    });
    const work3 = makeWork({
      doi: '10.333/c',
      title: 'Circuit Design Fundamentals',
      authors: [{ family: 'Horowitz', given: 'Paul' }],
      year: 2015,
    });

    await store.add(work1);
    await store.add(work2);
    await store.add(work3);

    const knuthWorks = await store.findByAuthor('Knuth');
    expect(knuthWorks.length).toBe(2);

    const horowitzWorks = await store.findByAuthor('Horowitz');
    expect(horowitzWorks.length).toBe(1);
    expect(horowitzWorks[0].title).toBe('Circuit Design Fundamentals');
  });

  // 9. Find by tag
  it('finds works by tag', async () => {
    const work1 = makeWork({ doi: '10.444/d', tags: ['electronics', 'circuits'] });
    const work2 = makeWork({
      doi: '10.555/e',
      title: 'A Different Book',
      year: 2020,
      tags: ['electronics'],
    });

    await store.add(work1);
    await store.add(work2);

    const electronicWorks = await store.findByTag('electronics');
    expect(electronicWorks.length).toBe(2);

    const circuitWorks = await store.findByTag('circuits');
    expect(circuitWorks.length).toBe(1);
  });

  // 10. Update
  it('updates existing record with merged fields', async () => {
    const work = makeWork();
    const id = await store.add(work);

    const updated = await store.update(id, {
      publisher: 'Addison-Wesley Professional',
      verified: true,
    });

    expect(updated).not.toBeNull();
    expect(updated!.publisher).toBe('Addison-Wesley Professional');
    expect(updated!.title).toBe('The Art of Computer Programming');
  });

  // 11. Remove
  it('removes record so get returns null', async () => {
    const work = makeWork();
    const id = await store.add(work);
    expect(await store.get(id)).not.toBeNull();

    const removed = await store.remove(id);
    expect(removed).toBe(true);

    const afterRemove = await store.get(id);
    expect(afterRemove).toBeNull();
  });

  // 12. Compact
  it('compacts JSONL preserving correct active record count', async () => {
    const work = makeWork();
    const id = await store.add(work);
    await store.update(id, { publisher: 'Update 1' });
    await store.update(id, { publisher: 'Update 2' });

    const work2 = makeWork({
      doi: '10.999/other',
      title: 'Other Book',
      year: 2020,
    });
    await store.add(work2);

    // Before compact, JSONL has multiple lines (original + updates)
    const linesBefore = fs.readFileSync(
      path.join(tmpDir, 'works.jsonl'), 'utf-8',
    ).split('\n').filter(l => l.trim());
    expect(linesBefore.length).toBeGreaterThan(2);

    const compactedCount = await store.compact();
    expect(compactedCount).toBe(2);

    // After compact, JSONL has exactly 2 lines
    const linesAfter = fs.readFileSync(
      path.join(tmpDir, 'works.jsonl'), 'utf-8',
    ).split('\n').filter(l => l.trim());
    expect(linesAfter.length).toBe(2);
  });

  // 13. Round-trip export/import
  it('exports and imports to a fresh store with identical records', async () => {
    const work1 = makeWork({ doi: '10.100/export1' });
    const work2 = makeWork({
      doi: '10.200/export2',
      title: 'Second Book',
      year: 2010,
    });
    await store.add(work1);
    await store.add(work2);

    const exported = await store.exportAll();
    expect(exported.length).toBe(2);

    // Create fresh store
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-import-'));
    const freshStore = new CitationStore(freshDir);
    await freshStore.init();

    const result = await freshStore.importBatch(exported);
    expect(result.added).toBe(2);
    expect(result.duplicates).toBe(0);

    const reimported = await freshStore.exportAll();
    expect(reimported.length).toBe(2);

    fs.rmSync(freshDir, { recursive: true, force: true });
  });

  // 14. Index rebuild
  it('rebuilds indexes from JSONL after corruption', async () => {
    const work = makeWork({ doi: '10.777/rebuild' });
    await store.add(work);

    // Corrupt the index file
    fs.writeFileSync(path.join(tmpDir, 'works.index.json'), '{}');

    // Rebuild
    await store.rebuildIndexes();

    // DOI lookup should work again
    const found = await store.findByDoi('10.777/rebuild');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('The Art of Computer Programming');
  });

  // 15. Unresolved queue
  it('manages the unresolved citation queue', async () => {
    const raw1 = makeRawCitation({ text: 'Citation A' });
    const raw2 = makeRawCitation({ text: 'Citation B' });
    const raw3 = makeRawCitation({ text: 'Citation C' });

    await store.addUnresolved(raw1);
    await store.addUnresolved(raw2);
    await store.addUnresolved(raw3);

    const allUnresolved = await store.getUnresolved();
    expect(allUnresolved.length).toBe(3);

    await store.clearResolved(['Citation A', 'Citation C']);

    const remaining = await store.getUnresolved();
    expect(remaining.length).toBe(1);
    expect(remaining[0].text).toBe('Citation B');
  });

  // 16. Count
  it('returns correct count of active records', async () => {
    await store.add(makeWork({ doi: '10.001/a' }));
    await store.add(makeWork({ doi: '10.002/b', title: 'Book B', year: 2001 }));
    await store.add(makeWork({ doi: '10.003/c', title: 'Book C', year: 2002 }));

    expect(await store.count()).toBe(3);
  });

  // 17. ID determinism
  it('generates the same ID for same title+author+year', () => {
    const id1 = generateCitationId('The Art of Computer Programming', 'Knuth', 1997);
    const id2 = generateCitationId('The Art of Computer Programming', 'Knuth', 1997);
    const id3 = generateCitationId('the art of computer programming', 'KNUTH', 1997);

    expect(id1).toBe(id2);
    expect(id1).toBe(id3);
  });
});

// ---------------------------------------------------------------------------
// Helper function tests
// ---------------------------------------------------------------------------

describe('normalizeTitle', () => {
  it('strips leading articles and collapses whitespace', () => {
    expect(normalizeTitle('The  Art of   Programming')).toBe('art of programming');
    expect(normalizeTitle('A Brief History')).toBe('brief history');
    expect(normalizeTitle('An Introduction')).toBe('introduction');
  });
});

describe('titleSimilarity', () => {
  it('returns 1.0 for identical titles', () => {
    expect(titleSimilarity('Same Title', 'Same Title')).toBe(1.0);
  });

  it('returns high similarity for near-identical titles', () => {
    const sim = titleSimilarity(
      'The Art of Computer Programming Volume 1',
      'The Art of Computer Programming Volume I',
    );
    expect(sim).toBeGreaterThan(0.92);
  });

  it('returns low similarity for different titles', () => {
    const sim = titleSimilarity(
      'The Art of Computer Programming',
      'Surreal Numbers',
    );
    expect(sim).toBeLessThan(0.5);
  });
});
