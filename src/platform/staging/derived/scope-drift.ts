/**
 * Scope drift detector for derived knowledge.
 *
 * Detects when a skill has been generalized beyond what the
 * underlying observation data actually supports. Compares skill
 * scope (from description, triggers, body) against observed
 * scope (from session data).
 *
 * @module staging/derived/scope-drift
 */

import type { DerivedCheckSeverity, ScopeDriftFinding } from './types.js';

/**
 * Session scope data containing aggregated observation summaries.
 */
export interface SessionScopeData {
  topCommands: string[];
  topFiles: string[];
  topTools: string[];
}

/**
 * Common words to filter out when extracting scope from text.
 * Includes stop words, common verb forms, and generic heading words.
 */
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'and', 'or', 'but',
  'not', 'this', 'that', 'these', 'those', 'it', 'its', 'when', 'how',
  'what', 'which', 'who', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only',
  'use', 'using', 'used', 'run', 'running', 'add', 'create',
  'setup', 'config', 'configuration', 'guide', 'overview', 'workflow',
  'commands', 'files', 'working',
]);

/**
 * Tokenize a string into lowercase words, filtering out common words
 * and words shorter than 3 characters.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s/\\.,;:!?()[\]{}<>'"]+/)
    .filter(word => word.length >= 3 && !COMMON_WORDS.has(word));
}

/**
 * Extract meaningful scope items from trigger file patterns.
 *
 * Strips glob characters (*, **), file extensions (.ts, .js, etc.),
 * and path separators to keep directory names and filename stems.
 */
function extractFileScope(triggerFiles: string[]): string[] {
  const items: string[] = [];
  for (const pattern of triggerFiles) {
    // Remove glob wildcards and split by path separators
    const cleaned = pattern
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');

    const parts = cleaned
      .split(/[/\\]+/)
      .map(p => p.replace(/\.[a-z]{1,5}$/i, '')) // strip file extensions
      .map(p => p.replace(/^\.+/, ''))            // strip leading dots
      .map(p => p.toLowerCase().trim())
      .filter(p => p.length >= 2 && !COMMON_WORDS.has(p));

    items.push(...parts);
  }
  return items;
}

/**
 * Extract scope items from a skill's description, triggers, files, and headings.
 *
 * Tokenizes each source, filters common words, deduplicates, and returns
 * a sorted array of meaningful scope keywords.
 *
 * @param description - Skill description text
 * @param triggerIntents - Trigger intent patterns
 * @param triggerFiles - Trigger file glob patterns
 * @param bodyHeadings - Markdown body section headings
 * @returns Sorted, deduplicated array of scope keywords
 */
export function extractSkillScope(
  description: string,
  triggerIntents: string[],
  triggerFiles: string[],
  bodyHeadings: string[],
): string[] {
  const items: string[] = [];

  // 1. Tokenize description
  items.push(...tokenize(description));

  // 2. Tokenize trigger intents
  for (const intent of triggerIntents) {
    items.push(...tokenize(intent));
  }

  // 3. Extract from trigger files
  items.push(...extractFileScope(triggerFiles));

  // 4. Tokenize body headings
  for (const heading of bodyHeadings) {
    items.push(...tokenize(heading));
  }

  // 5. Deduplicate and sort
  return [...new Set(items)].sort();
}

/**
 * Extract observed scope from session data.
 *
 * Aggregates commands, files, and tools from session observations
 * into a flat, deduplicated, sorted array of scope keywords.
 *
 * @param sessions - Session scope data from observations
 * @returns Sorted, deduplicated array of observed scope keywords
 */
export function extractObservedScope(sessions: SessionScopeData[]): string[] {
  const items: string[] = [];

  for (const session of sessions) {
    // From topCommands: split by spaces, extract base command and args
    for (const cmd of session.topCommands) {
      const parts = cmd
        .toLowerCase()
        .split(/\s+/)
        .filter(p => p.length >= 2 && !p.startsWith('-'));
      items.push(...parts);
    }

    // From topFiles: extract filename stems and directory names (not extensions)
    for (const file of session.topFiles) {
      const cleaned = file.replace(/\.[a-z]{1,5}$/i, ''); // strip extension
      const parts = cleaned
        .split(/[/\\]+/)
        .map(p => p.toLowerCase().trim())
        .filter(p => p.length >= 2);
      items.push(...parts);
    }

    // From topTools: use as-is, lowercased
    for (const tool of session.topTools) {
      items.push(tool.toLowerCase());
    }
  }

  // Deduplicate and sort
  return [...new Set(items)].sort();
}

/**
 * Detect scope drift by comparing skill scope against observed scope.
 *
 * Returns findings when the skill claims to cover topics that are not
 * supported by the observation data. A narrow skill with broad observations
 * returns no findings (that is not scope drift).
 *
 * @param skillScope - Keywords the skill claims to cover
 * @param observedScope - Keywords from actual observations
 * @returns Array of ScopeDriftFinding (empty if no drift detected)
 */
export function detectScopeDrift(
  skillScope: string[],
  observedScope: string[],
): ScopeDriftFinding[] {
  // Normalize both arrays: lowercase, deduplicate
  const normalizedSkill = [...new Set(skillScope.map(s => s.toLowerCase()))];
  const observedSet = new Set(observedScope.map(s => s.toLowerCase()));

  // Find unsupported items: skill scope items NOT in observed scope
  const unsupported = normalizedSkill.filter(item => !observedSet.has(item));

  // No drift
  if (unsupported.length === 0) {
    return [];
  }

  // Compute drift ratio
  const driftRatio = Math.round((unsupported.length / normalizedSkill.length) * 100) / 100;

  // Determine severity
  let severity: DerivedCheckSeverity;
  if (driftRatio > 0.5) {
    severity = 'critical';
  } else if (driftRatio > 0.3) {
    severity = 'warning';
  } else {
    severity = 'info';
  }

  const finding: ScopeDriftFinding = {
    type: 'scope-drift',
    severity,
    message: `Skill scope includes ${unsupported.length} items not supported by observations (drift ratio: ${(driftRatio * 100).toFixed(0)}%)`,
    skillScope: normalizedSkill,
    observedScope: [...observedSet].sort(),
    driftRatio,
  };

  return [finding];
}
