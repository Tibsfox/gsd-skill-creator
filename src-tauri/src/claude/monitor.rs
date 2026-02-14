use super::session::ClaudeStatus;

/// Status change event emitted to webview.
#[derive(serde::Serialize, Clone)]
pub struct ClaudeStatusEvent {
    pub id: String,
    pub status: ClaudeStatus,
    pub timestamp: u64,
}

// Monitor implementation will be added in Task 2 (GREEN phase).
