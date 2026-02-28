/**
 * YAML configuration safety scanner.
 *
 * Scans content for YAML-specific security issues: code execution
 * tags, recursive merge key bombs, path traversal, and environment
 * variable exposure of sensitive values.
 *
 * @module staging/hygiene/scanner-config
 */

import { getPatterns } from './patterns.js';
import type { HygieneFinding } from './types.js';

/**
 * Scan content for YAML configuration safety issues.
 *
 * Fetches all config-safety patterns from the registry and runs
 * each against the provided content. Patterns with detect functions
 * are invoked directly; patterns with regex are matched globally
 * with per-match finding generation.
 *
 * @param content - The YAML/config content to scan
 * @returns Array of hygiene findings (empty if content is clean)
 */
export function scanConfigSafety(content: string): HygieneFinding[] {
  const patterns = getPatterns('config-safety');
  const findings: HygieneFinding[] = [];

  for (const pattern of patterns) {
    // Prefer detect function for complex logic
    if (pattern.detect) {
      findings.push(...pattern.detect(content));
      continue;
    }

    // Use regex for simple pattern matching
    if (pattern.regex) {
      // Clone with global flag to ensure all matches are found
      const flags = pattern.regex.flags.includes('g')
        ? pattern.regex.flags
        : pattern.regex.flags + 'g';
      const globalRegex = new RegExp(pattern.regex.source, flags);

      let match: RegExpExecArray | null;
      while ((match = globalRegex.exec(content)) !== null) {
        // Compute 1-based line number by counting newlines before match
        const line =
          content.slice(0, match.index).split('\n').length;

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
