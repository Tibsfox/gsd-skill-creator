//! IPC commands for file watcher lifecycle control.
//!
//! Three commands: start_watcher, stop_watcher, watcher_status.
//! All access `WatcherState` via Tauri's managed state injection.

use std::sync::Mutex;
use tauri::State;

use crate::state::WatcherState;

/// Starts the file watcher on the given path.
///
/// Returns an error if the watcher is already running or the watch path
/// does not exist. Stores the shutdown sender in `WatcherState` for
/// later lifecycle control.
#[tauri::command]
pub fn start_watcher(
    app: tauri::AppHandle,
    state: State<'_, Mutex<WatcherState>>,
    path: String,
    project_root: String,
) -> Result<(), String> {
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;

    if watcher_state.shutdown_tx.is_some() {
        return Err("Watcher already running".to_string());
    }

    let watch_path = std::path::PathBuf::from(&path);
    let root_path = std::path::PathBuf::from(&project_root);

    if !watch_path.exists() {
        return Err(format!("Watch path does not exist: {}", path));
    }

    let shutdown_tx = crate::watcher::start_watching(app, watch_path, root_path)?;

    watcher_state.shutdown_tx = Some(shutdown_tx);
    Ok(())
}

/// Stops the file watcher if it is running.
///
/// Idempotent: returns Ok even if the watcher is not running.
#[tauri::command]
pub fn stop_watcher(
    state: State<'_, Mutex<WatcherState>>,
) -> Result<(), String> {
    let mut watcher_state = state.lock().map_err(|e| e.to_string())?;

    if let Some(tx) = watcher_state.shutdown_tx.take() {
        let _ = tx.send(()); // signal shutdown
    }

    Ok(())
}

/// Returns whether the file watcher is currently running.
#[tauri::command]
pub fn watcher_status(
    state: State<'_, Mutex<WatcherState>>,
) -> Result<bool, String> {
    let watcher_state = state.lock().map_err(|e| e.to_string())?;
    Ok(watcher_state.shutdown_tx.is_some())
}
