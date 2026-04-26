/**
 * A/B harness BO auto-tuner — JP-018 tests (Wave 3 / phase 844).
 *
 * Tests:
 *  1. Smoke test: runBOAutoTune completes N iterations and returns observations.
 *  2. Best-objective monotonically improves or stays equal across iterations.
 *  3. All parameter values stay within search-space bounds.
 *  4. With a seeded RNG the result is deterministic.
 *  5. computeROI is actually invoked (bestROI is a valid ROIBreakdown).
 *  6. RangeError on iterations < 1.
 *  7. Custom search space is respected.
 *
 * Reference: arXiv:2411.00171 — EARL-BO.
 */

import { describe, it, expect } from 'vitest';
import {
  runBOAutoTune,
  DEFAULT_SEARCH_SPACE,
  type BOAutoTuneResult,
  type SearchSpace,
} from '../bo-autotune.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic LCG RNG seeded at a fixed value for reproducible tests. */
function makeSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    // Park-Miller LCG
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Smoke test ───────────────────────────────────────────────────────────────

describe('runBOAutoTune — smoke test', () => {
  it('completes 10 iterations and returns exactly 10 observations', () => {
    const rng = makeSeededRng(42);
    const result: BOAutoTuneResult = runBOAutoTune({ iterations: 10, rng });

    expect(result.observations).toHaveLength(10);
    expect(typeof result.bestObjective).toBe('number');
    expect(Number.isFinite(result.bestObjective)).toBe(true);
  });

  it('returns a valid ROIBreakdown for the best observation', () => {
    const rng = makeSeededRng(7);
    const result = runBOAutoTune({ iterations: 5, rng });

    expect(result.bestROI).toBeDefined();
    expect(result.bestROI.candidate).toBeDefined();
    expect(typeof result.bestROI.marginBits).toBe('number');
    expect(['install', 'reject']).toContain(result.bestROI.decision);
  });

  it('best objective equals the maximum over all observations', () => {
    const rng = makeSeededRng(13);
    const result = runBOAutoTune({ iterations: 15, rng });

    const maxObjective = Math.max(...result.observations.map(o => o.objective));
    expect(result.bestObjective).toBe(maxObjective);
  });
});

// ─── Search-space bounds ──────────────────────────────────────────────────────

describe('runBOAutoTune — search-space constraints', () => {
  it('all parameter values stay within DEFAULT_SEARCH_SPACE bounds', () => {
    const rng = makeSeededRng(99);
    const result = runBOAutoTune({ iterations: 20, rng });

    for (const obs of result.observations) {
      for (const [key, bounds] of Object.entries(DEFAULT_SEARCH_SPACE) as [
        keyof typeof DEFAULT_SEARCH_SPACE,
        { min: number; max: number },
      ][]) {
        expect(obs.params[key]).toBeGreaterThanOrEqual(bounds.min);
        expect(obs.params[key]).toBeLessThanOrEqual(bounds.max);
      }
    }
  });

  it('respects a custom narrow search space', () => {
    const narrow: SearchSpace = {
      sampleTarget:      { min: 50,  max: 51  },
      fidelityThreshold: { min: 0.5, max: 0.6 },
      cooldownCycles:    { min: 10,  max: 11  },
    };
    const rng = makeSeededRng(3);
    const result = runBOAutoTune({ iterations: 5, rng, searchSpace: narrow });

    for (const obs of result.observations) {
      expect(obs.params.sampleTarget).toBeGreaterThanOrEqual(50);
      expect(obs.params.sampleTarget).toBeLessThanOrEqual(51);
      expect(obs.params.fidelityThreshold).toBeGreaterThanOrEqual(0.5);
      expect(obs.params.fidelityThreshold).toBeLessThanOrEqual(0.6);
      expect(obs.params.cooldownCycles).toBeGreaterThanOrEqual(10);
      expect(obs.params.cooldownCycles).toBeLessThanOrEqual(11);
    }
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe('runBOAutoTune — determinism', () => {
  it('produces identical results with the same seeded RNG', () => {
    const result1 = runBOAutoTune({ iterations: 8, rng: makeSeededRng(55) });
    const result2 = runBOAutoTune({ iterations: 8, rng: makeSeededRng(55) });

    expect(result1.bestObjective).toBe(result2.bestObjective);
    expect(result1.bestParams).toEqual(result2.bestParams);
    expect(result1.observations).toHaveLength(result2.observations.length);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('runBOAutoTune — error handling', () => {
  it('throws RangeError when iterations < 1', () => {
    expect(() => runBOAutoTune({ iterations: 0 })).toThrow(RangeError);
    expect(() => runBOAutoTune({ iterations: -5 })).toThrow(RangeError);
  });
});

// ─── ROI integration ──────────────────────────────────────────────────────────

describe('runBOAutoTune — ROI integration', () => {
  it('each observation has a valid roiBreakdown with payoffBits and installCostJoules', () => {
    const rng = makeSeededRng(22);
    const result = runBOAutoTune({ iterations: 5, rng });

    for (const obs of result.observations) {
      expect(obs.roiBreakdown.payoffBits).toBeGreaterThanOrEqual(0);
      expect(obs.roiBreakdown.installCostJoules).toBeGreaterThan(0);
      expect(typeof obs.roiBreakdown.marginBits).toBe('number');
    }
  });

  it('objective equals roiBreakdown.marginBits for every observation', () => {
    const rng = makeSeededRng(17);
    const result = runBOAutoTune({ iterations: 6, rng });

    for (const obs of result.observations) {
      expect(obs.objective).toBe(obs.roiBreakdown.marginBits);
    }
  });

  it('bestParams corresponds to the observation with maximum marginBits', () => {
    const rng = makeSeededRng(88);
    const result = runBOAutoTune({ iterations: 12, rng });

    const best = result.observations.reduce((a, b) =>
      b.objective > a.objective ? b : a,
    );
    expect(result.bestParams).toEqual(best.params);
  });
});
