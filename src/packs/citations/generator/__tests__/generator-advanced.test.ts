/**
 * Advanced generator tests: Chicago, MLA, Custom, Attribution, Integrity.
 *
 * Validates: Chicago 17th ed formatting, MLA 9th ed containers model,
 * custom template rendering, attribution claim classification, and
 * integrity audit with completeness scoring.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

import type { CitedWork } from '../../types/index.js';
import {
  formatChicagoEntry,
  formatMlaEntry,
  formatMlaBibliography,
  formatWithTemplate,
  formatCustomBibliography,
  AttributionReport,
  IntegrityAuditor,
  BibliographyFormatter,
} from '../index.js';
import { CitationStore } from '../../store/index.js';
import { ProvenanceTracker } from '../../store/provenance-chain.js';

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
    publisher: 'University of Chicago Press',
    ...overrides,
  };
}

function makeArticle(overrides: Partial<CitedWork> = {}): CitedWork {
  return makeWork({
    id: 'article-1',
    title: 'Efficacy of Abbreviated PMR Training',
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
    publisher: undefined,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Chicago format tests
// ---------------------------------------------------------------------------

describe('Chicago format', () => {
  it('formats a book with period-separated fields', () => {
    const entry = formatChicagoEntry(makeWork());
    expect(entry).toContain('Jacobson, Edmund.');
    expect(entry).toContain('*Progressive Relaxation Techniques*.');
    expect(entry).toContain('University of Chicago Press, 1938.');
  });

  it('formats an article with title in quotes and journal italicized', () => {
    const entry = formatChicagoEntry(makeArticle());
    expect(entry).toContain('"Efficacy of Abbreviated PMR Training."');
    expect(entry).toContain('*Journal of Consulting and Clinical Psychology*');
    expect(entry).toContain('61, no. 6');
    expect(entry).toContain('(1993)');
    expect(entry).toContain('1059-1067');
  });
});

// ---------------------------------------------------------------------------
// MLA format tests
// ---------------------------------------------------------------------------

describe('MLA format', () => {
  it('formats a book with containers model', () => {
    const entry = formatMlaEntry(makeWork());
    expect(entry).toContain('Jacobson, Edmund.');
    expect(entry).toContain('*Progressive Relaxation Techniques*.');
    expect(entry).toContain('University of Chicago Press, 1938.');
  });

  it('formats an article with proper container nesting', () => {
    const entry = formatMlaEntry(makeArticle());
    expect(entry).toContain('"Efficacy of Abbreviated PMR Training."');
    expect(entry).toContain('*Journal of Consulting and Clinical Psychology*');
    expect(entry).toContain('vol. 61');
    expect(entry).toContain('no. 6');
    expect(entry).toContain('pp. 1059-1067');
  });

  it('includes Works Cited heading in bibliography', () => {
    const result = formatMlaBibliography([makeWork()], {
      format: 'mla',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });
    expect(result).toMatch(/^Works Cited/);
  });
});

// ---------------------------------------------------------------------------
// Custom template tests
// ---------------------------------------------------------------------------

describe('Custom template format', () => {
  it('renders {{author}} ({{year}}) correctly', () => {
    const result = formatWithTemplate(makeWork(), '{{author}} ({{year}})');
    expect(result).toBe('Jacobson, Edmund (1938)');
  });

  it('renders missing field as empty string', () => {
    const work = makeWork({ journal: undefined });
    const result = formatWithTemplate(work, '{{author}} - {{journal}}');
    expect(result).toBe('Jacobson, Edmund - ');
  });

  it('escapes HTML in values', () => {
    const work = makeWork({ title: 'R&D <Advances>' });
    const result = formatWithTemplate(work, '{{title}}');
    expect(result).toBe('R&amp;D &lt;Advances&gt;');
  });

  it('renders all supported variables', () => {
    const work = makeArticle({ isbn: '978-0-123-45678-9', url: 'https://example.com' });
    const template = '{{author}} {{year}} {{title}} {{journal}} {{doi}} {{url}} {{publisher}} {{type}} {{isbn}} {{volume}} {{issue}} {{pages}}';
    const result = formatWithTemplate(work, template);
    expect(result).toContain('Carlson, Charles R. and Hoyle, Rick H.');
    expect(result).toContain('1993');
    expect(result).toContain('10.1037/0022-006X.61.6.1059');
    expect(result).toContain('978-0-123-45678-9');
  });

  it('uses default template when customTemplate not set', () => {
    const result = formatCustomBibliography([makeWork()], {
      format: 'custom',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });
    expect(result).toContain('Jacobson, Edmund');
    expect(result).toContain('(1938)');
  });
});

// ---------------------------------------------------------------------------
// Attribution report tests
// ---------------------------------------------------------------------------

describe('AttributionReport', () => {
  let tmpDir: string;
  let store: CitationStore;
  let provenance: ProvenanceTracker;
  let report: AttributionReport;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attr-test-'));
    store = new CitationStore(path.join(tmpDir, 'db'));
    provenance = new ProvenanceTracker(path.join(tmpDir, 'prov'));
    await store.init();
    await provenance.init();
    report = new AttributionReport(store, provenance);
  });

  it('classifies claims with [CITE:id] as cited prior work', async () => {
    const work = makeWork({ id: 'cite-001' });
    await store.add(work);
    await provenance.link('cite-001', {
      artifact_type: 'documentation',
      artifact_path: '/doc.md',
      artifact_name: 'doc',
      timestamp: NOW,
    });

    const content = 'This technique was developed by Jacobson [CITE:cite-001] in the early 20th century and has been widely adopted.';
    const data = await report.generateForDocument('/doc.md', content);

    expect(data.cited_prior_work.count).toBeGreaterThan(0);
  });

  it('classifies original GSD content as novel claims', async () => {
    const content = 'The skill-creator adaptive learning layer captures workflow patterns and generates reusable skills from observed sequences.';
    const data = await report.generateForDocument('/doc.md', content);

    expect(data.novel_claims.count).toBeGreaterThan(0);
  });

  it('classifies definitions as common knowledge', async () => {
    const content = 'Progressive muscle relaxation is defined as a systematic technique for reducing muscular tension through alternating contraction and release cycles.';
    const data = await report.generateForDocument('/doc.md', content);

    expect(data.common_knowledge.count).toBeGreaterThan(0);
  });

  it('generates readable Markdown summary text', async () => {
    const content = 'The GSD workflow system provides structured project management through phase-based execution and atomic commits.';
    const data = await report.generateForDocument('/doc.md', content);

    expect(data.summary_text).toContain('# Attribution Report');
    expect(data.summary_text).toContain('Total claims analyzed');
    expect(data.summary_text).toContain('Category');
    expect(data.summary_text).toContain('Count');
  });
});

// ---------------------------------------------------------------------------
// Integrity audit tests
// ---------------------------------------------------------------------------

describe('IntegrityAuditor', () => {
  let tmpDir: string;
  let store: CitationStore;
  let provenance: ProvenanceTracker;
  let auditor: IntegrityAuditor;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-test-'));
    store = new CitationStore(path.join(tmpDir, 'db'));
    provenance = new ProvenanceTracker(path.join(tmpDir, 'prov'));
    await store.init();
    await provenance.init();
    auditor = new IntegrityAuditor(store, provenance);
  });

  it('returns perfect score when all citations resolved', async () => {
    const work = makeWork({ id: 'w1' });
    await store.add(work);
    await provenance.link('w1', {
      artifact_type: 'documentation',
      artifact_path: '/doc.md',
      artifact_name: 'doc',
      timestamp: NOW,
    });

    const content = 'See [CITE:w1] for details.';
    const result = await auditor.auditDocument('/doc.md', content);

    expect(result.total_citations_found).toBe(1);
    expect(result.resolved).toBe(1);
    expect(result.unresolved).toBe(0);
    expect(result.completeness_score).toBe(1.0);
  });

  it('detects broken links for non-existent references', async () => {
    const content = 'See [CITE:nonexistent-id] for details.';
    const result = await auditor.auditDocument('/doc.md', content);

    expect(result.unresolved).toBe(1);
    expect(result.broken_links).toContain('[CITE:nonexistent-id]');
    expect(result.completeness_score).toBe(0);
  });

  it('finds orphaned works not cited by the document', async () => {
    const work = makeWork({ id: 'orphan-1' });
    await store.add(work);

    const content = 'This document has no citations.';
    const result = await auditor.auditDocument('/doc.md', content);

    expect(result.orphaned_works).toContain('orphan-1');
  });

  it('generates actionable recommendations', async () => {
    const content = 'See [CITE:missing-1] and [CITE:missing-2] for details.';
    const result = await auditor.auditDocument('/doc.md', content);

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some(r => r.includes('Resolve'))).toBe(true);
  });

  it('returns zero citations and no errors for empty store', async () => {
    const content = 'No citations here.';
    const result = await auditor.auditDocument('/doc.md', content);

    expect(result.total_citations_found).toBe(0);
    expect(result.resolved).toBe(0);
    expect(result.unresolved).toBe(0);
    expect(result.completeness_score).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Formatter integration: all formats registered
// ---------------------------------------------------------------------------

describe('BibliographyFormatter with all formats', () => {
  let tmpDir: string;
  let store: CitationStore;
  let formatter: BibliographyFormatter;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmt-all-'));
    store = new CitationStore(path.join(tmpDir, 'db'));
    await store.init();
    await store.add(makeWork({ id: 'w1' }));
    formatter = new BibliographyFormatter(store);
  });

  it('generates chicago format', async () => {
    const result = await formatter.generate({
      format: 'chicago',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });
    expect(result).toContain('Jacobson, Edmund.');
    expect(result).toContain('*Progressive Relaxation Techniques*');
  });

  it('generates mla format', async () => {
    const result = await formatter.generate({
      format: 'mla',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
    });
    expect(result).toContain('Works Cited');
    expect(result).toContain('Jacobson, Edmund.');
  });

  it('generates custom format', async () => {
    const result = await formatter.generate({
      format: 'custom',
      scope: 'all',
      sortBy: 'author',
      includeUnverified: true,
      customTemplate: '{{author}} ({{year}}). {{title}}.',
    });
    expect(result).toContain('Jacobson, Edmund (1938). Progressive Relaxation Techniques.');
  });
});
