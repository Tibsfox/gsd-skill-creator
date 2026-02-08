/**
 * ROADMAP.md parser.
 *
 * Extracts phase list and per-phase plan lists from ROADMAP.md content.
 * Returns null for empty, missing, or structurally invalid input.
 *
 * Stub implementation -- to be completed in GREEN phase.
 */

import type { ParsedRoadmap } from './types.js';

/**
 * Parse ROADMAP.md content into a structured ParsedRoadmap.
 *
 * @param content - Raw ROADMAP.md file content
 * @returns Parsed roadmap data, or null if content is empty/invalid
 */
export function parseRoadmap(content: string): ParsedRoadmap | null {
  if (!content || !content.trim()) {
    return null;
  }

  // Stub: return null for now (GREEN phase will implement)
  return null;
}
