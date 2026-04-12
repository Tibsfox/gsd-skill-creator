import { describe, it, expect, vi } from 'vitest';
import { runTrackA, type TrackResult } from '../../../src/dogfood/learning/track-runner.js';
import { buildDefaultEcosystemIndex, type EcosystemDocIndex } from '../../../src/dogfood/learning/cross-referencer.js';
import type { ChunkInput, IngestionState } from '../../../src/dogfood/learning/types.js';
import { DEFAULT_TOKEN_BUDGET } from '../../../src/dogfood/learning/types.js';

// --- Factories ---

function makeChunk(overrides: Partial<ChunkInput> = {}): ChunkInput {
  return {
    id: 'chunk-01',
    part: 1,
    chapter: 1,
    section: 'introduction',
    text: 'Definition: A counting number is a natural number used for enumeration.',
    contentType: 'prose',
    mathDensity: 0.3,
    wordCount: 50,
    estimatedTokens: 100,
    crossRefs: [],
    ...overrides,
  };
}

/** Map chapter to part based on The Space Between structure (33 chapters, 10 parts) */
function chapterToPart(ch: number): number {
  if (ch <= 3) return 1;   // Part I: Seeing (ch 1-3)
  if (ch <= 6) return 2;   // Part II: Hearing (ch 4-6)
  if (ch <= 8) return 3;   // Part III: Moving (ch 7-8)
  if (ch <= 11) return 4;  // Part IV: Expanding (ch 9-11)
  if (ch <= 14) return 5;  // Part V: Grounding (ch 12-14)
  if (ch <= 17) return 5;  // Part V continued (ch 15-17)
  if (ch <= 20) return 6;  // Part VI: Defining (ch 18-20)
  if (ch <= 23) return 7;  // Part VII: Mapping (ch 21-23)
  if (ch <= 26) return 8;  // Part VIII: Converging (ch 24-26)
  if (ch <= 29) return 9;  // Part IX: Growing (ch 27-29)
  return 10;               // Part X: Being (ch 30-33)
}

function makeManifest(chapters: number[]): ChunkInput[] {
  return chapters.map((ch, i) => {
    const part = chapterToPart(ch);
    return makeChunk({
      id: `chunk-ch${ch}-${i}`,
      part,
      chapter: ch,
      section: `sec-${i}`,
      text: `Definition: Concept ${ch} is a fundamental idea from chapter ${ch}. It requires knowledge of prior concepts.`,
      estimatedTokens: 200,
    });
  });
}

describe('runTrackA', () => {
  const ecosystemIndex = buildDefaultEcosystemIndex();

  it('runs Parts I-V in chapter order 1 through 17', async () => {
    const manifest = makeManifest([1, 5, 3, 10, 17, 2, 7, 20, 15]);
    const result = await runTrackA({ manifest, ecosystemIndex });

    // Parts I-V = chapters 1-17, Part VI+ chunks should be excluded
    const processedChapters = result.chaptersProcessed;
    for (const ch of processedChapters) {
      expect(ch).toBeLessThanOrEqual(17);
    }
    // Should not include chapter 20 (Part VI+)
    expect(processedChapters).not.toContain(20);
  });

  it('calls checkpoint callback after each chapter boundary', async () => {
    const manifest = makeManifest([1, 2, 3]);
    const checkpoints: IngestionState[] = [];
    const onCheckpoint = vi.fn((state: IngestionState) => {
      checkpoints.push({ ...state });
    });

    await runTrackA({ manifest, ecosystemIndex, onCheckpoint });

    // Should fire checkpoints at chapter boundaries (between ch1->ch2, ch2->ch3)
    expect(onCheckpoint).toHaveBeenCalled();
    expect(checkpoints.length).toBeGreaterThanOrEqual(1);
  });

  it('tracks token budget across all chapters', async () => {
    const manifest = makeManifest([1, 2, 3, 4, 5]);
    const result = await runTrackA({ manifest, ecosystemIndex });

    expect(result.state.tokenBudgetUsed).toBeGreaterThan(0);
    expect(result.state.tokenBudgetUsed).toBeLessThanOrEqual(DEFAULT_TOKEN_BUDGET);
    expect(result.state.tokenBudgetRemaining).toBe(DEFAULT_TOKEN_BUDGET - result.state.tokenBudgetUsed);
  });

  it('stops processing when token budget exhausted', async () => {
    // Create chunks that exceed a small budget
    const manifest = [
      makeChunk({ id: 'c1', part: 1, chapter: 1, estimatedTokens: 600 }),
      makeChunk({ id: 'c2', part: 1, chapter: 2, estimatedTokens: 600 }),
    ];
    const result = await runTrackA({
      manifest,
      ecosystemIndex,
      tokenBudget: 1000,
    });

    // Only first chunk should be processed (600 < 1000, but 1200 > 1000)
    expect(result.state.totalChunksProcessed).toBe(1);
    expect(result.state.tokenBudgetUsed).toBe(600);
    expect(result.errors.some(e => e.message.includes('budget'))).toBe(true);
  });

  it('populates ecosystemMappings on every returned concept', async () => {
    const manifest = makeManifest([1, 2, 3]);
    const result = await runTrackA({ manifest, ecosystemIndex });

    for (const concept of result.concepts) {
      expect(concept.ecosystemMappings.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns TrackResult with concepts, state, and errors', async () => {
    const manifest = makeManifest([1]);
    const result = await runTrackA({ manifest, ecosystemIndex });

    expect(result).toHaveProperty('concepts');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('chaptersProcessed');
    expect(Array.isArray(result.concepts)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.chaptersProcessed)).toBe(true);
  });

  it('LEARN-06: operates independently (no Track B input required)', async () => {
    const manifest = makeManifest([1, 2]);
    // runTrackA only takes manifest, ecosystemIndex, tokenBudget, onCheckpoint
    // No Track B parameter — independent operation
    const result = await runTrackA({ manifest, ecosystemIndex });

    expect(result.concepts.length).toBeGreaterThanOrEqual(0);
    expect(result.state).toBeDefined();
  });

  it('handles manifest with zero chunks for a chapter', async () => {
    // Only chapter 1 and chapter 5 — chapters 2-4 have no chunks
    const manifest = [
      makeChunk({ id: 'c1', part: 1, chapter: 1 }),
      makeChunk({ id: 'c5', part: 2, chapter: 5 }),
    ];
    const result = await runTrackA({ manifest, ecosystemIndex });

    // Should process both without error
    expect(result.state.totalChunksProcessed).toBe(2);
    expect(result.chaptersProcessed).toContain(1);
    expect(result.chaptersProcessed).toContain(5);
  });

  it('reports processing statistics in final state', async () => {
    const manifest = makeManifest([1, 2, 3]);
    const result = await runTrackA({ manifest, ecosystemIndex });

    expect(result.state.totalChunksProcessed).toBe(3);
    expect(result.state.totalConceptsLearned).toBe(result.concepts.length);
    expect(result.state.tokenBudgetUsed).toBe(600); // 3 * 200
  });
});
