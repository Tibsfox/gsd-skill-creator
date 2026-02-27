/**
 * DACP fidelity decision model.
 *
 * Determines the appropriate fidelity level (0-3) for a handoff based on
 * five input factors: data complexity, historical drift rate, available
 * skills, token budget, and safety criticality.
 *
 * The fidelity model is the core intelligence of the assembler -- it
 * determines how much scaffolding each handoff needs. Getting this right
 * means handoffs carry exactly the right amount of structure: not too
 * little (causing interpretation drift) and not too much (wasting tokens).
 *
 * Pure functions -- no I/O, no side effects, fully testable.
 *
 * @module dacp/fidelity/decision
 */

import type { FidelityLevel, FidelityDecision } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/** Token budget threshold below which fidelity is capped at Level 1. */
const LOW_TOKEN_BUDGET = 20_000;

/** Drift rate threshold for "high drift" rules. */
const HIGH_DRIFT_THRESHOLD = 0.3;

/** Drift rate threshold for "medium drift" rules. */
const MEDIUM_DRIFT_THRESHOLD = 0.15;

/** Max depth for "simple" data complexity classification. */
const SIMPLE_MAX_DEPTH = 1;

/** Max fields for "simple" data complexity classification. */
const SIMPLE_MAX_FIELDS = 5;

/** Max depth for "structured" data complexity classification. */
const STRUCTURED_MAX_DEPTH = 3;

/** Max fields for "structured" data complexity classification. */
const STRUCTURED_MAX_FIELDS = 20;

/** Minimum skills needed for Level 3 in high-drift scenarios. */
const HIGH_DRIFT_L3_SKILLS = 3;

// ============================================================================
// Data Complexity Assessment
// ============================================================================

/**
 * Measure the maximum nesting depth of a value.
 * Arrays count as one level of depth. Primitives have depth 0.
 */
function measureDepth(value: unknown, currentDepth: number = 0): number {
  if (value === null || value === undefined) return currentDepth;
  if (typeof value !== 'object') return currentDepth;

  const obj = value as Record<string, unknown>;
  const keys = Array.isArray(obj) ? obj : Object.values(obj);
  let maxDepth = currentDepth + 1;

  for (const child of keys) {
    if (child !== null && typeof child === 'object') {
      const childDepth = measureDepth(child, currentDepth + 1);
      if (childDepth > maxDepth) {
        maxDepth = childDepth;
      }
    }
  }

  return maxDepth;
}

/**
 * Count total fields recursively, including nested object fields.
 * Array elements count individually. Primitives count as 0.
 */
function countFields(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value !== 'object') return 0;

  if (Array.isArray(value)) {
    let count = value.length;
    for (const item of value) {
      if (item !== null && typeof item === 'object') {
        count += countFields(item);
      }
    }
    return count;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  let count = keys.length;

  for (const key of keys) {
    if (obj[key] !== null && typeof obj[key] === 'object') {
      count += countFields(obj[key]);
    }
  }

  return count;
}

/**
 * Assess the complexity of a data payload.
 *
 * Classification rules:
 * - null/undefined -> 'none'
 * - non-object primitives -> 'simple'
 * - depth <= 1, fields <= 5 -> 'simple'
 * - depth <= 3, fields <= 20 -> 'structured'
 * - else -> 'complex'
 *
 * @param payload - The data payload to assess
 * @returns The complexity classification
 */
export function assessDataComplexity(
  payload: unknown,
): FidelityDecision['data_complexity'] {
  if (payload === null || payload === undefined) return 'none';
  if (typeof payload !== 'object') return 'simple';

  const depth = measureDepth(payload);
  const fields = countFields(payload);

  if (depth <= SIMPLE_MAX_DEPTH && fields <= SIMPLE_MAX_FIELDS) return 'simple';
  if (depth <= STRUCTURED_MAX_DEPTH && fields <= STRUCTURED_MAX_FIELDS) return 'structured';
  return 'complex';
}

// ============================================================================
// Fidelity Change Clamping
// ============================================================================

/**
 * Clamp a proposed fidelity level change to at most 1 step from current.
 *
 * Enforces SAFE-02: max 1 level change per cycle. This prevents sudden
 * jumps from Level 0 to Level 3 (or vice versa), ensuring gradual
 * fidelity transitions.
 *
 * @param current - The current fidelity level
 * @param proposed - The proposed new fidelity level
 * @returns The clamped fidelity level (differs by at most 1 from current)
 */
export function clampFidelityChange(
  current: FidelityLevel,
  proposed: FidelityLevel,
): FidelityLevel {
  const diff = proposed - current;
  if (Math.abs(diff) <= 1) return proposed;

  if (diff > 0) {
    return (current + 1) as FidelityLevel;
  }
  return (current - 1) as FidelityLevel;
}

// ============================================================================
// Fidelity Decision
// ============================================================================

/**
 * Determine the appropriate fidelity level for a handoff.
 *
 * Decision tree (evaluated top-to-bottom, first match wins):
 * 1. safety_critical=true -> Level 3
 * 2. data_complexity='none' -> Level 0
 * 3. high drift (>0.3) + 3+ skills -> Level 3
 * 4. high drift (>0.3) + 1+ skills -> Level 2
 * 5. high drift (>0.3) + 0 skills -> Level 1
 * 6. medium drift (>0.15) + complex data + skills -> Level 3
 * 7. medium drift (>0.15) + complex data + no skills -> Level 2
 * 8. complex data (any drift) -> Level 2
 * 9. token budget < 20K -> cap at Level 1
 * 10. structured data + skills -> Level 2
 * 11. simple data -> Level 1
 * 12. default (structured data, no skills) -> Level 2
 *
 * @param input - The fidelity decision input factors
 * @returns The recommended fidelity level (0-3)
 */
export function determineFidelity(input: FidelityDecision): FidelityLevel {
  const {
    data_complexity,
    historical_drift_rate,
    available_skills,
    token_budget_remaining,
    safety_critical,
  } = input;

  // Rule 1: Safety-critical always gets maximum scaffolding
  if (safety_critical) return 3;

  // Rule 2: No data means prose-only is sufficient
  if (data_complexity === 'none') return 0;

  // Rule 9 (early): Token budget constraint caps everything at Level 1
  if (token_budget_remaining < LOW_TOKEN_BUDGET) return 1;

  // Rules 3-5: High drift rate
  if (historical_drift_rate > HIGH_DRIFT_THRESHOLD) {
    if (available_skills >= HIGH_DRIFT_L3_SKILLS) return 3;
    // High drift + complex data + any skills -> Level 3
    if (data_complexity === 'complex' && available_skills >= 1) return 3;
    if (available_skills >= 1) return 2;
    return 1;
  }

  // Rules 6-7: Medium drift + complex data
  if (historical_drift_rate > MEDIUM_DRIFT_THRESHOLD && data_complexity === 'complex') {
    if (available_skills > 0) return 3;
    return 2;
  }

  // Rule 8: Complex data regardless of drift
  if (data_complexity === 'complex') return 2;

  // Rule 10: Structured data with skills available
  if (data_complexity === 'structured' && available_skills > 0) return 2;

  // Rule 11: Simple data
  if (data_complexity === 'simple') return 1;

  // Rule 12: Default (structured data, no skills match)
  return 2;
}
