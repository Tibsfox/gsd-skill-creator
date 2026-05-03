/**
 * Phase 825 / C12 — AI investigator library exports.
 *
 * Library code that backs the `intelligence-investigator` Claude Code skill.
 * The skill at `.claude/skills/intelligence-investigator/scripts/` runs thin
 * shims that delegate to functions exported here so the validation logic is
 * testable from vitest.
 */
export {
  verify,
  CAUSAL_HYPOTHESIS_RE,
  UNCERTAINTY_RE,
  VALID_CONFIDENCE,
  NO_PRIOR_EVIDENCE_RE,
  type Briefing,
  type SuggestedMove,
  type Violation,
} from './verify-briefing.js';
