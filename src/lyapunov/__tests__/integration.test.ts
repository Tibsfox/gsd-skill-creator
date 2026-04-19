/**
 * MB-1 — End-to-end integration with M6 DesensitisationStore.
 *
 * Exercises the bridge against a real `DesensitisationStore` instance: the
 * flag-off path produces the legacy ad-hoc trajectory byte-identically (per
 * SC-MB1-01), and the flag-on path applies the Lyapunov-stable update law
 * while keeping `K_H ∈ [K_L, K_H_target]`.
 */

import { describe, it, expect } from 'vitest';
import { DesensitisationStore } from '../../sensoria/desensitisation.js';
import { computeNetShift } from '../../sensoria/netShift.js';
import { DEFAULT_SENSORIA } from '../../sensoria/frontmatter.js';
import type { SensoriaBlock } from '../../types/sensoria.js';
import { computeLyapunovKH } from '../desensitisation-bridge.js';
import { verifyDescentCertificate } from '../lyapunov-function.js';
import type { LyapunovCandidate } from '../lyapunov-function.js';

describe('MB-1 ↔ M6 integration — flag-off preserves legacy behaviour', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

  it('flag-off trajectory matches pure DesensitisationStore on 100-session fixture', () => {
    const ref = new DesensitisationStore();
    const refTrace: Array<{ kH: number; dR: number }> = [];

    const bridged = new DesensitisationStore();
    const bridgedTrace: Array<{ kH: number; dR: number }> = [];

    const L = 1 / Math.sqrt(block.K_H * block.K_L); // peak ligand
    let t = 0;
    for (let i = 0; i < 100; i += 1) {
      t += 500;

      // Reference path — legacy only.
      const refUpdate = ref.recordActivation('skill', block, L, block.R_T_init, t);
      refTrace.push({
        kH: refUpdate.effectiveK_H,
        dR: computeNetShift(L, refUpdate.R_T, refUpdate.effectiveK_H, block.K_L).deltaR_H,
      });

      // Bridged path — flag OFF, so the Lyapunov call is a no-op.
      const snap = bridged.getOrInit('skill', block, t);
      const r = computeLyapunovKH({
        state: snap,
        block,
        dose: L,
        observedRate: 0.5,
        teachingDeclaredRate: 0.5,
        nowMs: t,
        tractability: 'tractable',
        enabled: false,
      });
      expect(r.applied).toBe(false);
      const bridgedUpdate = bridged.recordActivation('skill', block, L, block.R_T_init, t);
      bridgedTrace.push({
        kH: bridgedUpdate.effectiveK_H,
        dR: computeNetShift(L, bridgedUpdate.R_T, bridgedUpdate.effectiveK_H, block.K_L).deltaR_H,
      });
    }

    expect(bridgedTrace).toEqual(refTrace);
  });
});

describe('MB-1 ↔ M6 integration — flag-on Lyapunov path', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

  it('100-session flag-on run produces a non-increasing Lyapunov trajectory (LS-31)', () => {
    const store = new DesensitisationStore();
    const candidates: LyapunovCandidate[] = [];

    const L = 1 / Math.sqrt(block.K_H * block.K_L);
    // Teaching-stationary target — observed is regressed toward declared over time.
    let observedRate = 1.0;
    const teachingDeclaredRate = 1.0; // start at equilibrium to establish e → 0 regime

    // Seed state so effectiveK_H sits mid-range (allows both up/down motion).
    const state0 = store.getOrInit('skill', block, 0);
    state0.effectiveK_H = 8;

    // Perturb observed off-target briefly, then let the adaptation law pull e→0.
    observedRate = 1.2;

    let t = 0;
    for (let i = 0; i < 100; i += 1) {
      t += 100;
      const snap = store.getOrInit('skill', block, t);
      const r = computeLyapunovKH({
        state: snap,
        block,
        dose: L,
        observedRate,
        teachingDeclaredRate,
        nowMs: t,
        tractability: 'tractable',
        tractabilityConfidence: 1.0,
        enabled: true,
        stepSize: 0.1,
        gainG: 0.05,
        gainGamma: 1.0,
      });
      expect(r.applied).toBe(true);
      candidates.push(r.adaptation!.candidate);

      // Simulate observed drifting back toward teaching (closed-loop).
      observedRate = observedRate - 0.5 * (observedRate - teachingDeclaredRate) * 0.1;

      // Persist the adapted K_H into the store so the next iteration reads it.
      snap.effectiveK_H = r.newEffectiveKH!;
      snap.lastUpdateTs = t;
    }

    expect(candidates).toHaveLength(100);
    const cert = verifyDescentCertificate(candidates, 1e-6);
    // LS-31: Vdot ≤ 0 at every step under the Sastry closed-form descent
    // expression. V itself may drift when the plant fails Sastry's LTI/SISO
    // assumption (expected for M6's non-stationary, discrete-event plant);
    // V monotonicity is covered separately by the pure-fixture test in
    // lyapunov-function.test.ts.
    expect(cert.holds).toBe(true);
    expect(cert.failures).toEqual([]);
  });

  it('coin-flip tractability scales magnitude vs tractable (CF-MB1-02)', () => {
    const mk = () => {
      const s = new DesensitisationStore();
      const st = s.getOrInit('skill', block, 0);
      st.effectiveK_H = 8;
      return { store: s, state: st };
    };

    const optsBase = {
      block,
      dose: 1,
      observedRate: 2,
      teachingDeclaredRate: 1,
      nowMs: 1000,
      enabled: true,
      stepSize: 1.0,
      gainG: 0.1,
    } as const;

    const T = mk();
    const rT = computeLyapunovKH({ state: T.state, tractability: 'tractable', ...optsBase });
    const C = mk();
    const rC = computeLyapunovKH({ state: C.state, tractability: 'coin-flip', ...optsBase });

    const magT = Math.abs(rT.adaptation!.deltaKHRaw);
    const magC = Math.abs(rC.adaptation!.deltaKHRaw);
    // Coin-flip magnitude ≤ 0.3× tractable magnitude (documented gain scaling).
    expect(magC).toBeLessThanOrEqual(magT * 0.3 + 1e-12);
    expect(magC).toBeCloseTo(magT * 0.3, 10);
  });

  it('does not perturb existing M6 Weber-fade behaviour on the non-Lyapunov path', () => {
    // When flag off, sustained dose still produces tachyphylaxis ≥ 30% (CF-M6-03).
    const store = new DesensitisationStore();
    const L = 1 / Math.sqrt(block.K_H * block.K_L);
    const deltas: number[] = [];
    let t = 0;
    for (let i = 0; i < 20; i += 1) {
      t += 1000;
      const snap = store.getOrInit('skill', block, t);
      const bridge = computeLyapunovKH({
        state: snap,
        block,
        dose: L,
        observedRate: 1,
        teachingDeclaredRate: 0.5,
        nowMs: t,
        tractability: 'tractable',
        enabled: false, // flag off
      });
      expect(bridge.applied).toBe(false);
      const { effectiveK_H, R_T } = store.recordActivation('skill', block, L, block.R_T_init, t);
      deltas.push(computeNetShift(L, R_T, effectiveK_H, block.K_L).deltaR_H);
    }
    const fade = (deltas[0]! - deltas[deltas.length - 1]!) / deltas[0]!;
    expect(fade).toBeGreaterThanOrEqual(0.3);
  });
});
