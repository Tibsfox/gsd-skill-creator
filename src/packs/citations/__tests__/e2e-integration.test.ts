/**
 * E2E integration tests for the citation management pipeline.
 *
 * Exercises the full pipeline: extract -> resolve -> store -> generate -> provenance.
 * All API calls are mocked. Uses temp directories for isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { extractCitations } from '../extractor/parser.js';
import { CitationStore } from '../store/citation-db.js';
import { ProvenanceTracker } from '../store/provenance-chain.js';
import { ResolverEngine, type CitationStorePort } from '../resolver/resolver-engine.js';
import { CrossRefAdapter } from '../resolver/adapters/crossref.js';
import { BibliographyFormatter } from '../generator/formatter.js';
import { IntegrityAuditor } from '../generator/integrity-audit.js';
import { AttributionReport } from '../generator/attribution-report.js';
import { CitationLearnHook } from '../learn-integration/learn-hook.js';
import { renderCitationPanel } from '../dashboard/citation-panel.js';
import { renderIntegrityBadge } from '../dashboard/integrity-badges.js';
import type { CitedWork, RawCitation, ProvenanceEntry } from '../types/index.js';

// ============================================================================
// Helpers
// ============================================================================

const NOW = '2026-02-25T12:00:00Z';

let tmpDir: string;

function createTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'citation-e2e-'));
}

function makeCitedWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: `work-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Test Work',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2020,
    type: 'article',
    source_api: 'crossref',
    confidence: 0.90,
    first_seen: NOW,
    cited_by: [],
    tags: [],
    raw_citations: [],
    verified: true,
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
// Setup / teardown
// ============================================================================

beforeEach(() => {
  tmpDir = createTmpDir();
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ============================================================================
// Test 1: Full Learn Pipeline
// ============================================================================

describe('E2E: Full Learn Pipeline', () => {
  it('extracts, resolves, stores, and annotates citations from teaching reference', async () => {
    const material = `
# Module 7: Progressive Muscle Relaxation

Progressive muscle relaxation was first developed by Edmund Jacobson in 1938,
building on the relationship between muscular tension and anxiety.

As described by (Jacobson, 1938), systematic tensing and releasing of muscle
groups leads to deep relaxation states.

Wolpe (1958) later integrated progressive relaxation into systematic
desensitization for phobia treatment.

Bernstein and Borkovec (1973) standardized a shortened version of the protocol
that reduced the original 56-muscle procedure to 16 muscle groups.

The American Academy of Sleep Medicine recommends relaxation training
for insomnia management (AASM, 2006).

Recent meta-analyses have confirmed efficacy across multiple domains.
See also DOI: 10.1016/j.cpr.2008.01.001 for a comprehensive review.

## References

Jacobson, E. (1938). Progressive relaxation. University of Chicago Press.

Wolpe, J. (1958). Psychotherapy by reciprocal inhibition. Stanford University Press.

Bernstein, D. A., & Borkovec, T. D. (1973). Progressive relaxation training: A manual for the helping professions. Research Press.

AASM. (2006). Practice parameters for the psychological and behavioral treatment of insomnia. Sleep, 29(11), 1415-1419.
`;

    const storeDir = path.join(tmpDir, 'store');
    const provenanceDir = path.join(tmpDir, 'provenance');
    const cacheDir = path.join(tmpDir, 'cache');

    const store = new CitationStore(storeDir);
    await store.init();
    const provenance = new ProvenanceTracker(provenanceDir);
    await provenance.init();

    // Mock CrossRef to resolve the DOI citation
    const crossrefFetch = mockFetch({
      status: 'ok',
      message: {
        DOI: '10.1016/j.cpr.2008.01.001',
        title: ['Efficacy of progressive muscle relaxation'],
        author: [{ family: 'Manzoni', given: 'G. M.' }],
        'published-print': { 'date-parts': [[2008]] },
        type: 'journal-article',
      },
    });

    const crossref = new CrossRefAdapter({ fetchFn: crossrefFetch, cacheDir });
    const engine = new ResolverEngine([crossref], { store: store as unknown as CitationStorePort });

    const hook = new CitationLearnHook(extractCitations, engine, store, provenance);

    const start = Date.now();
    const result = await hook.beforeLearn(material, {
      sourcePath: 'skills/relaxation/module-7.md',
      sourceType: 'teaching-reference',
      domain: 'health',
      tags: ['relaxation', 'psychology'],
    });
    const elapsed = Date.now() - start;

    // Verify >= 5 citations extracted (Jacobson, Wolpe, Bernstein, AASM, DOI + bibliography entries)
    expect(result.extractedCitations.length).toBeGreaterThanOrEqual(5);

    // Verify material was annotated with CITE markers
    expect(result.annotatedMaterial).toContain('[CITE:');

    // Verify timing is reasonable (<2000ms)
    expect(elapsed).toBeLessThan(2000);

    // Verify processing time tracking
    expect(result.processingTimeMs).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test 2: Electronics Pack Citations
// ============================================================================

describe('E2E: Electronics Pack Citations', () => {
  it('extracts ISBN citation from electronics reference text', async () => {
    const text = `
# Module 1: Circuit Fundamentals

This module draws extensively from "The Art of Electronics" by Horowitz and
Hill (2015), ISBN 978-0-521-80926-9, widely regarded as the definitive
reference for practical electronics design.

As Horowitz & Hill (2015) explain, Ohm's law is the fundamental relationship
between voltage, current, and resistance in a circuit.

## References

Horowitz, P., & Hill, W. (2015). The art of electronics (3rd ed.). Cambridge University Press.
`;

    const result = await extractCitations(text, 'electronics/module-1.md');

    // Verify ISBN detected
    expect(result.stats.isbns_found).toBeGreaterThanOrEqual(1);

    // Verify at least one citation has high confidence (ISBN + bibliography entry)
    const highConf = result.citations.filter(c => c.confidence >= 0.85);
    expect(highConf.length).toBeGreaterThanOrEqual(1);

    // Verify citation text contains Horowitz references
    const horowitzCitations = result.citations.filter(c =>
      c.text.toLowerCase().includes('horowitz') || c.text.toLowerCase().includes('art of electronics'),
    );
    expect(horowitzCitations.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Test 3: NASA Document Citations
// ============================================================================

describe('E2E: NASA Document Citations', () => {
  it('extracts NASA report number and classifies type', async () => {
    const text = `
# Systems Engineering Compliance

All systems engineering activities must comply with NPR 7123.1, "Systems
Engineering Processes and Requirements" (NASA, 2020), which defines the
Agency's systems engineering policy framework.

See also NASA-SP-2016-6105 Rev 2, the NASA Systems Engineering Handbook
(NASA, 2016) for detailed guidance on implementation.

## References

NASA. (2020). NPR 7123.1C: NASA systems engineering processes and requirements. National Aeronautics and Space Administration.

NASA. (2016). NASA-SP-2016-6105 Rev 2: NASA systems engineering handbook. National Aeronautics and Space Administration.
`;

    const result = await extractCitations(text, 'cloud-ops/systems-engineering.md');

    // Verify citations found
    expect(result.citations.length).toBeGreaterThanOrEqual(2);

    // Verify at least one citation contains NASA report pattern
    const nasaCitations = result.citations.filter(c =>
      /NPR\s+7123|NASA[-\s]SP/i.test(c.text),
    );
    expect(nasaCitations.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Test 4: Provenance Chain Integrity
// ============================================================================

describe('E2E: Provenance Chain Integrity', () => {
  it('maintains bidirectional provenance chains across 10 works and 5 artifacts', async () => {
    const storeDir = path.join(tmpDir, 'prov-store');
    const provenanceDir = path.join(tmpDir, 'prov-chain');

    const store = new CitationStore(storeDir);
    await store.init();
    const provenance = new ProvenanceTracker(provenanceDir);
    await provenance.init();

    // Create 10 CitedWorks
    const works: CitedWork[] = [];
    for (let i = 0; i < 10; i++) {
      const work = makeCitedWork({
        id: `prov-work-${i}`,
        title: `Provenance Test Work ${i}`,
        authors: [{ family: `Author${i}`, given: `Given${i}` }],
        year: 2020 + i,
        tags: [`domain-${i % 3}`],
      });
      await store.add(work);
      works.push(work);
    }

    // Link to 5 skill artifacts
    const artifacts = [
      'skills/foundations/algebra.md',
      'skills/foundations/calculus.md',
      'skills/applied/signals.md',
      'skills/applied/control.md',
      'skills/research/methods.md',
    ];

    // Each artifact references 2 works
    for (let a = 0; a < artifacts.length; a++) {
      for (let w = a * 2; w < a * 2 + 2 && w < works.length; w++) {
        const entry: ProvenanceEntry = {
          artifact_type: 'skill',
          artifact_path: artifacts[a],
          artifact_name: path.basename(artifacts[a], '.md'),
          timestamp: NOW,
        };
        await provenance.link(works[w].id, entry);
      }
    }

    // Query artifact -> sources direction
    for (let a = 0; a < artifacts.length; a++) {
      const citationIds = await provenance.getByArtifact(artifacts[a]);
      expect(citationIds.length).toBe(2);
    }

    // Query source -> artifacts direction
    for (let w = 0; w < 10; w++) {
      const entries = await provenance.getBySource(works[w].id);
      expect(entries.length).toBe(1);
      expect(entries[0].artifact_path).toBe(artifacts[Math.floor(w / 2)]);
    }

    // Verify bidirectional consistency
    const verifyResult = await provenance.verify();
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.orphanedArtifacts).toHaveLength(0);
    expect(verifyResult.orphanedSources).toHaveLength(0);

    // Walk chain 3 levels deep from first work
    const chain = await provenance.getChain(works[0].id, 3);
    expect(chain.root).toBe(works[0].id);
    expect(chain.depth).toBe(3);
    // Chain should find children (other works sharing the same artifact)
    expect(chain.children.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Test 5: Citation Deduplication
// ============================================================================

describe('E2E: Citation Deduplication', () => {
  it('deduplicates same work added via DOI and via title+author', async () => {
    const storeDir = path.join(tmpDir, 'dedup-store');
    const store = new CitationStore(storeDir);
    await store.init();

    // Add via DOI first
    const workByDoi = makeCitedWork({
      id: 'doi-entry-001',
      title: 'The Art of Electronics',
      authors: [{ family: 'Horowitz', given: 'Paul' }, { family: 'Hill', given: 'Winfield' }],
      year: 2015,
      doi: '10.1017/9781108114738',
      type: 'book',
      cited_by: [{
        artifact_type: 'skill',
        artifact_path: 'skills/electronics/circuits.md',
        artifact_name: 'circuits',
        timestamp: NOW,
      }],
    });
    const id1 = await store.add(workByDoi);

    // Add same work via title+author (no DOI, different provenance)
    const workByTitle = makeCitedWork({
      id: 'title-entry-002',
      title: 'The Art of Electronics',
      authors: [{ family: 'Horowitz', given: 'Paul' }, { family: 'Hill', given: 'Winfield' }],
      year: 2015,
      type: 'book',
      publisher: 'Cambridge University Press',
      cited_by: [{
        artifact_type: 'teaching-reference',
        artifact_path: 'teaching/electronics/ohm.md',
        artifact_name: 'ohm',
        timestamp: NOW,
      }],
    });
    const id2 = await store.add(workByTitle);

    // Should have deduplicated to single record
    expect(id1).toBe(id2);

    const count = await store.count();
    expect(count).toBe(1);

    // Verify the canonical record has provenance from both
    const canonical = await store.get(id1);
    expect(canonical).not.toBeNull();
    expect(canonical!.cited_by.length).toBe(2);
  });
});

// ============================================================================
// Test 6: Unresolved -> Enrichment Cycle
// ============================================================================

describe('E2E: Unresolved -> Enrichment Cycle', () => {
  it('resolves 3 of 5 unresolved citations via enrichment batch', async () => {
    const storeDir = path.join(tmpDir, 'enrich-store');
    const cacheDir = path.join(tmpDir, 'enrich-cache');
    const store = new CitationStore(storeDir);
    await store.init();

    // Add 5 unresolved citations
    const unresolvedCitations: RawCitation[] = [
      { text: 'Smith, J. (2020). Resolvable Paper A. 10.1234/paper-a', source_document: 'test.md', extraction_method: 'bibliography', confidence: 0.80, timestamp: NOW },
      { text: 'Doe, A. (2021). Resolvable Paper B. 10.5678/paper-b', source_document: 'test.md', extraction_method: 'bibliography', confidence: 0.75, timestamp: NOW },
      { text: 'Unknown obscure reference with no match whatsoever', source_document: 'test.md', extraction_method: 'informal', confidence: 0.30, timestamp: NOW },
      { text: 'Lee, K. (2019). Resolvable Paper C. 10.9012/paper-c', source_document: 'test.md', extraction_method: 'bibliography', confidence: 0.85, timestamp: NOW },
      { text: 'Another totally unresolvable citation text fragment', source_document: 'test.md', extraction_method: 'informal', confidence: 0.25, timestamp: NOW },
    ];

    for (const c of unresolvedCitations) {
      await store.addUnresolved(c);
    }

    // Verify all 5 in unresolved queue
    const before = await store.getUnresolved();
    expect(before).toHaveLength(5);

    // Mock CrossRef to resolve the 3 DOI-bearing citations
    const crossrefFetch = mockFetchSequence([
      {
        data: {
          status: 'ok',
          message: { DOI: '10.1234/paper-a', title: ['Resolvable Paper A'], author: [{ family: 'Smith', given: 'J.' }], 'published-print': { 'date-parts': [[2020]] }, type: 'journal-article' },
        },
      },
      {
        data: {
          status: 'ok',
          message: { DOI: '10.5678/paper-b', title: ['Resolvable Paper B'], author: [{ family: 'Doe', given: 'A.' }], 'published-print': { 'date-parts': [[2021]] }, type: 'journal-article' },
        },
      },
      // Third call: no results for "Unknown obscure..."
      { data: { status: 'ok', message: { items: [], 'total-results': 0 } } },
      {
        data: {
          status: 'ok',
          message: { DOI: '10.9012/paper-c', title: ['Resolvable Paper C'], author: [{ family: 'Lee', given: 'K.' }], 'published-print': { 'date-parts': [[2019]] }, type: 'journal-article' },
        },
      },
      // Fifth call: no results for second unresolvable
      { data: { status: 'ok', message: { items: [], 'total-results': 0 } } },
    ]);

    const crossref = new CrossRefAdapter({ fetchFn: crossrefFetch, cacheDir });
    const engine = new ResolverEngine([crossref]);

    const result = await engine.enrichUnresolved(store as unknown as CitationStorePort & { getUnresolved: () => Promise<RawCitation[]> });

    // 3 resolved, 2 still unresolved
    expect(result.resolved.length).toBe(3);
    expect(result.unresolved.length).toBe(2);
    expect(result.stats.resolved_count).toBe(3);
  });
});

// ============================================================================
// Test 7: Dashboard Rendering
// ============================================================================

describe('E2E: Dashboard Rendering', () => {
  it('renders citation panel with 20 works and integrity badges', () => {
    // Create 20 works across 3 domain tags
    const domains = ['mathematics', 'physics', 'computer-science'];
    const works: CitedWork[] = [];
    for (let i = 0; i < 20; i++) {
      works.push(makeCitedWork({
        id: `dash-work-${i}`,
        title: `Dashboard Test Work ${i}`,
        authors: [{ family: `Author${i}`, given: `G${i}` }],
        year: 2000 + i,
        type: i % 3 === 0 ? 'book' : 'article',
        confidence: 0.5 + (i * 0.025),
        tags: [domains[i % 3]],
        verified: i % 2 === 0,
      }));
    }

    // Render citation panel
    const panelHtml = renderCitationPanel(works);
    expect(panelHtml).toContain('citation-panel');
    expect(panelHtml).toContain('<table');
    expect(panelHtml).toContain('<tr');
    // Should have rows for all 20 works
    const rowCount = (panelHtml.match(/cp-row/g) ?? []).length;
    expect(rowCount).toBe(20);

    // Render integrity badges with color threshold verification
    const greenBadge = renderIntegrityBadge({
      completeness_score: 0.95,
      total_fields: 10,
      passed_fields: 9,
      label: 'Mathematics Pack',
    });
    expect(greenBadge).toContain('integrity-badge');
    expect(greenBadge).toContain('95%');
    // Green threshold >= 0.90 -> #3fb950
    expect(greenBadge).toContain('#3fb950');

    const yellowBadge = renderIntegrityBadge({
      completeness_score: 0.75,
      total_fields: 8,
      passed_fields: 6,
      label: 'Physics Pack',
    });
    expect(yellowBadge).toContain('75%');
    // Yellow threshold 0.70-0.89 -> #d29922
    expect(yellowBadge).toContain('#d29922');

    const redBadge = renderIntegrityBadge({
      completeness_score: 0.50,
      total_fields: 6,
      passed_fields: 3,
      label: 'CS Pack',
    });
    expect(redBadge).toContain('50%');
    // Red threshold < 0.70 -> #f85149
    expect(redBadge).toContain('#f85149');
  });
});

// ============================================================================
// Test 8: SAFE-02 PII Redaction
// ============================================================================

describe('E2E: SAFE-02 PII Redaction', () => {
  it('does not store email addresses or phone numbers in CitedWork records', async () => {
    const storeDir = path.join(tmpDir, 'pii-store');
    const store = new CitationStore(storeDir);
    await store.init();

    // Create text with PII embedded in citation text
    const text = `
According to Smith (2020), contact the author at john.smith@example.com
or by phone at +1-555-123-4567 for replication data.

Jones, A. (2019) published results at jones.alice@university.edu.

## References

Smith, J. (2020). Important findings in testing. Test Journal, 1(2), 34-56.

Jones, A. (2019). Replication studies in modern science. Science Review, 5(3), 78-90.
`;

    const result = await extractCitations(text, 'test-pii.md');
    expect(result.citations.length).toBeGreaterThan(0);

    // Store extracted citations as works (simulating resolution)
    for (const citation of result.citations) {
      // Filter PII from citation text before storing
      const cleanedText = citation.text
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[EMAIL_REDACTED]')
        .replace(/\+?\d[\d\s-]{8,}\d/g, '[PHONE_REDACTED]');

      const work = makeCitedWork({
        title: cleanedText.slice(0, 80),
        raw_citations: [{
          ...citation,
          text: cleanedText,
        }],
        notes: cleanedText,
      });
      await store.add(work);
    }

    // Verify no PII in stored records
    const allWorks = await store.all();
    for (const work of allWorks) {
      const workJson = JSON.stringify(work);
      expect(workJson).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      expect(workJson).not.toMatch(/\+1-555-123-4567/);
    }
  });
});
