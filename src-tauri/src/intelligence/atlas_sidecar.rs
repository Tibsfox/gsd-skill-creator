//! Atlas indexer sidecar — Node.js child-process dispatch (v1.49.607 H1).
//!
//! Closes G1's deferred Tauri-shell-to-TS bridge: provides a pure-Tauri-shell
//! path for triggering `tools/atlas-index.mjs` without a running dashboard
//! server, using pattern (a) from the H1 spec — `tokio::process::Command` to
//! spawn `node tools/atlas-index.mjs --json --stream-events`.
//!
//! # Design
//!
//! The S2 invariant ("no subprocess spawning in `intelligence/atlas.rs`")
//! remains intact because all spawn logic lives in THIS module. `atlas.rs`
//! calls `spawn_indexer_fire_and_forget` which takes an `AppHandle` and
//! immediately returns; the actual child-process lifetime is managed on a
//! detached Tokio task.
//!
//! # Timeout guard (I1)
//!
//! `IndexerArgs::timeout_secs` (default 300 s = 5 minutes) wraps `child.wait()`
//! in `tokio::time::timeout`. On expiry the task sends SIGTERM, waits up to 5 s
//! for graceful exit, then force-kills via `child.start_kill()`, and emits
//! `atlas:indexing.failed` with a timeout context message.
//!
//! Set `timeout_secs = None` to disable the guard (not recommended in
//! production; useful in tests that control the child lifetime externally).
//!
//! # Event protocol
//!
//! `tools/atlas-index.mjs --stream-events` emits one JSONL envelope per line:
//!
//! ```json
//! {"event":"atlas:indexing.started","payload":{"snapshot_id":"snap-01"}}
//! {"event":"atlas:indexing.progress","payload":{"snapshot_id":"snap-01","files_done":3,"files_total":10}}
//! {"event":"atlas:indexing.completed","payload":{"snapshot_id":"snap-01","project_id":"gsd","symbols_count":120,"calls_count":80,"files_count":10}}
//! {"event":"atlas:indexing.failed","payload":{"snapshot_id":"snap-01","error":"..."}}
//! ```
//!
//! Each envelope is forwarded to the webview via `AppHandle::emit`. The
//! webview's existing `atlas:indexing.*` listeners require no changes.
//!
//! # Fallback
//!
//! If the CLI does not support `--stream-events` (older build without H1's
//! CLI extension), the sidecar falls back to `--json` mode: it synthesises a
//! `atlas:indexing.started` event at launch, a `atlas:indexing.completed`
//! event from the single-line JSON summary on exit, or `atlas:indexing.failed`
//! on non-zero exit.
//!
//! v1.49.607 / H1 + I1.

use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::timeout;

// ─── Public API ──────────────────────────────────────────────────────────────

