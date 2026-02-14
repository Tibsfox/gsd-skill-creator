use std::collections::HashMap;

use super::session::PtySession;

/// Manages all active PTY sessions. Wrapped in `std::sync::Mutex` for
/// Tauri state management.
#[derive(Default)]
pub struct PtyManager {
    pub(crate) sessions: HashMap<String, PtySession>,
}

impl PtyManager {
    /// Insert a new session with the given ID.
    pub fn insert(&mut self, id: String, session: PtySession) {
        self.sessions.insert(id, session);
    }

    /// Get a mutable reference to a session by ID.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut PtySession> {
        self.sessions.get_mut(id)
    }

    /// Get an immutable reference to a session by ID.
    pub fn get(&self, id: &str) -> Option<&PtySession> {
        self.sessions.get(id)
    }

    /// Remove and return a session by ID.
    pub fn remove(&mut self, id: &str) -> Option<PtySession> {
        self.sessions.remove(id)
    }
}
