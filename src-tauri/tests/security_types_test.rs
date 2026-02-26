//! Security type serialization tests.
//!
//! Validates Rust serde structs for SecurityEvent, SandboxProfile,
//! ProxyConfig, DomainCredential, and AgentIsolationState.
//!
//! TDD RED phase: These tests import from gsd_os_lib::security which
//! does not yet exist -- all tests must FAIL on first run.

use gsd_os_lib::security::types::{
    AgentIsolationState, AgentType, CredentialSource, CredentialType, DomainCredential,
    EventSeverity, EventSource, Filesystem, Network, ProxyConfig, SandboxProfile, SecurityEvent,
};
use serde_json;

// ---------------------------------------------------------------------------
// Helper fixtures
// ---------------------------------------------------------------------------

fn make_domain_credential() -> DomainCredential {
    DomainCredential {
        domain: "api.anthropic.com".to_string(),
        credential_type: CredentialType::ApiKeyHeader,
        credential_source: CredentialSource::Keychain,
        header_name: Some("x-api-key".to_string()),
    }
}

fn make_sandbox_profile() -> SandboxProfile {
    SandboxProfile {
        agent_id: "exec-001".to_string(),
        agent_type: AgentType::Exec,
        filesystem: Filesystem {
            write_dirs: vec!["/tmp/worktree-exec-001".to_string()],
            deny_read: vec![
                "/home/user/.ssh".to_string(),
                "/home/user/.aws".to_string(),
            ],
        },
        network: Network {
            allowed_domains: vec![make_domain_credential()],
            proxy_socket: "/tmp/gsd-proxy.sock".to_string(),
        },
        worktree_path: Some("/tmp/worktree-exec-001".to_string()),
    }
}

fn make_security_event() -> SecurityEvent {
    SecurityEvent {
        id: "evt-001".to_string(),
        timestamp: "2026-02-26T09:00:00Z".to_string(),
        severity: EventSeverity::Warning,
        source: EventSource::Sandbox,
        event_type: "filesystem_deny".to_string(),
        detail: serde_json::json!({
            "path": "/home/user/.ssh/id_ed25519",
            "action": "read"
        }),
    }
}

fn make_proxy_config() -> ProxyConfig {
    ProxyConfig {
        socket_path: "/tmp/gsd-proxy.sock".to_string(),
        allowed_domains: vec![make_domain_credential()],
        log_requests: true,
        log_credentials: false,
    }
}

fn make_agent_isolation_state() -> AgentIsolationState {
    AgentIsolationState {
        agent_id: "exec-001".to_string(),
        agent_type: AgentType::Exec,
        worktree_path: "/tmp/worktree-exec-001".to_string(),
        sandbox_profile: make_sandbox_profile(),
        status: "active".to_string(),
        created_at: "2026-02-26T09:00:00Z".to_string(),
    }
}

// ---------------------------------------------------------------------------
// DomainCredential
// ---------------------------------------------------------------------------

#[test]
fn domain_credential_round_trip() {
    let cred = make_domain_credential();
    let json = serde_json::to_string(&cred).unwrap();
    let deserialized: DomainCredential = serde_json::from_str(&json).unwrap();
    assert_eq!(cred, deserialized);
}

#[test]
fn domain_credential_json_field_names() {
    let cred = make_domain_credential();
    let value: serde_json::Value = serde_json::to_value(&cred).unwrap();
    assert_eq!(value["domain"], "api.anthropic.com");
    assert_eq!(value["credential_type"], "api_key_header");
    assert_eq!(value["credential_source"], "keychain");
    assert_eq!(value["header_name"], "x-api-key");
}

#[test]
fn domain_credential_without_header_name() {
    let cred = DomainCredential {
        domain: "github.com".to_string(),
        credential_type: CredentialType::SshAgent,
        credential_source: CredentialSource::Env,
        header_name: None,
    };
    let json = serde_json::to_string(&cred).unwrap();
    let deserialized: DomainCredential = serde_json::from_str(&json).unwrap();
    assert_eq!(cred, deserialized);
    assert!(deserialized.header_name.is_none());
}

#[test]
fn credential_type_enum_values() {
    assert_eq!(
        serde_json::to_value(CredentialType::ApiKeyHeader).unwrap(),
        "api_key_header"
    );
    assert_eq!(
        serde_json::to_value(CredentialType::SshAgent).unwrap(),
        "ssh_agent"
    );
    assert_eq!(
        serde_json::to_value(CredentialType::BearerToken).unwrap(),
        "bearer_token"
    );
    assert_eq!(
        serde_json::to_value(CredentialType::BasicAuth).unwrap(),
        "basic_auth"
    );
}

