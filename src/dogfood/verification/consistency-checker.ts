/**
 * Cross-document mathematical claim validation (Track B).
 * Cross-validates ecosystem claims against textbook concepts using
 * the gap classifier for consistent classification.
 */

import type { LearnedConceptRef, EcosystemClaim, GapRecord } from './types.js';

/** Result of consistency checking across documents */
export interface ConsistencyResult {
  gaps: GapRecord[];
  claimsChecked: number;
}

/**
 * Cross-validate ecosystem claims against learned concepts.
 * Every claim produces exactly one GapRecord.
 */
export function checkConsistency(
  _concepts: LearnedConceptRef[],
  _claims: EcosystemClaim[],
): ConsistencyResult {
  throw new Error('Not implemented');
}
