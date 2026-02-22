//! MCP message trace recording and emission.
//!
//! `TraceEmitter` records structured TraceEvents for every MCP message
//! and emits them via the Tauri event system for real-time observability.

use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::Emitter;

use super::types::{TraceDirection, TraceEvent};

// ============================================================================
// TraceEmitter
// ============================================================================

/// Records and emits structured trace events for MCP message observability.
///
/// Uses a ring buffer (VecDeque) capped at `max_buffer` entries. Oldest
/// events are evicted when the buffer is full. Events can be emitted via
/// Tauri's event system for real-time frontend consumption.
pub struct TraceEmitter {
    buffer: VecDeque<TraceEvent>,
    max_buffer: usize,
}

impl TraceEmitter {
    /// Creates a new TraceEmitter with the given buffer capacity.
    pub fn new(max_buffer: usize) -> Self {
        Self {
            buffer: VecDeque::with_capacity(max_buffer),
            max_buffer,
        }
    }

    /// Returns the current unix timestamp in milliseconds.
    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }

    /// Records an outgoing MCP message (request/notification sent to server).
    ///
    /// Returns the trace event ID for correlating with the response.
    pub fn record_outgoing(
        &mut self,
        server_id: &str,
        method: &str,
        payload: Option<serde_json::Value>,
    ) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let event = TraceEvent {
            id: id.clone(),
            timestamp: Self::now_ms(),
            server_id: server_id.to_string(),
            method: method.to_string(),
            direction: TraceDirection::Outgoing,
            latency_ms: None,
            payload,
            error: None,
        };

        self.push_event(event);
        id
    }

    /// Records an incoming MCP message (response received from server).
    ///
    /// Computes latency from the provided request timestamp. Returns the
    /// created TraceEvent for immediate emission.
    pub fn record_incoming(
        &mut self,
        server_id: &str,
        method: &str,
        request_timestamp: u64,
        payload: Option<serde_json::Value>,
        error: Option<String>,
    ) -> TraceEvent {
        let now = Self::now_ms();
        let latency_ms = if now > request_timestamp {
            Some(now - request_timestamp)
        } else {
            Some(0)
        };

        let event = TraceEvent {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: now,
            server_id: server_id.to_string(),
            method: method.to_string(),
            direction: TraceDirection::Incoming,
            latency_ms,
            payload,
            error,
        };

        self.push_event(event.clone());
        event
    }

    /// Pushes an event to the ring buffer, evicting the oldest if full.
    fn push_event(&mut self, event: TraceEvent) {
        if self.buffer.len() >= self.max_buffer {
            self.buffer.pop_front();
        }
        self.buffer.push_back(event);
    }

    /// Emits a TraceEvent as a Tauri event on the "mcp-trace" channel.
    ///
    /// If emission fails (no listeners, app shutting down), logs to stderr
    /// but does not propagate the error -- tracing is observability, not
    /// critical path.
    pub fn emit(&self, app_handle: &tauri::AppHandle, event: &TraceEvent) {
        if let Err(e) = app_handle.emit("mcp-trace", event) {
            eprintln!("Failed to emit mcp-trace event: {}", e);
        }
    }

    /// Returns the most recent `count` events.
    pub fn get_recent(&self, count: usize) -> Vec<&TraceEvent> {
        self.buffer.iter().rev().take(count).collect()
    }

    /// Returns recent events filtered by server ID.
    pub fn get_by_server(&self, server_id: &str, count: usize) -> Vec<&TraceEvent> {
        self.buffer
            .iter()
            .rev()
            .filter(|e| e.server_id == server_id)
            .take(count)
            .collect()
    }

    /// Clears all buffered events.
    pub fn clear(&mut self) {
        self.buffer.clear();
    }

    /// Returns the number of buffered events.
    pub fn len(&self) -> usize {
        self.buffer.len()
    }

    /// Returns true if the buffer is empty.
    pub fn is_empty(&self) -> bool {
        self.buffer.is_empty()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn record_outgoing_creates_event() {
        let mut emitter = TraceEmitter::new(100);
        let id = emitter.record_outgoing("server-1", "tools/call", None);

        assert!(!id.is_empty());
        assert_eq!(emitter.len(), 1);

        let events = emitter.get_recent(10);
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].direction, TraceDirection::Outgoing);
        assert_eq!(events[0].server_id, "server-1");
        assert_eq!(events[0].method, "tools/call");
        assert!(events[0].latency_ms.is_none());
    }

    #[test]
    fn record_incoming_computes_latency() {
        let mut emitter = TraceEmitter::new(100);
        // Use a timestamp from 100ms ago
        let request_ts = TraceEmitter::now_ms().saturating_sub(100);
        let event = emitter.record_incoming(
            "server-1",
            "tools/call",
            request_ts,
            Some(serde_json::json!({"result": "ok"})),
            None,
        );

        assert_eq!(event.direction, TraceDirection::Incoming);
        assert!(event.latency_ms.is_some());
        // Latency should be at least ~100ms (allowing some timing variance)
        assert!(event.latency_ms.unwrap() >= 50);
        assert_eq!(emitter.len(), 1);
    }

    #[test]
    fn buffer_caps_at_max() {
        let mut emitter = TraceEmitter::new(2);
        emitter.record_outgoing("s1", "method-1", None);
        emitter.record_outgoing("s1", "method-2", None);
        emitter.record_outgoing("s1", "method-3", None);

        assert_eq!(emitter.len(), 2);

        // Oldest event (method-1) should be evicted
        let events = emitter.get_recent(10);
        assert_eq!(events.len(), 2);
        // Most recent first
        assert_eq!(events[0].method, "method-3");
        assert_eq!(events[1].method, "method-2");
    }

    #[test]
    fn get_by_server_filters() {
        let mut emitter = TraceEmitter::new(100);
        emitter.record_outgoing("server-a", "tools/call", None);
        emitter.record_outgoing("server-b", "tools/list", None);
        emitter.record_outgoing("server-a", "resources/list", None);

        let server_a = emitter.get_by_server("server-a", 10);
        assert_eq!(server_a.len(), 2);
        for event in &server_a {
            assert_eq!(event.server_id, "server-a");
        }

        let server_b = emitter.get_by_server("server-b", 10);
        assert_eq!(server_b.len(), 1);
        assert_eq!(server_b[0].server_id, "server-b");

        let server_c = emitter.get_by_server("server-c", 10);
        assert!(server_c.is_empty());
    }

    #[test]
    fn clear_empties_buffer() {
        let mut emitter = TraceEmitter::new(100);
        emitter.record_outgoing("s1", "test", None);
        emitter.record_outgoing("s1", "test", None);
        assert_eq!(emitter.len(), 2);
        assert!(!emitter.is_empty());

        emitter.clear();
        assert_eq!(emitter.len(), 0);
        assert!(emitter.is_empty());
    }
}
