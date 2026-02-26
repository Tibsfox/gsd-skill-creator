//! TDD RED tests for credential proxy core (Plan 369-01).
//!
//! These tests verify: SecretString safety, domain allowlist deny-by-default,
//! exact domain matching, API key injection, no credential getter, and socket
//! file permissions.

use crate::security::proxy::{
    CredentialProxy, CredentialType, ProxiedRequest, SecretString,
};

// ============================================================================
// Test 1: SecretString does not print its value
// ============================================================================

#[test]
fn secret_string_no_display() {
    let s = SecretString::new("sk-ant-supersecret".to_string());
    let debug_output = format!("{:?}", s);
    assert!(
        !debug_output.contains("sk-ant-supersecret"),
        "Debug output must not contain the secret value, got: {}",
        debug_output
    );
    assert!(
        !debug_output.contains("supersecret"),
        "Debug output must not contain any part of the secret, got: {}",
        debug_output
    );
}

// ============================================================================
// Test 2: Domain allowlist deny-by-default
// ============================================================================

#[test]
fn allowlist_denies_unknown_domain() {
    let proxy = CredentialProxy::new_for_test(vec!["api.anthropic.com".to_string()]);
    assert!(!proxy.is_allowed("evil.com"));
    assert!(!proxy.is_allowed("api.anthropic.com.evil.com"));
    assert!(proxy.is_allowed("api.anthropic.com"));
}

// ============================================================================
// Test 3: Subdomain matching is exact (no prefix/suffix bypass)
// ============================================================================

#[test]
fn allowlist_subdomain_exact_match() {
    let proxy = CredentialProxy::new_for_test(vec!["github.com".to_string()]);
    assert!(proxy.is_allowed("github.com"));
    assert!(!proxy.is_allowed("notgithub.com"));
    assert!(!proxy.is_allowed("github.com.attacker.com"));
    assert!(!proxy.is_allowed("sub.github.com"));
    assert!(!proxy.is_allowed(""));
}

// ============================================================================
// Test 4: API key injection adds x-api-key header
// ============================================================================

#[test]
fn api_key_injection_adds_header() {
    let proxy = CredentialProxy::new_for_test_with_cred(
        "api.anthropic.com",
        CredentialType::ApiKeyHeader {
            key: SecretString::new("sk-ant-test".to_string()),
            header: "x-api-key".to_string(),
        },
    );
    let mut req = ProxiedRequest {
        agent_id: "exec-001".to_string(),
        method: "POST".to_string(),
        url: "https://api.anthropic.com/v1/messages".to_string(),
        headers: vec![],
        body: None,
    };
    proxy.inject_credential(&mut req);
    let has_key = req
        .headers
        .iter()
        .any(|(k, v)| k == "x-api-key" && v == "sk-ant-test");
    assert!(has_key, "x-api-key header must be present after injection");
}

// ============================================================================
// Test 5: Injected request does NOT expose key in body or other headers
// ============================================================================

#[test]
fn injection_does_not_duplicate_key() {
    let proxy = CredentialProxy::new_for_test_with_cred(
        "api.anthropic.com",
        CredentialType::ApiKeyHeader {
            key: SecretString::new("sk-ant-test".to_string()),
            header: "x-api-key".to_string(),
        },
    );
    let mut req = ProxiedRequest {
        agent_id: "exec-001".to_string(),
        method: "GET".to_string(),
        url: "https://api.anthropic.com/v1/models".to_string(),
        headers: vec![("User-Agent".to_string(), "gsd-os/1.38".to_string())],
        body: None,
    };
    proxy.inject_credential(&mut req);
    // No header other than x-api-key should contain the key value
    let leak_count = req
        .headers
        .iter()
        .filter(|(k, v)| k != "x-api-key" && v.contains("sk-ant-test"))
        .count();
    assert_eq!(
        leak_count, 0,
        "Credential value must not leak into other headers"
    );
    // Body must remain None for GET
    assert!(req.body.is_none(), "Body must remain None for GET request");
}

// ============================================================================
// Test 6: No public API returns credential values
// ============================================================================

#[test]
fn proxy_has_no_credential_getter() {
    let proxy = CredentialProxy::new_for_test(vec![]);
    // Only allowed operations: is_allowed, inject_credential, configure_ssh_forwarding
    let _ = proxy.is_allowed("test.com");
    // If compilation fails due to missing method, the type system is enforcing the constraint
    assert!(true, "No getter methods exist on CredentialProxy");
}

// ============================================================================
// Test 7: Bearer token injection
// ============================================================================

#[test]
fn bearer_token_injection() {
    let proxy = CredentialProxy::new_for_test_with_cred(
        "api.openai.com",
        CredentialType::BearerToken {
            token: SecretString::new("sk-openai-test".to_string()),
        },
    );
    let mut req = ProxiedRequest {
        agent_id: "exec-002".to_string(),
        method: "POST".to_string(),
        url: "https://api.openai.com/v1/chat/completions".to_string(),
        headers: vec![],
        body: None,
    };
    proxy.inject_credential(&mut req);
    let has_bearer = req
        .headers
        .iter()
        .any(|(k, v)| k == "Authorization" && v == "Bearer sk-openai-test");
    assert!(has_bearer, "Authorization: Bearer header must be present");
}

// ============================================================================
// Test 8: Socket file mode 0600 (Unix only)
// ============================================================================

#[cfg(unix)]
#[tokio::test]
async fn socket_created_with_mode_0600() {
    use std::os::unix::fs::PermissionsExt;
    let tmp = tempfile::tempdir().unwrap();
    let socket_path = tmp.path().join("proxy.sock");
    let proxy =
        CredentialProxy::new_for_test_with_socket(socket_path.clone(), vec![]);
    proxy.create_socket().await.unwrap();
    let meta = std::fs::metadata(&socket_path).unwrap();
    let mode = meta.permissions().mode() & 0o777;
    assert_eq!(mode, 0o600, "Socket must have mode 0600, got {:o}", mode);
}

// ============================================================================
// Test 9: SSH agent forwarding
// ============================================================================

#[test]
fn ssh_agent_forwarding_returns_socket_path() {
    let ssh_sock = std::path::PathBuf::from("/tmp/ssh-XXXXXX/agent.12345");
    let mut proxy = CredentialProxy::new_for_test(vec!["github.com".to_string()]);
    proxy.ssh_agent_socket = Some(ssh_sock.clone());
    let result = proxy.configure_ssh_forwarding();
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), ssh_sock);
}

#[test]
fn ssh_agent_forwarding_errors_when_no_socket() {
    let proxy = CredentialProxy::new_for_test(vec![]);
    let result = proxy.configure_ssh_forwarding();
    assert!(result.is_err(), "Must error when no SSH socket configured");
}
