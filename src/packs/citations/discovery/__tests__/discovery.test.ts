/**
 * Tests for the citation discovery module.
 *
 * Covers: DiscoverySearchEngine, CitationGraph, RelatedWorksFinder,
 * and CLI command implementations. All tests use mocked store/resolver
 * data -- no real API calls or filesystem access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoverySearchEngine } from '../search-engine.js';
import { CitationGraph } from '../citation-graph.js';
import { RelatedWorksFinder } from '../related-works.js';
import {
  citeSearch,
  citeTrace,
  citeVerify,
  citeExport,
  citeEnrich,
  citeStatus,
} from '../cli-commands.js';
import type { CommandContext, AuditSummary } from '../cli-commands.js';
import type { CitedWork, SourceApi, ProvenanceEntry } from '../../types/index.js';
import type { ResolverAdapter, SearchOptions } from '../../resolver/adapter.js';
import type { CitationStorePort } from '../../resolver/resolver-engine.js';
import type { CitationStore } from '../../store/citation-db.js';
import type { ProvenanceTracker } from '../../store/provenance-chain.js';
import type { ResolverEngine } from '../../resolver/resolver-engine.js';
import type { SearchResult } from '../search-engine.js';

// ============================================================================
// Test data factories
// ============================================================================

function makeWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: overrides.id ?? 'test-id-001',
    title: overrides.title ?? 'The Art of Electronics',
    authors: overrides.authors ?? [{ family: 'Horowitz', given: 'Paul' }],
    year: overrides.year ?? 2015,
    doi: overrides.doi,
    isbn: overrides.isbn,
    url: overrides.url,
    publisher: overrides.publisher,
    journal: overrides.journal,
    volume: overrides.volume,
    issue: overrides.issue,
    pages: overrides.pages,
    edition: overrides.edition,
    type: overrides.type ?? 'book',
    source_api: overrides.source_api ?? 'crossref',
    confidence: overrides.confidence ?? 0.95,
    first_seen: overrides.first_seen ?? '2026-01-01T00:00:00Z',
    last_verified: overrides.last_verified,
    cited_by: overrides.cited_by ?? [],
    tags: overrides.tags ?? ['electronics'],
    notes: overrides.notes,
    verified: overrides.verified ?? false,
    raw_citations: overrides.raw_citations ?? [],
  };
}

function makeProvenance(overrides: Partial<ProvenanceEntry> = {}): ProvenanceEntry {
  return {
    artifact_type: overrides.artifact_type ?? 'skill',
    artifact_path: overrides.artifact_path ?? 'skills/test-skill/SKILL.md',
    artifact_name: overrides.artifact_name ?? 'test-skill',
    context: overrides.context,
    section: overrides.section,
    timestamp: overrides.timestamp ?? '2026-01-01T00:00:00Z',
  };
}

// ============================================================================
// Mock adapter factory
// ============================================================================

function makeAdapter(name: SourceApi, works: CitedWork[]): ResolverAdapter {
  return {
    name,
    rateLimitPerSecond: 10,
    resolve: vi.fn().mockResolvedValue(works[0] ?? null),
    search: vi.fn().mockResolvedValue(works),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

// ============================================================================
// Mock store factory
// ============================================================================

function makeMockStore(works: CitedWork[] = []): CitationStore & CitationStorePort {
  const workMap = new Map(works.map(w => [w.id, w]));
  return {
    findByDoi: vi.fn().mockImplementation(async (doi: string) =>
      works.find(w => w.doi === doi) ?? null,
    ),
    findByIsbn: vi.fn().mockImplementation(async (isbn: string) =>
      works.find(w => w.isbn === isbn) ?? null,
    ),
    findByTitle: vi.fn().mockImplementation(async (title: string) =>
      works.filter(w => w.title.toLowerCase().includes(title.toLowerCase())),
    ),
    findByAuthor: vi.fn().mockImplementation(async (family: string) =>
      works.filter(w => w.authors.some(a => a.family.toLowerCase() === family.toLowerCase())),
    ),
    get: vi.fn().mockImplementation(async (id: string) => workMap.get(id) ?? null),
    all: vi.fn().mockResolvedValue(works),
    count: vi.fn().mockResolvedValue(works.length),
    getUnresolved: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('test-id'),
    update: vi.fn(),
    remove: vi.fn(),
    init: vi.fn(),
    compact: vi.fn(),
    exportAll: vi.fn().mockResolvedValue(works),
    importBatch: vi.fn(),
    rebuildIndexes: vi.fn(),
    clearResolved: vi.fn(),
    addUnresolved: vi.fn(),
    findByTag: vi.fn().mockResolvedValue([]),
  } as unknown as CitationStore & CitationStorePort;
}

// ============================================================================
// Mock provenance factory
// ============================================================================

function makeMockProvenance(
  sourceEntries: Map<string, ProvenanceEntry[]> = new Map(),
  artifactEntries: Map<string, string[]> = new Map(),
): ProvenanceTracker {
  return {
    init: vi.fn(),
    link: vi.fn(),
    unlink: vi.fn(),
    getBySource: vi.fn().mockImplementation(async (id: string) =>
      sourceEntries.get(id) ?? [],
    ),
    getByArtifact: vi.fn().mockImplementation(async (path: string) =>
      artifactEntries.get(path) ?? [],
    ),
    getChain: vi.fn().mockResolvedValue({ root: '', children: [], depth: 0, circular: false }),
    verify: vi.fn().mockResolvedValue({ valid: true, orphanedArtifacts: [], orphanedSources: [] }),
  } as unknown as ProvenanceTracker;
}

// ============================================================================
// DiscoverySearchEngine Tests
// ============================================================================

describe('DiscoverySearchEngine', () => {
  const work1 = makeWork({ id: 'w1', title: 'Art of Electronics', confidence: 0.95, source_api: 'crossref' });
  const work2 = makeWork({ id: 'w2', title: 'Practical Electronics', confidence: 0.80, source_api: 'openalex', authors: [{ family: 'Monk', given: 'Simon' }], year: 2016 });
  const work3 = makeWork({ id: 'w3', title: 'Electronics Cookbook', confidence: 0.70, source_api: 'openalex', authors: [{ family: 'Monk', given: 'Simon' }], year: 2017 });

  it('searches by title across adapters', async () => {
    const adapter1 = makeAdapter('crossref', [work1]);
    const adapter2 = makeAdapter('openalex', [work2]);
    const store = makeMockStore([]);

    const engine = new DiscoverySearchEngine([adapter1, adapter2], store);
    const results = await engine.search('electronics');

    expect(results.length).toBe(2);
    expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
  });

  it('filters by author when option provided', async () => {
    const adapter = makeAdapter('crossref', [work1]);
    const store = makeMockStore([]);

    const engine = new DiscoverySearchEngine([adapter], store);
    const results = await engine.search('electronics', { author: 'Horowitz' });

    expect(adapter.search).toHaveBeenCalledWith('electronics', expect.objectContaining({ author: 'Horowitz' }));
  });

  it('restricts to specific API when requested', async () => {
    const adapter1 = makeAdapter('crossref', [work1]);
    const adapter2 = makeAdapter('openalex', [work2]);
    const store = makeMockStore([]);

    const engine = new DiscoverySearchEngine([adapter1, adapter2], store);
    const results = await engine.search('electronics', { api: 'crossref' });

    expect(adapter1.search).toHaveBeenCalled();
    expect(adapter2.search).not.toHaveBeenCalled();
  });

  it('deduplicates same work from two APIs by DOI', async () => {
    const workA = makeWork({ id: 'wA', title: 'Same Work', doi: '10.1234/test', confidence: 0.90, source_api: 'crossref' });
    const workB = makeWork({ id: 'wB', title: 'Same Work', doi: '10.1234/test', confidence: 0.85, source_api: 'openalex', authors: [{ family: 'Smith' }], year: 2020 });

    const adapter1 = makeAdapter('crossref', [workA]);
    const adapter2 = makeAdapter('openalex', [workB]);
    const store = makeMockStore([]);

    const engine = new DiscoverySearchEngine([adapter1, adapter2], store);
    const results = await engine.search('same work');

    // Should be deduplicated to 1 result (the higher confidence one)
    expect(results.length).toBe(1);
    expect(results[0].confidence).toBe(0.90);
  });

  it('marks works already in store', async () => {
    const storeWork = makeWork({ id: 'sw1', title: 'Stored Work', doi: '10.5678/stored' });
    const searchWork = makeWork({ id: 'sw1', title: 'Stored Work', doi: '10.5678/stored', confidence: 0.85 });
    const adapter = makeAdapter('crossref', [searchWork]);
    const store = makeMockStore([storeWork]);

    const engine = new DiscoverySearchEngine([adapter], store);
    const results = await engine.search('stored');

    expect(results.length).toBe(1);
    expect(results[0].alreadyInStore).toBe(true);
  });
});

// ============================================================================
// CitationGraph Tests
// ============================================================================

describe('CitationGraph', () => {
  it('traces depth 1 with references', async () => {
    const rootWork = makeWork({ id: 'root' });
    const ref1 = makeWork({ id: 'ref1', title: 'Reference 1', authors: [{ family: 'Author1' }], year: 2020 });
    const ref2 = makeWork({ id: 'ref2', title: 'Reference 2', authors: [{ family: 'Author2' }], year: 2021 });

    const store = makeMockStore([rootWork, ref1, ref2]);
    const provenance = makeMockProvenance();
    const lookup = vi.fn().mockImplementation(async (work: CitedWork) => {
      if (work.id === 'root') return ['ref1', 'ref2'];
      return [];
    });

    const graph = new CitationGraph(store, provenance, lookup);
    const tree = await graph.trace('root', 1);

    expect(tree.citationId).toBe('root');
    expect(tree.resolved).toBe(true);
    expect(tree.children.length).toBe(2);
    expect(tree.children[0].citationId).toBe('ref1');
    expect(tree.children[1].citationId).toBe('ref2');
  });

  it('detects cycles (A -> B -> A)', async () => {
    const workA = makeWork({ id: 'A', title: 'Work A' });
    const workB = makeWork({ id: 'B', title: 'Work B', authors: [{ family: 'AuthB' }], year: 2021 });

    const store = makeMockStore([workA, workB]);
    const provenance = makeMockProvenance();
    const lookup = vi.fn().mockImplementation(async (work: CitedWork) => {
      if (work.id === 'A') return ['B'];
      if (work.id === 'B') return ['A'];
      return [];
    });

    const graph = new CitationGraph(store, provenance, lookup);
    const tree = await graph.trace('A', 5);

    // Should not infinite loop; B's child A should be a leaf
    expect(tree.citationId).toBe('A');
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].citationId).toBe('B');
    // B references A, but A is already visited, so it becomes a leaf
    expect(tree.children[0].children.length).toBe(1);
    expect(tree.children[0].children[0].citationId).toBe('A');
    expect(tree.children[0].children[0].children.length).toBe(0);
  });

  it('reverse traces to find citing works', async () => {
    const rootWork = makeWork({ id: 'cited-work' });
    const citerWork = makeWork({ id: 'citer-1', title: 'Citing Paper', authors: [{ family: 'Citer' }], year: 2023 });

    const prov = makeProvenance({ artifact_path: 'docs/paper.md' });
    const sourceEntries = new Map([['cited-work', [prov]]]);
    const artifactEntries = new Map([['docs/paper.md', ['cited-work', 'citer-1']]]);

    const store = makeMockStore([rootWork, citerWork]);
    const provenance = makeMockProvenance(sourceEntries, artifactEntries);

    const graph = new CitationGraph(store, provenance);
    const tree = await graph.reverseTrace('cited-work');

    expect(tree.citationId).toBe('cited-work');
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].citationId).toBe('citer-1');
  });
});

// ============================================================================
// RelatedWorksFinder Tests
// ============================================================================

describe('RelatedWorksFinder', () => {
  it('finds co-cited works', async () => {
    const work1 = makeWork({ id: 'w1' });
    const work2 = makeWork({ id: 'w2', title: 'Related Work', authors: [{ family: 'Other' }], year: 2020 });

    const prov = makeProvenance({ artifact_path: 'skills/test/SKILL.md' });
    const sourceEntries = new Map([['w1', [prov]]]);
    const artifactEntries = new Map([['skills/test/SKILL.md', ['w1', 'w2']]]);

    const store = makeMockStore([work1, work2]);
    const provenance = makeMockProvenance(sourceEntries, artifactEntries);

    const finder = new RelatedWorksFinder(store, provenance);
    const related = await finder.findRelated('w1');

    expect(related.length).toBe(1);
    expect(related[0].id).toBe('w2');
  });

  it('finds works by author family name', async () => {
    const work1 = makeWork({ id: 'w1', authors: [{ family: 'Horowitz', given: 'Paul' }] });
    const store = makeMockStore([work1]);
    const provenance = makeMockProvenance();

    const finder = new RelatedWorksFinder(store, provenance);
    const results = await finder.findByAuthor('Horowitz');

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('w1');
  });
});

// ============================================================================
// CLI Command Tests
// ============================================================================

describe('CLI Commands', () => {
  let ctx: CommandContext;
  let store: CitationStore & CitationStorePort;
  let provenance: ProvenanceTracker;

  const work1 = makeWork({ id: 'w1', verified: true, confidence: 0.95, cited_by: [makeProvenance()] });
  const work2 = makeWork({
    id: 'w2',
    title: 'Practical Electronics',
    authors: [{ family: 'Monk', given: 'Simon' }],
    year: 2016,
    type: 'book',
    source_api: 'openalex',
    confidence: 0.80,
    verified: false,
  });

  beforeEach(() => {
    store = makeMockStore([work1, work2]);
    provenance = makeMockProvenance();

    const mockSearchEngine = {
      search: vi.fn().mockResolvedValue([
        { work: work1, source: 'crossref' as SourceApi, confidence: 0.95, alreadyInStore: false },
        { work: work2, source: 'openalex' as SourceApi, confidence: 0.80, alreadyInStore: false },
      ]),
    } as unknown as DiscoverySearchEngine;

    const mockGraph = {
      trace: vi.fn().mockResolvedValue({
        work: work1,
        citationId: 'w1',
        children: [],
        depth: 0,
        resolved: true,
      }),
      reverseTrace: vi.fn(),
    } as unknown as CitationGraph;

    const mockResolver = {
      resolve: vi.fn(),
      resolveBatch: vi.fn().mockResolvedValue({
        resolved: [],
        unresolved: [],
        stats: { total_attempted: 0, resolved_count: 0, from_cache: 0, api_calls: 0, avg_confidence: 0 },
      }),
    } as unknown as ResolverEngine;

    ctx = {
      store,
      provenance,
      resolver: mockResolver,
      searchEngine: mockSearchEngine,
      graph: mockGraph,
    };
  });

  it('citeSearch formats results', async () => {
    const output = await citeSearch('electronics', {}, ctx);

    expect(output).toContain('Found 2 result(s)');
    expect(output).toContain('Horowitz');
    expect(output).toContain('crossref');
    expect(output).toContain('95%');
  });

  it('citeTrace shows tree output', async () => {
    const output = await citeTrace('w1', 3, ctx);

    expect(output).toContain('Citation trace:');
    expect(output).toContain('Art of Electronics');
  });

  it('citeStatus shows summary statistics', async () => {
    const output = await citeStatus(ctx);

    expect(output).toContain('Citation Store Status');
    expect(output).toContain('Total works:');
    expect(output).toContain('2');
    expect(output).toContain('Verified:');
    expect(output).toContain('book');
  });

  it('citeExport delegates to formatter', async () => {
    const mockFormatter = vi.fn().mockReturnValue('@book{horowitz2015,\n  title={Art of Electronics}\n}');
    ctx.formatter = mockFormatter;

    const output = await citeExport(
      'bibtex',
      { format: 'bibtex', scope: 'all', sortBy: 'author', includeUnverified: true },
      ctx,
    );

    expect(mockFormatter).toHaveBeenCalled();
    expect(output).toContain('@book');
  });

  it('citeExport handles missing formatter', async () => {
    const output = await citeExport(
      'bibtex',
      { format: 'bibtex', scope: 'all', sortBy: 'author', includeUnverified: true },
      ctx,
    );

    expect(output).toContain('formatter');
    expect(output).toContain('2 works');
  });

  it('handles empty store gracefully', async () => {
    const emptyStore = makeMockStore([]);
    const emptyCtx: CommandContext = {
      ...ctx,
      store: emptyStore,
    };

    const searchOutput = await citeSearch('nothing', {}, {
      ...emptyCtx,
      searchEngine: {
        search: vi.fn().mockResolvedValue([]),
      } as unknown as DiscoverySearchEngine,
    });
    expect(searchOutput).toContain('No results found');

    const verifyOutput = await citeVerify(undefined, emptyCtx);
    expect(verifyOutput).toContain('No citations found');

    const exportOutput = await citeExport(
      'bibtex',
      { format: 'bibtex', scope: 'all', sortBy: 'author', includeUnverified: true },
      emptyCtx,
    );
    expect(exportOutput).toContain('No citations to export');

    const statusOutput = await citeStatus(emptyCtx);
    expect(statusOutput).toContain('Total works:');
    expect(statusOutput).toContain('0');
  });
});
