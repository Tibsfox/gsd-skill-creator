/**
 * Cross-document mathematical claim validation (Track B).
 * Cross-validates ecosystem claims against textbook concepts using
 * the gap classifier for consistent classification.
 */

import type { LearnedConceptRef, EcosystemClaim, GapRecord } from './types.js';
import { classifyGap } from './gap-classifier.js';

/** Result of consistency checking across documents */
export interface ConsistencyResult {
  gaps: GapRecord[];
  claimsChecked: number;
}

/**
 * Tokenize text into lowercase words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;:.!?()\[\]{}'"\/\\]+/)
    .filter(t => t.length > 1);
}

/**
 * Compute Jaccard similarity between two sets.
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
 * Find the best matching concept for a claim.
 * Returns the concept with highest keyword overlap, or undefined if no match.
 */
function findMatchingConcept(
  claim: EcosystemClaim,
  concepts: LearnedConceptRef[],
): { concept: LearnedConceptRef; similarity: number } | undefined {
  const claimTokens = new Set<string>([
    ...claim.keywords.map(k => k.toLowerCase()),
    ...tokenize(claim.claim),
    ...tokenize(claim.mathDomain),
  ]);

  let bestMatch: { concept: LearnedConceptRef; similarity: number } | undefined;

  for (const concept of concepts) {
    const conceptTokens = new Set<string>([
      ...concept.keywords.map(k => k.toLowerCase()),
      ...tokenize(concept.name),
      ...tokenize(concept.definition),
    ]);

    const similarity = jaccardSimilarity(claimTokens, conceptTokens);

    if (similarity > 0.05 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { concept, similarity };
    }
  }

  return bestMatch;
}

/**
 * Cross-validate ecosystem claims against learned concepts.
 * Every claim produces exactly one GapRecord.
 *
 * For each claim:
 * 1. Find the best matching concept by keyword/domain overlap.
 * 2. If no match: classify as missing-in-textbook.
 * 3. If match found: delegate to classifyGap for consistent classification.
 */
export function checkConsistency(
  concepts: LearnedConceptRef[],
  claims: EcosystemClaim[],
): ConsistencyResult {
  const gaps: GapRecord[] = [];

  for (const claim of claims) {
    const match = findMatchingConcept(claim, concepts);

    if (!match) {
      // No matching concept -- missing in textbook
      gaps.push(classifyGap({ claim }));
    } else {
      // Found a match -- classify the relationship
      gaps.push(
        classifyGap({
          concept: match.concept,
          claim,
          similarity: match.similarity,
        }),
      );
    }
  }

  return { gaps, claimsChecked: claims.length };
}
