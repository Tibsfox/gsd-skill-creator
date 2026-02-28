/**
 * Prerequisite validator for knowledge packs.
 *
 * Checks whether a learner's completed packs satisfy the entry requirements
 * for a target pack. Distinguishes between hard prerequisites (blocking) and
 * recommended prior knowledge (advisory).
 *
 * Operates on in-memory data -- no filesystem I/O.
 */

import type { KnowledgePack } from './types.js';

// ============================================================================
// PrerequisiteResult
// ============================================================================

/**
 * Result of validating prerequisites for a target pack.
 *
 * - `satisfied`: true if all hard prerequisites are met
 * - `missing`: hard prerequisites not yet completed
 * - `advisory`: recommended prior knowledge not yet completed (non-blocking)
 */
export interface PrerequisiteResult {
  satisfied: boolean;
  missing: string[];
  advisory: string[];
}

// ============================================================================
// validatePrerequisites
// ============================================================================

/**
 * Validate whether a learner can enter a target knowledge pack.
 *
 * Checks the target pack's `dependencies` and `prerequisite_packs` fields
 * against the learner's completed pack IDs. Missing entries block access.
 *
 * The `recommended_prior_knowledge` field is advisory only -- not completing
 * these does not block access but is surfaced in the result.
 *
 * @param target - The pack the learner wants to enter
 * @param completedPackIds - IDs of packs the learner has completed
 * @param _allPacks - All available packs (reserved for future transitive checks)
 * @returns PrerequisiteResult indicating satisfaction, missing, and advisory items
 */
export function validatePrerequisites(
  target: KnowledgePack,
  completedPackIds: string[],
  _allPacks: KnowledgePack[] = [],
): PrerequisiteResult {
  const completedSet = new Set(completedPackIds);

  // Hard prerequisites: union of dependencies and prerequisite_packs (deduped)
  const required = [...new Set([...target.dependencies, ...target.prerequisite_packs])];
  const missing = required.filter((id) => !completedSet.has(id));

  // Advisory: recommended prior knowledge not completed
  const advisory = (target.recommended_prior_knowledge ?? []).filter(
    (id) => !completedSet.has(id),
  );

  return {
    satisfied: missing.length === 0,
    missing,
    advisory,
  };
}
