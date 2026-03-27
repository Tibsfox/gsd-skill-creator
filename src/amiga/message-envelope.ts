/**
 * AMIGA message bus event envelope schema and factory.
 *
 * Every message on the AMIGA bus conforms to a single envelope schema. This
 * ensures all components (MC-1, ME-1, CE-1, GL-1) can parse any message
 * without knowing its specific payload type.
 *
 * The envelope carries 9 mandatory fields:
 * - id: unique event identifier (UUID)
 * - timestamp: ISO 8601 UTC when the event was created
 * - source: sending agent/component (AgentID pattern, 'broadcast', or 'any')
 * - destination: receiving agent/component (AgentID pattern, 'broadcast', or 'any')
 * - type: event type string (e.g., 'TELEMETRY_UPDATE')
 * - priority: urgency level from PrioritySchema
 * - payload: arbitrary key-value data
 * - correlation: optional correlation ID for request/response pairing
 * - requires_ack: whether the sender expects acknowledgement
 *
 * The schema uses `.passthrough()` so downstream consumers can attach
 * additional metadata without breaking validation.
 */

import { z } from 'zod';
import { PrioritySchema } from './types.js';

// ============================================================================
// Source/Destination Validator
// ============================================================================

/**
 * Regex for valid source and destination fields.
 *
 * Accepts:
 * - AgentID patterns: {TEAM}-{N} or {TEAM}-{N}.{suffix}
 *   Teams: CS, ME, CE, GL, OPS
 * - Component IDs: MC-{N} (Mission Control)
 * - Bare team names: CS, ME, CE, GL, OPS (for team-level routing)
 * - Special values: 'broadcast' (all agents), 'any' (wildcard)
 */
const AGENT_OR_SPECIAL_PATTERN = /^((CS|ME|CE|GL|OPS|MC)-\d+(\.[a-z])?|CS|ME|CE|GL|OPS|broadcast|any)$/;

// ============================================================================
// EventEnvelopeSchema
// ============================================================================

/**
 * Zod schema for the AMIGA message bus event envelope.
 *
 * All 9 fields are mandatory. The schema uses `.passthrough()` to allow
 * additional fields to survive parsing without validation errors.
 */
export const EventEnvelopeSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
    'Timestamp must be ISO 8601 UTC',
  ),
  source: z.string().regex(
    AGENT_OR_SPECIAL_PATTERN,
    'Source must be AgentID, broadcast, or any',
  ),
  destination: z.string().regex(
    AGENT_OR_SPECIAL_PATTERN,
    'Destination must be AgentID, broadcast, or any',
  ),
  type: z.string().min(1),
  priority: PrioritySchema,
  payload: z.record(z.string(), z.unknown()),
  correlation: z.string().nullable(),
  requires_ack: z.boolean(),
}).passthrough();

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

// ============================================================================
// Factory
// ============================================================================

/** Input for the envelope factory function. */
export interface CreateEnvelopeInput {
  /** Sending agent/component. */
  source: string;
  /** Receiving agent/component. */
  destination: string;
  /** Event type string. */
  type: string;
  /** Arbitrary payload data. */
  payload: Record<string, unknown>;
  /** Priority level (defaults to 'normal'). */
  priority?: string;
  /** Correlation ID for request/response pairing (defaults to null). */
  correlation?: string | null;
  /** Whether sender expects acknowledgement (defaults to false). */
  requires_ack?: boolean;
}

/**
 * Create a new event envelope with sensible defaults.
 *
 * Auto-generates:
 * - `id`: crypto.randomUUID()
 * - `timestamp`: current UTC time in ISO 8601
 *
 * Defaults:
 * - `priority`: 'normal'
 * - `correlation`: null
 * - `requires_ack`: false
 *
 * @param input - Required fields and optional overrides
 * @returns A fully populated EventEnvelope
 */
export function createEnvelope(input: CreateEnvelopeInput): EventEnvelope {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
    source: input.source,
    destination: input.destination,
    type: input.type,
    priority: (input.priority ?? 'normal') as EventEnvelope['priority'],
    payload: input.payload,
    correlation: input.correlation ?? null,
    requires_ack: input.requires_ack ?? false,
  };
}
