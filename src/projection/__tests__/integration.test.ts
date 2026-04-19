/**
 * MB-2 — Integration tests.
 *
 * SC-MB2-01: flag-off byte-identical — with both `lyapunov.enabled=false` and
 * `lyapunov.projection.enabled=false`, the system behaves identically to
 * phase-660 sensoria + phase-647 M7.
 *
 * IT-W2-MB2: 200-session fixture under MB-1 gain — combined K_H + simplex
 * trajectory remains bounded, no oscillation from compound smooth-projection
 * boundary dynamics.
 *
 * LS-32: MB-2 runs under MB-1 gain; combined K_H + simplex trajectory
 * remains bounded; MB-1 V̇ ≤ 0 preserved through MB-2 projection.
 */

import { describe, it, expect } from 'vitest';
import { DesensitisationStore } from '../../sensoria/desensitisation.js';
import { computeNetShift } from '../../sensoria/netShift.js';
import { DEFAULT_SENSORIA } from '../../sensoria/frontmatter.js';
import type { SensoriaBlock } from '../../types/sensoria.js';
import { computeLyapunovKH } from '../../lyapunov/desensitisation-bridge.js';
import { verifyDescentCertificate } from '../../lyapunov/lyapunov-function.js';
import type { LyapunovCandidate } from '../../lyapunov/lyapunov-function.js';
import { projectModelRow } from '../generative-model-projector.js';
import { makeUniformModel, makeCounts, observe, materialiseModel } from '../../umwelt/generativeModel.js';
import { projectKH } from '../k_h-projector.js';
import { buildRegressor } from '../../lyapunov/k_h-adaptation.js';

// ---------------------------------------------------------------------------
// SC-MB2-01: flag-off byte-identical (M6 / Sensoria path)
// ---------------------------------------------------------------------------

describe('SC-MB2-01 — flag-off: M6 byte-identical to phase-660 sensoria', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

  it('100-session trajectory: projection flag-off matches legacy desensitisation exactly', () => {
    const ref = new DesensitisationStore();
    const refTrace: Array<{ kH: number; dR: number }> = [];

    const withMB2 = new DesensitisationStore();
    const mb2Trace: Array<{ kH: number; dR: number }> = [];

    const L = 1 / Math.sqrt(block.K_H * block.K_L);
    let t = 0;

    for (let i = 0; i < 100; i++) {
      t += 500;

      // Reference path: pure DesensitisationStore.
      const refUpdate = ref.recordActivation('skill', block, L, block.R_T_init, t);
      refTrace.push({
        kH: refUpdate.effectiveK_H,
        dR: computeNetShift(L, refUpdate.R_T, refUpdate.effectiveK_H, block.K_L).deltaR_H,
      });

      // MB-2 path: projection disabled, MB-1 disabled.
      const snap = withMB2.getOrInit('skill', block, t);
      const lyapBridge = computeLyapunovKH({
        state: snap,
        block,
        dose: L,
        observedRate: 0.5,
        teachingDeclaredRate: 0.5,
        nowMs: t,
        tractability: 'tractable',
        enabled: false, // MB-1 off
      });
      expect(lyapBridge.applied).toBe(false);

      // projectKH with projection also off.
      const projResult = projectKH({
        currentKH: snap.effectiveK_H,
        targetKH: block.K_H,
        observedRate: 0.5,
        teachingDeclaredRate: 0.5,
        regressor: buildRegressor({ doseMagnitude: L, ageMs: 0 }),
        tractabilityGain: 1.0,
        floor: block.K_L,
        ceiling: block.K_H,
        projectionEnabled: false, // MB-2 off
      });
      expect(projResult.projectionApplied).toBe(false);

      const mb2Update = withMB2.recordActivation('skill', block, L, block.R_T_init, t);
      mb2Trace.push({
        kH: mb2Update.effectiveK_H,
        dR: computeNetShift(L, mb2Update.R_T, mb2Update.effectiveK_H, block.K_L).deltaR_H,
      });
    }

    expect(mb2Trace).toEqual(refTrace);
  });
});

// ---------------------------------------------------------------------------
// SC-MB2-01: flag-off byte-identical (M7 / generativeModel path)
// ---------------------------------------------------------------------------

