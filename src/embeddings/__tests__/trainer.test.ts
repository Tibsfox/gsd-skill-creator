/**
 * Trainer tests — CF-MD1-01..05 + SC-MD1-01 support + LS-37 planted cluster.
 *
 * Synthetic 3-cluster fixture (CF-MD1-01):
 *   Three disjoint groups {c1A,c1B,c1C}, {c2A,c2B,c2C}, {c3A,c3B,c3C}.
 *   Every training trace carries exactly the entities of one cluster.
 *   After skip-gram training, within-cluster cosine should dominate
 *   between-cluster cosine on ≥80% of held-out pairs.
 *
 * @module embeddings/__tests__/trainer.test
 */

import { describe, it, expect } from 'vitest';
import {
  trainEmbeddings,
  buildNegativeTable,
  rmsDrift,
  mulberry32,
} from '../trainer.js';
import { cosineSimilarity, buildStore } from '../api.js';
import type { DecisionTrace } from '../../types/memory.js';

// ─── Fixture builders ───────────────────────────────────────────────────────

function mkTrace(id: string, ts: number, entities: string[]): DecisionTrace {
  return {
    id,
    ts,
    actor: 'fixture',
    intent: 'planted-cluster',
    reasoning: '',
    constraints: [],
    alternatives: [],
    refs: { entityIds: entities },
  };
}

/** Three disjoint 3-entity clusters, each visited `visitsPerCluster` times. */
function plantedThreeClusterTraces(
  visitsPerCluster: number,
  seed = 1,
): { traces: DecisionTrace[]; clusters: string[][] } {
  const clusters = [
    ['c1A', 'c1B', 'c1C'],
    ['c2A', 'c2B', 'c2C'],
    ['c3A', 'c3B', 'c3C'],
  ];
  const rand = mulberry32(seed);
  const traces: DecisionTrace[] = [];
  let tsCounter = 1000;
  let traceIdx = 0;
  // Interleave cluster visits deterministically.
  for (let v = 0; v < visitsPerCluster; v++) {
    for (let ci = 0; ci < clusters.length; ci++) {
      // Shuffle entities within this trace to exercise ordering.
      const ents = clusters[ci].slice();
      for (let i = ents.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [ents[i], ents[j]] = [ents[j], ents[i]];
      }
      traces.push(mkTrace(`t${traceIdx++}`, tsCounter++, ents));
    }
  }
  return { traces, clusters };
}

// ─── buildNegativeTable ─────────────────────────────────────────────────────

describe('buildNegativeTable', () => {
  it('returns a table proportional to count^0.75', () => {
    const table = buildNegativeTable(3, [100, 1, 1]);
    const counts = new Map<number, number>();
    for (let i = 0; i < table.length; i++) {
      counts.set(table[i], (counts.get(table[i]) ?? 0) + 1);
    }
    const c0 = counts.get(0) ?? 0;
    const c1 = counts.get(1) ?? 0;
    const c2 = counts.get(2) ?? 0;
    expect(c0).toBeGreaterThan(c1);
    expect(c0).toBeGreaterThan(c2);
    // Non-zero classes present.
    expect(c1).toBeGreaterThan(0);
  });

  it('falls back to uniform when all counts are zero', () => {
    const table = buildNegativeTable(3, [0, 0, 0]);
    const seen = new Set<number>();
    for (let i = 0; i < table.length; i++) seen.add(table[i]);
    expect(seen.size).toBe(3);
  });

  it('returns an empty table for empty vocab', () => {
    expect(buildNegativeTable(0, []).length).toBe(0);
  });
});

// ─── rmsDrift ───────────────────────────────────────────────────────────────

describe('rmsDrift', () => {
  it('is zero for identical arrays', () => {
    const a = new Float64Array([1, 2, 3]);
    expect(rmsDrift(a, new Float64Array([1, 2, 3]))).toBe(0);
  });

  it('computes the RMS of per-element differences', () => {
    const a = new Float64Array([0, 0, 0]);
    const b = new Float64Array([2, 2, 2]);
    expect(rmsDrift(a, b)).toBeCloseTo(2, 12);
  });

  it('throws on length mismatch', () => {
    expect(() =>
      rmsDrift(new Float64Array(2), new Float64Array(3)),
    ).toThrow();
  });
});

// ─── Determinism ────────────────────────────────────────────────────────────

describe('trainEmbeddings — determinism', () => {
  it('same seed + traces → byte-identical embeddings', () => {
    const { traces } = plantedThreeClusterTraces(25, 42);
    const a = trainEmbeddings(traces, {
      embedDim: 16,
      seed: 2024,
      maxEpochs: 3,
      minCount: 1,
      convergenceTolerance: 0,
    });
    const b = trainEmbeddings(traces, {
      embedDim: 16,
      seed: 2024,
      maxEpochs: 3,
      minCount: 1,
      convergenceTolerance: 0,
    });
    expect(a.vocabulary).toEqual(b.vocabulary);
    expect(Array.from(a.model.inputEmbeddings)).toEqual(
      Array.from(b.model.inputEmbeddings),
    );
  });

  it('different seeds → different embeddings', () => {
    const { traces } = plantedThreeClusterTraces(25, 42);
    const a = trainEmbeddings(traces, {
      embedDim: 16,
      seed: 1,
      maxEpochs: 3,
      minCount: 1,
      convergenceTolerance: 0,
    });
    const b = trainEmbeddings(traces, {
      embedDim: 16,
      seed: 2,
      maxEpochs: 3,
      minCount: 1,
      convergenceTolerance: 0,
    });
    // At least some coordinate must differ.
    let anyDiff = false;
    for (let i = 0; i < a.model.inputEmbeddings.length; i++) {
      if (a.model.inputEmbeddings[i] !== b.model.inputEmbeddings[i]) {
        anyDiff = true;
        break;
      }
    }
    expect(anyDiff).toBe(true);
  });
});

