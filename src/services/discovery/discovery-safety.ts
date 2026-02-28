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

import type { ParsedEntry, ExtractedToolUse } from './types.js';

// ============================================================================
// Secret Pattern Detection
// ============================================================================

/** Named regex pattern for detecting a secret type. */
export interface SecretPattern {
  name: string;
  pattern: RegExp;
}

/**
 * Known secret patterns to detect and redact from session data.
 *
 * Ordered from most specific to most generic so that specific patterns
 * (e.g., github-token) match before generic ones (e.g., api-key).
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // AWS access key IDs: always start with AKIA and are 20 chars
  {
    name: 'aws-key',
    pattern: /AKIA[0-9A-Z]{16}/g,
  },
  // GitHub tokens: ghp_, gho_, ghu_, ghs_, ghr_ followed by 36+ alphanumeric
  {
    name: 'github-token',
    pattern: /gh[pousr]_[A-Za-z0-9]{36,}/g,
  },
  // npm tokens: npm_ followed by 30+ alphanumeric
  {
    name: 'npm-token',
    pattern: /npm_[A-Za-z0-9]{30,}/g,
  },
  // Stripe keys: sk_live_, sk_test_, pk_live_, pk_test_ followed by 20+ chars
  {
    name: 'stripe-key',
    pattern: /[sp]k_(live|test)_[A-Za-z0-9]{20,}/g,
  },
  // Slack tokens: xoxb-, xoxp-, xoxs- followed by token body
  {
    name: 'slack-token',
    pattern: /xox[bps]-[A-Za-z0-9\-]{10,}/g,
  },
  // Private key blocks (multiline)
  {
    name: 'private-key',
    pattern: /-----BEGIN\s[A-Z\s]*PRIVATE KEY-----[\s\S]*?-----END\s[A-Z\s]*PRIVATE KEY-----/g,
  },
  // Bearer tokens: "Bearer " followed by JWT or long token string
  {
    name: 'bearer-token',
    pattern: /(?<=Bearer\s)[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+(?:\.[A-Za-z0-9\-_.+/=]*)?/g,
  },
  // Password assignments: password= or passwd= followed by a non-space value
  {
    name: 'password',
    pattern: /(?:password|passwd)\s*=\s*\S{8,}/gi,
  },
  // Generic API key assignments: api_key=, apikey=, api-key= followed by value (12+ chars)
  {
    name: 'api-key',
    pattern: /(?:api[_-]?key)\s*=\s*\S{12,}/gi,
  },
  // Generic secret/token assignments: secret= or token= followed by long alphanumeric (16+ chars)
  {
    name: 'generic-secret',
    pattern: /(?:secret|token)\s*=\s*[A-Za-z0-9\-_]{16,}/gi,
  },
];

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
export function redactSecrets(text: string): string {
  if (text === '') return '';

  let result = text;
  for (const { name, pattern } of SECRET_PATTERNS) {
    // Reset lastIndex for global regexes being reused
    pattern.lastIndex = 0;
    result = result.replace(pattern, `[REDACTED:${name}]`);
  }
  return result;
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
export function filterStructuralOnly(entry: ParsedEntry): ParsedEntry | null {
  switch (entry.kind) {
    case 'user-prompt':
      // Raw conversation content must never leak
      return null;

    case 'skipped':
      // No content to leak
      return entry;

    case 'tool-uses': {
      // Preserve tool sequence structure but redact input content
      const redactedTools: ExtractedToolUse[] = entry.data.map((tool) => {
        if (tool.name === 'Bash' && typeof tool.input.command === 'string') {
          // Bash commands provide structural insight -- keep command after redaction
          return {
            name: tool.name,
            input: {
              command: redactSecrets(tool.input.command),
              redacted: true,
            },
          };
        }
        // All other tools: replace entire input
        return {
          name: tool.name,
          input: { redacted: true },
        };
      });

      return { kind: 'tool-uses', data: redactedTools };
    }
  }
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
  projectSlug: string,
  config: ProjectAccessConfig,
): boolean {
  // Rule 1: Blocklist always wins
  if (config.excludeProjects?.includes(projectSlug)) {
    return false;
  }

  // Rule 2: If allowlist is defined and non-empty, project must be in it
  if (config.allowProjects && config.allowProjects.length > 0) {
    return config.allowProjects.includes(projectSlug);
  }

  // Rule 3: No restrictions
  return true;
}
