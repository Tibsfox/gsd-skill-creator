/**
 * CF-M5-03: steps-to-execution predictor top-3 accuracy ≥50% on 1000-session
 * synthesised fixture.
 *
 * @module cache/__tests__/step-graph.test
 */

import { describe, it, expect } from 'vitest';
import { StepGraph } from '../step-graph.js';

/**
 * Build a 1000-session synthetic trace fixture. Each session is a sequence
 * of skill activations drawn from one of 6 "workflow archetypes". Each
 * archetype has a deterministic skill chain + a low-probability noise injection.
 *
 * Returns train/eval split (80/20) with explicit (prefix, next) labels.
 */
function buildSessionFixture(): {
  train: Array<{ prefix: string[]; next: string }>;
  evalSet: Array<{ prefix: string[]; next: string }>;
} {
  const archetypes: string[][] = [
    ['read', 'grep', 'edit', 'bash', 'write'],
    ['glob', 'read', 'write', 'edit', 'bash'],
    ['bash', 'read', 'grep', 'edit', 'write'],
    ['edit', 'bash', 'grep', 'read', 'write'],
    ['write', 'edit', 'bash', 'read', 'grep'],
    ['read', 'edit', 'bash', 'grep', 'write'],
  ];
  // Seeded PRNG for deterministic fixture.
  let seed = 2026_04_18;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const train: Array<{ prefix: string[]; next: string }> = [];
  const evalSet: Array<{ prefix: string[]; next: string }> = [];

  const totalSessions = 1000;
  for (let s = 0; s < totalSessions; s++) {
    const arche = archetypes[s % archetypes.length];
    // Build a chain of length 5 with 10% noise skill insertion.
    const chain: string[] = [];
    for (let i = 0; i < arche.length; i++) {
      if (rand() < 0.1) {
        // Inject noise skill from another archetype.
        const other = archetypes[(s + 1) % archetypes.length];
        chain.push(other[i % other.length]);
      } else {
        chain.push(arche[i]);
      }
    }
    const isEval = s % 5 === 0; // 20% eval
    const bucket = isEval ? evalSet : train;
    for (let k = 1; k < chain.length; k++) {
      bucket.push({
        prefix: chain.slice(Math.max(0, k - 2), k),
        next: chain[k],
      });
    }
  }
  return { train, evalSet };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('StepGraph — basic', () => {
  it('predicts most-frequent successor', () => {
    const g = new StepGraph();
    for (let i = 0; i < 5; i++) g.observe(['read'], 'edit');
    for (let i = 0; i < 2; i++) g.observe(['read'], 'bash');
    const p = g.predict(['read'], 3);
    expect(p.id).toBe('read');
    expect(p.predictedNext[0]).toBe('edit');
    expect(p.confidence).toBeGreaterThan(0);
  });

  it('ranks top-N by probability', () => {
    const g = new StepGraph();
    for (let i = 0; i < 10; i++) g.observe(['a'], 'x');
    for (let i = 0; i < 5; i++) g.observe(['a'], 'y');
    for (let i = 0; i < 1; i++) g.observe(['a'], 'z');
    const p = g.predict(['a'], 2);
    expect(p.predictedNext).toEqual(['x', 'y']);
  });

  it('returns empty when no observations', () => {
    const g = new StepGraph();
    const p = g.predict(['a'], 3);
    expect(p.predictedNext).toEqual([]);
    expect(p.confidence).toBe(0);
  });

  it('backs off to bigram when trigram is unseen', () => {
    const g = new StepGraph({ maxOrder: 2 });
    // train only bigram `b -> c`
    g.observe(['b'], 'c');
    g.observe(['b'], 'c');
    // predict with trigram prefix — should back off to bigram.
    const p = g.predict(['x', 'b'], 3);
    expect(p.predictedNext[0]).toBe('c');
  });

  it('uses unigram fallback when no prefix context matches', () => {
    const g = new StepGraph();
    g.observe(['known'], 'x');
    g.observe(['known'], 'y');
    // totally unseen prefix, but vocab has x/y — falls back to unigram.
    const p = g.predict(['unseen'], 2);
    expect(p.predictedNext.length).toBeGreaterThan(0);
  });
});

describe('StepGraph — clear', () => {
  it('resets all state', () => {
    const g = new StepGraph();
    g.observe(['a'], 'b');
    g.clear();
    expect(g.size()).toBe(0);
    const p = g.predict(['a']);
    expect(p.predictedNext).toEqual([]);
  });
});

describe('CF-M5-03: top-3 accuracy ≥50% on 1000-session fixture', () => {
  it('achieves top-3 accuracy ≥0.50', () => {
    const { train, evalSet } = buildSessionFixture();
    const g = new StepGraph({ maxOrder: 2 });
    for (const t of train) g.observe(t.prefix, t.next);
    const acc = g.evaluateAccuracy(evalSet, 3);
    expect(acc).toBeGreaterThanOrEqual(0.5);
  });

  it('top-1 accuracy is lower than top-3', () => {
    const { train, evalSet } = buildSessionFixture();
    const g = new StepGraph({ maxOrder: 2 });
    for (const t of train) g.observe(t.prefix, t.next);
    const top1 = g.evaluateAccuracy(evalSet, 1);
    const top3 = g.evaluateAccuracy(evalSet, 3);
    expect(top3).toBeGreaterThanOrEqual(top1);
  });
});
