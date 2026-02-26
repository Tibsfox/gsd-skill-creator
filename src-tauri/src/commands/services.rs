//! Tauri command handlers for service lifecycle management.
//!
//! Phase 380-01 -- Service Registry & Launcher
//!
//! Provides 4 Tauri commands:
//! - start_service: start a single service with dependency check
//! - start_all_services: start all services in topological order
//! - get_all_service_states: get current state of all services
//! - restart_service: reset and restart a failed service

use crate::services::launcher::ServiceLauncher;
use crate::services::types::*;
use tokio::sync::Mutex;

/// Parse a service ID string to the ServiceId enum.
fn parse_service_id(s: &str) -> Result<ServiceId, LaunchError> {
    match s {
        "tmux" => Ok(ServiceId::Tmux),
        "claude_code" => Ok(ServiceId::ClaudeCode),
        "file_watcher" => Ok(ServiceId::FileWatcher),
        "dashboard" => Ok(ServiceId::Dashboard),
        "console" => Ok(ServiceId::Console),
        "staging" => Ok(ServiceId::Staging),
        "terminal" => Ok(ServiceId::Terminal),
        other => Err(LaunchError::NotFound(other.to_string())),
    }
}

/// Start a single service after verifying its dependencies are Online.
#[tauri::command]
pub async fn svc_start_service(
    id: String,
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<(), String> {
    let service_id = parse_service_id(&id).map_err(|e| e.to_string())?;
    let mut launcher = state.lock().await;
    launcher.start_service(service_id).map_err(|e| e.to_string())
}

/// Start all services in dependency-ordered sequence.
#[tauri::command]
pub async fn svc_start_all_services(
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<Vec<serde_json::Value>, String> {
    let mut launcher = state.lock().await;
    let results = launcher.start_all();
    Ok(results
        .iter()
        .map(|(id, r)| {
            serde_json::json!({
                "service_id": id.as_str(),
                "result": if r.is_ok() { "ok" } else { "error" },
                "detail": r.as_ref().err().map(|e| e.to_string()),
            })
        })
        .collect())
}

/// Get the current state of all 7 services.
#[tauri::command]
pub async fn svc_get_all_service_states(
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<Vec<serde_json::Value>, String> {
    let launcher = state.lock().await;
    let states = launcher.get_all_states();
    Ok(states
        .iter()
        .map(|(id, s)| {
            serde_json::json!({
                "service_id": id.as_str(),
                "state": s,
            })
        })
        .collect())
}

/// Restart a service: reset to Offline and re-start with dependency check.
#[tauri::command]
pub async fn svc_restart_service(
    id: String,
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<(), String> {
    let service_id = parse_service_id(&id).map_err(|e| e.to_string())?;
    let mut launcher = state.lock().await;
    launcher.restart_service(service_id).map_err(|e| e.to_string())
}
