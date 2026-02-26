/**
 * Concept-to-ecosystem search and ecosystem-to-concept reverse search.
 * Maps coverage between learned concepts and ecosystem corpus using
 * keyword matching.
 */

import type { LearnedConceptRef, EcosystemCorpus, CoverageResult } from './types.js';

export type { CoverageResult };

/**
 * Map concept coverage against ecosystem corpus.
 * Returns bidirectional mapping plus uncovered items.
 */
export function mapConceptCoverage(
  _concepts: LearnedConceptRef[],
  _corpus: EcosystemCorpus,
): CoverageResult {
  throw new Error('Not implemented');
}

/**
 * Convenience wrapper: map ecosystem coverage against learned concepts.
 * Same logic as mapConceptCoverage with reversed emphasis.
 */
export function mapEcosystemCoverage(
  _corpus: EcosystemCorpus,
  _concepts: LearnedConceptRef[],
): CoverageResult {
  throw new Error('Not implemented');
}
