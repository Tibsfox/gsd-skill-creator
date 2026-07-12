import { describe, it, expect, vi } from 'vitest';
import type { Finding } from '../types.js';
import type { MemoryRecord, MemoryQuery, MemoryResult } from '../../memory/types.js';
import {
  FindingMemorySync,
  findingToMemoryRecord,
  findingText,
  type FindingSource,
  type FindingEmbedder,
  type FindingMemoryWriter,
  type FindingEmbeddingCache,
} from '../finding-memory-sync.js';

function makeFinding(over: Partial<Finding> = {}): Finding {
  return {
    id: 'F-abc123',
    project_id: 'proj-1',
    kind: 'dead_code',
    severity: 'high',
    confidence: 0.82,
    title: 'Unreachable helper never imported',
    rationale: 'The symbol foo() has zero inbound edges across the graph.',
    source_path: 'src/util/foo.ts',
    produced_by: 'analyzer',
    produced_at: '2026-07-01T12:00:00.000Z',
    snapshot_id: 'snap-1',
    status: 'open',
    ...over,
  };
}

/** In-memory store that satisfies both the writer and recaller surfaces. */
function makeFakeStore() {
  const records = new Map<string, MemoryRecord>();
  const embeddings = new Map<string, number[]>();
  return {
    records,
    embeddings,
    store: vi.fn(async (r: MemoryRecord) => {
      records.set(r.id, r);
    }),
    storeEmbedding: vi.fn(async (id: string, e: number[]) => {
      embeddings.set(id, e);
    }),
    // Naive keyword recall over stored records — enough to prove a mirrored
    // finding is retrievable by MemoryService-shaped query (type + text).
    query: vi.fn(async (q: MemoryQuery): Promise<MemoryResult[]> => {
      const needle = q.text.toLowerCase();
      return [...records.values()]
        .filter((r) => !q.type || r.type === q.type)
        .filter(
          (r) =>
            r.name.toLowerCase().includes(needle) ||
            r.content.toLowerCase().includes(needle),
        )
        .map((r) => ({ record: r, score: 0.9, sourceLod: r.lodCurrent, tokenEstimate: 1 }));
    }),
  };
}

describe('findingToMemoryRecord', () => {
  it('maps a finding into a first-class finding MemoryRecord', () => {
    const rec = findingToMemoryRecord(makeFinding(), { project: 'gsd-skill-creator' });
    expect(rec.type).toBe('finding');
    expect(rec.name).toBe('Unreachable helper never imported');
    expect(rec.confidence).toBe(0.82);
    expect(rec.provenance.project).toBe('gsd-skill-creator');
    expect(rec.provenance.scope).toBe('project');
    expect(rec.provenance.visibility).toBe('internal');
    expect(rec.tags).toContain('finding:dead_code');
    expect(rec.tags).toContain('severity:high');
    expect(rec.content).toContain('The symbol foo()');
    expect(rec.sourceFile).toBe('src/util/foo.ts');
    // valid_from derives from the finding's produced_at.
    expect(rec.validFrom.toISOString()).toBe('2026-07-01T12:00:00.000Z');
  });

  it('is deterministic — same finding yields the same stable id', () => {
    const a = findingToMemoryRecord(makeFinding(), { project: 'p' });
    const b = findingToMemoryRecord(makeFinding(), { project: 'p' });
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('findingText combines the semantically meaningful surface', () => {
    const t = findingText(makeFinding());
    expect(t).toContain('Unreachable helper');
    expect(t).toContain('zero inbound edges');
    expect(t).toContain('src/util/foo.ts');
  });
});

describe('FindingMemorySync.syncProject', () => {
  it('embeds and mirrors every open finding into the writer', async () => {
    const findings = [
      makeFinding({ id: 'F-1', title: 'Dead code A' }),
      makeFinding({ id: 'F-2', title: 'Hot spot B', kind: 'hot_spot', severity: 'med' }),
    ];
    const source: FindingSource = { listOpenFindings: vi.fn(async () => findings) };
    const embedder: FindingEmbedder = {
      embed: vi.fn(async () => ({ embedding: [0.1, 0.2, 0.3] })),
    };
    const store = makeFakeStore();
    const writer: FindingMemoryWriter = store;

    const sync = new FindingMemorySync({ source, embedder, writer });
    const result = await sync.syncProject('proj-1', 'gsd-skill-creator');

    expect(result.mirrored).toHaveLength(2);
    expect(result.embedded).toBe(2);
    expect(result.cacheHits).toBe(0);
    expect(store.store).toHaveBeenCalledTimes(2);
    expect(store.storeEmbedding).toHaveBeenCalledTimes(2);
    // Both records carry the repo provenance (the cross-project join key).
    for (const r of result.mirrored) {
      expect(r.provenance.project).toBe('gsd-skill-creator');
      expect(store.embeddings.get(r.id)).toEqual([0.1, 0.2, 0.3]);
    }
  });

  it('makes a mirrored finding recallable via a type=finding query', async () => {
    const source: FindingSource = {
      listOpenFindings: vi.fn(async () => [makeFinding({ title: 'Unreachable helper widget' })]),
    };
    const embedder: FindingEmbedder = { embed: vi.fn(async () => ({ embedding: [1, 0] })) };
    const store = makeFakeStore();

    await new FindingMemorySync({ source, embedder, writer: store }).syncProject('proj-1', 'repo-x');

    const hits = await store.query({ text: 'widget', type: 'finding' });
    expect(hits).toHaveLength(1);
    expect(hits[0].record.type).toBe('finding');
    expect(hits[0].record.name).toBe('Unreachable helper widget');
    expect(hits[0].record.provenance.project).toBe('repo-x');
  });

  it('reuses a cached embedding instead of re-embedding', async () => {
    const source: FindingSource = { listOpenFindings: vi.fn(async () => [makeFinding()]) };
    const embedder: FindingEmbedder = { embed: vi.fn(async () => ({ embedding: [9, 9] })) };
    const store = makeFakeStore();
    const cache: FindingEmbeddingCache = {
      getFindingEmbedding: vi.fn(async () => [0.5, 0.5]),
      setFindingEmbedding: vi.fn(async () => {}),
    };

    const result = await new FindingMemorySync({ source, embedder, writer: store, cache }).syncProject(
      'proj-1',
      'repo-x',
    );

    expect(result.cacheHits).toBe(1);
    expect(result.embedded).toBe(0);
    expect(embedder.embed).not.toHaveBeenCalled();
    expect(cache.setFindingEmbedding).not.toHaveBeenCalled();
    // The cached vector is what gets mirrored to pgvector.
    expect(store.storeEmbedding).toHaveBeenCalledWith(result.mirrored[0].id, [0.5, 0.5]);
  });

  it('embeds and populates the cache on a miss', async () => {
    const source: FindingSource = { listOpenFindings: vi.fn(async () => [makeFinding()]) };
    const embedder: FindingEmbedder = { embed: vi.fn(async () => ({ embedding: [2, 2] })) };
    const store = makeFakeStore();
    const cache: FindingEmbeddingCache = {
      getFindingEmbedding: vi.fn(async () => null),
      setFindingEmbedding: vi.fn(async () => {}),
    };

    const result = await new FindingMemorySync({ source, embedder, writer: store, cache }).syncProject(
      'proj-1',
    );

    expect(result.embedded).toBe(1);
    expect(cache.setFindingEmbedding).toHaveBeenCalledWith('proj-1', 'F-abc123', [2, 2]);
    // No project name given → falls back to project id as the join key.
    expect(result.mirrored[0].provenance.project).toBe('proj-1');
  });
});
