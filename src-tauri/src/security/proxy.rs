//! Credential proxy core types and logic.
//!
//! Phase 369 -- Credential Proxy
//! STUB: Minimal stubs for TDD RED phase. Full implementation in Task 2.

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

/// Placeholder -- tests should FAIL because this is not yet implemented correctly.
pub struct SecretString(String);

pub enum CredentialType {
    ApiKeyHeader { key: SecretString, header: String },
    BearerToken { token: SecretString },
    BasicAuth { username: String, password: SecretString },
    SshAgent,
}

pub enum InjectionMethod {
    Header(String),
    ProxyAuth,
    SshForward,
}

pub struct CredentialEntry {
    pub domain_pattern: String,
    pub credential_type: CredentialType,
    pub inject: InjectionMethod,
}

#[derive(Debug, thiserror::Error)]
pub enum ProxyError {
    #[error("Domain not in allowlist: {0}")]
    DomainBlocked(String),
    #[error("Socket error: {0}")]
    SocketError(String),
    #[error("Keystore error: {0}")]
    KeystoreError(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub struct CredentialProxy {
    pub(crate) socket_path: PathBuf,
    pub(crate) credentials: HashMap<String, CredentialEntry>,
    pub(crate) allowlist: HashSet<String>,
    pub(crate) log_path: PathBuf,
    pub(crate) ssh_agent_socket: Option<PathBuf>,
}

pub struct ProxiedRequest {
    pub agent_id: String,
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<Vec<u8>>,
}

pub struct ProxiedResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub latency_ms: u64,
}
