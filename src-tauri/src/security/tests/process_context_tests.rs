//! Unit tests for the ProcessContext chokepoint (Rust analogue of the TS
//! Tier-E chokepoint, `src/security/process-context.ts`).
//!
//! `evaluate` (the pure core) is tested with explicit policies. The
//! process-wide `OnceLock` policy is exercised by exactly ONE test
//! (`global_policy_lifecycle`) because cargo runs tests as parallel threads
//! in one process — that test installs a PERMISSIVE policy only, so wired
//! call sites in other tests can never be denied by it.

use crate::security::process_context::{
    ensure_process_allowed, evaluate, install_process_policy, matches_command_allow_list,
    permissive_process_policy, CapturingProcessAuditSink, CommandPattern, ProcessOp,
    ProcessPolicy,
};

fn deny_all() -> ProcessPolicy {
    ProcessPolicy {
        allow_list: vec![],
        audit: None,
    }
}

#[test]
fn no_policy_is_legacy_permissive() {
    assert!(evaluate(None, "tests/no_policy", ProcessOp::Spawn, "anything", &[]).is_ok());
}

#[test]
fn exact_pattern_admits_and_rejects() {
    let policy = ProcessPolicy {
        allow_list: vec![CommandPattern::Exact("tmux".to_string())],
        audit: None,
    };
    assert!(evaluate(Some(&policy), "tests/exact", ProcessOp::Output, "tmux", &[]).is_ok());
    assert!(evaluate(Some(&policy), "tests/exact", ProcessOp::Output, "tmux2", &[]).is_err());
    assert!(evaluate(Some(&policy), "tests/exact", ProcessOp::Output, "sh", &[]).is_err());
}

#[test]
fn prefix_pattern_matches_path_prefixes() {
    let policy = ProcessPolicy {
        allow_list: vec![CommandPattern::Prefix("/usr/local/bin/".to_string())],
        audit: None,
    };
    assert!(evaluate(
        Some(&policy),
        "tests/prefix",
        ProcessOp::Spawn,
        "/usr/local/bin/node",
        &[]
    )
    .is_ok());
    assert!(
        evaluate(Some(&policy), "tests/prefix", ProcessOp::Spawn, "/usr/bin/node", &[]).is_err()
    );
}

#[test]
fn empty_allow_list_denies_all() {
    let policy = deny_all();
    let err = evaluate(
        Some(&policy),
        "tests/deny_all",
        ProcessOp::Status,
        "kill",
        &["-0", "1234"],
    )
    .expect_err("empty allow-list must deny");
    assert_eq!(err.caller, "tests/deny_all");
    assert_eq!(err.op, ProcessOp::Status);
    assert_eq!(err.target, "kill");
    assert_eq!(err.argv, vec!["-0".to_string(), "1234".to_string()]);
    let msg = err.to_string();
    assert!(
        msg.contains("denied status of kill"),
        "denial display should name op + target, got: {msg}"
    );
}

#[test]
fn audit_records_one_row_per_attempt_allowed_and_denied() {
    let sink = CapturingProcessAuditSink::new();
    let policy = ProcessPolicy {
        allow_list: vec![CommandPattern::Exact("git".to_string())],
        audit: Some(Box::new(sink.clone())),
    };
    evaluate(
        Some(&policy),
        "tests/audit",
        ProcessOp::Output,
        "git",
        &["status"],
    )
    .expect("git is allow-listed");
    let _ = evaluate(Some(&policy), "tests/audit", ProcessOp::Spawn, "curl", &["evil"]);

    let records = sink.records();
    assert_eq!(records.len(), 2, "one record per attempt, allowed or denied");
    assert!(records[0].allowed);
    assert_eq!(records[0].target, "git");
    assert_eq!(records[0].argv, vec!["status".to_string()]);
    assert!(!records[1].allowed);
    assert_eq!(records[1].target, "curl");
    assert_eq!(records[1].op, ProcessOp::Spawn);
}

#[test]
fn allow_list_matcher_handles_all_pattern_kinds() {
    let list = vec![
        CommandPattern::Exact("tmux".to_string()),
        CommandPattern::Prefix("/opt/tools/".to_string()),
    ];
    assert!(matches_command_allow_list(&list, "tmux"));
    assert!(matches_command_allow_list(&list, "/opt/tools/fmt"));
    assert!(!matches_command_allow_list(&list, "bash"));
    assert!(matches_command_allow_list(&[CommandPattern::Any], "bash"));
}

/// The ONE test that touches the process-wide policy. Installs a PERMISSIVE
/// (Any) policy so concurrently running tests that pass through wired spawn
/// sites can never be denied; assertions filter the shared sink by this
/// test's unique probe target.
#[test]
fn global_policy_lifecycle() {
    const PROBE: &str = "process-context-lifecycle-probe";

    // Before install: legacy permissive (OnceLock unset at minimum for this
    // call — other tests never install).
    assert!(ensure_process_allowed("tests/lifecycle", ProcessOp::Spawn, PROBE, &[]).is_ok());

    let sink = CapturingProcessAuditSink::new();
    install_process_policy(permissive_process_policy(Box::new(sink.clone())))
        .expect("first install must succeed");

    // After install: still admitted (Any), but now audited.
    assert!(
        ensure_process_allowed("tests/lifecycle", ProcessOp::Output, PROBE, &["--x"]).is_ok()
    );
    let probe_records: Vec<_> = sink
        .records()
        .into_iter()
        .filter(|r| r.target == PROBE)
        .collect();
    assert_eq!(probe_records.len(), 1);
    assert!(probe_records[0].allowed);
    assert_eq!(probe_records[0].source, "tests/lifecycle");

    // Second install is rejected (OnceLock one-shot).
    assert!(install_process_policy(permissive_process_policy(Box::new(sink))).is_err());
}
