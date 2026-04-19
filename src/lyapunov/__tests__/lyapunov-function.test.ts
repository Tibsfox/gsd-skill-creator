/**
 * CF-MB1-01 / LS-31 — Lyapunov function positive-definiteness + numerical
 * descent certificate on a 100-step fixture trajectory.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateLyapunov,
  verifyDescentCertificate,
  isPositiveDefinite,
  type LyapunovCandidate,
} from '../lyapunov-function.js';

describe('evaluateLyapunov — V = 0.5·e² + 0.5·γ·φ² (Sastry eq 2.0.40)', () => {
  it('V is zero exactly at the origin (e=0, φ=0)', () => {
    const c = evaluateLyapunov({
      observedRate: 1.0,
      teachingDeclaredRate: 1.0, // e = 0
      effectiveK_H: 5.0,
      targetK_H: 5.0,             // φ = 0
      regressor: [1, 0.5],
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
    expect(c.e).toBe(0);
    expect(c.phi).toBe(0);
    expect(c.V).toBe(0);
  });

  it('V is strictly positive away from the origin', () => {
    const c = evaluateLyapunov({
      observedRate: 2.0,
      teachingDeclaredRate: 1.0,  // e = 1
      effectiveK_H: 4.0,
      targetK_H: 5.0,             // φ = -1
      regressor: [1, 0.5],
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
    expect(c.V).toBeGreaterThan(0);
    // V = 0.5·1 + 0.5·1·1 = 1.0
    expect(c.V).toBeCloseTo(1.0, 12);
    expect(isPositiveDefinite(c.V, c.e, c.phi)).toBe(true);
  });

  it('V scales with γ on the parameter-error axis', () => {
    const base = evaluateLyapunov({
      observedRate: 0, teachingDeclaredRate: 0,
      effectiveK_H: 6, targetK_H: 5, // φ = 1
      regressor: [1], gainG: 0.01, gainGamma: 1.0, tractGain: 1.0,
    });
    const heavy = evaluateLyapunov({
      observedRate: 0, teachingDeclaredRate: 0,
      effectiveK_H: 6, targetK_H: 5,
      regressor: [1], gainG: 0.01, gainGamma: 4.0, tractGain: 1.0,
    });
    expect(base.V).toBeCloseTo(0.5, 12);
    expect(heavy.V).toBeCloseTo(2.0, 12); // 4x weighting → 4x V on pure-φ axis
  });

  it('Vdot is ≤ 0 at a single point with positive error and positive regressor', () => {
    // e=1, w=[1,1], g=0.01, tractGain=1 → Vdot = −0.01·1·(1·(1+1)) = −0.02
    // (Sastry eq 2.0.43 closed form: −g·tractGain·(e·wᵀe))
    const c = evaluateLyapunov({
      observedRate: 1, teachingDeclaredRate: 0,
      effectiveK_H: 5, targetK_H: 5,
      regressor: [1, 1], gainG: 0.01, gainGamma: 1.0, tractGain: 1.0,
    });
    expect(c.Vdot).toBeLessThanOrEqual(0);
    expect(c.Vdot).toBeCloseTo(-0.02, 12);
  });

  it('regressor is defensively copied', () => {
    const w = [1, 0.5];
    const c = evaluateLyapunov({
      observedRate: 1, teachingDeclaredRate: 0,
      effectiveK_H: 5, targetK_H: 5,
      regressor: w, gainG: 0.01, gainGamma: 1.0, tractGain: 1.0,
    });
    c.regressor[0] = 999;
    expect(w[0]).toBe(1);
  });
});

describe('verifyDescentCertificate — CF-MB1-01 / LS-31 100-step fixture', () => {
  /**
   * Synthesise a 100-step trajectory where a tractable-classified skill with
   * no teaching-entry changes has its tracking error e monotonically driven
   * to zero via the regressor-weighted update. We simulate the discrete-time
   * update explicitly so the trajectory passes through realistic
   * `(e, φ) → (0, 0)` dynamics.
   */
  function simulateDescent(opts: {
    steps: number;
    e0: number;
    phi0: number;
    targetKH: number;
    gainG: number;
    gainGamma: number;
    tractGain: number;
    stepSize: number;
    regressor: number[];
  }): LyapunovCandidate[] {
    const trajectory: LyapunovCandidate[] = [];
    let effectiveKH = opts.targetKH + opts.phi0;
    let e = opts.e0;
    const wSum = opts.regressor.reduce((a, w) => a + w, 0);

    for (let i = 0; i < opts.steps; i += 1) {
      // Evaluate Lyapunov at current point. observedRate - teachingDeclaredRate = e.
      const c = evaluateLyapunov({
        observedRate: e,
        teachingDeclaredRate: 0,
        effectiveK_H: effectiveKH,
        targetK_H: opts.targetKH,
        regressor: opts.regressor,
        gainG: opts.gainG,
        gainGamma: opts.gainGamma,
        tractGain: opts.tractGain,
      });
      trajectory.push(c);

      // Discrete-time update using the same law the bridge applies:
      //  K_H[t+1] = K_H[t] + stepSize · K̇_H
      //  where K̇_H = −g·tractGain·(Σw·e)
      const wDotE = opts.regressor.reduce((a, w) => a + w * e, 0);
      const K_H_dot = -opts.gainG * opts.tractGain * wDotE;
      effectiveKH += opts.stepSize * K_H_dot;

      // Consistent e-update: ė = (Σw) · φ̇.
      const phi_dot = K_H_dot;
      e += opts.stepSize * wSum * phi_dot;
    }
    return trajectory;
  }

  it('V̇ ≤ 0 at every step across a 100-step descent trajectory (CF-MB1-01)', () => {
    const traj = simulateDescent({
      steps: 100,
      e0: 1.0,
      phi0: 0, // start with φ=0 so Vdot is governed purely by tracking-error term
      targetKH: 5,
      gainG: 0.02,
      gainGamma: 1.0,
      tractGain: 1.0,
      stepSize: 0.5,
      regressor: [1, 0.5],
    });
    expect(traj.length).toBe(100);
    const cert = verifyDescentCertificate(traj, 1e-9);
    expect(cert.holds).toBe(true);
    expect(cert.failures).toEqual([]);
  });

  it('V is monotonically non-increasing on the 100-step descent', () => {
    const traj = simulateDescent({
      steps: 100,
      e0: 2.0,
      phi0: 0,
      targetKH: 5,
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
      stepSize: 0.5,
      regressor: [1, 0.5],
    });
    const cert = verifyDescentCertificate(traj);
    for (let i = 1; i < cert.Vtrace.length; i += 1) {
      expect(cert.Vtrace[i]!).toBeLessThanOrEqual(cert.Vtrace[i - 1]! + 1e-12);
    }
  });

  it('V drives e toward zero under PE regressor', () => {
    const traj = simulateDescent({
      steps: 100,
      e0: 1.5,
      phi0: 0,
      targetKH: 5,
      gainG: 0.02,
      gainGamma: 1.0,
      tractGain: 1.0,
      stepSize: 0.5,
      regressor: [1, 1],
    });
    // Final |e| should be well below initial.
    expect(Math.abs(traj[traj.length - 1]!.e)).toBeLessThan(Math.abs(traj[0]!.e) * 0.5);
  });

  it('failures are reported when a step violates V̇ ≤ 0', () => {
    const goodStep = evaluateLyapunov({
      observedRate: 1, teachingDeclaredRate: 0,
      effectiveK_H: 5, targetK_H: 5,
      regressor: [1, 1], gainG: 0.01, gainGamma: 1.0, tractGain: 1.0,
    });
    // Manually construct a violating candidate.
    const bad: LyapunovCandidate = { ...goodStep, Vdot: 0.5 };
    const cert = verifyDescentCertificate([goodStep, bad, goodStep]);
    expect(cert.holds).toBe(false);
    expect(cert.failures).toEqual([1]);
  });
});

describe('isPositiveDefinite', () => {
  it('accepts V=0 at origin', () => {
    expect(isPositiveDefinite(0, 0, 0)).toBe(true);
  });
  it('rejects V=0 away from origin', () => {
    expect(isPositiveDefinite(0, 1, 0)).toBe(false);
  });
  it('accepts V>0 away from origin', () => {
    expect(isPositiveDefinite(1, 0.5, 0.5)).toBe(true);
  });
  it('rejects non-finite values', () => {
    expect(isPositiveDefinite(NaN, 0, 0)).toBe(false);
    expect(isPositiveDefinite(0, Infinity, 0)).toBe(false);
  });
});
