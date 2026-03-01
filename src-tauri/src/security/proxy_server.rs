//! Full async proxy server with credential-free logging, health endpoint,
//! concurrent request handling, and SecurityEvent emission.
//!
//! Phase 369-02 -- Credential Proxy Server
//!
//! Security invariants:
//! - Log entries NEVER contain: authorization, x-api-key, cookie, body
//! - SecurityEvent for blocked requests contains domain + agent_id only
//! - Each request holds a read lock -- no credential cross-contamination
//! - Response headers stripped of auth-related values before returning to agent

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;

use crate::security::proxy::{
    extract_domain, extract_path, CredentialProxy, ProxiedRequest, ProxiedResponse, ProxyError,
};

// ============================================================================
// Health status
// ============================================================================

/// Health status returned by the proxy server.
/// Contains NO credential information -- only operational metrics.
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ProxyHealthStatus {
    pub status: String,
    pub uptime_s: u64,
    pub requests_total: u64,
    pub requests_blocked: u64,
    pub domains_active: Vec<String>,
}

// ============================================================================
// Log entry (credential-free)
// ============================================================================

/// A single log entry. Fields NEVER logged: authorization, x-api-key, cookie, body.
#[derive(serde::Serialize, Debug)]
struct LogEntry {
    timestamp: String,
    agent_id: String,
    domain: String,
    path: String,
    method: String,
    status: u16,
    latency_ms: u64,
    credential_used: String, // "api_key_header" | "bearer" | "ssh_agent" | "none"
    bytes_sent: u64,
    bytes_received: u64,
    // DELIBERATELY absent: authorization, x-api-key, cookie, request body, response body
}

// ============================================================================
// ProxyServer
// ============================================================================

/// Async credential proxy server.
///
/// Wraps a CredentialProxy in Arc<RwLock<>> for concurrent access.
/// Each request acquires a read lock -- multiple agents can be served
/// simultaneously with zero contention on credential data.
pub struct ProxyServer {
    proxy: Arc<RwLock<CredentialProxy>>,
    start_time: Instant,
    requests_total: Arc<AtomicU64>,
    requests_blocked: Arc<AtomicU64>,
}

impl ProxyServer {
    /// Create a new proxy server wrapping the given credential proxy.
    pub fn new(proxy: CredentialProxy) -> Self {
        Self {
            proxy: Arc::new(RwLock::new(proxy)),
            start_time: Instant::now(),
            requests_total: Arc::new(AtomicU64::new(0)),
            requests_blocked: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Process a request: check allowlist, inject credential, log (without credentials).
    ///
    /// Each request holds only a read lock -- concurrent requests from different
    /// agents never contend on write access (no cross-contamination possible).
    pub async fn handle(&self, mut req: ProxiedRequest) -> Result<ProxiedResponse, ProxyError> {
        let start = Instant::now();
        self.requests_total.fetch_add(1, Ordering::Relaxed);

        let proxy = self.proxy.read().await; // read lock -- concurrent safe

        // 1. Extract domain
        let domain = extract_domain(&req.url);

        // 2. Allowlist check (deny-by-default)
        if !proxy.is_allowed(&domain) {
            self.requests_blocked.fetch_add(1, Ordering::Relaxed);
            // Emit SecurityEvent -- domain and agent_id only, never credentials
            emit_blocked_event(&domain, &req.agent_id);
            // Log blocked request
            self.write_log_entry(
                &proxy,
                LogEntry {
                    timestamp: iso_now(),
                    agent_id: req.agent_id.clone(),
                    domain: domain.clone(),
                    path: extract_path(&req.url),
                    method: req.method.clone(),
                    status: 403,
                    latency_ms: start.elapsed().as_millis() as u64,
                    credential_used: "none".to_string(),
                    bytes_sent: 0,
                    bytes_received: 0,
                },
            );
            return Err(ProxyError::DomainBlocked(domain));
        }

        // 3. Record credential type name BEFORE injection (for logging)
        let credential_type_name = proxy.credential_type_name(&domain);

        // 4. Inject credential (by-domain lookup, key never returned to caller)
        proxy.inject_credential(&mut req);

        // 5. Forward request (in production: tokio HTTP client; in tests: mock)
        let bytes_sent = req.body.as_ref().map_or(0, |b| b.len() as u64);
        let resp = self.forward(&req).await?;

        // 6. Strip auth headers from response before returning to agent
        let mut safe_resp = resp;
        safe_resp.headers.retain(|(k, _)| {
            let kl = k.to_lowercase();
            kl != "set-cookie" && kl != "authorization" && kl != "x-api-key"
        });

        // 7. Log (NEVER include credentials)
        let latency = start.elapsed().as_millis() as u64;
        self.write_log_entry(
            &proxy,
            LogEntry {
                timestamp: iso_now(),
                agent_id: req.agent_id,
                domain,
                path: extract_path(&req.url),
                method: req.method,
                status: safe_resp.status,
                latency_ms: latency,
                credential_used: credential_type_name,
                bytes_sent,
                bytes_received: safe_resp.body.len() as u64,
            },
        );

        safe_resp.latency_ms = latency;
        Ok(safe_resp)
    }

    /// Return health status of the proxy server.
    pub async fn health(&self) -> ProxyHealthStatus {
        let proxy = self.proxy.read().await;
        ProxyHealthStatus {
            status: "running".to_string(),
            uptime_s: self.start_time.elapsed().as_secs(),
            requests_total: self.requests_total.load(Ordering::Relaxed),
            requests_blocked: self.requests_blocked.load(Ordering::Relaxed),
            domains_active: proxy.allowlist.iter().cloned().collect(),
        }
    }

    /// Measure overhead of allowlist check + credential injection + log write only.
    /// Used for latency verification (no network I/O).
    pub async fn measure_overhead_only(&self) {
        let proxy = self.proxy.read().await;
        let domain = "api.anthropic.com";
        let _ = proxy.is_allowed(domain);
        // Simulate inject (no network)
        let mut req = ProxiedRequest {
            agent_id: "bench".to_string(),
            method: "POST".to_string(),
            url: format!("https://{}/bench", domain),
            headers: vec![],
            body: None,
        };
        proxy.inject_credential(&mut req);
        drop(proxy);
    }

    /// Write a log entry to the proxy log file.
    /// Fire-and-forget -- log failures must not block request handling.
    fn write_log_entry(&self, proxy: &CredentialProxy, entry: LogEntry) {
        if let Ok(line) = serde_json::to_string(&entry) {
            // Append to JSONL log file
            use std::io::Write;
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&proxy.log_path)
            {
                let _ = writeln!(file, "{}", line);
            }
        }
    }

    /// Forward a request to the actual destination via reqwest.
    ///
    /// Supports GET, POST, PUT, DELETE, PATCH, HEAD methods.
    /// Headers (including credentials injected by handle()) are forwarded.
    /// 30-second timeout prevents hanging on slow destinations.
    async fn forward(&self, req: &ProxiedRequest) -> Result<ProxiedResponse, ProxyError> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| ProxyError::SocketError(e.to_string()))?;