#[test]
fn credential_source_enum_values() {
    assert_eq!(
        serde_json::to_value(CredentialSource::Keychain).unwrap(),
        "keychain"
    );
    assert_eq!(
        serde_json::to_value(CredentialSource::Env).unwrap(),
        "env"
    );
    assert_eq!(
        serde_json::to_value(CredentialSource::File).unwrap(),
        "file"
    );
}

// ---------------------------------------------------------------------------
// SecurityEvent
// ---------------------------------------------------------------------------

#[test]
fn security_event_round_trip() {
    let event = make_security_event();
    let json = serde_json::to_string(&event).unwrap();
    let deserialized: SecurityEvent = serde_json::from_str(&json).unwrap();
    assert_eq!(event, deserialized);
}

#[test]
fn security_event_json_field_names() {
    let event = make_security_event();
    let value: serde_json::Value = serde_json::to_value(&event).unwrap();
    assert_eq!(value["id"], "evt-001");
    assert_eq!(value["timestamp"], "2026-02-26T09:00:00Z");
    assert_eq!(value["severity"], "warning");
    assert_eq!(value["source"], "sandbox");
    assert_eq!(value["event_type"], "filesystem_deny");
    assert!(value["detail"].is_object());
}

#[test]
fn event_severity_enum_values() {
    assert_eq!(
        serde_json::to_value(EventSeverity::Info).unwrap(),
        "info"
    );
    assert_eq!(
        serde_json::to_value(EventSeverity::Warning).unwrap(),
        "warning"
    );
    assert_eq!(
        serde_json::to_value(EventSeverity::Critical).unwrap(),
        "critical"
    );
    assert_eq!(
        serde_json::to_value(EventSeverity::Blocked).unwrap(),
        "blocked"
    );
}

#[test]
fn event_source_enum_values() {
    assert_eq!(
        serde_json::to_value(EventSource::Sandbox).unwrap(),
        "sandbox"
    );
    assert_eq!(
        serde_json::to_value(EventSource::Proxy).unwrap(),
        "proxy"
    );
    assert_eq!(
        serde_json::to_value(EventSource::Staging).unwrap(),
        "staging"
    );
    assert_eq!(
        serde_json::to_value(EventSource::AgentIsolation).unwrap(),
        "agent-isolation"
    );
}

// ---------------------------------------------------------------------------
// SandboxProfile
// ---------------------------------------------------------------------------

#[test]
fn sandbox_profile_round_trip() {
    let profile = make_sandbox_profile();
    let json = serde_json::to_string(&profile).unwrap();
    let deserialized: SandboxProfile = serde_json::from_str(&json).unwrap();
    assert_eq!(profile, deserialized);
}

#[test]
fn sandbox_profile_json_field_names() {
    let profile = make_sandbox_profile();
    let value: serde_json::Value = serde_json::to_value(&profile).unwrap();
    assert_eq!(value["agent_id"], "exec-001");
    assert_eq!(value["agent_type"], "exec");
    assert!(value["filesystem"]["write_dirs"].is_array());
    assert!(value["filesystem"]["deny_read"].is_array());
    assert!(value["network"]["allowed_domains"].is_array());
    assert_eq!(value["network"]["proxy_socket"], "/tmp/gsd-proxy.sock");
    assert_eq!(value["worktree_path"], "/tmp/worktree-exec-001");
}

#[test]
fn sandbox_profile_without_worktree() {
    let mut profile = make_sandbox_profile();
    profile.worktree_path = None;
    let json = serde_json::to_string(&profile).unwrap();
    let deserialized: SandboxProfile = serde_json::from_str(&json).unwrap();
    assert!(deserialized.worktree_path.is_none());
}

#[test]
fn agent_type_enum_values() {
    assert_eq!(
        serde_json::to_value(AgentType::Exec).unwrap(),
        "exec"
    );
    assert_eq!(
        serde_json::to_value(AgentType::Verify).unwrap(),
        "verify"
    );
    assert_eq!(
        serde_json::to_value(AgentType::Scout).unwrap(),
        "scout"
    );
    assert_eq!(
        serde_json::to_value(AgentType::Main).unwrap(),
        "main"
    );
}

// ---------------------------------------------------------------------------
// ProxyConfig
// ---------------------------------------------------------------------------

#[test]
fn proxy_config_round_trip() {
    let config = make_proxy_config();
    let json = serde_json::to_string(&config).unwrap();
    let deserialized: ProxyConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(config, deserialized);
}

