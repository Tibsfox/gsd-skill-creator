//! Tauri command handlers for service lifecycle management.
//!
//! Phase 380-01 -- Service Registry & Launcher
//! v1.49.1030 -- unified onto the unprefixed command names (LL-BOOT-007 /
//! v1.39 Tech Debt Register): the `svc_`-prefixed fns below replaced the
//! no-op ipc.rs stubs the desktop wrappers were wired to. `stop_service`
//! remains an ipc.rs stub (ServiceLauncher has no per-service stop;
//! ShutdownCoordinator is unwired -- recorded residue).
//!
//! Provides 4 Tauri commands:
//! - start_service: start a single service with dependency check
//! - start_all_services: start all services in topological order
//! - get_service_states: get current state of all services
//! - restart_service: reset and restart a failed service

use crate::services::launcher::ServiceLauncher;
use crate::services::led::led_color_for_state;
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

/// Flatten a ServiceState to the plain status string the desktop
/// string-compares against (bootstrap-flow.ts checks `status === "online"`).
/// Do NOT serialize the enum directly: serde externally-tags the
/// `Failed(String)` newtype variant as `{"failed": "msg"}`, not "failed".
fn status_str(state: &ServiceState) -> &'static str {
    match state {
        ServiceState::Offline => "offline",
        ServiceState::Starting => "starting",
        ServiceState::Online => "online",
        ServiceState::Degraded => "degraded",
        ServiceState::Failed(_) => "failed",
    }
}

/// Start a single service after verifying its dependencies are Online.
///
/// Returns `{"ok": true}` on success -- the desktop wrapper's
/// ServiceCommandResult contract (bootstrap-flow checks `result.ok`).
#[tauri::command]
pub async fn start_service(
    service_id: String,
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<serde_json::Value, String> {
    let id = parse_service_id(&service_id).map_err(|e| e.to_string())?;
    let mut launcher = state.lock().await;
    launcher.start_service(id).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "ok": true }))
}

/// Start all services in dependency-ordered sequence.
#[tauri::command]
pub async fn start_all_services(
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
///
/// Emits `{service_id, status, led_color}` -- the desktop ServiceState
/// type (desktop/src/ipc/types.ts) read by bootstrap-flow and led-bridge.
#[tauri::command]
pub async fn get_service_states(
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<Vec<serde_json::Value>, String> {
    let launcher = state.lock().await;
    let states = launcher.get_all_states();
    Ok(states
        .iter()
        .map(|(id, s)| {
            serde_json::json!({
                "service_id": id.as_str(),
                "status": status_str(s),
                "led_color": led_color_for_state(s).as_str(),
            })
        })
        .collect())
}

/// Restart a service: reset to Offline and re-start with dependency check.
///
/// Returns `{"ok": true}` on success (ServiceCommandResult contract).
#[tauri::command]
pub async fn restart_service(
    service_id: String,
    state: tauri::State<'_, Mutex<ServiceLauncher>>,
) -> Result<serde_json::Value, String> {
    let id = parse_service_id(&service_id).map_err(|e| e.to_string())?;
    let mut launcher = state.lock().await;
    launcher.restart_service(id).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "ok": true }))
}
