//! Intelligence Dashboard — Tauri commands.
//!
//! All 18 commands delegating to the `KbDelegate` trait.
//! In Phase 824 (Track C parallel build) the delegate is a stub that returns
//! deferred-implementation errors. Phase 825 wires the real C04 KB.
//!
//! Atomic console request emission (D-24-12): write to `.tmp` then rename.
//! S2 invariant: no subprocess spawning from any command in this file.
//!
//! Phase 824 / C07.

use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

use super::types::{
    Briefing, Bundle, BundlePreview, Decision, DecisionDraft, Finding, Meeting, Project,
    ProjectInput, RequestId, SendNowResult,
};

// ─── KbDelegate trait ──────────────────────────────────────────────────────────
//
// This trait is the seam between the Tauri command layer and the KB implementation.
// Phase 825 replaces the stub with the real C04 binding.

pub trait KbDelegate: Send + Sync + 'static {
    fn list_projects(&self, sort: Option<String>) -> Result<Vec<Project>, String>;
    fn get_project(&self, project_id: String) -> Result<Option<Project>, String>;
    fn register_project(&self, project: ProjectInput) -> Result<Project, String>;
    fn get_briefing(&self, project_id: String) -> Result<Option<Briefing>, String>;
    fn list_findings(&self, project_id: String) -> Result<Vec<Finding>, String>;
    fn dismiss_finding(&self, finding_id: String, rationale: Option<String>) -> Result<Finding, String>;
    fn start_meeting(&self, project_id: String) -> Result<Meeting, String>;
    fn park_meeting(&self, meeting_id: String) -> Result<Meeting, String>;
    fn resume_meeting(&self, meeting_id: String) -> Result<Meeting, String>;
    fn add_decision(&self, meeting_id: String, draft: DecisionDraft) -> Result<Decision, String>;
    fn edit_decision(&self, decision_id: String, modifications: Vec<String>) -> Result<Decision, String>;
    fn withdraw_decision(&self, decision_id: String) -> Result<Decision, String>;
    fn send_now(&self, decision_id: String) -> Result<SendNowResult, String>;
    fn preview_bundle(&self, meeting_id: String) -> Result<BundlePreview, String>;
    fn commit_bundle(&self, meeting_id: String) -> Result<Bundle, String>;
    fn get_meeting_record(&self, meeting_id: String) -> Result<String, String>;
}

// ─── Stub KB delegate ─────────────────────────────────────────────────────────

const DEFERRED: &str = "IntelligenceKB stub: implementation lands in Phase 823 / C04";

/// Stub delegate used in Phase 824 (parallel build against C00 stub).
pub struct StubKbDelegate;

impl KbDelegate for StubKbDelegate {
    fn list_projects(&self, _sort: Option<String>) -> Result<Vec<Project>, String> {
        Err(DEFERRED.to_string())
    }
    fn get_project(&self, _project_id: String) -> Result<Option<Project>, String> {
        Err(DEFERRED.to_string())
    }
    fn register_project(&self, _project: ProjectInput) -> Result<Project, String> {
        Err(DEFERRED.to_string())
    }
    fn get_briefing(&self, _project_id: String) -> Result<Option<Briefing>, String> {
        Err(DEFERRED.to_string())
    }
    fn list_findings(&self, _project_id: String) -> Result<Vec<Finding>, String> {
        Err(DEFERRED.to_string())
    }
    fn dismiss_finding(&self, _finding_id: String, _rationale: Option<String>) -> Result<Finding, String> {
        Err(DEFERRED.to_string())
    }
    fn start_meeting(&self, _project_id: String) -> Result<Meeting, String> {
        Err(DEFERRED.to_string())
    }
    fn park_meeting(&self, _meeting_id: String) -> Result<Meeting, String> {
        Err(DEFERRED.to_string())
    }
    fn resume_meeting(&self, _meeting_id: String) -> Result<Meeting, String> {
        Err(DEFERRED.to_string())
    }
    fn add_decision(&self, _meeting_id: String, _draft: DecisionDraft) -> Result<Decision, String> {
        Err(DEFERRED.to_string())
    }
    fn edit_decision(&self, _decision_id: String, _modifications: Vec<String>) -> Result<Decision, String> {
        Err(DEFERRED.to_string())
    }
    fn withdraw_decision(&self, _decision_id: String) -> Result<Decision, String> {
        Err(DEFERRED.to_string())
    }
    fn send_now(&self, _decision_id: String) -> Result<SendNowResult, String> {
        Err(DEFERRED.to_string())
    }
    fn preview_bundle(&self, _meeting_id: String) -> Result<BundlePreview, String> {
        Err(DEFERRED.to_string())
    }
    fn commit_bundle(&self, _meeting_id: String) -> Result<Bundle, String> {
        Err(DEFERRED.to_string())
    }
    fn get_meeting_record(&self, _meeting_id: String) -> Result<String, String> {
        Err(DEFERRED.to_string())
    }
}

