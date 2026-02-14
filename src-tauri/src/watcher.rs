//! File watcher service using notify-debouncer-full.
//!
//! Monitors a directory recursively, debounces rapid changes (500ms),
//! filters excluded paths (node_modules, .git, coverage), converts to
//! relative paths, and emits batched events to the webview via Tauri events.

use notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebouncedEvent, DebounceEventResult};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Directory segments excluded from watcher events.
const EXCLUDED_SEGMENTS: &[&str] = &["node_modules", ".git", "coverage"];

/// Debounce window in milliseconds. Rapid changes within this window
/// are coalesced into a single batch.
const DEBOUNCE_TIMEOUT_MS: u64 = 500;

/// A single file change with a relative path and event kind label.
#[derive(Debug, Clone, Serialize)]
pub struct FileChangeEvent {
    pub path: String,
    pub kind: String,
}

/// A batch of debounced file change events emitted to the frontend.
#[derive(Debug, Clone, Serialize)]
pub struct WatcherEventBatch {
    pub events: Vec<FileChangeEvent>,
    pub count: usize,
}

/// Returns `true` if any component of `path` matches an excluded segment.
pub fn is_excluded(path: &Path) -> bool {
    path.components().any(|c| {
        EXCLUDED_SEGMENTS.contains(&c.as_os_str().to_str().unwrap_or(""))
    })
}

/// Maps a notify `EventKind` to a human-readable label.
pub fn event_kind_label(kind: &notify::EventKind) -> &'static str {
    match kind {
        notify::EventKind::Create(_) => "create",
        notify::EventKind::Modify(_) => "modify",
        notify::EventKind::Remove(_) => "remove",
        notify::EventKind::Access(_) => "access",
        notify::EventKind::Any | notify::EventKind::Other => "other",
    }
}

/// Converts debounced events into `FileChangeEvent`s, filtering excluded
/// paths and stripping the project root prefix to produce relative paths.
pub fn map_events(events: Vec<DebouncedEvent>, root: &Path) -> Vec<FileChangeEvent> {
    events
        .into_iter()
        .flat_map(|de| {
            let kind = event_kind_label(&de.event.kind).to_string();
            de.event.paths.into_iter().filter_map(move |p| {
                if is_excluded(&p) {
                    return None;
                }
                let relative = p
                    .strip_prefix(root)
                    .unwrap_or(&p)
                    .to_string_lossy()
                    .to_string();
                Some(FileChangeEvent {
                    path: relative,
                    kind: kind.clone(),
                })
            })
        })
        .collect()
}

/// Starts a file watcher on `watch_path`, emitting debounced events to the
/// webview via the Tauri event system.
///
/// Returns an `mpsc::Sender<()>` that the caller can use to signal shutdown.
/// The watcher runs in a background thread that:
/// - Keeps the debouncer alive via ownership
/// - Polls for events with a 100ms timeout
/// - Checks for shutdown signals via `try_recv`
/// - Emits `fs:changed` with `WatcherEventBatch` payloads
/// - Emits `fs:watcher-error` on debouncer errors or disconnect
pub fn start_watching(
    app_handle: AppHandle,
    watch_path: PathBuf,
    project_root: PathBuf,
) -> Result<mpsc::Sender<()>, String> {
    let (tx, rx) = mpsc::channel::<DebounceEventResult>();
    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>();

    let mut debouncer = new_debouncer(
        Duration::from_millis(DEBOUNCE_TIMEOUT_MS),
        None,
        tx,
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watch(&watch_path, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        // Keep the debouncer alive for the lifetime of this thread.
        let _debouncer = debouncer;

        loop {
            // Non-blocking check for shutdown signal.
            if shutdown_rx.try_recv().is_ok() {
                break;
            }

            match rx.recv_timeout(Duration::from_millis(100)) {
                Ok(Ok(events)) => {
                    let mapped = map_events(events, &project_root);
                    if !mapped.is_empty() {
                        let batch = WatcherEventBatch {
                            count: mapped.len(),
                            events: mapped,
                        };
                        let _ = app_handle.emit("fs:changed", &batch);
                    }
                }
                Ok(Err(errors)) => {
                    let msg = errors
                        .iter()
                        .map(|e| e.to_string())
                        .collect::<Vec<_>>()
                        .join("; ");
                    let _ = app_handle.emit("fs:watcher-error", &msg);
                }
                Err(mpsc::RecvTimeoutError::Timeout) => continue,
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    let _ = app_handle.emit("fs:watcher-error", "Watcher disconnected");
                    break;
                }
            }
        }
    });

    Ok(shutdown_tx)
}
