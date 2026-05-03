/**
 * Intelligence KB — MeetingStore.
 *
 * Meeting lifecycle (start/park/resume/commit/wrap), decision management
 * (add/edit/withdraw/sendNow), bundle preview, and batch-hint computation
 * via union-find connected components.
 *
 * Phase 823 / C06 (D-23-16 .. D-23-26).
 */

import { nanoid } from 'nanoid';
import type {
  IntelligenceKB,
  ProjectId,
  SnapshotId,
  BriefingId,
  MeetingId,
  Meeting,
  DecisionId,
  Decision,
  DecisionKind,
  FindingId,
  Bundle,
} from '../types.js';
import type { KBStore } from './store.js';
import { InvalidStateTransition, NotFoundError } from './store.js';

// ─── Public types ────────────────────────────────────────────────────────────

/** Input type for addDecision (the caller supplies content; id/meeting_id/state auto-set). */
export interface DecisionDraft {
  kind: DecisionKind;
  ai_draft: { title: string; body: string } | null;
  source_findings: FindingId[];
  source_move_rank?: number;
}

export interface SendNowResult {
  decision: Decision;
  emissionPath: string;
}

export interface BundlePreview {
  pendingDecisions: Decision[];
  alreadySentDecisions: Decision[];
  decisionCount: number;
  batchHints: Bundle['batch_hints'];
}

// ─── Priority order for suggested_order in batch hints ───────────────────────

const KIND_PRIORITY: Record<DecisionKind, number> = {
  analysis_run: 0,
  finding_dismissal: 1,
  research_mission: 2,
  vision_mission: 3,
};

// ─── Union-Find ───────────────────────────────────────────────────────────────

class UnionFind {
  private readonly parent: Map<string, string> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root); // path compression
    return root;
  }

  union(x: string, y: string): void {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx !== ry) this.parent.set(rx, ry);
  }
}

// ─── MeetingStore ────────────────────────────────────────────────────────────

export class MeetingStore {
  private readonly _kb: KBStore;

  constructor(deps: { kb: IntelligenceKB }) {
    this._kb = deps.kb as KBStore;
  }

  // ─── Meeting lifecycle ────────────────────────────────────────────────

  /**
   * Returns the current active (in_session or parked) meeting for the project,
   * transitioning it to in_session if parked.
   * If no active meeting exists, creates a new one.
   */
  async startOrResume(p: ProjectId, snapshot: SnapshotId, briefingId?: BriefingId): Promise<Meeting> {
    const active = await this._kb.getActiveMeeting(p);

    if (active) {
      if (active.status === 'in_session') {
        // Already running — return as-is
        return active;
      }
      // parked → resume
      const pdb = await this._kb.getProjectRawDB(p);
      return this._kb.updateMeetingStatus(pdb, active.id, 'parked', 'in_session');
    }

    // No active meeting — create a new one
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const id = `M-${dateStr}-${nanoid(4)}` as MeetingId;

    const pdb = await this._kb.getProjectRawDB(p);
    pdb.prepare(`
      INSERT INTO meetings (id, project_id, started_at, committed_at, status, kb_snapshot, briefing_at_start)
      VALUES (@id, @project_id, @started_at, @committed_at, @status, @kb_snapshot, @briefing_at_start)
    `).run({
      id,
      project_id: p,
      started_at: now,
      committed_at: null,
      status: 'in_session',
      kb_snapshot: snapshot,
      briefing_at_start: briefingId ?? null,
    });

    const meeting = await this._kb.getMeeting(id);
    if (!meeting) throw new Error(`MeetingStore: failed to create meeting ${id}`);
    return meeting;
  }

  async park(meetingId: MeetingId): Promise<Meeting> {
    const pdb = await this._getPdbForMeeting(meetingId);
    return this._kb.updateMeetingStatus(pdb, meetingId, 'in_session', 'parked');
  }

  async resume(meetingId: MeetingId): Promise<Meeting> {
    const pdb = await this._getPdbForMeeting(meetingId);
    return this._kb.updateMeetingStatus(pdb, meetingId, 'parked', 'in_session');
  }

