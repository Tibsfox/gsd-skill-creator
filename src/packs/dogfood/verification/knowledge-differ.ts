/**
 * Bidirectional diff between learned concepts and ecosystem claims.
 * Uses Jaccard similarity on keyword sets to match concepts to claims.
 */

import type { LearnedConceptRef, EcosystemClaim, DiffResult } from './types.js';

export type { DiffResult };

/** Minimum Jaccard similarity threshold for a concept-claim match */
const MATCH_THRESHOLD = 0.15;

/**
 * Tokenize a string into lowercase keyword tokens.
 * Splits on whitespace and non-alphanumeric characters.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,;:.!?()\[\]{}'"\/\\]+/)
      .filter(t => t.length > 1),
  );
}

/**
 * Compute Jaccard similarity between two sets: |A intersect B| / |A union B|.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Build keyword set for a concept from its name, definition, and explicit keywords.
 */
function conceptKeywords(concept: LearnedConceptRef): Set<string> {
  const tokens = new Set<string>();
  for (const t of tokenize(concept.name)) tokens.add(t);
  for (const t of tokenize(concept.definition)) tokens.add(t);
  for (const kw of concept.keywords) {
    for (const t of tokenize(kw)) tokens.add(t);
  }
  return tokens;
}

/**
 * Build keyword set for a claim from its claim text and explicit keywords.
 */
function claimKeywords(claim: EcosystemClaim): Set<string> {
  const tokens = new Set<string>();
  for (const t of tokenize(claim.claim)) tokens.add(t);
  for (const kw of claim.keywords) {
    for (const t of tokenize(kw)) tokens.add(t);
  }
  return tokens;
}

/**
 * Diff learned concepts against ecosystem claims, producing matched pairs
 * with similarity scores, plus unmatched concepts and claims.
 *
 * Matching strategy:
 * 1. Compute Jaccard similarity for every concept-claim pair.
 * 2. For each concept, select the highest-similarity claim per document.
 * 3. Concepts with no match above threshold go to unmatchedConcepts.
 * 4. Claims never matched by any concept go to unmatchedClaims.
 */
export function diffKnowledge(
  concepts: LearnedConceptRef[],
  claims: EcosystemClaim[],
): DiffResult {
  if (concepts.length === 0) {
    return { matched: [], unmatchedConcepts: [], unmatchedClaims: [...claims] };
  }
  if (claims.length === 0) {
    return { matched: [], unmatchedConcepts: [...concepts], unmatchedClaims: [] };
  }

  // Pre-compute keyword sets for all claims
  const claimKeywordSets = claims.map(c => claimKeywords(c));

  const matched: DiffResult['matched'] = [];
  const matchedClaimIndices = new Set<number>();
  const unmatchedConcepts: LearnedConceptRef[] = [];

  for (const concept of concepts) {
    const cKeywords = conceptKeywords(concept);

    // Compute similarity for each claim
    const similarities: Array<{ index: number; claim: EcosystemClaim; similarity: number }> = [];
    for (let i = 0; i < claims.length; i++) {
      const sim = jaccardSimilarity(cKeywords, claimKeywordSets[i]);
      if (sim > MATCH_THRESHOLD) {
        similarities.push({ index: i, claim: claims[i], similarity: sim });
      }
    }

    if (similarities.length === 0) {
      unmatchedConcepts.push(concept);
      continue;
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Select highest-similarity claim per document (no double-matching within a document)
    const seenDocuments = new Set<string>();
    let hasMatch = false;

    for (const entry of similarities) {
      if (seenDocuments.has(entry.claim.document)) continue;
      seenDocuments.add(entry.claim.document);

      matched.push({
        concept,
        claim: entry.claim,
        similarity: entry.similarity,
      });
      matchedClaimIndices.add(entry.index);
      hasMatch = true;
    }

    if (!hasMatch) {
      unmatchedConcepts.push(concept);
    }
  }

  // Claims not matched by any concept
  const unmatchedClaims = claims.filter((_, i) => !matchedClaimIndices.has(i));

  return { matched, unmatchedConcepts, unmatchedClaims };
}
