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
export {
  createBundle,
  generateBundleName,
  isBundleComplete,
  listBundleContents,
  BUNDLE_LAYOUT,
  MAX_DATA_SIZE,
  MAX_SCRIPT_SIZE,
  MAX_MANIFEST_SIZE,
  MAX_INTENT_SIZE,
  MAX_BUNDLE_SIZE,
} from './bundle.js';
export type { CreateBundleOptions, BundleContents } from './bundle.js';
export { bundleToMsgContent, generateMsgFallback } from './msg-fallback.js';
export type { MsgFallbackOptions } from './msg-fallback.js';
