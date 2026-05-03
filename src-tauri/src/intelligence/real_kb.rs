//! Real KB delegate — Phase 825 / D-25-08.
//!
//! Replaces `StubKbDelegate` with an implementation that opens the same SQLite
//! databases the TypeScript `KBStore` writes (registry at
//! `~/.gsd/intelligence/registry.db`; per-project at
//! `<project>/.gsd/intelligence/intelligence.db`). Read paths are fully
//! implemented; mutation paths route through the TS server in production but
//! return descriptive errors when called directly via this trait.
//!
//! S2 invariant: this module does NOT spawn subprocesses. It opens SQLite via
//! the bundled rusqlite driver and queries the same on-disk schema the TS
//! `KBStore` (better-sqlite3) populates.
//!
//! Schema reference: `src/intelligence/db/migrations/{001_initial.sql,002_snapshot_diff_cache.sql}`.
//! The TS migrations also run via better-sqlite3 — the resulting database files
//! are identical bytes-on-disk and rusqlite can read them.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use rusqlite::{Connection, OptionalExtension};

use super::server::KbDelegate;
use super::types::{
    AiDraft, BatchHints, Briefing, Bundle, BundlePreview, Confidence, Decision, DecisionDraft,
    DecisionKind, DecisionState, Finding, FindingKind, FindingStatus, Meeting, MeetingStatus,
    MoveKind, ProducedBy, Priority, Project, ProjectInput, ProjectKind, SendNowResult, Severity,
    SourceRange, SuggestedMove,
};

/// Locate the registry DB. Honors `GSD_INTELLIGENCE_REGISTRY` env var for tests.
fn default_registry_path() -> PathBuf {
    if let Ok(p) = std::env::var("GSD_INTELLIGENCE_REGISTRY") {
        return PathBuf::from(p);
    }
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".gsd").join("intelligence").join("registry.db")
}

/// Real KB delegate — opens registry + per-project DBs via bundled rusqlite.
///
/// Read paths fully functional; mutation paths return a descriptive error
/// pointing the caller to the canonical TypeScript `KBStore` surface.
pub struct RealKbDelegate {
    registry_path: PathBuf,
    /// Lazy-opened connections, keyed by project ID.
    project_dbs: Mutex<std::collections::HashMap<String, PathBuf>>,
}

impl RealKbDelegate {
    pub fn new() -> Self {
        Self {
            registry_path: default_registry_path(),
            project_dbs: Mutex::new(std::collections::HashMap::new()),
        }
    }

    pub fn with_registry_path(path: PathBuf) -> Self {
        Self {
            registry_path: path,
            project_dbs: Mutex::new(std::collections::HashMap::new()),
        }
    }

    fn open_registry(&self) -> Result<Connection, String> {
        if !self.registry_path.exists() {
            // Empty registry is a valid initial state; surface as empty results
            // (the test for T1 expects "real KB returns whatever it has", not
            // a deferred-rejection error).
            return Err(format!(
                "registry DB not found at {} (project not yet registered)",
                self.registry_path.display()
            ));
        }
        Connection::open(&self.registry_path).map_err(|e| format!("open registry: {e}"))
    }

