/**
 * YAML gate config loader and file-level validator.
 *
 * Reads artifact gate definitions from YAML strings or files,
 * parses them, validates against GateConfigSchema, and returns
 * typed results with actionable error messages for misconfigurations.
 *
 * @module autonomy/gate-loader
 */

import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { validateGateConfig } from './schema-validation.js';
import type { GateConfig } from './schema-validation.js';

// ============================================================================
// GateLoadResult type
// ============================================================================

/**
 * Discriminated union for gate config loading outcomes.
 *
 * Success: parsed and validated GateConfig ready for use.
 * Failure: array of human-readable error strings.
 */
export type GateLoadResult =
  | { success: true; config: GateConfig }
  | { success: false; errors: string[] };

// ============================================================================
// loadGateConfig
// ============================================================================

/**
 * Parses a YAML string and validates it against GateConfigSchema.
 *
 * Handles three categories of errors:
 * 1. Empty input — caught before YAML parsing
 * 2. YAML syntax errors — caught with clear parse error message
 * 3. Schema validation errors — field-level errors from Zod
 *
 * @param yamlContent - Raw YAML string to parse
 * @returns GateLoadResult with typed config or error array
 */
export function loadGateConfig(yamlContent: string): GateLoadResult {
  // Check for empty input before YAML parsing
  if (!yamlContent || yamlContent.trim().length === 0) {
    return {
      success: false,
      errors: ['Gate config is empty — expected YAML content with version, milestone, milestone_type, and gates fields'],
    };
  }

  // Parse YAML, catching syntax errors
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [`YAML parse error: ${message}`],
    };
  }

  // Validate parsed object against GateConfigSchema
  const result = validateGateConfig(parsed);

  if (result.success) {
    return { success: true, config: result.data };
  }

  return { success: false, errors: result.errors };
}

// ============================================================================
// validateGateConfigFile
// ============================================================================

/**
 * Reads a gate config file from disk, parses, and validates it.
 *
 * Returns the same GateLoadResult as loadGateConfig, but with
 * file path context prefixed to error messages for traceability.
 *
 * @param filePath - Path to the YAML gate config file
 * @returns Promise<GateLoadResult> with typed config or path-prefixed errors
 */
export async function validateGateConfigFile(filePath: string): Promise<GateLoadResult> {
  // Read file, catching ENOENT with clear error
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return {
        success: false,
        errors: [`${filePath}: File not found`],
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errors: [`${filePath}: ${message}`],
    };
  }

  // Parse and validate using loadGateConfig
  const result = loadGateConfig(content);

  if (result.success) {
    return result;
  }

  // Prefix each error with file path for context
  return {
    success: false,
    errors: result.errors.map((e) => `${filePath}: ${e}`),
  };
}
