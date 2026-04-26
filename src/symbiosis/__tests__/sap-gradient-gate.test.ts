/**
 * Tests for `src/symbiosis/sap-gradient-gate.ts` — SAP composability.
 *
 * Spec: safety-aware-projection.md §JP-025 "SAP composability test —
 *   un-projected gradient is rejected; projected gradient is accepted."
 */

import { describe, it, expect } from 'vitest';
import { createSapProbe } from '../../safety/sap-probe.js';
import { gateGradient } from '../sap-gradient-gate.js';

// ---------------------------------------------------------------------------
// Fixture: 2-D space with a clear safe/unsafe axis along [1, 0]
//
//   safe samples:    [ [0, 1], [0, 2] ]   (x ≈ 0)
//   unsafe samples:  [ [2, 1], [2, 2] ]   (x ≈ 2)
//
//   contrastive direction ≈ [1, 0] (unsafe-mean − safe-mean = [2,1.5]−[0,1.5])
//   P_S projects onto [1, 0]; (I−P_S) zeroes out the x-component.
// ---------------------------------------------------------------------------

const SAMPLES = [
  { vector: [0, 1], label: 'safe' as const },
  { vector: [0, 2], label: 'safe' as const },
  { vector: [2, 1], label: 'unsafe' as const },
  { vector: [2, 2], label: 'unsafe' as const },
];

describe('gateGradient (SAP composability)', () => {
  it('rejects an un-projected gradient that has a non-trivial safety component', () => {
    const probe = createSapProbe(SAMPLES);

    // Gradient with a strong component along the safety axis [1, 0]:
    // g = [3, 0]  →  P_S·g = [3, 0], so (I−P_S)·g = [0, 0].
    const unsafeGrad = [3, 0];

    const result = gateGradient(unsafeGrad, probe);

    // Should be REJECTED because the safety component norm ≈ 3 >> tolerance.
    expect(result.accepted).toBe(false);
    expect(result.safetyComponentNorm).toBeGreaterThan(0.1);

    // Projected result should have near-zero x-component.
    expect(Math.abs(result.projected[0]!)).toBeLessThan(1e-9);
    // y-component is unaffected.
    expect(result.projected[1]!).toBeCloseTo(0, 9);
  });

  it('accepts a gradient already orthogonal to the safety subspace (safe direction)', () => {
    const probe = createSapProbe(SAMPLES);

    // Gradient purely along [0, 1] — orthogonal to the safety axis [1, 0].
    // (I−P_S)·[0, 1] = [0, 1], so safety-component norm should be ~0.
    const safeGrad = [0, 5];

    const result = gateGradient(safeGrad, probe);

    // Should be ACCEPTED.
    expect(result.accepted).toBe(true);
    expect(result.safetyComponentNorm).toBeLessThan(1e-9);

    // Projected vector equals the input.
    expect(result.projected[0]!).toBeCloseTo(0, 9);
    expect(result.projected[1]!).toBeCloseTo(5, 9);
  });

  it('round-trips: applying the projection and re-gating accepts the result', () => {
    const probe = createSapProbe(SAMPLES);

    // Mixed gradient: [3, 5]  →  after projection: [0, 5].
    const mixedGrad = [3, 5];

    const first = gateGradient(mixedGrad, probe);
    expect(first.accepted).toBe(false);

    // Gate the projected result — it should now be accepted.
    const second = gateGradient(first.projected, probe);
    expect(second.accepted).toBe(true);
    expect(second.safetyComponentNorm).toBeLessThan(1e-9);
  });
});
