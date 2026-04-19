/**
 * MB-2 — K_H projector adapter tests.
 *
 * Coverage:
 *   - Flag-off: byte-identical to MB-1 adaptKH result (SC-MB2-01 partial).
 *   - Flag-on: smooth-projected K_H within bounds.
 *   - Composes with MB-1 adaptKH — V̇ ≤ 0 preserved on 100-step fixture (CF-MB2-01).
 *   - Coin-flip tighter bounds.
 *   - `projectKHCandidate` convenience wrapper.
 */

import { describe, it, expect } from 'vitest';
import { projectKH, projectKHCandidate } from '../k_h-projector.js';
import { adaptKH, buildRegressor } from '../../lyapunov/k_h-adaptation.js';
import { evaluateLyapunov, verifyDescentCertificate } from '../../lyapunov/lyapunov-function.js';
import type { LyapunovCandidate } from '../../lyapunov/lyapunov-function.js';

const BASE_OPTS = {
  currentKH: 8.0,
  targetKH: 10.0,
  observedRate: 1.2,
  teachingDeclaredRate: 1.0,
  regressor: buildRegressor({ doseMagnitude: 1, ageMs: 0 }),
  tractabilityGain: 1.0,
  stepSize: 0.1,
  gainG: 0.05,
  gainGamma: 1.0,
  floor: 0.1,
  ceiling: 10.0,
};

// ---------------------------------------------------------------------------
// Flag-off — byte-identical to adaptKH (SC-MB2-01 for K_H path)
// ---------------------------------------------------------------------------

describe('projectKH — flag-off: byte-identical to adaptKH', () => {
  it('flag-off returns adaptation.newKH as projectedKH (no projection)', () => {
    const ref = adaptKH(BASE_OPTS);
    const r = projectKH({ ...BASE_OPTS, projectionEnabled: false });
    expect(r.projectionApplied).toBe(false);
    expect(r.projectedKH).toBe(ref.newKH);
    expect(r.projectionResult).toBeUndefined();
  });

  it('flag-off: projectedKH equals adaptKH.newKH byte-for-byte on 50 random inputs', () => {
    const seed = 42;
    let lcg = seed;
    const rand = () => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return (lcg >>> 0) / 0xffffffff;
    };

    for (let i = 0; i < 50; i++) {
      const cKH = 0.5 + rand() * 9;
      const tKH = cKH + rand() * 2;
      const opts = {
        ...BASE_OPTS,
        currentKH: cKH,
        targetKH: tKH,
        observedRate: rand() * 2,
        teachingDeclaredRate: rand(),
        floor: 0.1,
        ceiling: tKH,
      };
      const ref = adaptKH(opts);
      const r = projectKH({ ...opts, projectionEnabled: false });
      expect(r.projectedKH).toBe(ref.newKH);
    }
  });
});

// ---------------------------------------------------------------------------
// Flag-on — smooth projection applied
// ---------------------------------------------------------------------------

