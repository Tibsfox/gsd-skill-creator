/**
 * Invocation parameter validator for MCP security gates.
 *
 * Detects prompt injection patterns and path traversal attempts in tool call
 * parameters before they reach the server. Walks all string values recursively,
 * checking against configurable pattern sets.
 */

import type { ValidationResult } from '../../core/types/mcp.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the invocation validator. */
export interface InvocationValidatorConfig {
  /** Additional prompt injection patterns to check. */
  customInjectionPatterns?: RegExp[];
  /** Additional path traversal patterns to check. */
  customTraversalPatterns?: RegExp[];
  /** Maximum allowed string value length (default: 10000). Produces warning, not block. */
  maxParamValueLength?: number;
}

// ============================================================================
// Built-in patterns
// ============================================================================

interface PatternEntry {
  pattern: RegExp;
  rule: string;
  reason: string;
}

/** Prompt injection detection patterns (SECR-07). */
const INJECTION_PATTERNS: PatternEntry[] = [
  {
    pattern: /(?:^|\s)(?:system|assistant|human):\s/i,
    rule: 'prompt-injection:system-prompt-override',
    reason: 'Detected system/assistant/human prompt role override in parameter value',
  },
  {
    pattern: /\b(?:ignore previous|disregard|forget).*?(?:instructions|rules|constraints)\b/i,
    rule: 'prompt-injection:role-override',
    reason: 'Detected attempt to override previous instructions',
  },
  {
    pattern: /\b(?:repeat|show|display|output|print).*?(?:system prompt|instructions|above text)\b/i,
    rule: 'prompt-injection:prompt-leakage',
    reason: 'Detected attempt to leak system prompt or instructions',
  },
  {
    pattern: /\b(?:instead|now)\s+(?:call|run|execute|invoke)\s/i,
    rule: 'prompt-injection:tool-hijacking',
    reason: 'Detected attempt to hijack tool execution flow',
  },
  {
    pattern: /<\/?(?:system|human|assistant|tool_use|tool_result)>/i,
    rule: 'prompt-injection:delimiter-injection',
    reason: 'Detected XML delimiter injection (conversation role tags)',
  },
];

/** Path traversal detection patterns (SECR-08). */
const TRAVERSAL_PATTERNS: PatternEntry[] = [
  {
    pattern: /(?:^|[/\\])\.\.(?:[/\\]|$)/,
    rule: 'path-traversal:directory-escape',
    reason: 'Detected directory traversal attempt (../)',
  },
  {
    pattern: /\x00/,
    rule: 'path-traversal:null-byte',
    reason: 'Detected null byte injection in path parameter',
  },
  {
    pattern: /^(?:\/etc|\/proc|\/sys|\/dev|C:\\Windows)/i,
    rule: 'path-traversal:system-path',
    reason: 'Detected access attempt to system directory',
  },
  {
    pattern: /^~\//,
    rule: 'path-traversal:home-directory-escape',
    reason: 'Detected home directory escape via tilde expansion',
  },
];

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Recursively walk all string values in an object/array, invoking callback for each.
 */
function walkStringValues(
  obj: unknown,
  path: string,
  callback: (value: string, path: string) => void,
): void {
  if (typeof obj === 'string') {
    callback(obj, path);
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walkStringValues(obj[i], `${path}[${i}]`, callback);
    }
    return;
  }
  if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      walkStringValues(value, path ? `${path}.${key}` : key, callback);
    }
  }
}

/**
 * Check a string value against a set of patterns, producing ValidationResults for matches.
 */
function checkPatterns(
  value: string,
  path: string,
  patterns: PatternEntry[],
): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const { pattern, rule, reason } of patterns) {
    if (pattern.test(value)) {
      results.push({
        valid: false,
        blocked: true,
        rule,
        reason: `${reason} at parameter path '${path}'`,
        severity: 'critical',
      });
    }
  }
  return results;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate tool invocation parameters against security patterns.
 *
 * Checks all string values recursively for:
 * - Prompt injection patterns (SECR-07)
 * - Path traversal attempts (SECR-08)
 * - Oversized parameter values (warning only)
 *
 * Returns an empty array if all parameters are clean.
 */
export function validateInvocationParams(
  toolName: string,
  params: Record<string, unknown>,
  config?: InvocationValidatorConfig,
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const maxLen = config?.maxParamValueLength ?? 10000;

  // Build combined pattern lists
  const injectionPatterns = [
    ...INJECTION_PATTERNS,
    ...(config?.customInjectionPatterns ?? []).map((pattern, i) => ({
      pattern,
      rule: `prompt-injection:custom-${i}`,
      reason: 'Matched custom injection pattern',
    })),
  ];

  const traversalPatterns = [
    ...TRAVERSAL_PATTERNS,
    ...(config?.customTraversalPatterns ?? []).map((pattern, i) => ({
      pattern,
      rule: `path-traversal:custom-${i}`,
      reason: 'Matched custom traversal pattern',
    })),
  ];

  walkStringValues(params, '', (value, path) => {
    // Check prompt injection patterns
    results.push(...checkPatterns(value, path, injectionPatterns));

    // Check path traversal patterns
    results.push(...checkPatterns(value, path, traversalPatterns));

    // Check value length (warning, not blocking)
    if (value.length > maxLen) {
      results.push({
        valid: true,
        blocked: false,
        rule: 'param-size:oversized',
        reason: `Parameter value at '${path}' is ${value.length} chars, exceeding ${maxLen} char limit`,
        severity: 'warning',
      });
    }
  });

  return results;
}
