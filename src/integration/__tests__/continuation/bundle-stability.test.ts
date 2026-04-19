/**
 * Continuation Wave — Bundle 3 (Stability Rails) integration tests.
 *
 * Covers the wiring between MB-1 (Lyapunov K_H adaptation), MB-2 (smooth
 * projection operators), and MB-5 (dead-zone bounded learning) as composed
 * in the desensitisation + simplex-projection pipeline.
 *
 * Gates:
 *   IT-W2-MB1 — Lyapunov V̇ ≤ 0 preserved across the full 100-step
 *     trajectory with all three components active.
 *   IT-W2-MB2 — projection composes with MB-1 + MB-5 dead-zone without
 *     breaking V̇ (no gradient discontinuities, still ≤ 0).
 *   IT-W2-MB5 — dead-zone activation does not break Lyapunov: inside the
 *     dead zone V̇_composed = scale · V̇_raw is still ≤ 0.
 *
 * This file does NOT duplicate the module-level unit tests at
 * `src/lyapunov/__tests__/`, `src/projection/__tests__/`,
 * `src/dead-zone/__tests__/`.  It verifies cross-component wiring only.
 *
 * @module integration/__tests__/continuation/bundle-stability.test
 */

import { describe, it, expect } from 'vitest';

// MB-1
import {
  evaluateLyapunov,
  verifyDescentCertificate,
  adaptKH,
  buildRegressor,
  resolveTractabilityGain,
  DEFAULT_GAIN_G,
  DEFAULT_GAIN_GAMMA,
  type LyapunovCandidate,
} from '../../../lyapunov/index.js';

// MB-2
import {
  smoothProject,
  projectToSimplex,
  projectKH,
  projectModelRow,
  verifySimplex,
  SIMPLEX_EPSILON,
} from '../../../projection/index.js';

// MB-5
import {
  adaptationScale,
  DEFAULT_DEAD_ZONE_PARAMS,
  composedVdot,
  verifyComposedDescent,
  buildFixtureTrajectory,
} from '../../../dead-zone/index.js';

// ---------------------------------------------------------------------------
// IT-W2-MB1 — Lyapunov V̇ ≤ 0 preserved on 100-step trajectory
// ---------------------------------------------------------------------------

describe('IT-W2-MB1 — Lyapunov descent on 100-step trajectory', () => {
  it('V̇ ≤ 0 at every step of a monotonic error-decay trajectory', () => {
    const trajectory: LyapunovCandidate[] = [];
    let kH = 0.5;
    const targetKH = 1.0;
    for (let i = 0; i < 100; i++) {
      const age = i * 1_000;
      const regressor = buildRegressor({ doseMagnitude: 0.5, ageMs: age });
      // Decaying error: observedRate approaches teachingDeclaredRate
      const e = 0.8 * Math.exp(-i * 0.03);
      const observedRate = 0.5 + e;
      const teachingDeclaredRate = 0.5;
      const c = evaluateLyapunov({
        observedRate,
        teachingDeclaredRate,
        effectiveK_H: kH,
        targetK_H: targetKH,
        regressor,
        gainG: DEFAULT_GAIN_G,
        gainGamma: DEFAULT_GAIN_GAMMA,
        tractGain: 1.0,
      });
      trajectory.push(c);
      // Advance kH per MB-1's discrete-time law so the regressor matters.
      const step = adaptKH({
        currentKH: kH,
        targetKH,
        observedRate,
        teachingDeclaredRate,
        regressor,
        tractabilityGain: 1.0,
      });
      kH = step.newKH;
    }
    const cert = verifyDescentCertificate(trajectory, 1e-9);
    expect(cert.holds).toBe(true);
    expect(cert.failures.length).toBe(0);
    expect(trajectory.length).toBe(100);
  });

  it('K_H monotonically decays toward target when e > 0 persistently', () => {
    let kH = 0.5;
    const targetKH = 1.0;
    const observedRate = 1.2; // e > 0 persistently
    const teachingDeclaredRate = 0.5;
    let prev = kH;
    for (let i = 0; i < 50; i++) {
      const step = adaptKH({
        currentKH: kH,
        targetKH,
        observedRate,
        teachingDeclaredRate,
        regressor: [0.5, 1.0],
        tractabilityGain: 1.0,
      });
      // With e > 0 and positive regressor, kH decreases per MB-1 eq 2.0.42
      expect(step.newKH).toBeLessThanOrEqual(prev + 1e-9);
      prev = step.newKH;
      kH = step.newKH;
    }
  });

  it('tractability gain scales descent — coin-flip gain is 0.3 of tractable', () => {
    const tractGainTract = resolveTractabilityGain('tractable', 1.0);
    const tractGainCoin = resolveTractabilityGain('coin-flip', 1.0);
    expect(tractGainTract).toBe(1.0);
    expect(tractGainCoin).toBe(0.3);
    // Effective gain scales proportionally
    const tracta = adaptKH({
      currentKH: 0.5,
      targetKH: 1.0,
      observedRate: 1.0,
      teachingDeclaredRate: 0.5,
      regressor: [0.5, 1.0],
      tractabilityGain: tractGainTract,
    });
    const coin = adaptKH({
      currentKH: 0.5,
      targetKH: 1.0,
      observedRate: 1.0,
      teachingDeclaredRate: 0.5,
      regressor: [0.5, 1.0],
      tractabilityGain: tractGainCoin,
    });
    // coin delta is 0.3 × tractable delta
    expect(Math.abs(coin.deltaKHRaw)).toBeCloseTo(
      Math.abs(tracta.deltaKHRaw) * 0.3,
      10,
    );
  });
});