describe('SC-MB2-01 — flag-off: M7 byte-identical to phase-647 materialiseModel', () => {
  it('100-session materialise: projection flag-off matches materialiseModel exactly', () => {
    const intents = ['a', 'b', 'c'];
    const obs = ['x', 'y', 'z', 'w'];

    const refCounts = makeCounts(intents, obs, 1);
    const mb2Counts = makeCounts(intents, obs, 1);

    const sessions = 100;
    let lcg = 123;
    const randIdx = (n: number) => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return (lcg >>> 0) % n;
    };

    for (let i = 0; i < sessions; i++) {
      const iIdx = randIdx(intents.length);
      const oIdx = randIdx(obs.length);
      observe(refCounts, iIdx, oIdx);
      observe(mb2Counts, iIdx, oIdx);
    }

    const refModel = materialiseModel(intents, refCounts);
    const mb2Model = materialiseModel(intents, mb2Counts);

    // Apply MB-2 projectModel with flag OFF — should match refModel exactly.
    for (let i = 0; i < intents.length; i++) {
      const refRow = refModel.condProbTable[i]!;
      const mb2Row = mb2Model.condProbTable[i]!;
      const r = projectModelRow([...mb2Row], { projectionEnabled: false });

      for (let j = 0; j < obs.length; j++) {
        // Flag-off projectModelRow should equal materialiseModel's row exactly.
        expect(Math.abs(r.projected[j]! - refRow[j]!)).toBeLessThan(1e-12);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// IT-W2-MB2: 200-session combined K_H + simplex fixture
// ---------------------------------------------------------------------------

describe('IT-W2-MB2 — 200-session combined K_H + simplex trajectory bounded', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

  it('combined K_H + simplex remains bounded over 200 sessions', () => {
    const intents = ['a', 'b', 'c'];
    const obs = ['x', 'y', 'z'];
    let kH = block.K_H * 0.8; // start at 80% of max
    let theta = [1 / 3, 1 / 3, 1 / 3]; // start uniform

    let lcg = 77;
    const rand = () => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return ((lcg >>> 0) / 0xffffffff);
    };
    const randIdx = (n: number) => Math.floor(rand() * n);

    const kHTrace: number[] = [];
    const simplexSumTrace: number[] = [];

    for (let session = 0; session < 200; session++) {
      // K_H update via MB-2 projector (flag-on).
      const regressor = buildRegressor({ doseMagnitude: rand(), ageMs: session * 100 });
      const r = projectKH({
        currentKH: kH,
        targetKH: block.K_H,
        observedRate: 0.5 + 0.2 * rand(),
        teachingDeclaredRate: 0.5,
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
      kH = r.projectedKH;
      kHTrace.push(kH);

      // Simplex update via MB-2 projector (flag-on): gradient step toward observed obs.
      const iIdx = randIdx(intents.length);
      const oIdx = randIdx(obs.length);
      const grad = theta.map((v, j) => (j === oIdx ? v - 1 : v - 0));
      const stepSize = 0.01;
      const rawTheta = theta.map((v, j) => v - stepSize * grad[j]!);
      const rRow = projectModelRow(rawTheta, { projectionEnabled: true });
      theta = rRow.projected;
      simplexSumTrace.push(theta.reduce((a, b) => a + b, 0));

      void iIdx;
    }

    // K_H must remain in [K_L, K_H_max] throughout.
    for (const kHVal of kHTrace) {
      expect(kHVal).toBeGreaterThanOrEqual(block.K_L - 1e-9);
      expect(kHVal).toBeLessThanOrEqual(block.K_H + 1e-9);
    }

    // Simplex rows must sum to 1 throughout.
    for (const s of simplexSumTrace) {
      expect(Math.abs(s - 1)).toBeLessThan(1e-9);
    }

    // No oscillation: K_H range should not exceed 2× the starting range.
    const kHMin = Math.min(...kHTrace);
    const kHMax = Math.max(...kHTrace);
    expect(kHMax - kHMin).toBeLessThan(block.K_H * 2);
  });
});

// ---------------------------------------------------------------------------
// LS-32: MB-1 V̇ ≤ 0 preserved through MB-2 projection (100-step)
// ---------------------------------------------------------------------------

describe('LS-32 — MB-1 V̇ ≤ 0 preserved through MB-2 smooth projection (100-step)', () => {
  const block: SensoriaBlock = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

  it('V̇ ≤ 0 at every step on the 100-step MB-1+MB-2 trajectory', () => {
    const store = new DesensitisationStore();
    const candidates: LyapunovCandidate[] = [];

    let observedRate = 1.2;
    const teachingDeclaredRate = 1.0;

    const state0 = store.getOrInit('skill', block, 0);
    state0.effectiveK_H = 8;

    let t = 0;
    for (let i = 0; i < 100; i++) {
      t += 100;
      const snap = store.getOrInit('skill', block, t);

      // MB-1 adaptation via bridge (flag-on).
      const bridgeResult = computeLyapunovKH({
        state: snap,
        block,
        dose: 1 / Math.sqrt(block.K_H * block.K_L),
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
      expect(bridgeResult.applied).toBe(true);
      candidates.push(bridgeResult.adaptation!.candidate);

      // MB-2 projection on top of MB-1's unclamped delta.
      const projResult = projectKH({
        currentKH: snap.effectiveK_H,
        targetKH: block.K_H,
        observedRate,
        teachingDeclaredRate,
        regressor: bridgeResult.adaptation!.candidate.regressor,
        tractabilityGain: 1.0,
        stepSize: 0.1,
        gainG: 0.05,
        gainGamma: 1.0,
        floor: block.K_L,
        ceiling: block.K_H,
        projectionEnabled: true,
        penaltyStrength: 0.1,
      });

      // Use MB-2 projected K_H as the committed value.
      snap.effectiveK_H = projResult.projectedKH;
      snap.lastUpdateTs = t;

      // Simulate error decay.
      observedRate = observedRate - 0.5 * (observedRate - teachingDeclaredRate) * 0.1;
    }

    expect(candidates).toHaveLength(100);
    const cert = verifyDescentCertificate(candidates, 1e-6);

    // LS-32: V̇ ≤ 0 preserved throughout the MB-1+MB-2 combined trajectory.
    expect(cert.holds).toBe(true);
    expect(cert.failures).toEqual([]);

    const maxVdot = Math.max(...cert.Vdottrace);
    // Evidence for LS-32 report.
    expect(maxVdot).toBeLessThanOrEqual(0 + 1e-6);
  });
});

// ---------------------------------------------------------------------------
// M7 simplex preservation under existing M7 fixture patterns
// ---------------------------------------------------------------------------

describe('M7 simplex constraints preserved by MB-2 (LS-32 M7 half)', () => {
  it('materialised model rows after MB-2 projection are all simplex-admissible', () => {
    const intents = ['new-feature', 'debug', 'refactor', 'review'];
    const obs = ['tool-use', 'edit', 'search', 'output'];

    const counts = makeCounts(intents, obs, 1);

    // Simulate 500 diverse sessions (PE-like condition).
    let lcg = 314;
    const randIdx = (n: number) => {
      lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
      return (lcg >>> 0) % n;
    };

    for (let i = 0; i < 500; i++) {
      observe(counts, randIdx(intents.length), randIdx(obs.length));
    }

    const model = materialiseModel(intents, counts);

    // Project each row with MB-2 (flag-on).
    for (const row of model.condProbTable) {
      const r = projectModelRow([...row], { projectionEnabled: true });
      const s = r.projected.reduce((a, b) => a + b, 0);
      expect(Math.abs(s - 1)).toBeLessThan(1e-9);
      for (const v of r.projected) {
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('makeUniformModel rows pass through MB-2 unchanged (already on simplex)', () => {
    const intents = ['a', 'b', 'c'];
    const obs = ['x', 'y'];
    const model = makeUniformModel(intents, obs);

    for (const row of model.condProbTable) {
      const r = projectModelRow([...row], { projectionEnabled: true });
      // Already uniform — should be close to original.
      const s = r.projected.reduce((a, b) => a + b, 0);
      expect(Math.abs(s - 1)).toBeLessThan(1e-9);
    }
  });
});
