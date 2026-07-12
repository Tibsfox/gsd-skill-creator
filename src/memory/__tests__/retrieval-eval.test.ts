/**
 * Retrieval-eval harness for the SHIPPED query path (item 9b).
 *
 * The three pre-existing memory evals run on grove/arena substrate and none of
 * them exercise `MemoryService.query()` + `hybridRerank` end-to-end — so the
 * inline "96.6% -> 98.4% LongMemEval" claim (hybrid-scorer.ts / service.ts) had
 * zero coverage on the path real callers use. This is the blocking, no-DB gate
 * that measures R@1 / R@5 / MRR over a seeded labeled corpus and, critically,
 * pins the reranker to the service wiring: one query's gold wins ONLY because
 * `hybridRerank` runs inside `query()`. Remove/break that call (service.ts) and
 * the flip assertion below goes red.
 *
 * Determinism discipline (keeps this out of the flaky lane): every query runs
 * with applyTemporalDecay:false and no queryContext (decay + scope multiply the
 * score AFTER rerank and would mask/flake it), records are temporalClass
 * 'timeless', and no query uses relative-date wording (parseTimeOffset would
 * make fixtures day-drift). Seeded records stay at LOD-300 (FileStore) —
 * accessCount 0 so nothing auto-promotes to the LOD-200 index.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MemoryService } from '../service.js';
import { LodLevel } from '../../lod/types.js';
import type { MemoryRecord, MemoryType, TemporalClass } from '../types.js';

// ─── Fixture ─────────────────────────────────────────────────────────────────

interface Seed {
  id: string;
  name: string;
  description: string;
  content: string;
  tags?: string[];
}

function makeRecord(seed: Seed): MemoryRecord {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: seed.id,
    type: 'feedback' as MemoryType,
    name: seed.name,
    description: seed.description,
    content: seed.content,
    lodCurrent: LodLevel.DETAILED,
    tags: seed.tags ?? [],
    confidence: 1.0,
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    provenance: { scope: 'project', visibility: 'internal', domains: [] },
    temporalClass: 'timeless' as TemporalClass,
    relatedTo: [],
  };
}

/**
 * Labeled corpus. FileStore.scoreRecord ranks by WHERE a keyword hits:
 * name = 1.0, description = 0.7, tag = 0.5, content = 0.3. Each "gold" that must
 * win on raw retrieval carries the query terms in its NAME (1.0) while its
 * distractors carry them only in description/content — an unambiguous win that
 * does not depend on the reranker.
 *
 * The FLIP pair is the exception and the whole point: the gold has the query
 * terms only in CONTENT (raw 0.3) plus an exact quoted phrase, while the
 * distractor has a query term in its DESCRIPTION (raw 0.7). On raw distance the
 * distractor wins; hybridRerank's quoted-phrase boost (weight 0.60, content-only)
 * pulls the gold to the top. Break the rerank call and the distractor wins.
 */
const CORPUS: Seed[] = [
  {
    id: 'gold-pgvector',
    name: 'pgvector indexing playbook',
    description: 'operational notes',
    content: 'ivfflat lists and hnsw graphs for approximate search',
    tags: ['database'],
  },
  {
    id: 'distract-pgvector',
    name: 'weekly standup log',
    description: 'a grab-bag of updates',
    content: 'someone brought up pgvector indexing during the sync',
    tags: ['notes'],
  },
  {
    id: 'gold-arena',
    name: 'arena allocator blueprint',
    description: 'memory strategy',
    content: 'bump a pointer, reset frees everything at once',
    tags: ['rust'],
  },
  {
    id: 'distract-arena',
    name: 'sprint retro',
    description: 'assorted follow-ups',
    content: 'we touched on the arena allocator idea briefly',
    tags: ['notes'],
  },
  {
    id: 'gold-geometry',
    name: 'geometry nodes cookbook',
    description: 'procedural workflow',
    content: 'instance on points and scatter across a surface',
    tags: ['3d'],
  },
  {
    id: 'distract-geometry',
    name: 'someday backlog',
    description: 'low priority ideas',
    content: 'learn geometry nodes when there is time',
    tags: ['todo'],
  },
  // ─ FLIP pair (guards the reranker wiring) ─
  {
    id: 'flip-gold',
    name: 'quarterly benchmark report',
    description: 'a neutral executive summary',
    content: 'the team recorded that the duckdb analytics choice was locked in after trials',
    tags: ['bench'],
  },
  {
    id: 'flip-distract',
    name: 'catalog of topics',
    description: 'engine performance overview and appendix',
    content: 'a general page about assorted mechanical subjects',
    tags: ['misc'],
  },
];

