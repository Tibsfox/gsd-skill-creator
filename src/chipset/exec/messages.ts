/**
 * Typed exec message protocol for inter-team communication.
 *
 * Messages use Amiga exec-inspired field names:
 * - `ln_Type`: message type (from Node.ln_Type -- the node type field)
 * - `ln_Pri`: priority as signed byte -128..127 (from Node.ln_Pri)
 * - `mn_ReplyPort`: reply port name (from Message.mn_ReplyPort)
 * - `mn_Length`: estimated token cost (from Message.mn_Length)
 *
 * This is the structured format that flows through the MessagePort FIFO
 * transport from Phase 111. ExecMessage defines the typed protocol;
 * PortMessage provides the transport layer.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

// ============================================================================
// MESSAGE_TYPES
// ============================================================================

/**
 * All inter-chip message type strings.
 *
 * Organized by chip domain, these types align with the messageTypes
 * declared in chip port declarations (chip-registry.ts).
 */
export const MESSAGE_TYPES = [
  // Agnus (context/scheduling)
  'budget-query',
  'budget-response',
  'allocate',
  'allocation-result',
  'schedule-request',
  'schedule-update',
  // Denise (output/rendering)
  'render-request',
  'render-result',
  'format-request',
  'format-result',
  // Paula (I/O/events)
  'io-request',
  'io-result',
  'observation',
  // Gary (glue/integration)
  'route-request',
  'route-result',
  'pattern-data',
  // System messages
  'signal-forward',
  'heartbeat',
] as const;

/** Union type of all valid message type strings. */
export type MessageType = (typeof MESSAGE_TYPES)[number];

// ============================================================================
// ExecMessageSchema
// ============================================================================

/**
 * Zod schema for an exec message with Amiga-inspired field names.
 *
 * Field naming follows the Amiga exec library conventions:
 * - `ln_Type` / `ln_Pri` from struct Node (list node fields)
 * - `mn_ReplyPort` / `mn_Length` from struct Message
 *
 * Priority uses a signed byte range (-128 to 127) where higher values
 * mean higher priority, matching the Amiga exec convention.
 */
export const ExecMessageSchema = z.object({
  /** Unique message identifier. */
  id: z.string().min(1),

  /** Message type -- determines how the payload is interpreted. */
  ln_Type: z.enum(MESSAGE_TYPES),

  /**
   * Priority as signed byte (-128 to 127).
   * Higher values mean higher priority, matching Amiga exec convention.
   */
  ln_Pri: z.number().int().min(-128).max(127),

  /** Reply port name -- where to send responses. Optional. */
  mn_ReplyPort: z.string().min(1).optional(),

  /**
   * Estimated token cost of this message.
   * Enables the DMA budget system to account for message overhead.
   * Non-negative integer, defaults to 0.
   */
  mn_Length: z.number().int().min(0).default(0),

  /** Sending chip name. */
  sender: z.string().min(1),

  /** Receiving chip name. */
  receiver: z.string().min(1),

  /** Message payload -- typed by ln_Type convention, not schema-enforced. */
  payload: z.unknown(),

  /** ISO 8601 timestamp. */
  timestamp: z.string(),

  /** ID of message this replies to. Optional. */
  inReplyTo: z.string().optional(),
});

/** A typed exec message with Amiga-inspired fields. */
export type ExecMessage = z.infer<typeof ExecMessageSchema>;

// ============================================================================
// createMessage
// ============================================================================

/**
 * Factory for creating exec messages with sensible defaults.
 *
 * Generates a unique ID via `crypto.randomUUID()`, defaults priority
 * to 0 (neutral), mn_Length to 0, and sets the timestamp to now.
 * The resulting message is validated against `ExecMessageSchema`.
 */
export function createMessage(opts: {
  ln_Type: MessageType;
  sender: string;
  receiver: string;
  payload: unknown;
  ln_Pri?: number;
  mn_ReplyPort?: string;
  mn_Length?: number;
}): ExecMessage {
  return ExecMessageSchema.parse({
    id: randomUUID(),
    ln_Type: opts.ln_Type,
    ln_Pri: opts.ln_Pri ?? 0,
    mn_ReplyPort: opts.mn_ReplyPort,
    mn_Length: opts.mn_Length ?? 0,
    sender: opts.sender,
    receiver: opts.receiver,
    payload: opts.payload,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// createReply
// ============================================================================

/**
 * Factory for creating reply messages that route back to the original sender.
 *
 * The reply:
 * - References the original message via `inReplyTo`
 * - Routes to the original sender (receiver = original.sender)
 * - Does not chain reply ports (mn_ReplyPort is undefined)
 *
 * @throws {Error} If the original message has no `mn_ReplyPort`.
 */
export function createReply(
  original: ExecMessage,
  opts: {
    ln_Type: MessageType;
    payload: unknown;
    sender: string;
    ln_Pri?: number;
    mn_Length?: number;
  },
): ExecMessage {
  if (!original.mn_ReplyPort) {
    throw new Error('Original message has no reply port');
  }

  return ExecMessageSchema.parse({
    id: randomUUID(),
    ln_Type: opts.ln_Type,
    ln_Pri: opts.ln_Pri ?? 0,
    mn_Length: opts.mn_Length ?? 0,
    sender: opts.sender,
    receiver: original.sender,
    payload: opts.payload,
    timestamp: new Date().toISOString(),
    inReplyTo: original.id,
  });
}
