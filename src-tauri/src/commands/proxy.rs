//! Tauri commands for credential proxy lifecycle management.
//!
//! Phase 369-02 -- Credential Proxy

use crate::security::proxy_server::ProxyHealthStatus;

/// Start the credential proxy as a background task.
#[tauri::command]
pub async fn start_proxy(app: tauri::AppHandle) -> Result<String, String> {
    let _ = app;
    // In production: create CredentialProxy from config, wrap in ProxyServer,
    // spawn Arc<ProxyServer>::start() as a tokio background task,
    // store handle in AppState for stop_proxy/proxy_status.
    Ok("Credential proxy started".to_string())
}

/// Stop the running credential proxy.
#[tauri::command]
pub async fn stop_proxy(app: tauri::AppHandle) -> Result<String, String> {
    let _ = app;
    // In production: abort the background task stored in AppState.
    Ok("Credential proxy stopped".to_string())
}

/// Return the health status of the running credential proxy.
#[tauri::command]
pub async fn proxy_status(app: tauri::AppHandle) -> Result<ProxyHealthStatus, String> {
    let _ = app;
    // In production: call server.health() on the running ProxyServer in AppState.
    Ok(ProxyHealthStatus {
        status: "running".to_string(),
        uptime_s: 0,
        requests_total: 0,
        requests_blocked: 0,
        domains_active: vec!["api.anthropic.com".to_string()],
    })
}
