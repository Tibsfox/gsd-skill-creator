use crate::services::types::*;
use crate::services::registry::*;
use std::collections::HashSet;

#[test]
fn test_service_graph_has_seven_services() {
    let graph = service_graph();
    assert_eq!(graph.len(), 7);
}

#[test]
fn test_service_ids_are_all_present() {
    let graph = service_graph();
    let ids: HashSet<ServiceId> = graph.iter().map(|s| s.id).collect();
    assert!(ids.contains(&ServiceId::Tmux));
    assert!(ids.contains(&ServiceId::ClaudeCode));
    assert!(ids.contains(&ServiceId::FileWatcher));
    assert!(ids.contains(&ServiceId::Dashboard));
    assert!(ids.contains(&ServiceId::Console));
    assert!(ids.contains(&ServiceId::Staging));
    assert!(ids.contains(&ServiceId::Terminal));
}

#[test]
fn test_tmux_has_no_dependencies() {
    let graph = service_graph();
    let tmux = graph.iter().find(|s| s.id == ServiceId::Tmux).unwrap();
    assert!(tmux.depends_on.is_empty());
}

#[test]
fn test_claude_depends_on_tmux() {
    let graph = service_graph();
    let claude = graph.iter().find(|s| s.id == ServiceId::ClaudeCode).unwrap();
    assert_eq!(claude.depends_on, vec![ServiceId::Tmux]);
}

#[test]
fn test_file_watcher_depends_on_tmux() {
    let graph = service_graph();
    let fw = graph.iter().find(|s| s.id == ServiceId::FileWatcher).unwrap();
    assert_eq!(fw.depends_on, vec![ServiceId::Tmux]);
}

#[test]
fn test_dashboard_depends_on_file_watcher() {
    let graph = service_graph();
    let dash = graph.iter().find(|s| s.id == ServiceId::Dashboard).unwrap();
    assert_eq!(dash.depends_on, vec![ServiceId::FileWatcher]);
}

#[test]
fn test_console_depends_on_file_watcher() {
    let graph = service_graph();
    let console = graph.iter().find(|s| s.id == ServiceId::Console).unwrap();
    assert_eq!(console.depends_on, vec![ServiceId::FileWatcher]);
}

#[test]
fn test_staging_depends_on_dashboard_and_console() {
    let graph = service_graph();
    let staging = graph.iter().find(|s| s.id == ServiceId::Staging).unwrap();
    let deps: HashSet<&ServiceId> = staging.depends_on.iter().collect();
    assert!(deps.contains(&ServiceId::Dashboard));
    assert!(deps.contains(&ServiceId::Console));
    assert_eq!(staging.depends_on.len(), 2);
}

#[test]
fn test_terminal_depends_on_staging() {
    let graph = service_graph();
    let terminal = graph.iter().find(|s| s.id == ServiceId::Terminal).unwrap();
    assert_eq!(terminal.depends_on, vec![ServiceId::Staging]);
}

#[test]
fn test_topological_order_tmux_first() {
    let order = topological_order();
    assert_eq!(order[0], ServiceId::Tmux);
}

#[test]
fn test_topological_order_terminal_last() {
    let order = topological_order();
    assert_eq!(*order.last().unwrap(), ServiceId::Terminal);
}

#[test]
fn test_topological_order_dependencies_before_dependents() {
    let graph = service_graph();
    let order = topological_order();

    for (idx, id) in order.iter().enumerate() {
        let def = graph.iter().find(|s| &s.id == id).unwrap();
        for dep in &def.depends_on {
            let dep_idx = order.iter().position(|o| o == dep)
                .expect(&format!("dependency {:?} not found in order", dep));
            assert!(
                dep_idx < idx,
                "{:?} (pos {}) has dependency {:?} (pos {}) which should come before it",
                id, idx, dep, dep_idx
            );
        }
    }
}

#[test]
fn test_validate_dependencies_accepts_valid_graph() {
    let graph = service_graph();
    assert!(validate_dependencies(&graph).is_ok());
}

#[test]
fn test_led_positions_unique() {
    let graph = service_graph();
    let positions: HashSet<u8> = graph.iter().map(|s| s.led_position).collect();
    assert_eq!(positions.len(), 7, "All 7 LED positions must be unique");
    for i in 0..7u8 {
        assert!(positions.contains(&i), "LED position {} missing", i);
    }
}

#[test]
fn test_service_names_non_empty() {
    let graph = service_graph();
    for svc in &graph {
        assert!(
            !svc.name.is_empty(),
            "Service {:?} has empty name",
            svc.id
        );
    }
}
