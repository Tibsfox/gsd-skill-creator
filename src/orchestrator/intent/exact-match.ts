/**
 * Exact match detection for explicit /gsd:command syntax.
 *
 * Detects /gsd:command-name input and maps to the correct
 * GsdCommandMetadata without invoking the Bayes classifier.
 * Extracts the raw argument string for downstream parsing.
 *
 * Only matches the /gsd: prefix (with leading slash). Raw
 * gsd:plan-phase without slash goes to Bayes classification.
 */

import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Regex for detecting explicit /gsd:command syntax.
 *
 * Captures:
 * - Group 1: command name (lowercase letters, digits, hyphens)
 * - Group 2: optional argument string (everything after command name)
 *
 * The command name must start with a letter (not digit or hyphen).
 */
export const EXACT_MATCH_REGEX = /^\/gsd:([a-z][a-z0-9-]*)(?:\s+(.*))?$/;

// ============================================================================
// Exact Match
// ============================================================================

/**
 * Attempt to match user input against explicit /gsd:command syntax.
 *
 * @param input - Raw user input string
 * @param commands - Array of discovered GSD commands to match against
 * @returns Matched command with raw args, or null if not an exact match
 *
 * @example
 * ```ts
 * exactMatch('/gsd:plan-phase 3 --research', commands)
 * // => { command: { name: 'gsd:plan-phase', ... }, rawArgs: '3 --research' }
 *
 * exactMatch('plan the next phase', commands)
 * // => null (not exact match syntax)
 * ```
 */
export function exactMatch(
  input: string,
  commands: GsdCommandMetadata[],
): { command: GsdCommandMetadata; rawArgs: string } | null {
  const trimmed = input.trim();

  const match = EXACT_MATCH_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }

  const commandName = `gsd:${match[1]}`;
  const command = commands.find((cmd) => cmd.name === commandName);

  if (!command) {
    return null;
  }

  return {
    command,
    rawArgs: match[2]?.trim() ?? '',
  };
}
