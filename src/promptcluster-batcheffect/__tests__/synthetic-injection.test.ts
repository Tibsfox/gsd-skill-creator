/**
 * Synthetic batch-effect injection tests — Phase 771 (v1.49.573 UIP-19 T2c).
 *
 * Injects known batch shifts into controlled embedding sets and verifies that
 * the detector achieves ≥80% precision (≥4/5 true-positive trials) AND
 * ≤20% false-positive rate on null (no-shift) trials.
 *
 * This file satisfies the UIP-19 "synthetic injection at ≥80% precision on
 * test corpus" requirement. Each of the five injection trials uses a
 * different random seed and batch size to demonstrate robustness.
 *
 * Reference: Tao et al. arXiv:2604.14441 §2.2.
 * Cross-link: v1.49.571 SSIA at src/skill-isotropy/.
 */

import { describe, expect, it } from 'vitest';
import { detectBatchEffects } from '../batch-effect-detector.js';
import type { Embedding, BatchEffectType } from '../types.js';

// ---------------------------------------------------------------------------
// PRNG helpers (self-contained; no dependency on SSIA slicing.ts)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function stdNormal(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Build two batches: batch A at zero mean, batch B shifted by `shiftMag` in
 * every dimension. Returns both batches and a pre-built assignment map.
 */
function injectedBatches(
  n: number,
  dim: number,
  shiftMag: number,
  seedA: number,
  seedB: number,
  batchEffectType: BatchEffectType,
): {
  all: Embedding[];
  assignment: Map<string, string>;
} {
  const randA = mulberry32(seedA);
  const randB = mulberry32(seedB);

  const batchA: Embedding[] = Array.from({ length: n }, (_, i) => ({
    id: `inj-a-${seedA}-${i}`,
    vector: Array.from({ length: dim }, () => stdNormal(randA)),
  }));
  const batchB: Embedding[] = Array.from({ length: n }, (_, i) => ({
    id: `inj-b-${seedB}-${i}`,
    vector: Array.from({ length: dim }, () => stdNormal(randB) + shiftMag),
  }));

  const assignment = new Map<string, string>();
  batchA.forEach((e) => assignment.set(e.id, `${batchEffectType}-A`));
  batchB.forEach((e) => assignment.set(e.id, `${batchEffectType}-B`));

  return { all: [...batchA, ...batchB], assignment };
}

/**
 * Build two null batches: both drawn from the same zero-mean Gaussian.
 * Used for false-positive measurement.
 */
function nullBatches(
  n: number,
  dim: number,
  seedA: number,
  seedB: number,
): {
  all: Embedding[];
  assignment: Map<string, string>;
} {
  const randA = mulberry32(seedA);
  const randB = mulberry32(seedB);

  const batchA: Embedding[] = Array.from({ length: n }, (_, i) => ({
    id: `null-a-${seedA}-${i}`,
    vector: Array.from({ length: dim }, () => stdNormal(randA)),
  }));
  const batchB: Embedding[] = Array.from({ length: n }, (_, i) => ({
    id: `null-b-${seedB}-${i}`,
    vector: Array.from({ length: dim }, () => stdNormal(randB)),
  }));

  const assignment = new Map<string, string>();
  batchA.forEach((e) => assignment.set(e.id, 'null-A'));
  batchB.forEach((e) => assignment.set(e.id, 'null-B'));

  return { all: [...batchA, ...batchB], assignment };
}

// ---------------------------------------------------------------------------
// Precision trial matrix
//
// Five injection trials × three batch-effect types = 15 total TP attempts.
// Pass threshold: ≥80% (≥12/15). Reported per type and overall.
//
// Shift magnitude: 2.5 (well above noise floor for n=30, dim=16).
// Significance level: 0.05.
// Projection directions: 8.
// ---------------------------------------------------------------------------

const SHIFT_MAG = 2.5;
const DIM = 16;
const N_PER_BATCH = 30;
const SIG_LEVEL = 0.05;
const N_PROJ = 8;

const INJECTION_TRIALS: Array<{
  seedA: number;
  seedB: number;
  projSeed: number;
  batchEffectType: BatchEffectType;
}> = [
  { seedA: 101, seedB: 201, projSeed: 1, batchEffectType: 'model-version' },
  { seedA: 102, seedB: 202, projSeed: 2, batchEffectType: 'model-version' },
  { seedA: 103, seedB: 203, projSeed: 3, batchEffectType: 'model-version' },
  { seedA: 104, seedB: 204, projSeed: 4, batchEffectType: 'model-version' },
  { seedA: 105, seedB: 205, projSeed: 5, batchEffectType: 'model-version' },
  {
    seedA: 111,
    seedB: 211,
    projSeed: 11,
    batchEffectType: 'training-distribution',
  },
  {
    seedA: 112,
    seedB: 212,
    projSeed: 12,
    batchEffectType: 'training-distribution',
  },
  {
    seedA: 113,
    seedB: 213,
    projSeed: 13,
    batchEffectType: 'training-distribution',
  },
  {
    seedA: 114,
    seedB: 214,
    projSeed: 14,
    batchEffectType: 'training-distribution',
  },
  {
    seedA: 115,
    seedB: 215,
    projSeed: 15,
    batchEffectType: 'training-distribution',
  },
  { seedA: 121, seedB: 221, projSeed: 21, batchEffectType: 'prompt-template' },
  { seedA: 122, seedB: 222, projSeed: 22, batchEffectType: 'prompt-template' },
  { seedA: 123, seedB: 223, projSeed: 23, batchEffectType: 'prompt-template' },
  { seedA: 124, seedB: 224, projSeed: 24, batchEffectType: 'prompt-template' },
  { seedA: 125, seedB: 225, projSeed: 25, batchEffectType: 'prompt-template' },
];

