import { describe, it, expect } from 'vitest';
import {
  createSemanticEnricher,
  type DistillEmbedder,
  type DistillNamer,
  type CitationResolver,
} from '../distill-enricher-semantic.js';
import {
  distillSources,
  distillSourcesAsync,
  distillAndValidate,
  type DistillCluster,
  type DistillFinding,
  type DistillSource,
} from '../distill.js';
import type { ContentChipset } from '../types.js';

function mkFinding(text: string): DistillFinding {
  return { sourceId: 's', kind: 'note', text, tokens: text.toLowerCase().split(/\s+/) };
}
function mkCluster(id: string, label: string, topTokens: string[], text: string): DistillCluster {
  return { id, label, findings: [mkFinding(text)], sourceIds: ['s'], topTokens };
}

/** 2-dim keyword embedder: [has "review", has "calculus"]. */
const keywordEmbedder: DistillEmbedder = {
  async embed(text: string) {
    const t = text.toLowerCase();
    return { embedding: [t.includes('review') ? 1 : 0, t.includes('calculus') ? 1 : 0] };
  },
};

const CLUSTERS = (): DistillCluster[] => [
  mkCluster('cluster-0', 'Code Review', ['review', 'code'], 'reviewing code changes for quality'),
  mkCluster('cluster-1', 'Peer Review', ['review', 'peer'], 'peer review of pull requests'),
  mkCluster('cluster-2', 'Calculus', ['calculus', 'derivative'], 'the calculus of derivatives'),
];

describe('createSemanticEnricher — semantic cross-references', () => {
  it('adds semantic edges between similar clusters and none for dissimilar ones', async () => {
    const out = await createSemanticEnricher({ embedder: keywordEmbedder }).enrich(CLUSTERS(), []);
    const c0 = out.find((c) => c.id === 'cluster-0')!;
    const c2 = out.find((c) => c.id === 'cluster-2')!;
    expect(c0.semanticEdges?.map((e) => e.to)).toContain('cluster-1');
    expect(c0.semanticEdges?.some((e) => e.to === 'cluster-2')).toBe(false);
    expect(c2.semanticEdges ?? []).toEqual([]);
  });

  it('keeps the highest-similarity edges (descending sort) and caps per cluster', async () => {
    // Graded vectors so cluster-0 is progressively less similar to 1,2,3 — this
    // makes the descending sort + top-N retention observable (an inverted sort
    // would keep cluster-3 and drop cluster-1).
    const graded: DistillEmbedder = {
      async embed(text: string) {
        const byLabel: Record<string, number[]> = {
          a: [1, 0], b: [1, 0.1], c: [1, 0.3], d: [1, 0.6],
        };
        return { embedding: byLabel[text.trim()[0] ?? ''] ?? [0, 1] };
      },
    };
    const many = ['a', 'b', 'c', 'd'].map((x, i) => mkCluster(`cluster-${i}`, x, [x], `text ${x}`));
    const out = await createSemanticEnricher({ embedder: graded, maxEdgesPerCluster: 2 }).enrich(many, []);
    const c0 = out.find((c) => c.id === 'cluster-0')!;
    const edges = c0.semanticEdges!;
    expect(edges).toHaveLength(2); // capped at maxEdgesPerCluster
    expect(edges.map((e) => e.to)).toEqual(['cluster-1', 'cluster-2']); // top-2, cluster-3 dropped
    expect(edges[0]!.similarity).toBeGreaterThan(edges[1]!.similarity); // strictly descending
  });

  it('is inert (returns clusters unchanged) with no backend', async () => {
    const clusters = CLUSTERS();
    const out = await createSemanticEnricher({}).enrich(clusters, []);
    expect(out).toEqual(clusters);
    expect(out.every((c) => c.semanticEdges === undefined)).toBe(true);
  });
});

describe('createSemanticEnricher — name synthesis', () => {
  it('replaces labels via an injected namer', async () => {
    const namer: DistillNamer = { async name(input) { return `Synth: ${input.label}`; } };
    const out = await createSemanticEnricher({ namer }).enrich(CLUSTERS(), []);
    expect(out.map((c) => c.label)).toEqual(['Synth: Code Review', 'Synth: Peer Review', 'Synth: Calculus']);
  });

  it('keeps the heuristic label when the namer returns null or throws (best-effort)', async () => {
    const original = CLUSTERS().map((c) => c.label);
    const nullNamer: DistillNamer = { async name() { return null; } };
    const throwNamer: DistillNamer = { async name() { throw new Error('boom'); } };
    expect((await createSemanticEnricher({ namer: nullNamer }).enrich(CLUSTERS(), [])).map((c) => c.label)).toEqual(original);
    expect((await createSemanticEnricher({ namer: throwNamer }).enrich(CLUSTERS(), [])).map((c) => c.label)).toEqual(original);
  });
});

