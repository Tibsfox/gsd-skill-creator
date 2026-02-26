//! Graceful shutdown manager for GSD-OS services.
//!
//! Handles process tracking, reverse topological shutdown ordering,
//! and SIGTERM/wait/SIGKILL sequencing to prevent orphan processes.

use std::collections::HashMap;
use std::time::Duration;

use super::registry;
use super::types::ServiceId;

/// Manages tracked process PIDs and graceful shutdown sequencing.
pub struct ShutdownManager {
    /// PIDs of spawned service processes, keyed by service ID.
    tracked_pids: HashMap<ServiceId, u32>,
    /// Maximum time to wait for graceful shutdown before SIGKILL.
    timeout: Duration,
}

impl ShutdownManager {
    /// Create a new shutdown manager with default 10-second timeout.
    pub fn new() -> Self {
        Self {
            tracked_pids: HashMap::new(),
            timeout: Duration::from_secs(10),
        }
    }

    /// Create a shutdown manager with a custom timeout.
    pub fn with_timeout(timeout: Duration) -> Self {
        Self {
            tracked_pids: HashMap::new(),
            timeout,
        }
    }

    /// Get the graceful shutdown timeout.
    pub fn timeout(&self) -> Duration {
        self.timeout
    }

    /// Track a PID for a service.
    pub fn track_pid(&mut self, id: ServiceId, pid: u32) {
        self.tracked_pids.insert(id, pid);
    }

    /// Stop tracking a PID for a service.
    pub fn untrack_pid(&mut self, id: ServiceId) {
        self.tracked_pids.remove(&id);
    }

    /// Get the tracked PID for a service.
    pub fn get_pid(&self, id: &ServiceId) -> Option<u32> {
        self.tracked_pids.get(id).copied()
    }

    /// Clear all tracked PIDs.
    pub fn cleanup_tracked(&mut self) {
        self.tracked_pids.clear();
    }

    /// Return the shutdown order (reverse topological order).
    ///
    /// Terminal shuts down first, Tmux shuts down last.
    pub fn shutdown_order() -> Vec<ServiceId> {
        registry::topological_order().into_iter().rev().collect()
    }

    /// Synchronous shutdown of all services (for testing).
    ///
    /// Iterates in reverse topological order. For services without tracked
    /// PIDs, returns Ok immediately. For services with PIDs, the actual
    /// signal sending is handled by `shutdown_all_async`.
    pub fn shutdown_all_sync(&mut self) -> Vec<(ServiceId, Result<(), String>)> {
        let order = Self::shutdown_order();
        let mut results = Vec::new();

        for id in order {
            if self.tracked_pids.contains_key(&id) {
                // In sync mode, we just record that we would shut this down
                results.push((id, Ok(())));
            } else {
                // No PID tracked -- nothing to shut down
                results.push((id, Ok(())));
            }
        }

        // Clear all tracked PIDs after shutdown
        self.cleanup_tracked();
        results
    }

    /// Async shutdown of all services with SIGTERM/wait/SIGKILL.
    ///
    /// Iterates in reverse topological order. For each service with a
    /// tracked PID, sends SIGTERM, waits up to `timeout`, then SIGKILL.
    pub async fn shutdown_all_async(&mut self) -> Vec<(ServiceId, Result<(), String>)> {
        let order = Self::shutdown_order();
        let mut results = Vec::new();

        for id in order {
            if let Some(pid) = self.tracked_pids.get(&id).copied() {
                let result =
                    Self::graceful_shutdown_pid(pid, self.timeout).await;
                results.push((id, result));
            } else {
                results.push((id, Ok(())));
            }
        }

        self.cleanup_tracked();
        results
    }

    /// Gracefully shut down a process by PID.
    ///
    /// 1. Send SIGTERM via `kill` command
    /// 2. Wait up to `timeout` for process to exit
    /// 3. If still running after timeout, send SIGKILL
    pub async fn graceful_shutdown_pid(
        pid: u32,
        timeout: Duration,
    ) -> Result<(), String> {
        // Send SIGTERM via kill command (avoids direct libc dependency)
        let term_output = std::process::Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to send SIGTERM to {}: {}", pid, e))?;

        if !term_output.status.success() {
            let stderr = String::from_utf8_lossy(&term_output.stderr);
            // "No such process" means it already exited
            if stderr.contains("No such process") {
                return Ok(());
            }
            return Err(format!("Failed to send SIGTERM to {}: {}", pid, stderr.trim()));
        }

        // Wait for process to exit
        let deadline = tokio::time::Instant::now() + timeout;
        loop {
            // Check if process still exists (signal 0 = check only)
            let check = std::process::Command::new("kill")
                .arg("-0")
                .arg(pid.to_string())
                .output();

            match check {
                Ok(output) if !output.status.success() => {
                    // Process gone
                    return Ok(());
                }
                _ => {}
            }

            if tokio::time::Instant::now() >= deadline {
                break;
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        // Timeout exceeded -- send SIGKILL
        let kill_output = std::process::Command::new("kill")
            .arg("-KILL")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to send SIGKILL to {}: {}", pid, e))?;

        if !kill_output.status.success() {
            let stderr = String::from_utf8_lossy(&kill_output.stderr);
            if stderr.contains("No such process") {
                return Ok(()); // Process exited between check and kill
            }
            return Err(format!("Failed to send SIGKILL to {}: {}", pid, stderr.trim()));
        }

        Err(format!(
            "Process {} required SIGKILL after {}s timeout",
            pid,
            timeout.as_secs()
        ))
    }
}
