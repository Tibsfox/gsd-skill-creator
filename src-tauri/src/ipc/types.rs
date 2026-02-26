//! IPC event type definitions for all cross-boundary communication in GSD-OS (v1.39).
//!
//! Serde-serializable structs and enums matching the TypeScript Zod schemas
//! in `src/types/ipc-events.ts`. JSON serialization uses snake_case field names
//! (Rust default) to match the TypeScript Zod schema key names exactly.
//!
//! All types round-trip through JSON: serialize to JSON, deserialize back,
//! and the result equals the original.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Shared enums
// ============================================================================

/// Stop reason for a completed chat response.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StopReason {
    #[serde(rename = "end_turn")]
    EndTurn,
    #[serde(rename = "max_tokens")]
    MaxTokens,
    #[serde(rename = "stop_sequence")]
    StopSequence,
}

/// Token usage statistics.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
}

/// Service lifecycle status.
///
/// Maps to LED colors in the taskbar:
/// - Offline -> red
/// - Starting -> amber
/// - Online -> green
/// - Degraded -> amber-blink
/// - Failed -> red-blink
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ServiceStatus {
    Offline,
    Starting,
    Online,
    Degraded,
    Failed,
}

/// Service control command.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ServiceCommand {
    Start,
    Stop,
    Restart,
}

/// Result of a service control command.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CommandResult {
    Ok,
    Error,
}

/// Staging intake processing stage.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IntakeStage {
    Validating,
    Hygiene,
    Routing,
}

/// IPC debug message direction.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DebugDirection {
    Send,
    Receive,
}

/// Source of a magic level change.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MagicSource {
    User,
    Bootstrap,
    Config,
}

// ============================================================================
// Chat event structs (11)
// ============================================================================

/// Conversation started -- model selected, ready for input.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatStartEvent {
    pub conversation_id: String,
    pub model: String,
    pub timestamp: String,
}

/// Streaming text delta from Claude response.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatDeltaEvent {
    pub conversation_id: String,
    pub delta: String,
    pub index: u64,
}

/// Token usage statistics for a response.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatUsageEvent {
    pub conversation_id: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
}

/// Response completed -- stop reason and final usage.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatCompleteEvent {
    pub conversation_id: String,
    pub stop_reason: StopReason,
    pub usage: TokenUsage,
}

/// API key needed before conversation can proceed.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatNeedsKeyEvent {
    pub message: String,
}

/// Retrying a failed request.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatRetryEvent {
    pub conversation_id: String,
    pub attempt: u32,
    pub max_attempts: u32,
    pub delay_ms: u64,
}

/// Recoverable or non-recoverable error during conversation.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatErrorEvent {
    pub conversation_id: String,
    pub error: String,
    pub recoverable: bool,
}

/// API key was invalid or rejected.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatInvalidKeyEvent {
    pub message: String,
}

/// Rate limited by API -- retry after delay.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatRateLimitedEvent {
    pub retry_after_ms: u64,
}

/// Conversation interrupted by user or system.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatInterruptedEvent {
    pub conversation_id: String,
    pub reason: String,
}

/// Server-side error from Anthropic API.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ChatServerErrorEvent {
    pub conversation_id: String,
    pub status_code: u16,
    pub message: String,
}

// ============================================================================
// Service event structs (8)
// ============================================================================

/// Current status of a managed service.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceStatusEvent {
    pub service_id: String,
    pub status: ServiceStatus,
}

/// Service transitioned between states with LED color update.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceStateChangeEvent {
    pub service_id: String,
    pub from_status: String,
    pub to_status: String,
    pub led_color: String,
}

/// Service starting with its met dependencies listed.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceStartingEvent {
    pub service_id: String,
    pub dependencies_met: Vec<String>,
}

/// Result of a service control command (start/stop/restart).
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceCommandEvent {
    pub service_id: String,
    pub command: ServiceCommand,
    pub result: CommandResult,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

/// Periodic health check result for a service.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceHealthCheckEvent {
    pub service_id: String,
    pub healthy: bool,
    pub latency_ms: u64,
    pub consecutive_failures: u32,
}

/// Standard output line from a managed service.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceStdoutEvent {
    pub service_id: String,
    pub line: String,
}

/// Standard error line from a managed service.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceStderrEvent {
    pub service_id: String,
    pub line: String,
}

/// Service failed -- error details and restart availability.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ServiceFailedEvent {
    pub service_id: String,
    pub error: String,
    pub restart_available: bool,
}

// ============================================================================
// Staging event structs (7)
// ============================================================================

/// New file detected in staging intake directory.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingIntakeNewEvent {
    pub file_path: String,
    pub file_name: String,
    pub size_bytes: u64,
}

/// File moved to processing with current stage.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingIntakeProcessingEvent {
    pub file_path: String,
    pub stage: IntakeStage,
}

