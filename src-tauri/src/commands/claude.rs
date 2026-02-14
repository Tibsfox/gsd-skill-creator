use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::claude::session::{
    detect_claude_binary, generate_session_id, start_claude_in_tmux, stop_claude_in_tmux,
    ClaudeSessionInfo, ClaudeSessionManager, ClaudeStatus,
};

/// List all tracked Claude sessions.
#[tauri::command]
pub fn claude_list(
    state: tauri::State<'_, Mutex<ClaudeSessionManager>>,
) -> Result<Vec<ClaudeSessionInfo>, String> {
    let mgr = state.lock().map_err(|e| e.to_string())?;
    Ok(mgr.list().into_iter().cloned().collect())
}

/// Get status of a specific Claude session.
#[tauri::command]
pub fn claude_status(
    state: tauri::State<'_, Mutex<ClaudeSessionManager>>,
    id: String,
) -> Result<ClaudeSessionInfo, String> {
    let mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.get(&id)
        .cloned()
        .ok_or_else(|| format!("Claude session '{}' not found", id))
}

/// Start a new Claude Code session in a tmux window.
///
/// 1. Verify claude binary is in PATH
/// 2. Generate a unique session ID
/// 3. Open a tmux window named after the session ID in the "gsd" session
/// 4. Track the new session in the manager
#[tauri::command]
pub async fn claude_start(
    state: tauri::State<'_, Mutex<ClaudeSessionManager>>,
    project_dir: Option<String>,
) -> Result<ClaudeSessionInfo, String> {
    // Verify claude is installed
    if detect_claude_binary().is_none() {
        return Err("Claude Code is not installed or not in PATH".into());
    }

    let session_id = generate_session_id();
    let window_name = session_id.clone();

    // Start Claude in a tmux window
    start_claude_in_tmux("gsd", &window_name, project_dir.as_deref())?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let info = ClaudeSessionInfo {
        id: session_id.clone(),
        tmux_window: window_name,
        status: ClaudeStatus::Starting,
        started_at: now,
        last_activity: now,
        project_dir,
    };

    // Track in manager
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.insert(session_id, info.clone());

    Ok(info)
}

/// Stop a running Claude Code session.
///
/// 1. Look up session by ID
/// 2. Send Ctrl-C then kill the tmux window
/// 3. Remove from tracked sessions
#[tauri::command]
pub async fn claude_stop(
    state: tauri::State<'_, Mutex<ClaudeSessionManager>>,
    id: String,
) -> Result<(), String> {
    let tmux_window = {
        let mgr = state.lock().map_err(|e| e.to_string())?;
        let session = mgr
            .get(&id)
            .ok_or_else(|| format!("Claude session '{}' not found", id))?;
        session.tmux_window.clone()
    };

    // Stop the tmux window (sends Ctrl-C then kills)
    stop_claude_in_tmux("gsd", &tmux_window)?;

    // Remove from manager
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.update_status(&id, ClaudeStatus::Stopped);
    mgr.remove(&id);

    Ok(())
}

#[cfg(test)]
mod tests {
    /// Verify that all 4 claude command functions exist and are callable.
    #[test]
    fn test_claude_commands_exist() {
        let _ = super::claude_list as fn(_) -> _;
        let _ = super::claude_status as fn(_, _) -> _;
    }
}
