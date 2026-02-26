use std::sync::mpsc;

use crate::api::client::AnthropicClient;

/// Managed state for the API client.
///
/// Wrapped in `tokio::sync::Mutex<ApiClientState>` for async access.
/// The client is lazily initialized on first use.
pub struct ApiClientState {
    pub client: Option<AnthropicClient>,
}

impl Default for ApiClientState {
    fn default() -> Self {
        Self { client: None }
    }
}

/// Application state managed by Tauri.
///
/// Wrapped in `Mutex<AppState>` and registered via `app.manage()`.
/// Commands access it through `tauri::State<'_, Mutex<AppState>>`.
#[derive(Default, Debug)]
pub struct AppState {}

/// File watcher lifecycle state managed by Tauri.
///
/// Wrapped in `Mutex<WatcherState>` and registered via `app.manage()`.
/// The `shutdown_tx` sender signals the background watcher thread to stop.
/// `None` means the watcher is not running; `Some` means it is active.
///
/// Note: `mpsc::Sender<()>` does not implement `Debug`, so we implement
/// it manually for this struct.
pub struct WatcherState {
    pub shutdown_tx: Option<mpsc::Sender<()>>,
}

impl Default for WatcherState {
    fn default() -> Self {
        Self { shutdown_tx: None }
    }
}
