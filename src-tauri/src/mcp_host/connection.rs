//! Single MCP server connection management.
//!
//! `ServerConnection` manages the lifecycle of one MCP server child process:
//! spawning, JSON-RPC handshake, message I/O, disconnect, and crash detection.

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, Lines};
use tokio::process::{Child, ChildStdin, ChildStdout};

use super::types::{Prompt, Resource, ServerCapability, Tool, TransportConfig};

// ============================================================================
// ConnectionStatus
// ============================================================================

/// Lifecycle state of a single MCP server connection.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
    Failed,
}

// ============================================================================
// ServerConnection
// ============================================================================

/// Manages a single MCP server child process.
///
/// Handles spawn, JSON-RPC initialize handshake, stdio message I/O,
/// graceful disconnect, crash detection, and restart backoff tracking.
pub struct ServerConnection {
    pub id: String,
    pub config: TransportConfig,
    pub status: ConnectionStatus,
    pub capabilities: Option<ServerCapability>,
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    stdout_lines: Option<Lines<BufReader<ChildStdout>>>,
    restart_count: u32,
    last_restart: Option<Instant>,
}

impl ServerConnection {
    /// Creates a new connection in Disconnected state.
    pub fn new(id: String, config: TransportConfig) -> Self {
        Self {
            id,
            config,
            status: ConnectionStatus::Disconnected,
            capabilities: None,
            child: None,
            stdin: None,
            stdout_lines: None,
            restart_count: 0,
            last_restart: None,
        }
    }

    /// Spawns the server child process and completes the MCP handshake.
    ///
    /// Only supports `TransportConfig::Stdio`. Sets status to Connected on
    /// success, Failed on error.
    pub async fn spawn(&mut self) -> Result<(), String> {
        let (command, args, env) = match &self.config {
            TransportConfig::Stdio { command, args, env } => {
                (command.clone(), args.clone(), env.clone())
            }
            TransportConfig::StreamableHttp { .. } => {
                self.status = ConnectionStatus::Failed;
                return Err("StreamableHttp transport not supported by host manager".to_string());
            }
        };

        self.status = ConnectionStatus::Connecting;

        let mut cmd = tokio::process::Command::new(&command);
        cmd.args(&args)
            .envs(&env)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null());

        let mut child = cmd.spawn().map_err(|e| {
            self.status = ConnectionStatus::Failed;
            format!("Failed to spawn '{}': {}", command, e)
        })?;

        let stdin = child.stdin.take().ok_or_else(|| {
            self.status = ConnectionStatus::Failed;
            "Failed to capture child stdin".to_string()
        })?;

        let stdout = child.stdout.take().ok_or_else(|| {
            self.status = ConnectionStatus::Failed;
            "Failed to capture child stdout".to_string()
        })?;

        self.child = Some(child);
        self.stdin = Some(stdin);
        self.stdout_lines = Some(BufReader::new(stdout).lines());

