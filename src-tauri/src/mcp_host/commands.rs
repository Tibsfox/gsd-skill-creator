//! Tauri IPC command handlers for MCP host manager operations.
//!
//! Exposes the host manager to the frontend via 5 IPC commands:
//! mcp_connect, mcp_disconnect, mcp_list_servers, mcp_call_tool, mcp_get_trace.

use super::manager::ServerInfo;
use super::registry::{ServerRegistry, ServerRegistryEntry};
use super::router::{ToolCallResult, ToolRouter};
use super::security::TrustState;
use super::trace::TraceEmitter;
use super::types::{TraceEvent, TransportConfig};
use super::manager::HostManager;

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use super::connection::ServerConnection;

// ============================================================================
// McpHostState
// ============================================================================

/// Combined state for the MCP host manager, managed by Tauri.
///
/// Wrapped in `tokio::sync::Mutex` and registered via `app.manage()`.
/// IPC commands access it through `tauri::State<'_, tokio::sync::Mutex<McpHostState>>`.
pub struct McpHostState {
    pub manager: HostManager,
    pub router: ToolRouter,
    pub registry: ServerRegistry,
    pub trace: TraceEmitter,
}

impl McpHostState {
    /// Creates a new McpHostState with default components.
    pub fn new() -> Self {
        Self {
            manager: HostManager::new(),
            router: ToolRouter::new(),
            registry: ServerRegistry::new(ServerRegistry::default_path()),
            trace: TraceEmitter::new(1000),
        }
    }

    /// Rebuilds the tool-to-server index from current connections.
    ///
    /// Separated as a method to work around Rust borrow checker limitations
    /// when accessing both router and manager fields simultaneously.
    fn rebuild_router(&mut self) {
        let connections: &HashMap<String, ServerConnection> = self.manager.connections();
        // SAFETY: We need to borrow connections (immutable) and router (mutable)
        // from the same struct. Since rebuild_index only reads connections and
        // writes to router, we use a pointer cast to satisfy the borrow checker.
        // Both fields are independent and non-overlapping.
        let connections_ptr = connections as *const HashMap<String, ServerConnection>;
        unsafe {
            self.router.rebuild_index(&*connections_ptr);
        }
    }
}

impl Default for McpHostState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Helper: current unix ms
// ============================================================================

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ============================================================================
// Tauri IPC Commands
// ============================================================================

/// Connects to an MCP server with the given configuration.
///
/// Spawns the child process, completes the MCP handshake, and registers the
/// server in the registry. Returns the connection status as a string.
#[tauri::command]
pub async fn mcp_connect(
    server_id: String,
    config: TransportConfig,
    state: tauri::State<'_, tokio::sync::Mutex<McpHostState>>,
) -> Result<String, String> {
    let mut host = state.lock().await;
    let status = host.manager.connect_server(server_id.clone(), config.clone()).await?;

    // Add to registry for persistence
    let entry = ServerRegistryEntry {
        id: server_id.clone(),
        config,
        auto_connect: true,
        trust_state: TrustState::Quarantine,
        enabled: true,
        added_at: now_ms(),
        last_connected: Some(now_ms()),
    };
    host.registry.add(entry);

    // Rebuild tool index after new server connected
    host.rebuild_router();

    // Persist registry
    let _ = host.registry.save().await;

    let status_str = serde_json::to_string(&status)
        .unwrap_or_else(|_| format!("{:?}", status));
    Ok(status_str)
}

/// Disconnects an MCP server and updates the registry.
#[tauri::command]
pub async fn mcp_disconnect(
    server_id: String,
    state: tauri::State<'_, tokio::sync::Mutex<McpHostState>>,
) -> Result<(), String> {
    let mut host = state.lock().await;
    host.manager.disconnect_server(&server_id).await?;

    // Rebuild tool index after server removed
    host.rebuild_router();

    // Do NOT remove from registry -- config persists for reconnection
    Ok(())
}

/// Lists all managed MCP servers with their status and capability summary.
#[tauri::command]
pub async fn mcp_list_servers(
    state: tauri::State<'_, tokio::sync::Mutex<McpHostState>>,
) -> Result<Vec<ServerInfo>, String> {
    let host = state.lock().await;
    Ok(host.manager.list_servers())
}

/// Calls a tool by name, routing to the correct server.
///
/// Records trace events for both the outgoing request and incoming response,
/// emitting them via Tauri events for real-time observability.
#[tauri::command]
pub async fn mcp_call_tool(
    tool_name: String,
    params: serde_json::Value,
    state: tauri::State<'_, tokio::sync::Mutex<McpHostState>>,
    app: tauri::AppHandle,
) -> Result<ToolCallResult, String> {
    let mut host = state.lock().await;

    // Record outgoing trace -- resolve server_id first to avoid borrow conflict
    let request_ts = now_ms();
    let resolved_server_id = host
        .router
        .resolve(&tool_name)
        .unwrap_or("unknown")
        .to_string();
    host.trace.record_outgoing(
        &resolved_server_id,
        &format!("tools/call:{}", tool_name),
        Some(params.clone()),
    );

    // Dispatch tool call -- need to work around borrow checker for router + manager
    let server_id_for_call = host
        .router
        .resolve(&tool_name)
        .ok_or_else(|| format!("Unknown tool: {}", tool_name))?
        .to_string();

    let conn = host.manager.get_connection_mut(&server_id_for_call).ok_or_else(|| {
        format!("Server unavailable: {}", server_id_for_call)
    })?;

    if conn.status != super::connection::ConnectionStatus::Connected {
        return Err(format!("Server '{}' is not connected", server_id_for_call));
    }

    let start = std::time::Instant::now();
    let call_params = serde_json::json!({
        "name": tool_name,
        "arguments": params,
    });

    let send_result = conn.send_request("tools/call", Some(call_params)).await;
    let latency_ms = start.elapsed().as_millis() as u64;

    let result = match send_result {
        Ok(value) => ToolCallResult {
            tool_name: tool_name.clone(),
            server_id: server_id_for_call.clone(),
            success: true,
            result: Some(value),
            error: None,
            latency_ms,
        },
        Err(e) => ToolCallResult {
            tool_name: tool_name.clone(),
            server_id: server_id_for_call.clone(),
            success: false,
            result: None,
            error: Some(e),
            latency_ms,
        },
    };

    // Record incoming trace
    let error_str = result.error.clone();
    let incoming_event = host.trace.record_incoming(
        &result.server_id,
        &format!("tools/call:{}", tool_name),
        request_ts,
        result.result.clone(),
        error_str,
    );

    // Emit trace event to frontend
    host.trace.emit(&app, &incoming_event);

    Ok(result)
}

/// Returns recent trace events, optionally filtered by server ID.
#[tauri::command]
pub async fn mcp_get_trace(
    count: Option<usize>,
    server_id: Option<String>,
    state: tauri::State<'_, tokio::sync::Mutex<McpHostState>>,
) -> Result<Vec<TraceEvent>, String> {
    let host = state.lock().await;
    let limit = count.unwrap_or(50);

    let events: Vec<TraceEvent> = if let Some(sid) = server_id {
        host.trace.get_by_server(&sid, limit).into_iter().cloned().collect()
    } else {
        host.trace.get_recent(limit).into_iter().cloned().collect()
    };

    Ok(events)
}
