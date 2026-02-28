/**
 * ICD validation suite and cross-reference checker.
 *
 * Provides three validation functions:
 * - validateICD(): validates a single ICD's meta consistency with its schemas
 * - crossReferenceCheck(): verifies all ICDs against agent registry and routing table
 * - validateAllICDs(): aggregate validation across all 4 ICDs
 *
 * Used by OPS-2 (Schema validation & integration tests) to ensure ICDs
 * remain consistent with the shared type system and agent registry.
 */

import type { ZodTypeAny } from 'zod';
import { AGENT_REGISTRY, ROUTING_TABLE } from '../agent-registry.js';
import { ALL_ICD_META, ALL_ICD_SCHEMAS } from './index.js';

// ============================================================================
// Types
// ============================================================================

/** ICD metadata structure. */
export interface ICDMeta {
  readonly id: string;
  readonly name: string;
  readonly parties: readonly string[];
  readonly event_types: readonly string[];
}

/** A single validation error. */
export interface ICDValidationError {
  icd_id: string;
  event_type?: string;
  field?: string;
  message: string;
}

/** Result of validating a single ICD. */
export interface ICDValidationResult {
  valid: boolean;
  errors: ICDValidationError[];
}

/** Result of cross-referencing all ICDs against registry and routing table. */
export interface CrossReferenceResult {
  valid: boolean;
  errors: ICDValidationError[];
  warnings: ICDValidationError[];
}

/** Aggregate result across all ICDs. */
export interface AggregateValidationResult {
  valid: boolean;
  icd_results: Record<string, ICDValidationResult>;
  cross_reference: CrossReferenceResult;
  total_event_types: number;
  total_errors: number;
  total_warnings: number;
}

// ============================================================================
// Valid components
// ============================================================================

/** Known AMIGA component identifiers. */
const VALID_COMPONENTS = new Set(['MC-1', 'ME-1', 'CE-1', 'GL-1']);

// ============================================================================
// validateICD
// ============================================================================

/**
 * Validate a single ICD's metadata consistency with its schemas.
 *
 * Checks:
 * - meta.parties is non-empty
 * - meta.event_types matches Object.keys(schemas)
 * - Each schema has a safeParse method (is a valid Zod schema)
 *
 * @param meta - ICD metadata object
 * @param schemas - Record mapping event type strings to Zod schemas
 * @returns Validation result with errors list
 */
