/**
 * Typed kernel message protocol for inter-engine communication.
 *
 * Messages use descriptive field names:
 * - `type`: message type (determines how the payload is interpreted)
 * - `priority`: priority as signed byte -128..127
 * - `replyPort`: reply port name
 * - `tokenCost`: estimated token cost
 *
 * This is the structured format that flows through the MessagePort FIFO
 * transport from Phase 111. KernelMessage defines the typed protocol;
 * PortMessage provides the transport layer.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

// ============================================================================
// MESSAGE_TYPES
// ============================================================================

/**
 * All inter-engine message type strings.
 *
 * Organized by engine domain, these types align with the messageTypes
 * declared in engine port declarations (engine-registry.ts).
 */
export const MESSAGE_TYPES = [
  // Context engine (context/scheduling)
  'budget-query',
  'budget-response',
  'allocate',
  'allocation-result',
  'schedule-request',
  'schedule-update',
  // Render engine (output/rendering)
  'render-request',
  'render-result',
  'format-request',
  'format-result',
  // IO engine (I/O/events)
  'io-request',
  'io-result',
  'observation',
  // Router engine (glue/integration)
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
// KernelMessageSchema
// ============================================================================

/**
 * Zod schema for a kernel message.
 *
 * Priority uses a signed byte range (-128 to 127) where higher values
 * mean higher priority.
 */
export const KernelMessageSchema = z.object({
  /** Unique message identifier. */
  id: z.string().min(1),

  /** Message type -- determines how the payload is interpreted. */
  type: z.enum(MESSAGE_TYPES),

  /**
   * Priority as signed byte (-128 to 127).
   * Higher values mean higher priority.
   */
  priority: z.number().int().min(-128).max(127),

  /** Reply port name -- where to send responses. Optional. */
  replyPort: z.string().min(1).optional(),

  /**
   * Estimated token cost of this message.
   * Enables the budget system to account for message overhead.
   * Non-negative integer, defaults to 0.
   */
  tokenCost: z.number().int().min(0).default(0),

  /** Sending engine name. */
  sender: z.string().min(1),

  /** Receiving engine name. */
  receiver: z.string().min(1),

  /** Message payload -- typed by type convention, not schema-enforced. */
  payload: z.unknown(),

  /** ISO 8601 timestamp. */
  timestamp: z.string(),

  /** ID of message this replies to. Optional. */
  inReplyTo: z.string().optional(),
});

/** A typed kernel message. */
export type KernelMessage = z.infer<typeof KernelMessageSchema>;

// ============================================================================
// createMessage
// ============================================================================

/**
 * Factory for creating kernel messages with sensible defaults.
 *
 * Generates a unique ID via `crypto.randomUUID()`, defaults priority
 * to 0 (neutral), tokenCost to 0, and sets the timestamp to now.
 * The resulting message is validated against `KernelMessageSchema`.
 */
export function createMessage(opts: {
  type: MessageType;
  sender: string;
  receiver: string;
  payload: unknown;
  priority?: number;
  replyPort?: string;
  tokenCost?: number;
}): KernelMessage {
  return KernelMessageSchema.parse({
    id: randomUUID(),
    type: opts.type,
    priority: opts.priority ?? 0,
    replyPort: opts.replyPort,
    tokenCost: opts.tokenCost ?? 0,
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
 * - Does not chain reply ports (replyPort is undefined)
 *
 * @throws {Error} If the original message has no `replyPort`.
 */
export function createReply(
  original: KernelMessage,
  opts: {
    type: MessageType;
    payload: unknown;
    sender: string;
    priority?: number;
    tokenCost?: number;
  },
): KernelMessage {
  if (!original.replyPort) {
    throw new Error('Original message has no reply port');
  }

  return KernelMessageSchema.parse({
    id: randomUUID(),
    type: opts.type,
    priority: opts.priority ?? 0,
    tokenCost: opts.tokenCost ?? 0,
    sender: opts.sender,
    receiver: original.sender,
    payload: opts.payload,
    timestamp: new Date().toISOString(),
    inReplyTo: original.id,
  });
}