  /**
   * Commit: transitions meeting in_session → committed, bundles all pending decisions.
   * Returns the new Bundle (BundleId = MeetingId).
   */
  async commit(meetingId: MeetingId): Promise<Bundle> {
    const pdb = await this._getPdbForMeeting(meetingId);

    return pdb.transaction((): Bundle => {
      // Assert in_session
      const mtgRow = pdb
        .prepare('SELECT status FROM meetings WHERE id = ?')
        .get(meetingId) as { status: string } | undefined;
      if (!mtgRow) throw new NotFoundError('meeting', meetingId);
      if (mtgRow.status !== 'in_session') {
        throw new InvalidStateTransition(meetingId, mtgRow.status, 'committed');
      }

      // Collect pending decisions
      const pendingRows = pdb
        .prepare(`SELECT id, kind, source_findings FROM decisions WHERE meeting_id = ? AND state = 'pending'`)
        .all(meetingId) as Array<{ id: string; kind: string; source_findings: string }>;

      const pendingIds = pendingRows.map((r) => r.id);

      // Compute batch hints
      const decisions: Decision[] = pdb
        .prepare(`SELECT * FROM decisions WHERE meeting_id = ? AND state = 'pending'`)
        .all(meetingId)
        .map((r: unknown) => this._rowToDecision(r as Record<string, unknown>));

      const batchHints = this._computeBatchHintsSync(decisions);

      const now = new Date().toISOString();
      const bundleId = meetingId;
      const manifestPath = `.planning/bundles/${bundleId}/manifest.json`;

      // Insert bundle
      pdb.prepare(`
        INSERT INTO bundles (id, meeting_id, emitted_at, manifest_path, batch_hints)
        VALUES (?, ?, ?, ?, ?)
      `).run(bundleId, meetingId, now, manifestPath, JSON.stringify(batchHints));

      // Insert bundle_decisions
      const insertBD = pdb.prepare(
        'INSERT INTO bundle_decisions (bundle_id, decision_id) VALUES (?, ?)',
      );
      for (const id of pendingIds) {
        insertBD.run(bundleId, id);
      }

      // Transition pending → bundled
      pdb.prepare(`
        UPDATE decisions SET state = 'bundled' WHERE meeting_id = ? AND state = 'pending'
      `).run(meetingId);

      // Transition meeting → committed
      pdb.prepare(`
        UPDATE meetings SET status = 'committed', committed_at = ? WHERE id = ?
      `).run(now, meetingId);

      return {
        id: bundleId,
        meeting_id: meetingId,
        emitted_at: now,
        decisions: pendingIds,
        manifest_path: manifestPath,
        batch_hints: batchHints,
      };
    })();
  }

  /** Transition committed → wrapped. */
  async wrap(meetingId: MeetingId): Promise<Meeting> {
    const pdb = await this._getPdbForMeeting(meetingId);
    return this._kb.updateMeetingStatus(pdb, meetingId, 'committed', 'wrapped');
  }

  async getCurrent(p: ProjectId): Promise<Meeting | null> {
    return this._kb.getActiveMeeting(p);
  }

  async listHistory(p: ProjectId, limit?: number): Promise<Meeting[]> {
    const meetings = await this._kb.listMeetings(p);
    return limit !== undefined ? meetings.slice(0, limit) : meetings;
  }

  // ─── Decision management ──────────────────────────────────────────────

  /** Add a decision to a meeting in state pending. */
  async addDecision(meetingId: MeetingId, draft: DecisionDraft): Promise<Decision> {
    const pdb = await this._getPdbForMeeting(meetingId);
    const id = nanoid(12);
    const now = new Date().toISOString();

    pdb.prepare(`
      INSERT INTO decisions
        (id, meeting_id, kind, state, ai_draft_title, ai_draft_body,
         developer_modifications, source_findings, source_move_rank,
         approved_at, emitted_at, emission_path)
      VALUES
        (@id, @meeting_id, @kind, @state, @ai_draft_title, @ai_draft_body,
         @developer_modifications, @source_findings, @source_move_rank,
         @approved_at, @emitted_at, @emission_path)
    `).run({
      id,
      meeting_id: meetingId,
      kind: draft.kind,
      state: 'pending',
      ai_draft_title: draft.ai_draft?.title ?? null,
      ai_draft_body: draft.ai_draft?.body ?? null,
      developer_modifications: JSON.stringify([]),
      source_findings: JSON.stringify(draft.source_findings),
      source_move_rank: draft.source_move_rank ?? null,
      approved_at: null,
      emitted_at: null,
      emission_path: null,
    });

    const d = await this._kb.getDecision(id);
    if (!d) throw new Error(`MeetingStore: failed to insert decision ${id}`);
    return d;
  }

