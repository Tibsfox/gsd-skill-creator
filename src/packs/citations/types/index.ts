/**
 * Citation types barrel export.
 *
 * Re-exports all Zod schemas and inferred types for the citation
 * management system. Import from here for all citation type needs.
 */

export {
  AuthorSchema,
  type Author,
  CitedWorkTypeSchema,
  type CitedWorkType,
  SourceApiSchema,
  type SourceApi,
  ExtractionMethodSchema,
  type ExtractionMethod,
  ArtifactTypeSchema,
  type ArtifactType,
  RawCitationSchema,
  type RawCitation,
  ProvenanceEntrySchema,
  type ProvenanceEntry,
  CitedWorkSchema,
  type CitedWork,
} from './citation.js';

export {
  SourceRecordSchema,
  type SourceRecord,
} from './source-record.js';

export {
  BibliographyFormatSchema,
  type BibliographyFormat,
  FormatOptionsSchema,
  type FormatOptions,
} from './bibliography.js';

export {
  ExtractionResultSchema,
  type ExtractionResult,
  ResolutionResultSchema,
  type ResolutionResult,
} from './pipeline.js';