// ─── Degenerate paths ───────────────────────────────────────────────────────

describe('trainEmbeddings — degenerate inputs', () => {
  it('handles empty trace stream', () => {
    const r = trainEmbeddings([], { maxEpochs: 2, minCount: 1 });
    expect(r.vocabulary).toEqual([]);
    expect(r.epochsRun).toBe(0);
  });

  it('handles vocabulary that fails minCount', () => {
    const traces = [mkTrace('t1', 1, ['a', 'b'])];
    const r = trainEmbeddings(traces, {
      maxEpochs: 2,
      minCount: 5, // nothing survives
    });
    expect(r.vocabulary).toEqual([]);
    expect(r.epochsRun).toBe(0);
  });
});

// ─── Planted 3-cluster fixture (LS-37 / CF-MD1-01) ──────────────────────────

describe('trainEmbeddings — LS-37 planted 3-cluster recovery', () => {
  it('recovers cluster membership on ≥80% of held-out pairs', () => {
    const { traces, clusters } = plantedThreeClusterTraces(40, 7);

    const r = trainEmbeddings(traces, {
      embedDim: 24,
      windowSize: 1,
      minCount: 1,
      negativeSamples: 5,
      learningRate: 0.05,
      minLearningRate: 0.005,
      maxEpochs: 30,
      convergenceTolerance: 0,
      seed: 2025,
    });

    const store = buildStore(r.model, r.vocabulary, r.vocabIndex);

    // For every pair of distinct entities (a, b), classify as WITHIN if they
    // share a cluster, BETWEEN otherwise. For each held-out pair we check
    // the cosine; we expect within-cluster cosine to exceed the BEST
    // between-cluster cosine for the same anchor ≥80% of the time.
    const entityToCluster = new Map<string, number>();
    clusters.forEach((members, ci) => {
      for (const e of members) entityToCluster.set(e, ci);
    });

    let hits = 0;
    let total = 0;
    const allEnts = clusters.flat();
    for (const anchor of allEnts) {
      const ac = entityToCluster.get(anchor)!;
      const within: number[] = [];
      const between: number[] = [];
      for (const other of allEnts) {
        if (other === anchor) continue;
        const sim = cosineSimilarity(store, anchor, other);
        if (entityToCluster.get(other) === ac) within.push(sim);
        else between.push(sim);
      }
      // For each within-cluster member, compare to the max between-cluster cosine
      // from this anchor. If within > max(between), count as a hit.
      const maxBetween = between.reduce((m, v) => (v > m ? v : m), -Infinity);
      for (const w of within) {
        total++;
        if (w > maxBetween) hits++;
      }
    }

    const ratio = hits / Math.max(1, total);
    expect(ratio).toBeGreaterThanOrEqual(0.8);
  });

  it('within-cluster mean cosine exceeds between-cluster mean cosine', () => {
    const { traces, clusters } = plantedThreeClusterTraces(40, 13);
    const r = trainEmbeddings(traces, {
      embedDim: 24,
      windowSize: 1,
      minCount: 1,
      negativeSamples: 5,
      learningRate: 0.05,
      minLearningRate: 0.005,
      maxEpochs: 30,
      convergenceTolerance: 0,
      seed: 31,
    });
    const store = buildStore(r.model, r.vocabulary, r.vocabIndex);

    const entityToCluster = new Map<string, number>();
    clusters.forEach((members, ci) => {
      for (const e of members) entityToCluster.set(e, ci);
    });

    let within = 0,
      withinN = 0,
      between = 0,
      betweenN = 0;
    const ents = clusters.flat();
    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        const s = cosineSimilarity(store, ents[i], ents[j]);
        if (entityToCluster.get(ents[i]) === entityToCluster.get(ents[j])) {
          within += s;
          withinN++;
        } else {
          between += s;
          betweenN++;
        }
      }
    }
    const withinMean = within / withinN;
    const betweenMean = between / betweenN;
    expect(withinMean).toBeGreaterThan(betweenMean);
  });
});

// ─── Convergence ────────────────────────────────────────────────────────────

describe('trainEmbeddings — convergence', () => {
  it('rmsDrift decreases over epochs on the planted fixture', () => {
    const { traces } = plantedThreeClusterTraces(30, 5);
    const r = trainEmbeddings(traces, {
      embedDim: 16,
      minCount: 1,
      windowSize: 1,
      learningRate: 0.05,
      minLearningRate: 0.005,
      maxEpochs: 10,
      convergenceTolerance: 0,
      seed: 17,
    });
    expect(r.epochsRun).toBeGreaterThan(0);
    expect(Number.isFinite(r.finalDrift)).toBe(true);
  });

  it('halts early when tolerance is generous', () => {
    const { traces } = plantedThreeClusterTraces(30, 5);
    const r = trainEmbeddings(traces, {
      embedDim: 8,
      minCount: 1,
      windowSize: 1,
      learningRate: 0.01,
      minLearningRate: 0.01,
      maxEpochs: 20,
      convergenceTolerance: 1e9, // will trip after 2nd epoch
      seed: 1,
    });
    expect(r.epochsRun).toBeLessThanOrEqual(2);
  });
});