export function validateICD(
  meta: ICDMeta,
  schemas: Record<string, unknown>,
): ICDValidationResult {
  const errors: ICDValidationError[] = [];

  // Check parties is non-empty
  if (meta.parties.length === 0) {
    errors.push({
      icd_id: meta.id,
      message: `${meta.id} has empty parties array`,
    });
  }

  // Check event_types match schema keys
  const schemaKeys = new Set(Object.keys(schemas));
  for (const eventType of meta.event_types) {
    if (!schemaKeys.has(eventType)) {
      errors.push({
        icd_id: meta.id,
        event_type: eventType,
        message: `${meta.id} event_types lists '${eventType}' but no matching schema found in schemas`,
      });
    }
  }

  // Check for schema keys not in event_types
  const eventTypeSet = new Set(meta.event_types as readonly string[]);
  for (const key of schemaKeys) {
    if (!eventTypeSet.has(key)) {
      errors.push({
        icd_id: meta.id,
        event_type: key,
        message: `${meta.id} schemas has key '${key}' not listed in event_types`,
      });
    }
  }

  // Check each schema has safeParse method
  for (const [eventType, schema] of Object.entries(schemas)) {
    if (
      !schema ||
      typeof schema !== 'object' ||
      typeof (schema as ZodTypeAny).safeParse !== 'function'
    ) {
      errors.push({
        icd_id: meta.id,
        event_type: eventType,
        message: `${meta.id} schema for '${eventType}' does not have a safeParse method (not a valid Zod schema)`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// crossReferenceCheck
// ============================================================================

/**
 * Cross-reference all ICDs against the agent registry and routing table.
 *
 * Checks:
 * - Each ICD party maps to a known component (MC-1, ME-1, CE-1, GL-1)
 * - Each event type in all ICDs has a ROUTING_TABLE entry
 * - Orphaned event types (in ROUTING_TABLE but not in any ICD) reported as warnings
 *
 * @param allMeta - Array of ICD metadata objects
 * @param allSchemas - Combined schema mapping across all ICDs
 * @returns Cross-reference result with errors and warnings
 */
export function crossReferenceCheck(
  allMeta: readonly ICDMeta[],
  allSchemas: Record<string, unknown>,
): CrossReferenceResult {
  const errors: ICDValidationError[] = [];
  const warnings: ICDValidationError[] = [];

  // Check each ICD party maps to a known component
  for (const meta of allMeta) {
    for (const party of meta.parties) {
      if (!VALID_COMPONENTS.has(party)) {
        errors.push({
          icd_id: meta.id,
          message: `${meta.id} references unknown party '${party}' (valid: ${[...VALID_COMPONENTS].join(', ')})`,
        });
      }
    }
  }

  // Check each event type has a routing table entry
  // Event types in ICDs but not in the routing table are warnings (may use
  // implicit correlation-based routing for response events), not errors.
  const allIcdEventTypes = new Set<string>();
  for (const meta of allMeta) {
    for (const eventType of meta.event_types) {
      allIcdEventTypes.add(eventType);
      if (!ROUTING_TABLE.has(eventType)) {
        warnings.push({
          icd_id: meta.id,
          event_type: eventType,
          message: `Event type '${eventType}' in ${meta.id} has no ROUTING_TABLE entry (may use implicit routing)`,
        });
      }
    }
  }

  // Check for orphaned routing table entries (in table but not in any ICD)
  for (const eventType of ROUTING_TABLE.keys()) {
    if (!allIcdEventTypes.has(eventType)) {
      warnings.push({
        icd_id: 'cross-reference',
        event_type: eventType,
        message: `Orphaned event type '${eventType}' in ROUTING_TABLE but not in any ICD`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// validateAllICDs
// ============================================================================

/**
 * Run full validation and cross-reference across all 4 ICDs.
 *
 * Combines per-ICD validation with cross-reference checking to produce
 * an aggregate result.
 *
 * @returns Aggregate validation result with per-ICD results, cross-reference,
 *          and summary counts
 */
export function validateAllICDs(): AggregateValidationResult {
  const icdResults: Record<string, ICDValidationResult> = {};

  // Per-ICD schema mappings for individual validation
  const icdSchemaMap: Record<string, Record<string, unknown>> = {};
  for (const meta of ALL_ICD_META) {
    const schemas: Record<string, unknown> = {};
    for (const eventType of meta.event_types) {
      if (eventType in ALL_ICD_SCHEMAS) {
        schemas[eventType] = ALL_ICD_SCHEMAS[eventType as keyof typeof ALL_ICD_SCHEMAS];
      }
    }
    icdSchemaMap[meta.id] = schemas;
  }

  // Validate each ICD individually
  let totalErrors = 0;
  let totalEventTypes = 0;
  for (const meta of ALL_ICD_META) {
    const result = validateICD(meta, icdSchemaMap[meta.id]);
    icdResults[meta.id] = result;
    totalErrors += result.errors.length;
    totalEventTypes += meta.event_types.length;
  }

  // Cross-reference check
  const crossRef = crossReferenceCheck(ALL_ICD_META, ALL_ICD_SCHEMAS);
  totalErrors += crossRef.errors.length;

  return {
    valid: totalErrors === 0,
    icd_results: icdResults,
    cross_reference: crossRef,
    total_event_types: totalEventTypes,
    total_errors: totalErrors,
    total_warnings: crossRef.warnings.length,
  };
}
