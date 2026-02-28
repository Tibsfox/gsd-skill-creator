/**
 * AMIGA EventEnvelope bridge for knowledge pack interaction events.
 *
 * Converts LearnerObservation records to AMIGA EventEnvelope format, enabling
 * the broader AMIGA ecosystem (MC-1, ME-1, CE-1, GL-1) to consume learning
 * events. Each observation kind maps to a KNOWLEDGE_-prefixed event type.
 *
 * Event types follow convention:
 * - activity_completion -> KNOWLEDGE_ACTIVITY_COMPLETED
 * - assessment_result -> KNOWLEDGE_ASSESSMENT_RECORDED
 * - time_spent -> KNOWLEDGE_TIME_LOGGED
 * - module_start -> KNOWLEDGE_MODULE_STARTED
 * - pack_start -> KNOWLEDGE_PACK_STARTED
 * - pack_complete -> KNOWLEDGE_PACK_COMPLETED (high priority)
 *
 * All events carry the full observation as payload and use packId as correlation
 * ID for lifecycle tracking.
 *
 * @module
 */

import { createEnvelope, EventEnvelopeSchema } from '../../integrations/amiga/message-envelope.js';
import type { EventEnvelope } from '../../integrations/amiga/message-envelope.js';
import type { LearnerObservation } from './observation-types.js';

// ============================================================================
// Event Type Mapping
// ============================================================================

/**
 * Mapping of observation kinds to AMIGA event type strings.
 *
 * Each observation kind (from LearnerObservationSchema) corresponds to a
 * KNOWLEDGE_-prefixed event type for consumption by the AMIGA ecosystem.
 */
export const KNOWLEDGE_EVENT_TYPES = {
  activity_completion: 'KNOWLEDGE_ACTIVITY_COMPLETED',
  assessment_result: 'KNOWLEDGE_ASSESSMENT_RECORDED',
  time_spent: 'KNOWLEDGE_TIME_LOGGED',
  module_start: 'KNOWLEDGE_MODULE_STARTED',
  pack_start: 'KNOWLEDGE_PACK_STARTED',
  pack_complete: 'KNOWLEDGE_PACK_COMPLETED',
} as const;

// ============================================================================
// EventBridge Class
// ============================================================================

/**
 * Converts learner observations to AMIGA EventEnvelope format.
 *
 * The bridge:
 * - Accepts LearnerObservation records as input
 * - Maps observation kinds to KNOWLEDGE_* event types
 * - Sets priority to 'high' for pack_complete events, 'normal' for others
 * - Uses packId as correlation ID for lifecycle tracking
 * - Validates all produced envelopes against EventEnvelopeSchema
 * - Throws on validation failure with descriptive error
 */
export class KnowledgeEventBridge {
  /** AMIGA source agent ID (sender). */
  private source: string;

  /** AMIGA destination (recipient). */
  private destination: string;

  /**
   * Create a bridge with optional source and destination overrides.
   *
   * @param options Optional configuration
   * @param options.source AMIGA source agent ID (defaults to 'OPS-1')
   * @param options.destination AMIGA destination (defaults to 'broadcast')
   */
  constructor(options?: { source?: string; destination?: string }) {
    this.source = options?.source ?? 'OPS-1';
    this.destination = options?.destination ?? 'broadcast';
  }

  /**
   * Convert a single learner observation to an EventEnvelope.
   *
   * The envelope:
   * - Contains the full observation as payload
   * - Uses packId as correlation ID
   * - Sets priority to 'high' for pack_complete, 'normal' otherwise
   * - Passes validation via EventEnvelopeSchema
   *
   * @param observation Learner observation to convert
   * @returns Valid AMIGA EventEnvelope
   * @throws On schema validation failure
   */
  toEnvelope(observation: LearnerObservation): EventEnvelope {
    // Map observation kind to event type
    const eventType = KNOWLEDGE_EVENT_TYPES[observation.kind];

    // Determine priority: high for pack completion, normal for others
    const priority =
      observation.kind === 'pack_complete' ? 'high' : 'normal';

    // Create envelope with full observation as payload
    const envelope = createEnvelope({
      source: this.source,
      destination: this.destination,
      type: eventType,
      payload: { ...observation },
      priority,
      correlation: observation.packId,
      requires_ack: false,
    });

    // Validate against EventEnvelopeSchema
    const result = EventEnvelopeSchema.safeParse(envelope);
    if (!result.success) {
      throw new Error(
        `EventEnvelope validation failed: ${result.error.message}`,
      );
    }

    return result.data;
  }

  /**
   * Convert multiple observations to EventEnvelopes.
   *
   * @param observations Learner observations to convert
   * @returns Array of valid EventEnvelopes in the same order
   * @throws On any envelope validation failure
   */
  toEnvelopes(observations: LearnerObservation[]): EventEnvelope[] {
    return observations.map((obs) => this.toEnvelope(obs));
  }
}
