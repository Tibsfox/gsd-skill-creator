//! Intelligence Dashboard — Rust mirror types.
//!
//! Mirrors the TypeScript contracts in `src/intelligence/types.ts`.
//! All types carry `serde(rename_all = "snake_case")` to match TS field names.
//!
//! Phase 824 / C07 — Track C parallel build against KB stub.

use serde::{Deserialize, Serialize};

// ─── Project ───────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProjectKind {
    Code,
    Manuscript,
    Planning,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Priority {
    High,
    Med,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub branch: Option<String>,
    pub kind: ProjectKind,
    pub priority: Priority,
    /// ISO-8601 timestamp.
    pub last_activity_at: String,
    pub last_snapshot_id: Option<String>,
}

// ─── Findings ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FindingKind {
    DeadCode,
    HotSpot,
    CouplingSpike,
    OrphanDraft,
    StalledMission,
    ComplexityOutlier,
    ChurnOutlier,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    High,
    Med,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FindingStatus {
    Open,
    Dismissed,
    Addressed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProducedBy {
    Analyzer,
    AiInvestigator,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Finding {
    pub id: String,
    pub project_id: String,
    pub kind: FindingKind,
    pub severity: Severity,
    /// 0.0..1.0 inclusive.
    pub confidence: f64,
    pub title: String,
    pub rationale: String,
    pub source_path: Option<String>,
    pub source_range: Option<SourceRange>,
    pub produced_by: ProducedBy,
    /// ISO-8601 timestamp.
    pub produced_at: String,
    pub snapshot_id: String,
    pub status: FindingStatus,
    pub addressed_by_decision: Option<String>,
    pub dismissed_rationale: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SourceRange {
    pub start: u64,
    pub end: u64,
}

// ─── Briefings ─────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Confidence {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MoveKind {
    Research,
    Vision,
    Review,
    Analyze,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SuggestedMove {
    pub rank: u32,
    pub title: String,
    pub kind: MoveKind,
    pub rationale: String,
    pub expected_unblocks: Option<String>,
    pub source_findings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Briefing {
    pub id: String,
    pub project_id: String,
    pub snapshot_id: String,
    /// ISO-8601 timestamp.
    pub generated_at: String,
    pub body: String,
    pub confidence: Confidence,
    pub source_findings: Vec<String>,
    pub suggested_moves: Vec<SuggestedMove>,
}

// ─── Meetings & Decisions ──────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MeetingStatus {
    InSession,
    Parked,
    Committed,
    Wrapped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Meeting {
    pub id: String,
    pub project_id: String,
    /// ISO-8601 timestamp.
    pub started_at: String,
    /// ISO-8601 timestamp; null until commit.
    pub committed_at: Option<String>,
    pub status: MeetingStatus,
    pub kb_snapshot: String,
    pub briefing_at_start: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DecisionState {
    Pending,
    SentNow,
    Bundled,
    Withdrawn,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DecisionKind {
    VisionMission,
    ResearchMission,
    AnalysisRun,
    FindingDismissal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct AiDraft {
    pub title: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Decision {
    pub id: String,
    pub meeting_id: String,
    pub kind: DecisionKind,
    pub state: DecisionState,
    pub ai_draft: Option<AiDraft>,
    pub developer_modifications: Vec<String>,
    pub source_findings: Vec<String>,
    pub source_move_rank: Option<u32>,
    /// ISO-8601 timestamp; null until approved.
    pub approved_at: Option<String>,
    /// ISO-8601 timestamp; null until emitted.
    pub emitted_at: Option<String>,
    pub emission_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DecisionDraft {
    pub kind: DecisionKind,
    pub ai_draft: Option<AiDraft>,
    pub source_findings: Vec<String>,
    pub source_move_rank: Option<u32>,
}

// ─── Bundle ────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BatchHints {
    pub parallelizable: Vec<Vec<String>>,
    pub shared_context: Vec<String>,
    pub suggested_order: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Bundle {
    pub id: String,
    pub meeting_id: String,
    /// ISO-8601 timestamp.
    pub emitted_at: String,
    pub decisions: Vec<String>,
    pub manifest_path: String,
    pub batch_hints: BatchHints,
}

// ─── Console request ───────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConsoleRequestType {
    #[serde(rename = "intelligence.refresh_briefing")]
    RefreshBriefing,
    #[serde(rename = "intelligence.triage_finding")]
    TriageFinding,
    #[serde(rename = "intelligence.snapshot_diff")]
    SnapshotDiff,
    #[serde(rename = "intelligence.investigate_section")]
    InvestigateSection,
    #[serde(rename = "intelligence.dismiss_finding")]
    DismissFinding,
    #[serde(rename = "intelligence.address_blocked_decision")]
    AddressBlockedDecision,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ConsoleRequest {
    pub id: String,
    pub r#type: String,
    pub project: String,
    pub branch: Option<String>,
    pub payload: serde_json::Value,
    pub respond_to: String,
    pub timeout_hint_ms: u64,
}

// ─── Status update event ───────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct StatusUpdateEvent {
    pub request_id: String,
    pub decision_id: Option<String>,
    pub bundle_id: Option<String>,
    pub project_id: String,
    pub state: String,
    pub sub_status: Option<String>,
    pub wave_progress: Option<WaveProgress>,
    pub result_path: Option<String>,
    pub block_reason: Option<String>,
    pub block_findings: Option<Vec<String>>,
    pub error: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct WaveProgress {
    pub current: u32,
    pub total: u32,
}

// ─── Additional result types ───────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SendNowResult {
    pub decision_id: String,
    pub emission_path: String,
    pub emitted_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BundlePreview {
    pub meeting_id: String,
    pub decision_count: u32,
    pub decisions: Vec<Decision>,
    pub batch_hints: BatchHints,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RequestId {
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct ProjectInput {
    pub name: String,
    pub path: String,
    pub branch: Option<String>,
    pub kind: ProjectKind,
    pub priority: Priority,
}

// ─── Event payloads ────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct FindingsUpdatedEvent {
    pub project_id: String,
    pub snapshot_id: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BriefingReadyEvent {
    pub project_id: String,
    pub briefing_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct MeetingRecordUpdatedEvent {
    pub meeting_id: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BundleCompletedEvent {
    pub bundle_id: String,
    pub project_id: String,
    pub summary: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_serializes_round_trip() {
        let p = Project {
            id: "gsd-skill-creator".to_string(),
            name: "GSD Skill Creator".to_string(),
            path: "/repo".to_string(),
            branch: Some("dev".to_string()),
            kind: ProjectKind::Code,
            priority: Priority::High,
            last_activity_at: "2026-05-03T00:00:00Z".to_string(),
            last_snapshot_id: None,
        };
        let json = serde_json::to_string(&p).unwrap();
        let back: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(back.id, p.id);
        assert_eq!(back.kind, ProjectKind::Code);
    }

    #[test]
    fn finding_serializes_round_trip() {
        let f = Finding {
            id: "F-dead01".to_string(),
            project_id: "gsd-skill-creator".to_string(),
            kind: FindingKind::DeadCode,
            severity: Severity::Med,
            confidence: 0.85,
            title: "Unused module".to_string(),
            rationale: "No callers found".to_string(),
            source_path: Some("src/old.ts".to_string()),
            source_range: Some(SourceRange { start: 1, end: 10 }),
            produced_by: ProducedBy::Analyzer,
            produced_at: "2026-05-03T00:00:00Z".to_string(),
            snapshot_id: "snap-01".to_string(),
            status: FindingStatus::Open,
            addressed_by_decision: None,
            dismissed_rationale: None,
        };
        let json = serde_json::to_string(&f).unwrap();
        let back: Finding = serde_json::from_str(&json).unwrap();
        assert_eq!(back.id, f.id);
        assert_eq!(back.status, FindingStatus::Open);
    }

    #[test]
    fn briefing_serializes_round_trip() {
        let b = Briefing {
            id: "B-001".to_string(),
            project_id: "gsd-skill-creator".to_string(),
            snapshot_id: "snap-01".to_string(),
            generated_at: "2026-05-03T00:00:00Z".to_string(),
            body: "Body text".to_string(),
            confidence: Confidence::Medium,
            source_findings: vec!["F-001".to_string()],
            suggested_moves: vec![SuggestedMove {
                rank: 1,
                title: "Investigate".to_string(),
                kind: MoveKind::Research,
                rationale: "Dead code spike".to_string(),
                expected_unblocks: None,
                source_findings: vec!["F-001".to_string()],
            }],
        };
        let json = serde_json::to_string(&b).unwrap();
        let back: Briefing = serde_json::from_str(&json).unwrap();
        assert_eq!(back.confidence, Confidence::Medium);
        assert_eq!(back.suggested_moves.len(), 1);
    }

    #[test]
    fn console_request_serializes() {
        let req = ConsoleRequest {
            id: "req_2026-05-03_0400_ab12".to_string(),
            r#type: "intelligence.refresh_briefing".to_string(),
            project: "gsd-skill-creator".to_string(),
            branch: Some("dev".to_string()),
            payload: serde_json::json!({ "since_snapshot": "v1.49+local" }),
            respond_to: ".planning/console/outbox/status/req_2026-05-03_0400_ab12.json".to_string(),
            timeout_hint_ms: 30000,
        };
        let json = serde_json::to_string(&req).unwrap();
        let back: ConsoleRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(back.id, req.id);
        assert_eq!(back.timeout_hint_ms, 30000);
    }

    #[test]
    fn status_update_event_round_trip() {
        let ev = StatusUpdateEvent {
            request_id: "req_abc".to_string(),
            decision_id: Some("dec-001".to_string()),
            bundle_id: Some("M-001".to_string()),
            project_id: "gsd-skill-creator".to_string(),
            state: "wave_1".to_string(),
            sub_status: Some("Wave 1 · 3 of 5 modules".to_string()),
            wave_progress: Some(WaveProgress { current: 3, total: 5 }),
            result_path: None,
            block_reason: None,
            block_findings: None,
            error: None,
            updated_at: "2026-05-03T04:00:00Z".to_string(),
        };
        let json = serde_json::to_string(&ev).unwrap();
        let back: StatusUpdateEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(back.state, "wave_1");
        assert_eq!(back.wave_progress.as_ref().unwrap().current, 3);
    }

    #[test]
    fn decision_draft_round_trip() {
        let d = DecisionDraft {
            kind: DecisionKind::ResearchMission,
            ai_draft: Some(AiDraft {
                title: "Investigate spike".to_string(),
                body: "Detailed rationale".to_string(),
            }),
            source_findings: vec!["F-001".to_string()],
            source_move_rank: Some(2),
        };
        let json = serde_json::to_string(&d).unwrap();
        let back: DecisionDraft = serde_json::from_str(&json).unwrap();
        assert_eq!(back.kind, DecisionKind::ResearchMission);
        assert!(back.ai_draft.is_some());
    }
}
