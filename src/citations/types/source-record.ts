/**
 * Source record schema for API response caching.
 *
 * Tracks cached API responses with TTL for cache invalidation.
 */

import { z } from 'zod';
import { SourceApiSchema } from './citation.js';

/** Cached API response record with TTL-based expiration. */
export const SourceRecordSchema = z.object({
  query: z.string(),
  api: SourceApiSchema,
  response_hash: z.string(),
  timestamp: z.string().datetime(),
  ttl_days: z.number().default(30),
  data: z.record(z.string(), z.unknown()),
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
