mod claude;
mod commands;
mod error;
mod pty;
pub mod security;
mod state;
mod tmux;
mod mcp_host;
mod watcher;

use std::sync::Mutex;
use tauri::Manager;

use claude::session::ClaudeSessionManager;
use pty::manager::PtyManager;
use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            app.manage(Mutex::new(state::WatcherState::default()));
            app.manage(Mutex::new(PtyManager::default()));
            app.manage(Mutex::new(ClaudeSessionManager::default()));
            app.manage(tokio::sync::Mutex::new(mcp_host::McpHostState::new()));
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
            commands::claude::claude_start,
            commands::claude::claude_stop,
            commands::claude::claude_list,
            commands::claude::claude_status,
            commands::dashboard::generate_dashboard,
            mcp_host::commands::mcp_connect,
            mcp_host::commands::mcp_disconnect,
            mcp_host::commands::mcp_list_servers,
            mcp_host::commands::mcp_call_tool,
            mcp_host::commands::mcp_get_trace,
            mcp_host::commands::mcp_get_trust_state,
            commands::security_init::init_security_directory,
            commands::sandbox::get_sandbox_platform,
            commands::sandbox::configure_sandbox,
            commands::sandbox::get_sandbox_status,
            commands::sandbox::verify_sandbox,
            commands::proxy::start_proxy,
            commands::proxy::stop_proxy,
            commands::proxy::proxy_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
