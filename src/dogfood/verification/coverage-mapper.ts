/**
 * Concept-to-ecosystem search and ecosystem-to-concept reverse search.
 * Maps coverage between learned concepts and ecosystem corpus using
 * keyword matching.
 */

import type { LearnedConceptRef, EcosystemCorpus, EcosystemClaim, CoverageResult } from './types.js';

export type { CoverageResult };

/**
 * Tokenize a concept's name, definition, and keywords into lowercase tokens.
 */
function conceptTokens(concept: LearnedConceptRef): Set<string> {
  const tokens = new Set<string>();

  // Add explicit keywords (lowercased)
  for (const kw of concept.keywords) {
    tokens.add(kw.toLowerCase());
  }

  // Tokenize name
  for (const word of concept.name.toLowerCase().split(/\s+/)) {
    if (word.length > 1) tokens.add(word);
  }

  // Tokenize definition
  for (const word of concept.definition.toLowerCase().split(/[\s,;:.!?()\[\]{}'"\/\\]+/)) {
    if (word.length > 2) tokens.add(word); // slightly higher threshold for definition words
  }

  return tokens;
}

/**
 * Build a keyword-to-claims index from the corpus claims.
 * All keywords are lowercased for case-insensitive matching.
 */
function buildKeywordIndex(claims: EcosystemClaim[]): Map<string, EcosystemClaim[]> {
  const index = new Map<string, EcosystemClaim[]>();

  for (const claim of claims) {
    for (const kw of claim.keywords) {
      const lower = kw.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(claim);
      } else {
        index.set(lower, [claim]);
      }
    }
  }

  return index;
}

/**
 * Map concept coverage against ecosystem corpus.
 *
 * 1. Build keyword-to-claim index from corpus.claims.
 * 2. For each concept, find matching claims via shared keywords (case-insensitive).
 * 3. Populate conceptToEcosystem and ecosystemToConcept maps.
 * 4. Identify uncovered concepts and claims.
 */
export function mapConceptCoverage(
  concepts: LearnedConceptRef[],
  corpus: EcosystemCorpus,
): CoverageResult {
  const keywordIndex = buildKeywordIndex(corpus.claims);
  const conceptToEcosystem = new Map<string, EcosystemClaim[]>();
  const ecosystemToConcept = new Map<string, LearnedConceptRef[]>();
  const matchedClaimSet = new Set<EcosystemClaim>();

  // Initialize ecosystemToConcept with all claim keywords
  for (const claim of corpus.claims) {
    for (const kw of claim.keywords) {
      const lower = kw.toLowerCase();
      if (!ecosystemToConcept.has(lower)) {
        ecosystemToConcept.set(lower, []);
      }
    }
  }

  // For each concept, find matching claims
  for (const concept of concepts) {
    const tokens = conceptTokens(concept);
    const matchingClaims = new Set<EcosystemClaim>();

    for (const token of tokens) {
      const claims = keywordIndex.get(token);
      if (claims) {
        for (const claim of claims) {
          matchingClaims.add(claim);
        }
        // Also record the reverse mapping: this keyword -> this concept
        const existing = ecosystemToConcept.get(token);
        if (existing) {
          if (!existing.some(c => c.id === concept.id)) {
            existing.push(concept);
          }
        } else {
          ecosystemToConcept.set(token, [concept]);
        }
      }
    }

    conceptToEcosystem.set(concept.id, [...matchingClaims]);

    for (const claim of matchingClaims) {
      matchedClaimSet.add(claim);
    }
  }

  // Identify uncovered concepts (no matching claims)
  const uncoveredConcepts = concepts.filter(c => {
    const claims = conceptToEcosystem.get(c.id);
    return !claims || claims.length === 0;
  });

  // Identify uncovered claims (matched by zero concepts)
  const uncoveredClaims = corpus.claims.filter(claim => !matchedClaimSet.has(claim));

  return {
    conceptToEcosystem,
    ecosystemToConcept,
    uncoveredConcepts,
    uncoveredClaims,
  };
}

/**
 * Convenience wrapper: map ecosystem coverage against learned concepts.
 * Same logic as mapConceptCoverage with reversed emphasis.
 */
export function mapEcosystemCoverage(
  corpus: EcosystemCorpus,
  concepts: LearnedConceptRef[],
): CoverageResult {
  return mapConceptCoverage(concepts, corpus);
}
