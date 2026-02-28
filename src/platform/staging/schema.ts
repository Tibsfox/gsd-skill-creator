/**
 * Zod validation schema for staging metadata.
 *
 * All items entering the staging pipeline must conform to
 * this schema. Validates submitted_at (ISO 8601), source,
 * and status (staging state enum).
 *
 * @module staging/schema
 */

import { z } from 'zod';
import { STAGING_STATES } from './types.js';

/**
 * Zod schema for staging metadata validation.
 *
 * Usage:
 * ```typescript
 * const metadata = StagingMetadataSchema.parse(rawData);
 * // metadata is now typed and validated
 * ```
 */
export const StagingMetadataSchema = z
  .object({
    /** ISO 8601 timestamp of when the item was submitted. */
    submitted_at: z.string().min(1).refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'submitted_at must be a valid ISO 8601 date' },
    ),

    /** Origin of the item (e.g., 'dashboard', 'cli', 'session'). */
    source: z.string().min(1),

    /** Current staging state. */
    status: z.enum(STAGING_STATES),
  })
  .passthrough();

/**
 * Inferred TypeScript type from the Zod schema.
 *
 * This should be structurally compatible with the `StagingMetadata`
 * interface defined in types.ts. The interface exists for documentation;
 * this type is used for runtime type safety.
 */
export type InferredStagingMetadata = z.infer<typeof StagingMetadataSchema>;
