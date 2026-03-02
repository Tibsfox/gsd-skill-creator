//! Unix domain socket round-trip tests for the credential proxy (Plan 516-02).
//!
//! Tests verify the full proxy pipeline:
//! - Connect via Unix socket -> send request -> receive response
//! - Health endpoint returns JSON with status: "running"
//! - Socket permissions are 0600 (owner-only)
//!
//! All tests use temporary sockets in /tmp and clean up after.
//! Unix-only: guarded by #[cfg(unix)].

#[cfg(unix)]
mod unix_socket_tests {
    use std::sync::Arc;

    use crate::security::proxy::{CredentialProxy, CredentialType, SecretString};
    use crate::security::proxy_server::ProxyServer;

    /// Generate a unique socket path in /tmp for test isolation.
    fn test_socket_path() -> std::path::PathBuf {
        let id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::path::PathBuf::from(format!("/tmp/gsd-test-proxy-{}.sock", id))
    }

    /// Build a ProxyServer bound to a specific socket path.
    fn build_socket_test_server(socket_path: std::path::PathBuf) -> ProxyServer {
        let proxy = CredentialProxy::new_for_test_with_socket(
            socket_path,
            vec!["api.anthropic.com".to_string()],
        );
        ProxyServer::new(proxy)
    }

    // ========================================================================
    // Test 1: Socket health check round-trip
    // ========================================================================

    #[tokio::test]
    async fn socket_health_check_returns_running() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};

        let sock_path = test_socket_path();
        let server = Arc::new(build_socket_test_server(sock_path.clone()));

        // Start server in background
        let server_handle = {
            let s = server.clone();
            tokio::spawn(async move {
                let _ = s.start().await;
            })
        };

        // Wait for socket to appear (max 2s)
        let mut ready = false;
        for _ in 0..20 {
            if sock_path.exists() {
                ready = true;
                break;
            }
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        assert!(ready, "Socket file must be created within 2 seconds");

        // Connect and send health request
        let mut stream = tokio::net::UnixStream::connect(&sock_path)
            .await
            .expect("Must connect to proxy socket");

        stream
            .write_all(b"GET /__proxy_health")
            .await
            .expect("Must write health request");

        // Shut down write side to signal end of request
        stream.shutdown().await.ok();

        let mut response = String::new();
        stream
            .read_to_string(&mut response)
            .await
            .expect("Must read health response");

        assert!(
            response.contains("\"status\":\"running\""),
            "Health response must contain status: running, got: {}",
            response
        );

        // Cleanup
        server_handle.abort();
        let _ = std::fs::remove_file(&sock_path);
    }

    // ========================================================================
    // Test 2: Socket request round-trip (proxied request -> JSON response)
    // ========================================================================

    #[tokio::test]
    async fn socket_request_returns_json_response() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};

        let sock_path = test_socket_path();
        let server = Arc::new(build_socket_test_server(sock_path.clone()));

        let server_handle = {
            let s = server.clone();
            tokio::spawn(async move {
                let _ = s.start().await;
            })
        };

        // Wait for socket
        let mut ready = false;
        for _ in 0..20 {
            if sock_path.exists() {
                ready = true;
                break;
            }
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        assert!(ready, "Socket must appear within 2 seconds");

        // Send a proxied request JSON
        let request_json = serde_json::json!({
            "agent_id": "test-agent",
            "method": "GET",
            "url": "https://api.anthropic.com:1/v1/test",
            "headers": [],
            "body": null
        });

        let mut stream = tokio::net::UnixStream::connect(&sock_path)
            .await
            .expect("Must connect to proxy socket");

        let request_bytes = serde_json::to_vec(&request_json).unwrap();
        stream
            .write_all(&request_bytes)
            .await
            .expect("Must write request");

        stream.shutdown().await.ok();

        let mut response = String::new();
        stream
            .read_to_string(&mut response)
            .await
            .expect("Must read response");

        // Response should be valid JSON (either success or error shape)
        assert!(
            !response.is_empty(),
            "Socket response must not be empty"
        );
        let parsed: serde_json::Value =
            serde_json::from_str(&response).expect("Response must be valid JSON");

        // Either "status" field (success) or "error" field (network error expected)
        assert!(
            parsed.get("status").is_some() || parsed.get("error").is_some(),
            "Response must have 'status' or 'error' field, got: {}",
            response
        );

        // Cleanup
        server_handle.abort();
        let _ = std::fs::remove_file(&sock_path);
    }

    // ========================================================================
    // Test 3: Socket file has mode 0600
    // ========================================================================

    #[tokio::test]
    async fn socket_file_has_mode_0600() {
        use std::os::unix::fs::PermissionsExt;

        let sock_path = test_socket_path();
        let server = Arc::new(build_socket_test_server(sock_path.clone()));

        let server_handle = {
            let s = server.clone();
            tokio::spawn(async move {
                let _ = s.start().await;
            })
        };

        // Wait for socket
        let mut ready = false;
        for _ in 0..20 {
            if sock_path.exists() {
                ready = true;
                break;
            }
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        assert!(ready, "Socket must appear within 2 seconds");

        let metadata = std::fs::metadata(&sock_path)
            .expect("Must read socket metadata");
        let mode = metadata.permissions().mode() & 0o777;
        assert_eq!(
            mode, 0o600,
            "Socket permissions must be 0600 (owner-only), got: {:o}",
            mode
        );

        // Cleanup
        server_handle.abort();
        let _ = std::fs::remove_file(&sock_path);
    }
}
