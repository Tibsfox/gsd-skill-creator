/// Shared error type for the GSD-OS application.
///
/// Uses thiserror for ergonomic error definition and implements
/// Serialize manually (as string via Display) for IPC transit.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Command not found: {0}")]
    CommandNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Watcher error: {0}")]
    Watcher(String),

    #[error("Watcher already running")]
    WatcherAlreadyRunning,

    #[error("Watcher not running")]
    WatcherNotRunning,

    #[error("Watch path does not exist: {0}")]
    WatchPathNotFound(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
