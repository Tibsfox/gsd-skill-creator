use std::time::Duration;

use crate::services::registry;
use crate::services::shutdown::*;
use crate::services::types::*;

#[test]
fn test_shutdown_order_is_reverse_topological() {
    let topo = registry::topological_order();
    let shutdown = ShutdownManager::shutdown_order();
    let reversed: Vec<ServiceId> = topo.into_iter().rev().collect();
    assert_eq!(shutdown, reversed);
}

#[test]
fn test_shutdown_timeout_default_ten_seconds() {
    let manager = ShutdownManager::new();
    assert_eq!(manager.timeout(), Duration::from_secs(10));
}

#[test]
fn test_shutdown_timeout_configurable() {
    let manager = ShutdownManager::with_timeout(Duration::from_secs(5));
    assert_eq!(manager.timeout(), Duration::from_secs(5));
}

#[test]
fn test_track_pid_and_retrieve() {
    let mut manager = ShutdownManager::new();
    manager.track_pid(ServiceId::Tmux, 1234);
    assert_eq!(manager.get_pid(&ServiceId::Tmux), Some(1234));
}

#[test]
fn test_untrack_pid() {
    let mut manager = ShutdownManager::new();
    manager.track_pid(ServiceId::Tmux, 1234);
    manager.untrack_pid(ServiceId::Tmux);
    assert_eq!(manager.get_pid(&ServiceId::Tmux), None);
}

#[test]
fn test_no_orphans_after_cleanup() {
    let mut manager = ShutdownManager::new();
    manager.track_pid(ServiceId::Tmux, 1234);
    manager.track_pid(ServiceId::Dashboard, 5678);
    manager.cleanup_tracked();
    assert_eq!(manager.get_pid(&ServiceId::Tmux), None);
    assert_eq!(manager.get_pid(&ServiceId::Dashboard), None);
}

#[test]
fn test_shutdown_all_returns_results() {
    let mut manager = ShutdownManager::new();
    let results = manager.shutdown_all_sync();
    // 7 entries (one per service), all Ok since no PIDs tracked
    assert_eq!(results.len(), 7);
    for (_id, result) in &results {
        assert!(result.is_ok());
    }
}
