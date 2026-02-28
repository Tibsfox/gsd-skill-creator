/**
 * Inter-chip message port with FIFO queuing and reply-based ownership.
 *
 * MessagePort provides a capacity-limited, priority-aware message queue
 * for asynchronous inter-chip communication. Messages are dequeued in
 * priority order (urgent > normal > low), with FIFO ordering within
 * the same priority level.
 *
 * Ownership semantics: when a sender enqueues a message with a `replyPort`,
 * the sender owns the message until the receiver sends a reply referencing
 * the original message's ID via `inReplyTo`. Dequeuing the reply releases
 * ownership of the original message.
 */

import { z } from 'zod';

// ============================================================================
// Message Priorities
// ============================================================================

/**
 * Priority levels for port messages, ordered highest to lowest.
 * Used as a const array so z.enum can derive the union type.
 */
export const MESSAGE_PRIORITIES = ['urgent', 'normal', 'low'] as const;

/** Priority level for a port message. */
export type MessagePriority = (typeof MESSAGE_PRIORITIES)[number];

/** Internal numeric value for priority comparison (lower = higher priority). */
function priorityValue(p: MessagePriority): number {
  switch (p) {
    case 'urgent':
      return 0;
    case 'normal':
      return 1;
    case 'low':
      return 2;
  }
}

// ============================================================================
// PortMessageSchema
// ============================================================================

/**
 * Zod schema for a message on a port.
 *
 * Fields:
 * - `id`: unique message identifier
 * - `sender`: sending chip name
 * - `receiver`: receiving chip name
 * - `type`: message type (e.g., 'budget-query', 'render-request')
 * - `priority`: urgency level (urgent, normal, low)
 * - `payload`: message payload (any shape)
 * - `replyPort`: optional name of port to send replies to
 * - `inReplyTo`: optional ID of message this is replying to
 * - `timestamp`: ISO 8601 timestamp
 */
export const PortMessageSchema = z.object({
  /** Unique message ID. */
  id: z.string().min(1),

  /** Sender chip name. */
  sender: z.string().min(1),

  /** Receiver chip name. */
  receiver: z.string().min(1),

  /** Message type (e.g., 'budget-query', 'render-request'). */
  type: z.string().min(1),

  /** Message priority level. */
  priority: z.enum(MESSAGE_PRIORITIES),

  /** Message payload (any shape). */
  payload: z.unknown(),

  /** Name of port to send replies to. */
  replyPort: z.string().optional(),

  /** ID of message this is replying to. */
  inReplyTo: z.string().optional(),

  /** ISO 8601 timestamp. */
  timestamp: z.string(),
});

/** A typed port message. */
export type PortMessage = z.infer<typeof PortMessageSchema>;

// ============================================================================
// MessagePort
// ============================================================================

/**
 * FIFO message port with priority ordering and reply-based ownership.
 *
 * Messages are stored in priority-sorted order (urgent > normal > low).
 * Within the same priority level, messages maintain insertion order (FIFO).
 *
 * Ownership tracking: messages with a `replyPort` field are tracked as
 * "owned" by the sender. Ownership is released when a reply referencing
 * the original message's ID (via `inReplyTo`) is dequeued from any port.
 */
export class MessagePort {
  /** Port name. */
  readonly name: string;

  /** Maximum number of messages the port can hold. */
  readonly capacity: number;

  /** Internal message queue, maintained in priority-then-FIFO order. */
  private queue: PortMessage[] = [];

  /** Maps message ID to owner (sender) name for ownership tracking. */
  private ownership: Map<string, string> = new Map();

  constructor(name: string, capacity: number = 64) {
    this.name = name;
    this.capacity = capacity;
  }

  /**
   * Enqueue a message onto the port.
   *
   * The message is validated with `PortMessageSchema` and inserted into
   * the queue at the correct position to maintain priority ordering.
   * Messages with the same priority are inserted after existing same-priority
   * messages to preserve FIFO order.
   *
   * If the message has a `replyPort`, ownership is tracked: the sender
   * is recorded as the owner until a reply is received.
   *
   * @returns `true` if enqueued successfully, `false` if the port is full.
   */
  enqueue(message: PortMessage): boolean {
    if (this.queue.length >= this.capacity) {
      return false;
    }

    const validated = PortMessageSchema.parse(message);
    const msgPriority = priorityValue(validated.priority);

    // Find insertion index: insert after all messages with same or higher priority
    let insertAt = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (priorityValue(this.queue[i].priority) > msgPriority) {
        insertAt = i;
        break;
      }
    }

    this.queue.splice(insertAt, 0, validated);

    // Track ownership if message has a replyPort
    if (validated.replyPort) {
      this.ownership.set(validated.id, validated.sender);
    }

    return true;
  }

  /**
   * Dequeue the highest-priority, earliest-arrived message.
   *
   * If the message has an `inReplyTo` field, the ownership of the
   * referenced original message is released.
   *
   * @returns The next message, or `undefined` if the port is empty.
   */
  dequeue(): PortMessage | undefined {
    if (this.queue.length === 0) {
      return undefined;
    }

    const message = this.queue.shift()!;

    // Release ownership of the original message when its reply is dequeued
    if (message.inReplyTo) {
      this.ownership.delete(message.inReplyTo);
    }

    return message;
  }

  /**
   * Peek at the front message without removing it.
   *
   * @returns The next message, or `undefined` if the port is empty.
   */
  peek(): PortMessage | undefined {
    return this.queue.length > 0 ? this.queue[0] : undefined;
  }

  /** Number of messages currently in the port. */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * Get the owner (sender) of a message by its ID.
   *
   * Ownership is set when a message with a `replyPort` is enqueued,
   * and released when a reply referencing the message is dequeued.
   *
   * @returns The owner's name, or `undefined` if no ownership is tracked.
   */
  getOwner(messageId: string): string | undefined {
    return this.ownership.get(messageId);
  }

  /**
   * Drain all messages from the port in priority order.
   *
   * Returns every message in the queue (already in priority-then-FIFO
   * order) and empties the port. Ownership entries for replied messages
   * are cleared.
   *
   * @returns Array of all messages in priority order.
   */
  drain(): PortMessage[] {
    const all = this.queue.splice(0);
    // Release ownership for any replies in the drained batch
    for (const msg of all) {
      if (msg.inReplyTo) {
        this.ownership.delete(msg.inReplyTo);
      }
    }
    return all;
  }

  /**
   * Clear all messages and ownership tracking from the port.
   */
  clear(): void {
    this.queue.length = 0;
    this.ownership.clear();
  }
}
