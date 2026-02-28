// === Plane Classifier ===
//
// Maps natural language problem descriptions to Complex Plane positions
// with domain activation signals. Entry point for the MFE navigation pipeline.
//
// Algorithm: tokenize -> extract keywords -> score each domain's activation
// patterns -> compute weighted centroid position -> return ranked activations.
//
// Domain definitions loaded from data/domain-index.json at module init.

import { createRequire } from 'node:module';
import type { PlanePosition, DomainId, DomainDefinition } from '../../core/types/mfe-types.js';

// === Public types ===

export interface DomainActivation {
  domainId: DomainId;
  score: number;              // 0.0-1.0, relevance to this domain
  matchedPatterns: string[];  // Which activation patterns matched
}

export interface PlaneClassification {
  position: PlanePosition;              // Where on the Complex Plane
  activatedDomains: DomainActivation[]; // Domains, ranked by score (descending)
  confidence: number;                   // 0.0-1.0, overall classification confidence
  keywords: string[];                   // Extracted keywords from input
}

// === Domain index loading ===

const require = createRequire(import.meta.url);
const domainIndex: { domains: DomainDefinition[] } = require('../../../data/domain-index.json');

// === Stop words ===

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'this', 'that', 'these', 'those', 'it', 'its',
  'of', 'for', 'in', 'to', 'on', 'at', 'by', 'from', 'with', 'as',
  'and', 'or', 'but', 'not', 'nor', 'so', 'yet',
  'if', 'then', 'than', 'when', 'where', 'how', 'what', 'which', 'who',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any',
  'no', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'about',
  'very', 'just', 'also', 'too', 'only', 'own', 'same',
]);

// === Activation threshold ===

const ACTIVATION_THRESHOLD = 0.1;

// === Tokenization ===

/**
 * Tokenize input: lowercase, split on whitespace/punctuation, remove stop words
 * and tokens shorter than 2 characters.
 */
function tokenize(input: string): string[] {
  if (!input || !input.trim()) return [];

  return input
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"']+/)
    .map(t => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')) // strip leading/trailing non-alphanum
    .filter(t => t.length >= 2)
    .filter(t => !STOP_WORDS.has(t));
}

/**
 * Extract unique keywords from tokens.
 */
function extractKeywords(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

// === Domain scoring ===

/**
 * Score a single domain against the extracted keywords and original input phrase.
 *
 * For each activation pattern:
 * - Multi-word pattern: check if the full phrase appears in the lowercased input
 * - Single-word pattern: check if any keyword contains the pattern as a substring,
 *   or the pattern contains a keyword as a substring
 *
 * Score = matchedPatterns / totalPatterns, boosted by match quality.
 */
function scoreDomain(
  keywords: string[],
  inputLower: string,
  domain: DomainDefinition,
): DomainActivation {
  const matchedPatterns: string[] = [];
  const patterns = domain.activationPatterns;

  for (const pattern of patterns) {
    const patternLower = pattern.toLowerCase();
    const isMultiWord = patternLower.includes(' ');

    if (isMultiWord) {
      // Multi-word pattern: check phrase in original input
      if (inputLower.includes(patternLower)) {
        matchedPatterns.push(pattern);
      }
    } else {
      // Single-word pattern: check keyword substring matching
      const matched = keywords.some(kw =>
        kw.includes(patternLower) || patternLower.includes(kw)
      );
      if (matched) {
        matchedPatterns.push(pattern);
      }
    }
  }

  const totalPatterns = patterns.length;
  const matchCount = matchedPatterns.length;

  // Score: sqrt-scaled match fraction (rewards even small matches meaningfully)
  // plus a per-match bonus. A single match out of 9 patterns gives ~0.33 base,
  // two matches give ~0.47 base, rising with diminishing returns.
  const rawScore = totalPatterns > 0
    ? Math.sqrt(matchCount / totalPatterns) * (1 + 0.15 * matchCount)
    : 0;

  // Clamp to [0, 1]
  const score = Math.min(1.0, rawScore);

  return {
    domainId: domain.id as DomainId,
    score,
    matchedPatterns,
  };
}

// === Plane position calculation ===

/**
 * Compute the weighted centroid of activated domain centers.
 * If no domains activated, returns origin (0, 0).
 * Clamped to [-1.0, 1.0] on both axes.
 */
function calculatePosition(
  activations: DomainActivation[],
): PlanePosition {
  if (activations.length === 0) {
    return { real: 0.0, imaginary: 0.0 };
  }

  let sumReal = 0;
  let sumImag = 0;
  let sumScores = 0;

  for (const activation of activations) {
    const domain = domainIndex.domains.find(d => d.id === activation.domainId);
    if (!domain) continue;

    sumReal += domain.planeRegion.center.real * activation.score;
    sumImag += domain.planeRegion.center.imaginary * activation.score;
    sumScores += activation.score;
  }

  if (sumScores === 0) {
    return { real: 0.0, imaginary: 0.0 };
  }

  return {
    real: Math.max(-1.0, Math.min(1.0, sumReal / sumScores)),
    imaginary: Math.max(-1.0, Math.min(1.0, sumImag / sumScores)),
  };
}

// === Confidence calculation ===

/**
 * Confidence based on top domain score and activation breadth.
 * confidence = min(1.0, topDomainScore * (1 + 0.1 * activatedDomainCount))
 */
function calculateConfidence(activations: DomainActivation[]): number {
  if (activations.length === 0) return 0.0;

  const topScore = activations[0].score; // activations are sorted descending
  const count = activations.length;

  return Math.min(1.0, topScore * (1 + 0.1 * count));
}

// === Main classifier ===

/**
 * Classify a natural language problem description to a Complex Plane position
 * with domain activation signals.
 *
 * @param input - Natural language problem description
 * @returns PlaneClassification with position, activated domains, confidence, keywords
 */
export function classifyProblem(input: string): PlaneClassification {
  const inputLower = (input || '').toLowerCase();
  const tokens = tokenize(input);
  const keywords = extractKeywords(tokens);

  // Score each domain
  const allActivations: DomainActivation[] = domainIndex.domains
    .map(domain => scoreDomain(keywords, inputLower, domain))
    .filter(a => a.score > ACTIVATION_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  // Calculate plane position from activated domains
  const position = calculatePosition(allActivations);

  // Calculate overall confidence
  const confidence = calculateConfidence(allActivations);

  return {
    position,
    activatedDomains: allActivations,
    confidence,
    keywords,
  };
}
