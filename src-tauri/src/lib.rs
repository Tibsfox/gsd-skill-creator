mod claude;
mod commands;
mod error;
mod pty;
pub mod security;
pub mod api;
mod state;
mod tmux;
mod mcp_host;
pub mod staging;
pub mod ipc;
pub mod magic;
pub mod services;
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
            app.manage(tokio::sync::Mutex::new(security::SecurityState::new()));
            app.manage(tokio::sync::Mutex::new(state::ApiClientState::default()));
            app.manage(tokio::sync::Mutex::new(services::launcher::ServiceLauncher::new_without_emitter()));
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
            commands::security::security_get_status,
            commands::security::security_release_quarantine,
            commands::security::sandbox_verify_full,
            commands::security::proxy_health,
            commands::security::agent_create,
            commands::security::agent_destroy,
            commands::security::agent_verify_isolation,
            commands::ipc::send_chat_message,
            commands::ipc::has_api_key,
            commands::ipc::store_api_key,
            commands::ipc::get_service_states,
            commands::magic::set_magic_level,
            commands::magic::get_magic_level,
            commands::ipc::get_conversation_history,
            commands::ipc::start_service,
            commands::ipc::stop_service,
            commands::ipc::restart_service,
            commands::ipc::get_staging_status,
            commands::services::svc_start_service,
            commands::services::svc_start_all_services,
            commands::services::svc_get_all_service_states,
            commands::services::svc_restart_service,
            commands::staging::staging_trigger_intake,
            commands::staging::staging_get_debrief,
            commands::staging::staging_list_quarantine,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
