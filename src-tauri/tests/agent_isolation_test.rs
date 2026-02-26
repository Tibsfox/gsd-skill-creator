//! Integration tests for AgentIsolationManager (Phase 371).
//!
//! These tests require a real git repository because `create_agent` calls
//! `git worktree add` under the hood. Each test creates a temp directory,
//! initialises a git repo with an empty commit, and passes it to the manager.

use std::path::PathBuf;

use gsd_os_lib::security::agent_isolation::{AgentIsolationManager, WorktreeHookPayload};
use gsd_os_lib::security::types::{AgentType, EventSource};

/// Create a temporary git repository suitable for worktree operations.
fn make_test_project() -> (tempfile::TempDir, PathBuf) {
    let dir = tempfile::tempdir().unwrap();
    std::process::Command::new("git")
        .args(["init"])
        .current_dir(dir.path())
        .output()
        .expect("git init failed");
    std::process::Command::new("git")
        .args(["commit", "--allow-empty", "-m", "init"])
        .current_dir(dir.path())
        .output()
        .expect("git commit failed");
    let path = dir.path().to_path_buf();
    (dir, path)
}

#[tokio::test]
async fn test_create_exec_agent() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let agent = manager.create_agent(AgentType::Exec).await.unwrap();

    assert_eq!(agent.id, "exec-001");
    assert!(agent.worktree_path.exists(), "worktree dir must exist on filesystem");
}

#[tokio::test]
async fn test_worktree_has_planning_subtree() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let agent = manager.create_agent(AgentType::Exec).await.unwrap();

    let planning = agent.worktree_path.join(".planning");
    assert!(planning.join("inbox").is_dir(), ".planning/inbox/ must exist");
    assert!(planning.join("outbox").is_dir(), ".planning/outbox/ must exist");
    assert!(planning.join("observations").is_dir(), ".planning/observations/ must exist");
}

#[tokio::test]
async fn test_sandbox_scoped_to_worktree() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let agent = manager.create_agent(AgentType::Exec).await.unwrap();

    let wt_str = agent.worktree_path.to_string_lossy().to_string();
    assert_eq!(
        agent.sandbox_profile.worktree_path,
        Some(wt_str.clone()),
        "sandbox profile worktree_path must match agent worktree"
    );
    assert!(
        agent.sandbox_profile.filesystem.write_dirs.contains(&wt_str),
        "write_dirs must contain the worktree path"
    );
    // Non-INTEG agents should only write to their own worktree
    assert_eq!(
        agent.sandbox_profile.filesystem.write_dirs.len(),
        1,
        "exec agent should only have one write dir"
    );
}

#[tokio::test]
async fn test_integ_reads_all_worktrees() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    // Create two agents first
    let _exec = manager.create_agent(AgentType::Exec).await.unwrap();
    let _verify = manager.create_agent(AgentType::Verify).await.unwrap();

    // INTEG agent (AgentType::Main used as integration role)
    let integ = manager.create_agent(AgentType::Main).await.unwrap();

    // INTEG profile should include project root in write_dirs
    let root_str = root.to_string_lossy().to_string();
    assert!(
        integ.sandbox_profile.filesystem.write_dirs.contains(&root_str),
        "INTEG profile write_dirs must include project root"
    );

    // INTEG deny_read should NOT block agent worktrees
    let exec_wt = root.join(".agents").join("exec-001").to_string_lossy().to_string();
    let verify_wt = root.join(".agents").join("verify-001").to_string_lossy().to_string();
    assert!(
        !integ.sandbox_profile.filesystem.deny_read.contains(&exec_wt),
        "INTEG deny_read must not include exec worktree"
    );
    assert!(
        !integ.sandbox_profile.filesystem.deny_read.contains(&verify_wt),
        "INTEG deny_read must not include verify worktree"
    );
}

#[tokio::test]
async fn test_shared_dir_created() {
    let (_tmp, root) = make_test_project();
    let _manager = AgentIsolationManager::new(root.clone()).unwrap();

    let shared = root.join(".agents").join("shared");
    assert!(shared.join("integration").is_dir(), ".agents/shared/integration/ must exist");
    assert!(shared.join("results").is_dir(), ".agents/shared/results/ must exist");
}

