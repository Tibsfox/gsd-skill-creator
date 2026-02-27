/**
 * DACP (Deterministic Agent Communication Protocol) module.
 *
 * Re-exports all types, schemas, constants, and functions from the
 * DACP type system. This is the primary entry point for consumers.
 *
 * @module dacp
 */

export * from './types.js';
export { generateDACPSchemas, SCHEMA_CONFIGS } from './schema-generator.js';
export type { SchemaConfig } from './schema-generator.js';