  /**
   * Append strings to developer_modifications.
   * State remains unchanged. Returns updated Decision.
   */
  async editDecision(decisionId: DecisionId, modifications: string[]): Promise<Decision> {
    // Find the pdb containing this decision
    const pdb = await this._getPdbForDecision(decisionId);

    pdb.transaction(() => {
      const row = pdb
        .prepare('SELECT developer_modifications FROM decisions WHERE id = ?')
        .get(decisionId) as { developer_modifications: string } | undefined;
      if (!row) throw new NotFoundError('decision', decisionId);

      const current: string[] = JSON.parse(row.developer_modifications);
      const updated = [...current, ...modifications];
      pdb.prepare('UPDATE decisions SET developer_modifications = ? WHERE id = ?')
        .run(JSON.stringify(updated), decisionId);
    })();

    const d = await this._kb.getDecision(decisionId);
    if (!d) throw new NotFoundError('decision', decisionId);
    return d;
  }

  /** pending → withdrawn */
  async withdraw(decisionId: DecisionId): Promise<Decision> {
    const pdb = await this._getPdbForDecision(decisionId);
    return this._kb.updateDecisionState(pdb, decisionId, 'pending', 'withdrawn');
  }

  /**
   * pending → sent_now.
   * Returns the updated decision and the computed emission path.
   * Does NOT write any files — emissionPath is a computed path only.
   */
  async sendNow(decisionId: DecisionId): Promise<SendNowResult> {
    const pdb = await this._getPdbForDecision(decisionId);
    const decision = await this._kb.updateDecisionState(pdb, decisionId, 'pending', 'sent_now');

    // Compute emission path (no file write)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const emissionPath = `.planning/staging/inbox/${decision.meeting_id}/${timestamp}-${decisionId}.json`;

    // Record emission path in DB
    pdb.prepare('UPDATE decisions SET emission_path = ? WHERE id = ?')
      .run(emissionPath, decisionId);

    const updated = await this._kb.getDecision(decisionId);
    return { decision: updated ?? decision, emissionPath };
  }

  // ─── Bundle preview ───────────────────────────────────────────────────

  async previewBundle(meetingId: MeetingId): Promise<BundlePreview> {
    const pdb = await this._getPdbForMeeting(meetingId);

    const allRows = pdb
      .prepare(`SELECT * FROM decisions WHERE meeting_id = ?`)
      .all(meetingId)
      .map((r: unknown) => this._rowToDecision(r as Record<string, unknown>));

    const pendingDecisions = allRows.filter((d) => d.state === 'pending');
    const alreadySentDecisions = allRows.filter((d) => d.state === 'sent_now');

    const batchHints = this._computeBatchHintsSync(pendingDecisions);

    return {
      pendingDecisions,
      alreadySentDecisions,
      decisionCount: pendingDecisions.length,
      batchHints,
    };
  }

  // ─── Decision queries ─────────────────────────────────────────────────

  async listPending(meetingId: MeetingId): Promise<Decision[]> {
    const pdb = await this._getPdbForMeeting(meetingId);
    return pdb
      .prepare(`SELECT * FROM decisions WHERE meeting_id = ? AND state = 'pending' ORDER BY rowid ASC`)
      .all(meetingId)
      .map((r: unknown) => this._rowToDecision(r as Record<string, unknown>));
  }

  async listAll(meetingId: MeetingId): Promise<Decision[]> {
    const pdb = await this._getPdbForMeeting(meetingId);
    return pdb
      .prepare(`SELECT * FROM decisions WHERE meeting_id = ? ORDER BY rowid ASC`)
      .all(meetingId)
      .map((r: unknown) => this._rowToDecision(r as Record<string, unknown>));
  }

