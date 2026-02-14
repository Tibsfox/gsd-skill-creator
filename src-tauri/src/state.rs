use std::sync::mpsc;

/// Application state managed by Tauri.
///
/// Wrapped in `Mutex<AppState>` and registered via `app.manage()`.
/// Commands access it through `tauri::State<'_, Mutex<AppState>>`.
#[derive(Default, Debug)]
pub struct AppState {
    pub initialized: bool,
    pub ipc_call_count: u32,
}

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
