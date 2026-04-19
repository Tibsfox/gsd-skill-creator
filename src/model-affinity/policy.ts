/**
 * ME-2 Per-Skill Model Affinity — Escalation policy (pure functions).
 *
 * Operationalises Zhang 2026 §5 "The Dominant Factor Is Model, Not Prompt":
 *   1. Skills with declared `model_affinity` receive a penalty when the
 *      current session model is NOT in the reliable list.
 *   2. The escalation *prompt* fires ONLY when `tractabilityClass === 'tractable'`
 *      (CF-ME2-02): coin-flip skills are coin-flip on any model per Zhang §5,
 *      so escalating the model does not recover the lost signal.
 *   3. Skills without `model_affinity` incur zero penalty (CF-ME2-03).
 *   4. `pickNextTierUp` selects the cheapest reliable model above the current
 *      session model (CF-ME2-04).
 *
 * All functions are pure — no I/O, no side effects.
 *
 * @module model-affinity/policy
 */

import type { ModelFamily, ModelAffinity } from './schema.js';
import { pickNextTierUp } from './schema.js';
import type { TractabilityClass } from '../output-structure/schema.js';

// ---------------------------------------------------------------------------
// AffinityDecision type
// ---------------------------------------------------------------------------

/**
 * The outcome of evaluating model affinity for a single skill + session pair.
 *
 * `ok` — true when the session model is in the reliable list (or no affinity
 *   declared), false when there is a mismatch.
 * `penalty` — additive score penalty [0, 1]; 0 = no penalty.
 * `suggestion` — optional escalation suggestion (only present when
 *   `shouldEscalate === true`).
 */
export interface AffinityDecision {
  /** Whether the skill–model pairing is considered reliable. */
  ok: boolean;
  /** Score penalty in [0, 1]. Zero when skill has no affinity or is reliable. */
  penalty: number;
  /** Whether to surface an escalation proposal to the developer. */
  shouldEscalate: boolean;
  /** The cheapest reliable model above the current session model, if any. */
  escalateTo?: ModelFamily;
  /** Human-readable reason for the decision (absent when ok===true). */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Core policy function
// ---------------------------------------------------------------------------

/**
 * Evaluate model affinity for a skill against the current session model.
 *
 * Three-path logic (per ME-2 proposal spec §Mechanism):
 *
 * | Affinity state         | Penalty | Escalate?                          |
 * |------------------------|---------|------------------------------------|
 * | No affinity declared   | 0       | never                              |
 * | Session in reliable[]  | 0       | never                              |
 * | Session in unreliable[]| 0.5 (tractable) / 0.1 (coin-flip) | tractable only |
 * | Not mentioned either   | 0.2     | never (unknown → neutral default)  |
 *
 * **Tractability gate on escalation (CF-ME2-02):** penalty applies regardless of
 * tractability; escalation prompt fires only when `tractabilityClass === 'tractable'`.
 *
 * @param affinity - The skill's resolved model affinity (null = not declared).
 * @param sessionModel - The current session's model family.
 * @param tractabilityClass - ME-1 classification for the skill.
 * @returns `AffinityDecision` with `ok`, `penalty`, `shouldEscalate`, etc.
 */
export function evaluateMatch(
  affinity: ModelAffinity | null,
  sessionModel: ModelFamily,
  tractabilityClass: TractabilityClass,
): AffinityDecision {
  // No affinity declared → zero penalty, no escalation (CF-ME2-03)
  if (!affinity) {
    return { ok: true, penalty: 0, shouldEscalate: false };
  }

  // Session model is in the reliable list → fully aligned, no penalty
  if (affinity.reliable.includes(sessionModel)) {
    return { ok: true, penalty: 0, shouldEscalate: false };
  }

  const isTractable = tractabilityClass === 'tractable';

  // Session model is explicitly unreliable
  if (affinity.unreliable?.includes(sessionModel)) {
    const shouldEscalate = isTractable;
    const escalateTo = shouldEscalate
      ? pickNextTierUp(sessionModel, affinity.reliable)
      : undefined;
    const penalty = isTractable ? 0.5 : 0.1;

    const reason = shouldEscalate
      ? `Skill reliable on [${affinity.reliable.join(', ')}]; ` +
        `current session model "${sessionModel}" is explicitly unreliable.` +
        (escalateTo ? ` Suggest escalating to "${escalateTo}".` : ' No higher reliable tier available.')
      : `Skill unreliable on "${sessionModel}" (coin-flip — escalation would not recover signal per Zhang 2026 §5).`;

    return { ok: false, penalty, shouldEscalate, escalateTo, reason };
  }

  // Not mentioned in either list → mild penalty, no escalation (neutral default)
  // (The skill makes no claim about this model family.)
  return {
    ok: false,
    penalty: 0.2,
    shouldEscalate: false,
    reason: `Session model "${sessionModel}" not in skill's reliable list ` +
      `[${affinity.reliable.join(', ')}] and not explicitly unreliable. ` +
      `Applying neutral penalty (0.2).`,
  };
}

// ---------------------------------------------------------------------------
// Escalation rate-limiter helper
// ---------------------------------------------------------------------------

/**
 * Track which (skillId, sessionId) pairs have already received an escalation
 * suggestion this session, to avoid spamming.  Per the failure-mode mitigation
 * in the proposal: "at most 1 escalation prompt per skill per session".
 *
 * This is a pure in-memory counter; reset between sessions by constructing a
 * new instance.  The CLI and API create their own instances per invocation.
 */
export class EscalationRateLimiter {
  private readonly _seen = new Set<string>();

  /**
   * Return `true` if an escalation for `skillId` should be suppressed because
   * one was already surfaced this session.  Registers the escalation on first
   * call per skillId.
   */
  shouldSuppress(skillId: string): boolean {
    const key = skillId;
    if (this._seen.has(key)) return true;
    this._seen.add(key);
    return false;
  }

  /** Number of unique skills that have been escalated this session. */
  get count(): number {
    return this._seen.size;
  }
}
