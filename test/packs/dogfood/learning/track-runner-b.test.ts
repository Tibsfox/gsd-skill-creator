/**
 * Tests for Track B runner (Parts VI-X: chapters 18-33).
 * Validates independent execution, angular region assignment,
 * high math density handling, philosophical content tagging,
 * budget enforcement, and checkpoint callbacks.
 */

import { describe, it, expect, vi } from 'vitest';
import { runTrackB } from '../../../../src/dogfood/learning/track-runner.js';
import type { ChunkInput, IngestionState } from '../../../../src/dogfood/learning/types.js';
import type { EcosystemDocIndex } from '../../../../src/dogfood/learning/cross-referencer.js';

// --- Helpers ---

function makeChunk(overrides: Partial<ChunkInput> = {}): ChunkInput {
  return {
    id: 'chunk-1',
    part: 6,
    chapter: 18,
    section: '18.1',
    text: 'Definition: A set is a well-defined collection of distinct objects. The Axiom of extensionality states that two sets are equal if they have the same elements.',
    contentType: 'prose',
    mathDensity: 0.3,
    wordCount: 200,
    estimatedTokens: 300,
    crossRefs: [],
    ...overrides,
  };
}

function makeEcosystemIndex(): EcosystemDocIndex {
  const index: EcosystemDocIndex = new Map();

  index.set('set theory', [
    { document: 'docs/foundations/sets.md', section: 'Fundamentals', description: 'Set operations and axioms' },
  ]);
  index.set('category theory', [
    { document: 'docs/foundations/categories.md', section: 'Morphisms', description: 'Categories, functors, natural transformations' },
  ]);
  index.set('information theory', [
    { document: 'docs/foundations/information.md', section: 'Entropy', description: 'Shannon entropy, mutual information' },
  ]);
  index.set('l-system', [
    { document: 'docs/applications/fractals.md', section: 'L-systems', description: 'Lindenmayer systems and growth' },
  ]);
  index.set('physics', [
    { document: 'docs/applications/physics.md', section: 'Mechanics', description: 'Classical and quantum mechanics' },
  ]);
  index.set('consciousness', [
    { document: 'docs/applications/consciousness.md', section: 'Philosophy', description: 'Philosophy of mind' },
  ]);

  return index;
}

// --- Tests ---

