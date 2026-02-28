/**
 * GSD Den message bus type system.
 *
 * Zod schemas and inferred TypeScript types for the Den priority message bus.
 * This is the bedrock type module -- every other Den component imports from here.
 *
 * Defines: Priority levels (0-7), ISA opcodes (11), agent IDs (12),
 * message headers, bus messages with payload validation, bus configuration
 * with sensible defaults, and health metrics for monitoring.
 */

import { z } from 'zod';

// ============================================================================
// Priority levels (0 = highest, 7 = lowest)
// ============================================================================

/**
 * Message priority levels for the Den bus.
 *
 * Lower numbers = higher priority. Maps to filesystem priority directories.
 *   0=HALT, 1=PHASE, 2=VERIFY, 3=SKILL_LOAD,
 *   4=ARTIFACT, 5=OBSERVE, 6=STATUS, 7=HEARTBEAT
 */
export const PrioritySchema = z.number().int().min(0).max(7);

/** TypeScript type for priority values */
export type Priority = z.infer<typeof PrioritySchema>;

/** Semantic names for priority levels */
export const PRIORITY_NAMES: Record<number, string> = {
  0: 'HALT',
  1: 'PHASE',
  2: 'VERIFY',
  3: 'SKILL_LOAD',
  4: 'ARTIFACT',
  5: 'OBSERVE',
  6: 'STATUS',
  7: 'HEARTBEAT',
};

// ============================================================================
// ISA opcodes
// ============================================================================

/**
 * ISA opcodes used in Den bus communication.
 *
 * Each opcode maps to a specific operation type in the message bus:
 * - HALT: Emergency stop
 * - NOP: No operation (keepalive)
 * - EXEC: Execute a phase/plan
 * - CMP: Compare/verify result
 * - BEQ: Branch if equal (conditional proceed)
 * - BNE: Branch if not equal (conditional retry)
 * - SEND: Send data to agent
 * - MOV: Move/transfer artifact
 * - ACK: Acknowledge receipt
 * - STATUS: Status report
 * - QUERY: Request information
 */
export const OpcodeSchema = z.enum([
  'HALT', 'NOP', 'EXEC', 'CMP', 'BEQ', 'BNE',
  'SEND', 'MOV', 'ACK', 'STATUS', 'QUERY',
]);

/** TypeScript type for opcodes */
export type Opcode = z.infer<typeof OpcodeSchema>;

// ============================================================================
// Agent IDs
// ============================================================================

/**
 * Agent position identifiers for the v1.28 Den topology.
 *
 * 10 agent positions plus 'all' (broadcast) and 'user' (human operator).
 */
export const AgentIdSchema = z.enum([
  'coordinator', 'relay', 'planner', 'configurator',
  'monitor', 'dispatcher', 'verifier', 'chronicler',
  'sentinel', 'executor', 'all', 'user',
]);

/** TypeScript type for agent IDs */
export type AgentId = z.infer<typeof AgentIdSchema>;

// ============================================================================
// MessageHeaderSchema
// ============================================================================

/**
 * ISA message header -- the fixed-format first line of every bus message.
 *
 * Encodes to pipe-delimited format: TIMESTAMP|PRIORITY|OPCODE|SRC|DST|LENGTH
 */
export const MessageHeaderSchema = z.object({
  /** Compact timestamp in YYYYMMDD-HHMMSS format */
  timestamp: z.string(),
  /** Priority level 0-7 (0 = highest) */
  priority: PrioritySchema,
  /** ISA opcode */
  opcode: OpcodeSchema,
  /** Source agent ID */
  src: AgentIdSchema,
  /** Destination agent ID */
  dst: AgentIdSchema,
  /** Count of payload lines (non-negative integer) */
  length: z.number().int().nonnegative(),
});

/** TypeScript type for message headers */
export type MessageHeader = z.infer<typeof MessageHeaderSchema>;

// ============================================================================
// BusMessageSchema
// ============================================================================

/**
 * A complete bus message: header + payload lines.
 *
 * The payload array length MUST match header.length -- enforced by Zod refine.
 */
export const BusMessageSchema = z.object({
  /** Message header */
  header: MessageHeaderSchema,
  /** Payload lines (one string per line) */
  payload: z.array(z.string()),
}).refine(
  (msg) => msg.payload.length === msg.header.length,
  {
    message: 'Payload length must match header.length',
    path: ['payload'],
  },
);

/** TypeScript type for bus messages */
export type BusMessage = z.infer<typeof BusMessageSchema>;

// ============================================================================
// BusConfigSchema
// ============================================================================

/**
 * Configuration for the Den message bus.
 *
 * All fields have sensible defaults for standard operation.
 */
export const BusConfigSchema = z.object({
  /** Root directory for bus message files (default: '.planning/bus') */
  busDir: z.string().default('.planning/bus'),
  /** Maximum messages per priority queue before backpressure (default: 100) */
  maxQueueDepth: z.number().int().positive().default(100),
  /** Delivery timeout in milliseconds (default: 5000) */
  deliveryTimeoutMs: z.number().int().positive().default(5000),
  /** Days to retain dead-letter messages (default: 3) */
  deadLetterRetentionDays: z.number().int().positive().default(3),
  /** Maximum messages in archive before rotation (default: 100) */
  archiveMaxMessages: z.number().int().positive().default(100),
  /** Maximum age of archived messages in days (default: 7) */
  archiveMaxAgeDays: z.number().int().positive().default(7),
});

/** TypeScript type for bus configuration */
export type BusConfig = z.infer<typeof BusConfigSchema>;

// ============================================================================
// HealthMetricsSchema
// ============================================================================

/**
 * Health metrics snapshot for the Den message bus.
 *
 * Collected periodically by the monitor agent to track queue depths,
 * throughput, and dead-letter accumulation.
 */
export const HealthMetricsSchema = z.object({
  /** ISO 8601 timestamp of when metrics were collected */
  timestamp: z.string(),
  /** Queue depth per priority level (0-7 keys, count values) */
  queueDepths: z.record(z.coerce.string(), z.number().int().nonnegative()),
  /** Total messages processed since bus start */
  totalMessages: z.number().int().nonnegative(),
  /** Age of oldest unacknowledged message in ms, null if none pending */
  oldestUnacknowledgedAge: z.number().nonnegative().nullable(),
  /** Number of messages in dead-letter queue */
  deadLetterCount: z.number().int().nonnegative(),
});

/** TypeScript type for health metrics */
export type HealthMetrics = z.infer<typeof HealthMetricsSchema>;
