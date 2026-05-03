/**
 * Intelligence KB — type-safe query helpers and JSON-column parsers.
 *
 * All helpers throw on malformed JSON so corrupt rows surface as visible
 * failures rather than silent data loss (D-23-08).
 *
 * Phase 823 / C04 (D-23-08).
 */

import type {
  Finding,
  FindingId,
  SuggestedMove,
  Project,
  Snapshot,
  Briefing,
  Meeting,
  Decision,
  Bundle,
} from '../types.js';

// ─── JSON column parsers ───────────────────────────────────────────────────

export function parseFindingIdArray(text: string, context: string): FindingId[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`parseFindingIdArray(${context}): malformed JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`parseFindingIdArray(${context}): expected array, got ${typeof raw}`);
  }
  return raw as FindingId[];
}

export function parseStringArray(text: string, context: string): string[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`parseStringArray(${context}): malformed JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`parseStringArray(${context}): expected array, got ${typeof raw}`);
  }
  return raw as string[];
}

export function parseSuggestedMoves(text: string, context: string): SuggestedMove[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`parseSuggestedMoves(${context}): malformed JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`parseSuggestedMoves(${context}): expected array, got ${typeof raw}`);
  }
  return raw as SuggestedMove[];
}

export function parseBatchHints(
  text: string,
  context: string,
): Bundle['batch_hints'] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`parseBatchHints(${context}): malformed JSON: ${(err as Error).message}`);
  }
  return raw as Bundle['batch_hints'];
}

export function parseAiDraft(
  text: string | null,
  context: string,
): { title: string; body: string } | null {
  if (text === null) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`parseAiDraft(${context}): malformed JSON: ${(err as Error).message}`);
  }
  return raw as { title: string; body: string };
}

// ─── Row mappers ───────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string;
  name: string;
  path: string;
  branch: string | null;
  kind: string;
  priority: string;
  last_activity_at: string;
  last_snapshot_id: string | null;
}

export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    branch: row.branch ?? undefined,
    kind: row.kind as Project['kind'],
    priority: row.priority as Project['priority'],
    last_activity_at: row.last_activity_at,
    last_snapshot_id: row.last_snapshot_id,
  };
}

export interface SnapshotRow {
  id: string;
  project_id: string;
  taken_at: string;
  git_sha: string | null;
  files_scanned: number;
  loc_total: number;
  notes: string | null;
}

export function rowToSnapshot(row: SnapshotRow): Snapshot {
  return {
    id: row.id,
    project_id: row.project_id,
    taken_at: row.taken_at,
    git_sha: row.git_sha ?? undefined,
    files_scanned: row.files_scanned,
    loc_total: row.loc_total,
    notes: row.notes ?? undefined,
  };
}

export interface FindingRow {
  id: string;
  project_id: string;
  snapshot_id: string;
  kind: string;
  severity: string;
  confidence: number;
  title: string;
  rationale: string;
  source_path: string | null;
  source_range_start: number | null;
  source_range_end: number | null;
  produced_by: string;
  produced_at: string;
  status: string;
  addressed_by_decision: string | null;
  dismissed_rationale: string | null;
}

export function rowToFinding(row: FindingRow): Finding {
  return {
    id: row.id as Finding['id'],
    project_id: row.project_id,
    kind: row.kind as Finding['kind'],
    severity: row.severity as Finding['severity'],
    confidence: row.confidence,
    title: row.title,
    rationale: row.rationale,
    source_path: row.source_path ?? undefined,
    source_range:
      row.source_range_start !== null && row.source_range_end !== null
        ? { start: row.source_range_start, end: row.source_range_end }
        : undefined,
    produced_by: row.produced_by as Finding['produced_by'],
    produced_at: row.produced_at,
    snapshot_id: row.snapshot_id,
    status: row.status as Finding['status'],
    addressed_by_decision: row.addressed_by_decision ?? undefined,
    dismissed_rationale: row.dismissed_rationale ?? undefined,
  };
}

export interface BriefingRow {
  id: string;
  project_id: string;
  snapshot_id: string;
  generated_at: string;
  body: string;
  confidence: string;
  source_findings: string;
  suggested_moves: string;
}

export function rowToBriefing(row: BriefingRow): Briefing {
  return {
    id: row.id as Briefing['id'],
    project_id: row.project_id,
    snapshot_id: row.snapshot_id,
    generated_at: row.generated_at,
    body: row.body,
    confidence: row.confidence as Briefing['confidence'],
    source_findings: parseFindingIdArray(row.source_findings, `briefing ${row.id}`),
    suggested_moves: parseSuggestedMoves(row.suggested_moves, `briefing ${row.id}`),
  };
}

export interface MeetingRow {
  id: string;
  project_id: string;
  started_at: string;
  committed_at: string | null;
  status: string;
  kb_snapshot: string;
  briefing_at_start: string | null;
}

export function rowToMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id as Meeting['id'],
    project_id: row.project_id,
    started_at: row.started_at,
    committed_at: row.committed_at,
    status: row.status as Meeting['status'],
    kb_snapshot: row.kb_snapshot,
    briefing_at_start: row.briefing_at_start as Meeting['briefing_at_start'],
  };
}

export interface DecisionRow {
  id: string;
  meeting_id: string;
  kind: string;
  state: string;
  ai_draft_title: string | null;
  ai_draft_body: string | null;
  developer_modifications: string;
  source_findings: string;
  source_move_rank: number | null;
  approved_at: string | null;
  emitted_at: string | null;
  emission_path: string | null;
}

export function rowToDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    meeting_id: row.meeting_id as Decision['meeting_id'],
    kind: row.kind as Decision['kind'],
    state: row.state as Decision['state'],
    ai_draft:
      row.ai_draft_title !== null && row.ai_draft_body !== null
        ? { title: row.ai_draft_title, body: row.ai_draft_body }
        : null,
    developer_modifications: parseStringArray(
      row.developer_modifications,
      `decision ${row.id} developer_modifications`,
    ),
    source_findings: parseFindingIdArray(
      row.source_findings,
      `decision ${row.id} source_findings`,
    ),
    source_move_rank: row.source_move_rank ?? undefined,
    approved_at: row.approved_at,
    emitted_at: row.emitted_at,
    emission_path: row.emission_path,
  };
}

export interface BundleRow {
  id: string;
  meeting_id: string;
  emitted_at: string;
  manifest_path: string;
  batch_hints: string;
}

export function rowToBundle(row: BundleRow, decisions: string[]): Bundle {
  return {
    id: row.id as Bundle['id'],
    meeting_id: row.meeting_id as Bundle['meeting_id'],
    emitted_at: row.emitted_at,
    decisions,
    manifest_path: row.manifest_path,
    batch_hints: parseBatchHints(row.batch_hints, `bundle ${row.id}`),
  };
}