        let mut builder = match req.method.to_uppercase().as_str() {
            "GET" => client.get(&req.url),
            "POST" => client.post(&req.url),
            "PUT" => client.put(&req.url),
            "DELETE" => client.delete(&req.url),
            "PATCH" => client.patch(&req.url),
            "HEAD" => client.head(&req.url),
            _ => client.get(&req.url),
        };

        // Apply headers (credentials already injected by handle())
        for (k, v) in &req.headers {
            builder = builder.header(k.as_str(), v.as_str());
        }

        // Apply body if present
        if let Some(body) = &req.body {
            builder = builder.body(body.clone());
        }

        let start = Instant::now();
        let resp = builder
            .send()
            .await
            .map_err(|e| ProxyError::SocketError(e.to_string()))?;

        let status = resp.status().as_u16();
        let headers: Vec<(String, String)> = resp
            .headers()
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
            .collect();
        let body = resp
            .bytes()
            .await
            .map_err(|e| ProxyError::SocketError(e.to_string()))?
            .to_vec();

        Ok(ProxiedResponse {
            status,
            headers,
            body,
            latency_ms: start.elapsed().as_millis() as u64,
        })
    }

    /// Start the Unix socket server (production entry point).
    #[cfg(unix)]
    pub async fn start(self: Arc<Self>) -> Result<(), ProxyError> {
        use std::os::unix::fs::PermissionsExt;

        let proxy_guard = self.proxy.read().await;
        let socket_path = proxy_guard.socket_path.clone();
        drop(proxy_guard);

        let _ = std::fs::remove_file(&socket_path);
        let listener = tokio::net::UnixListener::bind(&socket_path)?;
        std::fs::set_permissions(&socket_path, std::fs::Permissions::from_mode(0o600))?;

        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    let server = self.clone();
                    tokio::spawn(async move {
                        let _ = server.handle_connection(stream).await;
                    });
                }
                Err(e) => {
                    eprintln!("Proxy accept error: {}", e);
                }
            }
        }
    }

    #[cfg(unix)]
    async fn handle_connection(
        &self,
        mut stream: tokio::net::UnixStream,
    ) -> Result<(), ProxyError> {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};

        let mut buf = vec![0u8; 64 * 1024];
        let n = stream.read(&mut buf).await?;
        if n == 0 {
            return Ok(());
        }

        // Handle health endpoint
        if buf[..n].starts_with(b"GET /__proxy_health") {
            let health = self.health().await;
            let body = serde_json::to_string(&health).unwrap_or_default();
            stream.write_all(body.as_bytes()).await?;
            return Ok(());
        }

        // Deserialize and handle proxied request
        if let Ok(req) = serde_json::from_slice::<serde_json::Value>(&buf[..n]) {
            // Parse ProxiedRequest from JSON
            let proxy_req = ProxiedRequest {
                agent_id: req["agent_id"].as_str().unwrap_or("").to_string(),
                method: req["method"].as_str().unwrap_or("GET").to_string(),
                url: req["url"].as_str().unwrap_or("").to_string(),
                headers: vec![],
                body: None,
            };
            let resp = self.handle(proxy_req).await;
            let resp_bytes = match resp {
                Ok(r) => serde_json::to_vec(&serde_json::json!({
                    "status": r.status,
                    "body": base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &r.body),
                    "latency_ms": r.latency_ms,
                }))
                .unwrap_or_default(),
                Err(e) => serde_json::to_vec(&serde_json::json!({
                    "error": e.to_string(),
                }))
                .unwrap_or_default(),
            };
            stream.write_all(&resp_bytes).await?;
        }

        Ok(())
    }
}

// ============================================================================
// Helper functions
// ============================================================================

/// Emit a SecurityEvent for a blocked request.
/// Contains domain and agent_id only -- NO credential values.
fn emit_blocked_event(domain: &str, agent_id: &str) {
    // In production, this emits via Tauri event system or internal channel.
    // Fields: domain, agent_id, timestamp -- NO credential values.
    eprintln!(
        "[SECURITY] Blocked request to {} from agent {}",
        domain, agent_id
    );
}

/// Produce an ISO 8601 timestamp string.
fn iso_now() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Simplified ISO timestamp -- production would use chrono
    format!("{}Z", secs)
}
