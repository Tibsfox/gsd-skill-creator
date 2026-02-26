//! Tauri command stubs for all GSD-OS IPC communication paths.
//!
//! These are typed command signatures that the desktop webview invokes via
//! `@tauri-apps/api/core invoke()`. Each command returns placeholder data
//! and will be wired to real backend logic in phases 376-382.
//!
//! All commands use `Result<serde_json::Value, String>` for consistent
//! error handling across the IPC boundary.

use serde_json::json;

/// Send a chat message to the Claude API.
///
/// Stub: will be wired to API client in Phase 376.
#[tauri::command]
pub async fn send_chat_message(
    message: String,
    conversation_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let cid = conversation_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let _ = message; // suppress unused warning in stub
    Ok(json!({ "conversation_id": cid }))
}

/// Get the current state of all managed services.
///
/// Stub: will be wired to service launcher in Phase 380.
#[tauri::command]
pub async fn get_service_states() -> Result<serde_json::Value, String> {
    Ok(json!([]))
}

/// Set the magic verbosity level (1-5).
///
/// Stub: will be wired to magic system in Phase 379.
#[tauri::command]
pub async fn set_magic_level(level: u8) -> Result<serde_json::Value, String> {
    if !(1..=5).contains(&level) {
        return Err("Magic level must be 1-5".to_string());
    }
    Ok(json!({ "level": level, "previous_level": 3 }))
}

/// Get the current magic verbosity level.
///
/// Stub: will read from .planning/config/magic-level.json in Phase 379.
#[tauri::command]
pub async fn get_magic_level() -> Result<serde_json::Value, String> {
    Ok(json!({ "level": 3 }))
}

/// Get conversation history by ID.
///
/// Stub: will read from .planning/conversations/ in Phase 376.
#[tauri::command]
pub async fn get_conversation_history(
    conversation_id: String,
) -> Result<serde_json::Value, String> {
    let _ = conversation_id; // suppress unused warning in stub
    Ok(json!({ "messages": [] }))
}

/// Start a managed service.
///
/// Stub: will be wired to service launcher in Phase 380.
#[tauri::command]
pub async fn start_service(service_id: String) -> Result<serde_json::Value, String> {
    let _ = service_id; // suppress unused warning in stub
    Ok(json!({ "ok": true }))
}

/// Stop a managed service.
///
/// Stub: will be wired to service launcher in Phase 380.
#[tauri::command]
pub async fn stop_service(service_id: String) -> Result<serde_json::Value, String> {
    let _ = service_id; // suppress unused warning in stub
    Ok(json!({ "ok": true }))
}

/// Restart a managed service.
///
/// Stub: will be wired to service launcher in Phase 380.
#[tauri::command]
pub async fn restart_service(service_id: String) -> Result<serde_json::Value, String> {
    let _ = service_id; // suppress unused warning in stub
    Ok(json!({ "ok": true }))
}

/// Get staging intake status (counts of files in each stage).
///
/// Stub: will be wired to staging intake in Phase 381.
#[tauri::command]
pub async fn get_staging_status() -> Result<serde_json::Value, String> {
    Ok(json!({ "intake_count": 0, "processing_count": 0, "quarantine_count": 0 }))
}
