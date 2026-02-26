//! JSON round-trip parity tests for IPC event types.
//!
//! Verifies that Rust serde structs serialize to JSON with field names
//! matching the TypeScript Zod schemas (snake_case), and that round-trip
//! serialization (struct -> JSON -> struct) produces identical values.

use crate::ipc::types::*;
use crate::ipc::events;
use serde_json;
use std::collections::HashMap;

// ============================================================================
// Chat events
// ============================================================================

#[test]
fn chat_start_event_json_parity() {
    let event = ChatStartEvent {
        conversation_id: "conv-1".into(),
        model: "claude-opus-4-6".into(),
        timestamp: "2026-02-26T12:00:00Z".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["conversation_id"], "conv-1");
    assert_eq!(json["model"], "claude-opus-4-6");
    assert_eq!(json["timestamp"], "2026-02-26T12:00:00Z");
}

#[test]
fn chat_delta_event_json_parity() {
    let event = ChatDeltaEvent {
        conversation_id: "conv-1".into(),
        delta: "Hello".into(),
        index: 0,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["conversation_id"], "conv-1");
    assert_eq!(json["delta"], "Hello");
    assert_eq!(json["index"], 0);
}

#[test]
fn chat_usage_event_json_parity() {
    let event = ChatUsageEvent {
        conversation_id: "conv-1".into(),
        input_tokens: 100,
        output_tokens: 50,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["input_tokens"], 100);
    assert_eq!(json["output_tokens"], 50);
}

#[test]
fn chat_complete_event_json_parity() {
    let event = ChatCompleteEvent {
        conversation_id: "conv-1".into(),
        stop_reason: StopReason::EndTurn,
        usage: TokenUsage { input_tokens: 100, output_tokens: 50 },
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["stop_reason"], "end_turn");
    assert!(json["usage"].is_object());
    assert_eq!(json["usage"]["input_tokens"], 100);
}

#[test]
fn chat_needs_key_event_json_parity() {
    let event = ChatNeedsKeyEvent {
        message: "API key required".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["message"], "API key required");
}

#[test]
fn chat_retry_event_json_parity() {
    let event = ChatRetryEvent {
        conversation_id: "conv-1".into(),
        attempt: 2,
        max_attempts: 3,
        delay_ms: 1000,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["attempt"], 2);
    assert_eq!(json["max_attempts"], 3);
    assert_eq!(json["delay_ms"], 1000);
}

#[test]
fn chat_error_event_json_parity() {
    let event = ChatErrorEvent {
        conversation_id: "conv-1".into(),
        error: "Network error".into(),
        recoverable: true,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["recoverable"], true);
}

#[test]
fn chat_invalid_key_event_json_parity() {
    let event = ChatInvalidKeyEvent {
        message: "Invalid API key".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["message"], "Invalid API key");
}

#[test]
fn chat_rate_limited_event_json_parity() {
    let event = ChatRateLimitedEvent {
        retry_after_ms: 5000,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["retry_after_ms"], 5000);
}

#[test]
fn chat_interrupted_event_json_parity() {
    let event = ChatInterruptedEvent {
        conversation_id: "conv-1".into(),
        reason: "User cancelled".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["reason"], "User cancelled");
}

#[test]
fn chat_server_error_event_json_parity() {
    let event = ChatServerErrorEvent {
        conversation_id: "conv-1".into(),
        status_code: 500,
        message: "Internal server error".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["status_code"], 500);
    assert_eq!(json["message"], "Internal server error");
}

// ============================================================================
// Service events
// ============================================================================

#[test]
fn service_status_event_serializes_lowercase() {
    let event = ServiceStatusEvent {
        service_id: "api-client".into(),
        status: ServiceStatus::Online,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["status"], "online");

    // Test all variants
    for (variant, expected) in [
        (ServiceStatus::Offline, "offline"),
        (ServiceStatus::Starting, "starting"),
        (ServiceStatus::Online, "online"),
        (ServiceStatus::Degraded, "degraded"),
        (ServiceStatus::Failed, "failed"),
    ] {
        let e = ServiceStatusEvent {
            service_id: "svc".into(),
            status: variant,
        };
        let j = serde_json::to_value(&e).unwrap();
        assert_eq!(j["status"], expected);
    }
}

#[test]
fn service_state_change_includes_led_color() {
    let event = ServiceStateChangeEvent {
        service_id: "api-client".into(),
        from_status: "starting".into(),
        to_status: "online".into(),
        led_color: "green".into(),
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["led_color"], "green");
    assert!(json.get("led_color").is_some());
}

#[test]
fn service_command_event_json_parity() {
    let event = ServiceCommandEvent {
        service_id: "api-client".into(),
        command: ServiceCommand::Start,
        result: CommandResult::Ok,
        detail: None,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["command"], "start");
    assert_eq!(json["result"], "ok");
}

#[test]
fn service_health_check_event_json_parity() {
    let event = ServiceHealthCheckEvent {
        service_id: "api-client".into(),
        healthy: true,
        latency_ms: 42,
        consecutive_failures: 0,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["healthy"], true);
    assert_eq!(json["latency_ms"], 42);
}

