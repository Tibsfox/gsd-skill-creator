/**
 * Zod validation schema for the console message envelope.
 *
 * All messages exchanged between dashboard and session must
 * conform to this schema. Validates id format, source/type
 * enums, ISO timestamp, and payload shape.
 *
 * @module console/schema
 */

import { z } from 'zod';
import type { MessageEnvelope } from './types.js';

/**
 * Zod schema for message envelope validation.
 *
 * Usage:
 * ```typescript
 * const envelope = MessageEnvelopeSchema.parse(rawData);
 * // envelope is now typed and validated
 * ```
 */
export const MessageEnvelopeSchema = z.object({
  /** Unique message ID, format: msg-YYYYMMDD-NNN */
  id: z.string().regex(/^msg-\d{8}-\d{3,}$/, 'id must match msg-YYYYMMDD-NNN format'),

  /** What kind of message this is. */
  type: z.enum(['milestone-submit', 'config-update', 'question-response', 'setting-change']),

  /** ISO 8601 timestamp of when the message was created. */
  timestamp: z.string().min(1).refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'timestamp must be a valid ISO 8601 date' },
  ),

  /** Who sent the message. */
  source: z.enum(['dashboard', 'session']),

  /** Arbitrary payload -- schema depends on message type. */
  payload: z.record(z.string(), z.unknown()),
});

/**
 * Inferred TypeScript type from the Zod schema.
 *
 * This should be structurally identical to the `MessageEnvelope` interface
 * defined in types.ts. The interface exists for documentation;
 * this type is used for runtime type safety.
 */
export type InferredMessageEnvelope = z.infer<typeof MessageEnvelopeSchema>;
