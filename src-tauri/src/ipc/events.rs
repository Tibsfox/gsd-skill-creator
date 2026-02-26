//! IPC event name constants and helper functions.
//!
//! String constants for all 29 IPC event names, matching the TypeScript
//! `IPC_EVENT_NAMES` object in `src/types/ipc-events.ts`.
//!
//! Format: `category:snake_case_action`

use super::types::IpcEvent;

// ============================================================================
// Chat event names (11)
// ============================================================================

pub const CHAT_START: &str = "chat:start";
pub const CHAT_DELTA: &str = "chat:delta";
pub const CHAT_USAGE: &str = "chat:usage";
pub const CHAT_COMPLETE: &str = "chat:complete";
pub const CHAT_NEEDS_KEY: &str = "chat:needs_key";
pub const CHAT_RETRY: &str = "chat:retry";
pub const CHAT_ERROR: &str = "chat:error";
pub const CHAT_INVALID_KEY: &str = "chat:invalid_key";
pub const CHAT_RATE_LIMITED: &str = "chat:rate_limited";
pub const CHAT_INTERRUPTED: &str = "chat:interrupted";
pub const CHAT_SERVER_ERROR: &str = "chat:server_error";

// ============================================================================
// Service event names (8)
// ============================================================================

pub const SERVICE_STATUS: &str = "service:status";
pub const SERVICE_STATE_CHANGE: &str = "service:state_change";
pub const SERVICE_STARTING: &str = "service:starting";
pub const SERVICE_COMMAND: &str = "service:command";
pub const SERVICE_HEALTH_CHECK: &str = "service:health_check";
pub const SERVICE_STDOUT: &str = "service:stdout";
pub const SERVICE_STDERR: &str = "service:stderr";
pub const SERVICE_FAILED: &str = "service:failed";

// ============================================================================
// Staging event names (7)
// ============================================================================

pub const STAGING_INTAKE_NEW: &str = "staging:intake_new";
pub const STAGING_INTAKE_PROCESSING: &str = "staging:intake_processing";
pub const STAGING_INTAKE_DETAIL: &str = "staging:intake_detail";
pub const STAGING_HYGIENE_RESULT: &str = "staging:hygiene_result";
pub const STAGING_INTAKE_COMPLETE: &str = "staging:intake_complete";
pub const STAGING_QUARANTINE: &str = "staging:quarantine";
pub const STAGING_DEBRIEF_READY: &str = "staging:debrief_ready";

// ============================================================================
// Debug event names (2)
// ============================================================================

pub const DEBUG_IPC_RAW: &str = "debug:ipc_raw";
pub const DEBUG_TIMING: &str = "debug:timing";

// ============================================================================
// Magic event names (1)
// ============================================================================

pub const MAGIC_LEVEL_CHANGED: &str = "magic:level_changed";

// ============================================================================
// Helper
// ============================================================================

/// Returns the event name string for a given IPC event variant.
pub fn event_name(event: &IpcEvent) -> &'static str {
    match event {
        // Chat
        IpcEvent::ChatStart(_) => CHAT_START,
        IpcEvent::ChatDelta(_) => CHAT_DELTA,
        IpcEvent::ChatUsage(_) => CHAT_USAGE,
        IpcEvent::ChatComplete(_) => CHAT_COMPLETE,
        IpcEvent::ChatNeedsKey(_) => CHAT_NEEDS_KEY,
        IpcEvent::ChatRetry(_) => CHAT_RETRY,
        IpcEvent::ChatError(_) => CHAT_ERROR,
        IpcEvent::ChatInvalidKey(_) => CHAT_INVALID_KEY,
        IpcEvent::ChatRateLimited(_) => CHAT_RATE_LIMITED,
        IpcEvent::ChatInterrupted(_) => CHAT_INTERRUPTED,
        IpcEvent::ChatServerError(_) => CHAT_SERVER_ERROR,
        // Service
        IpcEvent::ServiceStatus(_) => SERVICE_STATUS,
        IpcEvent::ServiceStateChange(_) => SERVICE_STATE_CHANGE,
        IpcEvent::ServiceStarting(_) => SERVICE_STARTING,
        IpcEvent::ServiceCommand(_) => SERVICE_COMMAND,
        IpcEvent::ServiceHealthCheck(_) => SERVICE_HEALTH_CHECK,
        IpcEvent::ServiceStdout(_) => SERVICE_STDOUT,
        IpcEvent::ServiceStderr(_) => SERVICE_STDERR,
        IpcEvent::ServiceFailed(_) => SERVICE_FAILED,
        // Staging
        IpcEvent::StagingIntakeNew(_) => STAGING_INTAKE_NEW,
        IpcEvent::StagingIntakeProcessing(_) => STAGING_INTAKE_PROCESSING,
        IpcEvent::StagingIntakeDetail(_) => STAGING_INTAKE_DETAIL,
        IpcEvent::StagingHygieneResult(_) => STAGING_HYGIENE_RESULT,
        IpcEvent::StagingIntakeComplete(_) => STAGING_INTAKE_COMPLETE,
        IpcEvent::StagingQuarantine(_) => STAGING_QUARANTINE,
        IpcEvent::StagingDebriefReady(_) => STAGING_DEBRIEF_READY,
        // Debug
        IpcEvent::DebugIpcRaw(_) => DEBUG_IPC_RAW,
        IpcEvent::DebugTiming(_) => DEBUG_TIMING,
        // Magic
        IpcEvent::MagicLevelChanged(_) => MAGIC_LEVEL_CHANGED,
    }
}
