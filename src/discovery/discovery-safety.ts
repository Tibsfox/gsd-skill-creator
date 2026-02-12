/**
 * Discovery boundary and content safety functions.
 *
 * Prevents the discovery scanner from:
 * - Crossing project boundaries without authorization (allowlist/blocklist)
 * - Leaking secrets from session data (secret pattern redaction)
 * - Exposing raw conversation content (structural-only filtering)
 *
 * Implements: SEC-01 (allowlist/blocklist), SEC-02 (secret filtering),
 * SEC-03 (structural-only results), SEC-04 (dry-run mode support).
 */

import type { ParsedEntry } from './types.js';

// ============================================================================
// Secret Pattern Detection
// ============================================================================

/** Named regex pattern for detecting a secret type. */
export interface SecretPattern {
  name: string;
  pattern: RegExp;
}

/** Known secret patterns to detect and redact from session data. */
export const SECRET_PATTERNS: SecretPattern[] = [];

// ============================================================================
// Secret Redaction
// ============================================================================

/**
 * Redact all known secret patterns from the given text.
 *
 * Each match is replaced with `[REDACTED:{pattern-name}]`.
 * Patterns are applied in array order so more specific patterns
 * can match before generic ones.
 */
export function redactSecrets(_text: string): string {
  throw new Error('Not implemented');
}

// ============================================================================
// Structural Content Filtering
// ============================================================================

/**
 * Filter a parsed entry to contain only structural data.
 *
 * - user-prompt entries are removed entirely (returns null)
 * - tool-uses entries have input replaced with { redacted: true },
 *   except Bash tool commands which are passed through redactSecrets
 * - skipped entries pass through unchanged
 */
export function filterStructuralOnly(_entry: ParsedEntry): ParsedEntry | null {
  throw new Error('Not implemented');
}

// ============================================================================
// Project Access Control
// ============================================================================

/** Configuration for project-level access control during scanning. */
export interface ProjectAccessConfig {
  /** If set, ONLY these projects are scanned. */
  allowProjects?: string[];
  /** These projects are always excluded (blocklist). */
  excludeProjects?: string[];
}

/**
 * Validate whether a project slug is allowed to be scanned.
 *
 * Rules:
 * 1. If excludeProjects includes the slug -> false (blocklist wins)
 * 2. If allowProjects is defined and non-empty and does not include the slug -> false
 * 3. Otherwise -> true
 */
export function validateProjectAccess(
  _projectSlug: string,
  _config: ProjectAccessConfig,
): boolean {
  throw new Error('Not implemented');
}
