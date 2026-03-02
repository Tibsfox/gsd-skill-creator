//! Credential proxy core types and logic.
//!
//! Phase 369 -- Credential Proxy
//!
//! Security invariants:
//! - SecretString zeroes memory on drop and never prints its value
//! - No public method on CredentialProxy returns credential values
//! - Domain allowlist is deny-by-default with exact matching only
//! - API keys injected via headers without leaking into other fields
//! - Socket created with mode 0600 (owner-only access)

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use zeroize::Zeroize;

// ============================================================================
// SecretString -- zero-on-drop credential wrapper
// ============================================================================

/// Credential value that zeroes memory on drop.
///
/// No Display implementation exists. Debug prints `[REDACTED]`.
/// The inner value is accessible only within this crate via `expose()`.
pub struct SecretString(String);

impl SecretString {
    pub fn new(value: String) -> Self {
        Self(value)
    }

    /// Access the inner value. Restricted to this crate -- key material
    /// never leaves the process boundary through any public API.
    pub(crate) fn expose(&self) -> &str {
        &self.0
    }
}

impl Drop for SecretString {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

// EXPLICITLY no Display, no Clone for SecretString.
impl std::fmt::Debug for SecretString {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "SecretString([REDACTED])")
    }
}

// ============================================================================
// Credential types and injection methods
// ============================================================================

/// How a credential is stored and what it contains.
pub enum CredentialType {
    ApiKeyHeader { key: SecretString, header: String },
    BearerToken { token: SecretString },
    BasicAuth { username: String, password: SecretString },
    SshAgent,
}

/// How a credential is injected into outbound requests.
pub enum InjectionMethod {
    Header(String),
    ProxyAuth,
    SshForward,
}

/// A domain-bound credential entry.
pub struct CredentialEntry {
    pub domain_pattern: String,
    pub credential_type: CredentialType,
    pub inject: InjectionMethod,
}

// ============================================================================
// Errors
// ============================================================================

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

// ============================================================================
// CredentialProxy
// ============================================================================

/// The credential proxy holds credentials and injects them into outbound
/// requests. It runs outside the sandbox boundary -- agents communicate
/// with it through a Unix domain socket.
///
/// Security: No method returns a credential value. The only way credentials
/// leave this struct is via `inject_credential` which writes them directly
/// into request headers.
pub struct CredentialProxy {
    pub(crate) socket_path: PathBuf,
    pub(crate) credentials: HashMap<String, CredentialEntry>,
    pub(crate) allowlist: HashSet<String>,
    pub(crate) log_path: PathBuf,
    pub(crate) ssh_agent_socket: Option<PathBuf>,
}

impl CredentialProxy {
    /// Check whether a domain is in the allowlist.
    /// Exact match only -- no prefix, suffix, or subdomain matching.
    pub fn is_allowed(&self, domain: &str) -> bool {
        self.allowlist.contains(domain)
    }

    /// Inject the appropriate credential into a request based on its target domain.
    /// The credential value is written directly into headers -- it is never returned.
    pub fn inject_credential(&self, req: &mut ProxiedRequest) {
        let domain = extract_domain(&req.url);
        if let Some(entry) = self.credentials.get(&domain) {
            match &entry.credential_type {
                CredentialType::ApiKeyHeader { key, header } => {
                    // Remove any existing header with same name (prevent duplication)
                    req.headers
                        .retain(|(k, _)| k.to_lowercase() != header.to_lowercase());
                    req.headers.push((header.clone(), key.expose().to_string()));
                }
                CredentialType::BearerToken { token } => {
                    req.headers
                        .retain(|(k, _)| k.to_lowercase() != "authorization");
                    req.headers.push((
                        "Authorization".to_string(),
                        format!("Bearer {}", token.expose()),
                    ));
                }
                CredentialType::BasicAuth { username, password } => {
                    use base64::Engine;
                    let encoded = base64::engine::general_purpose::STANDARD
                        .encode(format!("{}:{}", username, password.expose()));
                    req.headers
                        .retain(|(k, _)| k.to_lowercase() != "authorization");
                    req.headers
                        .push(("Authorization".to_string(), format!("Basic {}", encoded)));
                }
                CredentialType::SshAgent => {
                    // SSH agent forwarding is handled by configure_ssh_forwarding,
                    // not by header injection
                }
            }
        }
    }

