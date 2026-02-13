/**
 * Hidden content scanner.
 *
 * Scans content for invisible or misleading characters: zero-width
 * characters, RTL/LTR overrides, and base64 in unexpected positions.
 *
 * @module staging/hygiene/scanner-hidden
 */

import { getPatterns } from './patterns.js';
import type { HygieneFinding } from './types.js';

/**
 * Scan content for hidden or invisible content patterns.
 *
 * Fetches all patterns in the 'hidden-content' category from
 * the registry and applies each against the content.
 *
 * @param content - Text content to scan
 * @returns Array of findings (empty if clean)
 */
export function scanHiddenContent(content: string): HygieneFinding[] {
  const patterns = getPatterns('hidden-content');
  const findings: HygieneFinding[] = [];

  for (const pattern of patterns) {
    if (pattern.detect) {
      findings.push(...pattern.detect(content));
      continue;
    }

    if (pattern.regex) {
      // Ensure global flag for iteration
      const flags = pattern.regex.flags.includes('g')
        ? pattern.regex.flags
        : pattern.regex.flags + 'g';
      const re = new RegExp(pattern.regex.source, flags);

      let match: RegExpExecArray | null;
      while ((match = re.exec(content)) !== null) {
        const line = countLines(content, match.index);
        findings.push({
          patternId: pattern.id,
          category: pattern.category,
          severity: pattern.severity,
          message: pattern.description,
          line,
          offset: match.index,
          match: match[0],
        });
      }
    }
  }

  return findings;
}

/**
 * Count the line number (1-based) for a given offset in content.
 */
function countLines(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (content[i] === '\n') {
      line++;
    }
  }
  return line;
}
