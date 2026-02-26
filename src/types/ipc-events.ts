/**
 * IPC event type schemas for all cross-boundary communication in GSD-OS (v1.39).
 *
 * Defines Zod schemas with runtime validation for all 29 IPC event types across
 * 5 categories: Chat (11), Service (8), Staging (7), Debug (2), Magic (1).
 *
 * Every downstream phase (376-383) imports these types to ensure consistent
 * data shapes across TypeScript frontend and Rust backend (via JSON).
 *
 * Rust equivalent: src-tauri/src/ipc/types.rs
 *
 * @module types/ipc-events
 */

import { z } from 'zod';

// ============================================================================
// Event name constants
// ============================================================================

/**
 * All 29 IPC event name strings, organized by category.
 *
 * Format: `category:snake_case_action`
 *
 * These string values MUST match the Rust `events.rs` constants exactly.
 */
export const IPC_EVENT_NAMES = {
  // Chat events (11)
  CHAT_START: 'chat:start',
  CHAT_DELTA: 'chat:delta',
  CHAT_USAGE: 'chat:usage',
  CHAT_COMPLETE: 'chat:complete',
  CHAT_NEEDS_KEY: 'chat:needs_key',
  CHAT_RETRY: 'chat:retry',
  CHAT_ERROR: 'chat:error',
  CHAT_INVALID_KEY: 'chat:invalid_key',
  CHAT_RATE_LIMITED: 'chat:rate_limited',
  CHAT_INTERRUPTED: 'chat:interrupted',
  CHAT_SERVER_ERROR: 'chat:server_error',

  // Service events (8)
  SERVICE_STATUS: 'service:status',
  SERVICE_STATE_CHANGE: 'service:state_change',
  SERVICE_STARTING: 'service:starting',
  SERVICE_COMMAND: 'service:command',
  SERVICE_HEALTH_CHECK: 'service:health_check',
  SERVICE_STDOUT: 'service:stdout',
  SERVICE_STDERR: 'service:stderr',
  SERVICE_FAILED: 'service:failed',

  // Staging events (7)
  STAGING_INTAKE_NEW: 'staging:intake_new',
  STAGING_INTAKE_PROCESSING: 'staging:intake_processing',
  STAGING_INTAKE_DETAIL: 'staging:intake_detail',
  STAGING_HYGIENE_RESULT: 'staging:hygiene_result',
  STAGING_INTAKE_COMPLETE: 'staging:intake_complete',
  STAGING_QUARANTINE: 'staging:quarantine',
  STAGING_DEBRIEF_READY: 'staging:debrief_ready',

  // Debug events (2)
  DEBUG_IPC_RAW: 'debug:ipc_raw',
  DEBUG_TIMING: 'debug:timing',

  // Magic events (1)
  MAGIC_LEVEL_CHANGED: 'magic:level_changed',
} as const;

// ============================================================================
// Chat event schemas (11)
// ============================================================================

/** Conversation started -- model selected, ready for input. */
export const ChatStartEventSchema = z.object({
  conversation_id: z.string(),
  model: z.string(),
  timestamp: z.string(),
});
export type ChatStartEvent = z.infer<typeof ChatStartEventSchema>;

/** Streaming text delta from Claude response. */
export const ChatDeltaEventSchema = z.object({
  conversation_id: z.string(),
  delta: z.string(),
  index: z.number(),
});
export type ChatDeltaEvent = z.infer<typeof ChatDeltaEventSchema>;

/** Token usage statistics for a response. */
export const ChatUsageEventSchema = z.object({
  conversation_id: z.string(),
  input_tokens: z.number(),
  output_tokens: z.number(),
});
export type ChatUsageEvent = z.infer<typeof ChatUsageEventSchema>;

