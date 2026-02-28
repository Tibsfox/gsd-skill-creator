/**
 * Configuration validation engine for GSD config.
 *
 * Validates raw config input (pre-Zod parsing) against documented ranges,
 * type constraints, and security policies. Returns structured results with
 * errors (hard failures), warnings (deviations), and security issues.
 *
 * Operates on raw unknown input intentionally -- catches type errors BEFORE
 * Zod swallows them with defaults.
 *
 * @module config-validator
 */

// ============================================================================
// Types
// ============================================================================

/**
 * A single validation issue found during config analysis.
 */
export interface ConfigIssue {
  /** Dot-path to the field (e.g., "safety.max_files_per_commit"). */
  field: string;
  /** Human-readable explanation of the issue. */
  message: string;
  /** Issue severity: error (hard failure), warning (deviation), security (risk). */
  severity: 'error' | 'warning' | 'security';
  /** The value that was found in the config. */
  currentValue: unknown;
  /** Expected range/constraints for the field, if applicable. */
  expectedRange?: {
    min?: number;
    max?: number;
    default?: unknown;
    validValues?: string[];
  };
}

/**
 * Result of validating a config object.
 */
export interface ConfigValidationResult {
  /** False only if there are type or range errors. Warnings/security issues do not invalidate. */
  valid: boolean;
  /** Hard failures: type mismatches, out-of-range values. */
  errors: ConfigIssue[];
  /** Soft issues: significant deviations from defaults. */
  warnings: ConfigIssue[];
  /** Security-relevant settings that users should be aware of. */
  securityIssues: ConfigIssue[];
}

// ============================================================================
// Field Registry
// ============================================================================

type FieldType = 'string' | 'number' | 'boolean' | 'object';

interface FieldDescriptor {
  /** Dot-path to the field (e.g., "safety.max_files_per_commit"). */
  path: string;
  /** Expected TypeScript type. */
  type: FieldType;
  /** Minimum value (numeric fields only). */
  min?: number;
  /** Maximum value (numeric fields only). */
  max?: number;
  /** Default value for deviation detection. */
  default?: unknown;
  /** Valid enum values (string fields only). */
  validValues?: string[];
  /** Warning thresholds: conditions that produce warnings. */
  warningChecks?: Array<{
    condition: (value: unknown) => boolean;
    message: string;
  }>;
  /** Security check: condition that produces a security issue. */
  securityChecks?: Array<{
    condition: (value: unknown) => boolean;
    message: string;
  }>;
}

/**
 * Registry of all validated config fields with their constraints.
 *
 * Each entry defines the field's type, valid range, default value,
 * and any warning/security conditions.
 */
const CONFIG_FIELD_REGISTRY: readonly FieldDescriptor[] = [
  // ---- Top-level fields ----
  {
    path: 'mode',
    type: 'string',
    default: 'interactive',
    validValues: ['interactive', 'yolo'],
    securityChecks: [
      {
        condition: (v) => v === 'yolo',
        message: 'Mode "yolo" skips confirmations -- user actions are not verified before execution',
      },
    ],
  },
  {
    path: 'verbosity',
    type: 'number',
    min: 1,
    max: 5,
    default: 3,
  },
  {
    path: 'depth',
    type: 'string',
    default: 'standard',
    validValues: ['quick', 'standard', 'comprehensive'],
  },
  {
    path: 'model_profile',
    type: 'string',
    default: 'balanced',
    validValues: ['quality', 'balanced', 'budget'],
  },

  // ---- Safety section ----
  {
    path: 'safety.max_files_per_commit',
    type: 'number',
    min: 1,
    max: 100,
    default: 20,
    warningChecks: [
      {
        condition: (v) => typeof v === 'number' && v > 50,
        message: 'Large commits are harder to review and revert',
      },
    ],
    securityChecks: [
      {
        condition: (v) => typeof v === 'number' && v > 50,
        message: 'Very high file limit per commit increases risk of unreviewed changes',
      },
    ],
  },
  {
    path: 'safety.require_tests',
    type: 'boolean',
    default: true,
    securityChecks: [
      {
        condition: (v) => v === false,
        message: 'Disabling test requirements may allow broken code',
      },
    ],
  },

  // ---- Gates section ----
  {
    path: 'gates.require_plan_approval',
    type: 'boolean',
    default: false,
  },
  {
    path: 'gates.require_checkpoint_approval',
    type: 'boolean',
    default: true,
    securityChecks: [
      {
        condition: (v) => v === false,
        message: 'Disabling checkpoint approval removes human verification of critical steps',
      },
    ],
  },

  // ---- Parallelization (nested object field) ----
  {
    path: 'parallelization.max_parallel',
    type: 'number',
    min: 1,
    max: 10,
    warningChecks: [
      {
        condition: (v) => typeof v === 'number' && v > 5,
        message: 'High parallelism may cause file conflicts',
      },
    ],
  },

  // ---- Application config fields ----
  {
    path: 'contextWindowSize',
    type: 'number',
    min: 1000,
    max: 2_000_000,
    default: 200_000,
  },
  {
    path: 'budgetPercent',
    type: 'number',
    min: 0.01,
    max: 0.20,
    default: 0.03,
    warningChecks: [
      {
        condition: (v) => typeof v === 'number' && v > 0.10,
        message: 'Budget above 10% consumes significant context',
      },
    ],
  },
  {
    path: 'relevanceThreshold',
    type: 'number',
    min: 0.0,
    max: 1.0,
    default: 0.1,
    warningChecks: [
      {
        condition: (v) => typeof v === 'number' && v < 0.05,
        message: 'Very low threshold -- nearly all skills will activate',
      },
      {
        condition: (v) => typeof v === 'number' && v > 0.9,
        message: 'Very high threshold -- most skills will never activate',
      },
    ],
  },
  {
    path: 'maxSkillsPerSession',
    type: 'number',
    min: 1,
    max: 20,
    default: 5,
  },

  // ---- Budget profile fields ----
  {
    path: 'hardCeilingPercent',
    type: 'number',
    min: 0.01,
    max: 0.30,
  },
] as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract a value from a nested object using a dot-path.
 *
 * @param obj - The object to extract from
 * @param path - Dot-separated path (e.g., "safety.max_files_per_commit")
 * @returns The value at the path, or undefined if not found
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Check if the JavaScript typeof matches the expected field type.
 */