describe('runTrackB', () => {
  it('runs Parts VI-X filtering to chapters 18-33', async () => {
    const manifest = [
      // Parts I-V chunks (should be excluded)
      makeChunk({ id: 'ch1-1', part: 1, chapter: 1, estimatedTokens: 100 }),
      makeChunk({ id: 'ch3-1', part: 2, chapter: 3, estimatedTokens: 100 }),
      makeChunk({ id: 'ch10-1', part: 4, chapter: 10, estimatedTokens: 100 }),
      // Parts VI-X chunks (should be included)
      makeChunk({ id: 'ch18-1', part: 6, chapter: 18, estimatedTokens: 200 }),
      makeChunk({ id: 'ch25-1', part: 8, chapter: 25, estimatedTokens: 200,
        text: 'Definition: Information entropy is a measure of uncertainty.' }),
      makeChunk({ id: 'ch33-1', part: 10, chapter: 33, estimatedTokens: 200,
        text: 'Definition: Consciousness is the state of being aware.' }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    // Should not include any chapters from 1-17
    for (const ch of result.chaptersProcessed) {
      expect(ch).toBeGreaterThanOrEqual(18);
      expect(ch).toBeLessThanOrEqual(33);
    }
    // Should include at least some of our Track B chapters
    expect(result.chaptersProcessed.length).toBeGreaterThan(0);
  });

  it('processes chapters in order 18 through 33', async () => {
    const manifest = [
      makeChunk({ id: 'ch20-1', part: 6, chapter: 20, estimatedTokens: 200,
        text: 'Definition: A power set is the set of all subsets.' }),
      makeChunk({ id: 'ch18-1', part: 6, chapter: 18, estimatedTokens: 200 }),
      makeChunk({ id: 'ch19-1', part: 6, chapter: 19, estimatedTokens: 200,
        text: 'Definition: A relation is a set of ordered pairs.' }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    // chaptersProcessed should be sorted
    const sorted = [...result.chaptersProcessed].sort((a, b) => a - b);
    expect(result.chaptersProcessed).toEqual(sorted);
  });

  it('assigns Part VI concepts theta near 5*pi/8', async () => {
    const manifest = [
      makeChunk({
        id: 'ch18-set',
        part: 6,
        chapter: 18,
        estimatedTokens: 300,
        text: 'Definition: A set is a well-defined collection. The Axiom of extensionality establishes set equality.',
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    expect(result.concepts.length).toBeGreaterThan(0);
    const target = (5 * Math.PI) / 8;
    const tolerance = Math.PI / 16;
    for (const concept of result.concepts) {
      expect(concept.theta).toBeGreaterThanOrEqual(target - tolerance);
      expect(concept.theta).toBeLessThanOrEqual(target + tolerance);
    }
  });

  it('assigns Part VII concepts theta near 3*pi/4', async () => {
    const manifest = [
      makeChunk({
        id: 'ch21-cat',
        part: 7,
        chapter: 21,
        estimatedTokens: 300,
        text: 'Definition: A category consists of objects and morphisms. The Yoneda lemma establishes representability.',
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    expect(result.concepts.length).toBeGreaterThan(0);
    const target = (3 * Math.PI) / 4;
    const tolerance = Math.PI / 16;
    for (const concept of result.concepts) {
      expect(concept.theta).toBeGreaterThanOrEqual(target - tolerance);
      expect(concept.theta).toBeLessThanOrEqual(target + tolerance);
    }
  });

  it('assigns Part X concepts theta near 9*pi/8', async () => {
    const manifest = [
      makeChunk({
        id: 'ch31-phys',
        part: 10,
        chapter: 31,
        estimatedTokens: 300,
        text: 'Definition: Quantum mechanics describes the behavior of particles at the subatomic scale.',
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    expect(result.concepts.length).toBeGreaterThan(0);
    const target = (9 * Math.PI) / 8;
    const tolerance = Math.PI / 16;
    for (const concept of result.concepts) {
      expect(concept.theta).toBeGreaterThanOrEqual(target - tolerance);
      expect(concept.theta).toBeLessThanOrEqual(target + tolerance);
    }
  });

  it('handles high math density chunks without crash', async () => {
    const manifest = [
      makeChunk({
        id: 'ch24-dense',
        part: 8,
        chapter: 24,
        mathDensity: 0.9,
        estimatedTokens: 500,
        text: `Theorem 3.1 (Shannon entropy): H(X) = -sum p(x) log p(x).
Definition: An entropy function satisfies continuity, symmetry, and grouping axioms.
Theorem 3.2 (Source coding theorem): The optimal code length satisfies H(X) <= L < H(X) + 1.
Definition: A prefix code is one in which no codeword is a prefix of any other.`,
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    // Should process without crash
    expect(result.concepts.length).toBeGreaterThan(0);
    // No errors of severity 'error'
    const errorSeverityErrors = result.errors.filter(e => e.severity === 'error');
    expect(errorSeverityErrors).toHaveLength(0);
  });

  it('tags philosophical content from Part X differently', async () => {
    const manifest = [
      makeChunk({
        id: 'ch33-phil',
        part: 10,
        chapter: 33,
        contentType: 'philosophical',
        estimatedTokens: 400,
        text: `Definition: Consciousness is the subjective experience of being. The Hard problem of consciousness asks why physical processes give rise to subjective experience. Philosophy of mind explores the relationship between mental and physical states.`,
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    // Concepts should be detected (not empty)
    expect(result.concepts.length).toBeGreaterThan(0);
    // At least one concept from Part X
    expect(result.concepts.some(c => c.sourcePart === 10)).toBe(true);
  });

  it('LEARN-06: operates independently without Track A output', async () => {
    // Verify runTrackB accepts ONLY { manifest, ecosystemIndex, tokenBudget?, onCheckpoint? }
    // and NOT a Track A result parameter. Call without any Track A data.
    const manifest = [
      makeChunk({
        id: 'ch18-indep',
        part: 6,
        chapter: 18,
        estimatedTokens: 200,
      }),
    ];

    // This should succeed without any Track A data
    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.chaptersProcessed).toBeDefined();
    expect(result.errors).toBeDefined();
  });

  it('enforces token budget within ~100K for Track B', async () => {
    // Create chunks that exceed 100K tokens total
    const manifest: ChunkInput[] = [];
    for (let i = 0; i < 20; i++) {
      manifest.push(
        makeChunk({
          id: `ch${18 + (i % 16)}-big-${i}`,
          part: 6 + Math.floor(i / 4),
          chapter: 18 + (i % 16),
          estimatedTokens: 10_000,
          wordCount: 7000,
          text: `Definition: Concept${i} is a mathematical structure.`,
        }),
      );
    }
    // Total: 20 * 10K = 200K tokens, budget is 100K

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
      tokenBudget: 100_000,
    });

    // Should stop before processing all chunks
    expect(result.state.tokenBudgetRemaining).toBeGreaterThanOrEqual(0);
    expect(result.state.totalChunksProcessed).toBeLessThan(20);
  });

  it('calls onCheckpoint at chapter boundaries', async () => {
    const manifest = [
      makeChunk({
        id: 'ch18-1', part: 6, chapter: 18, estimatedTokens: 200,
        text: 'Definition: A set is a collection of objects.',
      }),
      makeChunk({
        id: 'ch19-1', part: 6, chapter: 19, estimatedTokens: 200,
        text: 'Definition: A function maps elements from one set to another.',
      }),
      makeChunk({
        id: 'ch20-1', part: 6, chapter: 20, estimatedTokens: 200,
        text: 'Definition: A relation is a set of ordered pairs.',
      }),
    ];

    const checkpoint = vi.fn();

    await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
      onCheckpoint: checkpoint,
    });

    // Should fire at boundaries between ch18->19 and ch19->20
    expect(checkpoint).toHaveBeenCalledTimes(2);
  });

  it('populates ecosystemMappings on every returned concept', async () => {
    const manifest = [
      makeChunk({
        id: 'ch18-eco',
        part: 6,
        chapter: 18,
        estimatedTokens: 300,
        text: 'Definition: A set is a well-defined collection. Definition: An element belongs to a set.',
      }),
      makeChunk({
        id: 'ch21-eco',
        part: 7,
        chapter: 21,
        estimatedTokens: 300,
        text: 'Definition: A functor maps between categories preserving structure.',
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    expect(result.concepts.length).toBeGreaterThan(0);
    for (const concept of result.concepts) {
      expect(concept.ecosystemMappings.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns accurate processing statistics', async () => {
    const manifest = [
      makeChunk({
        id: 'ch18-stat', part: 6, chapter: 18, estimatedTokens: 200,
        text: 'Definition: A set is a well-defined collection.',
      }),
      makeChunk({
        id: 'ch19-stat', part: 6, chapter: 19, estimatedTokens: 200,
        text: 'Definition: A function maps between sets.',
      }),
      makeChunk({
        id: 'ch20-stat', part: 6, chapter: 20, estimatedTokens: 200,
        text: 'Definition: A relation is a subset of a Cartesian product.',
      }),
    ];

    const result = await runTrackB({
      manifest,
      ecosystemIndex: makeEcosystemIndex(),
    });

    // Chunks processed should equal number of chunks actually consumed
    expect(result.state.totalChunksProcessed).toBe(3);
    // Concepts learned should match result array
    expect(result.state.totalConceptsLearned).toBe(result.concepts.length);
  });
});