    /// Return the name of the credential type for a domain (for logging).
    /// Never returns the actual credential value.
    pub(crate) fn credential_type_name(&self, domain: &str) -> String {
        match self.credentials.get(domain).map(|e| &e.credential_type) {
            Some(CredentialType::ApiKeyHeader { .. }) => "api_key_header".to_string(),
            Some(CredentialType::BearerToken { .. }) => "bearer".to_string(),
            Some(CredentialType::BasicAuth { .. }) => "basic_auth".to_string(),
            Some(CredentialType::SshAgent) => "ssh_agent".to_string(),
            None => "none".to_string(),
        }
    }

    /// Forward SSH agent socket inside sandbox boundary (read-only -- signatures only).
    /// Returns the path where SSH_AUTH_SOCK should point inside the sandbox.
    /// Key material never crosses -- only sign requests travel the socket.
    pub fn configure_ssh_forwarding(&self) -> Result<PathBuf, ProxyError> {
        match &self.ssh_agent_socket {
            Some(path) => Ok(path.clone()),
            None => Err(ProxyError::SocketError(
                "No SSH agent socket configured".to_string(),
            )),
        }
    }

    /// Create the Unix domain socket with restrictive permissions (mode 0600).
    #[cfg(unix)]
    pub async fn create_socket(&self) -> Result<(), ProxyError> {
        use std::os::unix::fs::PermissionsExt;
        // Remove stale socket if it exists
        let _ = std::fs::remove_file(&self.socket_path);
        // Create the socket via tokio UnixListener
        let _listener = tokio::net::UnixListener::bind(&self.socket_path)?;
        // Set mode 0600 -- owner read/write only
        std::fs::set_permissions(
            &self.socket_path,
            std::fs::Permissions::from_mode(0o600),
        )?;
        Ok(())
    }

    // ========================================================================
    // Test constructors -- never exposed in production API
    // ========================================================================

    #[cfg(test)]
    pub fn new_for_test(allowlist: Vec<String>) -> Self {
        Self {
            socket_path: PathBuf::from("/tmp/test-proxy.sock"),
            credentials: HashMap::new(),
            allowlist: allowlist.into_iter().collect(),
            log_path: PathBuf::from("/tmp/test-proxy.log"),
            ssh_agent_socket: None,
        }
    }

    #[cfg(test)]
    pub fn new_for_test_with_cred(domain: &str, cred_type: CredentialType) -> Self {
        let mut credentials = HashMap::new();
        credentials.insert(
            domain.to_string(),
            CredentialEntry {
                domain_pattern: domain.to_string(),
                credential_type: cred_type,
                inject: InjectionMethod::Header(String::new()),
            },
        );
        let mut allowlist = HashSet::new();
        allowlist.insert(domain.to_string());
        Self {
            socket_path: PathBuf::from("/tmp/test-proxy.sock"),
            credentials,
            allowlist,
            log_path: PathBuf::from("/tmp/test-proxy.log"),
            ssh_agent_socket: None,
        }
    }

    #[cfg(test)]
    pub fn new_for_test_with_socket(socket_path: PathBuf, allowlist: Vec<String>) -> Self {
        Self {
            socket_path,
            credentials: HashMap::new(),
            allowlist: allowlist.into_iter().collect(),
            log_path: PathBuf::from("/tmp/test-proxy.log"),
            ssh_agent_socket: None,
        }
    }
}

// ============================================================================
// Request/Response types
// ============================================================================

/// A request from an agent inside the sandbox to be forwarded with credentials.
pub struct ProxiedRequest {
    pub agent_id: String,
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<Vec<u8>>,
}

/// The response returned to the agent after credential headers are stripped.
#[derive(Debug)]
pub struct ProxiedResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub latency_ms: u64,
}

// ============================================================================
// URL helpers
// ============================================================================

/// Extract the domain from a URL.
/// "https://api.anthropic.com/v1/messages" -> "api.anthropic.com"
pub(crate) fn extract_domain(url: &str) -> String {
    url.trim_start_matches("https://")
        .trim_start_matches("http://")
        .split('/')
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .to_string()
}

/// Extract the path from a URL.
/// "https://api.anthropic.com/v1/messages" -> "/v1/messages"
pub(crate) fn extract_path(url: &str) -> String {
    let without_scheme = url
        .trim_start_matches("https://")
        .trim_start_matches("http://");
    if let Some(pos) = without_scheme.find('/') {
        without_scheme[pos..].to_string()
    } else {
        "/".to_string()
    }
}
