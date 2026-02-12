import type { SkillMetadata } from '../types/skill.js';

/**
 * Result of content safety validation.
 */
export interface ContentSafetyResult {
  /** true if no errors (warnings don't make it unsafe) */
  safe: boolean;
  /** Non-blocking concerns */
  warnings: string[];
  /** Blocking issues */
  errors: string[];
}

/**
 * Options for content safety validation.
 */
export interface ContentSafetyOptions {
  /** true for remote skills, false for local */
  strict: boolean;
}

/** Maximum body size before generating a warning (chars) */
const MAX_BODY_SIZE = 50_000;

/** Pattern for shell injection: $ARGUMENTS inside !`...` command blocks */
const SHELL_INJECTION_PATTERN = /!`[^`]*\$ARGUMENTS/i;

/** Suspicious tool names that warrant a warning */
const SUSPICIOUS_TOOLS = /^(bash|shell|exec)$/i;

/**
 * Strip fenced code blocks from body to avoid false positives.
 * Matches triple-backtick blocks (with optional language tag).
 */
function stripCodeBlocks(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '');
}

/**
 * Normalize allowed-tools to a string array.
 * Handles both string[] and space-delimited string formats.
 */
function normalizeAllowedTools(
  tools: string[] | string | undefined,
): string[] {
  if (!tools) return [];
  if (Array.isArray(tools)) return tools;
  const trimmed = tools.trim();
  return trimmed === '' ? [] : trimmed.split(/\s+/);
}

/**
 * Validate content safety of a skill.
 *
 * Standard tier (local skills): checks metadata validity.
 * Strict tier (remote skills): adds body analysis for shell injection,
 * suspicious allowed-tools, and content size limits.
 *
 * @param body - The skill body content
 * @param metadata - Partial skill metadata
 * @param options - Validation options
 * @returns Content safety result
 */
export function validateContentSafety(
  body: string,
  metadata: Partial<SkillMetadata>,
  options: ContentSafetyOptions,
): ContentSafetyResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // ── Standard tier (always runs) ──────────────────────────────────────
  if (!metadata.name || metadata.name.trim() === '') {
    errors.push('Skill name is required');
  }

  if (!metadata.description || metadata.description.trim() === '') {
    errors.push('Skill description is required');
  }

  // ── Strict tier (remote skills only) ─────────────────────────────────
  if (options.strict) {
    // 1. Shell injection detection
    //    Strip code blocks first to avoid false positives on documentation
    const strippedBody = stripCodeBlocks(body);
    if (SHELL_INJECTION_PATTERN.test(strippedBody)) {
      errors.push(
        'Shell injection risk: $ARGUMENTS found inside !`command` block. ' +
          'Remote skills must not pass user arguments directly to shell commands.',
      );
    }

    // 2. Suspicious allowed-tools check
    const tools = normalizeAllowedTools(metadata['allowed-tools']);
    const suspiciousFound = tools.filter((t) => SUSPICIOUS_TOOLS.test(t));
    if (suspiciousFound.length > 0) {
      warnings.push(
        `Skill requests Bash/shell tool access (${suspiciousFound.join(', ')}) -- review before installing`,
      );
    }

    // 3. Body size check
    if (body.length > MAX_BODY_SIZE) {
      warnings.push(
        `Skill body is ${body.length.toLocaleString()} chars, exceeding the ${MAX_BODY_SIZE.toLocaleString()} char recommended size limit`,
      );
    }
  }

  return {
    safe: errors.length === 0,
    warnings,
    errors,
  };
}
