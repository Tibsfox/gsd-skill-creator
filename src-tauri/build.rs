fn main() {
    // Generate allow-/deny- permissions for each custom command.
    // This enables the capability ACL so commands must be explicitly
    // permitted in capabilities/default.json.
    //
    // v1.49.1030 (audit ship 4): extended from 23 to all 98 registered
    // commands — every entry in lib.rs generate_handler! MUST appear here
    // and in capabilities/default.json, or the command is ACL-orphaned
    // (runtime invoke() fails "not allowed by ACL"). The reconciliation is
    // drift-guarded by src/security/acl-reconciliation-audit.test.ts;
    // keep the three lists in sync when adding or removing a command.
    let manifest = tauri_build::AppManifest::new().commands(&[
        // Core / demo
        "greet",
        "echo_event",
        "echo_channel",
        "ipc_benchmark",
        "ipc_benchmark_channel",
        // File watcher
        "start_watcher",
        "stop_watcher",
        "watcher_status",
        // PTY terminal
        "pty_open",
        "pty_write",
        "pty_resize",
        "pty_pause",
        "pty_resume",
        "pty_close",
        // tmux
        "tmux_has_tmux",
        "tmux_list_sessions",
        "tmux_ensure_session",
        // Claude sessions
        "claude_start",
        "claude_stop",
        "claude_list",
        "claude_status",
        "generate_dashboard",
        // MCP host
        "mcp_connect",
        "mcp_disconnect",
        "mcp_list_servers",
        "mcp_call_tool",
        "mcp_get_trace",
        "mcp_get_trust_state",
        // Security surface (Phase 374 unified barrel)
        "init_security_directory",
        "security_get_status",
        "security_release_quarantine",
        "sandbox_verify_full",
        "proxy_health",
        "agent_create",
        "agent_destroy",
        "agent_verify_isolation",
        // Unified keystore (v1.49.636 C1)
        "keystore_status",
        "keystore_migrate_v1_to_v2",
        "keystore_set",
        // Chat / IPC
        "send_chat_message",
        "set_magic_level",
        "get_magic_level",
        "get_conversation_history",
        "stop_service",
        "get_staging_status",
        // Service lifecycle (Phase 380-01, unified v1.49.1030)
        "start_service",
        "start_all_services",
        "get_service_states",
        "restart_service",
        // Memory arena
        "arena_init",
        "arena_stats",
        "arena_alloc",
        "arena_get",
        "arena_free",
        "arena_touch",
        "arena_checkpoint",
        "arena_list_ids",
        // Memory arena set
        "arena_set_init",
        "arena_set_alloc",
        "arena_set_get_hot",
        "arena_set_sweep",
        "arena_set_gc",
        "arena_set_flush",
        "arena_set_free",
        "arena_set_list_ids",
        // Intelligence dashboard (Phase 824 / C07)
        "intelligence_list_projects",
        "intelligence_get_project",
        "intelligence_register_project",
        "intelligence_get_briefing",
        "intelligence_list_findings",
        "intelligence_dismiss_finding",
        "intelligence_start_meeting",
        "intelligence_park_meeting",
        "intelligence_resume_meeting",
        "intelligence_add_decision",
        "intelligence_edit_decision",
        "intelligence_withdraw_decision",
        "intelligence_send_now",
        "intelligence_preview_bundle",
        "intelligence_commit_bundle",
        "intelligence_request_briefing_refresh",
        "intelligence_request_snapshot_diff",
        "intelligence_get_meeting_record",
        // Code Atlas (v1.49.607 W1 Track C)
        "atlas_list_symbols_for_file",
        "atlas_list_symbols_in_snapshot",
        "atlas_get_symbol",
        "atlas_find_symbols_by_qualified_name",
        "atlas_list_callers",
        "atlas_list_callees",
        "atlas_list_references_for_symbol",
        "atlas_list_type_relations_from",
        "atlas_list_type_relations_to",
        "atlas_list_files_changed_by_mission",
        "atlas_list_missions_for_file",
        "atlas_list_provenance_for_line",
        "atlas_request_index_snapshot",
        "atlas_invalidate_cache",
        // CAP-024: SCRIBE Dashboard native Tauri window.
        // KEEP (operator, 2026-06-11): zero desktop/ callers BY DESIGN —
        // operator-facing utility window launched via `npm run tauri:scribe`
        // or a manual devtools invoke('open_scribe_dashboard'); not wired
        // into the main-window UI. Do not triage as an ACL orphan.
        "open_scribe_dashboard",
    ]);

    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(manifest),
    )
    .expect("failed to run tauri build");
}
