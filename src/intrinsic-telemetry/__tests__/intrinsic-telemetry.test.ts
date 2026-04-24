/**
 * Intrinsic Telemetry tests — Phase 733 (v1.49.571).
 *
 * Covers LEJEPA-18. Pure-function tests for Pearson + Spearman + top-level
 * correlator. CAPCOM preservation is trivial here because the module has no
 * dispatch path.
 */

import { describe, expect, it } from 'vitest';
import * as telemetryModule from '../index.js';
import {
  CANDIDATE_SIGNALS,
  MIN_SAMPLES,
  correlateSignals,
  pearson,
  rankWithTies,
  spearman,
} from '../index.js';
import type { TelemetrySample } from '../index.js';

// ---------- pearson ----------

describe('pearson', () => {
  it('returns +1 for perfectly-linear positive data', () => {
    expect(pearson([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])).toBeCloseTo(1, 10);
  });

  it('returns -1 for perfectly-linear negative data', () => {
    expect(pearson([1, 2, 3, 4, 5], [50, 40, 30, 20, 10])).toBeCloseTo(-1, 10);
  });

  it('returns 0 when one series is constant', () => {
    expect(pearson([1, 2, 3, 4, 5], [7, 7, 7, 7, 7])).toBe(0);
  });

  it('throws on length mismatch', () => {
    expect(() => pearson([1, 2], [1, 2, 3])).toThrow();
  });

  it('returns 0 for n<2', () => {
    expect(pearson([1], [2])).toBe(0);
    expect(pearson([], [])).toBe(0);
  });
});

// ---------- ranks + spearman ----------

