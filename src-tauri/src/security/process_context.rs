//! ProcessContext — Rust analogue of the TypeScript Tier-E child-process
//! chokepoint (`src/security/process-context.ts`, v1.49.806).
//!
//! Every `Command::new` / `CommandBuilder::new` site in `src-tauri/src`
//! calls [`ensure_process_allowed`] BEFORE starting the child process. The
//! gate consults an optional process-wide [`ProcessPolicy`]:
//!
//!   - **No policy installed (default)** — legacy permissive mode; the gate
//!     returns `Ok(())` without auditing. This mirrors the TS chokepoint's
//!     optional-`ctx` semantics: enforcement is opt-in, existing behavior is
//!     unchanged until a policy is installed.
//!   - **Policy installed** — the target executable is matched against the
//!     policy's allow-list, one [`ProcessAuditRecord`] is emitted per attempt
//!     (allowed or denied), and a denied attempt returns
//!     [`ProcessContextDenied`] so the spawn never happens.
//!
//! Denial-propagation discipline (Rust variant of #10427): call sites with a
//! `Result` error channel propagate the denial as an error. Detector-shaped
//! sites (`Option`/`bool` returns such as `detect_tmux`, `has_session`) treat
//! denial as fail-closed unavailability — the binary is not available TO US —
//! and the audit record carries the denial signal. The record, not the return
//! value, is the load-bearing security telemetry at those sites.
//!
//! The matching pure core is [`evaluate`]; [`ensure_process_allowed`] is the
//! thin wrapper over the process-wide `OnceLock` policy. Unit tests exercise
//! `evaluate` with explicit policies; exactly ONE test owns the global
//! lifecycle because the `OnceLock` is process-wide and cargo runs tests in
//! parallel threads.
//!
//! Drift-guard: `src/security/process-context-rust-audit.test.ts` (default
//! vitest project → pre-tag-gate + every CI leg) pins the spawner-file roster
//! and requires one `ensure_process_allowed` call per spawn site.

use std::sync::{Arc, Mutex, OnceLock};
use std::time::SystemTime;

/// Spawn variant being gated. Rust's three child-process entry points.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProcessOp {
    /// `Command::spawn` (also covers portable-pty `spawn_command`).
    Spawn,
    /// `Command::output`.
    Output,
    /// `Command::status`.
    Status,
}

impl std::fmt::Display for ProcessOp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            ProcessOp::Spawn => "spawn",
            ProcessOp::Output => "output",
            ProcessOp::Status => "status",
        };
        f.write_str(s)
    }
}

/// A single allow-list entry for child-process executables.
///
/// Matching runs against the EXECUTABLE (first argument to `Command::new`),
/// not the full command line — argument vetting stays the caller's job; the
/// audit record carries argv for downstream telemetry.
#[derive(Debug, Clone)]
pub enum CommandPattern {
    /// Matches when `target == value` exactly (e.g. `"tmux"`).
    Exact(String),
    /// Matches when `target` starts with `value` (e.g. `"/usr/local/bin/"`).
    Prefix(String),
    /// Matches every target. Used by [`permissive_process_policy`] for
    /// audit-only rollout.
    Any,
}

impl CommandPattern {
    fn matches(&self, target: &str) -> bool {
        match self {
            CommandPattern::Exact(v) => target == v,
            CommandPattern::Prefix(v) => target.starts_with(v.as_str()),
            CommandPattern::Any => true,
        }
    }
}

/// Return true when `target` matches any pattern in `allow_list`.
pub fn matches_command_allow_list(allow_list: &[CommandPattern], target: &str) -> bool {
    allow_list.iter().any(|p| p.matches(target))
}

/// One row of audit output emitted per gated spawn attempt.
#[derive(Debug, Clone)]
pub struct ProcessAuditRecord {
    /// Caller identifier, `module/function` (e.g. `tmux/list_sessions`).
    pub source: String,
    /// Spawn variant being attempted.
    pub op: ProcessOp,
    /// Executable about to be started.
    pub target: String,
    /// Argument vector passed alongside `target`.
    pub argv: Vec<String>,
    /// Whether the allow-list admitted the attempt.
    pub allowed: bool,
    /// Time the record was emitted.
    pub timestamp: SystemTime,
}

/// Pluggable observation sink. Must be `Send + Sync` — the policy holding it
/// is process-wide and gate calls arrive from tokio workers and std threads.
pub trait ProcessAuditSink: Send + Sync {
    fn record(&self, entry: &ProcessAuditRecord);
}