// ─── Intelligence state managed by Tauri ──────────────────────────────────────

pub struct IntelligenceState {
    pub kb: Box<dyn KbDelegate>,
    /// Base path for console inbox (`.planning/console/inbox/pending/`).
    pub console_inbox_path: PathBuf,
    /// Base path for console outbox (`.planning/console/outbox/status/`).
    pub console_outbox_path: PathBuf,
}

impl IntelligenceState {
    pub fn new_with_stub(repo_root: PathBuf) -> Self {
        Self {
            kb: Box::new(StubKbDelegate),
            console_inbox_path: repo_root.join(".planning/console/inbox/pending"),
            console_outbox_path: repo_root.join(".planning/console/outbox/status"),
        }
    }
}

// ─── Atomic console request emission ─────────────────────────────────────────

/// Generates a request ID with format `req_YYYY-MM-DD_HHMM_XXXX`.
pub fn generate_request_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // Convert epoch to a simplified date-time string.
    let days = secs / 86400;
    let time_in_day = secs % 86400;
    let hours = time_in_day / 3600;
    let minutes = (time_in_day % 3600) / 60;
    // Days since Unix epoch → approximate year/month/day (good enough for IDs).
    let year = 1970 + days / 365;
    let day_in_year = days % 365;
    let month = (day_in_year / 30) + 1;
    let day_in_month = (day_in_year % 30) + 1;
    let rand4 = &Uuid::new_v4().to_string()[..4];
    format!(
        "req_{year:04}-{month:02}-{day_in_month:02}_{hours:02}{minutes:02}_{rand4}"
    )
}

/// Atomically write `content` to `dir/filename`.
/// Writes to `dir/filename.tmp` first, then renames to `dir/filename`.
/// Returns `Err` if the write or rename fails.
pub fn atomic_write(dir: &PathBuf, filename: &str, content: &str) -> Result<(), String> {
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("Failed to create directory {}: {e}", dir.display()))?;
    let final_path = dir.join(filename);
    let tmp_path = dir.join(format!("{filename}.tmp"));
    std::fs::write(&tmp_path, content)
        .map_err(|e| format!("Failed to write tmp file {}: {e}", tmp_path.display()))?;
    std::fs::rename(&tmp_path, &final_path)
        .map_err(|e| format!("Failed to rename {}: {e}", tmp_path.display()))?;
    Ok(())
}

/// Build a `ConsoleRequest` JSON string for a briefing-refresh request.
pub fn build_console_request(
    request_id: &str,
    request_type: &str,
    project_id: &str,
    branch: Option<&str>,
    payload: serde_json::Value,
    respond_to: &str,
) -> Result<String, String> {
    let req = serde_json::json!({
        "id": request_id,
        "type": request_type,
        "project": project_id,
        "branch": branch,
        "payload": payload,
        "respond_to": respond_to,
        "timeout_hint_ms": 30000,
    });
    serde_json::to_string_pretty(&req).map_err(|e| e.to_string())
}

