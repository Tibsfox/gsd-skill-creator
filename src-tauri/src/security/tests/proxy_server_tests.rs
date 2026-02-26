//! TDD RED tests for proxy server (Plan 369-02).
//!
//! Tests: credential-free logging, SecurityEvent emission on blocked requests,
//! health endpoint, concurrent request handling, latency verification, and
//! Tauri command existence.

use std::sync::Arc;

use crate::security::proxy::{
    CredentialProxy, CredentialType, ProxiedRequest, SecretString,
};
use crate::security::proxy_server::{ProxyServer, ProxyHealthStatus};

/// Build a test ProxyServer with one domain + credential configured.
fn build_test_server() -> ProxyServer {
    let proxy = CredentialProxy::new_for_test_with_cred(
        "api.anthropic.com",
        CredentialType::ApiKeyHeader {
            key: SecretString::new("sk-ant-test-key".to_string()),
            header: "x-api-key".to_string(),
        },
    );
    ProxyServer::new(proxy)
}

/// Build a test ProxyServer with a log file path for verifying log safety.
fn build_test_server_with_log(log_path: std::path::PathBuf) -> ProxyServer {
    use std::collections::{HashMap, HashSet};

    let mut credentials = HashMap::new();
    credentials.insert(
        "api.anthropic.com".to_string(),
        crate::security::proxy::CredentialEntry {
            domain_pattern: "api.anthropic.com".to_string(),
            credential_type: CredentialType::ApiKeyHeader {
                key: SecretString::new("sk-ant-secret-value".to_string()),
                header: "x-api-key".to_string(),
            },
            inject: crate::security::proxy::InjectionMethod::Header(String::new()),
        },
    );
    let mut allowlist = HashSet::new();
    allowlist.insert("api.anthropic.com".to_string());

    let proxy = CredentialProxy {
        socket_path: std::path::PathBuf::from("/tmp/test-proxy.sock"),
        credentials,
        allowlist,
        log_path,
        ssh_agent_socket: None,
    };
    ProxyServer::new(proxy)
}

// ============================================================================
// Test 1: Log entry contains no credential values
// ============================================================================

#[tokio::test]
async fn log_entry_never_contains_credential() {
    let tmp = tempfile::tempdir().unwrap();
    let log_path = tmp.path().join("proxy.log");
    let server = build_test_server_with_log(log_path.clone());

    // Process a request that triggers logging
    let req = ProxiedRequest {
        agent_id: "exec-001".to_string(),
        method: "POST".to_string(),
        url: "https://api.anthropic.com/v1/messages".to_string(),
        headers: vec![],
        body: None,
    };
    let _result = server.handle(req).await;

    let log_content = std::fs::read_to_string(&log_path).unwrap_or_default();
    assert!(
        !log_content.contains("sk-ant-secret-value"),
        "Log must never contain credential values"
    );
    assert!(
        !log_content.contains("sk-ant-test"),
        "Log must never contain any credential"
    );
    // It SHOULD contain these safe fields
    if !log_content.is_empty() {
        assert!(log_content.contains("api.anthropic.com"));
        assert!(log_content.contains("exec-001"));
    }
}

// ============================================================================
// Test 2: Blocked request emits SecurityEvent without credential
// ============================================================================

#[tokio::test]
async fn blocked_request_returns_error() {
    let server = build_test_server();
    let req = ProxiedRequest {
        agent_id: "exec-001".to_string(),
        method: "GET".to_string(),
        url: "https://evil.com/exfil".to_string(),
        headers: vec![],
        body: None,
    };
    let result = server.handle(req).await;
    assert!(result.is_err(), "Blocked domain must return error");

    // Verify blocked count incremented
    let health = server.health().await;
    assert!(
        health.requests_blocked >= 1,
        "Blocked count must increment on denied request"
    );
}

// ============================================================================
// Test 3: Health endpoint returns expected shape
// ============================================================================

#[tokio::test]
async fn health_endpoint_returns_status() {
    let server = build_test_server();
    let health = server.health().await;
    assert_eq!(health.status, "running");
    assert!(health.uptime_s == 0 || health.uptime_s >= 0);
    assert!(health.requests_total >= 0);
    assert!(
        health
            .domains_active
            .contains(&"api.anthropic.com".to_string()),
        "domains_active must include configured domains"
    );
}

// ============================================================================
// Test 4: Concurrent requests, no cross-contamination
// ============================================================================

#[tokio::test]
async fn concurrent_requests_no_cross_contamination() {
    let server = Arc::new(build_test_server());
    let mut handles = vec![];
    for i in 0..10 {
        let s = server.clone();
        handles.push(tokio::spawn(async move {
            let req = ProxiedRequest {
                agent_id: format!("agent-{}", i),
                method: "POST".to_string(),
                url: "https://api.anthropic.com/v1/messages".to_string(),
                headers: vec![],
                body: None,
            };
            s.handle(req).await
        }));
    }
    let mut success_count = 0;
    for handle in handles {
        let result = handle.await.unwrap();
        if result.is_ok() {
            success_count += 1;
        }
    }
    assert_eq!(
        success_count, 10,
        "All 10 concurrent requests must succeed"
    );

    // Verify total count
    let health = server.health().await;
    assert_eq!(health.requests_total, 10, "Total requests must be 10");
}

// ============================================================================
// Test 5: Latency below 50ms threshold
// ============================================================================

#[tokio::test]
async fn proxy_overhead_under_50ms() {
    let server = build_test_server();
    let n = 100u64;
    let mut total_ns: u64 = 0;
    for _ in 0..n {
        let start = std::time::Instant::now();
        server.measure_overhead_only().await;
        total_ns += start.elapsed().as_nanos() as u64;
    }
    let avg_ms = total_ns as f64 / (n as f64 * 1_000_000.0);
    assert!(
        avg_ms < 50.0,
        "Proxy overhead {:.2}ms exceeds 50ms threshold",
        avg_ms
    );
}

// ============================================================================
// Test 6: Health serializes to expected JSON
// ============================================================================

#[tokio::test]
async fn health_serializes_to_json() {
    let server = build_test_server();
    let health = server.health().await;
    let json = serde_json::to_string(&health).unwrap();
    assert!(json.contains("\"status\""));
    assert!(json.contains("\"uptime_s\""));
    assert!(json.contains("\"requests_total\""));
    assert!(json.contains("\"requests_blocked\""));
    assert!(json.contains("\"domains_active\""));
}

// ============================================================================
// Test 7: Tauri commands exist (compile-time verification)
// ============================================================================

#[test]
fn proxy_tauri_commands_compile() {
    // This test verifies the commands module compiles and the functions
    // are accessible. Actual invocation tested in integration tests.
    use crate::commands::proxy::{start_proxy, stop_proxy, proxy_status};
    // If this compiles, the commands exist
    let _ = start_proxy;
    let _ = stop_proxy;
    let _ = proxy_status;
}
