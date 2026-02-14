use serde::Serialize;

use crate::tmux::{detector, session};

/// Serializable tmux session info for IPC transit.
#[derive(Serialize)]
pub struct TmuxSessionInfo {
    pub name: String,
    pub created: String,
    pub attached: bool,
    pub windows: u32,
}

/// Check whether the tmux binary is available on the system.
#[tauri::command]
pub fn tmux_has_tmux() -> bool {
    detector::detect_tmux().is_some()
}

/// List all running tmux sessions.
#[tauri::command]
pub fn tmux_list_sessions() -> Result<Vec<TmuxSessionInfo>, String> {
    let sessions = session::list_sessions()?;
    Ok(sessions
        .into_iter()
        .map(|s| TmuxSessionInfo {
            name: s.name,
            created: s.created,
            attached: s.attached,
            windows: s.windows,
        })
        .collect())
}

/// Ensure a tmux session exists (create if needed), return attach command args.
///
/// This is the primary command used by the TypeScript layer to get the
/// shell command that pty_open should spawn.
#[tauri::command]
pub fn tmux_ensure_session(name: String) -> Result<Vec<String>, String> {
    if !session::has_session(&name) {
        session::create_session(&name)?;
    }
    Ok(session::attach_command(&name))
}

#[cfg(test)]
mod tests {
    /// Verify that all 3 tmux command functions exist and are callable.
    #[test]
    fn test_tmux_commands_exist() {
        let _ = super::tmux_has_tmux as fn() -> _;
        let _ = super::tmux_list_sessions as fn() -> _;
        let _ = super::tmux_ensure_session as fn(_) -> _;
    }
}
