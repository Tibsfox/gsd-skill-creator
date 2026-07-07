/**
 * RET-8 — SkillApplicator build path for the pre-indexed EmbeddingIndex.
 *
 * The query/recall side (ScoreStage consuming the index) is covered in
 * score-stage-recall.test.ts. This file covers the BUILD side that makes RET-8
 * real: initialize()/reindex() populate the index by batch-embedding each
 * enabled skill's [description, ...intents] text exactly once, and reindex()
 * tracks the current enabled set. Keying is symmetric (build keys by skill name,
 * query looks up by the same name), so the query-path tests exercise it end to
 * end; here we assert the build actually runs against the right texts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkillApplicator } from './skill-applicator.js';
import { EmbeddingService } from '../embeddings/embedding-service.js';
import type { EmbeddingResult } from '../types/embeddings.js';
import type { SkillIndex, SkillIndexEntry } from '../storage/skill-index.js';
import type { SkillStore } from '../storage/skill-store.js';

function skillEntry(name: string, marker: string): SkillIndexEntry {
  return {
    name,
    description: `does ${marker} things`,
    enabled: true,
    triggers: { intents: [`${marker}-intent`] },
    path: `/skills/${name}`,
    mtime: 1,
  } as SkillIndexEntry;
}

function mockSkillIndex(enabled: SkillIndexEntry[]): SkillIndex {
  return {
    getEnabled: vi.fn(async () => enabled),
    findByTrigger: vi.fn(async () => []),
  } as unknown as SkillIndex;
}

function mockSkillStore(): SkillStore {
  return {
    read: vi.fn(async () => ({ body: 'content', metadata: { name: 'x', description: 'x' } })),
    list: vi.fn(async () => []),
    exists: vi.fn(async () => true),
  } as unknown as SkillStore;
}

describe('SkillApplicator EmbeddingIndex build path (RET-8)', () => {
  let embedBatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const svc = EmbeddingService.getInstance();
    // Deterministic, model-free vectors; the applicator's index embedFn calls
    // this via the same singleton captured in its constructor.
    embedBatchSpy = vi
      .spyOn(svc, 'embedBatch')
      .mockImplementation(async (texts: string[]): Promise<EmbeddingResult[]> =>
        texts.map(() => ({ embedding: [0, 0, 1], fromCache: false, method: 'heuristic' as const })),
      );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT build an index when retrieval is disabled', async () => {
    const applicator = new SkillApplicator(
      mockSkillIndex([skillEntry('skill-a', 'alpha')]),
      mockSkillStore(),
      // retrievalConfig omitted -> embeddingIndex undefined -> buildEmbeddingIndex is a no-op
    );
    await applicator.initialize();
    expect(embedBatchSpy).not.toHaveBeenCalled();
  });

  it('initialize() batch-embeds each enabled skill by its [description, ...intents] text', async () => {
    const skills = [skillEntry('skill-a', 'alpha'), skillEntry('skill-b', 'beta')];
    const applicator = new SkillApplicator(
      mockSkillIndex(skills),
      mockSkillStore(),
      undefined,
      undefined,
      undefined,
      { enabled: true },
    );

    await applicator.initialize();

    expect(embedBatchSpy).toHaveBeenCalled();
    const batched: string[] = embedBatchSpy.mock.calls.flatMap((c: unknown[]) => c[0] as string[]);
    // The exact text ScoreStage would embed on a miss: description + intents.
    expect(batched).toContain('does alpha things alpha-intent');
    expect(batched).toContain('does beta things beta-intent');
  });

  it('reindex() rebuilds against the current enabled set after a skill is removed', async () => {
    const skills = [skillEntry('skill-a', 'alpha'), skillEntry('skill-b', 'beta')];
    const index = mockSkillIndex(skills);
    const applicator = new SkillApplicator(
      index,
      mockSkillStore(),
      undefined,
      undefined,
      undefined,
      { enabled: true },
    );
    await applicator.initialize();
    embedBatchSpy.mockClear();

    // skill-b is no longer enabled.
    (index.getEnabled as ReturnType<typeof vi.fn>).mockResolvedValue([skills[0]]);
    await applicator.reindex();

    const rebatched: string[] = embedBatchSpy.mock.calls.flatMap((c: unknown[]) => c[0] as string[]);
    expect(rebatched).toContain('does alpha things alpha-intent');
    expect(rebatched).not.toContain('does beta things beta-intent');
  });

  it('degrades gracefully when the embedding backend throws (no throw from initialize)', async () => {
    embedBatchSpy.mockRejectedValue(new Error('backend unavailable'));
    const applicator = new SkillApplicator(
      mockSkillIndex([skillEntry('skill-a', 'alpha')]),
      mockSkillStore(),
      undefined,
      undefined,
      undefined,
      { enabled: true },
    );
    // buildEmbeddingIndex swallows the error; initialize must still complete.
    await expect(applicator.initialize()).resolves.toBeUndefined();
  });
});
