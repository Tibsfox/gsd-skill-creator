// Registry validator — validates domain data files against the MFE JSON schema.
//
// Uses ajv (Another JSON Validator) with the primitive-registry schema.
// Provides both file-level and single-primitive validation.

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// === Public types ===

export interface ValidationError {
  path: string;       // JSON pointer to the failing field
  message: string;    // Human-readable error description
  keyword: string;    // Schema keyword that failed (e.g., "minimum", "required")
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  primitiveCount?: number; // Only for file validation
}

// === Schema loading ===

const require = createRequire(import.meta.url);
const schema = require('../../schemas/primitive-registry.schema.json');

// Compile the schema once and cache
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateDomainSchema = ajv.compile(schema);

// Extract the primitive sub-schema for single-primitive validation
const primitiveSchema = schema.$defs?.MathematicalPrimitive;
const validatePrimitiveSchema = primitiveSchema
  ? ajv.compile({
      ...primitiveSchema,
      $defs: schema.$defs,
    })
  : null;

// === Error formatting ===

function formatErrors(ajvErrors: typeof validateDomainSchema.errors): ValidationError[] {
  if (!ajvErrors) return [];
  return ajvErrors.map((err) => ({
    path: err.instancePath || '/',
    message: err.message
      ? `${err.instancePath || '/'}: ${err.message}`
      : `${err.instancePath || '/'}: validation failed (${err.keyword})`,
    keyword: err.keyword,
  }));
}

// === Public API ===

/**
 * Validate a single primitive object against the MFE schema.
 */
export function validatePrimitive(primitive: unknown): ValidationResult {
  if (!validatePrimitiveSchema) {
    return {
      valid: false,
      errors: [{ path: '/', message: 'Primitive schema not found in registry schema', keyword: 'internal' }],
    };
  }

  const valid = validatePrimitiveSchema(primitive);
  return {
    valid: valid as boolean,
    errors: valid ? [] : formatErrors(validatePrimitiveSchema.errors),
  };
}

/**
 * Validate a domain data file (JSON) against the MFE schema.
 * Reads the file from disk, parses JSON, and validates.
 */
export async function validateDomainFile(filePath: string): Promise<ValidationResult> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      errors: [{ path: '/', message: `File read error: ${msg}`, keyword: 'file' }],
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      errors: [{ path: '/', message: `JSON parse error: ${msg}`, keyword: 'parse' }],
    };
  }

  const valid = validateDomainSchema(data);
  const primitiveCount =
    data && typeof data === 'object' && 'primitives' in data && Array.isArray((data as Record<string, unknown>).primitives)
      ? ((data as Record<string, unknown>).primitives as unknown[]).length
      : 0;

  return {
    valid: valid as boolean,
    errors: valid ? [] : formatErrors(validateDomainSchema.errors),
    primitiveCount,
  };
}
