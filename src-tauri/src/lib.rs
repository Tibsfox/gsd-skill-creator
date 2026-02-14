mod commands;
mod error;
mod state;

use std::sync::Mutex;
use tauri::Manager;

use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet::greet,
            commands::echo::echo_event,
            commands::echo::echo_channel,
            commands::benchmark::ipc_benchmark,
            commands::benchmark::ipc_benchmark_channel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
