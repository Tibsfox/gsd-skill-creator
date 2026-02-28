// ============================================================================
// Hook Validator
// ============================================================================
// Static analysis of hook source code to detect unsafe patterns at
// registration time. Rejects hooks that modify environment variables,
// call process.exit, use eval/Function constructor, or modify global state.

/**
 * Pattern entry for forbidden hook behavior detection.
 */
export interface ForbiddenPattern {
  pattern: RegExp;
  description: string;
}

/**
 * Forbidden patterns detected via static analysis of hook source code.
 * Exported for transparency and extensibility.
 */
export const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  {
    pattern: /process\.env\s*(?:\[.*\]|\.)\s*\w*\s*=/,
    description: 'modifies process.env',
  },
  {
    pattern: /process\.exit\s*\(/,
    description: 'calls process.exit',
  },
  {
    pattern: /\beval\s*\(/,
    description: 'uses eval()',
  },
  {
    pattern: /new\s+Function\s*\(/,
    description: 'uses Function constructor',
  },
  {
    pattern: /\bglobal\s*\.\s*\w+\s*=/,
    description: 'modifies global state',
  },
  {
    pattern: /\bglobalThis\s*\.\s*\w+\s*=/,
    description: 'modifies global state',
  },
];

/**
 * Result of hook validation.
 * Discriminated union: check `valid` to narrow the type.
 */
export type HookValidationResult =
  | { valid: true }
  | { valid: false; violations: string[] };

/**
 * Custom error for hook validation failures.
 */
export class HookValidationError extends Error {
  override name = 'HookValidationError' as const;
  violations: string[];

  constructor(message: string, violations: string[]) {
    super(message);
    this.violations = violations;
  }
}

/**
 * Validate hook source code for unsafe patterns.
 *
 * Tests each FORBIDDEN_PATTERNS against the source string and collects
 * all violations (does not stop at the first match).
 *
 * @param hookSource - The hook source code string to validate
 * @returns Validation result: { valid: true } or { valid: false, violations: [...] }
 */
export function validateHook(hookSource: string): HookValidationResult {
  const violations: string[] = [];

  for (const { pattern, description } of FORBIDDEN_PATTERNS) {
    if (pattern.test(hookSource)) {
      // Deduplicate: "modifies global state" can match both global. and globalThis.
      if (!violations.includes(description)) {
        violations.push(description);
      }
    }
  }

  if (violations.length === 0) {
    return { valid: true };
  }

  return { valid: false, violations };
}