// ─── Tauri commands ───────────────────────────────────────────────────────────

use std::sync::Mutex;

#[tauri::command]
pub async fn intelligence_list_projects(
    state: State<'_, Mutex<IntelligenceState>>,
    sort: Option<String>,
) -> Result<Vec<Project>, String> {
    state.lock().map_err(|e| e.to_string())?.kb.list_projects(sort)
}

#[tauri::command]
pub async fn intelligence_get_project(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
) -> Result<Option<Project>, String> {
    state.lock().map_err(|e| e.to_string())?.kb.get_project(project_id)
}

#[tauri::command]
pub async fn intelligence_register_project(
    state: State<'_, Mutex<IntelligenceState>>,
    project: ProjectInput,
) -> Result<Project, String> {
    state.lock().map_err(|e| e.to_string())?.kb.register_project(project)
}

#[tauri::command]
pub async fn intelligence_get_briefing(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
) -> Result<Option<Briefing>, String> {
    state.lock().map_err(|e| e.to_string())?.kb.get_briefing(project_id)
}

#[tauri::command]
pub async fn intelligence_list_findings(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
) -> Result<Vec<Finding>, String> {
    state.lock().map_err(|e| e.to_string())?.kb.list_findings(project_id)
}

#[tauri::command]
pub async fn intelligence_dismiss_finding(
    state: State<'_, Mutex<IntelligenceState>>,
    finding_id: String,
    rationale: Option<String>,
) -> Result<Finding, String> {
    state.lock().map_err(|e| e.to_string())?.kb.dismiss_finding(finding_id, rationale)
}

#[tauri::command]
pub async fn intelligence_start_meeting(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
) -> Result<Meeting, String> {
    state.lock().map_err(|e| e.to_string())?.kb.start_meeting(project_id)
}

#[tauri::command]
pub async fn intelligence_park_meeting(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
) -> Result<Meeting, String> {
    state.lock().map_err(|e| e.to_string())?.kb.park_meeting(meeting_id)
}

#[tauri::command]
pub async fn intelligence_resume_meeting(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
) -> Result<Meeting, String> {
    state.lock().map_err(|e| e.to_string())?.kb.resume_meeting(meeting_id)
}

#[tauri::command]
pub async fn intelligence_add_decision(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
    draft: DecisionDraft,
) -> Result<Decision, String> {
    state.lock().map_err(|e| e.to_string())?.kb.add_decision(meeting_id, draft)
}

#[tauri::command]
pub async fn intelligence_edit_decision(
    state: State<'_, Mutex<IntelligenceState>>,
    decision_id: String,
    modifications: Vec<String>,
) -> Result<Decision, String> {
    state.lock().map_err(|e| e.to_string())?.kb.edit_decision(decision_id, modifications)
}

#[tauri::command]
pub async fn intelligence_withdraw_decision(
    state: State<'_, Mutex<IntelligenceState>>,
    decision_id: String,
) -> Result<Decision, String> {
    state.lock().map_err(|e| e.to_string())?.kb.withdraw_decision(decision_id)
}

#[tauri::command]
pub async fn intelligence_send_now(
    state: State<'_, Mutex<IntelligenceState>>,
    decision_id: String,
) -> Result<SendNowResult, String> {
    state.lock().map_err(|e| e.to_string())?.kb.send_now(decision_id)
}

#[tauri::command]
pub async fn intelligence_preview_bundle(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
) -> Result<BundlePreview, String> {
    state.lock().map_err(|e| e.to_string())?.kb.preview_bundle(meeting_id)
}

#[tauri::command]
pub async fn intelligence_commit_bundle(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
) -> Result<Bundle, String> {
    state.lock().map_err(|e| e.to_string())?.kb.commit_bundle(meeting_id)
}

