/**
 * PROJECT.md parser.
 *
 * Extracts project name, core value, current milestone, and description
 * from PROJECT.md content.
 * Returns null for empty, missing, or structurally invalid input.
 *
 * Stub implementation -- to be completed in GREEN phase.
 */

import type { ParsedProject } from './types.js';

/**
 * Parse PROJECT.md content into a structured ParsedProject.
 *
 * @param content - Raw PROJECT.md file content
 * @returns Parsed project data, or null if content is empty/invalid
 */
export function parseProject(content: string): ParsedProject | null {
  if (!content || !content.trim()) {
    return null;
  }

  // Stub: return null for now (GREEN phase will implement)
  return null;
}