interface LabeledQuery {
  query: string;
  goldId: string;
}

const QUERIES: LabeledQuery[] = [
  { query: 'pgvector indexing', goldId: 'gold-pgvector' },
  { query: 'arena allocator', goldId: 'gold-arena' },
  { query: 'geometry nodes', goldId: 'gold-geometry' },
  // Gold reaches rank 1 ONLY through the reranker's quoted-phrase boost.
  { query: "engine 'duckdb analytics choice'", goldId: 'flip-gold' },
];

// ─── Metrics ─────────────────────────────────────────────────────────────────

function rankOf(resultIds: string[], goldId: string): number {
  const idx = resultIds.indexOf(goldId);
  return idx < 0 ? -1 : idx + 1; // 1-based rank, -1 if absent
}

function recallAtK(resultIds: string[], goldId: string, k: number): number {
  const r = rankOf(resultIds, goldId);
  return r > 0 && r <= k ? 1 : 0;
}

function reciprocalRank(resultIds: string[], goldId: string): number {
  const r = rankOf(resultIds, goldId);
  return r > 0 ? 1 / r : 0;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('retrieval-eval: MemoryService.query() shipped path', () => {
  let tempDir: string;
  let service: MemoryService;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'retrieval-eval-'));
    service = new MemoryService({ memoryDir: join(tempDir, 'memory'), indexFile: 'MEMORY.md' });
    for (const seed of CORPUS) {
      await service.store(makeRecord(seed));
    }
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function resultIdsFor(query: string): Promise<string[]> {
    const resp = await service.query(query, { applyTemporalDecay: false });
    return resp.results.map(r => r.record.id);
  }

  it('every labeled query yields >= 2 candidates (so the rerank gate fires)', async () => {
    for (const { query } of QUERIES) {
      const ids = await resultIdsFor(query);
      expect(ids.length, `query "${query}" candidate count`).toBeGreaterThanOrEqual(2);
    }
  });

  it('meets a conservative recall/MRR floor across the seeded set', async () => {
    let r1 = 0;
    let r5 = 0;
    let mrrSum = 0;
    for (const { query, goldId } of QUERIES) {
      const ids = await resultIdsFor(query);
      r1 += recallAtK(ids, goldId, 1);
      r5 += recallAtK(ids, goldId, 5);
      mrrSum += reciprocalRank(ids, goldId);
    }
    const n = QUERIES.length;
    const recallAt1 = r1 / n;
    const recallAt5 = r5 / n;
    const mrr = mrrSum / n;

    // Conservative floors: gold must always be retrievable in the top-5, MRR
    // stays high on a hand-tuned set. Kept loose enough to never flake under
    // full-suite contention, strict enough to catch a broken retrieval path.
    expect(recallAt5, 'R@5').toBe(1);
    expect(recallAt1, 'R@1').toBeGreaterThanOrEqual(0.75);
    expect(mrr, 'MRR').toBeGreaterThanOrEqual(0.8);
  });

  it('reranker wiring: quoted-phrase gold beats a higher-raw-score distractor', async () => {
    // flip-distract has the query term "engine" in its DESCRIPTION (raw 0.7);
    // flip-gold has the query terms only in CONTENT (raw 0.3) plus the exact
    // quoted phrase. Without hybridRerank, flip-distract ranks first. With it,
    // the 0.60 quoted-phrase boost pulls flip-gold to rank 1. This is the guard
    // that fails if the rerank call is removed from MemoryService.query().
    const ids = await resultIdsFor("engine 'duckdb analytics choice'");
    expect(ids).toContain('flip-gold');
    expect(ids).toContain('flip-distract');
    expect(ids[0], 'rerank must lift the quoted-phrase gold to the top').toBe('flip-gold');
  });
});