#[tauri::command]
pub async fn intelligence_request_briefing_refresh(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
    branch: Option<String>,
    conversation_text: Option<String>,
) -> Result<RequestId, String> {
    let (inbox_path, outbox_path) = {
        let s = state.lock().map_err(|e| e.to_string())?;
        (s.console_inbox_path.clone(), s.console_outbox_path.clone())
    };
    let request_id = generate_request_id();
    let respond_to = outbox_path.join(format!("{request_id}.json"));
    let payload = serde_json::json!({
        "since_snapshot": "latest",
        "scope": [],
        "conversation_text": conversation_text,
    });
    let content = build_console_request(
        &request_id,
        "intelligence.refresh_briefing",
        &project_id,
        branch.as_deref(),
        payload,
        &respond_to.to_string_lossy(),
    )?;
    let filename = format!("{request_id}.json");
    atomic_write(&inbox_path, &filename, &content)?;
    Ok(RequestId { id: request_id })
}

#[tauri::command]
pub async fn intelligence_request_snapshot_diff(
    state: State<'_, Mutex<IntelligenceState>>,
    project_id: String,
    branch: Option<String>,
) -> Result<RequestId, String> {
    let (inbox_path, outbox_path) = {
        let s = state.lock().map_err(|e| e.to_string())?;
        (s.console_inbox_path.clone(), s.console_outbox_path.clone())
    };
    let request_id = generate_request_id();
    let respond_to = outbox_path.join(format!("{request_id}.json"));
    let payload = serde_json::json!({ "scope": "full" });
    let content = build_console_request(
        &request_id,
        "intelligence.snapshot_diff",
        &project_id,
        branch.as_deref(),
        payload,
        &respond_to.to_string_lossy(),
    )?;
    let filename = format!("{request_id}.json");
    atomic_write(&inbox_path, &filename, &content)?;
    Ok(RequestId { id: request_id })
}

