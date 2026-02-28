/**
 * Citation types test suite.
 *
 * Validates all Zod schemas for the citation management system.
 * Covers valid inputs, boundary conditions, enum validation,
 * default values, round-trip serialization, and pipeline results.
 */

import { describe, it, expect } from 'vitest';
import {
  AuthorSchema,
  CitedWorkSchema,
  CitedWorkTypeSchema,
  SourceApiSchema,
  ExtractionMethodSchema,
  BibliographyFormatSchema,
  ArtifactTypeSchema,
  RawCitationSchema,
  ProvenanceEntrySchema,
  FormatOptionsSchema,
  SourceRecordSchema,
  ExtractionResultSchema,
  ResolutionResultSchema,
} from '../index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-02-25T12:00:00Z';

function makeAuthor(overrides = {}) {
  return { family: 'Knuth', given: 'Donald', ...overrides };
}

function makeRawCitation(overrides = {}) {
  return {
    text: 'Knuth, D. (1997). The Art of Computer Programming.',
    source_document: 'docs/foundations/algorithms.md',
    extraction_method: 'bibliography' as const,
    confidence: 0.92,
    timestamp: NOW,
    ...overrides,
  };
}

function makeProvenance(overrides = {}) {
  return {
    artifact_type: 'documentation' as const,
    artifact_path: 'docs/foundations/algorithms.md',
    artifact_name: 'Algorithm Foundations',
    timestamp: NOW,
    ...overrides,
  };
}

