//! Rust FFI types mirroring the TypeScript MCP interfaces in `src/types/mcp.ts`.
//!
//! All types derive `Serialize` and `Deserialize` with serde rename attributes
//! that produce camelCase JSON matching the TypeScript field names exactly.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// MCP Core Types
// ============================================================================

// -- TransportConfig ---------------------------------------------------------

/// Transport configuration for connecting to an MCP server.
///
/// Discriminated union matching TypeScript `TransportConfig` -- tagged on `"type"`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TransportConfig {
    /// stdio transport: launches a child process with the given command.
    #[serde(rename = "stdio")]
    Stdio {
        command: String,
        #[serde(default)]
        args: Vec<String>,
        #[serde(default)]
        env: HashMap<String, String>,
    },
    /// Streamable HTTP transport: connects to a remote MCP server over HTTP.
    #[serde(rename = "streamable-http")]
    StreamableHttp {
        url: String,
        #[serde(default)]
        headers: HashMap<String, String>,
    },
}

// -- Tool --------------------------------------------------------------------

/// MCP tool definition exposed by a server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub name: String,
    pub description: String,
    #[serde(rename = "inputSchema")]
    pub input_schema: serde_json::Value,
}

// -- Resource ----------------------------------------------------------------

/// MCP resource definition exposed by a server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub uri: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

// -- Prompt ------------------------------------------------------------------

/// MCP prompt argument definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptArgument {
    pub name: String,
    pub description: Option<String>,
    pub required: Option<bool>,
}

/// MCP prompt template definition exposed by a server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub name: String,
    pub description: Option<String>,
    pub arguments: Option<Vec<PromptArgument>>,
}

// -- ServerCapability --------------------------------------------------------

/// Discovered capabilities from an MCP server after initialization.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerCapability {
    pub tools: Vec<Tool>,
    pub resources: Vec<Resource>,
    pub prompts: Vec<Prompt>,
    pub server_name: String,
    pub server_version: String,
}

// -- McpError ----------------------------------------------------------------

/// JSON-RPC 2.0 error object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpError {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

// -- McpMessage --------------------------------------------------------------

/// JSON-RPC 2.0 message wrapper for MCP protocol communication.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpMessage {
    pub jsonrpc: String,
    pub id: Option<serde_json::Value>,
    pub method: Option<String>,
    pub params: Option<serde_json::Value>,
    pub result: Option<serde_json::Value>,
    pub error: Option<McpError>,
}

// -- TraceDirection ----------------------------------------------------------

/// Direction of an MCP message trace event.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TraceDirection {
    #[serde(rename = "outgoing")]
    Outgoing,
    #[serde(rename = "incoming")]
    Incoming,
}

// -- TraceEvent --------------------------------------------------------------

/// Structured trace record for MCP message observability.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceEvent {
    pub id: String,
    pub timestamp: u64,
    pub server_id: String,
    pub method: String,
    pub direction: TraceDirection,
    pub latency_ms: Option<u64>,
    pub payload: Option<serde_json::Value>,
    pub error: Option<String>,
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tool_serializes_to_camel_case_json() {
        let tool = Tool {
            name: "test-tool".to_string(),
            description: "A test tool".to_string(),
            input_schema: serde_json::json!({"type": "object"}),
        };
        let json = serde_json::to_string(&tool).unwrap();
        assert!(json.contains("inputSchema"));
        assert!(!json.contains("input_schema"));
    }

    #[test]
    fn transport_config_stdio_round_trips() {
        let config = TransportConfig::Stdio {
            command: "node".to_string(),
            args: vec!["server.js".to_string()],
            env: HashMap::new(),
        };
        let json = serde_json::to_string(&config).unwrap();
        let parsed: TransportConfig = serde_json::from_str(&json).unwrap();
        match parsed {
            TransportConfig::Stdio { command, .. } => assert_eq!(command, "node"),
            _ => panic!("Expected Stdio variant"),
        }
    }

    #[test]
    fn trust_state_serializes_as_lowercase() {
        let state = super::super::security::TrustState::Quarantine;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"quarantine\"");
    }
}
