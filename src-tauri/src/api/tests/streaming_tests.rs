//! Tests for the SSE parser -- all Anthropic event types.

use crate::api::streaming::{parse_sse_event, process_sse_stream, SseEvent, SseParseError};

#[test]
fn parse_content_block_delta() {
    let raw = "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"Hello\"}}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(
        event,
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "Hello".to_string()
        }
    );
}

#[test]
fn parse_message_start() {
    let raw = "event: message_start\ndata: {\"type\":\"message_start\",\"message\":{\"id\":\"msg_123\",\"model\":\"claude-sonnet-4-5-20250929\",\"usage\":{\"input_tokens\":42}}}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(
        event,
        SseEvent::MessageStart {
            id: "msg_123".to_string(),
            model: "claude-sonnet-4-5-20250929".to_string(),
            input_tokens: 42,
        }
    );
}

#[test]
fn parse_message_delta() {
    let raw = "event: message_delta\ndata: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"output_tokens\":100}}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(
        event,
        SseEvent::MessageDelta {
            stop_reason: "end_turn".to_string(),
            output_tokens: 100,
        }
    );
}

#[test]
fn parse_message_stop() {
    let raw = "event: message_stop\ndata: {\"type\":\"message_stop\"}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(event, SseEvent::MessageStop);
}

#[test]
fn parse_content_block_start() {
    let raw = "event: content_block_start\ndata: {\"type\":\"content_block_start\",\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"\"}}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(
        event,
        SseEvent::ContentBlockStart {
            index: 0,
            block_type: "text".to_string(),
        }
    );
}

#[test]
fn parse_content_block_stop() {
    let raw = "event: content_block_stop\ndata: {\"type\":\"content_block_stop\",\"index\":0}\n\n";
    let event = parse_sse_event(raw).unwrap();
    assert_eq!(event, SseEvent::ContentBlockStop { index: 0 });
}

#[test]
fn accumulate_full_response() {
    let events = vec![
        SseEvent::MessageStart {
            id: "msg_abc".to_string(),
            model: "claude-sonnet-4-5-20250929".to_string(),
            input_tokens: 10,
        },
        SseEvent::ContentBlockStart {
            index: 0,
            block_type: "text".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "Hello ".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "world".to_string(),
        },
        SseEvent::ContentBlockStop { index: 0 },
        SseEvent::MessageDelta {
            stop_reason: "end_turn".to_string(),
            output_tokens: 50,
        },
        SseEvent::MessageStop,
    ];
    let response = process_sse_stream(events);
    assert_eq!(response.id, "msg_abc");
    assert_eq!(response.full_text, "Hello world");
    assert_eq!(response.input_tokens, 10);
    assert_eq!(response.output_tokens, 50);
    assert_eq!(response.stop_reason, "end_turn");
}

#[test]
fn multiple_deltas_accumulate() {
    let events = vec![
        SseEvent::MessageStart {
            id: "msg_multi".to_string(),
            model: "claude-sonnet-4-5-20250929".to_string(),
            input_tokens: 5,
        },
        SseEvent::ContentBlockStart {
            index: 0,
            block_type: "text".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "H".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "e".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "l".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "l".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "o".to_string(),
        },
        SseEvent::ContentBlockStop { index: 0 },
        SseEvent::MessageDelta {
            stop_reason: "end_turn".to_string(),
            output_tokens: 5,
        },
        SseEvent::MessageStop,
    ];
    let response = process_sse_stream(events);
    assert_eq!(response.full_text, "Hello");
}

#[test]
fn token_usage_extraction() {
    let events = vec![
        SseEvent::MessageStart {
            id: "msg_tokens".to_string(),
            model: "claude-sonnet-4-5-20250929".to_string(),
            input_tokens: 42,
        },
        SseEvent::ContentBlockStart {
            index: 0,
            block_type: "text".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "ok".to_string(),
        },
        SseEvent::ContentBlockStop { index: 0 },
        SseEvent::MessageDelta {
            stop_reason: "end_turn".to_string(),
            output_tokens: 99,
        },
        SseEvent::MessageStop,
    ];
    let response = process_sse_stream(events);
    assert_eq!(response.input_tokens, 42);
    assert_eq!(response.output_tokens, 99);
}
