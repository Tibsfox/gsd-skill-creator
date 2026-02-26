/**
 * Citation store barrel export.
 *
 * Re-exports the JSONL-backed citation database, migration utilities,
 * and supporting types.
 */

export {
  CitationStore,
  type WorkIndex,
  type ImportResult,
  normalizeTitle,
  titleSimilarity,
  generateCitationId,
} from './citation-db.js';

export {
  type SchemaVersion,
  type MigrationFn,
  CURRENT_VERSION,
  getCurrentVersion,
  migrate,
} from './migrations.js';