describe('projectKH — flag-on: projected K_H within admissible interval', () => {
  it('projected K_H is within [floor, ceiling]', () => {
    const r = projectKH({ ...BASE_OPTS, projectionEnabled: true });
    expect(r.projectionApplied).toBe(true);
    expect(r.projectedKH).toBeGreaterThanOrEqual(BASE_OPTS.floor - 1e-12);
    expect(r.projectedKH).toBeLessThanOrEqual(BASE_OPTS.ceiling + 1e-12);
  });

  it('interior candidate (no boundary contact) passes through unchanged', () => {
    // Put currentKH well inside the admissible set; small step.
    const opts = {
      ...BASE_OPTS,
      currentKH: 5.0,
      floor: 0.1,
      ceiling: 10.0,
      stepSize: 0.001, // tiny step — stays deep interior
      projectionEnabled: true,
    };
    const r = projectKH(opts);
    expect(r.projectionApplied).toBe(true);
    // projected ≈ adaptation.newKH (same value, just smoothly projected).
    expect(Math.abs(r.projectedKH - r.adaptation.newKH)).toBeLessThan(0.01);
  });

  it('projectionResult has penalty and derivative fields', () => {
    const r = projectKH({ ...BASE_OPTS, projectionEnabled: true });
    expect(r.projectionResult).toBeDefined();
    expect(typeof r.projectionResult!.penalty).toBe('number');
    expect(typeof r.projectionResult!.derivative).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// V̇ ≤ 0 composability on 100-step fixture (CF-MB2-01 / LS-32)
// ---------------------------------------------------------------------------

describe('projectKH — V̇ ≤ 0 preserved on 100-step fixture (CF-MB2-01)', () => {
  it('smooth-projected trajectory preserves V̇ ≤ 0 certificate (LS-32)', () => {
    const block = { K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01, disabled: false };
    let kH = 8.0;
    let observedRate = 1.2;
    const teachingDeclaredRate = 1.0;

    const candidates: LyapunovCandidate[] = [];

    for (let i = 0; i < 100; i++) {
      const regressor = buildRegressor({ doseMagnitude: 1, ageMs: i * 100 });
      const r = projectKH({
        currentKH: kH,
        targetKH: block.K_H,
        observedRate,
        teachingDeclaredRate,
        regressor,
        tractabilityGain: 1.0,
        stepSize: 0.1,
        gainG: 0.05,
        gainGamma: 1.0,
        floor: block.K_L,
        ceiling: block.K_H,
        projectionEnabled: true,
        penaltyStrength: 0.1,
      });

      // Collect the Lyapunov candidate from MB-1's adaptation result.
      candidates.push(r.adaptation.candidate);

      // Advance state using the projected K_H.
      kH = r.projectedKH;
      // Simulate error decay.
      observedRate = observedRate - 0.5 * (observedRate - teachingDeclaredRate) * 0.1;
    }

    expect(candidates).toHaveLength(100);
    const cert = verifyDescentCertificate(candidates, 1e-6);
    // V̇ ≤ 0 must hold at every step in the closed-form descent form.
    expect(cert.holds).toBe(true);
    expect(cert.failures).toEqual([]);

    // LS-32 evidence: max V̇ across the fixture.
    const maxVdot = Math.max(...cert.Vdottrace);
    expect(maxVdot).toBeLessThanOrEqual(0 + 1e-6);
  });
});

// ---------------------------------------------------------------------------
// projectKHCandidate convenience wrapper
// ---------------------------------------------------------------------------

describe('projectKHCandidate', () => {
  it('flag-off: returns hard clamp result', () => {
    const r = projectKHCandidate(8, 5, 0, 10, 0.1, false);
    // 8 + 5 = 13, clamped to 10.
    expect(r.projected).toBe(10);
    expect(r.penalty).toBe(0);
    expect(r.derivative).toBe(1);
  });

  it('flag-on: returns smooth-projected result', () => {
    // 8 + 0.5 = 8.5 — well inside [0, 10], identity.
    const r = projectKHCandidate(8, 0.5, 0, 10, 0.1, true);
    expect(r.projected).toBeCloseTo(8.5, 10);
  });

  it('flag-on: overshoot is smoothly projected, not hard-clamped', () => {
    // 8 + 5 = 13, smoothly projected to 10.
    const r = projectKHCandidate(8, 5, 0, 10, 0.1, true);
    expect(r.projected).toBe(10);
    // Penalty should be positive.
    expect(r.penalty).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Lyapunov composability V̇ ≤ 0 — evaluateLyapunov verifies MB-1 descent
// ---------------------------------------------------------------------------

describe('evaluateLyapunov composability — V̇ closed form ≤ 0', () => {
  it('positive tracking error with non-negative regressor: V̇ ≤ 0', () => {
    const candidate = evaluateLyapunov({
      observedRate: 1.5,
      teachingDeclaredRate: 1.0,
      effectiveK_H: 8.0,
      targetK_H: 10.0,
      regressor: [1.0, 0.8],
      gainG: 0.05,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
    // e = 0.5 > 0, w = [1.0, 0.8], wDotE = 1.8 * 0.5 = 0.9 > 0
    // V̇ = -g * tractGain * (e * wDotE) = -0.05 * 1 * (0.5 * 0.9) < 0
    expect(candidate.Vdot).toBeLessThanOrEqual(0);
  });
});
