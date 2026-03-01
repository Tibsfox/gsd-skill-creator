/**
 * Gate enforcement engine for artifact verification.
 *
 * Checks artifacts against loaded gate definitions, producing
 * structured pass/fail results with actionable error messages.
 * Pre-commit hooks and phase-completion checks call this module.
 *
 * @module autonomy/gate-enforcer
 */

import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { GateDefinition, GateResult, GateType } from './types.js';
import type { GateConfig } from './schema-validation.js';

// ============================================================================
// GateEnforcementResult type
// ============================================================================

/**
 * Aggregated result from running all gates of a given type.
 *
 * `passed` is false only when blocking_failures is non-empty.
 * Non-blocking failures appear in `warnings` but do not block.
 */
export interface GateEnforcementResult {
  /** True if no blocking gate failures occurred */
  passed: boolean;
  /** All gate results (both passed and failed) */
  results: GateResult[];
  /** Gate results that are blocking AND failed */
  blocking_failures: GateResult[];
  /** Gate results that are non-blocking AND failed (advisory) */
  warnings: GateResult[];
}

// ============================================================================
// Path pattern expansion
// ============================================================================

/**
 * Expands {key} placeholders in a path pattern using the context map.
 *
 * Unmatched placeholders are left as-is (they may be glob patterns
 * or literal brace expressions).
 *
 * @param pattern - Path pattern with {key} placeholders
 * @param context - Map of placeholder names to values
 * @returns Expanded path pattern
 */
export function expandPathPattern(
  pattern: string,
  context: Record<string, string> = {},
): string {
  return pattern.replace(/\{(\w+)\}/g, (match, key: string) => {
    return key in context ? context[key] : match;
  });
}

// ============================================================================
// checkArtifact
// ============================================================================

/**
 * Checks a single artifact against its gate definition.
 *
 * Evaluates:
 * 1. File existence at the expanded path
 * 2. File size against min_size_bytes threshold
 * 3. Content regex checks (required and optional)
 *
 * @param definition - Gate definition specifying what to check
 * @param basePath - Base directory for resolving relative paths
 * @param context - Optional map for path pattern variable expansion
 * @returns GateResult with pass/fail status and details
 */
export async function checkArtifact(
  definition: GateDefinition,
  basePath: string,
  context: Record<string, string> = {},
): Promise<GateResult> {
  const expandedPattern = expandPathPattern(definition.path_pattern, context);
  const fullPath = resolve(basePath, expandedPattern);
  const details: string[] = [];

  // Check file existence
  let fileStats;
  try {
    fileStats = await stat(fullPath);
  } catch {
    return {
      gate_name: definition.name,
      gate_type: 'per_subversion' as GateType,
      passed: false,
      message: `Missing artifact: expected file matching '${definition.path_pattern}' at '${fullPath}'`,
      details: [`File not found: ${fullPath}`],
      checked_path: fullPath,
    };
  }

  // Check file size
  const fileSize = fileStats.size;
  if (fileSize < definition.min_size_bytes) {
    return {
      gate_name: definition.name,
      gate_type: 'per_subversion' as GateType,
      passed: false,
      message: `Artifact '${definition.name}' is too small: ${fileSize} bytes < minimum ${definition.min_size_bytes} bytes`,
      details: [`Size ${fileSize} bytes < minimum ${definition.min_size_bytes} bytes`],
      checked_path: fullPath,
    };
  }

  // Read file content for content checks
  let content: string;
  try {
    content = await readFile(fullPath, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      gate_name: definition.name,
      gate_type: 'per_subversion' as GateType,
      passed: false,
      message: `Cannot read artifact '${definition.name}': ${message}`,
      details: [`Read error: ${message}`],
      checked_path: fullPath,
    };
  }

  // Run content checks
  let hasRequiredFailures = false;
  for (const check of definition.content_checks) {
    try {
      const regex = new RegExp(check.pattern, 'm');
      const matches = regex.test(content);

      if (!matches && check.required) {
        hasRequiredFailures = true;
        const desc = check.description || check.pattern;
        details.push(`Required section missing: ${desc}`);
      } else if (!matches && !check.required) {
        const desc = check.description || check.pattern;
        details.push(`Advisory check not matched: ${desc}`);
      }
    } catch {
      details.push(`Invalid regex pattern: ${check.pattern}`);
      if (check.required) {
        hasRequiredFailures = true;
      }
    }
  }

  if (hasRequiredFailures) {
    return {
      gate_name: definition.name,
      gate_type: 'per_subversion' as GateType,
      passed: false,
      message: `Artifact '${definition.name}' missing required content sections`,
      details,
      checked_path: fullPath,
    };
  }

  return {
    gate_name: definition.name,
    gate_type: 'per_subversion' as GateType,
    passed: true,
    message: `Artifact '${definition.name}' passed all checks`,
    details: details.length > 0 ? details : undefined,
    checked_path: fullPath,
  };
}

// ============================================================================
// evaluateAppliesWhen
// ============================================================================

/**
 * Evaluates the applies_when condition against the context.
 *
 * Simple key-presence check: if applies_when is a string key,
 * check whether that key exists and is truthy in the context.
 *
 * @param appliesWhen - Condition string from gate definition
 * @param context - Context map to evaluate against
 * @returns true if the gate should be applied
 */
function evaluateAppliesWhen(
  appliesWhen: string | undefined,
  context: Record<string, string>,
): boolean {
  if (!appliesWhen) return true;

  // Simple key-presence check
  const value = context[appliesWhen];
  return value !== undefined && value !== '' && value !== 'false';
}

// ============================================================================
// enforceGates
// ============================================================================

/**
 * Runs all gates of the specified type against artifacts.
 *
 * Collects ALL gate results before returning (does not short-circuit
 * on first failure). Separates blocking failures from non-blocking
 * warnings.
 *
 * @param config - Loaded and validated gate configuration
 * @param gateType - Which category of gates to run
 * @param basePath - Base directory for resolving artifact paths
 * @param context - Optional map for path pattern expansion and applies_when evaluation
 * @returns GateEnforcementResult with all results categorized
 */
export async function enforceGates(
  config: GateConfig,
  gateType: GateType,
  basePath: string,
  context: Record<string, string> = {},
): Promise<GateEnforcementResult> {
  const gates = config.gates[gateType] || [];
  const results: GateResult[] = [];
  const blockingFailures: GateResult[] = [];
  const warnings: GateResult[] = [];

  for (const gate of gates) {
    // Check applies_when condition
    if (!evaluateAppliesWhen(gate.applies_when, context)) {
      continue;
    }

    const result = await checkArtifact(gate, basePath, context);
    // Set the correct gate_type on the result
    result.gate_type = gateType;
    results.push(result);

    if (!result.passed) {
      if (gate.blocking) {
        blockingFailures.push(result);
      } else {
        warnings.push(result);
      }
    }
  }

  return {
    passed: blockingFailures.length === 0,
    results,
    blocking_failures: blockingFailures,
    warnings,
  };
}
