//! Security module for GSD-OS SSH Agent Security (v1.38).
//!
//! Provides typed interfaces for all security components: sandbox profiles,
//! credential proxy configuration, security events, domain credentials,
//! and agent isolation state.
//!
//! Barrel module: re-exports sub-modules and defines SecurityState
//! for shared Tauri application state.
//!
//! TypeScript equivalent: src/types/security.ts

pub mod agent_isolation;
pub mod keystore;
pub mod proxy;
pub mod proxy_server;
pub mod sandbox;
pub mod types;
pub use types::*;

#[cfg(test)]
mod tests;

use std::collections::HashMap;
use std::collections::VecDeque;

/// Shared application state for all security components.
///
/// Managed by Tauri as a `tokio::sync::Mutex<SecurityState>`.
/// Tracks aggregate security posture, active agents, recent events,
/// and component health for the dashboard shield indicator.
#[derive(Debug, serde::Serialize)]
pub struct SecurityState {
    /// Aggregate security status for shield indicator.
    pub status: SecurityStatus,
    /// Active agent isolation states keyed by agent ID.
    pub active_agents: HashMap<String, AgentIsolationState>,
    /// Ring buffer of recent security events (max 100).
    pub recent_events: VecDeque<SecurityEvent>,
    /// Whether the credential proxy is currently running.
    pub proxy_running: bool,
    /// Whether the sandbox has been verified successfully.
    pub sandbox_verified: bool,
}

impl SecurityState {
    /// Create a new SecurityState with default (inactive) values.
    pub fn new() -> Self {
        Self {
            status: SecurityStatus::Inactive,
            active_agents: HashMap::new(),
            recent_events: VecDeque::with_capacity(100),
            proxy_running: false,
            sandbox_verified: false,
        }
    }
}

impl Default for SecurityState {
    fn default() -> Self {
        Self::new()
    }
}
