/**
 * Copying signal detector for derived knowledge.
 *
 * Detects high textual similarity between derived content and
 * external reference texts, identifying potential verbatim
 * reproduction or near-copies.
 *
 * @module staging/derived/copying-detector
 */

import type { CopyingFinding, DerivedCheckSeverity } from './types.js';

/** Minimum length for a verbatim match to be flagged. */
const MIN_VERBATIM_LENGTH = 50;

/** Maximum length of matchedSnippet for overall similarity findings. */
const MAX_SNIPPET_LENGTH = 200;

/** Maximum length of reference text preview in sourceHint. */
const MAX_SOURCE_HINT_LENGTH = 50;

/**
 * Detect copying signals between content and reference texts.
 *
 * Checks for verbatim sequences (>=50 chars) and overall
 * sentence-level similarity. Returns findings sorted by severity.
 *
 * @param content - The derived content to check
 * @param referenceTexts - Known external sources to compare against
 * @returns Array of copying findings, empty if no issues detected
 */
export function detectCopyingSignals(
  content: string,
  referenceTexts: string[],
): CopyingFinding[] {
  if (!content || referenceTexts.length === 0) {
    return [];
  }

  const findings: CopyingFinding[] = [];

  for (let refIndex = 0; refIndex < referenceTexts.length; refIndex++) {
    const reference = referenceTexts[refIndex];
    if (!reference) continue;

    const hint = buildSourceHint(refIndex, reference);

    // Check for verbatim matches
    const verbatimMatches = findVerbatimMatches(content, reference, MIN_VERBATIM_LENGTH);
    for (const match of verbatimMatches) {
      findings.push({
        type: 'copying',
        severity: 'critical',
        message: `Verbatim reproduction of ${match.length} characters detected`,
        similarity: 1.0,
        matchedSnippet: match.text,
        sourceHint: hint,
      });
    }

    // Check overall sentence-level similarity
    const overallSim = sentenceSimilarity(content, reference);
    if (overallSim > 0.8) {
      findings.push({
        type: 'copying',
        severity: 'critical' as DerivedCheckSeverity,
        message: `Content has ${(overallSim * 100).toFixed(0)}% similarity to reference text`,
        similarity: overallSim,
        matchedSnippet: content.slice(0, MAX_SNIPPET_LENGTH),
        sourceHint: hint,
      });
    } else if (overallSim > 0.5) {
      findings.push({
        type: 'copying',
        severity: 'warning' as DerivedCheckSeverity,
        message: `Content has ${(overallSim * 100).toFixed(0)}% similarity to reference text`,
        similarity: overallSim,
        matchedSnippet: content.slice(0, MAX_SNIPPET_LENGTH),
        sourceHint: hint,
      });
    }
  }

  return findings;
}

/**
 * Find verbatim matches between content and reference using sliding window.
 *
 * Extracts all windows of minLength characters from content and checks
 * if they appear in the reference. Merges overlapping matches.
 *
 * @param content - Content to check
 * @param reference - Reference text to compare against
 * @param minLength - Minimum length for a match to be flagged
 * @returns Array of verbatim match objects
 */
function findVerbatimMatches(
  content: string,
  reference: string,
  minLength: number,
): { start: number; length: number; text: string }[] {
  if (content.length < minLength || reference.length < minLength) {
    return [];
  }

  const matches: { start: number; length: number; text: string }[] = [];

  // Sliding window: check each position in content
  for (let i = 0; i <= content.length - minLength; i++) {
    const window = content.slice(i, i + minLength);
    const refPos = reference.indexOf(window);
    if (refPos === -1) continue;

    // Extend the match as far as possible
    let endContent = i + minLength;
    let endRef = refPos + minLength;
    while (
      endContent < content.length &&
      endRef < reference.length &&
      content[endContent] === reference[endRef]
    ) {
      endContent++;
      endRef++;
    }

    const matchLength = endContent - i;
    const matchText = content.slice(i, endContent);

    // Check if this match overlaps with a previous one
    const lastMatch = matches[matches.length - 1];
    if (lastMatch && i < lastMatch.start + lastMatch.length) {
      // Overlapping: extend the previous match if this one is longer
      const newEnd = Math.max(lastMatch.start + lastMatch.length, endContent);
      lastMatch.length = newEnd - lastMatch.start;
      lastMatch.text = content.slice(lastMatch.start, newEnd);
    } else {
      matches.push({ start: i, length: matchLength, text: matchText });
    }

    // Skip ahead past this match to avoid redundant window checks
    i = endContent - minLength;
  }

  return matches;
}

/**
 * Compute sentence-level similarity between content and reference.
 *
 * Splits both texts into sentences, finds best Jaccard match for
 * each content sentence, and returns the mean of best-match scores.
 *
 * @param content - Content text
 * @param reference - Reference text
 * @returns Overall similarity score (0-1)
 */
function sentenceSimilarity(content: string, reference: string): number {
  const contentSentences = splitSentences(content);
  const referenceSentences = splitSentences(reference);

  if (contentSentences.length === 0 || referenceSentences.length === 0) {
    return 0;
  }

  let totalScore = 0;

  for (const contentSentence of contentSentences) {
    let bestScore = 0;
    for (const refSentence of referenceSentences) {
      const score = jaccardSimilarity(contentSentence, refSentence);
      if (score > bestScore) {
        bestScore = score;
      }
    }
    totalScore += bestScore;
  }

  return totalScore / contentSentences.length;
}

/**
 * Split text into sentences.
 *
 * Splits on sentence-ending punctuation followed by space, or newlines.
 * Filters out empty strings.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Compute word-level Jaccard similarity between two strings.
 *
 * Jaccard = |intersection| / |union| of word sets (lowercased).
 * Returns 0 for empty inputs.
 */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

  if (wordsA.size === 0 && wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersection++;
    }
  }

  const union = wordsA.size + wordsB.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
}

/**
 * Build a sourceHint string for a reference text.
 */
function buildSourceHint(index: number, reference: string): string {
  const preview = reference.length > MAX_SOURCE_HINT_LENGTH
    ? reference.slice(0, MAX_SOURCE_HINT_LENGTH) + '...'
    : reference;
  return `reference[${index}]: ${preview}`;
}
