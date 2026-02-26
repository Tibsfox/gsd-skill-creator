/**
 * Gap type and severity assignment with analysis justification.
 * Classifies each discrepancy into one of 8 gap types and assigns
 * severity with reasoning.
 */

import type { LearnedConceptRef, EcosystemClaim, GapRecord, GapSeverity } from './types.js';

/**
 * Classify a concept/claim diff into a GapRecord with type, severity, and analysis.
 */
export function classifyGap(_diff: {
  concept?: LearnedConceptRef;
  claim?: EcosystemClaim;
  similarity?: number;
  conceptKeyRelationships?: string[];
}): GapRecord {
  throw new Error('Not implemented');
}

/**
 * Assign severity to a gap record based on its properties.
 */
export function assignSeverity(_gap: Partial<GapRecord>): GapSeverity {
  throw new Error('Not implemented');
}
