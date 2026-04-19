/**
 * ME-5 Output-Structure Declaration — barrel export.
 *
 * Public surface for the `output-structure` module.  Import from here rather
 * than from individual files.
 *
 * @module output-structure
 */

// Schema types and tractability classifier
export type {
  OutputStructure,
  OutputStructureKind,
  JsonSchemaOutputStructure,
  MarkdownTemplateOutputStructure,
  ProseOutputStructure,
  TractabilityClass,
} from './schema.js';
export {
  OUTPUT_STRUCTURE_KINDS,
  classifyTractability,
  TRACTABILITY_LABELS,
} from './schema.js';

// Validator
export type { ValidationResult } from './validator.js';
export { validateOutputStructure, parseOutputStructure } from './validator.js';

// Frontmatter resolver
export type {
  OutputStructureSource,
  ResolvedOutputStructure,
} from './frontmatter.js';
export {
  DEFAULT_OUTPUT_STRUCTURE,
  resolveOutputStructure,
  serializeOutputStructure,
} from './frontmatter.js';

// Migration helpers
export type {
  InferenceResult,
  MigrationPatch,
  ScanEntry,
  ScanReport,
} from './migrate.js';
export {
  inferOutputStructure,
  migrateSkill,
  applyMigration,
  buildScanReport,
} from './migrate.js';

// CLI
export type { OutputStructureCliOptions } from './cli.js';
export { outputStructureCommand, outputStructureHelp } from './cli.js';
