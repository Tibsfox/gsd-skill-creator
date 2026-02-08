/**
 * Regex-based argument extraction from user input.
 *
 * Extracts structured arguments (phase numbers, flags, versions,
 * profiles, descriptions) from both natural language input and
 * raw argument strings. Operates on BOTH natural language
 * ("plan phase 3 with research") AND raw argument strings from
 * exact match ("3 --research").
 *
 * No hardcoded command-specific logic -- purely pattern-based extraction.
 */

import type { ExtractedArguments } from './types.js';

// ============================================================================
// Regex Patterns
// ============================================================================

/** Phase number preceded by "phase" keyword (preferred, works in any length input) */
const PHASE_WITH_KEYWORD = /phase\s+(\d+(?:\.\d+)?)/i;

/** Standalone number (used only for short inputs likely to be raw args) */
const STANDALONE_NUMBER = /\b(\d+(?:\.\d+)?)\b/;

/** Short input threshold: below this, standalone numbers are treated as phase numbers */
const SHORT_INPUT_THRESHOLD = 20;

/** Flag pattern: --flag-name */
const FLAG_PATTERN = /--([a-z][a-z-]*)/g;

/** Version pattern: v1.7 or v1.7.2 */
const VERSION_PATTERN = /v(\d+\.\d+(?:\.\d+)?)/i;

/** Profile pattern: quality, balanced, or budget */
const PROFILE_PATTERN = /\b(quality|balanced|budget)\b/i;

/** Double-quoted string */
const DOUBLE_QUOTED = /"([^"]+)"/;

/** Single-quoted string */
const SINGLE_QUOTED = /'([^']+)'/;

// ============================================================================
// extractArguments
// ============================================================================

/**
 * Extract structured arguments from user input via regex patterns.
 *
 * Strategy for phase number extraction:
 * 1. First try matching with "phase" keyword prefix (reliable in any context)
 * 2. If no keyword match, allow standalone number only for short inputs
 *    (< 20 chars), which are likely raw argument strings
 *
 * @param input - User input text or raw argument string
 * @returns Extracted arguments with null for unmatched fields
 */
export function extractArguments(input: string): ExtractedArguments {
  const result: ExtractedArguments = {
    phaseNumber: null,
    flags: [],
    description: null,
    version: null,
    profile: null,
    raw: input,
  };

  const trimmed = input.trim();
  if (!trimmed) {
    return result;
  }

  // 1. Extract phase number
  const keywordMatch = trimmed.match(PHASE_WITH_KEYWORD);
  if (keywordMatch) {
    result.phaseNumber = keywordMatch[1];
  } else if (trimmed.length < SHORT_INPUT_THRESHOLD) {
    // Short input -- likely raw args, accept standalone numbers
    const standaloneMatch = trimmed.match(STANDALONE_NUMBER);
    if (standaloneMatch) {
      result.phaseNumber = standaloneMatch[1];
    }
  }

  // 2. Extract flags
  const flags: string[] = [];
  let flagMatch: RegExpExecArray | null;
  // Reset lastIndex for global regex
  FLAG_PATTERN.lastIndex = 0;
  while ((flagMatch = FLAG_PATTERN.exec(trimmed)) !== null) {
    flags.push(flagMatch[1]);
  }
  result.flags = flags;

  // 3. Extract version
  const versionMatch = trimmed.match(VERSION_PATTERN);
  if (versionMatch) {
    result.version = versionMatch[1];
  }

  // 4. Extract profile
  const profileMatch = trimmed.match(PROFILE_PATTERN);
  if (profileMatch) {
    result.profile = profileMatch[1].toLowerCase();
  }

  // 5. Extract description (quoted strings only)
  const doubleMatch = trimmed.match(DOUBLE_QUOTED);
  if (doubleMatch) {
    result.description = doubleMatch[1];
  } else {
    const singleMatch = trimmed.match(SINGLE_QUOTED);
    if (singleMatch) {
      result.description = singleMatch[1];
    }
  }

  return result;
}