function makeCitedWork(overrides = {}) {
  return {
    id: 'knuth-taocp-1997',
    title: 'The Art of Computer Programming',
    authors: [makeAuthor()],
    year: 1997,
    doi: '10.1234/taocp',
    publisher: 'Addison-Wesley',
    type: 'book' as const,
    source_api: 'crossref' as const,
    confidence: 0.95,
    first_seen: NOW,
    cited_by: [makeProvenance()],
    tags: ['algorithms', 'computer-science'],
    verified: true,
    raw_citations: [makeRawCitation()],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Citation Types', () => {
  // 1. Valid CitedWork
  it('validates a complete CitedWork record', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('knuth-taocp-1997');
      expect(result.data.verified).toBe(true);
    }
  });

  // 2. CitedWork missing title
  it('rejects CitedWork with empty title', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork({ title: '' }));
    expect(result.success).toBe(false);
  });

  // 3. Author with valid ORCID
  it('validates Author with valid ORCID', () => {
    const result = AuthorSchema.safeParse(
      makeAuthor({ orcid: '0000-0002-1825-0097' }),
    );
    expect(result.success).toBe(true);
  });

  // 4. Author with invalid ORCID
  it('rejects Author with invalid ORCID', () => {
    const result = AuthorSchema.safeParse(makeAuthor({ orcid: '1234' }));
    expect(result.success).toBe(false);
  });

  // 5. RawCitation confidence bounds
  it('rejects RawCitation with confidence > 1', () => {
    const result = RawCitationSchema.safeParse(
      makeRawCitation({ confidence: 1.5 }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects RawCitation with confidence < 0', () => {
    const result = RawCitationSchema.safeParse(
      makeRawCitation({ confidence: -0.1 }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts RawCitation with confidence 0.5', () => {
    const result = RawCitationSchema.safeParse(
      makeRawCitation({ confidence: 0.5 }),
    );
    expect(result.success).toBe(true);
  });

  // 6. Round-trip serialization
  it('preserves CitedWork through JSON round-trip', () => {
    const original = makeCitedWork();
    const parsed = CitedWorkSchema.parse(original);
    const serialized = JSON.stringify(parsed);
    const deserialized = JSON.parse(serialized);
    const reparsed = CitedWorkSchema.parse(deserialized);
    expect(reparsed).toEqual(parsed);
  });

  // 7. Year bounds
  it('rejects year below 1400', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork({ year: 1200 }));
    expect(result.success).toBe(false);
  });

  it('rejects year above 2100', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork({ year: 2101 }));
    expect(result.success).toBe(false);
  });

  it('accepts year 1950', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork({ year: 1950 }));
    expect(result.success).toBe(true);
  });

  // 8. Empty authors array
  it('rejects empty authors array', () => {
    const result = CitedWorkSchema.safeParse(makeCitedWork({ authors: [] }));
    expect(result.success).toBe(false);
  });

  // 9. Enum validation
  describe('enum schemas', () => {
    it('CitedWorkType accepts valid values', () => {
      for (const v of ['article', 'book', 'chapter', 'report', 'other']) {
        expect(CitedWorkTypeSchema.safeParse(v).success).toBe(true);
      }
    });

    it('CitedWorkType rejects invalid values', () => {
      expect(CitedWorkTypeSchema.safeParse('podcast').success).toBe(false);
    });

    it('SourceApi accepts valid values', () => {
      for (const v of ['crossref', 'openalex', 'manual', 'extracted']) {
        expect(SourceApiSchema.safeParse(v).success).toBe(true);
      }
    });

    it('SourceApi rejects invalid values', () => {
      expect(SourceApiSchema.safeParse('scopus').success).toBe(false);
    });

    it('ExtractionMethod accepts valid values', () => {
      for (const v of ['doi', 'isbn', 'bibliography', 'url', 'manual']) {
        expect(ExtractionMethodSchema.safeParse(v).success).toBe(true);
      }
    });

    it('ExtractionMethod rejects invalid values', () => {
      expect(ExtractionMethodSchema.safeParse('regex').success).toBe(false);
    });

    it('BibliographyFormat accepts valid values', () => {
      for (const v of ['bibtex', 'apa7', 'chicago', 'mla', 'custom']) {
        expect(BibliographyFormatSchema.safeParse(v).success).toBe(true);
      }
    });

    it('BibliographyFormat rejects invalid values', () => {
      expect(BibliographyFormatSchema.safeParse('ieee').success).toBe(false);
    });

    it('ArtifactType accepts valid values', () => {
      for (const v of ['skill', 'documentation', 'pack-module']) {
        expect(ArtifactTypeSchema.safeParse(v).success).toBe(true);
      }
    });

    it('ArtifactType rejects invalid values', () => {
      expect(ArtifactTypeSchema.safeParse('widget').success).toBe(false);
    });
  });

  // 10. FormatOptions defaults
  it('applies FormatOptions defaults', () => {
    const result = FormatOptionsSchema.parse({ format: 'apa7' });
    expect(result.scope).toBe('all');
    expect(result.sortBy).toBe('author');
    expect(result.includeUnverified).toBe(true);
  });

  // 11. Pipeline results
  describe('pipeline schemas', () => {
    it('validates ExtractionResult', () => {
      const result = ExtractionResultSchema.safeParse({
        citations: [makeRawCitation()],
        stats: {
          total_candidates: 10,
          high_confidence: 5,
          medium_confidence: 3,
          low_confidence: 2,
          dois_found: 4,
          isbns_found: 1,
        },
      });
      expect(result.success).toBe(true);
    });

    it('validates ResolutionResult', () => {
      const result = ResolutionResultSchema.safeParse({
        resolved: [makeCitedWork()],
        unresolved: [makeRawCitation()],
        stats: {
          total_attempted: 10,
          resolved_count: 8,
          from_cache: 3,
          api_calls: 5,
          avg_confidence: 0.87,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  // 12. SourceRecord
  describe('SourceRecord', () => {
    it('validates a complete SourceRecord', () => {
      const result = SourceRecordSchema.safeParse({
        query: '10.1234/taocp',
        api: 'crossref',
        response_hash: 'abc123def456',
        timestamp: NOW,
        ttl_days: 30,
        data: { title: 'The Art of Computer Programming' },
      });
      expect(result.success).toBe(true);
    });

    it('applies ttl_days default', () => {
      const result = SourceRecordSchema.parse({
        query: '10.1234/taocp',
        api: 'crossref',
        response_hash: 'abc123def456',
        timestamp: NOW,
        data: {},
      });
      expect(result.ttl_days).toBe(30);
    });

    it('rejects SourceRecord with invalid api', () => {
      const result = SourceRecordSchema.safeParse({
        query: 'test',
        api: 'invalid-api',
        response_hash: 'hash',
        timestamp: NOW,
        data: {},
      });
      expect(result.success).toBe(false);
    });
  });

  // 13. ProvenanceEntry validation
  it('validates ProvenanceEntry with optional fields', () => {
    const result = ProvenanceEntrySchema.safeParse(
      makeProvenance({ context: 'Section 3.2', section: 'References' }),
    );
    expect(result.success).toBe(true);
  });

  // 14. CitedWork verified defaults to false
  it('defaults verified to false when omitted', () => {
    const work = makeCitedWork();
    delete (work as Record<string, unknown>).verified;
    const result = CitedWorkSchema.parse(work);
    expect(result.verified).toBe(false);
  });

  // 15. ORCID with trailing X
  it('validates ORCID with trailing X checksum', () => {
    const result = AuthorSchema.safeParse(
      makeAuthor({ orcid: '0000-0001-5109-335X' }),
    );
    expect(result.success).toBe(true);
  });

  // 16. URL validation on CitedWork
  it('rejects invalid URL in CitedWork', () => {
    const result = CitedWorkSchema.safeParse(
      makeCitedWork({ url: 'not-a-url' }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts valid URL in CitedWork', () => {
    const result = CitedWorkSchema.safeParse(
      makeCitedWork({ url: 'https://example.com/paper' }),
    );
    expect(result.success).toBe(true);
  });
});
