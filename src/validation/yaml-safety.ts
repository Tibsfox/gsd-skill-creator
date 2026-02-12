import matter from 'gray-matter';

// ============================================================================
// YAML Safety Utilities
// ============================================================================
// Centralized, auditable entry point for safe YAML frontmatter parsing.
// Wraps gray-matter with explicit safety enforcement and clean error handling.
// While gray-matter already uses js-yaml's safeLoad internally (rejecting
// dangerous tags like !!js/function), this wrapper makes the safety guarantee
// explicit, testable, and returns a discriminated union instead of throwing.

/**
 * Custom error for YAML safety violations.
 */
export class YamlSafetyError extends Error {
  override name = 'YamlSafetyError' as const;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Result of safe frontmatter parsing.
 * Discriminated union: check `success` to narrow the type.
 */
export type SafeFrontmatterResult =
  | { success: true; data: Record<string, unknown>; body: string }
  | { success: false; error: string };

/**
 * Regex to extract the tag name from js-yaml "unknown tag" errors.
 * Example error: 'unknown tag !<tag:yaml.org,2002:js/function>'
 */
const TAG_ERROR_RE = /unknown tag !<tag:yaml\.org,2002:([^>]+)>/;

/**
 * Parse markdown content with YAML frontmatter, enforcing safe YAML
 * deserialization. Returns a structured result instead of throwing.
 *
 * - Rejects dangerous YAML tags (!!js/function, !!js/undefined, etc.)
 * - Validates that frontmatter is a plain object (not array, number, string)
 * - Provides descriptive error messages for malformed input
 *
 * @param content - Raw markdown content with optional YAML frontmatter
 * @returns Discriminated union: success with data+body, or failure with error
 */
export function safeParseFrontmatter(content: string): SafeFrontmatterResult {
  try {
    const parsed = matter(content);

    // gray-matter parses non-object frontmatter (e.g. "42", arrays) without error.
    // We require frontmatter to be a plain object.
    if (parsed.data !== null && parsed.data !== undefined) {
      if (typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
        return { success: false, error: 'Frontmatter must be an object' };
      }
    }

    return {
      success: true,
      data: (parsed.data ?? {}) as Record<string, unknown>,
      body: parsed.content.trim(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Enhance "unknown tag" errors with a clear safety message
    const tagMatch = TAG_ERROR_RE.exec(message);
    if (tagMatch) {
      const tagName = tagMatch[1];
      return {
        success: false,
        error: `Dangerous YAML tag not allowed: !!${tagName}`,
      };
    }

    // Pass through other YAML parse errors as-is (they're already descriptive)
    return { success: false, error: message };
  }
}
