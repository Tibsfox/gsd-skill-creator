/**
 * Intelligence Dashboard — shared type contracts.
 *
 * Source: `.planning/staging/inbox/intelligence-dashboard/components/00-shared-types.md`.
 * Consumed by every component in the GSD Intelligence Dashboard milestone (v1.49.597):
 * analyzer (C01-C03), KB store (C04-C06), local server + UI (C07-C09),
 * mission emitter / meeting record / AI investigator (C10-C12), integration (C13-C14).
 *
 * Module-boundary discipline: this file MUST NOT import from `@tauri-apps/api`,
 * the desktop webview, or any Tauri surface. It is a portable TypeScript contract.
 */

// ─── Project ───────────────────────────────────────────
export type ProjectId = string;
export type ProjectKind = 'code' | 'manuscript' | 'planning' | 'mixed';

export interface Project {
  id: ProjectId;
  name: string;
  /** Absolute filesystem path. */
  path: string;
  /** Git branch if applicable. */
  branch?: string;
  kind: ProjectKind;
  priority: 'high' | 'med' | 'low';
  /** ISO-8601 timestamp. */
  last_activity_at: string;
  last_snapshot_id: SnapshotId | null;
}

// ─── Findings ──────────────────────────────────────────
export type FindingId = `F-${string}`;

export type FindingKind =
  | 'dead_code'
  | 'hot_spot'
  | 'coupling_spike'
  | 'orphan_draft'
  | 'stalled_mission'
  | 'complexity_outlier'
  | 'churn_outlier';

export interface Finding {
  id: FindingId;
  project_id: ProjectId;
  kind: FindingKind;
  severity: 'high' | 'med' | 'low';
  /** 0..1 inclusive. */
  confidence: number;
  title: string;
  rationale: string;
  source_path?: string;
  source_range?: { start: number; end: number };
  produced_by: 'analyzer' | 'ai_investigator';
  /** ISO-8601 timestamp. */
  produced_at: string;
  snapshot_id: SnapshotId;
  status: 'open' | 'dismissed' | 'addressed';
  addressed_by_decision?: DecisionId;
  dismissed_rationale?: string;
}

// ─── Snapshots ─────────────────────────────────────────
export type SnapshotId = string;

export interface Snapshot {
  id: SnapshotId;
  project_id: ProjectId;
  /** ISO-8601 timestamp. */
  taken_at: string;
  git_sha?: string;
  files_scanned: number;
  loc_total: number;
  notes?: string;
}

// ─── Briefings ─────────────────────────────────────────
export type BriefingId = `B-${string}`;

export interface Briefing {
  id: BriefingId;
  project_id: ProjectId;
  snapshot_id: SnapshotId;
  /** ISO-8601 timestamp. */
  generated_at: string;
  /** 2-3 paragraphs; must contain causal hypothesis + uncertainty. */
  body: string;
  confidence: 'low' | 'medium' | 'high';
  source_findings: FindingId[];
  suggested_moves: SuggestedMove[];
}

export interface SuggestedMove {
  rank: number;
  title: string;
  kind: 'research' | 'vision' | 'review' | 'analyze';
  rationale: string;
  expected_unblocks?: string;
  source_findings: FindingId[];
}

// ─── Meetings & Decisions ──────────────────────────────
export type MeetingId = `M-${string}`;
export type DecisionId = string;
/** A bundle inherits its meeting's id. */
export type BundleId = MeetingId;

export interface Meeting {
  id: MeetingId;
  project_id: ProjectId;
  /** ISO-8601 timestamp. */
  started_at: string;
  /** ISO-8601 timestamp; null until commit. */
  committed_at: string | null;
  status: 'in_session' | 'parked' | 'committed' | 'wrapped';
  kb_snapshot: SnapshotId;
  briefing_at_start: BriefingId | null;
}

export type DecisionState = 'pending' | 'sent_now' | 'bundled' | 'withdrawn';

