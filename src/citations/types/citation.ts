/**
 * Citation management core type system.
 *
 * Zod schemas and inferred TypeScript types for the citation management
 * system. This is the foundation type module -- every citation component
 * imports from here.
 *
 * Defines: Author, CitedWorkType, SourceApi, ExtractionMethod,
 * RawCitation, ArtifactType, ProvenanceEntry, CitedWork.
 *
 * Only allowed import: zod.
 */

import { z } from 'zod';

// ============================================================================
// Enum schemas
// ============================================================================

/** Types of cited works the system can track. */
export const CitedWorkTypeSchema = z.enum([
  'article', 'book', 'chapter', 'report', 'standard',
  'website', 'repository', 'thesis', 'patent', 'conference', 'other',
]);
export type CitedWorkType = z.infer<typeof CitedWorkTypeSchema>;

/** API sources for citation resolution. */
export const SourceApiSchema = z.enum([
  'crossref', 'openalex', 'nasa-ntrs', 'github', 'archive-org', 'manual', 'extracted',
]);
export type SourceApi = z.infer<typeof SourceApiSchema>;

/** Methods used to extract citations from source documents. */
export const ExtractionMethodSchema = z.enum([
  'doi', 'isbn', 'bibliography', 'inline-apa', 'inline-numbered',
  'narrative', 'informal', 'url', 'manual',
]);
export type ExtractionMethod = z.infer<typeof ExtractionMethodSchema>;

/** Artifact types that can contain citations. */
export const ArtifactTypeSchema = z.enum([
  'skill', 'teaching-reference', 'vision-document', 'research-reference',
  'book-chapter', 'pack-module', 'documentation',
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

// ============================================================================
// Object schemas
// ============================================================================

/** Author of a cited work. Family name required; ORCID validated if present. */
export const AuthorSchema = z.object({
  family: z.string().min(1),
  given: z.string().optional(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).optional(),
  affiliation: z.string().optional(),
});
export type Author = z.infer<typeof AuthorSchema>;

/** Raw citation text extracted from a source document before resolution. */
export const RawCitationSchema = z.object({
  text: z.string().min(1),
  source_document: z.string(),
  extraction_method: ExtractionMethodSchema,
  confidence: z.number().min(0).max(1),
  line_number: z.number().int().positive().optional(),
  timestamp: z.string().datetime(),
});
export type RawCitation = z.infer<typeof RawCitationSchema>;

/** Provenance entry linking a cited work to an artifact that references it. */
export const ProvenanceEntrySchema = z.object({
  artifact_type: ArtifactTypeSchema,
  artifact_path: z.string(),
  artifact_name: z.string(),
  context: z.string().optional(),
  section: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type ProvenanceEntry = z.infer<typeof ProvenanceEntrySchema>;

/** A fully resolved cited work with metadata, provenance, and raw citations. */
export const CitedWorkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(AuthorSchema).min(1),
  year: z.number().int().min(1400).max(2100),
  doi: z.string().optional(),
  isbn: z.string().optional(),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  edition: z.string().optional(),
  type: CitedWorkTypeSchema,
  source_api: SourceApiSchema,
  confidence: z.number().min(0).max(1),
  first_seen: z.string().datetime(),
  last_verified: z.string().datetime().optional(),
  cited_by: z.array(ProvenanceEntrySchema),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  verified: z.boolean().default(false),
  raw_citations: z.array(RawCitationSchema),
});
export type CitedWork = z.infer<typeof CitedWorkSchema>;
