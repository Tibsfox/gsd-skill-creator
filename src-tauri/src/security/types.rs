//! Security type definitions for the GSD-OS SSH Agent Security system (v1.38).
//!
//! Serde-serializable structs and enums matching the TypeScript Zod schemas
//! in `src/types/security.ts`. JSON serialization uses snake_case field names
//! (Rust default) to match the TypeScript Zod schema key names exactly.
//!
//! All types round-trip through JSON: serialize to JSON, deserialize back,
//! and the result equals the original.

use serde::{Deserialize, Deserializer, Serialize};

// ============================================================================
// Enums
// ============================================================================

/// Severity level of a security event.
///
/// Controls dashboard presentation and alerting behavior:
/// - `Info`: routine operational events (logged, not alerted)
/// - `Warning`: potential security concern (amber shield)
/// - `Critical`: active security threat (red shield, immediate alert)
/// - `Blocked`: threat detected and blocked (red shield, logged for review)
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum EventSeverity {
    Info,
    Warning,
    Critical,
    Blocked,
}

/// Subsystem that generated a security event.
///
/// Each source maps to a distinct security component:
/// - `Sandbox`: OS-level sandboxing (bubblewrap/Seatbelt)
/// - `Proxy`: credential proxy server
/// - `Staging`: staging security scanner
/// - `AgentIsolation`: per-agent worktree isolation manager
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum EventSource {
    Sandbox,
    Proxy,
    Staging,
    #[serde(rename = "agent-isolation")]
    AgentIsolation,
}

/// Agent type determining sandbox restriction template.
///
/// Each type has different filesystem and network access profiles:
/// - `Exec`: worktree-only write, proxied network for packages + API
/// - `Verify`: read-only filesystem, no network access
/// - `Scout`: research-only write, expanded domain allowlist
/// - `Main`: project + .planning/ write, deny credential directories
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    Exec,
    Verify,
    Scout,
    Main,
}

/// How a credential is injected into outbound requests.
///
/// Determines the proxy's injection mechanism:
/// - `ApiKeyHeader`: inject as custom HTTP header (e.g., x-api-key)
/// - `SshAgent`: forward SSH agent socket for signing operations
/// - `BearerToken`: inject as Authorization: Bearer header
/// - `BasicAuth`: inject as Authorization: Basic header
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum CredentialType {
    #[serde(rename = "api_key_header")]
    ApiKeyHeader,
    #[serde(rename = "ssh_agent")]
    SshAgent,
    #[serde(rename = "bearer_token")]
    BearerToken,
    #[serde(rename = "basic_auth")]
    BasicAuth,
}

/// Where credential material is stored.
///
/// Determines how the proxy retrieves the credential:
/// - `Keychain`: OS native credential store (GNOME Keyring / macOS Keychain)
/// - `Env`: environment variable
/// - `File`: encrypted file on disk
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CredentialSource {
    Keychain,
    Env,
    File,
}

// ============================================================================
// Structs
// ============================================================================

/// A credential binding for a specific network domain.
///
/// Maps a domain to a credential source and injection method. The proxy uses
/// this to inject authentication headers into outbound requests without
/// exposing credential material inside the agent sandbox.
///
/// TypeScript equivalent: `DomainCredentialSchema` in `src/types/security.ts`
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct DomainCredential {
    /// Target domain (e.g., "api.anthropic.com", "github.com")
    pub domain: String,

    /// How the credential is injected into outbound requests
    pub credential_type: CredentialType,

    /// Where the credential material is stored
    pub credential_source: CredentialSource,

    /// HTTP header name for api_key_header type (e.g., "x-api-key")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub header_name: Option<String>,
}

/// Filesystem access restrictions for a sandboxed agent.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Filesystem {
    /// Directories the agent is allowed to write to
    pub write_dirs: Vec<String>,

    /// Directories the agent is denied read access to (e.g., ~/.ssh/)
    pub deny_read: Vec<String>,
}

/// Network access restrictions for a sandboxed agent.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Network {
    /// Domains the agent is allowed to reach (with credential bindings)
    pub allowed_domains: Vec<DomainCredential>,

    /// Path to the credential proxy Unix socket
    pub proxy_socket: String,
}

