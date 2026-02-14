use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// Status of a Claude Code session.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ClaudeStatus {
    Active,   // Claude is actively processing (recent PTY output)
    Paused,   // Claude is waiting for user input
    Idle,     // Claude session is open but no recent activity
    Starting, // Process just spawned, not yet producing output
    Stopped,  // Process has exited
}

/// Information about a Claude Code session.
#[derive(Debug, Clone, Serialize)]
pub struct ClaudeSessionInfo {
    pub id: String,
    pub tmux_window: String,
    pub status: ClaudeStatus,
    pub started_at: u64,    // Unix timestamp
    pub last_activity: u64, // Unix timestamp of last output
    pub project_dir: Option<String>,
}

/// Manager for Claude Code sessions.
#[derive(Default)]
pub struct ClaudeSessionManager {
    pub(crate) sessions: HashMap<String, ClaudeSessionInfo>,
}

impl ClaudeSessionManager {
    /// Add a session.
    pub fn insert(&mut self, id: String, info: ClaudeSessionInfo) {
        self.sessions.insert(id, info);
    }

    /// Get session by ID.
    pub fn get(&self, id: &str) -> Option<&ClaudeSessionInfo> {
        self.sessions.get(id)
    }

    /// Get mutable reference to session by ID.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut ClaudeSessionInfo> {
        self.sessions.get_mut(id)
    }

    /// Remove session by ID.
    pub fn remove(&mut self, id: &str) -> Option<ClaudeSessionInfo> {
        self.sessions.remove(id)
    }

    /// List all sessions.
    pub fn list(&self) -> Vec<&ClaudeSessionInfo> {
        self.sessions.values().collect()
    }

    /// Update session status.
    pub fn update_status(&mut self, id: &str, status: ClaudeStatus) {
        if let Some(session) = self.sessions.get_mut(id) {
            session.status = status;
        }
    }

    /// Update last_activity timestamp.
    pub fn update_activity(&mut self, id: &str, timestamp: u64) {
        if let Some(session) = self.sessions.get_mut(id) {
            session.last_activity = timestamp;
        }
    }
}

/// Start Claude Code inside a tmux window.
///
/// Runs `tmux new-window -t {session_name} -n {window_name} "claude"`.
/// If project_dir is Some, adds `-c {project_dir}` for the working directory.
pub fn start_claude_in_tmux(
    session_name: &str,
    window_name: &str,
    project_dir: Option<&str>,
) -> Result<(), String> {
    todo!()
}

/// Stop a Claude Code session in a tmux window.
///
/// Sends Ctrl-C to interrupt Claude, waits briefly, then kills the window.
pub fn stop_claude_in_tmux(
    session_name: &str,
    window_name: &str,
) -> Result<(), String> {
    todo!()
}

/// Check if the `claude` binary is in PATH.
pub fn detect_claude_binary() -> Option<String> {
    todo!()
}

/// Generate a unique session ID based on current timestamp.
pub fn generate_session_id() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("claude-{}", millis)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claude_status_serialization() {
        let json = serde_json::to_string(&ClaudeStatus::Active).unwrap();
        assert_eq!(json, "\"active\"");

        let json = serde_json::to_string(&ClaudeStatus::Paused).unwrap();
        assert_eq!(json, "\"paused\"");

        let json = serde_json::to_string(&ClaudeStatus::Stopped).unwrap();
        assert_eq!(json, "\"stopped\"");
    }

    #[test]
    fn test_session_manager_insert_and_get() {
        let mut mgr = ClaudeSessionManager::default();
        let info = ClaudeSessionInfo {
            id: "claude-123".into(),
            tmux_window: "claude-123".into(),
            status: ClaudeStatus::Starting,
            started_at: 1707900000,
            last_activity: 1707900000,
            project_dir: Some("/tmp/test".into()),
        };
        mgr.insert("claude-123".into(), info);

        let session = mgr.get("claude-123").unwrap();
        assert_eq!(session.id, "claude-123");
        assert_eq!(session.tmux_window, "claude-123");
        assert_eq!(session.status, ClaudeStatus::Starting);
        assert_eq!(session.started_at, 1707900000);
        assert_eq!(session.project_dir, Some("/tmp/test".into()));
    }

    #[test]
    fn test_session_manager_list() {
        let mut mgr = ClaudeSessionManager::default();
        mgr.insert(
            "a".into(),
            ClaudeSessionInfo {
                id: "a".into(),
                tmux_window: "a".into(),
                status: ClaudeStatus::Active,
                started_at: 100,
                last_activity: 100,
                project_dir: None,
            },
        );
        mgr.insert(
            "b".into(),
            ClaudeSessionInfo {
                id: "b".into(),
                tmux_window: "b".into(),
                status: ClaudeStatus::Idle,
                started_at: 200,
                last_activity: 200,
                project_dir: None,
            },
        );

        let list = mgr.list();
        assert_eq!(list.len(), 2);
    }

    #[test]
    fn test_session_manager_remove() {
        let mut mgr = ClaudeSessionManager::default();
        mgr.insert(
            "rm-me".into(),
            ClaudeSessionInfo {
                id: "rm-me".into(),
                tmux_window: "rm-me".into(),
                status: ClaudeStatus::Active,
                started_at: 100,
                last_activity: 100,
                project_dir: None,
            },
        );

        let removed = mgr.remove("rm-me");
        assert!(removed.is_some());
        assert!(mgr.get("rm-me").is_none());
    }

    #[test]
    fn test_session_manager_update_status() {
        let mut mgr = ClaudeSessionManager::default();
        mgr.insert(
            "s1".into(),
            ClaudeSessionInfo {
                id: "s1".into(),
                tmux_window: "s1".into(),
                status: ClaudeStatus::Starting,
                started_at: 100,
                last_activity: 100,
                project_dir: None,
            },
        );

        mgr.update_status("s1", ClaudeStatus::Paused);
        let session = mgr.get("s1").unwrap();
        assert_eq!(session.status, ClaudeStatus::Paused);
    }

    #[test]
    fn test_generate_session_id() {
        let id = generate_session_id();
        assert!(id.starts_with("claude-"), "ID should start with 'claude-', got: {}", id);
        // Should contain a numeric timestamp after the prefix
        let suffix = &id["claude-".len()..];
        assert!(suffix.parse::<u128>().is_ok(), "Suffix should be numeric, got: {}", suffix);
    }

    #[test]
    #[should_panic(expected = "not yet implemented")]
    fn test_start_claude_tmux_command_format() {
        // This test exists to verify the stub panics.
        // It will pass in RED phase (function is todo!()) and
        // be replaced by a real test in GREEN phase.
        let _ = start_claude_in_tmux("gsd", "test-window", None);
    }

    #[test]
    #[should_panic(expected = "not yet implemented")]
    fn test_stop_claude_tmux_stub() {
        let _ = stop_claude_in_tmux("gsd", "test-window");
    }

    #[test]
    #[should_panic(expected = "not yet implemented")]
    fn test_detect_claude_binary_stub() {
        let _ = detect_claude_binary();
    }
}
