//! Tool routing for the MCP host manager.
//!
//! `ToolRouter` maintains an index mapping tool names to server IDs and
//! dispatches tool call requests to the correct server with timeout handling.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

use super::connection::{ConnectionStatus, ServerConnection};
use super::manager::HostManager;

// ============================================================================
// ToolCallResult
// ============================================================================

/// Result of a tool call dispatched through the router.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCallResult {
    pub tool_name: String,
    pub server_id: String,
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub latency_ms: u64,
}

// ============================================================================
// ToolRouter
// ============================================================================

/// Routes tool calls to the correct MCP server by tool name.
///
/// Maintains an index mapping each tool name to the server ID that owns it.
/// On tool call, looks up the server, dispatches the JSON-RPC request, and
/// returns the result with latency tracking.
pub struct ToolRouter {
    /// Maps tool name -> server id.
    tool_index: HashMap<String, String>,
}

impl ToolRouter {
    /// Creates an empty router with no indexed tools.
    pub fn new() -> Self {
        Self {
            tool_index: HashMap::new(),
        }
    }

    /// Rebuilds the tool-to-server index from all connected servers.
    ///
    /// Clears the existing index and re-scans all connections for their
    /// discovered capabilities. If duplicate tool names exist across servers,
    /// the last server scanned wins (with a warning to stderr).
    pub fn rebuild_index(&mut self, connections: &HashMap<String, ServerConnection>) {
        self.tool_index.clear();

        for (server_id, conn) in connections {
            if conn.status != ConnectionStatus::Connected {
                continue;
            }

            if let Some(caps) = &conn.capabilities {
                for tool in &caps.tools {
                    if let Some(existing) = self.tool_index.get(&tool.name) {
                        eprintln!(
                            "Warning: tool '{}' registered by both '{}' and '{}', using '{}'",
                            tool.name, existing, server_id, server_id
                        );
                    }
                    self.tool_index.insert(tool.name.clone(), server_id.clone());
                }
            }
        }
    }

    /// Resolves a tool name to the server ID that owns it.
    pub fn resolve(&self, tool_name: &str) -> Option<&str> {
        self.tool_index.get(tool_name).map(|s| s.as_str())
    }

    /// Dispatches a tool call to the correct server and returns the result.
    ///
    /// Resolves the tool name, sends a `tools/call` JSON-RPC request to the
    /// owning server, and tracks latency. The 30-second timeout is enforced
    /// by ServerConnection::send_request.
    pub async fn call_tool(
        &self,
        tool_name: &str,
        params: serde_json::Value,
        manager: &mut HostManager,
    ) -> Result<ToolCallResult, String> {
        let server_id = self
            .resolve(tool_name)
            .ok_or_else(|| format!("Unknown tool: {}", tool_name))?
            .to_string();

        let conn = manager.get_connection_mut(&server_id).ok_or_else(|| {
            format!("Server unavailable: {}", server_id)
        })?;

        if conn.status != ConnectionStatus::Connected {
            return Err(format!("Server '{}' is not connected", server_id));
        }

        let start = Instant::now();

        let call_params = serde_json::json!({
            "name": tool_name,
            "arguments": params,
        });

        let result = conn.send_request("tools/call", Some(call_params)).await;
        let latency_ms = start.elapsed().as_millis() as u64;

        match result {
            Ok(value) => Ok(ToolCallResult {
                tool_name: tool_name.to_string(),
                server_id,
                success: true,
                result: Some(value),
                error: None,
                latency_ms,
            }),
            Err(e) => Ok(ToolCallResult {
                tool_name: tool_name.to_string(),
                server_id,
                success: false,
                result: None,
                error: Some(e),
                latency_ms,
            }),
        }
    }

    /// Returns the total number of indexed tools.
    pub fn tool_count(&self) -> usize {
        self.tool_index.len()
    }

    /// Returns all tool names mapped to a specific server.
    pub fn tools_for_server(&self, server_id: &str) -> Vec<String> {
        self.tool_index
            .iter()
            .filter_map(|(name, sid)| {
                if sid == server_id {
                    Some(name.clone())
                } else {
                    None
                }
            })
            .collect()
    }
}

impl Default for ToolRouter {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_router_resolves_none() {
        let router = ToolRouter::new();
        assert!(router.resolve("anything").is_none());
    }

    #[test]
    fn tool_count_empty() {
        let router = ToolRouter::new();
        assert_eq!(router.tool_count(), 0);
    }

    #[test]
    fn tools_for_missing_server() {
        let router = ToolRouter::new();
        assert!(router.tools_for_server("nonexistent").is_empty());
    }

    #[test]
    fn tool_call_result_serializes_camel_case() {
        let result = ToolCallResult {
            tool_name: "test-tool".to_string(),
            server_id: "server-1".to_string(),
            success: true,
            result: Some(serde_json::json!({"output": "hello"})),
            error: None,
            latency_ms: 42,
        };
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"toolName\""));
        assert!(json.contains("\"serverId\""));
        assert!(json.contains("\"latencyMs\""));
        assert!(!json.contains("tool_name"));
    }

    #[test]
    fn default_creates_empty_router() {
        let router = ToolRouter::default();
        assert_eq!(router.tool_count(), 0);
    }
}
