/**
 * MD-5 — Trainer tests: ME-1 hard gate, Lyapunov gate, gradient descent direction.
 */

import { describe, it, expect } from 'vitest';
import { createHead, forward } from '../head.js';
import { train, type LyapunovFixtureSample } from '../trainer.js';

/**
 * Build a small zero-regressor Lyapunov fixture that every K_H value trivially
 * satisfies V̇ ≤ 0 (wDotE = 0 ⇒ Vdot = 0). Used when we want to isolate the
 * trainer's gradient behaviour from the Lyapunov gate.
 */
function permissiveFixture(n: number, dim: number = 3): LyapunovFixtureSample[] {
  const out: LyapunovFixtureSample[] = [];
  const taskEmbed = new Array<number>(dim).fill(0.1);
  for (let i = 0; i < n; i += 1) {
    out.push({
      taskEmbed,
      observedRate: 1.0,
      teachingDeclaredRate: 1.0, // e = 0 → Vdot = 0
      targetKH: 1.0,
      regressor: [1, 1],
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
  }
  return out;
}

describe('train — ME-1 hard gate', () => {
  it('coin-flip skills: zero updates', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const before = h.updateCount;
    const r = train(h, {
      tractability: 'coin-flip',
      taskEmbed: [0.1, 0.2, 0.3],
      targetKH: 1.5,
      lyapunovFixture: permissiveFixture(3),
    });
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('non-tractable');
    expect(h.updateCount).toBe(before);
    expect(h.bias).toBe(0);
    expect(h.weights).toEqual([0, 0, 0]);
  });

  it('unknown skills: zero updates', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0, kHMax: 1 });
    const r = train(h, {
      tractability: 'unknown',
      taskEmbed: [0.5, 0.5],
      targetKH: 0.8,
    });
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('non-tractable');
    expect(h.updateCount).toBe(0);
  });

  it('hard gate: 100 attempts on non-tractable → still zero updates (stress)', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0, kHMax: 1 });
    for (let i = 0; i < 100; i += 1) {
      const cls = i % 2 === 0 ? 'coin-flip' : 'unknown';
      train(h, {
        tractability: cls,
        taskEmbed: [Math.random(), Math.random(), Math.random()],
        targetKH: 0.5,
      });
    }
    expect(h.updateCount).toBe(0);
    expect(h.bias).toBe(0);
    expect(h.weights.every((w) => w === 0)).toBe(true);
  });
});

describe('train — gradient descent direction', () => {
  it('tractable: moves K_H toward target (target < current)', () => {
    // Head midpoint is 1.25; target is 0.5 → head should decrease output.
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0.5, kHMax: 2.0 });
    const x = [0.4, 0.6];
    const before = forward(h, x).kH;
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: x,
      targetKH: 0.5,
      learningRate: 1.0,
      lyapunovFixture: permissiveFixture(2, 2),
    });
    expect(r.accepted).toBe(true);
    expect(r.kHBefore).toBeCloseTo(before, 12);
    expect(r.kHAfter).toBeLessThan(r.kHBefore);
  });

  it('tractable: moves K_H toward target (target > current)', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0.5, kHMax: 2.0 });
    const x = [0.4, 0.6];
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: x,
      targetKH: 1.9, // above midpoint 1.25
      learningRate: 1.0,
      lyapunovFixture: permissiveFixture(2, 2),
    });
    expect(r.accepted).toBe(true);
    expect(r.kHAfter).toBeGreaterThan(r.kHBefore);
  });

  it('multi-step convergence: 50 steps with constant target monotonically narrows gap', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0, kHMax: 2 });
    const x = [0.3, 0.7];
    const target = 1.7;
    const initGap = Math.abs(forward(h, x).kH - target);
    for (let i = 0; i < 50; i += 1) {
      train(h, {
        tractability: 'tractable',
        taskEmbed: x,
        targetKH: target,
        learningRate: 0.5,
        lyapunovFixture: permissiveFixture(1, 2),
      });
    }
    const finalGap = Math.abs(forward(h, x).kH - target);
    expect(finalGap).toBeLessThan(initGap);
  });
});

describe('train — Lyapunov gate (CF-MD5-05)', () => {
  it('rejects an update that would drive V̇ > 0 on the fixture', () => {
    // Construct a fixture where raising K_H above target yields Vdot > 0.
    // evaluateLyapunov: Vdot = -g · tractGain · (e · (w·e))
    //   For regressor [1,1], wDotE = 2e; Vdot = -0.02 · (e · 2e) = -0.04·e².
    // With non-negative regressor and real e, Vdot is always ≤ 0 under the
    // Sastry closed-form. To get Vdot > 0 we need a negative regressor
    // (non-physical in MB-1, but legal input to evaluateLyapunov). We use
    // that as the adversarial lever.
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0.5, kHMax: 2.0 });
    const x = [0.5, 0.5];
    // A fixture with a negative regressor: wDotE = -1 · e; Vdot = -g · (-e²) = +g·e².
    // Any non-zero e will produce Vdot > 0 — the gate must reject.
    const adversarial: LyapunovFixtureSample[] = [
      {
        taskEmbed: [0.5, 0.5],
        observedRate: 2.0,
        teachingDeclaredRate: 1.0, // e = 1
        targetKH: 1.0,
        regressor: [-1],
        gainG: 0.01,
        gainGamma: 1.0,
        tractGain: 1.0,
      },
    ];
    const beforeBias = h.bias;
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: x,
      targetKH: 0.5,
      learningRate: 1.0,
      lyapunovFixture: adversarial,
    });
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('lyapunov-violation');
    expect(r.violatingFixtureSteps).toEqual([0]);
    // Head untouched.
    expect(h.bias).toBe(beforeBias);
    expect(h.updateCount).toBe(0);
  });

  it('accepts updates when all fixture steps have V̇ ≤ 0', () => {
    const h = createHead({ skillId: 's', dim: 2, kHMin: 0, kHMax: 1 });
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: [0.2, 0.4],
      targetKH: 0.2,
      learningRate: 0.5,
      lyapunovFixture: permissiveFixture(5, 2),
    });
    expect(r.accepted).toBe(true);
    expect(r.fixtureEvaluated).toBe(5);
    expect(r.maxPostUpdateVdot).toBeLessThanOrEqual(1e-9);
    expect(h.updateCount).toBe(1);
  });

  it('empty fixture: Lyapunov gate is disabled (unit-test escape hatch)', () => {
    const h = createHead({ skillId: 's', dim: 1, kHMin: 0, kHMax: 1 });
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: [1.0],
      targetKH: 0.0,
      learningRate: 0.5,
      lyapunovFixture: [],
    });
    expect(r.accepted).toBe(true);
    expect(r.fixtureEvaluated).toBe(0);
  });
});

describe('train — non-finite update guard', () => {
  it('rejects when scaledGradient is non-finite', () => {
    const h = createHead({ skillId: 's', dim: 1, kHMin: 0, kHMax: 1 });
    const r = train(h, {
      tractability: 'tractable',
      taskEmbed: [1.0],
      targetKH: Number.NaN,
      learningRate: 1.0,
    });
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe('non-finite-update');
    expect(h.updateCount).toBe(0);
  });
});
