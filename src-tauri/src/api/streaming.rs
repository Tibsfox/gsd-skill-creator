//! SSE stream parser for Anthropic Messages API responses.
//!
//! Phase 376 -- API Client
//!
//! Converts raw Server-Sent Event byte streams into typed SseEvent variants.
//! The async stream_response function reads from a reqwest response body
//! and emits IPC events to the Tauri webview as deltas arrive.
//!
//! Security: No credential material flows through this module.
//! Resilience: Malformed SSE events are returned as SseEvent::Unknown,
//! never as errors -- the stream continues without crashing.

use serde::Deserialize;

// ============================================================================
// SSE event types
// ============================================================================

/// Parsed SSE event from the Anthropic Messages API.
#[derive(Debug, Clone, PartialEq)]
pub enum SseEvent {
    MessageStart {
        id: String,
        model: String,
        input_tokens: u32,
    },
    ContentBlockStart {
        index: u32,
        block_type: String,
    },
    ContentBlockDelta {
        index: u32,
        text: String,
    },
    ContentBlockStop {
        index: u32,
    },
    MessageDelta {
        stop_reason: String,
        output_tokens: u32,
    },
    MessageStop,
    Ping,
    /// Unknown or malformed event -- logged but not fatal.
    Unknown(String),
}

/// Errors from SSE parsing (only used internally).
#[derive(Debug, thiserror::Error)]
pub enum SseParseError {
    #[error("Missing data field")]
    MissingData,
    #[error("Invalid JSON in data field")]
    InvalidJson(#[from] serde_json::Error),
    #[error("Unknown event type: {0}")]
    UnknownEvent(String),
}

// ============================================================================
// JSON deserialization helpers
// ============================================================================

#[derive(Deserialize)]
struct MessageStartData {
    message: MessageStartMessage,
}

#[derive(Deserialize)]
struct MessageStartMessage {
    id: String,
    model: String,
    usage: MessageStartUsage,
}

#[derive(Deserialize)]
struct MessageStartUsage {
    input_tokens: u32,
}

#[derive(Deserialize)]
struct ContentBlockStartData {
    index: u32,
    content_block: ContentBlock,
}

#[derive(Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    block_type: String,
}

#[derive(Deserialize)]
struct ContentBlockDeltaData {
    index: u32,
    delta: TextDelta,
}

#[derive(Deserialize)]
struct TextDelta {
    text: String,
}

#[derive(Deserialize)]
struct ContentBlockStopData {
    index: u32,
}

#[derive(Deserialize)]
struct MessageDeltaData {
    delta: MessageDeltaDelta,
    usage: MessageDeltaUsage,
}

#[derive(Deserialize)]
struct MessageDeltaDelta {
    stop_reason: String,
}

#[derive(Deserialize)]
struct MessageDeltaUsage {
    output_tokens: u32,
}

// ============================================================================
// Accumulated response
// ============================================================================

/// Accumulated response from a complete SSE stream.
#[derive(Debug, Clone)]
pub struct MessageResponse {
    pub id: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub stop_reason: String,
    pub full_text: String,
}

// ============================================================================
// Parser
// ============================================================================

/// Parse a single SSE event from raw text.
///
/// Format: "event: <type>\ndata: <json>\n\n"
///
/// Returns Ok(SseEvent::Unknown) for malformed events instead of Err,
/// ensuring the stream never crashes on bad data (API-09).
pub fn parse_sse_event(raw: &str) -> Result<SseEvent, SseParseError> {
    let trimmed = raw.trim();

    // Empty or whitespace-only input -> Ping
    if trimmed.is_empty() {
        return Ok(SseEvent::Ping);
    }

    // Extract event type and data lines
    let mut event_type: Option<&str> = None;
    let mut data_line: Option<&str> = None;

    for line in raw.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("event:") {
            event_type = Some(rest.trim());
        } else if let Some(rest) = line.strip_prefix("data:") {
            data_line = Some(rest.trim());
        }
    }

    // No event type found
    let event_name = match event_type {
        Some(name) => name,
        None => return Ok(SseEvent::Unknown(raw.to_string())),
    };

    // Ping event
    if event_name == "ping" {
        return Ok(SseEvent::Ping);
    }

    // No data field
    let data_str = match data_line {
        Some(d) => d,
        None => return Ok(SseEvent::Unknown(raw.to_string())),
    };

    // Parse JSON based on event type
    match event_name {
        "message_start" => {
            match serde_json::from_str::<MessageStartData>(data_str) {
                Ok(parsed) => Ok(SseEvent::MessageStart {
                    id: parsed.message.id,
                    model: parsed.message.model,
                    input_tokens: parsed.message.usage.input_tokens,
                }),
                Err(_) => Ok(SseEvent::Unknown(raw.to_string())),
            }
        }
        "content_block_start" => {
            match serde_json::from_str::<ContentBlockStartData>(data_str) {
                Ok(parsed) => Ok(SseEvent::ContentBlockStart {
                    index: parsed.index,
                    block_type: parsed.content_block.block_type,
                }),
                Err(_) => Ok(SseEvent::Unknown(raw.to_string())),
            }
        }
        "content_block_delta" => {
            match serde_json::from_str::<ContentBlockDeltaData>(data_str) {
                Ok(parsed) => Ok(SseEvent::ContentBlockDelta {
                    index: parsed.index,
                    text: parsed.delta.text,
                }),
                Err(_) => Ok(SseEvent::Unknown(raw.to_string())),
            }
        }
        "content_block_stop" => {
            match serde_json::from_str::<ContentBlockStopData>(data_str) {
                Ok(parsed) => Ok(SseEvent::ContentBlockStop {
                    index: parsed.index,
                }),
                Err(_) => Ok(SseEvent::Unknown(raw.to_string())),
            }
        }
        "message_delta" => {
            match serde_json::from_str::<MessageDeltaData>(data_str) {
                Ok(parsed) => Ok(SseEvent::MessageDelta {
                    stop_reason: parsed.delta.stop_reason,
                    output_tokens: parsed.usage.output_tokens,
                }),
                Err(_) => Ok(SseEvent::Unknown(raw.to_string())),
            }
        }
        "message_stop" => Ok(SseEvent::MessageStop),
        _ => Ok(SseEvent::Unknown(event_name.to_string())),
    }
}

