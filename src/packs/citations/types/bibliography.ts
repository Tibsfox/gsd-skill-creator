/**
 * Bibliography format and options schemas.
 *
 * Defines supported output formats and generation options for
 * bibliography/reference list generation.
 */

import { z } from 'zod';

/** Supported bibliography output formats. */
export const BibliographyFormatSchema = z.enum([
  'bibtex', 'apa7', 'chicago', 'mla', 'custom',
]);
export type BibliographyFormat = z.infer<typeof BibliographyFormatSchema>;

/** Options controlling bibliography generation scope and format. */
export const FormatOptionsSchema = z.object({
  format: BibliographyFormatSchema,
  scope: z.enum(['document', 'domain', 'all']).default('all'),
  scopeFilter: z.string().optional(),
  sortBy: z.enum(['author', 'year', 'title']).default('author'),
  includeUnverified: z.boolean().default(true),
  customTemplate: z.string().optional(),
});
export type FormatOptions = z.infer<typeof FormatOptionsSchema>;
