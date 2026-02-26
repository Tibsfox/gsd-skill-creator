use std::collections::HashMap;
use std::time::Duration;

use crate::services::health::*;
use crate::services::launcher::*;
use crate::services::types::*;

#[test]
fn test_health_check_result_healthy() {
    let result = HealthCheckResult {
        healthy: true,
        latency_ms: 5,
        consecutive_failures: 0,
    };
    assert!(result.healthy);
    assert_eq!(result.latency_ms, 5);
    assert_eq!(result.consecutive_failures, 0);
}

#[test]
fn test_health_monitor_initial_failure_counts_zero() {
    let monitor = HealthMonitor::new();
    assert_eq!(monitor.get_failure_count(&ServiceId::Tmux), 0);
    assert_eq!(monitor.get_failure_count(&ServiceId::ClaudeCode), 0);
    assert_eq!(monitor.get_failure_count(&ServiceId::Dashboard), 0);
}

#[test]
fn test_record_failure_increments_count() {
    let mut monitor = HealthMonitor::new();
    monitor.record_failure(ServiceId::Tmux);
    assert_eq!(monitor.get_failure_count(&ServiceId::Tmux), 1);
}

#[test]
fn test_record_success_resets_count() {
    let mut monitor = HealthMonitor::new();
    monitor.record_failure(ServiceId::Tmux);
    monitor.record_failure(ServiceId::Tmux);
    assert_eq!(monitor.get_failure_count(&ServiceId::Tmux), 2);
    monitor.record_success(ServiceId::Tmux);
    assert_eq!(monitor.get_failure_count(&ServiceId::Tmux), 0);
}

#[test]
fn test_three_failures_returns_degraded() {
    let mut monitor = HealthMonitor::new();
    for _ in 0..3 {
        monitor.record_failure(ServiceId::Tmux);
    }
    assert_eq!(
        monitor.evaluate_state(&ServiceId::Tmux),
        ServiceState::Degraded
    );
}

#[test]
fn test_four_failures_still_degraded() {
    let mut monitor = HealthMonitor::new();
    for _ in 0..4 {
        monitor.record_failure(ServiceId::Tmux);
    }
    assert_eq!(
        monitor.evaluate_state(&ServiceId::Tmux),
        ServiceState::Degraded
    );
}

#[test]
fn test_five_failures_returns_failed() {
    let mut monitor = HealthMonitor::new();
    for _ in 0..5 {
        monitor.record_failure(ServiceId::Tmux);
    }
    match monitor.evaluate_state(&ServiceId::Tmux) {
        ServiceState::Failed(_) => {} // Expected
        other => panic!("Expected Failed, got {:?}", other),
    }
}

#[test]
fn test_success_after_degraded_returns_online() {
    let mut monitor = HealthMonitor::new();
    // 3 failures -> Degraded
    for _ in 0..3 {
        monitor.record_failure(ServiceId::Tmux);
    }
    assert_eq!(
        monitor.evaluate_state(&ServiceId::Tmux),
        ServiceState::Degraded
    );
    // Success resets
    monitor.record_success(ServiceId::Tmux);
    assert_eq!(
        monitor.evaluate_state(&ServiceId::Tmux),
        ServiceState::Online
    );
}

#[test]
fn test_health_interval_default_five_seconds() {
    let monitor = HealthMonitor::new();
    assert_eq!(monitor.interval(), Duration::from_secs(5));
}

#[test]
fn test_health_interval_configurable() {
    let monitor = HealthMonitor::with_interval(Duration::from_secs(10));
    assert_eq!(monitor.interval(), Duration::from_secs(10));
}

#[test]
fn test_check_tmux_session_type() {
    let check_type = HealthMonitor::check_type(&HealthCheckType::TmuxSession("gsd".into()));
    assert_eq!(check_type, "tmux_session");
}

#[test]
fn test_check_all_returns_results_for_online_services_only() {
    let monitor = HealthMonitor::new();
    let mut states: HashMap<ServiceId, ServiceState> = HashMap::new();
    states.insert(ServiceId::Tmux, ServiceState::Online);
    states.insert(ServiceId::ClaudeCode, ServiceState::Offline);
    states.insert(ServiceId::FileWatcher, ServiceState::Starting);

    let results = monitor.check_all_sync(&states);
    // Only Tmux is Online, so only one result
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].0, ServiceId::Tmux);
    assert!(results[0].1.healthy);
}
