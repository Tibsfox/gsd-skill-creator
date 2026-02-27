/**
 * DACP Bundle validator.
 *
 * Validates bundle integrity through a multi-stage pipeline:
 * 1. Check .complete atomicity marker
 * 2. Parse and validate manifest.json against Zod schema
 * 3. Verify fidelity level matches actual directory contents
 * 4. Verify all referenced data/code files exist
 * 5. Enforce size limits (50KB data, 10KB per script, 100KB total)
 * 6. Calculate schema coverage
 * 7. Validate data payloads against referenced JSON schemas
 * 8. Enforce script provenance (SAFE-06)
 *
 * @module interpreter/validator
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  BundleManifestSchema,
  type BundleManifest,
  type BundleValidationResult,
  type ValidationError,
  type ValidationWarning,
  type FidelityLevel,
} from '../dacp/types.js';
import { DEFAULT_INTERPRETER_CONFIG, type InterpreterConfig } from './types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify that the claimed fidelity level matches actual bundle contents.
 */
function verifyFidelity(bundlePath: string, claimed: FidelityLevel): boolean {
  const hasData = existsSync(join(bundlePath, 'data'));
  const hasCode = existsSync(join(bundlePath, 'code'));
  const hasTests = existsSync(join(bundlePath, 'tests'));

  switch (claimed) {
    case 0:
      return true; // Prose only, always valid
    case 1:
      return hasData;
    case 2:
      return hasData; // Schema presence checked via schema_ref in manifest
    case 3:
      return hasData && hasCode;
    case 4:
      return hasData && hasCode && hasTests;
    default:
      return false;
  }
}

/**
 * Calculate total size of all files in a directory (recursive).
 */
function calculateDirSize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;

  let total = 0;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += calculateDirSize(fullPath);
    } else {
      total += statSync(fullPath).size;
    }
  }
  return total;
}

/**
 * Calculate total size of the entire bundle directory (recursive).
 */
function calculateBundleSize(bundlePath: string): number {
  return calculateDirSize(bundlePath);
}

/**
 * Calculate total size of the data/ directory.
 */
function calculateDataSize(bundlePath: string): number {
  return calculateDirSize(join(bundlePath, 'data'));
}

/**
 * Basic JSON Schema validation for data files.
 * Checks type constraints and required fields.
 */
function validateDataAgainstSchema(
  dataPath: string,
  schemaPath: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

    // Type check at top level
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (schema.type !== actualType) {
        errors.push({
          field: dataPath,
          message: `Schema validation failed: expected type '${schema.type}', got '${actualType}'`,
          severity: 'blocking',
        });
        return errors;
      }
    }

    // Required fields check
    if (schema.required && Array.isArray(schema.required) && typeof data === 'object' && data !== null) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push({
            field: `${dataPath}:${field}`,
            message: `Schema validation failed: missing required field '${field}'`,
            severity: 'blocking',
          });
        }
      }
    }

    // Property type checks
    if (schema.properties && typeof data === 'object' && data !== null) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const prop = propSchema as { type?: string };
          if (prop.type) {
            const value = (data as Record<string, unknown>)[key];
            const valueType = Array.isArray(value) ? 'array' : typeof value;
            if (prop.type !== valueType) {
              errors.push({
                field: `${dataPath}:${key}`,
                message: `Schema validation failed: field '${key}' expected type '${prop.type}', got '${valueType}'`,
                severity: 'blocking',
              });
            }
          }
        }
      }
    }
  } catch {
    errors.push({
      field: dataPath,
      message: `Schema validation failed: could not parse data or schema file`,
      severity: 'blocking',
    });
  }

  return errors;
}

// ============================================================================
// Main Validator
// ============================================================================

/**
 * Validate a DACP bundle directory.
 *
 * @param bundlePath - Absolute path to the bundle directory
 * @param config - Optional interpreter configuration overrides
 * @returns Validation result with errors, warnings, and coverage metrics
 */
