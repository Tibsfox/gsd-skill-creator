import { z } from 'zod';
import type { TestCase, TestExpectation } from '../types/testing.js';

// ============================================================================
// Validation Warning Type
// ============================================================================

/**
 * A validation warning (soft limit violation).
 * Warnings don't block validation but inform the user of potential issues.
 */
export interface ValidationWarning {
  field: string;
  message: string;
}

// ============================================================================
// Test Expectation Schema
// ============================================================================

/**
 * Schema for test expectation values.
 */
export const TestExpectationSchema = z.enum(['positive', 'negative', 'edge-case']);

// ============================================================================
// Test Difficulty Schema
// ============================================================================

/**
 * Schema for test difficulty levels.
 */
export const TestDifficultySchema = z.enum(['easy', 'medium', 'hard']);

// ============================================================================
// Test Case Input Schema
// ============================================================================

/**
 * Schema for creating or editing test cases.
 *
 * Uses soft limits (warnings) for:
 * - Prompt length extremes (<5 or >500 chars)
 * - Confidence threshold extremes (<0.3 or >0.95)
 *
 * These warn but don't block validation.
 */
export const TestCaseInputSchema = z
  .object({
    prompt: z
      .string()
      .min(1, 'Test prompt is required'),

    expected: TestExpectationSchema,

    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),

    tags: z.array(z.string()).optional(),

    difficulty: TestDifficultySchema.optional(),

    minConfidence: z
      .number()
      .min(0, 'minConfidence must be between 0 and 1')
      .max(1, 'minConfidence must be between 0 and 1')
      .optional(),

    maxConfidence: z
      .number()
      .min(0, 'maxConfidence must be between 0 and 1')
      .max(1, 'maxConfidence must be between 0 and 1')
      .optional(),

    reason: z
      .string()
      .max(200, 'Reason must be 200 characters or less')
      .optional(),
  })
  .passthrough(); // Allow extra fields

/**
 * Input type for creating/editing test cases.
 * Inferred from TestCaseInputSchema.
 */
export type TestCaseInput = z.infer<typeof TestCaseInputSchema>;

// ============================================================================
// Soft Limit Helpers
// ============================================================================

/**
 * Check for soft limit violations and return warnings.
 * These don't block validation but inform the user.
 */
function checkSoftLimits(data: TestCaseInput): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Prompt length soft limits
  if (data.prompt.length < 5) {
    warnings.push({
      field: 'prompt',
      message: 'Very short prompt (<5 chars) may not be meaningful',
    });
  }
  if (data.prompt.length > 500) {
    warnings.push({
      field: 'prompt',
      message: 'Very long prompt (>500 chars) may be unrealistic',
    });
  }

  // minConfidence extreme values
  if (data.minConfidence !== undefined) {
    if (data.minConfidence < 0.3) {
      warnings.push({
        field: 'minConfidence',
        message: 'Very low minConfidence (<0.3) may be too permissive',
      });
    }
    if (data.minConfidence > 0.95) {
      warnings.push({
        field: 'minConfidence',
        message: 'Very high minConfidence (>0.95) may be too strict',
      });
    }
  }

  // maxConfidence extreme values
  if (data.maxConfidence !== undefined) {
    if (data.maxConfidence < 0.3) {
      warnings.push({
        field: 'maxConfidence',
        message: 'Very low maxConfidence (<0.3) may be too strict',
      });
    }
    if (data.maxConfidence > 0.95) {
      warnings.push({
        field: 'maxConfidence',
        message: 'Very high maxConfidence (>0.95) may be too permissive',
      });
    }
  }

  return warnings;
}

// ============================================================================
// Validation Result Type
// ============================================================================

/**
 * Result of test case input validation.
 */
export interface TestCaseValidationResult {
  /** Whether validation passed (no hard errors) */
  valid: boolean;
  /** Validated data (only present if valid=true) */
  data?: TestCaseInput;
  /** Hard validation errors (only present if valid=false) */
  errors?: string[];
  /** Soft limit warnings (may be present even if valid=true) */
  warnings?: ValidationWarning[];
}

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validate test case input data.
 *
 * Returns a structured result with:
 * - valid: boolean indicating if data passed hard validation
 * - data: validated data (if valid)
 * - errors: hard validation errors (if invalid)
 * - warnings: soft limit violations (may exist even when valid)
 *
 * @param data - Unknown input data to validate
 * @returns Validation result with errors and warnings
 */
export function validateTestCaseInput(data: unknown): TestCaseValidationResult {
  const result = TestCaseInputSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue: z.ZodIssue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });

    return {
      valid: false,
      errors,
    };
  }

  // Check soft limits
  const warnings = checkSoftLimits(result.data);

  return {
    valid: true,
    data: result.data,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
