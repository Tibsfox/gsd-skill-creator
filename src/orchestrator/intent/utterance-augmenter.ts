/**
 * Utterance augmenter for Bayes classifier training data generation.
 *
 * Generates 3-8 training phrases per command from GsdCommandMetadata
 * without hardcoded command knowledge. All utterances are derived from:
 * - description (always present)
 * - objective (if non-empty)
 * - command name (verb-noun patterns)
 * - synonym variations of key verbs
 */

import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Synonym Map
// ============================================================================

/**
 * Verb synonym mappings for generating training variations.
 * Maps source verbs to 1-2 alternatives.
 */
const VERB_SYNONYMS: Record<string, string[]> = {
  create: ['make', 'build'],
  execute: ['run', 'build'],
  verify: ['check', 'validate'],
  show: ['display', 'list'],
  add: ['create', 'new'],
  remove: ['delete', 'drop'],
  plan: ['prepare', 'outline'],
  debug: ['fix', 'troubleshoot'],
  start: ['begin', 'launch'],
  update: ['modify', 'change'],
};

// ============================================================================
// Utterance Generation
// ============================================================================

/**
 * Generate training utterances from command metadata for Bayes classifier.
 *
 * Produces 3-8 diverse phrases per command, all lowercase and trimmed.
 * No hardcoded command names -- all derived from metadata fields.
 *
 * @param command - GSD command metadata to generate utterances from
 * @returns Array of 3-8 lowercase trimmed utterance strings
 */
export function augmentUtterances(command: GsdCommandMetadata): string[] {
  const utterances: string[] = [];

  // 1. Always include the description
  utterances.push(command.description);

  // 2. Add objective if present and non-empty
  if (command.objective && command.objective.trim().length > 0) {
    utterances.push(command.objective);
  }

  // 3. Extract action phrases from command name
  const namePhhrases = generateNamePhrases(command.name);
  utterances.push(...namePhhrases);

  // 4. Add synonym variations of the description
  const synonymVariations = generateSynonymVariations(command.description);
  utterances.push(...synonymVariations);

  // 5. Normalize: lowercase, trim, deduplicate
  const normalized = utterances
    .map((u) => u.toLowerCase().trim())
    .filter((u) => u.length > 0);

  // Deduplicate (case-insensitive, already lowercased)
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const u of normalized) {
    if (!seen.has(u)) {
      seen.add(u);
      deduped.push(u);
    }
  }

  // 6. Cap at 8 utterances
  return deduped.slice(0, 8);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Generate action phrases from the command name.
 *
 * For multi-word names like "plan-phase":
 *   "plan a phase", "plan the phase", "I want to plan the phase", "let's plan the phase"
 *
 * For single-word names like "progress":
 *   "show progress", "check progress"
 */
function generateNamePhrases(name: string): string[] {
  // Extract base name: "gsd:plan-phase" -> "plan-phase"
  const base = name.includes(':') ? name.split(':')[1] : name;
  const parts = base.split('-');
  const phrases: string[] = [];

  if (parts.length >= 2) {
    const verb = parts[0];
    const noun = parts.slice(1).join(' ');
    phrases.push(`${verb} a ${noun}`);
    phrases.push(`${verb} the ${noun}`);
    phrases.push(`I want to ${verb} the ${noun}`);
    phrases.push(`let's ${verb} the ${noun}`);
  } else {
    // Single-word command name
    const word = parts[0];
    phrases.push(`show ${word}`);
    phrases.push(`check ${word}`);
  }

  return phrases;
}

/**
 * Generate synonym variations of a description by replacing key verbs.
 *
 * Returns 0-2 variations where the first matching verb is replaced
 * with its synonyms.
 */
function generateSynonymVariations(description: string): string[] {
  const lower = description.toLowerCase();
  const variations: string[] = [];

  for (const [verb, synonyms] of Object.entries(VERB_SYNONYMS)) {
    // Check if the description starts with or contains the verb
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(lower)) {
      for (const synonym of synonyms) {
        const variation = lower.replace(regex, synonym);
        if (variation !== lower) {
          variations.push(variation);
        }
        // Cap at 2 synonym variations total
        if (variations.length >= 2) {
          return variations;
        }
      }
      // Only replace the first matching verb
      break;
    }
  }

  return variations;
}
