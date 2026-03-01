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

/// v1.49.7 (PR #24 @PatrickRobotham): Tmux is optional, so starting Claude
/// when Tmux is Offline succeeds — the optional dependency is skipped.
#[test]
fn test_start_claude_without_tmux_succeeds_because_tmux_optional() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let result = launcher.start_service(ServiceId::ClaudeCode);
    assert!(
        result.is_ok(),
        "Claude should start even without Tmux because Tmux is optional, got {:?}",
        result
    );
    assert_eq!(
        *launcher.get_state(&ServiceId::ClaudeCode).unwrap(),
        ServiceState::Starting
    );
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

/// v1.49.7: FileWatcher has no deps and sorts before Tmux alphabetically,
/// so it's the first service in topological order.
#[test]
fn test_start_all_returns_ordered_results() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let results = launcher.start_all();
    assert!(!results.is_empty());
    assert_eq!(results[0].0, ServiceId::FileWatcher);
}

/// v1.49.7: start_all proceeds past optional service failures (Tmux) but
/// still stops on mandatory service failures. FileWatcher and Tmux are roots.
/// FileWatcher starts (Starting), Tmux starts (Starting, optional). Then
/// downstream non-optional services fail because their deps are Starting not Online.
#[test]
fn test_start_all_stops_on_first_mandatory_failure() {
    let mut launcher = ServiceLauncher::new_without_emitter();
    let results = launcher.start_all();

    // FileWatcher should succeed (no deps, first alphabetically)
    assert!(results[0].1.is_ok());
    assert_eq!(results[0].0, ServiceId::FileWatcher);

    // Tmux should succeed (no deps)
    assert!(results[1].1.is_ok());
    assert_eq!(results[1].0, ServiceId::Tmux);

    // At least one downstream service should fail because its deps are Starting, not Online
    let failed_count = results.iter().filter(|(_, r)| r.is_err()).count();
    assert!(
        failed_count >= 1,
        "Expected at least one failure since root services are only Starting, not Online"
    );

    // start_all stops on first non-optional failure, so fewer than 7 results
    let total_attempted = results.len();
    assert!(
        total_attempted < 7,
        "Expected fewer than 7 results since start_all stops on first non-optional failure, got {}",
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
