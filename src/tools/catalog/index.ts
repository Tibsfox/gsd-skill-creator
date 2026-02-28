/**
 * Barrel export for the catalog module.
 *
 * Provides unified API for ScriptCatalog, SchemaLibrary, and the
 * unified indexer. Re-exports DACP foundation types used by consumers.
 *
 * @module catalog
 */

export { ScriptCatalog } from './script-catalog.js';
export { SchemaLibrary } from './schema-library.js';
export { indexSkills } from './indexer.js';
export type {
  CatalogSearchQuery,
  SchemaSearchQuery,
  IndexResult,
  CatalogPersistenceData,
  SchemaPersistenceData,
} from './types.js';
// Re-export DACP types used by consumers
export type { ScriptCatalogEntry, SchemaLibraryEntry, ScriptFunction } from '../../dacp/types.js';
