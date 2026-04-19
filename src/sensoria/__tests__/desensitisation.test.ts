/**
 * CF-M6-03 tachyphylaxis + IT-05 branch isolation + SC-M6-CONS
 * conservation through desensitisation transitions.
 */

import { describe, it, expect } from 'vitest';
import { DesensitisationStore, DEFAULT_DESENS_PARAMS } from '../desensitisation.js';
import { computeNetShift } from '../netShift.js';
import { DEFAULT_SENSORIA } from '../frontmatter.js';

describe('DesensitisationStore — CF-M6-03 tachyphylaxis ≥30% fade over 20 activations', () => {
  it('produces ≥30% fade under sustained peak-ligand dose', () => {
    const store = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };
    const L = 1 / Math.sqrt(block.K_H * block.K_L); // peak ligand

    const deltas: number[] = [];
    let t = 0;
    for (let i = 0; i < 20; i += 1) {
      t += 1000;
      const { effectiveK_H, R_T } = store.recordActivation('skill-a', block, L, block.R_T_init, t);
      const r = computeNetShift(L, R_T, effectiveK_H, block.K_L);
      deltas.push(r.deltaR_H);
    }

    const first = deltas[0]!;
    const last = deltas[deltas.length - 1]!;
    const fade = (first - last) / first;
    expect(fade).toBeGreaterThanOrEqual(0.30);
  });

  it('fade is monotone decreasing across the 20-activation trace', () => {
    const store = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA, K_H: 20, K_L: 0.05, R_T_init: 1, theta: 0.01 };
    const L = 1 / Math.sqrt(block.K_H * block.K_L);

    const deltas: number[] = [];
    let t = 0;
    for (let i = 0; i < 20; i += 1) {
      t += 500;
      const { effectiveK_H, R_T } = store.recordActivation('skill-b', block, L, block.R_T_init, t);
      deltas.push(computeNetShift(L, R_T, effectiveK_H, block.K_L).deltaR_H);
    }
    // Allow one tiny non-monotone blip from recovery interaction; 18/19 must
    // be non-increasing.
    let nondec = 0;
    for (let i = 1; i < deltas.length; i += 1) {
      if (deltas[i]! <= deltas[i - 1]!) nondec += 1;
    }
    expect(nondec).toBeGreaterThanOrEqual(18);
  });
});

describe('DesensitisationStore — recovery', () => {
  it('effectiveK_H drifts back toward initial K_H after long idle gap', () => {
    // Use a much higher recovery rate so the test doesn't need real-world
    // timescales to observe the drift. Verifies the mechanism, not the rate.
    const store = new DesensitisationStore({
      ...DEFAULT_DESENS_PARAMS,
      recoveryPerMs: 1e-3,
    });
    const block = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1, theta: 0.01 };

    // Burn K_H down with a dose.
    store.recordActivation('skill-c', block, 10, 1, 0);
    const afterBurn = store.snapshot('skill-c')!;
    expect(afterBurn.effectiveK_H).toBeLessThan(block.K_H);

    // Long idle gap with a zero-dose activation — recovery should apply.
    const afterGap = store.recordActivation('skill-c', block, 0, 1, 10_000);
    expect(afterGap.effectiveK_H).toBeGreaterThan(afterBurn.effectiveK_H);
  });
});

describe('DesensitisationStore — IT-05 branch isolation', () => {
  it('two stores hold independent per-skill state', () => {
    const trunk = new DesensitisationStore();
    const branch = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA };

    for (let i = 0; i < 10; i += 1) {
      trunk.recordActivation('shared-skill', block, 1, 1, i * 1000);
    }
    // Branch never sees the dose.
    const trunkState = trunk.snapshot('shared-skill')!;
    const branchState = branch.snapshot('shared-skill');
    expect(trunkState.fadeCount).toBe(10);
    expect(branchState).toBeUndefined();
  });
});

describe('DesensitisationStore — conservation compatibility', () => {
  it('post-recordActivation R_T stays ≤ initial and ≥ 0', () => {
    const store = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA, R_T_init: 3 };
    for (let i = 0; i < 50; i += 1) {
      const { R_T } = store.recordActivation('sk', block, 2, block.R_T_init, i * 100);
      expect(R_T).toBeLessThanOrEqual(block.R_T_init);
      expect(R_T).toBeGreaterThanOrEqual(0);
    }
  });

  it('effectiveK_H stays in [K_L, K_H]', () => {
    const store = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA, K_H: 10, K_L: 0.1, R_T_init: 1 };
    for (let i = 0; i < 100; i += 1) {
      const { effectiveK_H } = store.recordActivation('sk', block, 5, 1, i * 250);
      expect(effectiveK_H).toBeGreaterThanOrEqual(block.K_L);
      expect(effectiveK_H).toBeLessThanOrEqual(block.K_H);
    }
  });
});

describe('DesensitisationStore — getOrInit idempotence', () => {
  it('returns the same state object on repeat calls', () => {
    const store = new DesensitisationStore();
    const a = store.getOrInit('x', DEFAULT_SENSORIA, 0);
    const b = store.getOrInit('x', DEFAULT_SENSORIA, 1000);
    expect(b).toBe(a);
  });

  it('clear() wipes all state', () => {
    const store = new DesensitisationStore();
    store.recordActivation('x', DEFAULT_SENSORIA, 1, 1, 0);
    store.recordActivation('y', DEFAULT_SENSORIA, 1, 1, 0);
    store.clear();
    expect(store.snapshot('x')).toBeUndefined();
    expect(store.snapshot('y')).toBeUndefined();
  });
});
