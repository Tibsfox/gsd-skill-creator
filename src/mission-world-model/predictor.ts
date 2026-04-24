/**
 * Mission-state predictor — deterministic action-conditional delta.
 *
 * Forecasts next-state latent given (current latent, proposed action). This phase
 * ships a deterministic rule-based predictor; the *architecture* is the payload
 * (encoder + predictor + CEM planner), not the specific weights. A future phase
 * may learn the predictor's delta table.
 *
 * HARD CAPCOM PRESERVATION: the `MissionAction` type excludes every gate-bypass
 * variant by construction. There is no code path that reads a "bypass" action
 * and emits a latent — the typechecker rejects the input.
 *
 * @module mission-world-model/predictor
 */

import type { MissionAction, MissionLatent } from './types.js';
import { FORBIDDEN_ACTION_NAMES } from './types.js';

/**
 * Runtime guard against the (impossible-by-types) case where an action string
 * is built by string concatenation and passed in via `unknown` cast. This
 * catches the loophole the typechecker cannot: user code that inspects a
 * hostile network payload and hands the result to the predictor.
 */
export function assertNoGateBypassAction(action: unknown): asserts action is MissionAction {
  if (typeof action !== 'string') {
    throw new Error('action must be a string');
  }
  const normalized = action.toLowerCase().trim();
  for (const forbidden of FORBIDDEN_ACTION_NAMES) {
    if (normalized.includes(forbidden)) {
      throw new Error(
        `CAPCOM-PRESERVATION VIOLATION: action "${action}" matches forbidden pattern "${forbidden}". ` +
          'Mission-state world-model predictor cannot emit gate-bypass trajectories.',
      );
    }
  }
}

/** Action effect vectors — applied additively in latent space. Deterministic. */
const ACTION_EFFECTS: Record<MissionAction, ReadonlyArray<number>> = {
  'dispatch-wave': [0.05, 0.02, -0.03, 0.01, 0.04],
  'allocate-model': [0.01, 0.03, 0.00, -0.02, 0.02],
  'activate-skill': [0.02, 0.00, 0.01, 0.03, -0.01],
  'request-capcom-review': [0.00, -0.01, 0.05, 0.00, 0.00],
  'no-op': [0, 0, 0, 0, 0],
};

/** Predict next latent: latent + rotated_effect. Pure + deterministic. */
export function predictNextLatent(
  latent: MissionLatent,
  action: MissionAction,
): MissionLatent {
  assertNoGateBypassAction(action);
  const dim = latent.length;
  const effect = ACTION_EFFECTS[action];
  const out = new Array<number>(dim);
  for (let i = 0; i < dim; i++) {
    out[i] = latent[i] + effect[i % effect.length];
  }
  // Renormalize to unit length (keeps latent on the unit sphere).
  let s = 0;
  for (const x of out) s += x * x;
  const norm = Math.sqrt(s) || 1;
  for (let i = 0; i < dim; i++) out[i] /= norm;
  return out;
}

/** Roll out a fixed action sequence from a start latent. Pure + deterministic. */
export function rollout(
  start: MissionLatent,
  actions: ReadonlyArray<MissionAction>,
): MissionLatent {
  let cur: MissionLatent = start;
  for (const a of actions) cur = predictNextLatent(cur, a);
  return cur;
}
