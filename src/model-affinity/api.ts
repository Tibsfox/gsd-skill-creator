/**
 * ME-2 Per-Skill Model Affinity — Read API for M5 selector.
 *
 * The M5 selector calls `getAffinityDecision()` to obtain an `AffinityDecision`
 * for each candidate.  M5 uses the result to:
 *   - Apply `decision.penalty` to the candidate's composite score.
 *   - Surface `decision.escalateTo` as an informational suggestion when
 *     `decision.shouldEscalate === true`.
 *
 * M5 DOES NOT auto-act on the suggestion; it is purely informational.
 * The developer (via CLI) or the operator (via automation) decides.
 *
 * **Flag-off guarantee (CF-ME2-01 / SC-ME2-01):** when
 * `gsd-skill-creator.model_affinity.enabled = false` (the default), this
 * function returns `null` for every call, and M5 applies zero penalty —
 * byte-identical to the pre-ME2 scoring pipeline.
 *
 * @module model-affinity/api
 */

import { resolveModelAffinity } from './frontmatter.js';
import { evaluateMatch, type AffinityDecision } from './policy.js';
import type { ModelFamily } from './schema.js';
import type { TractabilityClass } from '../output-structure/schema.js';

// ---------------------------------------------------------------------------
// Re-export key types for M5 selector convenience
// ---------------------------------------------------------------------------

export type { AffinityDecision } from './policy.js';
export type { ModelFamily } from './schema.js';

// ---------------------------------------------------------------------------
// Primary read API
// ---------------------------------------------------------------------------

/**
 * Compute the affinity decision for a single candidate skill.
 *
 * @param rawModelAffinity - Raw YAML-parsed value of the skill's
 *   `model_affinity:` frontmatter block.  Pass `undefined` or `null` when
 *   the field is absent.
 * @param sessionModel - The model family of the current session.
 * @param tractabilityClass - ME-1 classification (from `getTractabilityClass`).
 * @param featureEnabled - Whether the ME-2 feature flag is on.  When `false`,
 *   returns `null` (CF-ME2-01 byte-identical path).
 *
 * @returns `AffinityDecision` when feature is enabled; `null` when flag is off.
 */
export function getAffinityDecision(
  rawModelAffinity: unknown,
  sessionModel: ModelFamily,
  tractabilityClass: TractabilityClass,
  featureEnabled: boolean,
): AffinityDecision | null {
  // Flag-off path: return null → caller applies zero penalty (CF-ME2-01)
  if (!featureEnabled) return null;

  const resolved = resolveModelAffinity(rawModelAffinity);
  return evaluateMatch(resolved.affinity, sessionModel, tractabilityClass);
}

// ---------------------------------------------------------------------------
// Batch API (for M5 candidate pool pre-classification)
// ---------------------------------------------------------------------------

export interface CandidateAffinityInput {
  /** Candidate skill id (for keying the result map). */
  id: string;
  /** Raw YAML value of `model_affinity:` from the candidate's frontmatter. */
  rawModelAffinity: unknown;
  /** ME-1 tractability class for the candidate. */
  tractabilityClass: TractabilityClass;
}

/**
 * Evaluate affinity for a full candidate pool in one pass.
 *
 * Returns a `Map<id, AffinityDecision | null>`.  When `featureEnabled` is
 * `false`, every entry is `null` (CF-ME2-01 byte-identical scoring).
 *
 * @param candidates - Candidate descriptors.
 * @param sessionModel - The current session model family.
 * @param featureEnabled - Master feature flag.
 */
export function batchAffinityDecisions(
  candidates: readonly CandidateAffinityInput[],
  sessionModel: ModelFamily,
  featureEnabled: boolean,
): Map<string, AffinityDecision | null> {
  const result = new Map<string, AffinityDecision | null>();
  for (const cand of candidates) {
    result.set(
      cand.id,
      getAffinityDecision(
        cand.rawModelAffinity,
        sessionModel,
        cand.tractabilityClass,
        featureEnabled,
      ),
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// Escalation summary (for CLI / operator reporting)
// ---------------------------------------------------------------------------

export interface EscalationSummary {
  /** Candidates that should receive an escalation suggestion. */
  escalations: Array<{
    id: string;
    escalateTo: ModelFamily;
    reason: string;
  }>;
  /** Candidates with affinity penalty but no escalation. */
  penalised: Array<{ id: string; penalty: number; reason?: string }>;
}

/**
 * Summarise escalation proposals across a batch of decisions.
 * Useful for the CLI `--audit` output.
 */
export function summariseEscalations(
  decisions: Map<string, AffinityDecision | null>,
): EscalationSummary {
  const escalations: EscalationSummary['escalations'] = [];
  const penalised: EscalationSummary['penalised'] = [];

  for (const [id, decision] of decisions) {
    if (!decision) continue;
    if (decision.shouldEscalate && decision.escalateTo) {
      escalations.push({
        id,
        escalateTo: decision.escalateTo,
        reason: decision.reason ?? '',
      });
    } else if (decision.penalty > 0) {
      penalised.push({ id, penalty: decision.penalty, reason: decision.reason });
    }
  }

  return { escalations, penalised };
}