// ============================================================================
// Magic event
// ============================================================================

#[test]
fn magic_level_serializes_as_integer() {
    let event = MagicLevelChangedEvent {
        level: 3,
        previous_level: 1,
        source: MagicSource::User,
    };
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["level"], 3);
    assert_eq!(json["previous_level"], 1);
    assert_eq!(json["source"], "user");
}

#[test]
fn magic_source_serializes_lowercase() {
    for (variant, expected) in [
        (MagicSource::User, "user"),
        (MagicSource::Bootstrap, "bootstrap"),
        (MagicSource::Config, "config"),
    ] {
        let e = MagicLevelChangedEvent {
            level: 1,
            previous_level: 1,
            source: variant,
        };
        let j = serde_json::to_value(&e).unwrap();
        assert_eq!(j["source"], expected);
    }
}

// ============================================================================
// Discriminated union (IpcEvent)
// ============================================================================

#[test]
fn ipc_event_chat_delta_tagged_serialization() {
    let event = IpcEvent::ChatDelta(ChatDeltaEvent {
        conversation_id: "conv-1".into(),
        delta: "Hello".into(),
        index: 0,
    });
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["event"], "chat:delta");
    assert!(json["payload"].is_object());
    assert_eq!(json["payload"]["delta"], "Hello");
}

#[test]
fn ipc_event_service_status_tagged_serialization() {
    let event = IpcEvent::ServiceStatus(ServiceStatusEvent {
        service_id: "api-client".into(),
        status: ServiceStatus::Online,
    });
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["event"], "service:status");
    assert_eq!(json["payload"]["status"], "online");
}

#[test]
fn ipc_event_magic_level_tagged_serialization() {
    let event = IpcEvent::MagicLevelChanged(MagicLevelChangedEvent {
        level: 5,
        previous_level: 3,
        source: MagicSource::Config,
    });
    let json = serde_json::to_value(&event).unwrap();
    assert_eq!(json["event"], "magic:level_changed");
    assert_eq!(json["payload"]["level"], 5);
}

// ============================================================================
// Round-trip tests
// ============================================================================

#[test]
fn chat_delta_round_trip() {
    let original = ChatDeltaEvent {
        conversation_id: "conv-1".into(),
        delta: "Hello world".into(),
        index: 42,
    };
    let json_str = serde_json::to_string(&original).unwrap();
    let deserialized: ChatDeltaEvent = serde_json::from_str(&json_str).unwrap();
    assert_eq!(original, deserialized);
}

#[test]
fn service_status_round_trip() {
    let original = ServiceStatusEvent {
        service_id: "api-client".into(),
        status: ServiceStatus::Degraded,
    };
    let json_str = serde_json::to_string(&original).unwrap();
    let deserialized: ServiceStatusEvent = serde_json::from_str(&json_str).unwrap();
    assert_eq!(original, deserialized);
}

#[test]
fn ipc_event_round_trip() {
    let original = IpcEvent::ChatDelta(ChatDeltaEvent {
        conversation_id: "conv-1".into(),
        delta: "Test".into(),
        index: 0,
    });
    let json_str = serde_json::to_string(&original).unwrap();
    let deserialized: IpcEvent = serde_json::from_str(&json_str).unwrap();
    assert_eq!(original, deserialized);
}

#[test]
fn debug_timing_with_metadata_round_trip() {
    let mut metadata = HashMap::new();
    metadata.insert("source".into(), serde_json::Value::String("benchmark".into()));
    let original = DebugTimingEvent {
        operation: "ipc_round_trip".into(),
        duration_ms: 42,
        metadata: Some(metadata),
    };
    let json_str = serde_json::to_string(&original).unwrap();
    let deserialized: DebugTimingEvent = serde_json::from_str(&json_str).unwrap();
    assert_eq!(original, deserialized);
}

// ============================================================================
// Event name constants
// ============================================================================

#[test]
fn event_name_constants_match_ts() {
    assert_eq!(events::CHAT_START, "chat:start");
    assert_eq!(events::CHAT_DELTA, "chat:delta");
    assert_eq!(events::CHAT_USAGE, "chat:usage");
    assert_eq!(events::CHAT_COMPLETE, "chat:complete");
    assert_eq!(events::SERVICE_STATUS, "service:status");
    assert_eq!(events::SERVICE_STATE_CHANGE, "service:state_change");
    assert_eq!(events::STAGING_INTAKE_NEW, "staging:intake_new");
    assert_eq!(events::DEBUG_IPC_RAW, "debug:ipc_raw");
    assert_eq!(events::MAGIC_LEVEL_CHANGED, "magic:level_changed");
}

#[test]
fn event_name_helper_returns_correct_name() {
    let event = IpcEvent::ChatDelta(ChatDeltaEvent {
        conversation_id: "conv-1".into(),
        delta: "test".into(),
        index: 0,
    });
    assert_eq!(events::event_name(&event), "chat:delta");
}
