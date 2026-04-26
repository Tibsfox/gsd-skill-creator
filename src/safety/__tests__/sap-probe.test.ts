/**
 * SAP probe tests.
 *
 * Coverage:
 *   - P_S rank: difference-of-means produces rank-1 probe for synthetic 2-axis data.
 *   - (I − P_S) composability with a Lyapunov-gated scalar-L2 update: verifies
 *     ‖projected_update‖₂ ≤ ‖original_update‖₂ (energy cannot increase through
 *     the orthogonal projector).
 *   - Idempotency: applying (I − P_S) twice gives the same result.
 *   - Error guards: empty samples, dimension mismatch.
 */

import { describe, it, expect } from 'vitest';
import { createSapProbe, applySafetyProjection, l2Norm } from '../sap-probe.js';
import { sapOperator, SAP_OPERATOR_NAME } from '../../projection/sap-registration.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dot product of two equal-length vectors. */
function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Test 1 — Rank of P_S matches contrastive-direction count
// ---------------------------------------------------------------------------

describe('createSapProbe — rank matches contrastive-direction count', () => {
  it('difference-of-means on synthetic 2-axis data returns rank-1 probe', () => {
    // Safe samples clustered around (1, 0); unsafe samples around (0, 1).
    const samples = [
      { vector: [1.0, 0.0], label: 'safe' as const },
      { vector: [1.1, 0.1], label: 'safe' as const },
      { vector: [0.0, 1.0], label: 'unsafe' as const },
      { vector: [0.1, 1.1], label: 'unsafe' as const },
    ];

    const probe = createSapProbe(samples);

    expect(probe.rank).toBe(1);
    expect(probe.directions).toHaveLength(1);
    expect(probe.dim).toBe(2);

    // Direction should be a unit vector.
    const dir = probe.directions[0]!;
    expect(l2Norm(dir)).toBeCloseTo(1, 10);

    // Direction should point from safe to unsafe mean, i.e. roughly (−1,1)/√2.
    // The exact sign is (unsafe − safe) = (0.05 − 1.05, 1.05 − 0.05) = (−1, 1)/√2.
    expect(Math.abs(dir[0]!)).toBeCloseTo(1 / Math.SQRT2, 5);
    expect(Math.abs(dir[1]!)).toBeCloseTo(1 / Math.SQRT2, 5);
  });

  it('probe constructed from clearly separated 3-axis data has rank 1', () => {
    const dim = 3;
    const safeVec = [1, 0, 0];
    const unsafeVec = [0, 1, 0];
    const probe = createSapProbe([
      { vector: safeVec, label: 'safe' },
      { vector: unsafeVec, label: 'unsafe' },
    ]);
    expect(probe.rank).toBe(1);
    expect(probe.dim).toBe(dim);
    // Direction should be unit-norm.
    expect(l2Norm(probe.directions[0]!)).toBeCloseTo(1, 10);
  });
});

// ---------------------------------------------------------------------------
// Test 2 — (I − P_S) composes with Lyapunov-gated update
// ---------------------------------------------------------------------------

