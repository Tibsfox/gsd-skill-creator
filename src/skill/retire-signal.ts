/**
 * Measured retire-candidate signal (item 7).
 *
 * The down-half of the adaptive loop: "did the skill help?" answered from the
 * MEASURED per-skill activation signal (SkillIndex.activationCount, populated by
 * `activations --write` mining the transcript corpus) — NOT from a thermodynamic
 * ROI proxy. A skill is a retire candidate only when its activation was
 * genuinely MEASURED as zero over a corpus AND it is past a creation grace
 * window. Two guards keep this honest:
 *
 *   1. never-measured (activationCount undefined) is NOT the same as
 *      measured-zero. An unmeasured skill means "the activation scan hasn't run
 *      for it", not "the skill didn't help" — flagging it would be a
 *      false-positive flood, so it is never a candidate.
 *   2. a brand-new skill has not had a chance to activate, so anything inside
 *      the grace window is spared.
 *
 * Pure — no fs, no I/O. The activation count + age anchor are joined from
 * SkillIndex + the skill inventory by the caller (the `skill retire` CLI).
 *
 * @module skill/retire-signal
 */

/** The measured inputs for one skill's retire verdict. */
export interface ActivationSignal {
  /**
   * Measured activation count from SkillIndex. `undefined` means never measured
   * (the scan has not recorded this skill) — deliberately distinct from `0`
   * (measured and never activated).
   */
  activationCount?: number;
  /**
   * Age in days from the skill's freshness anchor (the `updated` frontmatter
   * date). `null`/`undefined` means unknown. NOTE: this measures days-since-last
   * -edit, not days-since-creation — a long-lived but recently edited skill
   * reads as young and is spared, which is the safe direction for a
   * suggest-only signal.
   */
  ageDays?: number | null;
}

/** Default grace window: a skill younger than this is never a retire candidate. */
export const RETIRE_GRACE_DAYS = 30;

/** The verdict for one skill. */
export interface RetireVerdict {
  isCandidate: boolean;
  /** Human-readable reason (shown in `skill retire --suggest`). */
  reason: string;
}

/**
 * Decide whether a skill is a retire candidate from its measured signal.
 *
 * @param sig        measured activation + age inputs
 * @param graceDays  grace window (default RETIRE_GRACE_DAYS)
 */
export function evaluateRetireCandidate(
  sig: ActivationSignal,
  graceDays: number = RETIRE_GRACE_DAYS,
): RetireVerdict {
  if (sig.activationCount === undefined) {
    return {
      isCandidate: false,
      reason: 'never measured — run `activations --write` before trusting this',
    };
  }
  if (sig.ageDays === undefined || sig.ageDays === null) {
    return { isCandidate: false, reason: 'age unknown (no `updated` anchor)' };
  }
  if (sig.ageDays < graceDays) {
    return { isCandidate: false, reason: `within ${graceDays}-day grace window` };
  }
  if (sig.activationCount === 0) {
    return {
      isCandidate: true,
      reason: `measured zero activations over ${Math.round(sig.ageDays)}d`,
    };
  }
  return {
    isCandidate: false,
    reason: `${sig.activationCount} measured activation(s)`,
  };
}