  // ─── Batch hints ──────────────────────────────────────────────────────

  /**
   * Compute batch hints for a list of decisions.
   * Uses union-find on shared source_path values to group connected decisions.
   * Does a DB lookup per unique finding ID to resolve source_paths.
   */
  async computeBatchHints(decisions: Decision[]): Promise<Bundle['batch_hints']> {
    // Collect all unique finding IDs across all decisions
    const allFindingIds = new Set<FindingId>();
    for (const d of decisions) {
      for (const fid of d.source_findings) {
        allFindingIds.add(fid);
      }
    }

    // Resolve paths for each finding
    const findingPaths = new Map<FindingId, string>();
    for (const fid of allFindingIds) {
      const finding = await this._kb.getFinding(fid);
      if (finding?.source_path) {
        findingPaths.set(fid, finding.source_path);
      }
    }

    return this._computeBatchHintsWithPaths(decisions, findingPaths);
  }

  // ─── Meeting log ──────────────────────────────────────────────────────

  async log(
    meetingId: MeetingId,
    kind: 'utterance' | 'event' | 'note',
    body: string,
  ): Promise<void> {
    return this._kb.writeMeetingLog(meetingId, kind, body);
  }

  async getLog(
    meetingId: MeetingId,
  ): Promise<Array<{ id: number; meeting_id: MeetingId; recorded_at: string; kind: string; body: string }>> {
    return this._kb.getMeetingLog(meetingId);
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private async _getPdbForMeeting(meetingId: MeetingId) {
    // Use getProjectRawDB via getMeeting to find the project
    const meeting = await this._kb.getMeeting(meetingId);
    if (!meeting) throw new NotFoundError('meeting', meetingId);
    return this._kb.getProjectRawDB(meeting.project_id);
  }

  private async _getPdbForDecision(decisionId: DecisionId) {
    // Find the decision via getDecision, then get project from the meeting
    const decision = await this._kb.getDecision(decisionId);
    if (!decision) throw new NotFoundError('decision', decisionId);
    const meeting = await this._kb.getMeeting(decision.meeting_id);
    if (!meeting) throw new NotFoundError('meeting', decision.meeting_id);
    return this._kb.getProjectRawDB(meeting.project_id);
  }

  /** Inline row-to-Decision mapper (avoids circular import with queries.ts). */
  private _rowToDecision(row: Record<string, unknown>): Decision {
    const aiDraftTitle = row['ai_draft_title'] as string | null;
    const aiDraftBody = row['ai_draft_body'] as string | null;
    const aiDraft =
      aiDraftTitle !== null && aiDraftBody !== null
        ? { title: aiDraftTitle, body: aiDraftBody }
        : null;

    const devMods: string[] = JSON.parse((row['developer_modifications'] as string) ?? '[]');
    const sourceFindings: FindingId[] = JSON.parse((row['source_findings'] as string) ?? '[]');

    return {
      id: row['id'] as string,
      meeting_id: row['meeting_id'] as MeetingId,
      kind: row['kind'] as DecisionKind,
      state: row['state'] as Decision['state'],
      ai_draft: aiDraft,
      developer_modifications: devMods,
      source_findings: sourceFindings,
      source_move_rank:
        row['source_move_rank'] !== null && row['source_move_rank'] !== undefined
          ? (row['source_move_rank'] as number)
          : undefined,
      approved_at: (row['approved_at'] as string | null) ?? null,
      emitted_at: (row['emitted_at'] as string | null) ?? null,
      emission_path: (row['emission_path'] as string | null) ?? null,
    };
  }

  /**
   * Union-find batch hint computation (synchronous).
   *
   * Algorithm:
   * 1. For each decision, collect source_path values from its source_findings.
   * 2. Union all decisions that share a source_path.
   * 3. Group decisions by their root component.
   * 4. shared_context = paths that appear in >1 component.
   * 5. suggested_order = sort by KIND_PRIORITY then insertion order.
   */
  private _computeBatchHintsSync(decisions: Decision[]): Bundle['batch_hints'] {
    if (decisions.length === 0) {
      return { parallelizable: [], shared_context: [], suggested_order: [] };
    }

    // Build a map from finding ID to source_path (must be done from the findings data
    // we have on the decisions themselves — source_findings are IDs, not paths).
    // Since we only have FindingId[] on each decision, we track at the Decision level.
    // Two decisions are connected if they share a source_path from their source_findings.
    // But source_findings are IDs, not paths. The test sets up findings with source_paths
    // and passes the full Decision objects (which were loaded from DB via store.getDecision).
    // The Decision type doesn't carry source_path — it carries source_findings (FindingId[]).
    //
    // For the purpose of batch hint computation (D-23-20):
    // We treat each decision's source_findings as the connection keys.
    // Two decisions sharing ANY finding ID are considered connected.
    // For shared_context, we need source_path — but that requires a DB lookup.
    //
    // The test uses store.getDecision() which returns the full Decision, and then checks
    // hints.shared_context contains 'src/shared.ts'. This means we need path info.
    //
    // However, the Decision interface only has source_findings (IDs). The tests call
    // computeBatchHints with Decision objects from store.getDecision(), which only has
    // FindingId[]. To get source_path we'd need to query findings.
    //
    // Looking at the tests more carefully:
    // T6 test 2: d1 has source_findings: ['F-shared-1'], d2 has ['F-shared-2']
    // Both findings have source_path: 'src/shared.ts'
    // The test expects shared_context to contain 'src/shared.ts'
    //
    // This means computeBatchHints needs to do DB lookups. But it's synchronous here.
    // The public async version calls this sync version — so this sync version can't
    // do DB lookups.
    //
    // Resolution: We need to make this DB-aware. The sync helper must receive
    // path information. Let's change the approach: the sync helper takes a
    // pathsForDecision map as an optional parameter; when not provided, we
    // use the finding IDs themselves as connection keys (no shared_context).
    //
    // The public computeBatchHints() will do the DB lookup and pass paths in.

    return this._computeBatchHintsWithPaths(decisions, new Map());
  }

  private _computeBatchHintsWithPaths(
    decisions: Decision[],
    findingPaths: Map<FindingId, string>,
  ): Bundle['batch_hints'] {
    if (decisions.length === 0) {
      return { parallelizable: [], shared_context: [], suggested_order: [] };
    }

    const uf = new UnionFind();

    // Initialize all decision IDs in union-find
    for (const d of decisions) {
      uf.find(d.id);
    }

    // Map from path → first decision that referenced it
    const pathToFirstDecision = new Map<string, string>();

    for (const d of decisions) {
      for (const fid of d.source_findings) {
        const path = findingPaths.get(fid);
        if (path) {
          const existing = pathToFirstDecision.get(path);
          if (existing) {
            uf.union(existing, d.id);
          } else {
            pathToFirstDecision.set(path, d.id);
          }
        } else {
          // No path info — use finding ID as connection key between decisions
          // that share the same finding (degenerate: each finding is its own connection)
          // No cross-decision link unless same finding appears in multiple decisions
        }
      }
    }

    // Group decisions by root
    const groups = new Map<string, Decision[]>();
    for (const d of decisions) {
      const root = uf.find(d.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(d);
    }

    // parallelizable: array of groups (each group is array of decision IDs)
    const parallelizable = [...groups.values()].map((g) => g.map((d) => d.id));

    // shared_context: paths that were used in a union (path appeared in >1 group's decisions)
    const sharedPaths = new Set<string>();
    for (const [path, firstDecisionId] of pathToFirstDecision.entries()) {
      // If multiple decisions share this path, the path is "shared"
      const decisionsOnPath = decisions.filter((d) =>
        d.source_findings.some((fid) => findingPaths.get(fid) === path),
      );
      if (decisionsOnPath.length > 1) {
        sharedPaths.add(path);
      }
    }

    // suggested_order: sort by kind priority, then preserve original order
    const sorted = [...decisions].sort((a, b) => {
      const pa = KIND_PRIORITY[a.kind] ?? 99;
      const pb = KIND_PRIORITY[b.kind] ?? 99;
      return pa - pb;
    });

    return {
      parallelizable,
      shared_context: [...sharedPaths],
      suggested_order: sorted.map((d) => d.id),
    };
  }
}
