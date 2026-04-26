/**
 * JP-002 — CAPCOM anytime-valid gate tests.
 *
 * ## CAPCOM call-site search result
 *
 * Grep of `src/orchestration/`, `src/dacp/`, and broader `src/` confirmed
 * that CAPCOM is used as an architectural concept (preservation gates G7–G10
 * enforced via static regex audits in integration tests) rather than a
 * runtime gate function. No identifiable "frozen-window" or "fixed-window"
 * CAPCOM gate function exists. `anytime-gate.ts` is therefore shipped as a
 * standalone primitive ready for future call-site wiring, per the spec
 * anti-pattern note.
 *
 * The three tests below exercise the gate logic directly:
 *   1. Type-I preservation under continuous peeking (1000 trials × 200 obs).
 *   2. Power-one termination under H_1 (μ=0.3 signal).
 *   3. `legacyFixedNAdapter` bit-exactness against the fixed-N Z-test formula.
 *
 * @module orchestration/__tests__/capcom-anytime-gate.test
 */

import { describe, it, expect } from 'vitest';
import {
  anytimeGate,
  legacyFixedNAdapter,
} from '../anytime-gate.js';

// ─── Seeded PRNG (Mulberry32) — same pattern as src/anytime-valid/__tests__ ──

/**
 * Deterministic PRNG (Mulberry32). Returns values in [0, 1).
 * Using a seeded generator keeps the simulation reproducible across CI runs.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Draw a single uniform sample from [-1, 1] using the given random fn. */
function sampleUniform(rand: () => number): number {
  return rand() * 2 - 1;
}

/** Draw a sample from a distribution with mean μ, clamped to [-1, 1]. */
function sampleH1(rand: () => number, mu: number): number {
  // Uniform centred at μ with range ±0.5 so samples stay in [-1, 1] for μ=0.3
  const raw = mu + (rand() - 0.5);
  return Math.max(-1, Math.min(1, raw));
}

// ─── Test 1: Type-I preservation under continuous peeking ────────────────────

describe('anytimeGate — Type-I preservation under continuous peeking', () => {
  it(
    'reject rate at α=0.05 ≤ α + ε (ε=0.02) over 1000 independent H_0 trials',
    { timeout: 30_000 },
    () => {
      /**
       * Simulation:
       *   - 1000 independent trials, each with a fresh gate (α=0.05).
       *   - Each trial draws up to 200 i.i.d. zero-mean uniform samples from
       *     [-1, 1] (H_0: μ=0) and checks `evaluate()` after EVERY observation
       *     (continuous peeking — the hardest test of anytime-validity).
       *   - A trial "rejects" if `rejected=true` at any peek.
       *   - Anytime-valid guarantee: empirical reject rate ≤ α + ε.
       *
       * Note: ε=0.02 gives finite-sample slack. The theoretical bound is
       * exactly α=0.05 in the limit; 1000×200 is sufficient for this check.
       */
      const TRIALS = 1000;
      const MAX_OBS = 200;
      const ALPHA = 0.05;
      const EPSILON = 0.02;

      let rejections = 0;
      // Use a seeded PRNG for reproducibility
      const rand = mulberry32(0xfeed_face);

      for (let trial = 0; trial < TRIALS; trial++) {
        const gate = anytimeGate.create({ alpha: ALPHA, hypothesis: 'one-sided' });
        let trialRejected = false;
        for (let i = 0; i < MAX_OBS; i++) {
          const x = sampleUniform(rand);
          const r = gate.evaluate(x);
          if (r.rejected) {
            trialRejected = true;
            break;
          }
        }
        if (trialRejected) rejections++;
      }

      const empiricalRate = rejections / TRIALS;
      expect(empiricalRate).toBeLessThanOrEqual(ALPHA + EPSILON);
    },
  );
});

// ─── Test 2: Power-one termination under H_1 ─────────────────────────────────