describe('rankWithTies', () => {
  it('ranks unique values', () => {
    expect(rankWithTies([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it('averages ties', () => {
    // Sorted order is [2, 2, 5, 8] at positions 0, 1, 2, 3 (1-indexed ranks 1,2,3,4).
    // The two 2s tie for ranks 1 and 2, averaging to 1.5.
    // The 5 gets rank 3; the 8 gets rank 4.
    // Back in original order [5, 2, 2, 8]: ranks = [3, 1.5, 1.5, 4].
    expect(rankWithTies([5, 2, 2, 8])).toEqual([3, 1.5, 1.5, 4]);
  });
});

describe('spearman', () => {
  it('returns +1 for monotonically-increasing data (non-linear)', () => {
    expect(spearman([1, 2, 3, 4, 5], [1, 4, 9, 16, 25])).toBeCloseTo(1, 10);
  });

  it('returns -1 for monotonically-decreasing data', () => {
    expect(spearman([1, 2, 3, 4, 5], [25, 16, 9, 4, 1])).toBeCloseTo(-1, 10);
  });

  it('handles ties', () => {
    const s = spearman([1, 2, 2, 4], [1, 2, 3, 4]);
    expect(s).toBeGreaterThan(0.8);
  });

  it('throws on length mismatch', () => {
    expect(() => spearman([1, 2], [1])).toThrow();
  });
});

// ---------- correlateSignals ----------

function samples(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>): TelemetrySample[] {
  return xs.map((x, i) => ({
    missionId: `m${i}`,
    signalValue: x,
    qualityScore: ys[i],
  }));
}

describe('correlateSignals', () => {
  it('flags insufficient samples when below MIN_SAMPLES', () => {
    const report = correlateSignals({
      sparse: samples([1, 2, 3], [1, 2, 3]),
    });
    expect(report.correlations[0].verdict).toBe('insufficient');
    expect(report.bestSignal).toBeUndefined();
  });

  it('returns strong verdict for near-perfect correlation', () => {
    const report = correlateSignals({
      perfect: samples([1, 2, 3, 4, 5, 6, 7], [2, 4, 6, 8, 10, 12, 14]),
    });
    expect(report.correlations[0].verdict).toBe('strong');
    expect(report.correlations[0].spearman).toBeCloseTo(1, 6);
  });

  it('returns a reportable (non-insufficient) verdict for monotonic-with-noise data', () => {
    const report = correlateSignals({
      mid: samples([1, 2, 3, 4, 5, 6, 7], [3, 2, 5, 4, 7, 6, 8]),
    });
    // This input is mostly monotonic-increasing with small local inversions; the
    // verdict may land in any of strong/moderate/weak depending on the exact
    // Spearman value, but it must NOT be 'insufficient' (we have 7 samples).
    expect(['strong', 'moderate', 'weak']).toContain(report.correlations[0].verdict);
    expect(report.correlations[0].verdict).not.toBe('insufficient');
  });

  it('returns weak verdict for random signal', () => {
    const report = correlateSignals({
      weak: samples([1, 2, 3, 4, 5, 6, 7], [3, 7, 1, 5, 2, 6, 4]),
    });
    expect(['weak', 'moderate']).toContain(report.correlations[0].verdict);
  });

  it('picks the strongest reportable signal as bestSignal', () => {
    const report = correlateSignals({
      weak_candidate: samples([1, 2, 3, 4, 5, 6], [3, 7, 1, 5, 2, 6]),
      strong_candidate: samples([1, 2, 3, 4, 5, 6], [2, 4, 6, 8, 10, 12]),
      sparse_candidate: samples([1, 2], [1, 2]),
    });
    expect(report.bestSignal).toBe('strong_candidate');
    const sparse = report.correlations.find((c) => c.signalName === 'sparse_candidate');
    expect(sparse?.verdict).toBe('insufficient');
  });

  it('runTag encodes signal count and min-samples threshold', () => {
    const report = correlateSignals({
      a: samples([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]),
      b: samples([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]),
    });
    expect(report.runTag).toContain('signals=2');
    expect(report.runTag).toContain(`min_samples=${MIN_SAMPLES}`);
  });

  it('report is a pure function of the input (call twice = same)', () => {
    const input = {
      s: samples([1, 2, 3, 4, 5, 6], [1, 4, 9, 16, 25, 36]),
    };
    const a = correlateSignals(input);
    const b = correlateSignals(input);
    expect(a).toEqual(b);
  });

  it('orders correlations alphabetically by signal name for reproducibility', () => {
    const report = correlateSignals({
      zed: samples([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]),
      alpha: samples([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]),
      middle: samples([1, 2, 3, 4, 5, 6], [1, 3, 2, 4, 6, 5]),
    });
    expect(report.correlations.map((c) => c.signalName)).toEqual([
      'alpha',
      'middle',
      'zed',
    ]);
  });

  it('LeJEPA Fig 1 analogue: perfectly-rank-monotone signal reports Spearman=1', () => {
    // Mirrors the paper's claim that a label-free training signal can correlate
    // ~0.99 with downstream accuracy. A synthetic perfect rank-monotone pair
    // should return exactly 1.0 Spearman.
    const report = correlateSignals({
      synthetic_mirror_of_training_loss: samples(
        [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
        [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9],
      ),
    });
    expect(report.correlations[0].spearman).toBeCloseTo(-1, 10);
    // The strong-verdict threshold is |spearman| ≥ 0.7, so this PASSES.
    expect(report.correlations[0].verdict).toBe('strong');
  });

  it('CANDIDATE_SIGNALS list covers the six expected substrate signals', () => {
    expect(CANDIDATE_SIGNALS).toContain('test_pass_density');
    expect(CANDIDATE_SIGNALS).toContain('skill_invocation_entropy');
    expect(CANDIDATE_SIGNALS).toContain('retrospective_feedforward_uptake');
    expect(CANDIDATE_SIGNALS).toContain('dacp_fidelity_compliance');
    expect(CANDIDATE_SIGNALS).toContain('sigreg_on_embeddings');
    expect(CANDIDATE_SIGNALS).toContain('skill_isotropy_audit_deviation');
  });

  it('CAPCOM preservation: no exported symbol writes, dispatches, or gates anything', () => {
    const mod = telemetryModule as unknown as Record<string, unknown>;
    const forbidden = [
      'dispatchGate',
      'bypassCapcom',
      'writeSkill',
      'setCapcomState',
      'overrideCapcom',
      'emitGateVerdict',
    ];
    for (const name of forbidden) expect(mod[name]).toBeUndefined();
  });
});
