/**
 * Hint generator for skill differentiation.
 *
 * Generates specific, actionable hints for differentiating competing skills.
 * Uses term extraction to identify unique and overlapping vocabulary between
 * skill descriptions.
 */

import type { SkillPrediction } from '../types/simulation.js';

/**
 * A specific hint for differentiating a skill from competitors.
 */
export interface DifferentiationHint {
  /** Which skill this hint applies to */
  skillName: string;
  /** The actionable suggestion (specific, not generic) */
  hint: string;
  /** Specific terms to add/emphasize */
  suggestedTerms: string[];
  /** Terms that cause overlap (to avoid/contextualize) */
  overlappingTerms: string[];
}

/**
 * Common stop words to filter when analyzing terms.
 * These words don't carry meaningful differentiating information.
 */
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'need',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'and',
  'but',
  'or',
  'if',
  'this',
  'that',
  'it',
  'its',
  'use',
  'using',
]);

/**
 * Extract meaningful terms from text.
 *
 * Removes punctuation, converts to lowercase, filters stop words,
 * and returns unique terms longer than 2 characters.
 *
 * @param text - Text to extract terms from
 * @returns Array of meaningful terms
 */
function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Find terms unique to one description vs another.
 *
 * @param descA - First description
 * @param descB - Second description
 * @returns Object with uniqueToA and uniqueToB arrays
 */
function findUniqueTerms(
  descA: string,
  descB: string
): { uniqueToA: string[]; uniqueToB: string[] } {
  const termsA = new Set(extractTerms(descA));
  const termsB = new Set(extractTerms(descB));

  const uniqueToA = [...termsA].filter((t) => !termsB.has(t));
  const uniqueToB = [...termsB].filter((t) => !termsA.has(t));

  return { uniqueToA, uniqueToB };
}

/**
 * Find overlapping terms between two descriptions.
 *
 * @param descA - First description
 * @param descB - Second description
 * @returns Array of terms appearing in both descriptions
 */
function findOverlappingTerms(descA: string, descB: string): string[] {
  const termsA = new Set(extractTerms(descA));
  const termsB = extractTerms(descB);

  return termsB.filter((t) => termsA.has(t));
}

/**
 * Generate actionable differentiation hints for competing skills.
 *
 * Hints are SPECIFIC: "Add 'migrations' to git-skill to differentiate from db-skill"
 * NOT generic: "Add more specific terms"
 *
 * @param winner - The winning skill prediction
 * @param winnerDescription - Winner's skill description
 * @param challengers - Challenger predictions
 * @param skillDescriptions - Map of skill names to descriptions
 * @returns Array of differentiation hints
 *
 * @example
 * const hints = generateDifferentiationHints(
 *   winner,
 *   'Commit changes to git',
 *   challengers,
 *   skillDescMap
 * );
 * // hints[0].hint might be: 'Emphasize "commit", "repository" in description...'
 */
export function generateDifferentiationHints(
  winner: SkillPrediction,
  winnerDescription: string,
  challengers: SkillPrediction[],
  skillDescriptions: Map<string, string>
): DifferentiationHint[] {
  const hints: DifferentiationHint[] = [];

  for (const challenger of challengers) {
    const challengerDesc = skillDescriptions.get(challenger.skillName);
    if (!challengerDesc) continue;

    const { uniqueToA: uniqueToWinner, uniqueToB: uniqueToChallenger } =
      findUniqueTerms(winnerDescription, challengerDesc);
    const overlapping = findOverlappingTerms(winnerDescription, challengerDesc);

    // Generate hint for the winner (how to strengthen its identity)
    if (uniqueToWinner.length > 0) {
      const emphasis = uniqueToWinner.slice(0, 3);
      hints.push({
        skillName: winner.skillName,
        hint: `Emphasize "${emphasis.join('", "')}" in description to differentiate from "${challenger.skillName}"`,
        suggestedTerms: emphasis,
        overlappingTerms: overlapping.slice(0, 3),
      });
    }

    // Generate hint for the challenger (how it could differentiate)
    if (uniqueToChallenger.length > 0) {
      const emphasis = uniqueToChallenger.slice(0, 3);
      hints.push({
        skillName: challenger.skillName,
        hint: `Add "${emphasis.join('", "')}" to differentiate from "${winner.skillName}"`,
        suggestedTerms: emphasis,
        overlappingTerms: overlapping.slice(0, 3),
      });
    } else if (overlapping.length > 0) {
      // Both skills have same terms - suggest contextual differentiation
      hints.push({
        skillName: challenger.skillName,
        hint: `Add context for when to use this skill vs "${winner.skillName}" (both involve: ${overlapping.slice(0, 3).join(', ')})`,
        suggestedTerms: [],
        overlappingTerms: overlapping.slice(0, 3),
      });
    }
  }

  return hints;
}

/**
 * Format hints as human-readable bullet points.
 *
 * @param hints - Array of differentiation hints
 * @returns Formatted string with one hint per line
 *
 * @example
 * formatHints(hints)
 * // "- git-commit: Emphasize \"commit\" in description..."
 */
export function formatHints(hints: DifferentiationHint[]): string {
  if (hints.length === 0) {
    return 'No differentiation suggestions available.';
  }

  return hints.map((h) => `- ${h.skillName}: ${h.hint}`).join('\n');
}
