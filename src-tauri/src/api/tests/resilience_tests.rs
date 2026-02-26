//! Tests for malformed SSE resilience -- stream must never crash on bad data.

use crate::api::streaming::{parse_sse_event, process_sse_stream, SseEvent};

#[test]
fn malformed_json_in_data_field() {
    let raw = "event: content_block_delta\ndata: {not valid json}\n\n";
    let result = parse_sse_event(raw);
    assert!(result.is_ok(), "Malformed JSON should return Ok, not Err");
    match result.unwrap() {
        SseEvent::Unknown(_) => {} // expected -- graceful skip
        other => panic!("Expected Unknown, got: {:?}", other),
    }
}

#[test]
fn missing_data_field() {
    let raw = "event: content_block_delta\n\n";
    let result = parse_sse_event(raw);
    assert!(result.is_ok(), "Missing data should return Ok, not Err");
    match result.unwrap() {
        SseEvent::Unknown(_) => {} // expected -- graceful skip
        other => panic!("Expected Unknown, got: {:?}", other),
    }
}

#[test]
fn empty_event() {
    let raw = "\n\n";
    let result = parse_sse_event(raw);
    assert!(result.is_ok(), "Empty event should return Ok");
    match result.unwrap() {
        SseEvent::Ping | SseEvent::Unknown(_) => {} // either is acceptable
        other => panic!("Expected Ping or Unknown, got: {:?}", other),
    }
}

#[test]
fn stream_continues_after_malformed_event() {
    let events = vec![
        SseEvent::MessageStart {
            id: "msg_resilient".to_string(),
            model: "claude-sonnet-4-5-20250929".to_string(),
            input_tokens: 5,
        },
        SseEvent::Unknown("bad event 1".to_string()),
        SseEvent::ContentBlockStart {
            index: 0,
            block_type: "text".to_string(),
        },
        SseEvent::ContentBlockDelta {
            index: 0,
            text: "Hi".to_string(),
        },
        SseEvent::Unknown("bad event 2".to_string()),
        SseEvent::ContentBlockStop { index: 0 },
        SseEvent::MessageDelta {
            stop_reason: "end_turn".to_string(),
            output_tokens: 1,
        },
        SseEvent::MessageStop,
    ];
    let response = process_sse_stream(events);
    assert_eq!(response.full_text, "Hi");
    assert_eq!(response.id, "msg_resilient");
}

#[test]
fn incomplete_sse_event_no_double_newline() {
    // An event without the trailing \n\n should be handled gracefully
    // This tests the parser directly -- the stream buffer handles partial events
    let raw = "event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"partial\"}}";
    // Without \n\n, this is technically a partial event. The parser should
    // still attempt to parse it if called directly.
    let result = parse_sse_event(raw);
    assert!(result.is_ok());
}

#[test]
fn unknown_event_type() {
    let raw = "event: some_future_event\ndata: {\"type\":\"new\"}\n\n";
    let result = parse_sse_event(raw);
    assert!(result.is_ok());
    match result.unwrap() {
        SseEvent::Unknown(name) => {
            assert_eq!(name, "some_future_event");
        }
        other => panic!("Expected Unknown, got: {:?}", other),
    }
}
