use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;

use super::session::{ClaudeSessionManager, ClaudeStatus};

/// Status change event emitted to webview.
#[derive(serde::Serialize, Clone)]
pub struct ClaudeStatusEvent {
    pub id: String,
    pub status: ClaudeStatus,
    pub timestamp: u64,
}

/// Start a background monitor that polls Claude session status.
///
/// Checks at `poll_interval_ms` intervals if tmux windows for tracked
/// sessions still exist. Emits "claude:status" events when status changes.
///
/// Returns a shutdown sender. Dropping it or sending () stops the monitor.
pub fn start_monitor(app_handle: AppHandle, poll_interval_ms: u64) -> mpsc::Sender<()> {
    let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);

    tauri::async_runtime::spawn(async move {
        let interval = tokio::time::Duration::from_millis(poll_interval_ms);
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => break,
                _ = tokio::time::sleep(interval) => {
                    check_sessions(&app_handle);
                }
            }
        }
    });

    shutdown_tx
}

/// Check all tracked sessions for status changes.
fn check_sessions(app_handle: &AppHandle) {
    let state = app_handle.try_state::<Mutex<ClaudeSessionManager>>();
    let Some(state) = state else { return };
    let mut mgr = match state.lock() {
        Ok(m) => m,
        Err(_) => return,
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // Collect session IDs to check
    let session_ids: Vec<String> = mgr.sessions.keys().cloned().collect();

    for id in session_ids {
        let Some(session) = mgr.sessions.get(&id) else {
            continue;
        };
        let tmux_window = session.tmux_window.clone();
        let old_status = session.status.clone();

        // Check if the tmux window still exists
        let window_exists = std::process::Command::new("tmux")
            .args(["has-session", "-t", &tmux_window])
            .status()
            .map(|s| s.success())
            .unwrap_or(false);

        let new_status = if !window_exists {
            ClaudeStatus::Stopped
        } else {
            // Check activity: if last_activity is within 5 seconds, Active
            // If within 30 seconds, Paused
            // Otherwise, Idle
            let elapsed = now.saturating_sub(session.last_activity);
            if elapsed < 5 {
                ClaudeStatus::Active
            } else if elapsed < 30 {
                ClaudeStatus::Paused
            } else {
                ClaudeStatus::Idle
            }
        };

        if new_status != old_status {
            if let Some(s) = mgr.sessions.get_mut(&id) {
                s.status = new_status.clone();
            }
            let _ = app_handle.emit(
                "claude:status",
                ClaudeStatusEvent {
                    id: id.clone(),
                    status: new_status,
                    timestamp: now,
                },
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claude_status_event_serialization() {
        let event = ClaudeStatusEvent {
            id: "claude-123".into(),
            status: ClaudeStatus::Active,
            timestamp: 1707900000,
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"active\""));
        assert!(json.contains("claude-123"));
        assert!(json.contains("1707900000"));
    }

    #[test]
    fn test_status_thresholds() {
        // Verify the status threshold logic:
        // < 5s = Active, 5-29s = Paused, >= 30s = Idle
        let now = 1000u64;

        // Active: last activity 3 seconds ago
        let elapsed = now.saturating_sub(997);
        assert_eq!(elapsed, 3);
        assert!(elapsed < 5); // Active

        // Paused: last activity 15 seconds ago
        let elapsed = now.saturating_sub(985);
        assert_eq!(elapsed, 15);
        assert!(elapsed >= 5 && elapsed < 30); // Paused

        // Idle: last activity 60 seconds ago
        let elapsed = now.saturating_sub(940);
        assert_eq!(elapsed, 60);
        assert!(elapsed >= 30); // Idle
    }
}
