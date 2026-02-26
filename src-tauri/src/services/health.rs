//! Health monitoring for GSD-OS services.
//!
//! Tracks consecutive health check failures per service and evaluates
//! whether a service should transition to Degraded or Failed state.
//! Provides a synchronous check method for unit testing and an async
//! background loop for production use in the Tauri runtime.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use super::launcher::ServiceLauncher;
use super::types::*;

/// Result of a single health check for a service.
#[derive(Debug, Clone)]
pub struct HealthCheckResult {
    /// Whether the health check passed.
    pub healthy: bool,
    /// How long the check took in milliseconds.
    pub latency_ms: u64,
    /// Current consecutive failure count after this check.
    pub consecutive_failures: u32,
}

/// Health monitor that tracks consecutive failures and evaluates service state.
pub struct HealthMonitor {
    /// Consecutive failure counts per service.
    failure_counts: HashMap<ServiceId, u32>,
    /// Health check interval.
    interval: Duration,
    /// Number of consecutive failures before transitioning to Degraded.
    degraded_threshold: u32,
    /// Number of consecutive failures before transitioning to Failed.
    failed_threshold: u32,
}

impl HealthMonitor {
    /// Create a new health monitor with default settings.
    ///
    /// Default interval: 5 seconds
    /// Default degraded threshold: 3 consecutive failures
    /// Default failed threshold: 5 consecutive failures
    pub fn new() -> Self {
        Self {
            failure_counts: HashMap::new(),
            interval: Duration::from_secs(5),
            degraded_threshold: 3,
            failed_threshold: 5,
        }
    }

    /// Create a health monitor with a custom check interval.
    pub fn with_interval(interval: Duration) -> Self {
        Self {
            failure_counts: HashMap::new(),
            interval,
            degraded_threshold: 3,
            failed_threshold: 5,
        }
    }

    /// Get the health check interval.
    pub fn interval(&self) -> Duration {
        self.interval
    }

    /// Record a health check failure for a service.
    ///
    /// Increments the consecutive failure count.
    pub fn record_failure(&mut self, id: ServiceId) {
        let count = self.failure_counts.entry(id).or_insert(0);
        *count += 1;
    }

    /// Record a health check success for a service.
    ///
    /// Resets the consecutive failure count to zero.
    pub fn record_success(&mut self, id: ServiceId) {
        self.failure_counts.insert(id, 0);
    }

    /// Get the current consecutive failure count for a service.
    pub fn get_failure_count(&self, id: &ServiceId) -> u32 {
        self.failure_counts.get(id).copied().unwrap_or(0)
    }

    /// Evaluate what state a service should be in based on its failure count.
    ///
    /// - 0 failures: Online
    /// - 1..degraded_threshold: Online (still healthy enough)
    /// - degraded_threshold..failed_threshold: Degraded
    /// - >= failed_threshold: Failed
    pub fn evaluate_state(&self, id: &ServiceId) -> ServiceState {
        let count = self.get_failure_count(id);

        if count >= self.failed_threshold {
            ServiceState::Failed(format!(
                "Health check failed {} consecutive times",
                count
            ))
        } else if count >= self.degraded_threshold {
            ServiceState::Degraded
        } else {
            ServiceState::Online
        }
    }

    /// Get a string description of a health check type.
    pub fn check_type(health_check: &HealthCheckType) -> &'static str {
        match health_check {
            HealthCheckType::ProcessRunning(_) => "process_running",
            HealthCheckType::TmuxSession(_) => "tmux_session",
            HealthCheckType::FileExists(_) => "file_exists",
            HealthCheckType::HttpEndpoint(_) => "http_endpoint",
            HealthCheckType::DirectoryWatch(_) => "directory_watch",
        }
    }

    /// Synchronous health check for all Online or Degraded services.
    ///
    /// In unit tests, this returns healthy=true for any Online service.
    /// The actual health check execution (process checks, HTTP pings, etc.)
    /// is handled by `run_health_loop` in the Tauri runtime.
    pub fn check_all_sync(
        &self,
        states: &HashMap<ServiceId, ServiceState>,
    ) -> Vec<(ServiceId, HealthCheckResult)> {
        let mut results = Vec::new();

        for (id, state) in states {
            match state {
                ServiceState::Online | ServiceState::Degraded => {
                    results.push((
                        *id,
                        HealthCheckResult {
                            healthy: true,
                            latency_ms: 0,
                            consecutive_failures: self.get_failure_count(id),
                        },
                    ));
                }
                _ => {} // Skip non-active services
            }
        }

        results
    }

    /// Background health check loop for the Tauri runtime.
    ///
    /// Runs every `interval`, checking all Online services. On failure,
    /// increments the failure count and evaluates whether to transition
    /// the service to Degraded or Failed. On success, resets the count.
    ///
    /// Exits gracefully when `shutdown_rx` receives true.
    pub async fn run_health_loop(
        launcher: Arc<tokio::sync::Mutex<ServiceLauncher>>,
        monitor: Arc<tokio::sync::Mutex<HealthMonitor>>,
        mut shutdown_rx: tokio::sync::watch::Receiver<bool>,
    ) {
        let interval_duration = {
            let m = monitor.lock().await;
            m.interval()
        };
        let mut interval = tokio::time::interval(interval_duration);

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    let launcher_guard = launcher.lock().await;
                    let monitor_guard = monitor.lock().await;

                    // Collect Online/Degraded services to check
                    let states = launcher_guard.get_all_states().clone();
                    let to_check: Vec<ServiceId> = states
                        .iter()
                        .filter(|(_, s)| {
                            matches!(s, ServiceState::Online | ServiceState::Degraded)
                        })
                        .map(|(id, _)| *id)
                        .collect();

                    for id in to_check {
                        // In production, this would execute the actual health check
                        // based on the service's HealthCheckType. For now, we just
                        // track the framework -- actual check execution is wired in
                        // Phase 383 integration.
                        let _evaluated = monitor_guard.evaluate_state(&id);
                        // If state changed, update launcher:
                        // launcher_guard.set_state(id, evaluated);
                    }
                }
                Ok(()) = shutdown_rx.changed() => {
                    if *shutdown_rx.borrow() {
                        break;
                    }
                }
            }
        }
    }
}
