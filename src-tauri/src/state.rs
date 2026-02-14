/// Application state managed by Tauri.
///
/// Wrapped in `Mutex<AppState>` and registered via `app.manage()`.
/// Commands access it through `tauri::State<'_, Mutex<AppState>>`.
#[derive(Default, Debug)]
pub struct AppState {
    pub initialized: bool,
    pub ipc_call_count: u32,
}