#[test]
fn proxy_config_json_field_names() {
    let config = make_proxy_config();
    let value: serde_json::Value = serde_json::to_value(&config).unwrap();
    assert_eq!(value["socket_path"], "/tmp/gsd-proxy.sock");
    assert!(value["allowed_domains"].is_array());
    assert_eq!(value["log_requests"], true);
    assert_eq!(value["log_credentials"], false);
}

#[test]
fn proxy_config_log_credentials_always_false() {
    let config = make_proxy_config();
    assert!(!config.log_credentials);

    // Even if JSON has true, deserialization should yield false
    let json = r#"{
        "socket_path": "/tmp/test.sock",
        "allowed_domains": [],
        "log_requests": true,
        "log_credentials": true
    }"#;
    let deserialized: ProxyConfig = serde_json::from_str(json).unwrap();
    assert!(
        !deserialized.log_credentials,
        "log_credentials must always be false regardless of input"
    );
}

// ---------------------------------------------------------------------------
// AgentIsolationState
// ---------------------------------------------------------------------------

#[test]
fn agent_isolation_state_round_trip() {
    let state = make_agent_isolation_state();
    let json = serde_json::to_string(&state).unwrap();
    let deserialized: AgentIsolationState = serde_json::from_str(&json).unwrap();
    assert_eq!(state, deserialized);
}

#[test]
fn agent_isolation_state_json_field_names() {
    let state = make_agent_isolation_state();
    let value: serde_json::Value = serde_json::to_value(&state).unwrap();
    assert_eq!(value["agent_id"], "exec-001");
    assert_eq!(value["agent_type"], "exec");
    assert_eq!(value["worktree_path"], "/tmp/worktree-exec-001");
    assert!(value["sandbox_profile"].is_object());
    assert_eq!(value["status"], "active");
    assert_eq!(value["created_at"], "2026-02-26T09:00:00Z");
}

#[test]
fn agent_isolation_state_nested_profile() {
    let state = make_agent_isolation_state();
    let value: serde_json::Value = serde_json::to_value(&state).unwrap();
    let profile = &value["sandbox_profile"];
    assert_eq!(profile["agent_id"], "exec-001");
    assert_eq!(profile["agent_type"], "exec");
    assert!(profile["filesystem"]["write_dirs"].is_array());
    assert!(profile["network"]["allowed_domains"].is_array());
}

// ---------------------------------------------------------------------------
// Cross-language parity: parse JSON matching TypeScript test fixtures
// ---------------------------------------------------------------------------

#[test]
fn cross_language_parity_security_event() {
    // JSON produced by TypeScript: JSON.stringify(SecurityEventSchema.parse(validSecurityEvent))
    let ts_json = r#"{
        "id": "evt-001",
        "timestamp": "2026-02-26T09:00:00Z",
        "severity": "warning",
        "source": "sandbox",
        "event_type": "filesystem_deny",
        "detail": {"path": "/home/user/.ssh/id_ed25519", "action": "read"}
    }"#;
    let event: SecurityEvent = serde_json::from_str(ts_json).unwrap();
    assert_eq!(event.id, "evt-001");
    assert_eq!(event.severity, EventSeverity::Warning);
    assert_eq!(event.source, EventSource::Sandbox);
}

#[test]
fn cross_language_parity_full_agent_isolation() {
    // JSON matching the full TypeScript validAgentIsolationState fixture
    let ts_json = r#"{
        "agent_id": "exec-001",
        "agent_type": "exec",
        "worktree_path": "/tmp/worktree-exec-001",
        "sandbox_profile": {
            "agent_id": "exec-001",
            "agent_type": "exec",
            "filesystem": {
                "write_dirs": ["/tmp/worktree-exec-001"],
                "deny_read": ["/home/user/.ssh", "/home/user/.aws"]
            },
            "network": {
                "allowed_domains": [{
                    "domain": "api.anthropic.com",
                    "credential_type": "api_key_header",
                    "credential_source": "keychain",
                    "header_name": "x-api-key"
                }],
                "proxy_socket": "/tmp/gsd-proxy.sock"
            },
            "worktree_path": "/tmp/worktree-exec-001"
        },
        "status": "active",
        "created_at": "2026-02-26T09:00:00Z"
    }"#;
    let state: AgentIsolationState = serde_json::from_str(ts_json).unwrap();
    assert_eq!(state.agent_id, "exec-001");
    assert_eq!(state.sandbox_profile.network.allowed_domains.len(), 1);
    assert_eq!(
        state.sandbox_profile.network.allowed_domains[0].credential_type,
        CredentialType::ApiKeyHeader
    );
}