describe('createSemanticEnricher — ledger-resolved citations', () => {
  const clusters = (): DistillCluster[] => [
    { id: 'c0', label: 'A', findings: [mkFinding('a')], sourceIds: ['s1'], topTokens: ['a'] },
    { id: 'c1', label: 'B', findings: [mkFinding('b')], sourceIds: ['s2'], topTokens: ['b'] },
  ];
  const sources: DistillSource[] = [
    { id: 's1', kind: 'note', content: 'content one' },
    { id: 's2', kind: 'note', content: 'content two' },
  ];
  const resolver: CitationResolver = {
    async resolve(sourceId) {
      return sourceId === 's1'
        ? [{ origin: 'arxiv', sourceId: '2401.00001', ingestedAt: 't0' }]
        : [];
    },
  };

  it('attaches resolvedCitations only for sources the resolver knows', async () => {
    const out = await createSemanticEnricher({ citationResolver: resolver }).enrich(clusters(), sources);
    expect(out.find((c) => c.id === 'c0')!.resolvedCitations).toEqual({
      s1: [{ origin: 'arxiv', sourceId: '2401.00001', ingestedAt: 't0' }],
    });
    expect(out.find((c) => c.id === 'c1')!.resolvedCitations).toBeUndefined();
  });

  it('is inert (no resolvedCitations) without a resolver', async () => {
    const out = await createSemanticEnricher({}).enrich(clusters(), sources);
    expect(out.every((c) => c.resolvedCitations === undefined)).toBe(true);
  });

  it('is best-effort — a throwing resolver leaves sources unresolved (no throw)', async () => {
    const throwing: CitationResolver = { async resolve() { throw new Error('boom'); } };
    const out = await createSemanticEnricher({ citationResolver: throwing }).enrich(clusters(), sources);
    expect(out.every((c) => c.resolvedCitations === undefined)).toBe(true);
  });
});

describe('DistillEnricher wiring through distillSourcesAsync / distillAndValidate', () => {
  const SOURCES: DistillSource[] = [
    { id: 's1', kind: 'note', content: 'Review code quality. Review pull requests carefully.' },
    { id: 's2', kind: 'note', content: 'Calculus derivatives integrals. Calculus limits continuity.' },
  ];

  it('emits relates-semantically connections from enricher-populated edges', async () => {
    const identical: DistillEmbedder = { async embed() { return { embedding: [1, 1, 1] }; } };
    const result = await distillSourcesAsync(
      SOURCES,
      { cartridgeId: 't', name: 'T' },
      createSemanticEnricher({ embedder: identical }),
    );
    const content = result.cartridge.chipsets[0] as ContentChipset;
    const semantic = content.deepMap.connections.filter((c) => c.relationship === 'relates-semantically');
    // The two topic clusters share no source (no co-occurs edge), so the only
    // connection is the semantic one the enricher produced.
    expect(semantic.length).toBeGreaterThan(0);
  });

  it('the async no-op enricher yields the same clusters/notes as sync distillSources', async () => {
    const sync = distillSources(SOURCES, { cartridgeId: 't', name: 'T' });
    const asyncResult = await distillSourcesAsync(SOURCES, { cartridgeId: 't', name: 'T' });
    expect(asyncResult.clusters).toEqual(sync.clusters);
    expect(asyncResult.notes).toEqual(sync.notes);
  });

  it('an enriched artifact still passes cartridge validation', async () => {
    const identical: DistillEmbedder = { async embed() { return { embedding: [1, 1, 1] }; } };
    const artifact = await distillAndValidate(
      SOURCES,
      { cartridgeId: 'test-enriched', name: 'Test Enriched' },
      { enricher: createSemanticEnricher({ embedder: identical }) },
    );
    expect(artifact.validation.valid).toBe(true);
  });

  it('attaches ledger provenance to concept citations end-to-end (and still validates)', async () => {
    const resolver: CitationResolver = {
      async resolve(sourceId) {
        return sourceId === 's1'
          ? [{ origin: 'learn-acquirer', sourceId: '/x.md', ingestedAt: 't0' }]
          : [];
      },
    };
    const artifact = await distillAndValidate(
      SOURCES,
      { cartridgeId: 'test-cited', name: 'Test Cited' },
      { enricher: createSemanticEnricher({ citationResolver: resolver }) },
    );
    const content = artifact.cartridge.chipsets[0] as ContentChipset;
    type Cited = { sourceId: string; provenance?: Array<{ origin: string }> };
    const citations = content.deepMap.concepts.flatMap(
      (c) => (c as unknown as { citations?: Cited[] }).citations ?? [],
    );
    const withProvenance = citations.filter((c) => c.provenance);
    expect(withProvenance.length).toBeGreaterThan(0);
    expect(withProvenance.some((c) => c.provenance![0]!.origin === 'learn-acquirer')).toBe(true);
    // Citations for other sources carry no provenance key.
    expect(citations.some((c) => !c.provenance)).toBe(true);
    expect(artifact.validation.valid).toBe(true);
  });
});
