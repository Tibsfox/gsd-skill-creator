/**
 * ME-5 Output-Structure Declaration — Frontmatter validator.
 *
 * Validates a raw (untyped) `output_structure:` frontmatter value against the
 * schema defined in `schema.ts`.  Hand-rolled validation — no external
 * schema-validation library (zero external runtime deps per milestone
 * constraint).
 *
 * @module output-structure/validator
 */

import type { OutputStructure, OutputStructureKind } from './schema.js';
import { OUTPUT_STRUCTURE_KINDS } from './schema.js';

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  /** True when the value conforms to `OutputStructure`. */
  valid: boolean;
  /** Non-fatal warnings (present even when `valid` is true). */
  warnings: string[];
  /** Fatal errors; non-empty implies `valid === false`. */
  errors: string[];
  /** The typed value when `valid`; undefined otherwise. */
  value?: OutputStructure;
}

// ---------------------------------------------------------------------------
// Core validator
// ---------------------------------------------------------------------------

/**
 * Validate an unknown `output_structure` frontmatter value.
 *
 * Returns a `ValidationResult` describing whether the value is valid and,
 * if so, the typed `OutputStructure`.  Invalid values produce errors; the
 * caller decides whether to fatal or warn based on the milestone policy
 * (warnings until one milestone after ME-5 lands, then errors).
 *
 * Accepts three forms of valid input:
 *   1. `{kind: 'prose'}` — no additional fields required.
 *   2. `{kind: 'json-schema', schema: '<non-empty string>'}`.
 *   3. `{kind: 'markdown-template', template: '<non-empty string>'}`.
 *
 * String shorthand (just the kind name) is also accepted for author
 * convenience and normalized to the full object form.
 */
export function validateOutputStructure(raw: unknown): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Shorthand: plain string value like `output_structure: prose`
  if (typeof raw === 'string') {
    const kind = raw.trim() as OutputStructureKind;
    if (!OUTPUT_STRUCTURE_KINDS.includes(kind)) {
      errors.push(
        `output_structure: invalid kind "${raw}". Valid kinds: ${OUTPUT_STRUCTURE_KINDS.join(', ')}`,
      );
      return { valid: false, warnings, errors };
    }
    if (kind === 'json-schema') {
      warnings.push(
        'output_structure: json-schema shorthand omits required "schema" field. ' +
          'Use object form: {kind: "json-schema", schema: "<description>"}',
      );
      // Still valid — schema defaults to empty string with a warning
      return { valid: true, warnings, errors, value: { kind: 'json-schema', schema: '' } };
    }
    if (kind === 'markdown-template') {
      warnings.push(
        'output_structure: markdown-template shorthand omits required "template" field. ' +
          'Use object form: {kind: "markdown-template", template: "<template>"}',
      );
      return { valid: true, warnings, errors, value: { kind: 'markdown-template', template: '' } };
    }
    // prose
    return { valid: true, warnings, errors, value: { kind: 'prose' } };
  }

  // Must be a plain object
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(
      'output_structure: expected an object or string shorthand; ' +
        `got ${raw === null ? 'null' : Array.isArray(raw) ? 'array' : typeof raw}`,
    );
    return { valid: false, warnings, errors };
  }

  const obj = raw as Record<string, unknown>;

  // `kind` is required
  if (!('kind' in obj)) {
    errors.push('output_structure: missing required field "kind"');
    return { valid: false, warnings, errors };
  }

  const kind = obj.kind;
  if (typeof kind !== 'string' || !OUTPUT_STRUCTURE_KINDS.includes(kind as OutputStructureKind)) {
    errors.push(
      `output_structure.kind: invalid value "${String(kind)}". ` +
        `Valid kinds: ${OUTPUT_STRUCTURE_KINDS.join(', ')}`,
    );
    return { valid: false, warnings, errors };
  }

  // Warn on unknown extra fields (additive — they are preserved, not stripped)
  const knownFields: Record<OutputStructureKind, Set<string>> = {
    'json-schema': new Set(['kind', 'schema']),
    'markdown-template': new Set(['kind', 'template']),
    prose: new Set(['kind']),
  };
  const known = knownFields[kind as OutputStructureKind];
  for (const field of Object.keys(obj)) {
    if (!known.has(field)) {
      warnings.push(`output_structure: unexpected field "${field}" for kind "${kind}" (will be ignored)`);
    }
  }

  switch (kind as OutputStructureKind) {
    case 'prose': {
      return { valid: true, warnings, errors, value: { kind: 'prose' } };
    }

    case 'json-schema': {
      const schema = obj.schema;
      if (schema === undefined || schema === null) {
        errors.push('output_structure: json-schema requires a non-empty "schema" field');
        return { valid: false, warnings, errors };
      }
      if (typeof schema !== 'string') {
        errors.push(`output_structure.schema: expected string, got ${typeof schema}`);
        return { valid: false, warnings, errors };
      }
      if (schema.trim().length === 0) {
        warnings.push('output_structure.schema: empty schema string — ME-1 will treat this as partially tractable');
      }
      return { valid: true, warnings, errors, value: { kind: 'json-schema', schema } };
    }

    case 'markdown-template': {
      const template = obj.template;
      if (template === undefined || template === null) {
        errors.push('output_structure: markdown-template requires a non-empty "template" field');
        return { valid: false, warnings, errors };
      }
      if (typeof template !== 'string') {
        errors.push(`output_structure.template: expected string, got ${typeof template}`);
        return { valid: false, warnings, errors };
      }
      if (template.trim().length === 0) {
        warnings.push('output_structure.template: empty template string — ME-1 will treat this as partially tractable');
      }
      return { valid: true, warnings, errors, value: { kind: 'markdown-template', template } };
    }

    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = kind as never;
      void _exhaustive;
      errors.push(`output_structure.kind: unhandled kind "${String(kind)}"`);
      return { valid: false, warnings, errors };
    }
  }
}

/**
 * Convenience wrapper that returns only the typed value or `undefined` on
 * validation failure.  Callers that do not need error/warning detail use this.
 */
export function parseOutputStructure(raw: unknown): OutputStructure | undefined {
  const result = validateOutputStructure(raw);
  return result.valid ? result.value : undefined;
}
