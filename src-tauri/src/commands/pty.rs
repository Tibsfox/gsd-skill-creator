use std::io::Read;
use std::sync::Mutex;

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::ipc::Channel;
use tokio::sync::mpsc;

use crate::pty::flow::split_utf8_safe;
use crate::pty::manager::PtyManager;
use crate::pty::session::PtySession;

/// Spawn a shell process inside a PTY and stream output via `on_data` channel.
///
/// The reader runs on `tokio::task::spawn_blocking` because portable-pty's
/// `read()` is blocking I/O. Flow control is handled via an mpsc channel:
/// sending `true` pauses reads, `false` resumes.
///
/// Environment variables TERM=xterm-256color and COLORTERM=truecolor are set
/// on the spawned command to enable full color and terminal capability support.
#[tauri::command]
pub async fn pty_open(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
    shell: Option<String>,
    cols: u16,
    rows: u16,
    on_data: Channel<Vec<u8>>,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell_path = shell.unwrap_or_else(|| {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into())
    });
    let mut cmd = CommandBuilder::new(&shell_path);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    // Drop the slave immediately after spawning -- it is not needed after this point.
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Flow control channel: true = pause, false = resume
    let (flow_tx, mut flow_rx) = mpsc::channel::<bool>(16);

    // Spawn blocking reader thread for PTY output
    tokio::task::spawn_blocking(move || {
        let mut buf = [0u8; 4096];
        let mut remainder: Vec<u8> = Vec::new();
        let mut paused = false;

        loop {
            // Check flow control (non-blocking drain)
            while let Ok(should_pause) = flow_rx.try_recv() {
                paused = should_pause;
            }

            if paused {
                // Block until resume signal
                if let Some(should_pause) = flow_rx.blocking_recv() {
                    paused = should_pause;
                    if paused {
                        continue;
                    }
                } else {
                    break; // Channel closed
                }
            }

            match reader.read(&mut buf) {
                Ok(0) => break, // EOF -- process exited
                Ok(n) => {
                    // Prepend any remainder from the previous iteration
                    let data = if remainder.is_empty() {
                        &buf[..n]
                    } else {
                        remainder.extend_from_slice(&buf[..n]);
                        remainder.as_slice()
                    };

                    let (valid, rest) = split_utf8_safe(data);

                    if !valid.is_empty() {
                        if on_data.send(valid.to_vec()).is_err() {
                            break; // Channel closed (webview disconnected)
                        }
                    }

                    // Store remainder for next iteration
                    if rest.is_empty() {
                        remainder.clear();
                    } else {
                        let rest_owned = rest.to_vec();
                        remainder.clear();
                        remainder = rest_owned;
                    }
                }
                Err(_) => break, // Read error -- PTY closed
            }
        }
    });

    let session = PtySession {
        writer,
        child,
        master: pair.master,
        flow_tx,
    };

    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.insert(id, session);

    Ok(())
}

/// Write user input (keystrokes) to the PTY.
#[tauri::command]
pub fn pty_write(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
    data: String,
) -> Result<(), String> {
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    let session = mgr
        .get_mut(&id)
        .ok_or_else(|| format!("PTY session '{}' not found", id))?;
    session.write_input(data.as_bytes()).map_err(|e| e.to_string())
}

/// Resize the PTY to the given dimensions.
#[tauri::command]
pub fn pty_resize(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let mgr = state.lock().map_err(|e| e.to_string())?;
    let session = mgr
        .get(&id)
        .ok_or_else(|| format!("PTY session '{}' not found", id))?;
    session.resize(cols, rows)
}

/// Pause PTY output by sending a pause signal to the reader thread.
///
/// The flow_tx sender is cloned under a short-lived Mutex lock, then the
/// async send happens outside the lock to avoid holding it across `.await`.
#[tauri::command]
pub async fn pty_pause(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
) -> Result<(), String> {
    let flow_tx = {
        let mgr = state.lock().map_err(|e| e.to_string())?;
        let session = mgr
            .get(&id)
            .ok_or_else(|| format!("PTY session '{}' not found", id))?;
        session.flow_tx.clone()
    };
    flow_tx.send(true).await.map_err(|e| e.to_string())
}

/// Resume PTY output by sending a resume signal to the reader thread.
///
/// Same short-lock pattern as `pty_pause`.
#[tauri::command]
pub async fn pty_resume(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
) -> Result<(), String> {
    let flow_tx = {
        let mgr = state.lock().map_err(|e| e.to_string())?;
        let session = mgr
            .get(&id)
            .ok_or_else(|| format!("PTY session '{}' not found", id))?;
        session.flow_tx.clone()
    };
    flow_tx.send(false).await.map_err(|e| e.to_string())
}

/// Close a PTY session: kill the child process, drop the session.
///
/// Returns Ok if the session was found and closed, Err if not found.
#[tauri::command]
pub fn pty_close(
    state: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
) -> Result<(), String> {
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    let mut session = mgr
        .remove(&id)
        .ok_or_else(|| format!("PTY session '{}' not found", id))?;
    session.kill();
    // Session is dropped here, closing writer/reader/channel
    Ok(())
}

#[cfg(test)]
mod tests {
    /// Verify that all 6 PTY command functions exist and are callable.
    /// This is a compilation test -- the real integration tests happen
    /// via TypeScript mockIPC in later plans.
    #[test]
    fn test_pty_commands_exist() {
        // These function references verify compilation of all 6 commands
        // with their #[tauri::command] attributes.
        let _ = super::pty_open as fn(_, _, _, _, _, _) -> _;
        let _ = super::pty_write as fn(_, _, _) -> _;
        let _ = super::pty_resize as fn(_, _, _, _) -> _;
        let _ = super::pty_pause as fn(_, _) -> _;
        let _ = super::pty_resume as fn(_, _) -> _;
        let _ = super::pty_close as fn(_, _) -> _;
    }
}