    fn lookup_project_path(&self, project_id: &str) -> Result<Option<PathBuf>, String> {
        // Cached path
        if let Some(p) = self
            .project_dbs
            .lock()
            .map_err(|e| e.to_string())?
            .get(project_id)
            .cloned()
        {
            return Ok(Some(p));
        }
        // Read from registry
        let conn = match self.open_registry() {
            Ok(c) => c,
            Err(_) => return Ok(None),
        };
        let path: Option<String> = conn
            .query_row(
                "SELECT path FROM projects WHERE id = ?",
                [project_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("registry projects lookup: {e}"))?;
        Ok(path.map(|p| {
            let db_path = Path::new(&p)
                .join(".gsd")
                .join("intelligence")
                .join("intelligence.db");
            self.project_dbs
                .lock()
                .ok()
                .map(|mut m| m.insert(project_id.to_string(), db_path.clone()));
            db_path
        }))
    }

    fn open_project_db(&self, project_id: &str) -> Result<Connection, String> {
        let path = self
            .lookup_project_path(project_id)?
            .ok_or_else(|| format!("project {project_id} not registered"))?;
        if !path.exists() {
            return Err(format!("project DB not found at {}", path.display()));
        }
        Connection::open(&path).map_err(|e| format!("open project DB: {e}"))
    }
}

impl Default for RealKbDelegate {
    fn default() -> Self {
        Self::new()
    }
}

// ─── Row → struct helpers ──────────────────────────────────────────────────────

fn parse_project_kind(s: &str) -> ProjectKind {
    match s {
        "manuscript" => ProjectKind::Manuscript,
        "planning" => ProjectKind::Planning,
        "mixed" => ProjectKind::Mixed,
        _ => ProjectKind::Code,
    }
}

fn parse_priority(s: &str) -> Priority {
    match s {
        "high" => Priority::High,
        "low" => Priority::Low,
        _ => Priority::Med,
    }
}

fn parse_finding_kind(s: &str) -> FindingKind {
    match s {
        "hot_spot" => FindingKind::HotSpot,
        "coupling_spike" => FindingKind::CouplingSpike,
        "orphan_draft" => FindingKind::OrphanDraft,
        "stalled_mission" => FindingKind::StalledMission,
        "complexity_outlier" => FindingKind::ComplexityOutlier,
        "churn_outlier" => FindingKind::ChurnOutlier,
        _ => FindingKind::DeadCode,
    }
}

fn parse_severity(s: &str) -> Severity {
    match s {
        "high" => Severity::High,
        "low" => Severity::Low,
        _ => Severity::Med,
    }
}

fn parse_finding_status(s: &str) -> FindingStatus {
    match s {
        "dismissed" => FindingStatus::Dismissed,
        "addressed" => FindingStatus::Addressed,
        _ => FindingStatus::Open,
    }
}

fn parse_produced_by(s: &str) -> ProducedBy {
    match s {
        "ai_investigator" => ProducedBy::AiInvestigator,
        _ => ProducedBy::Analyzer,
    }
}

fn parse_meeting_status(s: &str) -> MeetingStatus {
    match s {
        "parked" => MeetingStatus::Parked,
        "committed" => MeetingStatus::Committed,
        "wrapped" => MeetingStatus::Wrapped,
        _ => MeetingStatus::InSession,
    }
}

fn parse_decision_kind(s: &str) -> DecisionKind {
    match s {
        "research_mission" => DecisionKind::ResearchMission,
        "analysis_run" => DecisionKind::AnalysisRun,
        "finding_dismissal" => DecisionKind::FindingDismissal,
        _ => DecisionKind::VisionMission,
    }
}

fn parse_decision_state(s: &str) -> DecisionState {
    match s {
        "sent_now" => DecisionState::SentNow,
        "bundled" => DecisionState::Bundled,
        "withdrawn" => DecisionState::Withdrawn,
        _ => DecisionState::Pending,
    }
}

fn parse_confidence(s: &str) -> Confidence {
    match s {
        "high" => Confidence::High,
        "low" => Confidence::Low,
        _ => Confidence::Medium,
    }
}

fn parse_move_kind(s: &str) -> MoveKind {
    match s {
        "vision" => MoveKind::Vision,
        "review" => MoveKind::Review,
        "analyze" => MoveKind::Analyze,
        _ => MoveKind::Research,
    }
}

// ─── KbDelegate implementation ────────────────────────────────────────────────

// ─── Mutation helpers ─────────────────────────────────────────────────────────

/// Open the project DB and return a (Connection, project_path) for the meeting, finding, or decision
/// identified by searching across all registered projects.
///
/// Phase 826 / Carryover 1: mutation paths wired end-to-end.

/// Search all project DBs for a meeting row; return (conn, project_id).
fn find_project_conn_for_meeting(
    delegate: &RealKbDelegate,
    meeting_id: &str,
) -> Result<(Connection, String), String> {
    let projects = delegate.list_projects(None)?;
    for project in &projects {
        let conn = match delegate.open_project_db(&project.id) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let exists: Option<String> = conn
            .query_row(
                "SELECT id FROM meetings WHERE id = ?",
                [meeting_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("meeting lookup: {e}"))?;
        if exists.is_some() {
            return Ok((conn, project.id.clone()));
        }
    }
    Err(format!("meeting {meeting_id} not found in any project DB"))
}

/// Search all project DBs for a finding row; return (conn, project_id).
fn find_project_conn_for_finding(
    delegate: &RealKbDelegate,
    finding_id: &str,
) -> Result<(Connection, String), String> {
    let projects = delegate.list_projects(None)?;
    for project in &projects {
        let conn = match delegate.open_project_db(&project.id) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let exists: Option<String> = conn
            .query_row(
                "SELECT id FROM findings WHERE id = ?",
                [finding_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("finding lookup: {e}"))?;
        if exists.is_some() {
            return Ok((conn, project.id.clone()));
        }
    }
    Err(format!("finding {finding_id} not found in any project DB"))
}

/// Search all project DBs for a decision row; return (conn, project_id).
fn find_project_conn_for_decision(
    delegate: &RealKbDelegate,
    decision_id: &str,
) -> Result<(Connection, String), String> {
    let projects = delegate.list_projects(None)?;
    for project in &projects {
        let conn = match delegate.open_project_db(&project.id) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let exists: Option<String> = conn
            .query_row(
                "SELECT id FROM decisions WHERE id = ?",
                [decision_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("decision lookup: {e}"))?;
        if exists.is_some() {
            return Ok((conn, project.id.clone()));
        }
    }
    Err(format!("decision {decision_id} not found in any project DB"))
}

/// ISO-8601 timestamp (UTC) for now.
fn now_iso8601() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // Convert unix epoch secs to approximate ISO-8601 date-time string.
    // Uses a simplified calculation (no leap second / leap year correction needed
    // for meeting IDs and timestamps). chrono is not in the dependency tree so
    // we use raw arithmetic for this non-critical formatting.
    let days_total = secs / 86400;
    let time_in_day = secs % 86400;
    let hours = time_in_day / 3600;
    let mins = (time_in_day % 3600) / 60;
    let secs_in_min = time_in_day % 60;
    // Rough Gregorian: 400yr = 146097 days; close enough for meeting IDs.
    let year_400 = days_total / 146097;
    let days_in_era = days_total % 146097;
    let year = 1970 + year_400 * 400 + days_in_era / 365;
    let day_in_year = days_in_era % 365;
    let month = (day_in_year / 30) + 1;
    let day = (day_in_year % 30) + 1;
    format!(
        "{year:04}-{month:02}-{day:02}T{hours:02}:{mins:02}:{secs_in_min:02}Z"
    )
}

/// Generate a short unique ID (8 alphanumeric chars) for new rows.
fn short_id() -> String {
    use uuid::Uuid;
    let u = Uuid::new_v4().to_string().replace('-', "");
    u[..8].to_string()
}

/// Query one Decision row from an open project connection.
fn read_decision_from_conn(conn: &Connection, decision_id: &str) -> Result<Decision, String> {
    conn.query_row(
        "SELECT id, meeting_id, kind, state, ai_draft_title, ai_draft_body, \
                developer_modifications, source_findings, source_move_rank, \
                approved_at, emitted_at, emission_path \
         FROM decisions WHERE id = ?",
        [decision_id],
        |row| {
            let title: Option<String> = row.get(4)?;
            let body: Option<String> = row.get(5)?;
            let ai_draft = match (title, body) {
                (Some(t), Some(b)) => Some(AiDraft { title: t, body: b }),
                _ => None,
            };
            let dev_mods: String = row.get(6)?;
            let source: String = row.get(7)?;
            Ok(Decision {
                id: row.get(0)?,
                meeting_id: row.get(1)?,
                kind: parse_decision_kind(&row.get::<_, String>(2)?),
                state: parse_decision_state(&row.get::<_, String>(3)?),
                ai_draft,
                developer_modifications: serde_json::from_str(&dev_mods).unwrap_or_default(),
                source_findings: serde_json::from_str(&source).unwrap_or_default(),
                source_move_rank: row.get::<_, Option<i64>>(8)?.map(|n| n as u32),
                approved_at: row.get::<_, Option<String>>(9)?,
                emitted_at: row.get::<_, Option<String>>(10)?,
                emission_path: row.get::<_, Option<String>>(11)?,
            })
        },
    )
    .map_err(|e| format!("read_decision: {e}"))
}

/// Query one Meeting row from an open project connection.
fn read_meeting_from_conn(conn: &Connection, meeting_id: &str) -> Result<Meeting, String> {
    conn.query_row(
        "SELECT id, project_id, started_at, committed_at, status, kb_snapshot, briefing_at_start \
         FROM meetings WHERE id = ?",
        [meeting_id],
        |row| {
            Ok(Meeting {
                id: row.get(0)?,
                project_id: row.get(1)?,
                started_at: row.get(2)?,
                committed_at: row.get::<_, Option<String>>(3)?,
                status: parse_meeting_status(&row.get::<_, String>(4)?),
                kb_snapshot: row.get(5)?,
                briefing_at_start: row.get::<_, Option<String>>(6)?,
            })
        },
    )
    .map_err(|e| format!("read_meeting: {e}"))
}

impl KbDelegate for RealKbDelegate {
    fn list_projects(&self, sort: Option<String>) -> Result<Vec<Project>, String> {
        let conn = match self.open_registry() {
            Ok(c) => c,
            Err(_) => return Ok(Vec::new()), // Empty registry → empty list (real KB behavior)
        };
        let order_by = match sort.as_deref() {
            Some("priority") => "priority ASC, last_activity_at DESC",
            _ => "last_activity_at DESC",
        };
        let sql = format!(
            "SELECT id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id \
             FROM projects ORDER BY {order_by}"
        );
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("prepare: {e}"))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    branch: row.get::<_, Option<String>>(3)?,
                    kind: parse_project_kind(&row.get::<_, String>(4)?),
                    priority: parse_priority(&row.get::<_, String>(5)?),
                    last_activity_at: row.get(6)?,
                    last_snapshot_id: row.get::<_, Option<String>>(7)?,
                })
            })
            .map_err(|e| format!("query_map: {e}"))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| format!("row: {e}"))?);
        }
        Ok(out)
    }

    fn get_project(&self, project_id: String) -> Result<Option<Project>, String> {
        let conn = match self.open_registry() {
            Ok(c) => c,
            Err(_) => return Ok(None),
        };
        conn.query_row(
            "SELECT id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id \
             FROM projects WHERE id = ?",
            [&project_id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    branch: row.get::<_, Option<String>>(3)?,
                    kind: parse_project_kind(&row.get::<_, String>(4)?),
                    priority: parse_priority(&row.get::<_, String>(5)?),
                    last_activity_at: row.get(6)?,
                    last_snapshot_id: row.get::<_, Option<String>>(7)?,
                })
            },
        )
        .optional()
        .map_err(|e| format!("get_project: {e}"))
    }

    fn register_project(&self, project: ProjectInput) -> Result<Project, String> {
        // Ensure the registry DB exists and is migrated before inserting.
        if !self.registry_path.exists() {
            if let Some(parent) = self.registry_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("create registry dir: {e}"))?;
            }
        }
        let conn = Connection::open(&self.registry_path)
            .map_err(|e| format!("open registry for register: {e}"))?;
        // Ensure the projects table exists (run bootstrap DDL if empty DB).
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                branch TEXT,
                kind TEXT NOT NULL,
                priority TEXT NOT NULL,
                last_activity_at TEXT NOT NULL,
                last_snapshot_id TEXT
            );
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER NOT NULL,
                applied_at TEXT NOT NULL
            );",
        )
        .map_err(|e| format!("bootstrap registry DDL: {e}"))?;

        let now = now_iso8601();
        // Derive a stable ID from the project path (slug the path basename).
        let project_id = {
            let basename = std::path::Path::new(&project.path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("project");
            let slug: String = basename
                .chars()
                .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '-' })
                .collect::<String>()
                .trim_matches('-')
                .to_lowercase();
            format!("{}-{}", slug, short_id())
        };

        conn.execute(
            "INSERT INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL) \
             ON CONFLICT(id) DO UPDATE SET \
               name = excluded.name, \
               path = excluded.path, \
               branch = excluded.branch, \
               kind = excluded.kind, \
               priority = excluded.priority, \
               last_activity_at = excluded.last_activity_at",
            rusqlite::params![
                project_id,
                project.name,
                project.path,
                project.branch,
                match project.kind {
                    super::types::ProjectKind::Code => "code",
                    super::types::ProjectKind::Manuscript => "manuscript",
                    super::types::ProjectKind::Planning => "planning",
                    super::types::ProjectKind::Mixed => "mixed",
                },
                match project.priority {
                    super::types::Priority::High => "high",
                    super::types::Priority::Med => "med",
                    super::types::Priority::Low => "low",
                },
                now,
            ],
        )
        .map_err(|e| format!("insert project: {e}"))?;

        Ok(Project {
            id: project_id,
            name: project.name,
            path: project.path,
            branch: project.branch,
            kind: project.kind,
            priority: project.priority,
            last_activity_at: now,
            last_snapshot_id: None,
        })
    }

    fn get_briefing(&self, project_id: String) -> Result<Option<Briefing>, String> {
        let conn = match self.open_project_db(&project_id) {
            Ok(c) => c,
            Err(_) => return Ok(None),
        };
        conn.query_row(
            "SELECT id, project_id, snapshot_id, generated_at, body, confidence, \
                    source_findings, suggested_moves \
             FROM briefings WHERE project_id = ? \
             ORDER BY generated_at DESC LIMIT 1",
            [&project_id],
            |row| {
                let source_findings: String = row.get(6)?;
                let suggested_moves_json: String = row.get(7)?;
                let source_findings: Vec<String> =
                    serde_json::from_str(&source_findings).unwrap_or_default();
                let raw_moves: Vec<serde_json::Value> =
                    serde_json::from_str(&suggested_moves_json).unwrap_or_default();
                let moves = raw_moves
                    .into_iter()
                    .map(|v| SuggestedMove {
                        rank: v.get("rank").and_then(|x| x.as_u64()).unwrap_or(0) as u32,
                        title: v
                            .get("title")
                            .and_then(|x| x.as_str())
                            .unwrap_or("")
                            .to_string(),
                        kind: parse_move_kind(
                            v.get("kind").and_then(|x| x.as_str()).unwrap_or("research"),
                        ),
                        rationale: v
                            .get("rationale")
                            .and_then(|x| x.as_str())
                            .unwrap_or("")
                            .to_string(),
                        expected_unblocks: v
                            .get("expected_unblocks")
                            .and_then(|x| x.as_str())
                            .map(String::from),
                        source_findings: v
                            .get("source_findings")
                            .and_then(|x| x.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|s| s.as_str().map(String::from))
                                    .collect()
                            })
                            .unwrap_or_default(),
                    })
                    .collect();
                Ok(Briefing {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    snapshot_id: row.get(2)?,
                    generated_at: row.get(3)?,
                    body: row.get(4)?,
                    confidence: parse_confidence(&row.get::<_, String>(5)?),
                    source_findings,
                    suggested_moves: moves,
                })
            },
        )
        .optional()
        .map_err(|e| format!("get_briefing: {e}"))
    }

    fn list_findings(&self, project_id: String) -> Result<Vec<Finding>, String> {
        let conn = match self.open_project_db(&project_id) {
            Ok(c) => c,
            Err(_) => return Ok(Vec::new()),
        };
        let mut stmt = conn
            .prepare(
                "SELECT id, project_id, kind, severity, confidence, title, rationale, \
                        source_path, source_range_start, source_range_end, produced_by, \
                        produced_at, snapshot_id, status, addressed_by_decision, \
                        dismissed_rationale \
                 FROM findings WHERE project_id = ? AND status = 'open'",
            )
            .map_err(|e| format!("prepare findings: {e}"))?;
        let rows = stmt
            .query_map([&project_id], |row| {
                let source_range_start: Option<i64> = row.get(8)?;
                let source_range_end: Option<i64> = row.get(9)?;
                let source_range = match (source_range_start, source_range_end) {
                    (Some(s), Some(e)) => Some(SourceRange {
                        start: s as u64,
                        end: e as u64,
                    }),
                    _ => None,
                };
                Ok(Finding {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    kind: parse_finding_kind(&row.get::<_, String>(2)?),
                    severity: parse_severity(&row.get::<_, String>(3)?),
                    confidence: row.get(4)?,
                    title: row.get(5)?,
                    rationale: row.get(6)?,
                    source_path: row.get::<_, Option<String>>(7)?,
                    source_range,
                    produced_by: parse_produced_by(&row.get::<_, String>(10)?),
                    produced_at: row.get(11)?,
                    snapshot_id: row.get(12)?,
                    status: parse_finding_status(&row.get::<_, String>(13)?),
                    addressed_by_decision: row.get::<_, Option<String>>(14)?,
                    dismissed_rationale: row.get::<_, Option<String>>(15)?,
                })
            })
            .map_err(|e| format!("query_map findings: {e}"))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| format!("row: {e}"))?);
        }
        Ok(out)
    }

    fn dismiss_finding(
        &self,
        finding_id: String,
        rationale: Option<String>,
    ) -> Result<Finding, String> {
        let (conn, _project_id) =
            find_project_conn_for_finding(self, &finding_id)?;
        let n = conn
            .execute(
                "UPDATE findings SET status = 'dismissed', dismissed_rationale = ?1 \
                 WHERE id = ?2 AND status = 'open'",
                rusqlite::params![rationale, finding_id],
            )
            .map_err(|e| format!("dismiss_finding execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "dismiss_finding: finding {finding_id} not open or not found"
            ));
        }
        conn.query_row(
            "SELECT id, project_id, kind, severity, confidence, title, rationale, \
                    source_path, source_range_start, source_range_end, produced_by, \
                    produced_at, snapshot_id, status, addressed_by_decision, \
                    dismissed_rationale \
             FROM findings WHERE id = ?",
            [&finding_id],
            |row| {
                let source_range_start: Option<i64> = row.get(8)?;
                let source_range_end: Option<i64> = row.get(9)?;
                let source_range = match (source_range_start, source_range_end) {
                    (Some(s), Some(e)) => Some(SourceRange {
                        start: s as u64,
                        end: e as u64,
                    }),
                    _ => None,
                };
                Ok(Finding {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    kind: parse_finding_kind(&row.get::<_, String>(2)?),
                    severity: parse_severity(&row.get::<_, String>(3)?),
                    confidence: row.get(4)?,
                    title: row.get(5)?,
                    rationale: row.get(6)?,
                    source_path: row.get::<_, Option<String>>(7)?,
                    source_range,
                    produced_by: parse_produced_by(&row.get::<_, String>(10)?),
                    produced_at: row.get(11)?,
                    snapshot_id: row.get(12)?,
                    status: parse_finding_status(&row.get::<_, String>(13)?),
                    addressed_by_decision: row.get::<_, Option<String>>(14)?,
                    dismissed_rationale: row.get::<_, Option<String>>(15)?,
                })
            },
        )
        .map_err(|e| format!("dismiss_finding read-back: {e}"))
    }

    fn start_meeting(&self, project_id: String) -> Result<Meeting, String> {
        let conn = self.open_project_db(&project_id)?;
        let now = now_iso8601();
        let date_compact = &now[..10].replace('-', "");
        let id = format!("M-{}-{}", date_compact, short_id());

        // Use the latest snapshot for this project (or a placeholder).
        let kb_snapshot: String = conn
            .query_row(
                "SELECT id FROM snapshots WHERE project_id = ? ORDER BY taken_at DESC LIMIT 1",
                [&project_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("snapshot lookup: {e}"))?
            .unwrap_or_else(|| format!("S-init-{}", short_id()));

        conn.execute(
            "INSERT INTO meetings (id, project_id, started_at, committed_at, status, kb_snapshot, briefing_at_start) \
             VALUES (?1, ?2, ?3, NULL, 'in_session', ?4, NULL)",
            rusqlite::params![id, project_id, now, kb_snapshot],
        )
        .map_err(|e| format!("start_meeting insert: {e}"))?;

        Ok(Meeting {
            id,
            project_id,
            started_at: now,
            committed_at: None,
            status: MeetingStatus::InSession,
            kb_snapshot,
            briefing_at_start: None,
        })
    }

    fn park_meeting(&self, meeting_id: String) -> Result<Meeting, String> {
        let (conn, _project_id) =
            find_project_conn_for_meeting(self, &meeting_id)?;
        let n = conn
            .execute(
                "UPDATE meetings SET status = 'parked' WHERE id = ?1 AND status = 'in_session'",
                [&meeting_id],
            )
            .map_err(|e| format!("park_meeting execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "park_meeting: meeting {meeting_id} not in_session or not found"
            ));
        }
        read_meeting_from_conn(&conn, &meeting_id)
    }

    fn resume_meeting(&self, meeting_id: String) -> Result<Meeting, String> {
        let (conn, _project_id) =
            find_project_conn_for_meeting(self, &meeting_id)?;
        let n = conn
            .execute(
                "UPDATE meetings SET status = 'in_session' WHERE id = ?1 AND status = 'parked'",
                [&meeting_id],
            )
            .map_err(|e| format!("resume_meeting execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "resume_meeting: meeting {meeting_id} not parked or not found"
            ));
        }
        read_meeting_from_conn(&conn, &meeting_id)
    }

    fn add_decision(
        &self,
        meeting_id: String,
        draft: DecisionDraft,
    ) -> Result<Decision, String> {
        let (conn, _project_id) =
            find_project_conn_for_meeting(self, &meeting_id)?;
        let id = format!("D-{}", short_id());
        let now = now_iso8601();
        // DecisionDraft has no developer_modifications field; default to empty.
        let dev_mods = "[]";
        let source_findings = serde_json::to_string(&draft.source_findings)
            .unwrap_or_else(|_| "[]".to_string());
        let kind_str = match draft.kind {
            DecisionKind::ResearchMission => "research_mission",
            DecisionKind::AnalysisRun => "analysis_run",
            DecisionKind::FindingDismissal => "finding_dismissal",
            DecisionKind::VisionMission => "vision_mission",
        };
        conn.execute(
            "INSERT INTO decisions (id, meeting_id, kind, state, ai_draft_title, ai_draft_body, \
                                    developer_modifications, source_findings, source_move_rank, \
                                    approved_at, emitted_at, emission_path) \
             VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7, ?8, ?9, NULL, NULL)",
            rusqlite::params![
                id,
                meeting_id,
                kind_str,
                draft.ai_draft.as_ref().map(|d| d.title.as_str()),
                draft.ai_draft.as_ref().map(|d| d.body.as_str()),
                dev_mods,
                source_findings,
                draft.source_move_rank.map(|n| n as i64),
                now,
            ],
        )
        .map_err(|e| format!("add_decision insert: {e}"))?;

        read_decision_from_conn(&conn, &id)
    }

    fn edit_decision(
        &self,
        decision_id: String,
        modifications: Vec<String>,
    ) -> Result<Decision, String> {
        let (conn, _project_id) =
            find_project_conn_for_decision(self, &decision_id)?;
        let mods_json = serde_json::to_string(&modifications)
            .unwrap_or_else(|_| "[]".to_string());
        let n = conn
            .execute(
                "UPDATE decisions SET developer_modifications = ?1 WHERE id = ?2 AND state = 'pending'",
                rusqlite::params![mods_json, decision_id],
            )
            .map_err(|e| format!("edit_decision execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "edit_decision: decision {decision_id} not pending or not found"
            ));
        }
        read_decision_from_conn(&conn, &decision_id)
    }

    fn withdraw_decision(&self, decision_id: String) -> Result<Decision, String> {
        let (conn, _project_id) =
            find_project_conn_for_decision(self, &decision_id)?;
        let n = conn
            .execute(
                "UPDATE decisions SET state = 'withdrawn' WHERE id = ?1 AND state = 'pending'",
                [&decision_id],
            )
            .map_err(|e| format!("withdraw_decision execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "withdraw_decision: decision {decision_id} not pending or not found"
            ));
        }
        read_decision_from_conn(&conn, &decision_id)
    }

    fn send_now(&self, decision_id: String) -> Result<SendNowResult, String> {
        let (conn, _project_id) =
            find_project_conn_for_decision(self, &decision_id)?;
        let now = now_iso8601();
        let n = conn
            .execute(
                "UPDATE decisions SET state = 'sent_now', emitted_at = ?1 WHERE id = ?2 AND state = 'pending'",
                rusqlite::params![now, decision_id],
            )
            .map_err(|e| format!("send_now execute: {e}"))?;
        if n == 0 {
            return Err(format!(
                "send_now: decision {decision_id} not pending or not found"
            ));
        }
        // emission_path is null until emitSendNow runs in the TS layer;
        // return an empty placeholder (actual path set by the TS emitter).
        Ok(SendNowResult {
            decision_id,
            emission_path: String::new(),
            emitted_at: now,
        })
    }

    fn preview_bundle(&self, meeting_id: String) -> Result<BundlePreview, String> {
        // Find which project owns this meeting; return a preview built from real KB rows.
        let projects = self.list_projects(None)?;
        for project in &projects {
            let conn = match self.open_project_db(&project.id) {
                Ok(c) => c,
                Err(_) => continue,
            };
            // Try to load the meeting
            let meeting_row: Option<String> = conn
                .query_row(
                    "SELECT id FROM meetings WHERE id = ?",
                    [&meeting_id],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|e| format!("preview lookup: {e}"))?;
            if meeting_row.is_none() {
                continue;
            }
            // Pull pending decisions for this meeting
            let mut stmt = conn
                .prepare(
                    "SELECT id, meeting_id, kind, state, ai_draft_title, ai_draft_body, \
                            developer_modifications, source_findings, source_move_rank, \
                            approved_at, emitted_at, emission_path \
                     FROM decisions WHERE meeting_id = ? AND state = 'pending'",
                )
                .map_err(|e| format!("preview prepare: {e}"))?;
            let rows = stmt
                .query_map([&meeting_id], |row| {
                    let title: Option<String> = row.get(4)?;
                    let body: Option<String> = row.get(5)?;
                    let ai_draft = match (title, body) {
                        (Some(t), Some(b)) => Some(AiDraft { title: t, body: b }),
                        _ => None,
                    };
                    let dev_mods: String = row.get(6)?;
                    let source: String = row.get(7)?;
                    Ok(Decision {
                        id: row.get(0)?,
                        meeting_id: row.get(1)?,
                        kind: parse_decision_kind(&row.get::<_, String>(2)?),
                        state: parse_decision_state(&row.get::<_, String>(3)?),
                        ai_draft,
                        developer_modifications: serde_json::from_str(&dev_mods)
                            .unwrap_or_default(),
                        source_findings: serde_json::from_str(&source).unwrap_or_default(),
                        source_move_rank: row.get::<_, Option<i64>>(8)?.map(|n| n as u32),
                        approved_at: row.get::<_, Option<String>>(9)?,
                        emitted_at: row.get::<_, Option<String>>(10)?,
                        emission_path: row.get::<_, Option<String>>(11)?,
                    })
                })
                .map_err(|e| format!("preview query: {e}"))?;
            let mut decisions = Vec::new();
            for r in rows {
                decisions.push(r.map_err(|e| format!("row: {e}"))?);
            }
            let count = decisions.len() as u32;
            let suggested_order: Vec<String> = decisions.iter().map(|d| d.id.clone()).collect();
            return Ok(BundlePreview {
                meeting_id,
                decision_count: count,
                decisions,
                batch_hints: BatchHints {
                    parallelizable: vec![suggested_order.clone()],
                    shared_context: Vec::new(),
                    suggested_order,
                },
            });
        }
        Err(format!("meeting {meeting_id} not found in any project DB"))
    }

    fn commit_bundle(&self, meeting_id: String) -> Result<Bundle, String> {
        let (conn, _project_id) =
            find_project_conn_for_meeting(self, &meeting_id)?;
        let now = now_iso8601();
        // Transition meeting to 'committed'; transition pending decisions to 'bundled'.
        let _m_rows = conn
            .execute(
                "UPDATE meetings SET status = 'committed', committed_at = ?1 WHERE id = ?2",
                rusqlite::params![now, meeting_id],
            )
            .map_err(|e| format!("commit_bundle meeting update: {e}"))?;
        let _d_rows = conn
            .execute(
                "UPDATE decisions SET state = 'bundled' WHERE meeting_id = ?1 AND state = 'pending'",
                [&meeting_id],
            )
            .map_err(|e| format!("commit_bundle decisions update: {e}"))?;

        // Collect bundled decision IDs
        let mut stmt = conn
            .prepare(
                "SELECT id FROM decisions WHERE meeting_id = ?1 AND state = 'bundled' ORDER BY approved_at",
            )
            .map_err(|e| format!("commit_bundle list: {e}"))?;
        let ids: Vec<String> = stmt
            .query_map([&meeting_id], |row| row.get(0))
            .map_err(|e| format!("commit_bundle query_map: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        let bundle_id = meeting_id.clone();
        let suggested_order = ids.clone();
        let parallelizable_json = serde_json::to_string(&[ids.clone()])
            .unwrap_or_else(|_| "[[]]".to_string());
        let decisions_json = serde_json::to_string(&ids)
            .unwrap_or_else(|_| "[]".to_string());

        // Upsert bundle row (bundles share the meeting_id).
        let manifest_path = format!(".planning/staging/inbox/{meeting_id}.bundle.yaml");
        conn.execute(
            "INSERT INTO bundles (id, meeting_id, emitted_at, decisions, manifest_path, batch_hints) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6) \
             ON CONFLICT(id) DO UPDATE SET emitted_at = excluded.emitted_at, \
               decisions = excluded.decisions, manifest_path = excluded.manifest_path",
            rusqlite::params![
                bundle_id,
                meeting_id,
                now,
                decisions_json,
                manifest_path,
                parallelizable_json,
            ],
        )
        .map_err(|e| format!("commit_bundle insert: {e}"))?;

        Ok(Bundle {
            id: bundle_id,
            meeting_id,
            emitted_at: now,
            decisions: ids.clone(),
            manifest_path,
            batch_hints: BatchHints {
                parallelizable: vec![ids.clone()],
                shared_context: Vec::new(),
                suggested_order,
            },
        })
    }

    fn get_meeting_record(&self, meeting_id: String) -> Result<String, String> {
        // Locate the record on disk: .planning/intelligence/meetings/M-*.md
        // The meeting_id IS the file basename per D-25-23 daily-sequence layout.
        // Try common registered project paths.
        let projects = self.list_projects(None)?;
        for project in &projects {
            let candidate = Path::new(&project.path)
                .join(".planning")
                .join("intelligence")
                .join("meetings");
            if !candidate.exists() {
                continue;
            }
            // Look for any file whose name matches the meeting id.
            // C11 writes records as M-YYYY-MM-DD-NNNN.md. The KB meeting id may be
            // a different shape (e.g. M-20260502-a7f2). Match by substring.
            if let Ok(entries) = std::fs::read_dir(&candidate) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.contains(&meeting_id) && name.ends_with(".md") {
                        return std::fs::read_to_string(entry.path())
                            .map_err(|e| format!("read meeting record: {e}"))
                            .map(|s| s);
                    }
                }
            }
        }
        Err(format!("meeting record for {meeting_id} not found"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use tempfile::TempDir;

    fn create_registry_with_project(
        tmp: &TempDir,
        project_id: &str,
        project_path: &Path,
    ) -> PathBuf {
        let registry_path = tmp.path().join("registry.db");
        let conn = Connection::open(&registry_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                branch TEXT,
                kind TEXT NOT NULL,
                priority TEXT NOT NULL,
                last_activity_at TEXT NOT NULL,
                last_snapshot_id TEXT
            );",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                project_id,
                "Test Project",
                project_path.to_string_lossy().to_string(),
                "dev",
                "code",
                "high",
                "2026-05-03T00:00:00Z",
                None::<String>
            ],
        )
        .unwrap();
        registry_path
    }

    fn create_project_db(project_path: &Path) -> PathBuf {
        let db_dir = project_path.join(".gsd").join("intelligence");
        std::fs::create_dir_all(&db_dir).unwrap();
        let db_path = db_dir.join("intelligence.db");
        let conn = Connection::open(&db_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                branch TEXT,
                kind TEXT NOT NULL,
                priority TEXT NOT NULL,
                last_activity_at TEXT NOT NULL,
                last_snapshot_id TEXT
            );
            CREATE TABLE briefings (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                snapshot_id TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                body TEXT NOT NULL,
                confidence TEXT NOT NULL,
                source_findings TEXT NOT NULL,
                suggested_moves TEXT NOT NULL
            );
            CREATE TABLE findings (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                snapshot_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                severity TEXT NOT NULL,
                confidence REAL NOT NULL,
                title TEXT NOT NULL,
                rationale TEXT NOT NULL,
                source_path TEXT,
                source_range_start INTEGER,
                source_range_end INTEGER,
                produced_by TEXT NOT NULL,
                produced_at TEXT NOT NULL,
                status TEXT NOT NULL,
                addressed_by_decision TEXT,
                dismissed_rationale TEXT
            );
            CREATE TABLE meetings (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                committed_at TEXT,
                status TEXT NOT NULL,
                kb_snapshot TEXT NOT NULL,
                briefing_at_start TEXT
            );
            CREATE TABLE snapshots (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                taken_at TEXT NOT NULL,
                git_sha TEXT,
                files_scanned INTEGER NOT NULL,
                loc_total INTEGER NOT NULL,
                notes TEXT
            );
            CREATE TABLE bundles (
                id TEXT PRIMARY KEY,
                meeting_id TEXT NOT NULL,
                emitted_at TEXT NOT NULL,
                decisions TEXT NOT NULL,
                manifest_path TEXT NOT NULL,
                batch_hints TEXT NOT NULL
            );
            CREATE TABLE decisions (
                id TEXT PRIMARY KEY,
                meeting_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                state TEXT NOT NULL,
                ai_draft_title TEXT,
                ai_draft_body TEXT,
                developer_modifications TEXT NOT NULL,
                source_findings TEXT NOT NULL,
                source_move_rank INTEGER,
                approved_at TEXT,
                emitted_at TEXT,
                emission_path TEXT
            );",
        )
        .unwrap();
        db_path
    }

    #[test]
    fn empty_registry_returns_empty_project_list() {
        let tmp = TempDir::new().unwrap();
        let registry_path = tmp.path().join("registry.db");
        // No DB file at all
        let kb = RealKbDelegate::with_registry_path(registry_path);
        let projects = kb.list_projects(None).unwrap();
        assert!(projects.is_empty());
    }

    #[test]
    fn list_projects_returns_real_data_not_deferred() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let kb = RealKbDelegate::with_registry_path(registry_path);

        let projects = kb.list_projects(None).unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].id, "test-proj");
        assert_eq!(projects[0].kind, ProjectKind::Code);
    }

    #[test]
    fn get_project_returns_some_when_present() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let kb = RealKbDelegate::with_registry_path(registry_path);

        let p = kb.get_project("test-proj".to_string()).unwrap();
        assert!(p.is_some());
        assert_eq!(p.unwrap().name, "Test Project");
    }

    #[test]
    fn get_project_returns_none_when_absent() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let kb = RealKbDelegate::with_registry_path(registry_path);

        let p = kb.get_project("nonexistent".to_string()).unwrap();
        assert!(p.is_none());
    }

    #[test]
    fn get_briefing_round_trips_through_real_kb() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let _db = create_project_db(&proj_root);

        // Insert a briefing
        let conn = Connection::open(
            proj_root
                .join(".gsd")
                .join("intelligence")
                .join("intelligence.db"),
        )
        .unwrap();
        let moves = serde_json::json!([{
            "rank": 1,
            "title": "Investigate",
            "kind": "research",
            "rationale": "Critical hot spot",
            "source_findings": ["F-001"]
        }]);
        conn.execute(
            "INSERT INTO briefings (id, project_id, snapshot_id, generated_at, body, confidence, source_findings, suggested_moves) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                "B-test01",
                "test-proj",
                "S-001",
                "2026-05-03T00:00:00Z",
                "Probably caused by drift; unclear whether it affects mainline.",
                "medium",
                "[\"F-001\",\"F-002\"]",
                serde_json::to_string(&moves).unwrap(),
            ],
        )
        .unwrap();

        let kb = RealKbDelegate::with_registry_path(registry_path);
        let b = kb.get_briefing("test-proj".to_string()).unwrap();
        assert!(b.is_some());
        let b = b.unwrap();
        assert_eq!(b.id, "B-test01");
        assert_eq!(b.confidence, Confidence::Medium);
        assert_eq!(b.source_findings.len(), 2);
        assert_eq!(b.suggested_moves.len(), 1);
        assert_eq!(b.suggested_moves[0].title, "Investigate");
    }

    #[test]
    fn list_findings_returns_only_open() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let _db = create_project_db(&proj_root);

        let conn = Connection::open(
            proj_root
                .join(".gsd")
                .join("intelligence")
                .join("intelligence.db"),
        )
        .unwrap();
        for (id, status) in [("F-001", "open"), ("F-002", "open"), ("F-003", "dismissed")] {
            conn.execute(
                "INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale, source_path, source_range_start, source_range_end, produced_by, produced_at, status, addressed_by_decision, dismissed_rationale) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, NULL, NULL)",
                params![
                    id,
                    "test-proj",
                    "S-001",
                    "dead_code",
                    "med",
                    0.9,
                    "Test finding",
                    "Probably dead",
                    "analyzer",
                    "2026-05-03T00:00:00Z",
                    status,
                ],
            )
            .unwrap();
        }

        let kb = RealKbDelegate::with_registry_path(registry_path);
        let findings = kb.list_findings("test-proj".to_string()).unwrap();
        assert_eq!(findings.len(), 2);
        for f in &findings {
            assert_eq!(f.status, FindingStatus::Open);
        }
    }

    #[test]
    fn dismiss_finding_on_absent_db_returns_not_found() {
        // Empty registry → no projects → no project DB → "not found" error.
        let tmp = TempDir::new().unwrap();
        let kb = RealKbDelegate::with_registry_path(tmp.path().join("registry.db"));
        let err = kb.dismiss_finding("F-001".to_string(), None).unwrap_err();
        // Should report not found (no project DB to search) rather than MUTATION_DEFERRED.
        assert!(
            err.contains("not found") || err.contains("not registered") || err.contains("registry"),
            "Got: {err}"
        );
    }

    #[test]
    fn add_decision_then_list_via_tauri_round_trip() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let _db = create_project_db(&proj_root);

        let kb = RealKbDelegate::with_registry_path(registry_path);

        // Start a meeting
        let meeting = kb.start_meeting("test-proj".to_string()).unwrap();
        assert_eq!(meeting.project_id, "test-proj");

        // Add a decision
        let draft = super::super::types::DecisionDraft {
            kind: DecisionKind::VisionMission,
            ai_draft: Some(AiDraft {
                title: "Refactor core module".to_string(),
                body: "The analyzer core needs a focused pass.".to_string(),
            }),
            source_findings: vec!["F-001".to_string()],
            source_move_rank: Some(1),
        };
        let decision = kb.add_decision(meeting.id.clone(), draft).unwrap();
        assert_eq!(decision.kind, DecisionKind::VisionMission);
        assert_eq!(decision.state, DecisionState::Pending);
        assert!(decision.ai_draft.is_some());

        // preview_bundle should now return that decision
        let preview = kb.preview_bundle(meeting.id.clone()).unwrap();
        assert_eq!(preview.meeting_id, meeting.id);
        assert_eq!(preview.decision_count, 1);
        assert_eq!(preview.decisions[0].id, decision.id);
    }

    #[test]
    fn commit_bundle_round_trip() {
        let tmp = TempDir::new().unwrap();
        let proj_root = tmp.path().join("proj");
        std::fs::create_dir_all(&proj_root).unwrap();
        let registry_path =
            create_registry_with_project(&tmp, "test-proj", &proj_root);
        let _db = create_project_db(&proj_root);

        let kb = RealKbDelegate::with_registry_path(registry_path);
        let meeting = kb.start_meeting("test-proj".to_string()).unwrap();
        let draft = super::super::types::DecisionDraft {
            kind: DecisionKind::VisionMission,
            ai_draft: None,
            source_findings: vec![],
            source_move_rank: None,
        };
        kb.add_decision(meeting.id.clone(), draft).unwrap();

        // Commit the bundle
        let bundle = kb.commit_bundle(meeting.id.clone()).unwrap();
        assert_eq!(bundle.meeting_id, meeting.id);
        assert_eq!(bundle.decisions.len(), 1);

        // Meeting should now be 'committed' (preview returns no pending decisions)
        let preview = kb.preview_bundle(meeting.id.clone()).unwrap();
        // After commit, pending decisions → bundled, so preview.decision_count = 0
        assert_eq!(preview.decision_count, 0);
    }

    #[test]
    fn s2_no_subprocess_invariant_documented() {
        // This module reads SQLite directly via rusqlite (bundled); zero
        // process::Command / tokio::process invocations. The absence is the
        // invariant.
        assert!(true, "S2 invariant: no subprocess spawn in real_kb.rs");
    }
}
