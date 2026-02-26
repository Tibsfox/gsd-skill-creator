//! Service registry and dependency graph for GSD-OS services.
//!
//! Defines the 7 managed services, their dependency edges, health check
//! types, and start commands. Provides topological ordering via Kahn's
//! algorithm for dependency-ordered startup.

use std::collections::{HashMap, HashSet, VecDeque};

use super::types::*;

/// Return the complete service graph with all 7 GSD-OS services.
///
/// Services and their dependencies:
/// - Tmux: (root, no deps)
/// - ClaudeCode: depends on Tmux
/// - FileWatcher: depends on Tmux
/// - Dashboard: depends on FileWatcher
/// - Console: depends on FileWatcher
/// - Staging: depends on Dashboard, Console
/// - Terminal: depends on Staging
pub fn service_graph() -> Vec<ServiceDef> {
    vec![
        ServiceDef {
            id: ServiceId::Tmux,
            name: "Tmux",
            depends_on: vec![],
            health_check: HealthCheckType::TmuxSession("gsd".to_string()),
            start_command: Some(StartCommand::Shell(
                "tmux new-session -d -s gsd".to_string(),
            )),
            led_position: 0,
        },
        ServiceDef {
            id: ServiceId::ClaudeCode,
            name: "Claude Code",
            depends_on: vec![ServiceId::Tmux],
            health_check: HealthCheckType::ProcessRunning("claude".to_string()),
            start_command: None, // User-guided
            led_position: 1,
        },
        ServiceDef {
            id: ServiceId::FileWatcher,
            name: "File Watcher",
            depends_on: vec![ServiceId::Tmux],
            health_check: HealthCheckType::DirectoryWatch(".planning".into()),
            start_command: Some(StartCommand::Internal),
            led_position: 2,
        },
        ServiceDef {
            id: ServiceId::Dashboard,
            name: "Dashboard",
            depends_on: vec![ServiceId::FileWatcher],
            health_check: HealthCheckType::HttpEndpoint(
                "http://localhost:3000/health".to_string(),
            ),
            start_command: Some(StartCommand::Internal),
            led_position: 3,
        },
        ServiceDef {
            id: ServiceId::Console,
            name: "Console",
            depends_on: vec![ServiceId::FileWatcher],
            health_check: HealthCheckType::FileExists(
                ".planning/console/inbox/pending".into(),
            ),
            start_command: Some(StartCommand::Internal),
            led_position: 4,
        },
        ServiceDef {
            id: ServiceId::Staging,
            name: "Staging",
            depends_on: vec![ServiceId::Dashboard, ServiceId::Console],
            health_check: HealthCheckType::DirectoryWatch(
                ".planning/staging/intake".into(),
            ),
            start_command: Some(StartCommand::Internal),
            led_position: 5,
        },
        ServiceDef {
            id: ServiceId::Terminal,
            name: "Terminal",
            depends_on: vec![ServiceId::Staging],
            health_check: HealthCheckType::ProcessRunning(
                "gsd-terminal".to_string(),
            ),
            start_command: Some(StartCommand::Internal),
            led_position: 6,
        },
    ]
}

/// Compute the topological startup order using Kahn's algorithm (BFS).
///
/// Returns services in dependency-first order: services with no dependencies
/// come first, services depending on those come next, and so on.
///
/// Panics if a cycle is detected (should never happen with our static graph).
pub fn topological_order() -> Vec<ServiceId> {
    let graph = service_graph();

    // Build adjacency and in-degree maps
    let mut in_degree: HashMap<ServiceId, usize> = HashMap::new();
    let mut dependents: HashMap<ServiceId, Vec<ServiceId>> = HashMap::new();

    for def in &graph {
        in_degree.entry(def.id).or_insert(0);
        for dep in &def.depends_on {
            dependents.entry(*dep).or_default().push(def.id);
            *in_degree.entry(def.id).or_insert(0) += 1;
        }
    }

    // Initialize queue with zero in-degree nodes
    let mut queue: VecDeque<ServiceId> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| *id)
        .collect();

    // Sort the initial queue for deterministic output (Tmux should be first)
    let mut initial: Vec<ServiceId> = queue.drain(..).collect();
    initial.sort_by_key(|id| id.as_str().to_string());
    queue.extend(initial);

    let mut order = Vec::with_capacity(graph.len());

    while let Some(current) = queue.pop_front() {
        order.push(current);

        if let Some(deps) = dependents.get(&current) {
            let mut next_batch: Vec<ServiceId> = Vec::new();
            for &dependent in deps {
                let deg = in_degree.get_mut(&dependent).unwrap();
                *deg -= 1;
                if *deg == 0 {
                    next_batch.push(dependent);
                }
            }
            // Sort for deterministic output within same level
            next_batch.sort_by_key(|id| id.as_str().to_string());
            queue.extend(next_batch);
        }
    }

    if order.len() != graph.len() {
        panic!(
            "Cycle detected in service dependency graph! Only {} of {} services ordered.",
            order.len(),
            graph.len()
        );
    }

    order
}

/// Validate the dependency graph for structural integrity.
///
/// Checks for:
/// - No self-loops
/// - All dependency IDs exist in the graph
/// - No cycles (uses topological sort)
pub fn validate_dependencies(graph: &[ServiceDef]) -> Result<(), String> {
    let known_ids: HashSet<ServiceId> = graph.iter().map(|s| s.id).collect();

    for def in graph {
        // No self-loops
        if def.depends_on.contains(&def.id) {
            return Err(format!(
                "Service {:?} has a self-dependency",
                def.id
            ));
        }

        // All deps exist
        for dep in &def.depends_on {
            if !known_ids.contains(dep) {
                return Err(format!(
                    "Service {:?} depends on unknown service {:?}",
                    def.id, dep
                ));
            }
        }
    }

    // Check for cycles using in-degree counting
    let mut in_degree: HashMap<ServiceId, usize> = HashMap::new();
    let mut dependents: HashMap<ServiceId, Vec<ServiceId>> = HashMap::new();

    for def in graph {
        in_degree.entry(def.id).or_insert(0);
        for dep in &def.depends_on {
            dependents.entry(*dep).or_default().push(def.id);
            *in_degree.entry(def.id).or_insert(0) += 1;
        }
    }

    let mut queue: VecDeque<ServiceId> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| *id)
        .collect();

    let mut sorted_count = 0;
    while let Some(current) = queue.pop_front() {
        sorted_count += 1;
        if let Some(deps) = dependents.get(&current) {
            for &dependent in deps {
                let deg = in_degree.get_mut(&dependent).unwrap();
                *deg -= 1;
                if *deg == 0 {
                    queue.push_back(dependent);
                }
            }
        }
    }

    if sorted_count != graph.len() {
        return Err(format!(
            "Cycle detected: only {} of {} services can be ordered",
            sorted_count,
            graph.len()
        ));
    }

    Ok(())
}
