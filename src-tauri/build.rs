fn main() {
    // Generate allow-/deny- permissions for each custom command.
    // This enables the capability ACL so commands must be explicitly
    // permitted in capabilities/default.json.
    let manifest = tauri_build::AppManifest::new().commands(&[
        "greet",
        "echo_event",
        "echo_channel",
        "ipc_benchmark",
        "ipc_benchmark_channel",
        "start_watcher",
        "stop_watcher",
        "watcher_status",
        "pty_open",
        "pty_write",
        "pty_resize",
        "pty_pause",
        "pty_resume",
        "pty_close",
        "tmux_has_tmux",
        "tmux_list_sessions",
        "tmux_ensure_session",
        "claude_start",
        "claude_stop",
        "claude_list",
        "claude_status",
    ]);

    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(manifest),
    )
    .expect("failed to run tauri build");
}
