use crate::services::types::*;
use crate::services::launcher::*;

#[test]
fn test_new_launcher_all_services_offline() {
    let launcher = ServiceLauncher::new_without_emitter();
    let states = launcher.get_all_states();
    assert_eq!(states.len(), 7);
    for (_id, state) in states {
        assert_eq!(*state, ServiceState::Offline);
    }
}

#[test]
fn test_start_tmux_succeeds() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let result = launcher.start_service(ServiceId::Tmux);
    assert!(result.is_ok());
    assert_eq!(
        *launcher.get_state(&ServiceId::Tmux).unwrap(),
        ServiceState::Starting
    );
}

#[test]
fn test_start_claude_without_tmux_fails() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let result = launcher.start_service(ServiceId::ClaudeCode);
    match result {
        Err(LaunchError::DependencyNotMet { missing }) => {
            assert!(missing.contains(&ServiceId::Tmux));
        }
        other => panic!("Expected DependencyNotMet, got {:?}", other),
    }
}

#[test]
fn test_start_dashboard_without_file_watcher_fails() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let result = launcher.start_service(ServiceId::Dashboard);
    match result {
        Err(LaunchError::DependencyNotMet { missing }) => {
            assert!(
                missing.contains(&ServiceId::FileWatcher)
                    || missing.contains(&ServiceId::Tmux),
                "Expected FileWatcher or Tmux in missing deps, got {:?}",
                missing
            );
        }
        other => panic!("Expected DependencyNotMet, got {:?}", other),
    }
}

#[test]
fn test_start_service_with_online_deps_succeeds() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    launcher.set_state(ServiceId::Tmux, ServiceState::Online);
    let result = launcher.start_service(ServiceId::ClaudeCode);
    assert!(result.is_ok());
    assert_eq!(
        *launcher.get_state(&ServiceId::ClaudeCode).unwrap(),
        ServiceState::Starting
    );
}

#[test]
fn test_start_all_returns_ordered_results() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let results = launcher.start_all();
    assert!(!results.is_empty());
    assert_eq!(results[0].0, ServiceId::Tmux);
}

#[test]
fn test_start_all_stops_on_first_failure() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    // Set Tmux to Failed so it cannot be started (already in a Failed state;
    // start_service should handle this via dependency check cascade)
    // Actually, start_all calls start_service for each in order.
    // Tmux has no deps so it transitions to Starting. Then ClaudeCode checks
    // Tmux is Starting (not Online), so it fails with DependencyNotMet.
    // This means start_all stops at ClaudeCode and remaining services stay Offline.
    let results = launcher.start_all();

    // Tmux should succeed (no deps)
    assert!(results[0].1.is_ok());
    assert_eq!(results[0].0, ServiceId::Tmux);

    // Next service (ClaudeCode or FileWatcher) should fail because Tmux is Starting, not Online
    // After the first failure, remaining services should not be attempted
    let failed_count = results.iter().filter(|(_, r)| r.is_err()).count();
    assert!(
        failed_count >= 1,
        "Expected at least one failure since Tmux is only Starting, not Online"
    );

    // Services after the first failure should not appear in results
    // (start_all stops on first failure)
    let total_attempted = results.len();
    assert!(
        total_attempted < 7,
        "Expected fewer than 7 results since start_all stops on first failure, got {}",
        total_attempted
    );
}

#[test]
fn test_get_state_returns_current_state() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    assert_eq!(
        *launcher.get_state(&ServiceId::Tmux).unwrap(),
        ServiceState::Offline
    );
    launcher.start_service(ServiceId::Tmux).unwrap();
    assert_eq!(
        *launcher.get_state(&ServiceId::Tmux).unwrap(),
        ServiceState::Starting
    );
}

#[test]
fn test_get_all_states_returns_all_seven() {
    let launcher = ServiceLauncher::new_without_emitter();
    let states = launcher.get_all_states();
    assert_eq!(states.len(), 7);
}

#[test]
fn test_cannot_start_already_online_service() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    launcher.set_state(ServiceId::Tmux, ServiceState::Online);
    let result = launcher.start_service(ServiceId::Tmux);
    match result {
        Err(LaunchError::AlreadyRunning) => {}
        other => panic!("Expected AlreadyRunning, got {:?}", other),
    }
}