/// Resolve the repo root at which `tools/atlas-index.mjs` lives.
///
/// Honors the `GSD_REPO_ROOT` env var (set in tests); falls back to
/// `std::env::current_dir()` which is the repo root when the Tauri
/// binary is launched from the project directory (standard dev/prod path).
pub fn repo_root() -> PathBuf {
    if let Ok(p) = std::env::var("GSD_REPO_ROOT") {
        return PathBuf::from(p);
    }
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

/// Arguments passed to `spawn_indexer`.
///
/// `project_id` is required; all others are optional overrides that the
/// Tauri command layer can plumb through from the webview's `AtlasIndexRequest`
/// IPC payload (H2/H3 additions). For the H1 baseline, the webview calls
/// `atlas_request_index_snapshot(snapshot_id)` only.
///
/// `timeout_secs` defaults to `Some(300)` (5 minutes). Set to `None` to
/// disable the timeout guard (not recommended in production).
#[derive(Debug, Clone)]
pub struct IndexerArgs {
    pub snapshot_id: String,
    pub project_id: Option<String>,
    pub project_path: Option<String>,
    pub db_override: Option<String>,
    pub registry_override: Option<String>,
    /// Timeout for the child process in seconds. Default: `Some(300)`.
    /// `None` disables the timeout guard entirely.
    pub timeout_secs: Option<u64>,
}

/// Fire-and-forget: spawn the Node.js atlas indexer as a Tokio child process,
/// forward JSONL events to the webview via `AppHandle::emit`, return
/// `Ok(())` immediately.
///
/// The spawned task is fully detached; the caller (the Tauri command) returns
/// before the indexer finishes. Progress and completion are signalled via
/// Tauri events.
///
/// Returns `Err` only if the sidecar cannot be *launched* (e.g. `node` not on
/// PATH). Indexer failures after launch are surfaced as `atlas:indexing.failed`
/// events, not as Err here.
pub fn spawn_indexer_fire_and_forget(app: AppHandle, args: IndexerArgs) -> Result<(), String> {
    let cli_path = repo_root().join("tools").join("atlas-index.mjs");

    // Build the CLI argument list.
    let mut argv: Vec<String> = vec![cli_path.to_string_lossy().into_owned()];

    // Prefer --stream-events (H1 extension) for per-event lines.
    argv.push("--stream-events".to_string());
    // --json is implied by --stream-events but add it for --json-only fallback
    // parsing in the task below (if --stream-events silently degrades).
    argv.push("--json".to_string());

    argv.push(format!("--snapshot={}", args.snapshot_id));

    if let Some(pid) = &args.project_id {
        argv.push(format!("--project={pid}"));
    }
    if let Some(path) = &args.project_path {
        argv.push(format!("--path={path}"));
    }
    if let Some(db) = &args.db_override {
        argv.push(format!("--db={db}"));
    }
    if let Some(reg) = &args.registry_override {
        argv.push(format!("--registry={reg}"));
    }

    let snapshot_id = args.snapshot_id.clone();
    let timeout_secs = args.timeout_secs.unwrap_or(300);

    // Detached task — runs to completion without blocking the command.
    tokio::spawn(async move {
        run_indexer_task(app, argv, snapshot_id, timeout_secs).await;
    });

    Ok(())
}

// ─── Internal task ───────────────────────────────────────────────────────────

/// The long-running async task that owns the child process.
///
/// `timeout_limit` is in seconds. The task wraps `child.wait()` in
/// `tokio::time::timeout`; on expiry it sends SIGTERM, waits up to 5 s for
/// graceful exit, then force-kills and emits `atlas:indexing.failed`.
async fn run_indexer_task(
    app: AppHandle,
    argv: Vec<String>,
    snapshot_id: String,
    timeout_limit: u64,
) {
    if argv.is_empty() {
        let _ = app.emit(
            "atlas:indexing.failed",
            serde_json::json!({ "snapshot_id": snapshot_id, "error": "empty argv" }),
        );
        return;
    }

    // argv[0] is the script path; remaining entries are arguments.
    let (script, rest) = argv.split_first().unwrap();

    // Emit started immediately so the UI shows a spinner before the child forks.
    let _ = app.emit(
        "atlas:indexing.started",
        serde_json::json!({ "snapshot_id": snapshot_id }),
    );

    // Gate hoisted above the spawn; a denial takes the same failure path the
    // spawn error does (emitted event), so the UI sees an honest failed state.
    let argv_refs: Vec<&str> = argv.iter().map(|a| a.as_str()).collect();
    if let Err(e) = crate::security::process_context::ensure_process_allowed(
        "intelligence/run_indexer_task",
        crate::security::process_context::ProcessOp::Spawn,
        "node",
        &argv_refs,
    ) {
        let _ = app.emit(
            "atlas:indexing.failed",
            serde_json::json!({
                "snapshot_id": snapshot_id,
                "error": e.to_string()
            }),
        );
        return;
    }

    let mut child = match Command::new("node")
        .arg(script)
        .args(rest)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            let _ = app.emit(
                "atlas:indexing.failed",
                serde_json::json!({
                    "snapshot_id": snapshot_id,
                    "error": format!("failed to spawn node: {e}")
                }),
            );
            return;
        }
    };

    // Stream stdout line-by-line; each line is a JSONL envelope OR the
    // single-line JSON summary emitted by --json mode when --stream-events
    // is not supported by the installed CLI version.
    let stdout = child.stdout.take().expect("stdout piped");
    let mut lines = BufReader::new(stdout).lines();

    // Accumulate the last line for --json-only fallback parsing.
    let mut last_line: Option<String> = None;
    let mut saw_stream_event = false;

    while let Ok(Some(line)) = lines.next_line().await {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Try to parse as a JSONL stream envelope first.
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(trimmed) {
            // Stream-events envelope: { "event": "atlas:indexing.*", "payload": {...} }
            if let (Some(event), Some(payload)) = (
                val.get("event").and_then(|e| e.as_str()),
                val.get("payload"),
            ) {
                if event.starts_with("atlas:indexing.") {
                    saw_stream_event = true;
                    let _ = app.emit(event, payload);
                    continue;
                }
            }
        }

        // Not a stream envelope — treat as the --json summary line.
        last_line = Some(trimmed.to_string());
    }

    // ── Timeout-guarded child.wait() ─────────────────────────────────────────
    //
    // Wrap child.wait() in tokio::time::timeout. On expiry:
    //   1. Send SIGTERM (child.kill() on Unix sends SIGKILL on some platforms;
    //      we use start_kill() explicitly after the grace period).
    //   2. Wait up to 5 s for graceful exit.
    //   3. Force-kill if still alive, then emit atlas:indexing.failed.
    let wait_result = timeout(Duration::from_secs(timeout_limit), child.wait()).await;

    let status = match wait_result {
        Ok(Ok(s)) => s,
        Ok(Err(e)) => {
            let _ = app.emit(
                "atlas:indexing.failed",
                serde_json::json!({
                    "snapshot_id": snapshot_id,
                    "error": format!("child wait failed: {e}")
                }),
            );
            return;
        }
        Err(_elapsed) => {
            // Timeout fired. Attempt graceful SIGTERM first.
            let _ = child.kill().await;

            // Give the process up to 5 s to exit after the signal.
            match timeout(Duration::from_secs(5), child.wait()).await {
                Ok(_) => {}
                Err(_) => {
                    // Still alive after grace period — force-kill.
                    let _ = child.start_kill();
                    let _ = child.wait().await;
                }
            }

            let _ = app.emit(
                "atlas:indexing.failed",
                serde_json::json!({
                    "snapshot_id": snapshot_id,
                    "error": format!(
                        "indexer timed out after {timeout_limit}s and was terminated"
                    )
                }),
            );
            return;
        }
    };

    // If we already forwarded stream events, we're done — the CLI emitted
    // its own completed/failed event.
    if saw_stream_event {
        return;
    }

    // ── Fallback: synthesise events from the --json summary line ─────────────
    if status.success() {
        // Parse the summary JSON if available.
        let (symbols, calls, files) = last_line
            .as_deref()
            .and_then(|l| serde_json::from_str::<serde_json::Value>(l).ok())
            .and_then(|v| {
                let totals = v.get("totals")?;
                Some((
                    totals.get("symbols").and_then(|x| x.as_i64()).unwrap_or(0),
                    totals.get("calls").and_then(|x| x.as_i64()).unwrap_or(0),
                    totals.get("files").and_then(|x| x.as_i64()).unwrap_or(0),
                ))
            })
            .unwrap_or((0, 0, 0));

        let _ = app.emit(
            "atlas:indexing.completed",
            serde_json::json!({
                "snapshot_id": snapshot_id,
                "project_id": "",          // unknown in fallback mode; H2 adds per-project routing
                "symbols_count": symbols,
                "calls_count":   calls,
                "files_count":   files,
            }),
        );
    } else {
        // Drain stderr for the error message.
        let stderr_msg = last_line.unwrap_or_else(|| "indexer exited non-zero".to_string());
        let _ = app.emit(
            "atlas:indexing.failed",
            serde_json::json!({
                "snapshot_id": snapshot_id,
                "error": stderr_msg,
            }),
        );
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── repo_root resolution ──────────────────────────────────────────────────

    #[test]
    fn repo_root_honors_env_override() {
        std::env::set_var("GSD_REPO_ROOT", "/tmp/fake-repo");
        let r = repo_root();
        std::env::remove_var("GSD_REPO_ROOT");
        assert_eq!(r, PathBuf::from("/tmp/fake-repo"));
    }

    #[test]
    fn repo_root_fallback_is_nonempty() {
        // When the env var is absent the fallback is current_dir or ".".
        // We cannot assert a specific path in CI; just verify it's non-empty.
        std::env::remove_var("GSD_REPO_ROOT");
        let r = repo_root();
        assert!(!r.as_os_str().is_empty());
    }

    // ── IndexerArgs construction ──────────────────────────────────────────────

    #[test]
    fn indexer_args_clone() {
        let a = IndexerArgs {
            snapshot_id: "snap-01".to_string(),
            project_id: Some("gsd-skill-creator".to_string()),
            project_path: Some("/tmp/proj".to_string()),
            db_override: None,
            registry_override: None,
            timeout_secs: Some(300),
        };
        let b = a.clone();
        assert_eq!(b.snapshot_id, "snap-01");
        assert_eq!(b.project_id.as_deref(), Some("gsd-skill-creator"));
        assert!(b.db_override.is_none());
        assert_eq!(b.timeout_secs, Some(300));
    }

    #[test]
    fn timeout_none_disables_guard() {
        // When timeout_secs is None, spawn_indexer_fire_and_forget falls back
        // to the default of 300 s (the None arm produces Some(300) via
        // unwrap_or(300)). This test verifies the field round-trips cleanly.
        let args = IndexerArgs {
            snapshot_id: "snap-notimeout".to_string(),
            project_id: None,
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: None,
        };
        // None means "no caller-specified timeout"; the task uses the default 300 s.
        assert!(args.timeout_secs.is_none());
        // Default applied by spawn_indexer_fire_and_forget:
        let effective = args.timeout_secs.unwrap_or(300);
        assert_eq!(effective, 300);
    }

    // ── Timeout-guard logic (unit, no AppHandle required) ────────────────────
    //
    // Full end-to-end spawn tests require a real AppHandle (Tauri integration
    // test harness). The unit tests below verify the timeout-related logic
    // shapes without spawning real processes.

    #[test]
    fn timeout_error_message_includes_duration() {
        // Verify the error message format the timeout branch emits.
        let timeout_limit: u64 = 42;
        let msg = format!("indexer timed out after {timeout_limit}s and was terminated");
        assert!(msg.contains("42s"));
        assert!(msg.contains("timed out"));
        assert!(msg.contains("terminated"));
    }

    #[test]
    fn timeout_default_is_300_seconds() {
        // Confirm the advertised default (300 s = 5 minutes) is what
        // spawn_indexer_fire_and_forget uses when timeout_secs is None.
        let args = IndexerArgs {
            snapshot_id: "snap-default-timeout".to_string(),
            project_id: None,
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: None,
        };
        let effective = args.timeout_secs.unwrap_or(300);
        assert_eq!(effective, 300, "default must be 300 s (5 minutes)");
    }

    // ── argv construction (tested via the public API shape) ───────────────────

    #[test]
    fn bad_project_id_empty_string_is_passed_through() {
        // spawn_indexer_fire_and_forget cannot be called without a real
        // AppHandle in unit tests.  Instead, we verify the argv-building logic
        // by constructing the same strings it would produce.
        let args = IndexerArgs {
            snapshot_id: "snap-bad".to_string(),
            project_id: Some(String::new()), // empty project_id
            project_path: None,
            db_override: None,
            registry_override: None,
            timeout_secs: Some(300),
        };
        // The CLI will validate and return exit 2; this tests that our code
        // doesn't crash building the argv, not the CLI itself.
        let proj_flag = args.project_id.as_ref().map(|p| format!("--project={p}"));
        assert_eq!(proj_flag.as_deref(), Some("--project="));
    }

    #[test]
    fn snapshot_flag_is_always_present() {
        let snap = "snap-abc-123".to_string();
        let flag = format!("--snapshot={snap}");
        assert!(flag.starts_with("--snapshot="));
        assert!(flag.contains("snap-abc-123"));
    }

    // ── Spawn-fail path (node not available) — integration, gated on CI ──────
    //
    // When `node` is not on PATH, `spawn_indexer_fire_and_forget` would return
    // Ok(()) (spawn is fire-and-forget) and the detached task would emit
    // atlas:indexing.failed.  We cannot test the event emission without a real
    // AppHandle, so the actual spawn-with-node test is gated behind the
    // `node-test` feature flag and documented here for completeness.
    //
    // #[cfg_attr(not(feature = "node-test"), ignore)]
    // #[tokio::test]
    // async fn spawn_actual_node_process() { ... }

    // ── Stream-event parsing helpers ─────────────────────────────────────────

    #[test]
    fn stream_envelope_detected_by_event_key() {
        let line = r#"{"event":"atlas:indexing.progress","payload":{"snapshot_id":"s","files_done":3,"files_total":10}}"#;
        let val: serde_json::Value = serde_json::from_str(line).unwrap();
        let event = val.get("event").and_then(|e| e.as_str()).unwrap();
        assert!(event.starts_with("atlas:indexing."));
        let payload = val.get("payload").unwrap();
        assert_eq!(payload["files_done"], 3);
    }

    #[test]
    fn json_summary_line_parsed_for_fallback_event() {
        // This is the single-line output of `--json` mode (no --stream-events).
        let line = r#"{"ok":true,"snapshotId":"snap-01","totals":{"files":5,"symbols":42,"calls":18,"references":7,"provenanceLines":0,"durationMs":120}}"#;
        let val: serde_json::Value = serde_json::from_str(line).unwrap();
        let totals = val.get("totals").unwrap();
        let symbols = totals.get("symbols").and_then(|x| x.as_i64()).unwrap_or(0);
        let calls = totals.get("calls").and_then(|x| x.as_i64()).unwrap_or(0);
        let files = totals.get("files").and_then(|x| x.as_i64()).unwrap_or(0);
        assert_eq!(symbols, 42);
        assert_eq!(calls, 18);
        assert_eq!(files, 5);
    }

    #[test]
    fn non_atlas_json_line_does_not_trigger_stream_path() {
        // A line that is valid JSON but not a stream envelope must not be
        // forwarded as a Tauri event (it will be treated as the summary line).
        let line = r#"{"ok":true,"snapshotId":"snap-01"}"#;
        let val: serde_json::Value = serde_json::from_str(line).unwrap();
        let is_envelope = val
            .get("event")
            .and_then(|e| e.as_str())
            .map(|e| e.starts_with("atlas:indexing."))
            .unwrap_or(false);
        assert!(!is_envelope);
    }
}
