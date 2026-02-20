/**
 * GSD Den message bus -- barrel export.
 *
 * Single entry point for all Den module functionality: type schemas,
 * ISA encoder/decoder, filesystem bus operations, health metrics,
 * pruning, the dispatcher agent, the coordinator agent, the relay agent,
 * and the monitor agent.
 *
 * Usage:
 *   import { createDispatcher, createRelay, sendMessage, BusConfigSchema } from './den/index.js';
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

// Coordinator
export {
  CoordinatorConfigSchema, DecisionEntrySchema,
  ReadinessResponseSchema, ReadinessResultSchema,
  PhaseTransitionResultSchema,
  EscalationRequestSchema, EscalationResultSchema,
  appendDecision, readDecisionLog,
  readinessCheck, phaseTransition, escalate,
  Coordinator, createCoordinator,
  type DecisionEntry, type ReadinessResponse, type ReadinessResult,
  type PhaseTransitionResult, type EscalationRequest, type EscalationResult,
  type CoordinatorConfig, type ResponseCollector,
  type ReadinessCheckOptions, type PhaseTransitionOptions, type EscalationOptions,
} from './coordinator.js';

// Relay
export {
  RelayConfigSchema, QuestionEntrySchema, QuestionBatchSchema,
  PositionStatusSchema, StatusReportSchema,
  classifyPriority, consolidateQuestions, batchForUser,
  generateStatusReport, formatReportMarkdown,
  Relay, createRelay,
  type QuestionEntry, type QuestionBatch,
  type PositionStatus, type StatusReport,
  type RelayConfig, type StatusReportParams,
} from './relay.js';

// Monitor
export {
  MonitorConfigSchema, BudgetSnapshotSchema, AlertLevelSchema,
  ConsumptionRateSchema, BudgetAlertSchema, MonitorEntrySchema,
  ALERT_THRESHOLDS,
  trackConsumption, calculateAlertLevel, calculateConsumptionRate,
  checkBudget, appendMonitorEntry, readMonitorLog,
  Monitor, createMonitor,
  type AlertLevel, type BudgetSnapshot, type ConsumptionRate,
  type BudgetAlert, type MonitorEntry, type MonitorConfig,
} from './monitor.js';