/// Content analysis detail for a staged file.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingIntakeDetailEvent {
    pub file_path: String,
    pub content_type: String,
    pub estimated_scope: String,
}

/// Hygiene check result (pass/fail with issues).
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingHygieneResultEvent {
    pub file_path: String,
    pub passed: bool,
    pub issues: Vec<String>,
}

/// File processing complete -- routed to destination.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingIntakeCompleteEvent {
    pub file_path: String,
    pub destination: String,
    pub notification_id: String,
}

/// File quarantined due to hygiene failure.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingQuarantineEvent {
    pub file_path: String,
    pub reason: String,
    pub detail: String,
}

/// Mission debrief ready for collection.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct StagingDebriefReadyEvent {
    pub mission_id: String,
    pub debrief_path: String,
}

// ============================================================================
// Debug event structs (2)
// ============================================================================

/// Raw IPC message for debugging.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct DebugIpcRawEvent {
    pub direction: DebugDirection,
    pub command: String,
    pub payload: serde_json::Value,
}

/// Operation timing measurement.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct DebugTimingEvent {
    pub operation: String,
    pub duration_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

// ============================================================================
// Magic event struct (1)
// ============================================================================

/// Magic verbosity level changed.
///
/// Level is an integer 1-5. Source indicates what triggered the change.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct MagicLevelChangedEvent {
    pub level: u8,
    pub previous_level: u8,
    pub source: MagicSource,
}

// ============================================================================
// Discriminated union (IpcEvent)
// ============================================================================

/// Tagged union of all IPC events.
///
/// Serializes to JSON as: `{ "event": "chat:delta", "payload": { ... } }`
///
/// TypeScript equivalent: `IpcEventSchema` discriminated union in
/// `src/types/ipc-events.ts`.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(tag = "event", content = "payload")]
pub enum IpcEvent {
    // Chat events
    #[serde(rename = "chat:start")]
    ChatStart(ChatStartEvent),
    #[serde(rename = "chat:delta")]
    ChatDelta(ChatDeltaEvent),
    #[serde(rename = "chat:usage")]
    ChatUsage(ChatUsageEvent),
    #[serde(rename = "chat:complete")]
    ChatComplete(ChatCompleteEvent),
    #[serde(rename = "chat:needs_key")]
    ChatNeedsKey(ChatNeedsKeyEvent),
    #[serde(rename = "chat:retry")]
    ChatRetry(ChatRetryEvent),
    #[serde(rename = "chat:error")]
    ChatError(ChatErrorEvent),
    #[serde(rename = "chat:invalid_key")]
    ChatInvalidKey(ChatInvalidKeyEvent),
    #[serde(rename = "chat:rate_limited")]
    ChatRateLimited(ChatRateLimitedEvent),
    #[serde(rename = "chat:interrupted")]
    ChatInterrupted(ChatInterruptedEvent),
    #[serde(rename = "chat:server_error")]
    ChatServerError(ChatServerErrorEvent),

    // Service events
    #[serde(rename = "service:status")]
    ServiceStatus(ServiceStatusEvent),
    #[serde(rename = "service:state_change")]
    ServiceStateChange(ServiceStateChangeEvent),
    #[serde(rename = "service:starting")]
    ServiceStarting(ServiceStartingEvent),
    #[serde(rename = "service:command")]
    ServiceCommand(ServiceCommandEvent),
    #[serde(rename = "service:health_check")]
    ServiceHealthCheck(ServiceHealthCheckEvent),
    #[serde(rename = "service:stdout")]
    ServiceStdout(ServiceStdoutEvent),
    #[serde(rename = "service:stderr")]
    ServiceStderr(ServiceStderrEvent),
    #[serde(rename = "service:failed")]
    ServiceFailed(ServiceFailedEvent),

    // Staging events
    #[serde(rename = "staging:intake_new")]
    StagingIntakeNew(StagingIntakeNewEvent),
    #[serde(rename = "staging:intake_processing")]
    StagingIntakeProcessing(StagingIntakeProcessingEvent),
    #[serde(rename = "staging:intake_detail")]
    StagingIntakeDetail(StagingIntakeDetailEvent),
    #[serde(rename = "staging:hygiene_result")]
    StagingHygieneResult(StagingHygieneResultEvent),
    #[serde(rename = "staging:intake_complete")]
    StagingIntakeComplete(StagingIntakeCompleteEvent),
    #[serde(rename = "staging:quarantine")]
    StagingQuarantine(StagingQuarantineEvent),
    #[serde(rename = "staging:debrief_ready")]
    StagingDebriefReady(StagingDebriefReadyEvent),

    // Debug events
    #[serde(rename = "debug:ipc_raw")]
    DebugIpcRaw(DebugIpcRawEvent),
    #[serde(rename = "debug:timing")]
    DebugTiming(DebugTimingEvent),

    // Magic events
    #[serde(rename = "magic:level_changed")]
    MagicLevelChanged(MagicLevelChangedEvent),
}