// ---------------------------------------------------------------------------
// IT-W2-MB2 — projection composes with MB-1 without breaking V̇ ≤ 0
// ---------------------------------------------------------------------------

describe('IT-W2-MB2 — MB-2 projection composes with MB-1 K_H adaptation', () => {
  it('smooth interval projection preserves Lyapunov descent certificate (Sastry Thm 2.4.3)', () => {
    // projectKH with flag ON: the projected trajectory's V̇ must still satisfy
    // V̇_pr ≤ V̇ ≤ 0 at each step.
    const trajectory: LyapunovCandidate[] = [];
    let kH = 0.5;
    const targetKH = 1.0;
    for (let i = 0; i < 50; i++) {
      const regressor = buildRegressor({
        doseMagnitude: 0.5,
        ageMs: i * 1_000,
      });
      const observedRate = 0.5 + 0.8 * Math.exp(-i * 0.05);
      const teachingDeclaredRate = 0.5;
      const c = evaluateLyapunov({
        observedRate,
        teachingDeclaredRate,
        effectiveK_H: kH,
        targetK_H: targetKH,
        regressor,
        gainG: DEFAULT_GAIN_G,
        gainGamma: DEFAULT_GAIN_GAMMA,
        tractGain: 1.0,
      });
      trajectory.push(c);
      const step = projectKH({
        currentKH: kH,
        targetKH,
        observedRate,
        teachingDeclaredRate,
        regressor,
        tractabilityGain: 1.0,
        projectionEnabled: true,
        boundsOpts: { tractability: 'tractable' },
      });
      kH = step.projectedKH;
    }
    const cert = verifyDescentCertificate(trajectory, 1e-9);
    expect(cert.holds).toBe(true);
  });

  it('flag-off projectKH equals MB-1 adaptKH output (SC-MB2-01 byte-identical)', () => {
    const opts = {
      currentKH: 0.5,
      targetKH: 1.0,
      observedRate: 0.9,
      teachingDeclaredRate: 0.5,
      regressor: [0.4, 0.9],
      tractabilityGain: 1.0,
    };
    const mb1 = adaptKH(opts);
    const mb2 = projectKH({ ...opts, projectionEnabled: false });
    expect(mb2.projectedKH).toBe(mb1.newKH);
  });

  it('simplex projection keeps row sum = 1 + all entries > ε (CF-M7-02)', () => {
    const raw = [0.3, 0.4, 0.2, 0.1];
    const result = projectToSimplex(raw);
    const verified = verifySimplex(result.projected, SIMPLEX_EPSILON);
    expect(verified).toBe(true);
    const sum = result.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
    for (const v of result.projected) expect(v).toBeGreaterThan(0);
  });

  it('smooth interval projection continuity at boundary (CF-MB2-02)', () => {
    // derivative must be continuous — no jumps between interior and boundary
    const a = smoothProject(0.99, 0, 1, 0.1);
    const b = smoothProject(1.0, 0, 1, 0.1);
    const c = smoothProject(1.01, 0, 1, 0.1);
    // projected values form a smooth decreasing sequence of derivatives
    expect(Math.abs(b.derivative - a.derivative)).toBeLessThan(1);
    expect(Math.abs(c.derivative - b.derivative)).toBeLessThan(1);
  });

  it('generative-model row projector composes with dead-zone-scaled update', () => {
    const raw = [0.6, 0.2, 0.1, 0.1];
    const scale = adaptationScale(0.1, 10, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    // scale on raw: after MB-5 dead-zone, still need MB-2 simplex projection
    const blended: number[] = raw.map((v, i) => v * scale + 0.25 * (1 - scale));
    const result = projectModelRow(blended, { projectionEnabled: true });
    const sum = result.projected.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });
});

// ---------------------------------------------------------------------------
// IT-W2-MB5 — dead-zone activation preserves V̇ ≤ 0
// ---------------------------------------------------------------------------

describe('IT-W2-MB5 — dead-zone composes with Lyapunov descent', () => {
  it('composed V̇_dz = s · V̇_raw ≤ 0 on full enter-reside-exit trajectory (LS-33)', () => {
    const traj = buildFixtureTrajectory(100, 0.01, 0.25, 0.5);
    const cert = verifyComposedDescent(traj, 1e-9);
    expect(cert.holds).toBe(true);
    expect(cert.failures.length).toBe(0);
    expect(cert.steps.length).toBe(100);
    // Must enter and exit zone at least once each
    expect(cert.zoneEntries).toBeGreaterThanOrEqual(1);
    expect(cert.zoneExits).toBeGreaterThanOrEqual(1);
    expect(cert.deadZoneActivations).toBeGreaterThan(0);
  });

  it('composedVdot(V̇_raw ≤ 0, scale ∈ [0,1]) ≤ 0 universally', () => {
    const samples: Array<{ vdot: number; s: number }> = [
      { vdot: -0.1, s: 0.0 },
      { vdot: -0.1, s: 0.5 },
      { vdot: -0.1, s: 1.0 },
      { vdot: 0.0, s: 0.5 },
      { vdot: -1e-10, s: 0.99 },
    ];
    for (const { vdot, s } of samples) {
      expect(composedVdot(vdot, s)).toBeLessThanOrEqual(0);
    }
  });

  it('dead-zone activation (scale → 0) collapses update magnitude, V̇_composed → 0', () => {
    // inside the dead zone scale ≈ 0 → V̇_composed ≈ 0
    const insideScale = adaptationScale(
      0.5,  // large diff, above threshold
      10,   // cooldown elapsed
      DEFAULT_DEAD_ZONE_PARAMS,
      'tractable',
    );
    expect(insideScale).toBe(0); // hard heaviside with default params
    // composedVdot may yield -0 from (-0.5 * 0); use Math.abs to normalise.
    expect(Math.abs(composedVdot(-0.5, insideScale))).toBe(0);
  });

  it('outside the dead zone, scale = 1 and composed equals raw', () => {
    const outsideScale = adaptationScale(
      0.1, // below threshold
      10,  // cooldown elapsed
      DEFAULT_DEAD_ZONE_PARAMS,
      'tractable',
    );
    expect(outsideScale).toBe(1);
    expect(composedVdot(-0.5, outsideScale)).toBe(-0.5);
  });

  it('flag-off dead-zone (default params) reproduces M4 hard rule bit-exactly', () => {
    // CF-MB5-01: with bandwidth=0 and tau=∞, dead-zone is pure Heaviside.
    const onCutoff = adaptationScale(0.20, 7, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    const overCutoff = adaptationScale(0.21, 7, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    const youngCooldown = adaptationScale(0.1, 5, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
    expect(onCutoff).toBe(1);  // diff ≤ threshold AND cooldown elapsed
    expect(overCutoff).toBe(0); // diff > threshold
    expect(youngCooldown).toBe(0); // cooldown not yet elapsed
  });
});

// ---------------------------------------------------------------------------
// Cross-check: MB-1 × MB-2 × MB-5 full stack composition
// ---------------------------------------------------------------------------

describe('Bundle 3 full stack — MB-1 → MB-2 → MB-5 composition', () => {
  it('MB-1 K_H update → MB-2 projection → MB-5 dead-zone scale preserves V̇ ≤ 0', () => {
    const trajectory: LyapunovCandidate[] = [];
    const scales: number[] = [];
    let kH = 0.5;
    const targetKH = 1.0;
    const dzParams = { ...DEFAULT_DEAD_ZONE_PARAMS };
    for (let i = 0; i < 30; i++) {
      const regressor = buildRegressor({
        doseMagnitude: 0.4,
        ageMs: i * 1_000,
      });
      const observedRate = 0.5 + 0.6 * Math.exp(-i * 0.05);
      const teachingDeclaredRate = 0.5;
      // Step 1: MB-1 Lyapunov evaluation.
      const c = evaluateLyapunov({
        observedRate,
        teachingDeclaredRate,
        effectiveK_H: kH,
        targetK_H: targetKH,
        regressor,
        gainG: DEFAULT_GAIN_G,
        gainGamma: DEFAULT_GAIN_GAMMA,
        tractGain: 1.0,
      });
      trajectory.push(c);
      // Step 2: MB-2 smooth projection as the outer bound wrapper.
      const step = projectKH({
        currentKH: kH,
        targetKH,
        observedRate,
        teachingDeclaredRate,
        regressor,
        tractabilityGain: 1.0,
        projectionEnabled: true,
        boundsOpts: { tractability: 'tractable' },
      });
      // Step 3: MB-5 dead-zone scale (adaptive-age cooldown).
      const diff = Math.abs(step.projectedKH - kH) / Math.max(kH, 1e-6);
      const s = adaptationScale(diff, 10, dzParams, 'tractable');
      scales.push(s);
      // Compose: final kH delta = scale × (projected − current)
      kH = kH + s * (step.projectedKH - kH);
    }
    const cert = verifyDescentCertificate(trajectory, 1e-9);
    expect(cert.holds).toBe(true);
    // Composed V̇ at every step is scale × V̇_raw, ≤ 0
    for (let i = 0; i < trajectory.length; i++) {
      const composed = composedVdot(trajectory[i]!.Vdot, scales[i]!);
      expect(composed).toBeLessThanOrEqual(1e-9);
    }
  });
});
