//! Service launcher with dependency-checked startup and state management.
//!
//! The `ServiceLauncher` manages the lifecycle state of all 7 GSD-OS services.
//! It enforces dependency ordering: a service cannot start unless all its
//! dependencies are Online. State transitions emit IPC events via the
//! `ServiceEventEmitter` trait.

use std::collections::HashMap;

use super::registry;
use super::types::*;

/// Trait for emitting service lifecycle events via IPC.
///
/// Implementors handle the actual event emission (e.g., Tauri AppHandle).
/// In tests, a no-op or mock implementation can be used.
pub trait ServiceEventEmitter: Send + Sync {
    fn emit_state_change(
        &self,
        service_id: &ServiceId,
        from: &ServiceState,
        to: &ServiceState,
    );
    fn emit_starting(&self, service_id: &ServiceId, deps_met: &[ServiceId]);
    fn emit_command_result(
        &self,
        service_id: &ServiceId,
        command: &str,
        result: &str,
        detail: Option<&str>,
    );
    fn emit_failed(
        &self,
        service_id: &ServiceId,
        error: &str,
        restart_available: bool,
    );
}

/// Manages service lifecycle state with dependency-checked startup.
pub struct ServiceLauncher {
    registry: Vec<ServiceDef>,
    states: HashMap<ServiceId, ServiceState>,
    emitter: Option<Box<dyn ServiceEventEmitter + Send + Sync>>,
}

impl ServiceLauncher {
    /// Create a new launcher with an IPC event emitter.
    pub fn new(emitter: Box<dyn ServiceEventEmitter + Send + Sync>) -> Self {
        let graph = registry::service_graph();
        let states = graph
            .iter()
            .map(|def| (def.id, ServiceState::Offline))
            .collect();
        Self {
            registry: graph,
            states,
            emitter: Some(emitter),
        }
    }

    /// Create a new launcher without an IPC emitter (for tests).
    pub fn new_without_emitter() -> Self {
        let graph = registry::service_graph();
        let states = graph
            .iter()
            .map(|def| (def.id, ServiceState::Offline))
            .collect();
        Self {
            registry: graph,
            states,
            emitter: None,
        }
    }

    /// Start a single service after verifying all dependencies are Online.
    ///
    /// Returns `AlreadyRunning` if service is Online, `DependencyNotMet` if
    /// any dependency is not Online, or `Ok(())` on successful transition
    /// to Starting state.
    pub fn start_service(&mut self, id: ServiceId) -> Result<(), LaunchError> {
        // Check if service exists
        let def = self
            .find_service_def(&id)
            .ok_or_else(|| LaunchError::NotFound(id.to_string()))?
            .clone();

        // Check if already online
        if let Some(ServiceState::Online) = self.states.get(&id) {
            return Err(LaunchError::AlreadyRunning);
        }

        // Check all dependencies are Online
        let mut missing = Vec::new();
        for dep_id in &def.depends_on {
            match self.states.get(dep_id) {
                Some(ServiceState::Online) => {} // Good
                Some(ServiceState::Failed(err)) => {
                    return Err(LaunchError::DependencyFailed {
                        service: *dep_id,
                        error: err.clone(),
                    });
                }
                _ => {
                    missing.push(*dep_id);
                }
            }
        }

        if !missing.is_empty() {
            return Err(LaunchError::DependencyNotMet { missing });
        }

        // Transition to Starting
        let old_state = self.states.get(&id).cloned().unwrap_or(ServiceState::Offline);
        self.states.insert(id, ServiceState::Starting);

        // Emit events
        if let Some(ref emitter) = self.emitter {
            emitter.emit_state_change(&id, &old_state, &ServiceState::Starting);
            let deps_met: Vec<ServiceId> = def.depends_on.clone();
            emitter.emit_starting(&id, &deps_met);
        }

        Ok(())
    }

    /// Start all services in topological order.
    ///
    /// Stops on the first failure -- remaining services stay Offline.
    /// Returns a vector of (ServiceId, Result) in execution order.
    pub fn start_all(&mut self) -> Vec<(ServiceId, Result<(), LaunchError>)> {
        let order = registry::topological_order();
        let mut results = Vec::new();

        for id in order {
            let result = self.start_service(id);
            let is_err = result.is_err();
            results.push((id, result));
            if is_err {
                break;
            }
        }

        results
    }

    /// Get the current state of a specific service.
    pub fn get_state(&self, id: &ServiceId) -> Option<&ServiceState> {
        self.states.get(id)
    }

    /// Get the current states of all services.
    pub fn get_all_states(&self) -> &HashMap<ServiceId, ServiceState> {
        &self.states
    }

    /// Update the state of a service (used by health monitor).
    ///
    /// Emits a state change event if an emitter is configured.
    pub fn set_state(&mut self, id: ServiceId, new_state: ServiceState) {
        if let Some(old_state) = self.states.get(&id).cloned() {
            if let Some(ref emitter) = self.emitter {
                emitter.emit_state_change(&id, &old_state, &new_state);
            }
        }
        self.states.insert(id, new_state);
    }

    /// Restart a service: reset to Offline and re-start with dependency check.
    pub fn restart_service(&mut self, id: ServiceId) -> Result<(), LaunchError> {
        self.set_state(id, ServiceState::Offline);
        self.start_service(id)
    }

    /// Get a reference to the service registry.
    pub fn registry(&self) -> &[ServiceDef] {
        &self.registry
    }

    /// Find a service definition by ID.
    fn find_service_def(&self, id: &ServiceId) -> Option<&ServiceDef> {
        self.registry.iter().find(|def| &def.id == id)
    }
}