export function validateBundle(
  bundlePath: string,
  config?: Partial<InterpreterConfig>,
): BundleValidationResult {
  const cfg = { ...DEFAULT_INTERPRETER_CONFIG, ...config };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let fidelityVerified = false;
  let schemaCoverage = 1.0;

  // --------------------------------------------------------------------------
  // 1. Check .complete marker (early exit on missing)
  // --------------------------------------------------------------------------
  if (!existsSync(join(bundlePath, '.complete'))) {
    return {
      valid: false,
      errors: [{
        field: '.complete',
        message: 'Bundle missing .complete atomicity marker -- bundle may be incomplete',
        severity: 'fatal',
      }],
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0,
    };
  }

  // --------------------------------------------------------------------------
  // 2. Validate manifest.json
  // --------------------------------------------------------------------------
  const manifestPath = join(bundlePath, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return {
      valid: false,
      errors: [{
        field: 'manifest.json',
        message: 'Bundle missing manifest.json -- cannot validate bundle',
        severity: 'fatal',
      }],
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0,
    };
  }

  let rawManifest: string;
  try {
    rawManifest = readFileSync(manifestPath, 'utf-8');
  } catch {
    return {
      valid: false,
      errors: [{
        field: 'manifest.json',
        message: 'Cannot read manifest.json',
        severity: 'fatal',
      }],
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawManifest);
  } catch {
    return {
      valid: false,
      errors: [{
        field: 'manifest.json',
        message: 'Malformed JSON in manifest.json -- cannot parse',
        severity: 'fatal',
      }],
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0,
    };
  }

  const zodResult = BundleManifestSchema.safeParse(parsedJson);
  if (!zodResult.success) {
    const zodErrors = zodResult.error.issues.map(issue => ({
      field: `manifest.json:${issue.path.join('.')}`,
      message: `Manifest schema validation failed: ${issue.message} at ${issue.path.join('.')}`,
      severity: 'fatal' as const,
    }));
    return {
      valid: false,
      errors: zodErrors,
      warnings: [],
      fidelity_verified: false,
      schema_coverage: 0,
    };
  }

  const manifest: BundleManifest = zodResult.data;

  // --------------------------------------------------------------------------
  // 3. Verify fidelity matches contents
  // --------------------------------------------------------------------------
  fidelityVerified = verifyFidelity(bundlePath, manifest.fidelity_level);
  if (!fidelityVerified && cfg.strictFidelityCheck) {
    errors.push({
      field: 'fidelity_level',
      message: `Fidelity mismatch: bundle claims Level ${manifest.fidelity_level} but contents do not match`,
      severity: 'blocking',
    });
  }

  // --------------------------------------------------------------------------
  // 4. Verify referenced files exist
  // --------------------------------------------------------------------------
  for (const [filename] of Object.entries(manifest.data_manifest)) {
    const filePath = join(bundlePath, 'data', filename);
    if (!existsSync(filePath)) {
      errors.push({
        field: `data_manifest.${filename}`,
        message: `Referenced data file missing: ${filename} not found in data/`,
        severity: 'blocking',
      });
    }
  }

  for (const [filename] of Object.entries(manifest.code_manifest)) {
    const filePath = join(bundlePath, 'code', filename);
    if (!existsSync(filePath)) {
      errors.push({
        field: `code_manifest.${filename}`,
        message: `Referenced code file missing: ${filename} not found in code/`,
        severity: 'blocking',
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. Enforce size limits
  // --------------------------------------------------------------------------
  const dataSize = calculateDataSize(bundlePath);
  if (dataSize > cfg.maxDataSizeBytes) {
    errors.push({
      field: 'data/',
      message: `Data size limit exceeded: ${dataSize} bytes > ${cfg.maxDataSizeBytes} bytes`,
      severity: 'blocking',
    });
  }

  for (const [filename] of Object.entries(manifest.code_manifest)) {
    const scriptPath = join(bundlePath, 'code', filename);
    if (existsSync(scriptPath)) {
      const scriptSize = statSync(scriptPath).size;
      if (scriptSize > cfg.maxScriptSizeBytes) {
        errors.push({
          field: `code/${filename}`,
          message: `Script size limit exceeded: ${filename} is ${scriptSize} bytes > ${cfg.maxScriptSizeBytes} bytes`,
          severity: 'blocking',
        });
      }
    }
  }

  const bundleSize = calculateBundleSize(bundlePath);
  if (bundleSize > cfg.maxBundleSizeBytes) {
    errors.push({
      field: 'bundle',
      message: `Bundle size limit exceeded: ${bundleSize} bytes > ${cfg.maxBundleSizeBytes} bytes`,
      severity: 'blocking',
    });
  }

  // --------------------------------------------------------------------------
  // 6. Calculate schema coverage
  // --------------------------------------------------------------------------
  const dataEntries = Object.entries(manifest.data_manifest);
  if (dataEntries.length === 0) {
    schemaCoverage = 1.0; // Vacuously true
  } else {
    const withSchema = dataEntries.filter(([, entry]) => entry.schema_ref && entry.schema_ref.length > 0);
    schemaCoverage = withSchema.length / dataEntries.length;
  }

  // --------------------------------------------------------------------------
  // 7. Validate data against schemas (INTERP-02)
  // --------------------------------------------------------------------------
  for (const [filename, entry] of dataEntries) {
    if (entry.schema_ref) {
      const dataFilePath = join(bundlePath, 'data', filename);
      const schemaFilePath = join(bundlePath, 'data', entry.schema_ref);
      if (existsSync(dataFilePath) && existsSync(schemaFilePath)) {
        const schemaErrors = validateDataAgainstSchema(dataFilePath, schemaFilePath);
        errors.push(...schemaErrors);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. Enforce script provenance (SAFE-06)
  // --------------------------------------------------------------------------
  for (const [filename, entry] of Object.entries(manifest.code_manifest)) {
    if (!entry.source_skill || entry.source_skill.trim() === '') {
      errors.push({
        field: `code_manifest.${filename}`,
        message: `Script ${filename} missing provenance (source skill required)`,
        severity: 'blocking',
      });
    } else if (!(entry.source_skill in manifest.provenance.skill_versions)) {
      warnings.push({
        field: `code_manifest.${filename}`,
        message: `Script ${filename}: source skill '${entry.source_skill}' not found in provenance.skill_versions`,
        suggestion: `Add '${entry.source_skill}' to provenance.skill_versions for complete traceability`,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 9. Return result
  // --------------------------------------------------------------------------
  // valid is true if no fatal or blocking errors
  const hasFatalOrBlocking = errors.some(e => e.severity === 'fatal' || e.severity === 'blocking');

  return {
    valid: !hasFatalOrBlocking,
    errors,
    warnings,
    fidelity_verified: fidelityVerified,
    schema_coverage: schemaCoverage,
  };
}
