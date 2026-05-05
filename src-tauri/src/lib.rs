pub mod xdg;
mod claude;
mod commands;
mod error;
mod pty;
pub mod security;
pub mod api;
mod state;
mod tmux;
mod mcp_host;
pub mod memory_arena;
pub mod staging;
pub mod ipc;
pub mod magic;
pub mod pcg;
pub mod services;
mod watcher;
pub mod intelligence;

use std::sync::Mutex;
use tauri::Manager;

use claude::session::ClaudeSessionManager;
use pty::manager::PtyManager;
use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            // Phase 824 / C07 + Phase 825 / D-25-08: intelligence state with real KB delegate.
            // The real delegate opens the same SQLite databases the TS KBStore writes
            // (~/.gsd/intelligence/registry.db and <project>/.gsd/intelligence/intelligence.db).
            // Read paths fully functional; mutation paths land in Phase 826.
            {
                let repo_root = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
                app.manage(std::sync::Mutex::new(
                    intelligence::server::IntelligenceState::new(repo_root),
                ));
            }
            // v1.49.607 W1 Track C / E4 — Atlas KB state.
            // Phase 824 shipped with `new_with_stub` (the W1 Track C parallel build);
            // E4 swaps it for `new_with_sqlite`, which routes the 12 Atlas Tauri
            // commands through `SqliteAtlasKbDelegate` against the per-project
            // intelligence DB (migration 003). Empty registry → empty results, so
            // the desktop UI remains safe before any project is indexed.
            app.manage(std::sync::Mutex::new(intelligence::atlas::AtlasState::new_with_sqlite()));
            app.manage(Mutex::new(state::WatcherState::default()));
            app.manage(Mutex::new(PtyManager::default()));
            app.manage(Mutex::new(ClaudeSessionManager::default()));
            app.manage(tokio::sync::Mutex::new(mcp_host::McpHostState::new()));
            app.manage(tokio::sync::Mutex::new(security::SecurityState::new()));
            app.manage(tokio::sync::Mutex::new(state::ApiClientState::default()));
            app.manage(tokio::sync::Mutex::new(services::launcher::ServiceLauncher::new_without_emitter()));
            app.manage(commands::memory_arena::ArenaState::default());
            app.manage(commands::memory_arena::ArenaSetState::default());
            app.manage(commands::memory_arena::CgroupState::default());

            // v1.49.7 (PR #24 @PatrickRobotham): gate tmux session auto-detection
            // and monitor on tmux availability. Without tmux, these would poll a
            // nonexistent binary every 2 seconds, causing needless ENOENT errors.
            if tmux::detector::detect_tmux().is_some() {
                // Auto-detect existing Claude sessions in the gsd tmux session
                if let Ok(output) = std::process::Command::new("tmux")
                    .args(["list-windows", "-t", "gsd", "-F", "#{window_name}"])
                    .output()
                {
                    if output.status.success() {
                        let windows = String::from_utf8_lossy(&output.stdout);
                        if let Ok(mut mgr) = app.state::<Mutex<ClaudeSessionManager>>().lock() {
                            let now = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs();
                            for name in windows.lines() {
                                if name.starts_with("claude") {
                                    mgr.insert(
                                        name.to_string(),
                                        claude::session::ClaudeSessionInfo {
                                            id: name.to_string(),
                                            tmux_window: name.to_string(),
                                            status: claude::session::ClaudeStatus::Idle,
                                            started_at: now,
                                            last_activity: now,
                                            project_dir: None,
                                        },
                                    );
                                }
                            }
                        }
                    }
                }

                // Start Claude session monitor (polls every 2s)
                // Must come after session auto-detection so there's something to poll
                let handle = app.handle().clone();
                claude::monitor::start_monitor(handle, 2000);
            }

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
            commands::memory_arena::arena_init,
            commands::memory_arena::arena_stats,
            commands::memory_arena::arena_alloc,
            commands::memory_arena::arena_get,
            commands::memory_arena::arena_free,
            commands::memory_arena::arena_touch,
            commands::memory_arena::arena_checkpoint,
            commands::memory_arena::arena_list_ids,
            commands::memory_arena::arena_set_init,
            commands::memory_arena::arena_set_alloc,
            commands::memory_arena::arena_set_get_hot,
            commands::memory_arena::arena_set_sweep,
            commands::memory_arena::arena_set_gc,
            commands::memory_arena::arena_set_flush,
            commands::memory_arena::arena_set_free,
            commands::memory_arena::arena_set_list_ids,
            commands::memory_arena::cgroup_init,
            commands::memory_arena::cgroup_state,
            commands::memory_arena::cgroup_grow,
            // Phase 824 / C07 — Intelligence Dashboard commands
            crate::intelligence::server::intelligence_list_projects,
            // v1.49.607 W1 Track C — Code Atlas commands
            crate::intelligence::server::intelligence_get_project,
            crate::intelligence::server::intelligence_register_project,
            crate::intelligence::server::intelligence_get_briefing,
            crate::intelligence::server::intelligence_list_findings,
            crate::intelligence::server::intelligence_dismiss_finding,
            crate::intelligence::server::intelligence_start_meeting,
            crate::intelligence::server::intelligence_park_meeting,
            crate::intelligence::server::intelligence_resume_meeting,
            crate::intelligence::server::intelligence_add_decision,
            crate::intelligence::server::intelligence_edit_decision,
            crate::intelligence::server::intelligence_withdraw_decision,
            crate::intelligence::server::intelligence_send_now,
            crate::intelligence::server::intelligence_preview_bundle,
            crate::intelligence::server::intelligence_commit_bundle,
            crate::intelligence::server::intelligence_request_briefing_refresh,
            crate::intelligence::server::intelligence_request_snapshot_diff,
            crate::intelligence::server::intelligence_get_meeting_record,
            crate::intelligence::atlas::atlas_list_symbols_for_file,
            crate::intelligence::atlas::atlas_list_symbols_in_snapshot,
            crate::intelligence::atlas::atlas_get_symbol,
            crate::intelligence::atlas::atlas_find_symbols_by_qualified_name,
            crate::intelligence::atlas::atlas_list_callers,
            crate::intelligence::atlas::atlas_list_callees,
            crate::intelligence::atlas::atlas_list_references_for_symbol,
            crate::intelligence::atlas::atlas_list_type_relations_from,
            crate::intelligence::atlas::atlas_list_type_relations_to,
            crate::intelligence::atlas::atlas_list_files_changed_by_mission,
            crate::intelligence::atlas::atlas_list_missions_for_file,
            crate::intelligence::atlas::atlas_list_provenance_for_line,
            crate::intelligence::atlas::atlas_request_index_snapshot,
            crate::intelligence::atlas::atlas_invalidate_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
