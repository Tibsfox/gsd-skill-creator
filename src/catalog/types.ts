/**
 * Catalog-specific types and interfaces shared across the catalog module.
 *
 * Re-exports ScriptCatalogEntry and SchemaLibraryEntry from the DACP
 * foundation types. Adds catalog-specific query, result, and persistence
 * interfaces used by ScriptCatalog, SchemaLibrary, and the unified indexer.
 *
 * @module catalog/types
 */

// Re-export DACP foundation types used by catalog consumers
export type {
  ScriptCatalogEntry,
  SchemaLibraryEntry,
  ScriptFunction,
} from '../dacp/types.js';

/**
 * Query interface for searching the script catalog.
 * All fields are optional; when multiple are provided, AND logic applies.
 */
export interface CatalogSearchQuery {
  /** Filter by script function type */
  function_type?: 'parser' | 'validator' | 'transformer' | 'formatter' | 'analyzer' | 'generator';
  /** Filter by data types the script operates on */
  data_types?: string[];
  /** If true, return only deterministic scripts */
  deterministic_only?: boolean;
  /** Minimum success rate threshold (0.0-1.0) */
  min_success_rate?: number;
}

/**
 * Query interface for searching the schema library.
 * All fields are optional; when multiple are provided, AND logic applies.
 */
export interface SchemaSearchQuery {
  /** Filter by data type */
  data_type?: string;
  /** Filter by field names present in the schema */
  fields?: string[];
  /** Regex pattern to match against schema name */
  name_pattern?: string;
}

/**
 * Result of an indexing operation across skill directories.
 */
export interface IndexResult {
  /** Number of scripts indexed */
  scripts_indexed: number;
  /** Number of schemas indexed */
  schemas_indexed: number;
  /** Number of skill directories scanned */
  skills_scanned: number;
  /** Error messages for any failures during indexing */
  errors: string[];
  /** Time taken in milliseconds */
  duration_ms: number;
}

/**
 * Persistence format for script catalog data.
 */
export interface CatalogPersistenceData {
  /** Format version */
  version: string;
  /** Serialized catalog entries */
  entries: import('../dacp/types.js').ScriptCatalogEntry[];
  /** ISO 8601 timestamp of last build */
  last_built: string;
}

/**
 * Persistence format for schema library data.
 */
export interface SchemaPersistenceData {
  /** Format version */
  version: string;
  /** Serialized library entries */
  entries: import('../dacp/types.js').SchemaLibraryEntry[];
  /** ISO 8601 timestamp of last build */
  last_built: string;
}
