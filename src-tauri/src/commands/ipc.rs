//! Tauri commands for GSD-OS IPC communication paths.
//!
//! Phase 376 wires send_chat_message, has_api_key, and store_api_key
//! to the real API client. Other commands remain stubs for later phases.

use serde_json::json;
use tauri::Emitter;

use crate::api::client::{AnthropicClient, Message};
use crate::api::keystore::KeyStore;
use crate::state::ApiClientState;

/// Send a chat message to the Claude API with streaming response.
///
/// Lazily initializes the API client on first use. Emits IPC events
/// (chat:delta, chat:start, etc.) as streaming deltas arrive.
#[tauri::command]
pub async fn send_chat_message(
    message: String,
    conversation_id: Option<String>,
    state: tauri::State<'_, tokio::sync::Mutex<ApiClientState>>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let cid = conversation_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let mut api_state = state.lock().await;

    // Lazy-initialize client on first use
    if api_state.client.is_none() {
        match KeyStore::load() {
            Ok(ks) => match AnthropicClient::new(ks) {
                Ok(client) => {
                    api_state.client = Some(client);
                }
                Err(_e) => {
                    let _ = app_handle.emit(
                        crate::ipc::events::CHAT_NEEDS_KEY,
                        json!({"message": "API key not configured"}),
                    );
                    return Err("API key not configured".to_string());
                }
            },
            Err(_) => {
                let _ = app_handle.emit(
                    crate::ipc::events::CHAT_NEEDS_KEY,
                    json!({"message": "No API key found"}),
                );
                return Err("No API key found".to_string());
            }
        }
    }

    let client = api_state.client.as_ref().unwrap();
    let messages = vec![Message {
        role: "user".to_string(),
        content: message,
    }];
    match client
        .send_message(messages, None, &app_handle, &cid)
        .await
    {
        Ok(response) => Ok(json!({
            "conversation_id": cid,
            "input_tokens": response.input_tokens,
            "output_tokens": response.output_tokens,
        })),
        Err(e) => Err(e.to_string()),
    }
}

/// Check whether an API key is available.
#[tauri::command]
pub async fn has_api_key(
    state: tauri::State<'_, tokio::sync::Mutex<ApiClientState>>,
) -> Result<bool, String> {
    let api_state = state.lock().await;
    if api_state.client.is_some() {
        return Ok(true);
    }
    Ok(KeyStore::load().is_ok())
}

/// Store a new API key and initialize the client.
#[tauri::command]
pub async fn store_api_key(
    key: String,
    state: tauri::State<'_, tokio::sync::Mutex<ApiClientState>>,
) -> Result<(), String> {
    let ks = KeyStore::store_key(key).map_err(|e| e.to_string())?;
    let client = AnthropicClient::new(ks).map_err(|e| e.to_string())?;
    let mut api_state = state.lock().await;
    api_state.client = Some(client);
    Ok(())
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

/// Get conversation history.
///
/// Stub: will be wired to history persistence in Phase 376-02.
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