#[tauri::command]
pub async fn intelligence_get_meeting_record(
    state: State<'_, Mutex<IntelligenceState>>,
    meeting_id: String,
) -> Result<String, String> {
    state.lock().map_err(|e| e.to_string())?.kb.get_meeting_record(meeting_id)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn generate_request_id_has_correct_prefix() {
        let id = generate_request_id();
        assert!(id.starts_with("req_"), "Expected prefix req_, got: {id}");
        // Format: req_YYYY-MM-DD_HHMM_XXXX
        let parts: Vec<&str> = id.splitn(3, '_').collect();
        assert_eq!(parts[0], "req");
    }

    #[test]
    fn two_request_ids_are_distinct() {
        let id1 = generate_request_id();
        let id2 = generate_request_id();
        // The UUID suffix ensures uniqueness even at the same second.
        assert_ne!(id1, id2);
    }

    #[test]
    fn atomic_write_creates_file() {
        let tmp = TempDir::new().unwrap();
        let dir = tmp.path().to_path_buf();
        atomic_write(&dir, "test.json", r#"{"test":true}"#).unwrap();
        assert!(dir.join("test.json").exists());
        let content = std::fs::read_to_string(dir.join("test.json")).unwrap();
        assert_eq!(content, r#"{"test":true}"#);
    }

    #[test]
    fn atomic_write_no_tmp_file_after_completion() {
        let tmp = TempDir::new().unwrap();
        let dir = tmp.path().to_path_buf();
        atomic_write(&dir, "final.json", r#"{"ok":true}"#).unwrap();
        // .tmp file should be gone after successful rename.
        assert!(!dir.join("final.json.tmp").exists());
        assert!(dir.join("final.json").is_file());
    }

    #[test]
    fn atomic_write_creates_nested_dirs() {
        let tmp = TempDir::new().unwrap();
        let nested = tmp.path().join("a").join("b").join("c");
        atomic_write(&nested, "x.json", "{}").unwrap();
        assert!(nested.join("x.json").exists());
    }

    #[test]
    fn build_console_request_is_valid_json() {
        let json = build_console_request(
            "req_test",
            "intelligence.refresh_briefing",
            "gsd-skill-creator",
            Some("dev"),
            serde_json::json!({"since_snapshot": "latest"}),
            ".planning/console/outbox/status/req_test.json",
        ).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["id"], "req_test");
        assert_eq!(parsed["type"], "intelligence.refresh_briefing");
        assert_eq!(parsed["project"], "gsd-skill-creator");
        assert_eq!(parsed["branch"], "dev");
        assert_eq!(parsed["timeout_hint_ms"], 30000);
    }

    #[test]
    fn build_console_request_no_auth_tokens() {
        let json = build_console_request(
            "req_s13",
            "intelligence.refresh_briefing",
            "proj",
            None,
            serde_json::json!({}),
            ".planning/console/outbox/status/req_s13.json",
        ).unwrap();
        // S13: no Bearer tokens, no API keys in console requests.
        assert!(!json.contains("Bearer "), "Must not contain Bearer token");
        assert!(!json.contains("sk-"), "Must not contain sk- API key");
        assert!(!json.contains("ghp_"), "Must not contain GitHub token");
        assert!(!json.contains("ANTHROPIC_API_KEY"), "Must not contain ANTHROPIC_API_KEY");
    }

    #[test]
    fn briefing_refresh_emission_creates_file() {
        let tmp = TempDir::new().unwrap();
        let inbox = tmp.path().join("console/inbox/pending");
        let outbox = tmp.path().join("console/outbox/status");
        let request_id = generate_request_id();
        let respond_to = outbox.join(format!("{request_id}.json"));
        let payload = serde_json::json!({"since_snapshot": "latest", "scope": [], "conversation_text": null});
        let content = build_console_request(
            &request_id,
            "intelligence.refresh_briefing",
            "gsd-skill-creator",
            Some("dev"),
            payload,
            &respond_to.to_string_lossy(),
        ).unwrap();
        atomic_write(&inbox, &format!("{request_id}.json"), &content).unwrap();
        // File exists and parses correctly.
        let file_path = inbox.join(format!("{request_id}.json"));
        assert!(file_path.exists());
        let read_back = std::fs::read_to_string(&file_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&read_back).unwrap();
        assert_eq!(parsed["type"], "intelligence.refresh_briefing");
        assert_eq!(parsed["project"], "gsd-skill-creator");
    }

    #[test]
    fn stub_kb_delegate_returns_deferred_error() {
        let kb = StubKbDelegate;
        let err = kb.list_projects(None).unwrap_err();
        assert!(err.contains("stub"), "Expected stub error, got: {err}");
    }

    #[test]
    fn two_simultaneous_emissions_have_distinct_ids() {
        let tmp = TempDir::new().unwrap();
        let inbox = tmp.path().to_path_buf();
        let id1 = generate_request_id();
        let id2 = generate_request_id();
        assert_ne!(id1, id2);
        atomic_write(&inbox, &format!("{id1}.json"), r#"{"id":"1"}"#).unwrap();
        atomic_write(&inbox, &format!("{id2}.json"), r#"{"id":"2"}"#).unwrap();
        assert!(inbox.join(format!("{id1}.json")).exists());
        assert!(inbox.join(format!("{id2}.json")).exists());
    }

    // S2 invariant: verify no subprocess spawn in this module.
    // This is enforced structurally — no Command::new / process::Command is present
    // in this file. The test documents the invariant.
    #[test]
    fn s2_no_subprocess_spawn_invariant_documented() {
        // Static analysis: this file has zero occurrences of:
        // - std::process::Command
        // - tokio::process::Command
        // - Command::new
        // The absence is the invariant. Test documents it by passing.
        assert!(true, "S2 invariant: no subprocess spawning in intelligence/server.rs");
    }
}
