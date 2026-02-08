/**
 * Parse capability declarations from ROADMAP.md phase sections.
 *
 * Extracts structured CapabilityRef entries from the `**Capabilities**:` metadata
 * line in phase detail sections. Supports both single-line and multi-line formats.
 *
 * Single-line: `**Capabilities**: use: skill/beautiful-commits, skill/typescript-patterns`
 * Multi-line:
 *   **Capabilities**:
 *     - use: skill/name1, skill/name2
 *     - create: agent/my-agent
 *     - after: skill/test-generator
 */

import type { CapabilityVerb, CapabilityType, CapabilityRef } from './types.js';

/** Valid capability verbs. */
const VALID_VERBS = new Set<string>(['use', 'create', 'after', 'adapt']);

/** Valid capability types. */
const VALID_TYPES = new Set<string>(['skill', 'agent', 'team']);

/** Regex matching the start of a Capabilities metadata block. */
const CAPABILITIES_START = /^\*\*Capabilities\*\*\s*:/;

/** Regex matching metadata lines that terminate a multi-line block. */
const BLOCK_TERMINATOR = /^\*\*/;

/** Regex matching headings that terminate a multi-line block. */
const HEADING = /^#{1,4}\s/;

/** Regex matching numbered list items that terminate a multi-line block. */
const NUMBERED_LIST = /^\d+\./;

/**
 * Parse capability declarations from phase section lines.
 *
 * @param phaseLines - Lines from a ROADMAP.md phase detail section
 * @returns Array of parsed capability references
 */
export function parseCapabilityDeclarations(phaseLines: string[]): CapabilityRef[] {
  const refs: CapabilityRef[] = [];
  let inBlock = false;

  for (const line of phaseLines) {
    const trimmed = line.trim();

    // Check for start of capabilities block
    if (CAPABILITIES_START.test(trimmed)) {
      inBlock = true;

      // Check for inline content after the colon (single-line format)
      const inlineContent = trimmed.replace(CAPABILITIES_START, '').trim();
      if (inlineContent) {
        refs.push(...parseCapabilityLine(inlineContent));
        inBlock = false; // single-line format, no multi-line block
      }
      continue;
    }

    // Check for block termination
    if (inBlock) {
      if (BLOCK_TERMINATOR.test(trimmed) || HEADING.test(trimmed) || NUMBERED_LIST.test(trimmed)) {
        inBlock = false;
      }
    }

    // Parse list items within the block
    if (inBlock && /^-\s+/.test(trimmed)) {
      refs.push(...parseCapabilityLine(trimmed.replace(/^-\s+/, '')));
    }
  }

  return refs;
}

/**
 * Parse a single capability line into CapabilityRef entries.
 *
 * Expected format: `verb: type/name, type/name, ...`
 * Filters out entries with invalid types or missing names.
 *
 * @param line - A capability line without the leading `- ` prefix
 * @returns Array of valid CapabilityRef entries
 */
function parseCapabilityLine(line: string): CapabilityRef[] {
  const verbMatch = line.match(/^(use|create|after|adapt)\s*:\s*(.+)$/);
  if (!verbMatch) return [];

  const verb = verbMatch[1] as CapabilityVerb;
  const entriesStr = verbMatch[2];

  return entriesStr
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      const slashIndex = trimmed.indexOf('/');
      if (slashIndex === -1) return null;

      const type = trimmed.slice(0, slashIndex);
      const name = trimmed.slice(slashIndex + 1).trim();

      if (!VALID_TYPES.has(type) || !name) return null;

      return { verb, type: type as CapabilityType, name };
    })
    .filter((r): r is CapabilityRef => r !== null);
}
