//! Integration tests for AgentIsolationManager (Phase 371).
//!
//! These tests require a real git repository because `create_agent` calls
//! `git worktree add` under the hood. Each test creates a temp directory,
//! initialises a git repo with an empty commit, and passes it to the manager.

use std::path::PathBuf;

use gsd_os_lib::security::agent_isolation::{AgentIsolationManager, IsolationError};
use gsd_os_lib::security::types::AgentType;

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
