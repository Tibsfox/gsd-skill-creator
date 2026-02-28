/**
 * Pipeline YAML parser and serializer.
 *
 * Parses YAML Pipeline files into validated Pipeline typed objects
 * with structured error reporting. Handles YAML kebab-case to TypeScript
 * camelCase key mapping. Provides round-trip serialization back to YAML.
 *
 * Uses js-yaml for YAML parsing and PipelineSchema for Zod validation.
 */

import yaml from 'js-yaml';
import { PipelineSchema } from './schema.js';
import type { Pipeline } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Structured error from parsing a Pipeline.
 */
export interface PipelineParseError {
  /** Human-readable error description. */
  message: string;

  /** Dot-separated path to the failing field (e.g., 'instructions.0.type'). */
  path?: string;

  /** Line number in the source YAML where the error occurred. */
  line?: number;
}

/**
 * Result of parsing a Pipeline YAML string.
 * Discriminated union: check `success` to narrow the type.
 */
export type PipelineParseResult =
  | { success: true; data: Pipeline }
  | { success: false; errors: PipelineParseError[] };

// ============================================================================
// Key Mapping Helpers
// ============================================================================

/**
 * Convert a kebab-case string to camelCase.
 * e.g., 'source-patterns' -> 'sourcePatterns'
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Convert a camelCase string to kebab-case.
 * e.g., 'sourcePatterns' -> 'source-patterns'
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Recursively map object keys using a transform function.
 *
 * - Recurses into objects, converting keys
 * - Recurses into arrays, mapping each element
 * - Leaves primitives unchanged
 * - Only converts object KEYS, never string values
 */
function mapKeys(
  value: unknown,
  transform: (key: string) => string,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapKeys(item, transform));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const newKey = transform(key);
      result[newKey] = mapKeys(val, transform);
    }
    return result;
  }

  // Primitives (string, number, boolean) pass through unchanged
  return value;
}

/**
 * Recursively strip null values from an object.
 *
 * YAML parses `~` and `null` keywords as JavaScript `null`, but Zod's
 * `.optional()` expects `undefined` (not `null`) for absent fields.
 * Stripping nulls before validation lets YAML null values act as "absent".
 */
function stripNulls(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripNulls(item));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== null) {
        result[key] = stripNulls(val);
      }
      // Omit null-valued keys entirely (they become undefined/absent)
    }
    return result;
  }

  return value;
}

// ============================================================================
// Parser
// ============================================================================

/**
 * Parse a YAML string into a validated Pipeline object.
 *
 * Steps:
 * 1. Reject empty/falsy input
 * 2. Parse YAML with js-yaml (catches syntax errors)
 * 3. Verify raw result is an object (not string, array, null)
 * 4. Convert kebab-case keys to camelCase
 * 5. Validate with Zod PipelineSchema
 * 6. Return typed Pipeline or structured errors
 *
 * @param input - Raw YAML string containing a Pipeline
 * @returns Parse result with validated Pipeline or structured errors
 */
export function parsePipeline(input: string): PipelineParseResult {
  // 1. Handle empty/falsy input
  if (!input || !input.trim()) {
    return { success: false, errors: [{ message: 'Empty input' }] };
  }

  // 2. Parse YAML
  let raw: unknown;
  try {
    raw = yaml.load(input, { schema: yaml.DEFAULT_SCHEMA });
  } catch (err) {
    const yamlErr = err as yaml.YAMLException;
    return {
      success: false,
      errors: [{
        message: `YAML syntax error: ${yamlErr.message}`,
        line: yamlErr.mark?.line,
      }],
    };
  }

  // 3. Check raw is a plain object (not null, array, string, number)
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      errors: [{
        message: 'Pipeline must be a YAML object with metadata and instructions fields',
      }],
    };
  }

  // 4. Convert kebab-case keys to camelCase and strip YAML nulls
  const mapped = stripNulls(mapKeys(raw, kebabToCamel));

  // 5. Validate with Zod schema
  const result = PipelineSchema.safeParse(mapped);
  if (!result.success) {
    // Convert Zod errors to PipelineParseError[]
    const errors: PipelineParseError[] = result.error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.join('.'),
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data as Pipeline };
}

// ============================================================================
// Serializer
// ============================================================================

/**
 * Serialize a Pipeline object back to YAML string.
 *
 * Converts camelCase TypeScript keys back to kebab-case for YAML output.
 * Uses js-yaml.dump with readable formatting options.
 *
 * @param list - Validated Pipeline object
 * @returns YAML string representation with kebab-case keys
 */
export function serializePipeline(list: Pipeline): string {
  const mapped = mapKeys(list, camelToKebab);
  return yaml.dump(mapped, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '\'',
    forceQuotes: false,
  });
}