function matchesType(value: unknown, expected: FieldType): boolean {
  if (expected === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  return typeof value === expected;
}

// ============================================================================
// Core Validation
// ============================================================================

/**
 * Validate a raw config object against documented ranges, types, and policies.
 *
 * This function is PURE (no I/O, no side effects). It operates on raw
 * unknown input before Zod parsing so it can catch type errors that Zod
 * would silently coerce with defaults.
 *
 * @param rawInput - Raw config object (from JSON.parse or similar)
 * @returns Structured validation result with errors, warnings, and security issues
 */
export function validateConfig(rawInput: unknown): ConfigValidationResult {
  const errors: ConfigIssue[] = [];
  const warnings: ConfigIssue[] = [];
  const securityIssues: ConfigIssue[] = [];

  // Non-object input is a hard error
  if (rawInput === null || rawInput === undefined || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    errors.push({
      field: '(root)',
      message: `Config must be a plain object, got ${rawInput === null ? 'null' : Array.isArray(rawInput) ? 'array' : typeof rawInput}`,
      severity: 'error',
      currentValue: rawInput,
    });
    return { valid: false, errors, warnings, securityIssues };
  }

  const obj = rawInput as Record<string, unknown>;

  for (const descriptor of CONFIG_FIELD_REGISTRY) {
    const value = getByPath(obj, descriptor.path);

    // Skip fields that are not present -- they'll get defaults from Zod
    if (value === undefined) {
      continue;
    }

    // ---- Type check (before range check) ----
    if (!matchesType(value, descriptor.type)) {
      errors.push({
        field: descriptor.path,
        message: `Type mismatch: expected ${descriptor.type}, got ${typeof value}`,
        severity: 'error',
        currentValue: value,
        expectedRange: buildExpectedRange(descriptor),
      });
      // Skip further checks for this field -- type is wrong
      continue;
    }

    // ---- Enum check (string fields with validValues) ----
    if (descriptor.validValues && typeof value === 'string') {
      if (!descriptor.validValues.includes(value)) {
        errors.push({
          field: descriptor.path,
          message: `Invalid value "${value}": must be one of ${descriptor.validValues.join(', ')}`,
          severity: 'error',
          currentValue: value,
          expectedRange: buildExpectedRange(descriptor),
        });
        // Skip further checks -- invalid enum
        continue;
      }
    }

    // ---- Range check (numeric fields) ----
    if (typeof value === 'number') {
      if (descriptor.min !== undefined && value < descriptor.min) {
        errors.push({
          field: descriptor.path,
          message: `Value ${value} is below minimum ${descriptor.min}`,
          severity: 'error',
          currentValue: value,
          expectedRange: buildExpectedRange(descriptor),
        });
        continue;
      }
      if (descriptor.max !== undefined && value > descriptor.max) {
        errors.push({
          field: descriptor.path,
          message: `Value ${value} is above maximum ${descriptor.max}`,
          severity: 'error',
          currentValue: value,
          expectedRange: buildExpectedRange(descriptor),
        });
        continue;
      }
    }

    // ---- Warning checks ----
    if (descriptor.warningChecks) {
      for (const check of descriptor.warningChecks) {
        if (check.condition(value)) {
          warnings.push({
            field: descriptor.path,
            message: check.message,
            severity: 'warning',
            currentValue: value,
            expectedRange: buildExpectedRange(descriptor),
          });
        }
      }
    }

    // ---- Security checks ----
    if (descriptor.securityChecks) {
      for (const check of descriptor.securityChecks) {
        if (check.condition(value)) {
          securityIssues.push({
            field: descriptor.path,
            message: check.message,
            severity: 'security',
            currentValue: value,
            expectedRange: buildExpectedRange(descriptor),
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    securityIssues,
  };
}

/**
 * Build the expectedRange object from a field descriptor.
 */
function buildExpectedRange(descriptor: FieldDescriptor): ConfigIssue['expectedRange'] {
  const range: ConfigIssue['expectedRange'] = {};
  if (descriptor.min !== undefined) range.min = descriptor.min;
  if (descriptor.max !== undefined) range.max = descriptor.max;
  if (descriptor.default !== undefined) range.default = descriptor.default;
  if (descriptor.validValues) range.validValues = [...descriptor.validValues];
  // Only return if there's at least one property
  return Object.keys(range).length > 0 ? range : undefined;
}
