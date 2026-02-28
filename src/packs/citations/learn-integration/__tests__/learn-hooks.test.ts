/**
 * Learn pipeline citation hooks — tests.
 *
 * Tests CitationLearnHook (pre/post), AnnotationInjector, and
 * KnowledgeTierLinker with fully mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CitationLearnHook } from '../learn-hook.js';
import { AnnotationInjector } from '../annotation-injector.js';
import { KnowledgeTierLinker } from '../knowledge-tier-linker.js';
import type { LearnMetadata, PreLearnResult, SkillMetadata, ExtractFn } from '../learn-hook.js';
import type { KnowledgeTier } from '../knowledge-tier-linker.js';
import type { RawCitation, CitedWork, ExtractionResult } from '../../types/index.js';
import type { ResolverEngine } from '../../resolver/resolver-engine.js';
import type { CitationStore } from '../../store/citation-db.js';
import type { ProvenanceTracker } from '../../store/provenance-chain.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeCitation(overrides: Partial<RawCitation> = {}): RawCitation {
  return {
    text: '(Smith, 2020)',
    source_document: 'test.md',
    extraction_method: 'inline-apa',
    confidence: 0.85,
    line_number: 5,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeCitedWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: 'abc123',
    title: 'Test Work on Circuit Analysis',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2020,
    doi: '10.1234/test.2020',
    type: 'article',
    source_api: 'crossref',
    confidence: 0.85,
    first_seen: new Date().toISOString(),
    cited_by: [],
    tags: ['circuits'],
    verified: false,
    raw_citations: [],
    ...overrides,
  };
}

function makeMetadata(overrides: Partial<LearnMetadata> = {}): LearnMetadata {
  return {
    sourcePath: '/path/to/source.md',
    sourceType: 'teaching-reference',
    domain: 'electronics',
    ...overrides,
  };
}

function makeSkill(overrides: Partial<SkillMetadata> = {}): SkillMetadata {
  return {
    name: 'test-skill',
    path: '.claude/commands/test-skill.md',
    content: '---\nname: test-skill\n---\n\nSkill content here.',
    sections: ['introduction', 'examples'],
    ...overrides,
  };
}

function makeExtractionResult(citations: RawCitation[]): ExtractionResult {
  return {
    citations,
    stats: {
      total_candidates: citations.length,
      high_confidence: citations.filter(c => c.confidence >= 0.80).length,
      medium_confidence: citations.filter(c => c.confidence >= 0.50 && c.confidence < 0.80).length,
      low_confidence: citations.filter(c => c.confidence < 0.50).length,
      dois_found: 0,
      isbns_found: 0,
    },
  };
}

// ============================================================================
// Mock factories
// ============================================================================

function createMockExtractor(result?: ExtractionResult): ExtractFn {
  return vi.fn().mockResolvedValue(result ?? makeExtractionResult([]));
}

function createMockResolver(): ResolverEngine {
  return {
    resolve: vi.fn().mockResolvedValue(null),
    resolveBatch: vi.fn().mockResolvedValue({ resolved: [], unresolved: [], stats: {} }),
    enrichUnresolved: vi.fn().mockResolvedValue({ resolved: [], unresolved: [], stats: {} }),
  } as unknown as ResolverEngine;
}

function createMockStore(): CitationStore {
  return {
    findByDoi: vi.fn().mockResolvedValue(null),
    findByIsbn: vi.fn().mockResolvedValue(null),
    findByTitle: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('new-id'),
    addUnresolved: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  } as unknown as CitationStore;
}

function createMockProvenance(): ProvenanceTracker {
  return {
    link: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    getByArtifact: vi.fn().mockResolvedValue([]),
    getBySource: vi.fn().mockResolvedValue([]),
    init: vi.fn().mockResolvedValue(undefined),
  } as unknown as ProvenanceTracker;
}

// ============================================================================
// Test: CitationLearnHook — beforeLearn (Pre-hook)
// ============================================================================

describe('CitationLearnHook.beforeLearn', () => {
  let extractor: ExtractFn;
  let resolver: ResolverEngine;
  let store: CitationStore;
  let provenance: ProvenanceTracker;
  let hook: CitationLearnHook;

  beforeEach(() => {
    extractor = createMockExtractor();
    resolver = createMockResolver();
    store = createMockStore();
    provenance = createMockProvenance();
    hook = new CitationLearnHook(extractor, resolver, store, provenance);
  });

  // Test 1: Pre-hook extraction
  it('extracts citations from material and returns results', async () => {
    const citations = [
      makeCitation({ text: '(Smith, 2020)', line_number: 5 }),
      makeCitation({ text: '(Jones, 2019)', line_number: 10, confidence: 0.75 }),
    ];
    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult(citations));

    const material = 'Line 1\nLine 2\nLine 3\nLine 4\nAccording to (Smith, 2020) this works.\nLine 6\nLine 7\nLine 8\nLine 9\nAlso (Jones, 2019) agrees.';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(extractor).toHaveBeenCalledWith(material, '/path/to/source.md');
    expect(result.extractedCitations).toHaveLength(2);
    expect(result.extractedCitations[0].text).toBe('(Smith, 2020)');
    expect(result.extractedCitations[1].text).toBe('(Jones, 2019)');
  });

  // Test 2: Pre-hook DOI resolution
  it('resolves citations with DOI via store and resolver', async () => {
    const citation = makeCitation({
      text: 'Smith (2020). Analysis. DOI: 10.1234/test.2020',
      line_number: 3,
    });
    const work = makeCitedWork({ doi: '10.1234/test.2020' });

    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult([citation]));
    (store.findByDoi as ReturnType<typeof vi.fn>).mockResolvedValue(work);

    const material = 'Line 1\nLine 2\nSmith (2020). Analysis. DOI: 10.1234/test.2020\nLine 4';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(store.findByDoi).toHaveBeenCalledWith('10.1234/test.2020');
    expect(result.resolvedWorks).toHaveLength(1);
    expect(result.resolvedWorks[0].doi).toBe('10.1234/test.2020');
    expect(result.unresolvedCount).toBe(0);
  });

  // Test 3: Pre-hook performance
  it('completes processing within timing budget', async () => {
    const citations = [makeCitation()];
    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult(citations));

    const material = 'Line 1\nLine 2\nLine 3\nLine 4\n(Smith, 2020) some text.\nLine 6';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(result.processingTimeMs).toBeDefined();
    expect(result.processingTimeMs).toBeLessThan(2000);
  });

  // Test 4: Pre-hook annotation markers
  it('inserts CITE markers for extracted citations', async () => {
    const citations = [
      makeCitation({ text: '(Alpha, 2020)', line_number: 1 }),
      makeCitation({ text: '(Beta, 2021)', line_number: 2 }),
      makeCitation({ text: '(Gamma, 2022)', line_number: 3 }),
    ];
    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult(citations));

    const material = '(Alpha, 2020) is important.\n(Beta, 2021) confirms it.\n(Gamma, 2022) agrees.';
    const result = await hook.beforeLearn(material, makeMetadata());

    // Count [CITE: markers
    const markerCount = (result.annotatedMaterial.match(/\[CITE:/g) || []).length;
    expect(markerCount).toBeGreaterThanOrEqual(3);
  });

  // Test 5: Pre-hook safe failure (SAFE-06)
  it('returns original material when extractor throws (SAFE-06)', async () => {
    (extractor as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Extraction failed'));

    const material = 'Original material content.';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(result.annotatedMaterial).toBe(material);
    expect(result.extractedCitations).toHaveLength(0);
    expect(result.resolvedWorks).toHaveLength(0);
    expect(result.unresolvedCount).toBe(0);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  // Test 6: Pre-hook no citations
  it('returns original material unchanged when no citations found', async () => {
    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult([]));

    const material = 'Clean text with no citations at all.';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(result.annotatedMaterial).toBe(material);
    expect(result.extractedCitations).toHaveLength(0);
    expect(result.resolvedWorks).toHaveLength(0);
    expect(result.unresolvedCount).toBe(0);
  });

  // Test: Pre-hook queues unresolved citations
  it('queues unresolved citations to store', async () => {
    const citation = makeCitation({ text: '(Unknown, 2020)', line_number: 1 });
    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult([citation]));
    // No DOI match, no resolver match
    (store.findByDoi as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (resolver.resolve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const material = '(Unknown, 2020) some text.';
    const result = await hook.beforeLearn(material, makeMetadata());

    expect(store.addUnresolved).toHaveBeenCalled();
    expect(result.unresolvedCount).toBe(1);
  });

  // Test: Pre-hook stores resolved works
  it('stores resolved works in citation database', async () => {
    const citation = makeCitation({
      text: 'Test DOI: 10.1234/test.2020',
      line_number: 1,
    });
    const work = makeCitedWork();

    (extractor as ReturnType<typeof vi.fn>).mockResolvedValue(makeExtractionResult([citation]));
    (store.findByDoi as ReturnType<typeof vi.fn>).mockResolvedValue(work);

    const material = 'Test DOI: 10.1234/test.2020 in text.';
    await hook.beforeLearn(material, makeMetadata());

    expect(store.add).toHaveBeenCalledWith(work);
  });
});

// ============================================================================
// Test: CitationLearnHook — afterLearn (Post-hook)
// ============================================================================

describe('CitationLearnHook.afterLearn', () => {
  let extractor: ExtractFn;
  let resolver: ResolverEngine;
  let store: CitationStore;
  let provenance: ProvenanceTracker;
  let hook: CitationLearnHook;

  beforeEach(() => {
    extractor = createMockExtractor();
    resolver = createMockResolver();
    store = createMockStore();
    provenance = createMockProvenance();
    hook = new CitationLearnHook(extractor, resolver, store, provenance);
  });

  // Test 7: Post-hook linking
  it('creates provenance entries for skills with citation markers', async () => {
    const skill1 = makeSkill({
      name: 'skill-a',
      path: '.claude/commands/skill-a.md',
      content: '---\nname: skill-a\n---\n\nContent with [CITE:abc123] references.',
    });
    const skill2 = makeSkill({
      name: 'skill-b',
      path: '.claude/commands/skill-b.md',
      content: '---\nname: skill-b\n---\n\nContent with [CITE:def456] references.',
    });

    const preResult: PreLearnResult = {
      annotatedMaterial: 'annotated text',
      extractedCitations: [],
      resolvedWorks: [makeCitedWork({ id: 'abc123' }), makeCitedWork({ id: 'def456' })],
      unresolvedCount: 0,
      processingTimeMs: 50,
    };

    const result = await hook.afterLearn([skill1, skill2], preResult);

    expect(result.linkedSkills).toBe(2);
    expect(provenance.link).toHaveBeenCalledTimes(2);
    expect(result.provenanceEntries).toBe(2);
  });

  // Test 8: Post-hook skill metadata
  it('annotates skill frontmatter with citation IDs', async () => {
    const skill = makeSkill({
      content: '---\nname: test-skill\n---\n\nContent with [CITE:abc123] marker.',
    });

    const preResult: PreLearnResult = {
      annotatedMaterial: 'text',
      extractedCitations: [],
      resolvedWorks: [makeCitedWork({ id: 'abc123' })],
      unresolvedCount: 0,
      processingTimeMs: 50,
    };

    // afterLearn calls annotateSkill internally
    const result = await hook.afterLearn([skill], preResult);

    // Verify provenance was linked
    expect(result.linkedSkills).toBe(1);
    expect(result.newCitedWorks).toBeGreaterThanOrEqual(1);
  });

  // Test 9: Post-hook returns immediately (async behavior)
  it('returns result without blocking', async () => {
    const skills = [makeSkill()];
    const preResult: PreLearnResult = {
      annotatedMaterial: 'text',
      extractedCitations: [],
      resolvedWorks: [],
      unresolvedCount: 2,
      processingTimeMs: 50,
    };

    const start = Date.now();
    const result = await hook.afterLearn(skills, preResult);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(result.resolutionsPending).toBe(2);
  });

  // Test: Post-hook handles errors gracefully (SAFE-06)
  it('returns empty result when provenance throws (SAFE-06)', async () => {
    (provenance.link as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Provenance broken'));

    const skill = makeSkill({
      content: '---\nname: test\n---\n\nContent with [CITE:abc123].',
    });

    const preResult: PreLearnResult = {
      annotatedMaterial: 'text',
      extractedCitations: [],
      resolvedWorks: [makeCitedWork({ id: 'abc123' })],
      unresolvedCount: 0,
      processingTimeMs: 50,
    };

    // Should not throw
    const result = await hook.afterLearn([skill], preResult);
    expect(result).toBeDefined();
    // Provenance failure means entries may be 0
    expect(result.provenanceEntries).toBe(0);
  });
});

// ============================================================================
// Test: AnnotationInjector
// ============================================================================

describe('AnnotationInjector', () => {
  let injector: AnnotationInjector;

  beforeEach(() => {
    injector = new AnnotationInjector();
  });

  // Test 10: Annotation — text markers inserted after citation sentences
  it('inserts CITE markers after citation sentences', async () => {
    const text = 'First sentence.\nAccording to (Smith, 2020) this is important.\nLast line.';
    const work = makeCitedWork({ id: 'smith-2020' });
    const citation = makeCitation({ text: '(Smith, 2020)', line_number: 2 });

    const result = await injector.annotate(text, [{ citation, work }]);

    expect(result).toContain('[CITE:smith-2020]');
    // Original content preserved
    expect(result).toContain('According to (Smith, 2020) this is important.');
  });

  // Test 11: Annotation non-destructive
  it('preserves all original text content (non-destructive)', async () => {
    const text = 'Line one.\nLine two with (Author, 2021) here.\nLine three.';
    const citation = makeCitation({ text: '(Author, 2021)', line_number: 2 });
    const work = makeCitedWork({ id: 'author-2021' });

    const result = await injector.annotate(text, [{ citation, work }]);

    // Remove all CITE markers
    const stripped = result.replace(/\s*\[CITE:[^\]]+\]/g, '');
    expect(stripped).toBe(text);
  });

  // Test 12: Skill annotation — frontmatter gets citations array
  it('adds citations array to skill YAML frontmatter', async () => {
    const skillContent = '---\nname: test-skill\ntags:\n  - electronics\n---\n\nSkill body.';
    const result = await injector.annotateSkill(skillContent, ['abc123', 'def456']);

    expect(result).toContain('citations:');
    expect(result).toContain('id: "abc123"');
    expect(result).toContain('id: "def456"');
    // Preserve existing fields
    expect(result).toContain('name: test-skill');
    expect(result).toContain('tags:');
  });

  // Test: annotate with no citations returns original text
  it('returns original text when no citations provided', async () => {
    const text = 'Just plain text.';
    const result = await injector.annotate(text, []);
    expect(result).toBe(text);
  });

  // Test: annotateSkill with no citations returns original content
  it('returns original skill content when no citation IDs provided', async () => {
    const content = '---\nname: test\n---\n\nBody.';
    const result = await injector.annotateSkill(content, []);
    expect(result).toBe(content);
  });

  // Test: annotateSkill creates frontmatter if missing
  it('creates frontmatter when skill has none', async () => {
    const content = 'Just skill body content.';
    const result = await injector.annotateSkill(content, ['cite-1']);

    expect(result).toMatch(/^---\n/);
    expect(result).toContain('citations:');
    expect(result).toContain('id: "cite-1"');
    expect(result).toContain('Just skill body content.');
  });
});

// ============================================================================
// Test: KnowledgeTierLinker
// ============================================================================

describe('KnowledgeTierLinker', () => {
  let linker: KnowledgeTierLinker;

  beforeEach(() => {
    linker = new KnowledgeTierLinker();
  });

  // Test 13: Citations matched to tiers by content
  it('links citations to tiers based on author/title mentions', async () => {
    const citation = makeCitedWork({
      id: 'smith-2020',
      title: 'Circuit Analysis Fundamentals',
      authors: [{ family: 'Smith', given: 'John' }],
    });

    const tiers: KnowledgeTier[] = [
      { name: 'summary', content: 'Smith describes circuit analysis fundamentals.', priority: 3 },
      { name: 'active', content: 'Current session material on transistors.', priority: 2 },
      { name: 'reference', content: 'Deep dive into resistor networks.', priority: 1 },
    ];

    const result = await linker.linkToTiers([citation], tiers);

    expect(result.linked).toHaveLength(1);
    expect(result.linked[0].citationId).toBe('smith-2020');
    expect(result.linked[0].tier).toBe('summary');
    expect(result.linked[0].priority).toBe(3);
    expect(result.unlinked).toHaveLength(0);
  });

  // Test 14: Tier priority — summary gets 3, reference gets 1
  it('assigns correct priority based on tier hierarchy', async () => {
    const summaryWork = makeCitedWork({
      id: 'summary-work',
      authors: [{ family: 'Alpha' }],
    });
    const refWork = makeCitedWork({
      id: 'ref-work',
      authors: [{ family: 'Beta' }],
    });

    const tiers: KnowledgeTier[] = [
      { name: 'summary', content: 'Alpha discussed the key findings.', priority: 3 },
      { name: 'active', content: 'Current work on topic X.', priority: 2 },
      { name: 'reference', content: 'Beta provides deep analysis of topic Y.', priority: 1 },
    ];

    const result = await linker.linkToTiers([summaryWork, refWork], tiers);

    expect(result.linked).toHaveLength(2);
    // Sorted by priority descending
    expect(result.linked[0].priority).toBe(3);
    expect(result.linked[0].tier).toBe('summary');
    expect(result.linked[1].priority).toBe(1);
    expect(result.linked[1].tier).toBe('reference');
  });

  // Test: Citations in multiple tiers get highest priority
  it('assigns highest tier priority when citation appears in multiple tiers', async () => {
    const work = makeCitedWork({
      id: 'multi-tier',
      authors: [{ family: 'Gamma' }],
    });

    const tiers: KnowledgeTier[] = [
      { name: 'summary', content: 'Gamma is mentioned in summary.', priority: 3 },
      { name: 'active', content: 'Gamma also in active tier.', priority: 2 },
      { name: 'reference', content: 'And Gamma in reference.', priority: 1 },
    ];

    const result = await linker.linkToTiers([work], tiers);

    expect(result.linked).toHaveLength(1);
    expect(result.linked[0].tier).toBe('summary');
    expect(result.linked[0].priority).toBe(3);
  });

  // Test: Unlinked citations reported
  it('reports unlinked citations not found in any tier', async () => {
    const work = makeCitedWork({
      id: 'orphan-work',
      title: 'Very Specific Niche Topic',
      authors: [{ family: 'Zephyr' }],
    });

    const tiers: KnowledgeTier[] = [
      { name: 'summary', content: 'General electronics overview.', priority: 3 },
      { name: 'active', content: 'Current transistor analysis.', priority: 2 },
      { name: 'reference', content: 'Resistor network theory.', priority: 1 },
    ];

    const result = await linker.linkToTiers([work], tiers);

    expect(result.linked).toHaveLength(0);
    expect(result.unlinked).toContain('orphan-work');
  });

  // Test: Empty citations returns empty result
  it('handles empty citations array', async () => {
    const tiers: KnowledgeTier[] = [
      { name: 'summary', content: 'Content.', priority: 3 },
    ];

    const result = await linker.linkToTiers([], tiers);

    expect(result.linked).toHaveLength(0);
    expect(result.unlinked).toHaveLength(0);
  });
});

// ============================================================================
// Test: Round-trip integration
// ============================================================================

describe('Round-trip: beforeLearn -> afterLearn', () => {
  // Test 15: Round-trip provenance chain intact
  it('maintains provenance chain through full learn cycle', async () => {
    const citation = makeCitation({
      text: 'Smith (2020). Circuits. DOI: 10.1234/circuits.2020',
      line_number: 2,
    });
    const work = makeCitedWork({
      id: 'smith-circuits-2020',
      doi: '10.1234/circuits.2020',
    });

    const extractor = createMockExtractor(makeExtractionResult([citation]));
    const resolver = createMockResolver();
    const store = createMockStore();
    const provenance = createMockProvenance();

    (store.findByDoi as ReturnType<typeof vi.fn>).mockResolvedValue(work);

    const hook = new CitationLearnHook(extractor, resolver, store, provenance);

    // Pre-hook
    const material = 'Introduction.\nSmith (2020). Circuits. DOI: 10.1234/circuits.2020\nConclusion.';
    const preResult = await hook.beforeLearn(material, makeMetadata());

    expect(preResult.resolvedWorks).toHaveLength(1);
    expect(preResult.annotatedMaterial).toContain('[CITE:');

    // Simulate skill generation (would use annotatedMaterial)
    const generatedSkill = makeSkill({
      name: 'circuit-skill',
      path: '.claude/commands/circuit-skill.md',
      content: `---\nname: circuit-skill\n---\n\nCircuit analysis [CITE:smith-circuits-2020] fundamentals.`,
    });

    // Post-hook
    const postResult = await hook.afterLearn([generatedSkill], preResult);

    expect(postResult.linkedSkills).toBe(1);
    expect(postResult.provenanceEntries).toBe(1);
    expect(provenance.link).toHaveBeenCalledWith(
      'smith-circuits-2020',
      expect.objectContaining({
        artifact_type: 'skill',
        artifact_path: '.claude/commands/circuit-skill.md',
        artifact_name: 'circuit-skill',
      }),
    );
  });
});
