// === Semantic Comparator ===
//
// Deep semantic comparison for the deduplication pipeline. Classifies each
// candidate-existing pair as one of five classes:
//   exact-duplicate | generalization | specialization | overlapping-distinct | genuinely-new
//
// Consumes pre-filter matches (348-01) and produces classification results
// that drive the merge engine (348-03).

import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { PrefilterMatch } from './dedup-prefilter.js';

// === Exported Types ===

export type SemanticClassification =
  | 'exact-duplicate'
  | 'generalization'
  | 'specialization'
  | 'overlapping-distinct'
  | 'genuinely-new';

export interface ComparisonDetail {
  existingId: string;
  classification: SemanticClassification;
  confidence: number;                    // 0.0-1.0
  formalStatementSimilarity: number;     // 0.0-1.0
  computationalFormSimilarity: number;   // 0.0-1.0
  keywordOverlap: number;               // 0.0-1.0
  rationale: string;
}

export interface SemanticComparisonResult {
  candidateId: string;
  comparisons: ComparisonDetail[];
  bestMatch: ComparisonDetail | null;    // Highest confidence non-genuinely-new, or null
}

// === Helpers ===

/**
 * Normalize text for comparison: lowercase, collapse whitespace, trim.
 */
function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Tokenize a normalized string into words.
 */
function tokenize(s: string): string[] {
  return normalizeText(s).split(' ').filter(w => w.length > 0);
}

/**
 * Jaccard similarity of two token sets: |intersection| / |union|.
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1.0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  if (union === 0) return 1.0;
  return intersection / union;
}

/**
 * Compute Jaccard similarity between two text fields after normalization and tokenization.
 */
function computeStatementSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}

/**
 * Compute keyword overlap as Jaccard similarity (case-insensitive).
 */
function computeKeywordOverlap(a: string[], b: string[]): number {
  const normalA = a.map(k => k.toLowerCase());
  const normalB = b.map(k => k.toLowerCase());
  return jaccardSimilarity(normalA, normalB);
}

/**
 * Compute applicability pattern overlap with subset/superset detection.
 */
function computePatternOverlap(candidatePatterns: string[], existingPatterns: string[]): {
  overlap: number;
  candidateIsSuperset: boolean;
  candidateIsSubset: boolean;
} {
  const normalCandidate = new Set(candidatePatterns.map(p => normalizeText(p)));
  const normalExisting = new Set(existingPatterns.map(p => normalizeText(p)));

  if (normalCandidate.size === 0 && normalExisting.size === 0) {
    return { overlap: 1.0, candidateIsSuperset: true, candidateIsSubset: true };
  }

  let intersection = 0;
  for (const p of normalCandidate) {
    if (normalExisting.has(p)) intersection++;
  }
  const union = normalCandidate.size + normalExisting.size - intersection;
  const overlap = union === 0 ? 1.0 : intersection / union;

  // candidateIsSuperset: all existing patterns appear in candidate
  let candidateIsSuperset = true;
  for (const p of normalExisting) {
    if (!normalCandidate.has(p)) {
      candidateIsSuperset = false;
      break;
    }
  }

  // candidateIsSubset: all candidate patterns appear in existing
  let candidateIsSubset = true;
  for (const p of normalCandidate) {
    if (!normalExisting.has(p)) {
      candidateIsSubset = false;
      break;
    }
  }

  return { overlap, candidateIsSuperset, candidateIsSubset };
}

/**
 * Classify a single candidate-existing pair.
 */