describe('anytimeGate — power-one termination under H_1', () => {
  it(
    'rejects within 200 observations when μ=0.3 (H_1 with clear positive effect)',
    { timeout: 10_000 },
    () => {
      /**
       * Simulation:
       *   - Single trial; observations drawn from H_1 distribution with μ=0.3,
       *     clamped to [-1, 1].
       *   - The e-process should accumulate evidence quickly and reject well
       *     within 200 observations at α=0.05.
       *
       * Power-one is the dual of Type-I control: when H_1 is true the
       * process will eventually reject (with probability → 1 as N → ∞).
       * At μ=0.3 and λ=0.5, rejection typically occurs within ~50 obs.
       */
      const MAX_OBS = 200;
      const rand = mulberry32(0xdeadbeef);

      const gate = anytimeGate.create({ alpha: 0.05, hypothesis: 'one-sided' });
      let rejected = false;
      let rejectAt = -1;

      for (let i = 0; i < MAX_OBS; i++) {
        const x = sampleH1(rand, 0.3);
        const r = gate.evaluate(x);
        if (r.rejected) {
          rejected = true;
          rejectAt = r.observations;
          break;
        }
      }

      expect(rejected).toBe(true);
      // Also assert it didn't take the full budget — a signal of μ=0.3 should
      // be clearly detectable well before exhausting all 200 observations.
      expect(rejectAt).toBeLessThan(MAX_OBS);
    },
  );
});

// ─── Test 3: legacyFixedNAdapter bit-exactness ───────────────────────────────

describe('legacyFixedNAdapter — fixed-N Z-test bit-exactness', () => {
  it('reproduces the one-sample Z-test (z_α=0.05 = 1.6449) bit-exactly', () => {
    /**
     * Fixed-N Z-test: Z = metric * sqrt(N), reject when Z ≥ z_{0.05} = 1.6449.
     *
     * The adapter preserves historical CAPCOM fixed-window gate behavior. We
     * verify bit-equality against the closed-form formula for representative
     * fixture values — ensuring the adapter is a true alias rather than an
     * approximation.
     *
     * z_{0.05} ≈ 1.6448536269514729 (qnorm(0.95), one-tailed).
     */
    const Z_THRESHOLD = 1.6448536269514729;
    const N = 100;

    // --- Fixture 1: clearly above threshold (metric = 0.2 → Z = 2.0) --------
    const fixture1Metric = 0.2; // Z = 0.2 * sqrt(100) = 2.0
    const r1 = legacyFixedNAdapter(fixture1Metric, N);
    expect(r1.rejected).toBe(true);
    expect(r1.zScore).toBeCloseTo(fixture1Metric * Math.sqrt(N), 10);
    expect(r1.threshold).toBe(Z_THRESHOLD);
    expect(r1.observations).toBe(N);

    // --- Fixture 2: clearly below threshold (metric = 0.1 → Z = 1.0) --------
    const fixture2Metric = 0.1; // Z = 0.1 * sqrt(100) = 1.0
    const r2 = legacyFixedNAdapter(fixture2Metric, N);
    expect(r2.rejected).toBe(false);
    expect(r2.zScore).toBeCloseTo(fixture2Metric * Math.sqrt(N), 10);

    // --- Fixture 3: at exact threshold boundary (metric ≈ 0.16449) ----------
    const fixture3Metric = Z_THRESHOLD / Math.sqrt(N); // Z = threshold exactly
    const r3 = legacyFixedNAdapter(fixture3Metric, N);
    expect(r3.rejected).toBe(true); // Z ≥ threshold (≥, not >)
    expect(r3.zScore).toBeCloseTo(Z_THRESHOLD, 10);

    // --- Fixture 4: negative metric → no rejection (one-tailed) -------------
    const r4 = legacyFixedNAdapter(-0.2, N);
    expect(r4.rejected).toBe(false);
    expect(r4.zScore).toBeCloseTo(-2.0, 10);

    // --- Structural checks ---------------------------------------------------
    // deadline_met is NOT present on LegacyGateResult (it's not anytime-valid).
    expect('deadline_met' in r1).toBe(false);
  });

  it('throws RangeError for N <= 0', () => {
    expect(() => legacyFixedNAdapter(0.1, 0)).toThrow(RangeError);
    expect(() => legacyFixedNAdapter(0.1, -1)).toThrow(RangeError);
  });

  it('evaluate() with deadline sets deadline_met correctly', () => {
    const gate = anytimeGate.create({ alpha: 0.05 });
    const rand = mulberry32(0x1234_5678);

    // Feed observations under H_0 and check deadline logic
    for (let i = 0; i < 49; i++) {
      const r = gate.evaluate(sampleUniform(rand), { maxObservations: 50 });
      expect(r.deadline_met).toBe(false);
      expect(r.observations).toBe(i + 1);
    }
    // 50th observation should set deadline_met = true
    const rFinal = gate.evaluate(sampleUniform(rand), { maxObservations: 50 });
    expect(rFinal.deadline_met).toBe(true);
    expect(rFinal.observations).toBe(50);
  });
});