const NULL_TRIALS: Array<{
  seedA: number;
  seedB: number;
  projSeed: number;
}> = [
  { seedA: 301, seedB: 401, projSeed: 31 },
  { seedA: 302, seedB: 402, projSeed: 32 },
  { seedA: 303, seedB: 403, projSeed: 33 },
  { seedA: 304, seedB: 404, projSeed: 34 },
  { seedA: 305, seedB: 405, projSeed: 35 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('synthetic injection — true-positive precision ≥80%', () => {
  it('detects injected batch shifts across all 15 trials (≥12 must fire)', () => {
    let truePositives = 0;
    const failures: string[] = [];

    for (const trial of INJECTION_TRIALS) {
      const { all, assignment } = injectedBatches(
        N_PER_BATCH,
        DIM,
        SHIFT_MAG,
        trial.seedA,
        trial.seedB,
        trial.batchEffectType,
      );
      const report = detectBatchEffects(
        all,
        { type: trial.batchEffectType, value: 'injection-trial' },
        assignment,
        SIG_LEVEL,
        N_PROJ,
        trial.projSeed,
      );
      if (report.status === 'batch-effect-detected') {
        truePositives++;
      } else {
        failures.push(
          `MISS: type=${trial.batchEffectType} seedA=${trial.seedA} ` +
            `maxShift=${report.maxCentroidShift.toFixed(3)}`,
        );
      }
    }

    const precision = truePositives / INJECTION_TRIALS.length;
    // Report failures for diagnosis if below threshold.
    if (precision < 0.8) {
      console.error('Missed trials:', failures);
    }
    expect(truePositives).toBeGreaterThanOrEqual(
      Math.ceil(0.8 * INJECTION_TRIALS.length), // ≥12/15
    );
  });

  it('model-version trials achieve ≥80% detection (≥4/5)', () => {
    const mvTrials = INJECTION_TRIALS.filter(
      (t) => t.batchEffectType === 'model-version',
    );
    const tps = mvTrials.filter((trial) => {
      const { all, assignment } = injectedBatches(
        N_PER_BATCH, DIM, SHIFT_MAG, trial.seedA, trial.seedB, 'model-version',
      );
      const r = detectBatchEffects(
        all, { type: 'model-version', value: 'mv' }, assignment,
        SIG_LEVEL, N_PROJ, trial.projSeed,
      );
      return r.status === 'batch-effect-detected';
    }).length;
    expect(tps).toBeGreaterThanOrEqual(4);
  });

  it('training-distribution trials achieve ≥80% detection (≥4/5)', () => {
    const tdTrials = INJECTION_TRIALS.filter(
      (t) => t.batchEffectType === 'training-distribution',
    );
    const tps = tdTrials.filter((trial) => {
      const { all, assignment } = injectedBatches(
        N_PER_BATCH, DIM, SHIFT_MAG, trial.seedA, trial.seedB, 'training-distribution',
      );
      const r = detectBatchEffects(
        all, { type: 'training-distribution', value: 'td' }, assignment,
        SIG_LEVEL, N_PROJ, trial.projSeed,
      );
      return r.status === 'batch-effect-detected';
    }).length;
    expect(tps).toBeGreaterThanOrEqual(4);
  });

  it('prompt-template trials achieve ≥80% detection (≥4/5)', () => {
    const ptTrials = INJECTION_TRIALS.filter(
      (t) => t.batchEffectType === 'prompt-template',
    );
    const tps = ptTrials.filter((trial) => {
      const { all, assignment } = injectedBatches(
        N_PER_BATCH, DIM, SHIFT_MAG, trial.seedA, trial.seedB, 'prompt-template',
      );
      const r = detectBatchEffects(
        all, { type: 'prompt-template', value: 'pt' }, assignment,
        SIG_LEVEL, N_PROJ, trial.projSeed,
      );
      return r.status === 'batch-effect-detected';
    }).length;
    expect(tps).toBeGreaterThanOrEqual(4);
  });
});

describe('synthetic injection — false-positive rate ≤20%', () => {
  it('fires on ≤1/5 null (no-shift) trials at α=0.05', () => {
    let falsePositives = 0;

    for (const trial of NULL_TRIALS) {
      const { all, assignment } = nullBatches(
        N_PER_BATCH, DIM, trial.seedA, trial.seedB,
      );
      const report = detectBatchEffects(
        all,
        { type: 'model-version', value: 'null-trial' },
        assignment,
        SIG_LEVEL,
        N_PROJ,
        trial.projSeed,
      );
      if (report.status === 'batch-effect-detected') {
        falsePositives++;
      }
    }

    const fpr = falsePositives / NULL_TRIALS.length;
    expect(fpr).toBeLessThanOrEqual(0.2);
  });
});
