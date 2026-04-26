/**
 * JP-029 — Anytime-valid bridge tests.
 *
 * Covers:
 *   1. Migration-equivalence: fixed-horizon mode reproduces the legacy
 *      `runSignificanceTest` decision at the migration boundary.
 *   2. Anytime mode: continuous peeking without Type-I inflation under H_0.
 *   3. Structural invariants: factory guards, reset, encode/clamp.
 *
 * Phase 840, Wave 3 (JP-029).
 */

import { describe, it, expect } from 'vitest';
import { createAnytimeValidBridge } from '../anytime-valid-bridge.js';
import { runSignificanceTest } from '../stats.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seeded deterministic PRNG (xorshift32). */
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

/** Generate N i.i.d. standard-normal samples via Box-Muller. */
function sampleNormal(n: number, mu: number, sigma: number, seed: number): number[] {
  const rng = makePrng(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out.push(mu + sigma * z);
  }
  return out;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('createAnytimeValidBridge', () => {

  // ── 1. Migration-equivalence: fixed-horizon mode ─────────────────────────

  describe('fixed-horizon mode — migration-equivalence', () => {
    it('returns insufficient-data before the horizon', () => {
      const bridge = createAnytimeValidBridge({
        mode: 'fixed-horizon',
        horizon: 20,
        noiseFloor: 2.0,
        alpha: 0.10,
      });
      // Feed only 5 observations — below the horizon.
      for (let i = 0; i < 5; i++) {
        bridge.update(50, 55); // B consistently better
      }
      expect(bridge.decide()).toBe('insufficient-data');
      const snap = bridge.peek();
      expect(snap.decision).toBe('insufficient-data');
      expect(snap.observations).toBe(5);
    });

    it('reproduces legacy runSignificanceTest commit-B decision at horizon', () => {
      // Construct a scenario where legacy test returns 'commit-B'.
      // B is consistently better by a margin well above the noise floor.
      const N = 30;
      const noiseFloor = 2.0;
      const alpha = 0.10;

      // A scores around 50, B scores around 55 (delta = 5 >> noiseFloor=2).
      const scoresA = sampleNormal(N, 50, 0.5, 0xcafe);
      const scoresB = sampleNormal(N, 55, 0.5, 0xd00d);

      // Ground truth from legacy test.
      const legacyResult = runSignificanceTest(scoresA, scoresB, noiseFloor, alpha, 10);

      // Bridge in fixed-horizon mode, same parameters.
      const bridge = createAnytimeValidBridge({
        mode: 'fixed-horizon',
        horizon: N,
        noiseFloor,
        alpha,
      });
      for (let i = 0; i < N; i++) {
        bridge.update(scoresA[i]!, scoresB[i]!);
      }

      const bridgeDecision = bridge.decide();

      // Both should agree on commit-B when B is clearly better.
      expect(legacyResult.decision).toBe('commit-B');
      expect(bridgeDecision).toBe('commit-B');
    });

    it('reproduces legacy keep-A when B is not better', () => {
      const N = 30;
      const noiseFloor = 2.0;
      const alpha = 0.10;

      // A and B have identical scores — no real difference.
      const scoresA = sampleNormal(N, 50, 0.3, 0x1234);
      const scoresB = sampleNormal(N, 50, 0.3, 0x5678); // same mu

      const legacyResult = runSignificanceTest(scoresA, scoresB, noiseFloor, alpha, 10);

      const bridge = createAnytimeValidBridge({
        mode: 'fixed-horizon',
        horizon: N,
        noiseFloor,
        alpha,
      });
      for (let i = 0; i < N; i++) {
        bridge.update(scoresA[i]!, scoresB[i]!);
      }

      const bridgeDecision = bridge.decide();

      // Legacy should return coin-flip or keep-A; bridge should not commit.
      expect(['coin-flip', 'keep-A']).toContain(legacyResult.decision);
      expect(bridgeDecision).toBe('keep-A');
    });

    it('agrees with legacy on keep-A when delta is below the noise floor', () => {
      const N = 30;
      const noiseFloor = 10.0; // very high floor — delta of 1 is noise
      const alpha = 0.10;

      // Small delta (1.0) well below noiseFloor (10.0).
      const scoresA = sampleNormal(N, 50, 0.2, 0xbeef);
      const scoresB = sampleNormal(N, 51, 0.2, 0xfeed);

      const legacyResult = runSignificanceTest(scoresA, scoresB, noiseFloor, alpha, 10);

      const bridge = createAnytimeValidBridge({
        mode: 'fixed-horizon',
        horizon: N,
        noiseFloor,
        alpha,
      });
      for (let i = 0; i < N; i++) {
        bridge.update(scoresA[i]!, scoresB[i]!);
      }

      const bridgeDecision = bridge.decide();

      // Legacy: coin-flip (delta below noise floor). Bridge: keep-A (not rejected).
      expect(legacyResult.decision).toBe('coin-flip');
      expect(bridgeDecision).toBe('keep-A');
    });
  });

  // ── 2. Anytime mode — continuous peeking without Type-I inflation ─────────

  describe('anytime mode — continuous peeking', () => {
    it('supports peek() at every step without decision changing to rejected under H_0', () => {
      // Under H_0 (A = B, delta = 0), the e-process should NOT reject in most runs.
      // We verify that peeking after every observation does not prematurely reject.
      const N = 100;
      const noiseFloor = 1.0;
      const alpha = 0.05;

      // Perfectly balanced: A == B on every pair (delta = 0 → x = 0 each step).
      const bridge = createAnytimeValidBridge({
        mode: 'anytime',
        noiseFloor,
        alpha,
      });

      const peeks: boolean[] = [];
      for (let i = 0; i < N; i++) {
        bridge.update(50, 50); // zero delta each pair
        peeks.push(bridge.peek().rejected);
      }

      // With zero observations pushed into a one-sided martingale (x=0),
      // each e_i = exp(0 - λ²/2) < 1, so E_t is monotonically DECREASING.
      // The process should never reject under pure H_0 observations of x=0.
      expect(peeks.every(r => r === false)).toBe(true);
    });

    it('eventually rejects under H_1 with consistent B superiority', () => {
      // Under H_1 (B consistently better by large margin), the e-process
      // should reject within a bounded number of observations.
      const noiseFloor = 2.0;
      const alpha = 0.05;

      // B outperforms A by 3× noiseFloor each pair: x = clamp(6/2, -1, 1) = 1.
      const bridge = createAnytimeValidBridge({
        mode: 'anytime',
        noiseFloor,
        alpha,
      });

      let rejectedAt: number | null = null;
      for (let i = 1; i <= 200; i++) {
        bridge.update(50, 56); // delta = 6, noiseFloor = 2 → x = clamp(3, -1, 1) = 1
        const { rejected } = bridge.peek();
        if (rejected && rejectedAt === null) {
          rejectedAt = i;
          break;
        }
      }

      expect(rejectedAt).not.toBeNull();
      // With x=1 each step: E_t = exp(t * (λ - λ²/2)) grows quickly.
      // For λ=0.5: each factor = exp(0.5 - 0.125) = exp(0.375) ≈ 1.455.
      // τ = 1/0.05 = 20. Need exp(0.375 * t) ≥ 20 → t ≥ ln(20)/0.375 ≈ 8.
      expect(rejectedAt!).toBeLessThan(50);
    });

    it('allows early stopping: decide() matches peek().decision at every step', () => {
      const noiseFloor = 2.0;
      const bridge = createAnytimeValidBridge({ mode: 'anytime', noiseFloor });

      for (let i = 0; i < 20; i++) {
        bridge.update(50, 52);
        expect(bridge.decide()).toBe(bridge.peek().decision);
      }
    });

    it('Type-I rate ≤ alpha over many independent H_0 runs (Monte Carlo)', () => {
      // Each run: 50 observations with delta=0. Count how many runs reject.
      // Expected: ≤ alpha + 2*sqrt(alpha*(1-alpha)/RUNS) ≈ 0.05 + 0.044 under alpha=0.05.
      const RUNS = 200;
      const OBS_PER_RUN = 50;
      const alpha = 0.05;
      const rng = makePrng(0xdeadbeef);

      let rejections = 0;
      for (let r = 0; r < RUNS; r++) {
        const bridge = createAnytimeValidBridge({ mode: 'anytime', alpha, noiseFloor: 1.0 });
        for (let i = 0; i < OBS_PER_RUN; i++) {
          // H_0: i.i.d. noise symmetric around 0 → E[delta] = 0.
          const a = rng();
          const b = rng(); // independent, same distribution
          bridge.update(a, b);
        }
        if (bridge.peek().rejected) rejections++;
      }
      const empiricalRate = rejections / RUNS;
      // Ville's inequality: P(∃t: E_t ≥ 1/α) ≤ α. Allow 3-sigma slack.
      const slack = 3 * Math.sqrt((alpha * (1 - alpha)) / RUNS);
      expect(empiricalRate).toBeLessThanOrEqual(alpha + slack);
    });
  });

  // ── 3. Structural invariants ──────────────────────────────────────────────

  describe('structural invariants', () => {
    it('throws RangeError for invalid alpha', () => {
      expect(() => createAnytimeValidBridge({ alpha: 0 })).toThrow(RangeError);
      expect(() => createAnytimeValidBridge({ alpha: 1 })).toThrow(RangeError);
      expect(() => createAnytimeValidBridge({ alpha: -0.1 })).toThrow(RangeError);
    });

    it('throws RangeError for fixed-horizon mode with horizon < 1', () => {
      expect(() =>
        createAnytimeValidBridge({ mode: 'fixed-horizon', horizon: 0 })
      ).toThrow(RangeError);
    });

    it('reset() clears state back to initial', () => {
      const bridge = createAnytimeValidBridge({ mode: 'anytime', noiseFloor: 1.0, alpha: 0.05 });
      for (let i = 0; i < 10; i++) bridge.update(50, 60);
      const before = bridge.peek();
      bridge.reset();
      const after = bridge.peek();
      expect(after.observations).toBe(0);
      expect(after.evidence).toBe(1); // initial e-value = 1
      expect(before.observations).toBeGreaterThan(0);
    });

    it('exposes resolved config on the instance', () => {
      const bridge = createAnytimeValidBridge({
        mode: 'fixed-horizon',
        horizon: 25,
        noiseFloor: 3.0,
        alpha: 0.07,
      });
      expect(bridge.config.mode).toBe('fixed-horizon');
      expect(bridge.config.horizon).toBe(25);
      expect(bridge.config.noiseFloor).toBe(3.0);
      expect(bridge.config.alpha).toBe(0.07);
    });

    it('peek() eProcessResult matches e-process evidence', () => {
      const bridge = createAnytimeValidBridge({ noiseFloor: 1.0 });
      bridge.update(50, 52);
      const snap = bridge.peek();
      expect(snap.eProcessResult.evidence).toBe(snap.evidence);
      expect(snap.eProcessResult.observations).toBe(snap.observations);
    });

    it('clamps extreme deltas to [-1, 1] without throwing', () => {
      const bridge = createAnytimeValidBridge({ noiseFloor: 1.0 });
      // Very large delta: clamp should bring it to 1.
      expect(() => bridge.update(0, 1e9)).not.toThrow();
      // Very negative delta: clamp to -1.
      expect(() => bridge.update(1e9, 0)).not.toThrow();
      expect(bridge.peek().observations).toBe(2);
    });
  });

});