/// Capturing sink — collects records in memory behind an `Arc`, so clones
/// share one buffer (install a clone, keep the original to read). Tests and
/// short-lived diagnostics only.
#[derive(Clone, Default)]
pub struct CapturingProcessAuditSink {
    records: Arc<Mutex<Vec<ProcessAuditRecord>>>,
}

impl CapturingProcessAuditSink {
    pub fn new() -> Self {
        Self::default()
    }

    /// Snapshot of all records captured so far.
    pub fn records(&self) -> Vec<ProcessAuditRecord> {
        self.records.lock().expect("capturing sink poisoned").clone()
    }
}

impl ProcessAuditSink for CapturingProcessAuditSink {
    fn record(&self, entry: &ProcessAuditRecord) {
        self.records
            .lock()
            .expect("capturing sink poisoned")
            .push(entry.clone());
    }
}

/// The chokepoint policy: allow-list + audit sink.
pub struct ProcessPolicy {
    /// Allow-list of executable patterns. Empty list = deny all.
    pub allow_list: Vec<CommandPattern>,
    /// Sink receiving one record per gated attempt. `None` = no audit output.
    pub audit: Option<Box<dyn ProcessAuditSink>>,
}

impl std::fmt::Debug for ProcessPolicy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProcessPolicy")
            .field("allow_list", &self.allow_list)
            .field("audit", &self.audit.is_some())
            .finish()
    }
}

/// Build a permissive policy (admits every target) that still emits audit
/// records — the incremental-rollout / observability mode.
pub fn permissive_process_policy(sink: Box<dyn ProcessAuditSink>) -> ProcessPolicy {
    ProcessPolicy {
        allow_list: vec![CommandPattern::Any],
        audit: Some(sink),
    }
}

/// Error returned when a spawn attempt is rejected by the policy allow-list.
///
/// `caller` is the TS chokepoint's `source` field — renamed here because
/// thiserror reserves a field named `source` for the error-source chain.
#[derive(Debug, thiserror::Error)]
#[error("ProcessContext denied {op} of {target} (source: {caller})")]
pub struct ProcessContextDenied {
    pub caller: String,
    pub op: ProcessOp,
    pub target: String,
    pub argv: Vec<String>,
}

/// Pure gate core: check `target` against an explicit (optional) policy.
///
///   - `None` policy → `Ok(())`, no audit (legacy permissive mode).
///   - `Some` policy → allow-list check + one audit record per attempt;
///     denied attempts return [`ProcessContextDenied`].
pub fn evaluate(
    policy: Option<&ProcessPolicy>,
    source: &str,
    op: ProcessOp,
    target: &str,
    argv: &[&str],
) -> Result<(), ProcessContextDenied> {
    let Some(policy) = policy else {
        return Ok(());
    };
    let allowed = matches_command_allow_list(&policy.allow_list, target);
    if let Some(sink) = &policy.audit {
        sink.record(&ProcessAuditRecord {
            source: source.to_string(),
            op,
            target: target.to_string(),
            argv: argv.iter().map(|a| a.to_string()).collect(),
            allowed,
            timestamp: SystemTime::now(),
        });
    }
    if allowed {
        Ok(())
    } else {
        Err(ProcessContextDenied {
            caller: source.to_string(),
            op,
            target: target.to_string(),
            argv: argv.iter().map(|a| a.to_string()).collect(),
        })
    }
}

static PROCESS_POLICY: OnceLock<ProcessPolicy> = OnceLock::new();

/// Install the process-wide policy. One-shot (`OnceLock` semantics): returns
/// the rejected policy as `Err` when one is already installed. Nothing in the
/// app installs a policy today — call sites run in legacy permissive mode
/// until a startup hook opts in.
pub fn install_process_policy(policy: ProcessPolicy) -> Result<(), ProcessPolicy> {
    PROCESS_POLICY.set(policy)
}

/// Gate a child-process start through the process-wide policy. Call BEFORE
/// every `Command::new(..)` spawn/output/status (and portable-pty
/// `spawn_command`), with `source` as `module/function`.
pub fn ensure_process_allowed(
    source: &str,
    op: ProcessOp,
    target: &str,
    argv: &[&str],
) -> Result<(), ProcessContextDenied> {
    evaluate(PROCESS_POLICY.get(), source, op, target, argv)
}
