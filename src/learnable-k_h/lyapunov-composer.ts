/**
 * MD-5 — Lyapunov composer.
 *
 * Given a head, a proposed post-update head (typically produced by the
 * trainer), and a trajectory fixture, verify that the Sastry Lyapunov
 * candidate `V = 0.5·e² + 0.5·γ·φ²` satisfies `V̇ ≤ 0` at every fixture
 * step **after** substituting the head's forward-pass K_H as the
 * `effectiveK_H` in the Lyapunov evaluator.
 *
 * This is the MD-5 composability artefact for CF-MD5-05 / LS-38: the
 * learnable head's output is a valid replacement for the MB-1 scalar K_H on
 * the Lyapunov descent trajectory, provided the head's parameters do not
 * drift so far that `V̇` becomes positive. The trainer's
 * `lyapunovFixture` gate already enforces this on each SGD step; this
 * composer is the same check exposed as a standalone primitive for
 * integration tests and for CF-MD5-05's 100-step fixture.
 *
 * Pure function — no mutation, no I/O.
 *
 * @module learnable-k_h/lyapunov-composer
 */

import {
  evaluateLyapunov,
  verifyDescentCertificate,
  type DescentCertificate,
  type LyapunovCandidate,
} from '../lyapunov/lyapunov-function.js';
import { forward, type LearnableKHHead } from './head.js';
import type { LyapunovFixtureSample } from './trainer.js';

/**
 * Evaluate the Lyapunov trajectory using `head.forward(taskEmbed).kH` as the
 * `effectiveK_H` at each sample, and verify descent. Returns the candidate
 * trajectory, the descent certificate, and a summary boolean.
 */
export function verifyHeadPreservesDescent(
  head: LearnableKHHead,
  fixture: readonly LyapunovFixtureSample[],
  tolerance: number = 1e-9,
): {
  trajectory: LyapunovCandidate[];
  certificate: DescentCertificate;
  preserved: boolean;
} {
  const trajectory: LyapunovCandidate[] = [];
  for (const sample of fixture) {
    const kH = forward(head, sample.taskEmbed).kH;
    const c = evaluateLyapunov({
      observedRate: sample.observedRate,
      teachingDeclaredRate: sample.teachingDeclaredRate,
      effectiveK_H: kH,
      targetK_H: sample.targetKH,
      regressor: sample.regressor.slice(),
      gainG: sample.gainG,
      gainGamma: sample.gainGamma,
      tractGain: sample.tractGain,
    });
    trajectory.push(c);
  }
  const certificate = verifyDescentCertificate(trajectory, tolerance);
  return { trajectory, certificate, preserved: certificate.holds };
}

/**
 * Summary comparison: did a post-update head preserve the descent property
 * that the pre-update head already had? Returns `true` when BOTH `pre` and
 * `post` heads yield `V̇ ≤ tolerance` at every fixture step.
 */
export function composesWithLyapunov(
  preHead: LearnableKHHead,
  postHead: LearnableKHHead,
  fixture: readonly LyapunovFixtureSample[],
  tolerance: number = 1e-9,
): boolean {
  const pre = verifyHeadPreservesDescent(preHead, fixture, tolerance);
  if (!pre.preserved) return false;
  const post = verifyHeadPreservesDescent(postHead, fixture, tolerance);
  return post.preserved;
}
