/**
 * Copper List YAML parser and serializer.
 *
 * Parses YAML Copper List files into validated CopperList typed objects
 * with structured error reporting. Handles YAML kebab-case to TypeScript
 * camelCase key mapping. Provides round-trip serialization back to YAML.
 *
 * Uses js-yaml for YAML parsing and CopperListSchema for Zod validation.
 */

import type { CopperList } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Structured error from parsing a Copper List.
 */
export interface CopperParseError {
  /** Human-readable error description. */
  message: string;

  /** Dot-separated path to the failing field (e.g., 'instructions.0.type'). */
  path?: string;

  /** Line number in the source YAML where the error occurred. */
  line?: number;
}

/**
 * Result of parsing a Copper List YAML string.
 * Discriminated union: check `success` to narrow the type.
 */
export type CopperParseResult =
  | { success: true; data: CopperList }
  | { success: false; errors: CopperParseError[] };

// ============================================================================
// Parser (stub)
// ============================================================================

/**
 * Parse a YAML string into a validated CopperList object.
 *
 * @param _yaml - Raw YAML string containing a Copper List
 * @returns Parse result with validated CopperList or structured errors
 */
export function parseCopperList(_yaml: string): CopperParseResult {
  return { success: false, errors: [{ message: 'Not implemented' }] };
}

// ============================================================================
// Serializer (stub)
// ============================================================================

/**
 * Serialize a CopperList object back to YAML string.
 *
 * @param _list - Validated CopperList object
 * @returns YAML string representation with kebab-case keys
 */
export function serializeCopperList(_list: CopperList): string {
  return '';
}