#[tokio::test]
async fn test_agent_id_increments() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let first = manager.create_agent(AgentType::Exec).await.unwrap();
    let second = manager.create_agent(AgentType::Exec).await.unwrap();

    assert_eq!(first.id, "exec-001");
    assert_eq!(second.id, "exec-002");
}

// ============================================================================
// 371-02 tests: destroy_agent, verify_isolation, hooks, SecurityEvent
// ============================================================================

#[tokio::test]
async fn test_destroy_agent_removes_worktree() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let agent = manager.create_agent(AgentType::Exec).await.unwrap();
    let wt = agent.worktree_path.clone();
    assert!(wt.exists(), "worktree must exist before destroy");

    manager.destroy_agent("exec-001").await.unwrap();

    assert!(!wt.exists(), "worktree dir must be removed after destroy");
    assert!(
        manager.get_active_agents().get("exec-001").is_none(),
        "agent must be removed from active_agents"
    );
}

#[tokio::test]
async fn test_destroy_agent_writes_results_to_shared() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let agent = manager.create_agent(AgentType::Exec).await.unwrap();

    // Write a file to the agent's outbox
    let outbox = agent.worktree_path.join(".planning").join("outbox");
    std::fs::write(outbox.join("result.json"), r#"{"status":"done"}"#).unwrap();

    manager.destroy_agent("exec-001").await.unwrap();

    // Check that result was copied to shared/results/exec-001/
    let shared_result = root
        .join(".agents")
        .join("shared")
        .join("results")
        .join("exec-001")
        .join("result.json");
    assert!(
        shared_result.exists(),
        "outbox result.json must be copied to shared/results/exec-001/"
    );
    let content = std::fs::read_to_string(&shared_result).unwrap();
    assert!(content.contains("done"), "copied file must retain content");
}

#[tokio::test]
async fn test_verify_isolation_true_for_exec_verify() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let _exec = manager.create_agent(AgentType::Exec).await.unwrap();
    let _verify = manager.create_agent(AgentType::Verify).await.unwrap();

    let isolated = manager.verify_isolation("exec-001", "verify-001");
    assert!(
        isolated,
        "exec and verify agents must be isolated from each other"
    );
}

#[tokio::test]
async fn test_verify_isolation_false_if_agent_unknown() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let _exec = manager.create_agent(AgentType::Exec).await.unwrap();

    let result = manager.verify_isolation("exec-001", "nonexistent");
    assert!(!result, "verify_isolation must return false for unknown agent");
}

#[tokio::test]
async fn test_worktree_create_hook_generates_profile() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    // Create the worktree directory manually to simulate hook scenario
    let hook_wt = root.join(".agents").join("exec-002");
    std::fs::create_dir_all(&hook_wt).unwrap();

    let payload = WorktreeHookPayload {
        hook: "WorktreeCreate".to_string(),
        worktree_path: hook_wt.to_string_lossy().to_string(),
        agent_id: "exec-002".to_string(),
        agent_type: "exec".to_string(),
    };

    manager.handle_worktree_hook(payload).unwrap();

    let profile_path = hook_wt.join(".sandbox-profile.json");
    assert!(
        profile_path.exists(),
        ".sandbox-profile.json must be written by WorktreeCreate hook"
    );

    let content = std::fs::read_to_string(&profile_path).unwrap();
    let profile: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert_eq!(
        profile["worktree_path"].as_str().unwrap(),
        hook_wt.to_string_lossy().as_ref(),
        "profile worktree_path must match hook worktree"
    );
}

#[tokio::test]
async fn test_security_event_emitted_on_create() {
    let (_tmp, root) = make_test_project();
    let mut manager = AgentIsolationManager::new(root.clone()).unwrap();

    let _agent = manager.create_agent(AgentType::Exec).await.unwrap();

    let events = manager.get_events();
    assert!(!events.is_empty(), "at least one event must be recorded");

    let create_event = events
        .iter()
        .find(|e| e.event_type == "agent_created")
        .expect("must have agent_created event");

    assert_eq!(create_event.source, EventSource::AgentIsolation);
    assert_eq!(
        create_event.detail["agent_id"].as_str().unwrap(),
        "exec-001"
    );
}
