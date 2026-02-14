mod commands;
mod error;
mod pty;
mod state;
mod tmux;
mod watcher;

use std::sync::Mutex;
use tauri::Manager;

use pty::manager::PtyManager;
use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            app.manage(Mutex::new(state::WatcherState::default()));
            app.manage(Mutex::new(PtyManager::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet::greet,
            commands::echo::echo_event,
            commands::echo::echo_channel,
            commands::benchmark::ipc_benchmark,
            commands::benchmark::ipc_benchmark_channel,
            commands::watcher::start_watcher,
            commands::watcher::stop_watcher,
            commands::watcher::watcher_status,
            commands::pty::pty_open,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_pause,
            commands::pty::pty_resume,
            commands::pty::pty_close,
            commands::tmux::tmux_has_tmux,
            commands::tmux::tmux_list_sessions,
            commands::tmux::tmux_ensure_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
