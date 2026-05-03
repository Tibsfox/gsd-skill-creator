/**
 * verify-briefing — D-25-28 self-check for AI briefings.
 *
 * Library version of the validation logic the skill's script runs. Tests live
 * at src/intelligence/__tests__/c12-verify-briefing.test.ts and call the
 * `verify` export here directly. The skill's
 * `project-claude/skills/intelligence-investigator/scripts/verify-briefing.ts`
 * is a thin shim that imports from this module's compiled output.
 *
 * Phase 825 / C12.
 */

export interface SuggestedMove {
  rank?: number;
  title?: string;
  kind?: string;
  rationale?: string;
  expected_unblocks?: string;
  source_findings?: string[];
}

export interface Briefing {
  body?: string;
  confidence?: string;
  suggested_moves?: SuggestedMove[];
  source_findings?: string[];
}

export interface Violation {
  field: string;
  message: string;
}

export const CAUSAL_HYPOTHESIS_RE =
  /(probably|likely|because|seems to|suggests|appears to)/i;
export const UNCERTAINTY_RE =
  /(unclear|don'?t (yet )?know|unknown|whether|might|may|could)/i;
export const VALID_CONFIDENCE = new Set(['low', 'medium', 'high']);
export const NO_PRIOR_EVIDENCE_RE = /no prior evidence/i;

/**
 * Verify a candidate briefing against the D-25-28 invariants:
 *   1. Body matches causal-hypothesis pattern
 *   2. Body matches uncertainty pattern
 *   3. confidence ∈ {low, medium, high}
 *   4. Each suggested move has rationale ≥10 chars + source_findings array
 *      (empty source_findings allowed only when rationale notes "no prior evidence")
 *
 * Returns an array of violations (empty = pass).
 */
export function verify(briefing: Briefing): Violation[] {
  const violations: Violation[] = [];

  if (!briefing.body || typeof briefing.body !== 'string') {
    violations.push({ field: 'body', message: 'body is missing or not a string' });
  } else {
    if (!CAUSAL_HYPOTHESIS_RE.test(briefing.body)) {
      violations.push({
        field: 'body',
        message:
          'briefing body missing causal hypothesis pattern (probably|likely|because|seems to|suggests|appears to)',
      });
    }
    if (!UNCERTAINTY_RE.test(briefing.body)) {
      violations.push({
        field: 'body',
        message:
          "briefing body missing uncertainty pattern (unclear|don't know|unknown|whether|might|may|could)",
      });
    }
  }

  if (!briefing.confidence || !VALID_CONFIDENCE.has(briefing.confidence)) {
    violations.push({
      field: 'confidence',
      message: `confidence must be one of low|medium|high, got: ${JSON.stringify(briefing.confidence)}`,
    });
  }

  if (!Array.isArray(briefing.suggested_moves)) {
    violations.push({
      field: 'suggested_moves',
      message: 'suggested_moves must be an array',
    });
  } else {
    briefing.suggested_moves.forEach((move, idx) => {
      const path = `suggested_moves[${idx}]`;
      if (!move.rationale || move.rationale.length < 10) {
        violations.push({
          field: `${path}.rationale`,
          message: `rationale must be ≥10 chars, got ${(move.rationale ?? '').length}`,
        });
      }
      if (!Array.isArray(move.source_findings)) {
        violations.push({
          field: `${path}.source_findings`,
          message: 'source_findings must be an array',
        });
      } else if (
        move.source_findings.length === 0 &&
        !(move.rationale && NO_PRIOR_EVIDENCE_RE.test(move.rationale))
      ) {
        violations.push({
          field: `${path}.source_findings`,
          message:
            'source_findings is empty; rationale must explicitly note "no prior evidence" for forward-looking moves',
        });
      }
    });
  }

  return violations;
}