/// OS-level sandbox configuration for a single agent process.
///
/// Each agent type (exec, verify, scout, main) gets a profile that
/// restricts filesystem access and network connectivity. The sandbox
/// configurator (Phase 368) generates these profiles and the bootstrap
/// script (Phase 373) applies them before any agent process starts.
///
/// TypeScript equivalent: `SandboxProfileSchema` in `src/types/security.ts`
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct SandboxProfile {
    /// Agent identifier this profile belongs to
    pub agent_id: String,

    /// Agent type determines the base restriction template
    pub agent_type: AgentType,

    /// Filesystem access restrictions
    pub filesystem: Filesystem,

    /// Network access restrictions
    pub network: Network,

    /// Path to the agent's isolated git worktree (if applicable)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree_path: Option<String>,
}

/// A security event emitted by any security subsystem.
///
/// Events are logged to `.planning/security/events.jsonl` and streamed to
/// the security dashboard panel. Critical events bypass the magic filter
/// to ensure the shield indicator always reflects real security state.
///
/// TypeScript equivalent: `SecurityEventSchema` in `src/types/security.ts`
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct SecurityEvent {
    /// Unique event identifier
    pub id: String,

    /// ISO 8601 timestamp of when the event occurred
    pub timestamp: String,

    /// Event severity level
    pub severity: EventSeverity,

    /// Subsystem that generated this event
    pub source: EventSource,

    /// Machine-readable event type (e.g., "filesystem_deny", "domain_blocked")
    pub event_type: String,

    /// Subsystem-specific event data
    pub detail: serde_json::Value,
}

/// Configuration for the credential proxy server.
///
/// The proxy runs OUTSIDE the sandbox and listens on a Unix domain socket.
/// Agents inside the sandbox connect through this socket to make authenticated
/// requests without ever seeing credential material.
///
/// SECURITY INVARIANT: `log_credentials` is always false. This is enforced
/// via a custom deserializer that ignores any input value and always produces
/// false. No configuration change can enable credential logging.
///
/// TypeScript equivalent: `ProxyConfigSchema` in `src/types/security.ts`
#[derive(Serialize, Debug, Clone, PartialEq)]
pub struct ProxyConfig {
    /// Path to the Unix domain socket (mode 0600)
    pub socket_path: String,

    /// Domains the proxy will forward requests to
    pub allowed_domains: Vec<DomainCredential>,

    /// Whether to log request metadata (URL, status, timing)
    pub log_requests: bool,

    /// Whether to log credential values. ALWAYS false.
    /// Custom deserializer forces this to false regardless of input.
    pub log_credentials: bool,
}

/// Custom deserializer for ProxyConfig that enforces log_credentials = false.
impl<'de> Deserialize<'de> for ProxyConfig {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        /// Helper struct for intermediate deserialization.
        #[derive(Deserialize)]
        struct ProxyConfigRaw {
            socket_path: String,
            allowed_domains: Vec<DomainCredential>,
            log_requests: bool,
            #[allow(dead_code)]
            log_credentials: Option<bool>,
        }

        let raw = ProxyConfigRaw::deserialize(deserializer)?;
        Ok(ProxyConfig {
            socket_path: raw.socket_path,
            allowed_domains: raw.allowed_domains,
            log_requests: raw.log_requests,
            // SECURITY: Always false regardless of input
            log_credentials: false,
        })
    }
}

/// Runtime state of an isolated agent process.
///
/// Tracks the agent's identity, worktree location, sandbox configuration,
/// and lifecycle status. The isolation manager (Phase 371) creates and
/// manages these states, and the dashboard (Phase 372) displays them.
///
/// TypeScript equivalent: `AgentIsolationStateSchema` in `src/types/security.ts`
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct AgentIsolationState {
    /// Agent identifier
    pub agent_id: String,

    /// Agent type
    pub agent_type: AgentType,

    /// Path to the agent's isolated git worktree
    pub worktree_path: String,

    /// Full sandbox profile applied to this agent
    pub sandbox_profile: SandboxProfile,

    /// Agent lifecycle status (creating, active, stopping, stopped)
    pub status: String,

    /// ISO 8601 timestamp of when the agent was created
    pub created_at: String,
}
