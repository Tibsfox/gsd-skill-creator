//! Rust staging gate types mirroring the TypeScript security interfaces in `src/types/mcp.ts`.
//!
//! Defines trust lifecycle, capability hashing, invocation validation, and the
//! `SecurityGate` trait contract shared between the host manager and security modules.

use serde::{Deserialize, Serialize};

use super::types::Tool;

// ============================================================================
// Staging Gate Types
// ============================================================================

// -- TrustState --------------------------------------------------------------

/// Trust lifecycle state for an MCP server in the staging pipeline.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TrustState {
    Quarantine,
    Provisional,
    Trusted,
    Suspended,
}

// -- HashRecord --------------------------------------------------------------

/// Tool definition hash for detecting capability drift.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HashRecord {
    pub server_id: String,
    pub hash: String,
    pub tool_count: u32,
    pub computed_at: u64,
    pub previous_hash: Option<String>,
}

// -- ValidationSeverity ------------------------------------------------------

/// Severity level for a validation result.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ValidationSeverity {
    Info,
    Warning,
    Critical,
}

// -- ValidationResult --------------------------------------------------------

/// Invocation validation outcome from the security gate pipeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub blocked: bool,
    pub reason: Option<String>,
    pub rule: Option<String>,
    pub severity: ValidationSeverity,
}

// -- SecurityGate trait ------------------------------------------------------

/// Security gate contract for MCP server trust management and invocation validation.
///
/// Uses Rust 1.75+ RPITIT (return-position impl Trait in traits) syntax for
/// async methods without requiring the `async-trait` crate.
pub trait SecurityGate: Send + Sync {
    /// Compute a content hash of the given tool definitions for drift detection.
    fn compute_hash(&self, tools: &[Tool]) -> impl std::future::Future<Output = HashRecord> + Send;

    /// Validate a tool invocation against security rules.
    fn validate_invocation(
        &self,
        server_id: &str,
        tool_name: &str,
        params: &serde_json::Value,
    ) -> impl std::future::Future<Output = ValidationResult> + Send;

    /// Get the current trust state of a server.
    fn get_trust_state(
        &self,
        server_id: &str,
    ) -> impl std::future::Future<Output = TrustState> + Send;

    /// Update the trust state of a server with a reason for the change.
    fn set_trust_state(
        &self,
        server_id: &str,
        state: TrustState,
        reason: &str,
    ) -> impl std::future::Future<Output = ()> + Send;
}
