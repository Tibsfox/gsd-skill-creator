/**
 * GSD Den message bus -- barrel export.
 *
 * Single entry point for all Den module functionality: type schemas,
 * ISA encoder/decoder, filesystem bus operations, health metrics,
 * pruning, and the dispatcher agent.
 *
 * Usage:
 *   import { createDispatcher, sendMessage, BusConfigSchema } from './den/index.js';
 */

// Types and schemas
export {
  PrioritySchema, OpcodeSchema, AgentIdSchema,
  MessageHeaderSchema, BusMessageSchema, BusConfigSchema, HealthMetricsSchema,
  PRIORITY_NAMES,
  type Priority, type Opcode, type AgentId,
  type MessageHeader, type BusMessage, type BusConfig, type HealthMetrics,
} from './types.js';

// Encoder/decoder
export {
  encodeMessage, decodeMessage,
  encodeHeader, decodeHeader,
  formatTimestamp, parseTimestamp,
  messageFilename,
} from './encoder.js';

// Bus operations
export {
  initBus, sendMessage, receiveMessages,
  acknowledgeMessage, deadLetterMessage,
  listMessages, getMessagePath,
} from './bus.js';

// Health metrics
export {
  collectHealthMetrics, isHealthy, formatHealthReport,
  extractTimestampFromFilename,
} from './health.js';

// Pruning
export {
  pruneAcknowledged, pruneDeadLetters,
  type PruneResult,
} from './pruner.js';

// Dispatcher
export {
  createDispatcher, dispatchCycle,
  Dispatcher,
  type DispatchResult, type RouteHandler, type CombinedPruneResult,
} from './dispatcher.js';
