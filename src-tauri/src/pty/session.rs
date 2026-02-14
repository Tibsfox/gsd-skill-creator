use portable_pty::{MasterPty, PtySize};
use std::io::Write;
use tokio::sync::mpsc;

/// A single PTY session holding the writer, child process, master PTY, and
/// flow control channel sender.
///
/// The reader is NOT stored here -- it is moved into the blocking reader thread
/// during `pty_open`. The writer can only be obtained once via `take_writer()`
/// so it is captured at spawn time and stored for subsequent `pty_write` calls.
pub struct PtySession {
    pub(crate) writer: Box<dyn Write + Send>,
    pub(crate) child: Box<dyn portable_pty::Child + Send + Sync>,
    pub(crate) master: Box<dyn MasterPty + Send>,
    /// Sender for flow control signals: true = pause, false = resume.
    pub(crate) flow_tx: mpsc::Sender<bool>,
}

impl PtySession {
    /// Write input data (user keystrokes) to the PTY.
    pub fn write_input(&mut self, data: &[u8]) -> Result<(), std::io::Error> {
        self.writer.write_all(data)?;
        self.writer.flush()
    }

    /// Resize the PTY to the given dimensions.
    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())
    }

    /// Kill the child process. Ignores errors (process may already be dead).
    pub fn kill(&mut self) {
        let _ = self.child.kill();
    }
}