        match self.handshake().await {
            Ok(caps) => {
                self.capabilities = Some(caps);
                self.status = ConnectionStatus::Connected;
                Ok(())
            }
            Err(e) => {
                self.status = ConnectionStatus::Failed;
                // Clean up child process on handshake failure
                if let Some(mut child) = self.child.take() {
                    let _ = child.kill().await;
                }
                self.stdin = None;
                self.stdout_lines = None;
                Err(format!("Handshake failed: {}", e))
            }
        }
    }

    /// Performs the MCP initialize handshake and capability discovery.
    async fn handshake(&mut self) -> Result<ServerCapability, String> {
        // Send initialize request
        let init_request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": "init-1",
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {
                    "name": "gsd-os",
                    "version": "0.1.0"
                }
            }
        });

        self.write_message(&init_request).await?;

        // Read initialize response
        let response = tokio::time::timeout(Duration::from_secs(30), self.read_message())
            .await
            .map_err(|_| "Initialize handshake timed out after 30s".to_string())?
            .map_err(|e| format!("Failed to read initialize response: {}", e))?;

        // Extract server info from response
        let result = response
            .get("result")
            .ok_or("Initialize response missing 'result' field")?;

        let server_name = result
            .get("serverInfo")
            .and_then(|si| si.get("name"))
            .and_then(|n| n.as_str())
            .unwrap_or("unknown")
            .to_string();

        let server_version = result
            .get("serverInfo")
            .and_then(|si| si.get("version"))
            .and_then(|v| v.as_str())
            .unwrap_or("0.0.0")
            .to_string();

        // Send initialized notification
        let initialized = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        });
        self.write_message(&initialized).await?;

        // Discover capabilities
        let tools = self.discover_list("tools/list", "tools").await;
        let resources = self.discover_list("resources/list", "resources").await;
        let prompts = self.discover_list("prompts/list", "prompts").await;

        let tools: Vec<Tool> =
            serde_json::from_value(serde_json::Value::Array(tools)).unwrap_or_default();
        let resources: Vec<Resource> =
            serde_json::from_value(serde_json::Value::Array(resources)).unwrap_or_default();
        let prompts: Vec<Prompt> =
            serde_json::from_value(serde_json::Value::Array(prompts)).unwrap_or_default();

        Ok(ServerCapability {
            tools,
            resources,
            prompts,
            server_name,
            server_version,
        })
    }

    /// Discovers a capability list (tools, resources, or prompts) from the server.
    /// Returns empty vec if the server doesn't support the method.
    async fn discover_list(&mut self, method: &str, result_key: &str) -> Vec<serde_json::Value> {
        let id = format!("discover-{}", result_key);
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
            "params": {}
        });

        if self.write_message(&request).await.is_err() {
            return Vec::new();
        }

        match tokio::time::timeout(Duration::from_secs(10), self.read_message()).await {
            Ok(Ok(response)) => response
                .get("result")
                .and_then(|r| r.get(result_key))
                .and_then(|list| list.as_array())
                .cloned()
                .unwrap_or_default(),
            _ => Vec::new(),
        }
    }

    /// Sends a JSON-RPC request and waits for the response with a 30-second timeout.
    pub async fn send_request(
        &mut self,
        method: &str,
        params: Option<serde_json::Value>,
    ) -> Result<serde_json::Value, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let mut request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": method,
        });

        if let Some(p) = params {
            request
                .as_object_mut()
                .unwrap()
                .insert("params".to_string(), p);
        }

        self.write_message(&request).await?;

        let response = tokio::time::timeout(Duration::from_secs(30), self.read_message())
            .await
            .map_err(|_| format!("Request '{}' timed out after 30s", method))?
            .map_err(|e| format!("Failed to read response for '{}': {}", method, e))?;

        if let Some(error) = response.get("error") {
            let msg = error
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("Unknown error");
            let code = error.get("code").and_then(|c| c.as_i64()).unwrap_or(-1);
            return Err(format!("JSON-RPC error {}: {}", code, msg));
        }

        response
            .get("result")
            .cloned()
            .ok_or_else(|| "Response missing 'result' field".to_string())
    }

    /// Writes a JSON message to the child process stdin (newline-delimited).
    async fn write_message(&mut self, message: &serde_json::Value) -> Result<(), String> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or("Connection stdin not available")?;
        let mut line = serde_json::to_string(message)
            .map_err(|e| format!("Failed to serialize message: {}", e))?;
        line.push('\n');
        stdin
            .write_all(line.as_bytes())
            .await
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin
            .flush()
            .await
            .map_err(|e| format!("Failed to flush stdin: {}", e))?;
        Ok(())
    }

    /// Reads a JSON message from the child process stdout (newline-delimited).
    async fn read_message(&mut self) -> Result<serde_json::Value, String> {
        let lines = self
            .stdout_lines
            .as_mut()
            .ok_or("Connection stdout not available")?;

        loop {
            let line = lines
                .next_line()
                .await
                .map_err(|e| format!("Failed to read from stdout: {}", e))?
                .ok_or("Server closed stdout (EOF)")?;

            // Skip empty lines
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            return serde_json::from_str(trimmed)
                .map_err(|e| format!("Failed to parse JSON response: {}", e));
        }
    }

    /// Gracefully disconnects the server: sends shutdown, waits up to 2s, then kills.
    pub async fn disconnect(&mut self) -> Result<(), String> {
        if self.status == ConnectionStatus::Disconnected {
            return Ok(());
        }

        // Try graceful shutdown notification
        if self.stdin.is_some() {
            let shutdown = serde_json::json!({
                "jsonrpc": "2.0",
                "method": "notifications/cancelled",
                "params": { "requestId": "shutdown", "reason": "Host disconnecting" }
            });
            let _ = self.write_message(&shutdown).await;
        }

        // Wait for child to exit or kill after 2 seconds
        if let Some(mut child) = self.child.take() {
            match tokio::time::timeout(Duration::from_secs(2), child.wait()).await {
                Ok(_) => {} // Child exited gracefully
                Err(_) => {
                    // Timeout -- force kill
                    let _ = child.kill().await;
                }
            }
        }

        self.stdin = None;
        self.stdout_lines = None;
        self.status = ConnectionStatus::Disconnected;
        Ok(())
    }

    /// Checks if the child process is still running.
    pub fn is_alive(&mut self) -> bool {
        match &mut self.child {
            Some(child) => match child.try_wait() {
                Ok(Some(_)) => false, // Process exited
                Ok(None) => true,     // Still running
                Err(_) => false,      // Error checking -- assume dead
            },
            None => false,
        }
    }

    /// Returns exponential backoff duration: min(2^restart_count, 30) seconds.
    pub fn backoff_duration(&self) -> Duration {
        let secs = std::cmp::min(1u64 << self.restart_count, 30);
        Duration::from_secs(secs)
    }

    /// Returns true if the server should be restarted (under retry limit).
    pub fn should_restart(&self) -> bool {
        self.restart_count < 5 && self.status == ConnectionStatus::Failed
    }

    /// Records a restart attempt: increments counter and records timestamp.
    pub fn record_restart(&mut self) {
        self.restart_count += 1;
        self.last_restart = Some(Instant::now());
    }

    /// Returns time since last restart, if any.
    pub fn time_since_restart(&self) -> Option<Duration> {
        self.last_restart.map(|t| t.elapsed())
    }

    /// Returns the current restart count.
    pub fn restart_count(&self) -> u32 {
        self.restart_count
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connection_status_serializes_lowercase() {
        let status = ConnectionStatus::Connected;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"connected\"");

        let status = ConnectionStatus::Disconnected;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"disconnected\"");

        let status = ConnectionStatus::Failed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"failed\"");

        let status = ConnectionStatus::Connecting;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"connecting\"");
    }

    #[test]
    fn backoff_duration_exponential() {
        let config = TransportConfig::Stdio {
            command: "test".to_string(),
            args: vec![],
            env: std::collections::HashMap::new(),
        };
        let mut conn = ServerConnection::new("test".to_string(), config);

        // 2^0 = 1s, 2^1 = 2s, 2^2 = 4s, 2^3 = 8s, 2^4 = 16s, cap at 30s
        assert_eq!(conn.backoff_duration(), Duration::from_secs(1));
        conn.restart_count = 1;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(2));
        conn.restart_count = 2;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(4));
        conn.restart_count = 3;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(8));
        conn.restart_count = 4;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(16));
        conn.restart_count = 5;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(30));
        conn.restart_count = 10;
        assert_eq!(conn.backoff_duration(), Duration::from_secs(30));
    }

    #[test]
    fn should_restart_within_limit() {
        let config = TransportConfig::Stdio {
            command: "test".to_string(),
            args: vec![],
            env: std::collections::HashMap::new(),
        };
        let mut conn = ServerConnection::new("test".to_string(), config);

        // Not failed -- should not restart
        assert!(!conn.should_restart());

        // Failed with 0 retries -- should restart
        conn.status = ConnectionStatus::Failed;
        assert!(conn.should_restart());

        // Failed with 4 retries -- should restart
        conn.restart_count = 4;
        assert!(conn.should_restart());

        // Failed with 5 retries -- should NOT restart (limit reached)
        conn.restart_count = 5;
        assert!(!conn.should_restart());
    }

    #[test]
    fn record_restart_increments_count() {
        let config = TransportConfig::Stdio {
            command: "test".to_string(),
            args: vec![],
            env: std::collections::HashMap::new(),
        };
        let mut conn = ServerConnection::new("test".to_string(), config);
        assert_eq!(conn.restart_count(), 0);
        assert!(conn.time_since_restart().is_none());

        conn.record_restart();
        assert_eq!(conn.restart_count(), 1);
        assert!(conn.time_since_restart().is_some());

        conn.record_restart();
        assert_eq!(conn.restart_count(), 2);
    }

    #[test]
    fn new_connection_is_disconnected() {
        let config = TransportConfig::Stdio {
            command: "test".to_string(),
            args: vec![],
            env: std::collections::HashMap::new(),
        };
        let conn = ServerConnection::new("server-1".to_string(), config);
        assert_eq!(conn.status, ConnectionStatus::Disconnected);
        assert!(conn.capabilities.is_none());
        assert_eq!(conn.id, "server-1");
    }
}