/** Response completed -- stop reason and final usage. */
export const ChatCompleteEventSchema = z.object({
  conversation_id: z.string(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});
export type ChatCompleteEvent = z.infer<typeof ChatCompleteEventSchema>;

/** API key needed before conversation can proceed. */
export const ChatNeedsKeyEventSchema = z.object({
  message: z.string(),
});
export type ChatNeedsKeyEvent = z.infer<typeof ChatNeedsKeyEventSchema>;

/** Retrying a failed request. */
export const ChatRetryEventSchema = z.object({
  conversation_id: z.string(),
  attempt: z.number(),
  max_attempts: z.number(),
  delay_ms: z.number(),
});
export type ChatRetryEvent = z.infer<typeof ChatRetryEventSchema>;

/** Recoverable or non-recoverable error during conversation. */
export const ChatErrorEventSchema = z.object({
  conversation_id: z.string(),
  error: z.string(),
  recoverable: z.boolean(),
});
export type ChatErrorEvent = z.infer<typeof ChatErrorEventSchema>;

/** API key was invalid or rejected. */
export const ChatInvalidKeyEventSchema = z.object({
  message: z.string(),
});
export type ChatInvalidKeyEvent = z.infer<typeof ChatInvalidKeyEventSchema>;

/** Rate limited by API -- retry after delay. */
export const ChatRateLimitedEventSchema = z.object({
  retry_after_ms: z.number(),
});
export type ChatRateLimitedEvent = z.infer<typeof ChatRateLimitedEventSchema>;

/** Conversation interrupted by user or system. */
export const ChatInterruptedEventSchema = z.object({
  conversation_id: z.string(),
  reason: z.string(),
});
export type ChatInterruptedEvent = z.infer<typeof ChatInterruptedEventSchema>;

/** Server-side error from Anthropic API. */
export const ChatServerErrorEventSchema = z.object({
  conversation_id: z.string(),
  status_code: z.number(),
  message: z.string(),
});
export type ChatServerErrorEvent = z.infer<typeof ChatServerErrorEventSchema>;

// ============================================================================
// Service event schemas (8)
// ============================================================================

/** Current status of a managed service. */
export const ServiceStatusEventSchema = z.object({
  service_id: z.string(),
  status: z.enum(['offline', 'starting', 'online', 'degraded', 'failed']),
});
export type ServiceStatusEvent = z.infer<typeof ServiceStatusEventSchema>;

/** Service transitioned between states with LED color update. */
export const ServiceStateChangeEventSchema = z.object({
  service_id: z.string(),
  from_status: z.string(),
  to_status: z.string(),
  led_color: z.string(),
});
export type ServiceStateChangeEvent = z.infer<typeof ServiceStateChangeEventSchema>;

/** Service starting with its met dependencies listed. */
export const ServiceStartingEventSchema = z.object({
  service_id: z.string(),
  dependencies_met: z.array(z.string()),
});
export type ServiceStartingEvent = z.infer<typeof ServiceStartingEventSchema>;

/** Result of a service control command (start/stop/restart). */
export const ServiceCommandEventSchema = z.object({
  service_id: z.string(),
  command: z.enum(['start', 'stop', 'restart']),
  result: z.enum(['ok', 'error']),
  detail: z.string().optional(),
});
export type ServiceCommandEvent = z.infer<typeof ServiceCommandEventSchema>;

/** Periodic health check result for a service. */
export const ServiceHealthCheckEventSchema = z.object({
  service_id: z.string(),
  healthy: z.boolean(),
  latency_ms: z.number(),
  consecutive_failures: z.number(),
});
export type ServiceHealthCheckEvent = z.infer<typeof ServiceHealthCheckEventSchema>;

/** Standard output line from a managed service. */
export const ServiceStdoutEventSchema = z.object({
  service_id: z.string(),
  line: z.string(),
});
export type ServiceStdoutEvent = z.infer<typeof ServiceStdoutEventSchema>;

/** Standard error line from a managed service. */
export const ServiceStderrEventSchema = z.object({
  service_id: z.string(),
  line: z.string(),
});
export type ServiceStderrEvent = z.infer<typeof ServiceStderrEventSchema>;

/** Service failed -- error details and restart availability. */
export const ServiceFailedEventSchema = z.object({
  service_id: z.string(),
  error: z.string(),
  restart_available: z.boolean(),
});
export type ServiceFailedEvent = z.infer<typeof ServiceFailedEventSchema>;

// ============================================================================
// Staging event schemas (7)
// ============================================================================

/** New file detected in staging intake directory. */
export const StagingIntakeNewEventSchema = z.object({
  file_path: z.string(),
  file_name: z.string(),
  size_bytes: z.number(),
});
export type StagingIntakeNewEvent = z.infer<typeof StagingIntakeNewEventSchema>;

/** File moved to processing with current stage. */
export const StagingIntakeProcessingEventSchema = z.object({
  file_path: z.string(),
  stage: z.enum(['validating', 'hygiene', 'routing']),
});
export type StagingIntakeProcessingEvent = z.infer<typeof StagingIntakeProcessingEventSchema>;

/** Content analysis detail for a staged file. */
export const StagingIntakeDetailEventSchema = z.object({
  file_path: z.string(),
  content_type: z.string(),
  estimated_scope: z.string(),
});
export type StagingIntakeDetailEvent = z.infer<typeof StagingIntakeDetailEventSchema>;

/** Hygiene check result (pass/fail with issues). */
export const StagingHygieneResultEventSchema = z.object({
  file_path: z.string(),
  passed: z.boolean(),
  issues: z.array(z.string()),
});
export type StagingHygieneResultEvent = z.infer<typeof StagingHygieneResultEventSchema>;

/** File processing complete -- routed to destination. */
export const StagingIntakeCompleteEventSchema = z.object({
  file_path: z.string(),
  destination: z.string(),
  notification_id: z.string(),
});
export type StagingIntakeCompleteEvent = z.infer<typeof StagingIntakeCompleteEventSchema>;

/** File quarantined due to hygiene failure. */
export const StagingQuarantineEventSchema = z.object({
  file_path: z.string(),
  reason: z.string(),
  detail: z.string(),
});
export type StagingQuarantineEvent = z.infer<typeof StagingQuarantineEventSchema>;

/** Mission debrief ready for collection. */
export const StagingDebriefReadyEventSchema = z.object({
  mission_id: z.string(),
  debrief_path: z.string(),
});
export type StagingDebriefReadyEvent = z.infer<typeof StagingDebriefReadyEventSchema>;

// ============================================================================
// Debug event schemas (2)
// ============================================================================

/** Raw IPC message for debugging. */
export const DebugIpcRawEventSchema = z.object({
  direction: z.enum(['send', 'receive']),
  command: z.string(),
  payload: z.unknown(),
});
export type DebugIpcRawEvent = z.infer<typeof DebugIpcRawEventSchema>;

/** Operation timing measurement. */
export const DebugTimingEventSchema = z.object({
  operation: z.string(),
  duration_ms: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type DebugTimingEvent = z.infer<typeof DebugTimingEventSchema>;

// ============================================================================
// Magic event schema (1)
// ============================================================================

/** Magic verbosity level changed. */
export const MagicLevelChangedEventSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  previous_level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  source: z.enum(['user', 'bootstrap', 'config']),
});
export type MagicLevelChangedEvent = z.infer<typeof MagicLevelChangedEventSchema>;

// ============================================================================
// Discriminated union (IpcEvent)
// ============================================================================

/**
 * Tagged union of all IPC events.
 *
 * Uses `event` as the discriminator field. The `payload` field contains
 * the event-specific data. JSON shape: `{ "event": "chat:delta", "payload": { ... } }`
 *
 * Rust equivalent: `IpcEvent` enum with `#[serde(tag = "event", content = "payload")]`
 */
export const IpcEventSchema = z.discriminatedUnion('event', [
  // Chat events
  z.object({ event: z.literal('chat:start'), payload: ChatStartEventSchema }),
  z.object({ event: z.literal('chat:delta'), payload: ChatDeltaEventSchema }),
  z.object({ event: z.literal('chat:usage'), payload: ChatUsageEventSchema }),
  z.object({ event: z.literal('chat:complete'), payload: ChatCompleteEventSchema }),
  z.object({ event: z.literal('chat:needs_key'), payload: ChatNeedsKeyEventSchema }),
  z.object({ event: z.literal('chat:retry'), payload: ChatRetryEventSchema }),
  z.object({ event: z.literal('chat:error'), payload: ChatErrorEventSchema }),
  z.object({ event: z.literal('chat:invalid_key'), payload: ChatInvalidKeyEventSchema }),
  z.object({ event: z.literal('chat:rate_limited'), payload: ChatRateLimitedEventSchema }),
  z.object({ event: z.literal('chat:interrupted'), payload: ChatInterruptedEventSchema }),
  z.object({ event: z.literal('chat:server_error'), payload: ChatServerErrorEventSchema }),

  // Service events
  z.object({ event: z.literal('service:status'), payload: ServiceStatusEventSchema }),
  z.object({ event: z.literal('service:state_change'), payload: ServiceStateChangeEventSchema }),
  z.object({ event: z.literal('service:starting'), payload: ServiceStartingEventSchema }),
  z.object({ event: z.literal('service:command'), payload: ServiceCommandEventSchema }),
  z.object({ event: z.literal('service:health_check'), payload: ServiceHealthCheckEventSchema }),
  z.object({ event: z.literal('service:stdout'), payload: ServiceStdoutEventSchema }),
  z.object({ event: z.literal('service:stderr'), payload: ServiceStderrEventSchema }),
  z.object({ event: z.literal('service:failed'), payload: ServiceFailedEventSchema }),

  // Staging events
  z.object({ event: z.literal('staging:intake_new'), payload: StagingIntakeNewEventSchema }),
  z.object({ event: z.literal('staging:intake_processing'), payload: StagingIntakeProcessingEventSchema }),
  z.object({ event: z.literal('staging:intake_detail'), payload: StagingIntakeDetailEventSchema }),
  z.object({ event: z.literal('staging:hygiene_result'), payload: StagingHygieneResultEventSchema }),
  z.object({ event: z.literal('staging:intake_complete'), payload: StagingIntakeCompleteEventSchema }),
  z.object({ event: z.literal('staging:quarantine'), payload: StagingQuarantineEventSchema }),
  z.object({ event: z.literal('staging:debrief_ready'), payload: StagingDebriefReadyEventSchema }),

  // Debug events
  z.object({ event: z.literal('debug:ipc_raw'), payload: DebugIpcRawEventSchema }),
  z.object({ event: z.literal('debug:timing'), payload: DebugTimingEventSchema }),

  // Magic events
  z.object({ event: z.literal('magic:level_changed'), payload: MagicLevelChangedEventSchema }),
]);

/** Inferred TypeScript type for the IPC event discriminated union. */
export type IpcEvent = z.infer<typeof IpcEventSchema>;
