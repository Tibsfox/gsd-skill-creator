/**
 * Pipeline result schemas for extraction and resolution stages.
 *
 * Defines the output shapes for the citation extraction and resolution
 * pipeline stages, including aggregate statistics.
 */

import { z } from 'zod';
import { CitedWorkSchema, RawCitationSchema } from './citation.js';

/** Result of the citation extraction stage. */
export const ExtractionResultSchema = z.object({
  citations: z.array(RawCitationSchema),
  stats: z.object({
    total_candidates: z.number(),
    high_confidence: z.number(),
    medium_confidence: z.number(),
    low_confidence: z.number(),
    dois_found: z.number(),
    isbns_found: z.number(),
  }),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/** Result of the citation resolution stage. */
export const ResolutionResultSchema = z.object({
  resolved: z.array(CitedWorkSchema),
  unresolved: z.array(RawCitationSchema),
  stats: z.object({
    total_attempted: z.number(),
    resolved_count: z.number(),
    from_cache: z.number(),
    api_calls: z.number(),
    avg_confidence: z.number(),
  }),
});
export type ResolutionResult = z.infer<typeof ResolutionResultSchema>;