export type DecisionKind =
  | 'vision_mission'
  | 'research_mission'
  | 'analysis_run'
  | 'finding_dismissal';

export interface Decision {
  id: DecisionId;
  meeting_id: MeetingId;
  kind: DecisionKind;
  state: DecisionState;
  ai_draft: { title: string; body: string } | null;
  developer_modifications: string[];
  source_findings: FindingId[];
  source_move_rank?: number;
  /** ISO-8601 timestamp; null until approved. */
  approved_at: string | null;
  /** ISO-8601 timestamp; null until emitted. */
  emitted_at: string | null;
  /** Path to vision doc + meta in `staging/inbox/`; null until emitted. */
  emission_path: string | null;
}

// ─── Bundle ────────────────────────────────────────────
export interface Bundle {
  id: BundleId;
  meeting_id: MeetingId;
  /** ISO-8601 timestamp. */
  emitted_at: string;
  decisions: DecisionId[];
  manifest_path: string;
  batch_hints: {
    parallelizable: DecisionId[][];
    shared_context: string[];
    suggested_order: DecisionId[];
  };
}

// ─── Staging file format ───────────────────────────────
export interface VisionSeedMeta {
  request_id: string;
  kind: 'mission_seed';
  skill: 'vision-to-mission' | 'research-mission-generator';
  speed_hint: 'full' | 'fast' | 'mission-only';
  project: ProjectId;
  branch?: string;
  provenance: {
    source_findings: FindingId[];
    source_briefing: BriefingId | null;
    ai_confidence: 'low' | 'medium' | 'high' | null;
    ai_rank: number | null;
    ai_rationale: string | null;
    /** ISO-8601 timestamp. */
    developer_approved_at: string;
    developer_modifications: string[];
    meeting_id: MeetingId;
    meeting_excerpt_url: string;
    kb_snapshot: SnapshotId;
  };
  constraints: {
    max_research_searches?: number;
    crew_profile?: 'patrol' | 'squadron' | 'fleet';
    output_format?: 'three-file-pdf' | 'markdown-package';
  };
  bundle_id: BundleId | null;
}

// ─── Console request format (sync path) ────────────────
export type ConsoleRequestType =
  | 'intelligence.refresh_briefing'
  | 'intelligence.triage_finding'
  | 'intelligence.snapshot_diff'
  | 'intelligence.investigate_section'
  | 'intelligence.dismiss_finding';

export interface ConsoleRequest {
  id: string;
  type: ConsoleRequestType;
  project: ProjectId;
  branch?: string;
  payload: Record<string, unknown>;
  /** Path to the status file that the consumer should write to. */
  respond_to: string;
  timeout_hint_ms: number;
}

// ─── KB Query API stub interface ───────────────────────
/**
 * The query surface that downstream UI components compile against.
 * Real implementation lands in Phase 823 / Component 04 (kb-store).
 */
export interface IntelligenceKB {
  listProjects(opts?: { sort?: 'recent' | 'priority' | 'findings' }): Promise<Project[]>;
  getProject(id: ProjectId): Promise<Project | null>;
  getCurrentBriefing(p: ProjectId): Promise<Briefing | null>;
  listOpenFindings(p: ProjectId): Promise<Finding[]>;
  listInFlightWork(p: ProjectId): Promise<{ bundles: Bundle[]; decisions: Decision[] }>;
  listMeetings(p: ProjectId): Promise<Meeting[]>;
  startMeeting(p: ProjectId, snapshot: SnapshotId): Promise<Meeting>;
  addDecision(
    meetingId: MeetingId,
    d: Omit<Decision, 'id' | 'meeting_id'>,
  ): Promise<Decision>;
  promoteToSendNow(decisionId: DecisionId): Promise<Decision>;
  commitBundle(meetingId: MeetingId): Promise<Bundle>;
  parkMeeting(meetingId: MeetingId): Promise<Meeting>;
  dismissFinding(findingId: FindingId, rationale?: string): Promise<Finding>;
}