function classifyPair(
  candidate: MathematicalPrimitive,
  existing: MathematicalPrimitive,
): ComparisonDetail {
  const formalStatementSimilarity = computeStatementSimilarity(
    candidate.formalStatement,
    existing.formalStatement,
  );
  const computationalFormSimilarity = computeStatementSimilarity(
    candidate.computationalForm,
    existing.computationalForm,
  );
  const keywordOverlap = computeKeywordOverlap(candidate.keywords, existing.keywords);
  const patternInfo = computePatternOverlap(
    candidate.applicabilityPatterns,
    existing.applicabilityPatterns,
  );

  // Classification logic (checked in priority order)

  // 1. Exact duplicate: both formal statement and computational form are highly similar
  if (formalStatementSimilarity >= 0.85 && computationalFormSimilarity >= 0.85) {
    const confidence = (formalStatementSimilarity + computationalFormSimilarity + keywordOverlap + patternInfo.overlap) / 4;
    return {
      existingId: existing.id,
      classification: 'exact-duplicate',
      confidence: Math.min(1.0, confidence),
      formalStatementSimilarity,
      computationalFormSimilarity,
      keywordOverlap,
      rationale: `Formal statement similarity ${(formalStatementSimilarity * 100).toFixed(0)}% and computational form similarity ${(computationalFormSimilarity * 100).toFixed(0)}% both exceed 85% threshold — exact duplicate.`,
    };
  }

  // 2. Generalization: candidate subsumes existing (broader scope, weaker conditions)
  //    Signals: fewer-or-equal prerequisites AND broader coverage (superset patterns or more keywords)
  const candidateNotStricter = candidate.prerequisites.length <= existing.prerequisites.length;
  const candidateHasMoreKeywords = candidate.keywords.length > existing.keywords.length;
  const candidateBroader =
    (patternInfo.candidateIsSuperset && !patternInfo.candidateIsSubset) ||
    (keywordOverlap >= 0.6 && candidateHasMoreKeywords);

  if (candidateNotStricter && candidateBroader) {
    const confidence = 0.6 + 0.4 * keywordOverlap;
    return {
      existingId: existing.id,
      classification: 'generalization',
      confidence: Math.min(1.0, confidence),
      formalStatementSimilarity,
      computationalFormSimilarity,
      keywordOverlap,
      rationale: `Candidate has fewer/equal prerequisites (${candidate.prerequisites.length} vs ${existing.prerequisites.length}) and ${patternInfo.candidateIsSuperset ? 'covers all existing applicability patterns plus more' : 'has broader keyword coverage'} — generalization.`,
    };
  }

  // 3. Specialization: candidate is a special case of existing (narrower scope, stronger conditions)
  //    Signals: more-or-equal prerequisites AND narrower coverage (subset patterns or fewer keywords)
  const candidateHasMorePrereqs = candidate.prerequisites.length > existing.prerequisites.length;
  const existingHasMoreKeywords = existing.keywords.length > candidate.keywords.length;
  const candidateNarrower =
    (patternInfo.candidateIsSubset && !patternInfo.candidateIsSuperset) ||
    (keywordOverlap >= 0.6 && existingHasMoreKeywords);

  if (
    (candidateHasMorePrereqs || candidateNarrower) &&
    candidateNarrower
  ) {
    const confidence = 0.6 + 0.4 * formalStatementSimilarity;
    return {
      existingId: existing.id,
      classification: 'specialization',
      confidence: Math.min(1.0, confidence),
      formalStatementSimilarity,
      computationalFormSimilarity,
      keywordOverlap,
      rationale: `Candidate has stricter prerequisites (${candidate.prerequisites.length} vs ${existing.prerequisites.length}) and ${patternInfo.candidateIsSubset ? 'is a strict subset of existing applicability patterns' : 'has narrower keyword scope'} — specialization.`,
    };
  }

  // 4. Overlapping-distinct: some similarity but doesn't meet exact/gen/spec thresholds
  if (formalStatementSimilarity >= 0.15 || keywordOverlap >= 0.2) {
    const confidence = Math.max(formalStatementSimilarity, keywordOverlap);
    return {
      existingId: existing.id,
      classification: 'overlapping-distinct',
      confidence: Math.min(1.0, confidence),
      formalStatementSimilarity,
      computationalFormSimilarity,
      keywordOverlap,
      rationale: `Partial overlap detected (formal statement ${(formalStatementSimilarity * 100).toFixed(0)}%, keywords ${(keywordOverlap * 100).toFixed(0)}%) but insufficient for exact/generalization/specialization — overlapping but distinct concepts.`,
    };
  }

  // 5. Genuinely-new: no significant overlap
  // Confidence represents how much duplication evidence exists (low = truly new)
  const maxSim = Math.max(formalStatementSimilarity, keywordOverlap, computationalFormSimilarity);
  const confidence = maxSim;
  return {
    existingId: existing.id,
    classification: 'genuinely-new',
    confidence: Math.min(1.0, confidence),
    formalStatementSimilarity,
    computationalFormSimilarity,
    keywordOverlap,
    rationale: `No significant semantic overlap detected (max similarity ${(maxSim * 100).toFixed(0)}%) — genuinely new concept.`,
  };
}

// === Main Function ===

/**
 * Compare a candidate primitive against existing primitives identified by the
 * pre-filter. Returns classification, confidence, and similarity details for
 * each pre-filter match.
 */
export function compareSemantically(
  candidate: MathematicalPrimitive,
  existingPrimitives: MathematicalPrimitive[],
  prefilterMatches: PrefilterMatch[],
): SemanticComparisonResult {
  // Build lookup map for existing primitives
  const existingMap = new Map<string, MathematicalPrimitive>();
  for (const p of existingPrimitives) {
    existingMap.set(p.id, p);
  }

  const comparisons: ComparisonDetail[] = [];

  for (const match of prefilterMatches) {
    const existing = existingMap.get(match.existingId);
    if (!existing) continue;

    comparisons.push(classifyPair(candidate, existing));
  }

  // Find best match: highest confidence among non-genuinely-new classifications
  let bestMatch: ComparisonDetail | null = null;
  for (const comp of comparisons) {
    if (comp.classification !== 'genuinely-new') {
      if (!bestMatch || comp.confidence > bestMatch.confidence) {
        bestMatch = comp;
      }
    }
  }

  return {
    candidateId: candidate.id,
    comparisons,
    bestMatch,
  };
}
