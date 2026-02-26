/**
 * Bidirectional diff between learned concepts and ecosystem claims.
 * Uses Jaccard similarity on keyword sets to match concepts to claims.
 */

import type { LearnedConceptRef, EcosystemClaim, DiffResult } from './types.js';

export type { DiffResult };

/**
 * Diff learned concepts against ecosystem claims, producing matched pairs
 * with similarity scores, plus unmatched concepts and claims.
 */
export function diffKnowledge(
  _concepts: LearnedConceptRef[],
  _claims: EcosystemClaim[],
): DiffResult {
  throw new Error('Not implemented');
}
