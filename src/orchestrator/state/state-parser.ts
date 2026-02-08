/**
 * STATE.md parser.
 *
 * Extracts current position, decisions, blockers, pending todos,
 * and session continuity from STATE.md content.
 * Returns null for empty, missing, or structurally invalid input.
 *
 * Stub implementation -- to be completed in GREEN phase.
 */

import type { ParsedState } from './types.js';

/**
 * Parse STATE.md content into a structured ParsedState.
 *
 * @param content - Raw STATE.md file content
 * @returns Parsed state data, or null if content is empty/invalid
 */
export function parseState(content: string): ParsedState | null {
  if (!content || !content.trim()) {
    return null;
  }

  // Stub: return null for now (GREEN phase will implement)
  return null;
}
