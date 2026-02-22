//! Multi-server orchestrator for the MCP host manager.
//!
//! `HostManager` coordinates multiple `ServerConnection` instances, providing
//! connect/disconnect, health checking, and automatic restart with backoff.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::connection::{ConnectionStatus, ServerConnection};
use super::types::TransportConfig;

// ============================================================================
// ServerInfo
// ============================================================================

/// Summary information about a managed MCP server, suitable for IPC responses.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerInfo {
    pub id: String,
    pub status: ConnectionStatus,
    pub server_name: Option<String>,
    pub tool_count: usize,
    pub resource_count: usize,
    pub prompt_count: usize,
}

// ============================================================================
// HostManager
// ============================================================================

/// Orchestrates multiple MCP server connections.
///
/// Provides connection lifecycle management, health checking, and automatic
/// restart with exponential backoff for crashed servers.
pub struct HostManager {
    connections: HashMap<String, ServerConnection>,
}

impl HostManager {
    /// Creates a new HostManager with no connections.
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
        }
    }

    /// Connects to an MCP server with the given config.
    ///
    /// Spawns the child process, completes the MCP handshake, and stores the
    /// connection. Returns error if server_id is already connected.
    pub async fn connect_server(
        &mut self,
        id: String,
        config: TransportConfig,
    ) -> Result<ConnectionStatus, String> {
        if let Some(existing) = self.connections.get(&id) {
            if existing.status == ConnectionStatus::Connected {
                return Err(format!("Server '{}' is already connected", id));
            }
        }

        let mut conn = ServerConnection::new(id.clone(), config);
        conn.spawn().await?;
        let status = conn.status;
        self.connections.insert(id, conn);
        Ok(status)
    }

    /// Disconnects a server and removes it from the connection map.
    pub async fn disconnect_server(&mut self, id: &str) -> Result<(), String> {
        let mut conn = self
            .connections
            .remove(id)
            .ok_or_else(|| format!("Server '{}' not found", id))?;
        conn.disconnect().await
    }

    /// Returns the current status of a server, if it exists.
    pub fn get_status(&self, id: &str) -> Option<ConnectionStatus> {
        self.connections.get(id).map(|c| c.status)
    }

    /// Returns summary information about all managed servers.
    pub fn list_servers(&self) -> Vec<ServerInfo> {
        self.connections
            .values()
            .map(|conn| {
                let (server_name, tool_count, resource_count, prompt_count) =
                    match &conn.capabilities {
                        Some(caps) => (
                            Some(caps.server_name.clone()),
                            caps.tools.len(),
                            caps.resources.len(),
                            caps.prompts.len(),
                        ),
                        None => (None, 0, 0, 0),
                    };

                ServerInfo {
                    id: conn.id.clone(),
                    status: conn.status,
                    server_name,
                    tool_count,
                    resource_count,
                    prompt_count,
                }
            })
            .collect()
    }

    /// Checks health of all connections, marking dead ones as Failed.
    pub fn check_health(&mut self) -> Vec<String> {
        let mut failed = Vec::new();

        for (id, conn) in self.connections.iter_mut() {
            if conn.status == ConnectionStatus::Connected && !conn.is_alive() {
                conn.status = ConnectionStatus::Failed;
                failed.push(id.clone());
            }
        }

        failed
    }

    /// Attempts to restart failed servers that are within their retry limit
    /// and have waited long enough for their backoff period.
    ///
    /// Returns the list of server IDs that were successfully restarted.
    pub async fn restart_failed(&mut self) -> Vec<String> {
        let mut restarted = Vec::new();

        // Collect IDs of servers that should be restarted
        let restart_candidates: Vec<String> = self
            .connections
            .iter()
            .filter_map(|(id, conn)| {
                if !conn.should_restart() {
                    return None;
                }

                // Check if enough time has passed since last restart
                if let Some(elapsed) = conn.time_since_restart() {
                    if elapsed < conn.backoff_duration() {
                        return None; // Not enough time has passed
                    }
                }

                Some(id.clone())
            })
            .collect();

        // Restart each candidate
        for id in restart_candidates {
            if let Some(conn) = self.connections.get_mut(&id) {
                conn.record_restart();
                // Disconnect existing broken state
                let _ = conn.disconnect().await;
                // Re-spawn
                if conn.spawn().await.is_ok() {
                    restarted.push(id);
                }
            }
        }

        restarted
    }

    /// Returns the total number of managed server connections.
    pub fn server_count(&self) -> usize {
        self.connections.len()
    }

    /// Returns an immutable reference to a server connection.
    pub fn get_connection(&self, id: &str) -> Option<&ServerConnection> {
        self.connections.get(id)
    }

    /// Returns a mutable reference to a server connection.
    pub fn get_connection_mut(&mut self, id: &str) -> Option<&mut ServerConnection> {
        self.connections.get_mut(id)
    }

    /// Returns a reference to the connections map (for router index rebuilding).
    pub fn connections(&self) -> &HashMap<String, ServerConnection> {
        &self.connections
    }
}

impl Default for HostManager {
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
    fn new_manager_has_no_servers() {
        let manager = HostManager::new();
        assert_eq!(manager.server_count(), 0);
    }

    #[test]
    fn list_servers_empty() {
        let manager = HostManager::new();
        let servers = manager.list_servers();
        assert!(servers.is_empty());
    }

    #[test]
    fn get_status_missing_server() {
        let manager = HostManager::new();
        assert!(manager.get_status("nonexistent").is_none());
    }

    #[test]
    fn get_connection_missing() {
        let manager = HostManager::new();
        assert!(manager.get_connection("nonexistent").is_none());
        assert!(manager.connections().is_empty());
    }

    #[test]
    fn server_info_serializes_camel_case() {
        let info = ServerInfo {
            id: "test-server".to_string(),
            status: ConnectionStatus::Connected,
            server_name: Some("TestMCP".to_string()),
            tool_count: 3,
            resource_count: 1,
            prompt_count: 2,
        };
        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("\"serverName\""));
        assert!(json.contains("\"toolCount\""));
        assert!(json.contains("\"resourceCount\""));
        assert!(json.contains("\"promptCount\""));
        assert!(!json.contains("server_name"));
    }

    #[test]
    fn default_creates_empty_manager() {
        let manager = HostManager::default();
        assert_eq!(manager.server_count(), 0);
    }
}