/// Process a complete sequence of SSE events into a MessageResponse.
///
/// Unknown events are silently skipped -- they do not contribute to
/// full_text or token counts.
pub fn process_sse_stream(events: Vec<SseEvent>) -> MessageResponse {
    let mut id = String::new();
    let mut input_tokens = 0u32;
    let mut output_tokens = 0u32;
    let mut stop_reason = String::new();
    let mut full_text = String::new();

    for event in events {
        match event {
            SseEvent::MessageStart {
                id: msg_id,
                input_tokens: tokens,
                ..
            } => {
                id = msg_id;
                input_tokens = tokens;
            }
            SseEvent::ContentBlockDelta { text, .. } => {
                full_text.push_str(&text);
            }
            SseEvent::MessageDelta {
                stop_reason: reason,
                output_tokens: tokens,
            } => {
                stop_reason = reason;
                output_tokens = tokens;
            }
            // ContentBlockStart, ContentBlockStop, MessageStop, Ping, Unknown -- skip
            _ => {}
        }
    }

    MessageResponse {
        id,
        input_tokens,
        output_tokens,
        stop_reason,
        full_text,
    }
}

/// Stream an SSE response from the Anthropic API, emitting IPC events to the webview.
///
/// Reads the response body as a byte stream, splits on double-newline boundaries,
/// and parses each chunk as an SSE event. IPC events are emitted for each relevant
/// event type. Malformed events are logged and skipped.
pub async fn stream_response(
    response: reqwest::Response,
    app_handle: &tauri::AppHandle,
    conversation_id: &str,
) -> Result<MessageResponse, crate::api::client::ApiError> {
    use futures_util::StreamExt;
    use tauri::Emitter;

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut events: Vec<SseEvent> = Vec::new();
    let mut delta_index: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(crate::api::client::ApiError::Network)?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // Split on double-newline boundaries
        while let Some(pos) = buffer.find("\n\n") {
            let raw_event = buffer[..pos + 2].to_string();
            buffer = buffer[pos + 2..].to_string();

            match parse_sse_event(&raw_event) {
                Ok(event) => {
                    match &event {
                        SseEvent::MessageStart { id, model, .. } => {
                            let _ = app_handle.emit(
                                crate::ipc::events::CHAT_START,
                                serde_json::json!({
                                    "conversation_id": conversation_id,
                                    "model": model,
                                    "timestamp": id,
                                }),
                            );
                        }
                        SseEvent::ContentBlockDelta { text, .. } => {
                            let _ = app_handle.emit(
                                crate::ipc::events::CHAT_DELTA,
                                serde_json::json!({
                                    "conversation_id": conversation_id,
                                    "delta": text,
                                    "index": delta_index,
                                }),
                            );
                            delta_index += 1;
                        }
                        SseEvent::MessageDelta {
                            output_tokens, ..
                        } => {
                            let _ = app_handle.emit(
                                crate::ipc::events::CHAT_USAGE,
                                serde_json::json!({
                                    "conversation_id": conversation_id,
                                    "input_tokens": 0,
                                    "output_tokens": output_tokens,
                                }),
                            );
                        }
                        SseEvent::MessageStop => {
                            // Will emit chat:complete after processing
                        }
                        SseEvent::Unknown(ref raw) => {
                            eprintln!("[api::streaming] Unknown SSE event: {}", raw);
                        }
                        _ => {}
                    }
                    events.push(event);
                }
                Err(e) => {
                    eprintln!("[api::streaming] SSE parse error: {}", e);
                }
            }
        }
    }

    let response = process_sse_stream(events);

    // Emit completion event
    let _ = app_handle.emit(
        crate::ipc::events::CHAT_COMPLETE,
        serde_json::json!({
            "conversation_id": conversation_id,
            "stop_reason": response.stop_reason,
            "usage": {
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
            },
        }),
    );

    Ok(response)
}
