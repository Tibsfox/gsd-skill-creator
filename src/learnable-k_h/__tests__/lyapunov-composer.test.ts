/**
 * MD-5 — Lyapunov-composer tests (CF-MD5-05):
 *
 * On a 100-step fixture representing a single adaptive trajectory, verify that
 * the learnable head (whether untrained or trained via the `train` path)
 * preserves V̇ ≤ 0 at every step. Parallels MB-1's CF-MB1-01 fixture shape.
 */

import { describe, it, expect } from 'vitest';
import { createHead } from '../head.js';
import { train, type LyapunovFixtureSample } from '../trainer.js';
import {
  verifyHeadPreservesDescent,
  composesWithLyapunov,
} from '../lyapunov-composer.js';
import { cloneHead } from '../head.js';

/**
 * Build a 100-step "ideal" trajectory that matches MB-1's own CF-MB1-01 fixture
 * shape: tracking error `e` decays monotonically toward 0 while the regressor
 * stays non-negative (w = [dose≥0, recency>0]). In the Sastry closed-form
 * Vdot = -g · tractGain · (e · wDotE) = -g · (e²·Σw_i) ≤ 0 for every step.
 */
function idealTrajectory(): LyapunovFixtureSample[] {
  const out: LyapunovFixtureSample[] = [];
  for (let i = 0; i < 100; i += 1) {
    // e_i = 0.5 · exp(-i/30) → monotone decay to ~0
    const e = 0.5 * Math.exp(-i / 30);
    const observed = 1.0 + e;
    const teaching = 1.0;
    // Non-negative regressor.
    const dose = 0.5 + 0.5 * Math.sin(i / 7); // ∈ [0, 1]
    const recency = Math.exp(-i / 50);
    // Shift the task embedding lightly per step — remains in stable sign region.
    const taskEmbed = [Math.sin(i / 11), Math.cos(i / 13), 0.1];
    out.push({
      taskEmbed,
      observedRate: observed,
      teachingDeclaredRate: teaching,
      targetKH: 1.0,
      regressor: [Math.max(0, dose), Math.max(1e-6, recency)],
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
  }
  return out;
}

describe('verifyHeadPreservesDescent — CF-MD5-05 100-step fixture', () => {
  it('untrained head: V̇ ≤ 0 at every step (baseline)', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const fixture = idealTrajectory();
    expect(fixture.length).toBe(100);
    const r = verifyHeadPreservesDescent(h, fixture);
    expect(r.preserved).toBe(true);
    expect(r.certificate.holds).toBe(true);
    expect(r.certificate.failures).toEqual([]);
    // Strictly: Vdot should be ≤ 0 (up to FP tolerance) on every step.
    for (const vd of r.certificate.Vdottrace) {
      expect(vd).toBeLessThanOrEqual(1e-9);
    }
  });

  it('trained head: V̇ ≤ 0 preserved after 20 training steps on the same fixture', () => {
    const h = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const fixture = idealTrajectory();
    // Run 20 SGD steps, each guarded by the same fixture.
    let acceptedCount = 0;
    for (let i = 0; i < 20; i += 1) {
      const sample = fixture[i]!;
      const r = train(h, {
        tractability: 'tractable',
        taskEmbed: sample.taskEmbed,
        targetKH: sample.targetKH,
        learningRate: 0.3,
        lyapunovFixture: fixture,
      });
      if (r.accepted) acceptedCount += 1;
    }
    // At least one update should have been accepted (else the gate is unphysical).
    expect(acceptedCount).toBeGreaterThan(0);
    // After training, the post-training head still preserves descent.
    const post = verifyHeadPreservesDescent(h, fixture);
    expect(post.preserved).toBe(true);
    expect(post.certificate.failures).toEqual([]);
  });
});

describe('composesWithLyapunov — pre + post head both preserve descent', () => {
  it('untrained pre, trained post → true', () => {
    const pre = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const post = cloneHead(pre);
    // Bump the bias slightly — still in the safe regime.
    post.bias = 0.1;
    const fixture = idealTrajectory();
    expect(composesWithLyapunov(pre, post, fixture)).toBe(true);
  });

  it('returns false if post head fails descent', () => {
    const pre = createHead({ skillId: 's', dim: 3, kHMin: 0.5, kHMax: 2.0 });
    const post = cloneHead(pre);
    // Saturate the head so its output is pinned at kHMax — still ≤ 0 under
    // Sastry closed form. We instead construct an adversarial single-step
    // fixture that *would* violate descent, to exercise the negative branch.
    const adversarialStep: LyapunovFixtureSample = {
      taskEmbed: [0, 0, 0],
      observedRate: 2.0,
      teachingDeclaredRate: 1.0, // e = 1
      targetKH: 1.0,
      regressor: [-1], // negative regressor → Vdot = -g · (-e²) = +g·e² > 0
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    };
    expect(composesWithLyapunov(pre, post, [adversarialStep])).toBe(false);
  });
});