describe('applySafetyProjection — Lyapunov composability smoke test', () => {
  /**
   * Simulate a Lyapunov-gated scalar-L2 gradient step:
   *
   *   update = −stepSize · gradient
   *
   * where stepSize is chosen conservatively (0 < stepSize ≤ 1) to ensure
   * V̇ ≤ 0 under the scalar quadratic Lyapunov candidate V = 0.5 · ‖θ‖₂².
   *
   * Then apply (I − P_S) to the update. Verify:
   *   ‖(I−P_S) · update‖₂ ≤ ‖update‖₂
   *
   * This is the key invariant: the SAP projector cannot increase gradient norm,
   * so any Lyapunov descent guarantee on the unprojected update is preserved.
   */
  it('projected update norm ≤ original update norm for a synthetic gradient', () => {
    // Build a probe from 4-dim synthetic safe/unsafe samples.
    const samples = [
      { vector: [2, 0, 0, 0], label: 'safe' as const },
      { vector: [0, 0, 2, 0], label: 'unsafe' as const },
    ];
    const probe = createSapProbe(samples);

    // Synthetic gradient (arbitrary direction in 4-d).
    const gradient = [1.5, -0.7, 2.0, 0.3];

    // Lyapunov-gated step: update = −0.1 · gradient (conservative scalar step).
    const stepSize = 0.1;
    const update = gradient.map(g => -stepSize * g);

    const updateNormBefore = l2Norm(update);

    // Apply (I − P_S).
    const projected = applySafetyProjection(update, probe);
    const updateNormAfter = l2Norm(projected);

    // Core invariant: SAP projection cannot increase norm.
    expect(updateNormAfter).toBeLessThanOrEqual(updateNormBefore + 1e-12);
  });

  it('projected update removes component along safety direction', () => {
    // Safety direction: unsafe mean (0,1,0,0) minus safe mean (1,0,0,0) → normalised.
    const samples = [
      { vector: [1, 0, 0, 0], label: 'safe' as const },
      { vector: [0, 1, 0, 0], label: 'unsafe' as const },
    ];
    const probe = createSapProbe(samples);
    const dir = probe.directions[0]!;

    // Gradient with a known component along the safety direction.
    const gradient = [0.6, 0.8, 0.0, 0.0];
    const projected = applySafetyProjection(gradient, probe);

    // The projected vector should be orthogonal to the safety direction.
    const residualDot = Math.abs(dot(projected, dir));
    expect(residualDot).toBeLessThan(1e-10);
  });

  it('applying (I − P_S) twice is idempotent', () => {
    const samples = [
      { vector: [1, 0, 0], label: 'safe' as const },
      { vector: [0, 1, 0], label: 'unsafe' as const },
    ];
    const probe = createSapProbe(samples);
    const gradient = [0.3, 0.9, 0.5];

    const once = applySafetyProjection(gradient, probe);
    const twice = applySafetyProjection(once, probe);

    for (let i = 0; i < gradient.length; i++) {
      expect(twice[i]).toBeCloseTo(once[i]!, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3 — MB-2 registry operator
// ---------------------------------------------------------------------------

describe('sapOperator — MB-2 registry registration', () => {
  it('operator name is safety-aware-projection', () => {
    expect(sapOperator.name).toBe(SAP_OPERATOR_NAME);
    expect(sapOperator.name).toBe('safety-aware-projection');
  });

  it('operator.apply delegates to applySafetyProjection', () => {
    const samples = [
      { vector: [1, 0], label: 'safe' as const },
      { vector: [0, 1], label: 'unsafe' as const },
    ];
    const probe = createSapProbe(samples);
    const gradient = [0.5, 0.5];

    const viaOperator = sapOperator.apply(gradient, probe);
    const direct = applySafetyProjection(gradient, probe);

    expect(viaOperator).toEqual(direct);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Error guards
// ---------------------------------------------------------------------------

describe('createSapProbe — error guards', () => {
  it('throws on empty samples', () => {
    expect(() => createSapProbe([])).toThrow(RangeError);
  });

  it('throws when no safe samples present', () => {
    expect(() =>
      createSapProbe([{ vector: [1, 2], label: 'unsafe' }]),
    ).toThrow(RangeError);
  });

  it('throws when no unsafe samples present', () => {
    expect(() =>
      createSapProbe([{ vector: [1, 2], label: 'safe' }]),
    ).toThrow(RangeError);
  });

  it('throws on dimension mismatch between samples', () => {
    expect(() =>
      createSapProbe([
        { vector: [1, 0], label: 'safe' },
        { vector: [0, 1, 0], label: 'unsafe' },
      ]),
    ).toThrow(RangeError);
  });

  it('throws on dimension mismatch between gradient and probe', () => {
    const probe = createSapProbe([
      { vector: [1, 0], label: 'safe' },
      { vector: [0, 1], label: 'unsafe' },
    ]);
    expect(() => applySafetyProjection([1, 2, 3], probe)).toThrow(RangeError);
  });
});
