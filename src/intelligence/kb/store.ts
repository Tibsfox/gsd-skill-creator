/**
 * Intelligence KB — real SQLite-backed implementation.
 *
 * Replaces the Phase 821 stub with a production KBStore.
 * Uses better-sqlite3 in WAL mode for dual-writer concurrency.
 *
 * Decisions honored:
 *   D-23-01..D-23-12, D-23-22..D-23-26.
 *
 * Phase 823 / C04.
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { nanoid } from 'nanoid';
import type {
  IntelligenceKB,
  Project,
  ProjectId,
  Finding,
  FindingId,
  Briefing,
  BriefingId,
  Meeting,
  MeetingId,
  Decision,
  DecisionId,
  Bundle,
  BundleId,
  BundlePreview,
  Snapshot,
  SnapshotId,
} from '../types.js';
import type { EventBus, IntelligenceEvent } from '../events/types.js';
import { applyMigrations } from './migrations.js';
import { SymbolsKB } from './symbols.js';
import { ProvenanceKB } from './provenance.js';
import {
  rowToProject,
  rowToFinding,
  rowToBriefing,
  rowToMeeting,
  rowToDecision,
  rowToBundle,
  rowToSnapshot,
  type ProjectRow,
  type FindingRow,
  type BriefingRow,
  type MeetingRow,
  type DecisionRow,
  type BundleRow,
  type SnapshotRow,
} from './queries.js';

// ─── Error types ───────────────────────────────────────────────────────────

export class InvalidStateTransition extends Error {
  constructor(
    public readonly id: string,
    public readonly currentState: string,
    public readonly targetState: string,
  ) {
    super(
      `InvalidStateTransition: ${id} is in state "${currentState}", cannot transition to "${targetState}"`,
    );
    this.name = 'InvalidStateTransition';
  }
}

export class NotFoundError extends Error {
  constructor(kind: string, id: string) {
    super(`NotFound: ${kind} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}

// ─── Options ───────────────────────────────────────────────────────────────

export interface KBStoreOptions {
  /** Path to the global registry DB. Default: ~/.gsd/intelligence/registry.db */
  registryPath?: string;
  /** Directory containing *.sql migration files. Default: src/intelligence/db/migrations/ */
  migrationsDir?: string;
  /** Busy-timeout ms for SQLite SQLITE_BUSY retries. Default: 5000. */
  busyTimeoutMs?: number;
}

/** Maximum cached project DB connections (LRU eviction at this count). */
const MAX_CACHED_DBS = 16;

// ─── KBStore ───────────────────────────────────────────────────────────────

export class KBStore implements IntelligenceKB {
  readonly registryPath: string;
  private readonly _migrationsDir: string;
  private readonly _busyTimeoutMs: number;

  private _registry: Database.Database | null = null;
  // Project DB cache: projectId → Database (insertion-order for LRU eviction)
  private readonly _projectDBs = new Map<string, Database.Database>();
  // Maps projectId → absolute path to project's intelligence.db
  private readonly _projectPaths = new Map<string, string>();
  // Atlas KB instance cache: projectId → SymbolsKB / ProvenanceKB.
  // Invalidated on atlasIndexingCompleted and on explicit clearAtlasKBCache().
  private readonly _symbolsKBs = new Map<string, SymbolsKB>();
  private readonly _provenanceKBs = new Map<string, ProvenanceKB>();
  // Phase 827 / C01 — optional event bus; C02 wires singleton at serve-dashboard startup.
  // When undefined, publish calls no-op (safe for tests that don't care about events).
  private _eventBus?: EventBus<IntelligenceEvent>;
  // Unsubscribe function returned when we subscribed to atlas:indexing.completed.
  // Set in setEventBus(); cleared in close().
  private _unsubIndexing?: () => void;

  constructor(opts?: KBStoreOptions) {
    this.registryPath =
      opts?.registryPath ??
      join(homedir(), '.gsd', 'intelligence', 'registry.db');

    this._migrationsDir =
      opts?.migrationsDir ??
      join(dirname(new URL(import.meta.url).pathname), '..', 'db', 'migrations');

    this._busyTimeoutMs = opts?.busyTimeoutMs ?? 5000;
  }

  /**
   * Wire the optional event bus (Phase 827 / C01).
   * Called by C02 at serve-dashboard startup; no-op in tests that don't need events.
   *
   * G2: also subscribes to atlas:indexing.completed to auto-invalidate the atlas
   * KB cache for the indexed project, then publishes atlas:cache.invalidated for
   * SSE telemetry. Any previous subscription is torn down before the new one is
   * installed (safe to call multiple times, e.g. in tests).
   */
  setEventBus(bus: EventBus<IntelligenceEvent>): void {
    this._unsubIndexing?.();
    this._eventBus = bus;
    this._unsubIndexing = bus.subscribe((event) => {
      if (event.type !== 'atlas:indexing.completed') return;
      const { project_id } = event.payload;
      this.clearAtlasKBCache(project_id);
      try {
        bus.publish({
          type: 'atlas:cache.invalidated',
          payload: { project_id, at: new Date().toISOString() },
        });
      } catch {
        // Telemetry publish failure must never propagate.
      }
    });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────

  /** Open + migrate the registry DB; idempotent. */
  async ensureRegistry(): Promise<void> {
    if (this._registry) return;
    mkdirSync(dirname(this.registryPath), { recursive: true });
    const db = new Database(this.registryPath);
    this._configureConnection(db);
    applyMigrations(db, this._migrationsDir);
    this._registry = db;
  }

  /** Open + migrate a per-project DB; idempotent. Caches connection. */
  async ensureProjectDB(projectId: ProjectId): Promise<void> {
    if (this._projectDBs.has(projectId)) return;

    // Resolve project row from registry
    const reg = this._requireRegistry();
    const projectRow = reg
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as ProjectRow | undefined;
    if (!projectRow) {
      throw new NotFoundError('project', projectId);
    }

    const projectPath = projectRow.path;
    const dbPath = join(projectPath, '.gsd', 'intelligence', 'intelligence.db');
    mkdirSync(dirname(dbPath), { recursive: true });

    const db = new Database(dbPath);
    this._configureConnection(db);
    applyMigrations(db, this._migrationsDir);

    // Mirror the project row into the per-project DB so FK constraints work
    db.prepare(`
      INSERT OR IGNORE INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
      VALUES (@id, @name, @path, @branch, @kind, @priority, @last_activity_at, @last_snapshot_id)
    `).run({
      id: projectRow.id,
      name: projectRow.name,
      path: projectRow.path,
      branch: projectRow.branch ?? null,
      kind: projectRow.kind,
      priority: projectRow.priority,
      last_activity_at: projectRow.last_activity_at,
      last_snapshot_id: projectRow.last_snapshot_id ?? null,
    });

    // LRU eviction
    if (this._projectDBs.size >= MAX_CACHED_DBS) {
      const oldest = this._projectDBs.keys().next().value;
      if (oldest !== undefined) {
        this._projectDBs.get(oldest)?.close();
        this._projectDBs.delete(oldest);
        this._projectPaths.delete(oldest);
      }
    }

    this._projectDBs.set(projectId, db);
    this._projectPaths.set(projectId, dbPath);
  }

  async migrate(db: Database.Database): Promise<void> {
    applyMigrations(db, this._migrationsDir);
  }

  close(): void {
    this._unsubIndexing?.();
    this._unsubIndexing = undefined;
    for (const db of this._projectDBs.values()) {
      db.close();
    }
    this._projectDBs.clear();
    this._projectPaths.clear();
    this._symbolsKBs.clear();
    this._provenanceKBs.clear();
    this._registry?.close();
    this._registry = null;
  }

  // ─── Test helpers (not in interface) ─────────────────────────────────

  registryJournalMode(): string {
    const reg = this._requireRegistry();
    const row = reg.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    return row.journal_mode;
  }

  registryForeignKeys(): number {
    const reg = this._requireRegistry();
    const row = reg.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    return row.foreign_keys;
  }

  cachedProjectDBCount(): number {
    return this._projectDBs.size;
  }

  cachedAtlasSymbolsKBCount(): number {
    return this._symbolsKBs.size;
  }

  cachedAtlasProvenanceKBCount(): number {
    return this._provenanceKBs.size;
  }

  // ─── IntelligenceKB: Projects ─────────────────────────────────────────

  async listProjects(
    opts?: { sort?: 'recent' | 'priority' | 'findings' },
  ): Promise<Project[]> {
    const reg = this._requireRegistry();

    if (opts?.sort === 'findings') {
      // Cross-DB aggregation: query each project's DB for open finding count
      const rows = reg
        .prepare('SELECT * FROM projects')
        .all() as ProjectRow[];

      const withCounts = await Promise.all(
        rows.map(async (row) => {
          let openCount = 0;
          try {
            await this.ensureProjectDB(row.id);
            const pdb = this._requireProjectDB(row.id);
            const cntRow = pdb
              .prepare("SELECT COUNT(*) AS n FROM findings WHERE project_id = ? AND status = 'open'")
              .get(row.id) as { n: number };
            openCount = cntRow.n;
          } catch {
            // Project DB might not exist yet; treat as 0
          }
          return { row, openCount };
        }),
      );

      withCounts.sort((a, b) => b.openCount - a.openCount);
      return withCounts.map((x) => rowToProject(x.row));
    }

    const orderBy =
      opts?.sort === 'priority'
        ? 'priority ASC, last_activity_at DESC, id ASC'
        : 'last_activity_at DESC, id ASC';

    const rows = reg
      .prepare(`SELECT * FROM projects ORDER BY ${orderBy}`)
      .all() as ProjectRow[];

    return rows.map(rowToProject);
  }

  async getProject(id: ProjectId): Promise<Project | null> {
    const reg = this._requireRegistry();
    const row = reg
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as ProjectRow | undefined;
    return row ? rowToProject(row) : null;
  }

  async registerProject(
    p: Omit<Project, 'last_snapshot_id'>,
  ): Promise<Project> {
    await this.ensureRegistry();
    const reg = this._requireRegistry();
    const now = new Date().toISOString();
    const project: Project = {
      ...p,
      last_snapshot_id: null,
    };

    reg.prepare(`
      INSERT INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
      VALUES (@id, @name, @path, @branch, @kind, @priority, @last_activity_at, @last_snapshot_id)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        path = excluded.path,
        branch = excluded.branch,
        kind = excluded.kind,
        priority = excluded.priority,
        last_activity_at = excluded.last_activity_at
    `).run({
      id: project.id,
      name: project.name,
      path: project.path,
      branch: project.branch ?? null,
      kind: project.kind,
      priority: project.priority,
      last_activity_at: p.last_activity_at ?? now,
      last_snapshot_id: null,
    });

    return project;
  }

  // ─── IntelligenceKB: Briefings ────────────────────────────────────────

  async getCurrentBriefing(p: ProjectId): Promise<Briefing | null> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const row = pdb
      .prepare(
        // Stabilized at v1.49.638 W1C C5 Stage 3: add rowid tiebreaker so
        // briefings written within the same millisecond sort deterministically
        // by insertion order (most recent insertion first). Mirrors the
        // listMeetings rowid fix at fcaacf057. Test exposure: auxiliary.test.ts
        // 'getCurrentBriefing returns most recent briefing for project'.
        `SELECT * FROM briefings WHERE project_id = ? ORDER BY generated_at DESC, rowid DESC LIMIT 1`,
      )
      .get(p) as BriefingRow | undefined;
    return row ? rowToBriefing(row) : null;
  }

  async writeBriefing(b: Omit<Briefing, 'id'>): Promise<Briefing> {
    await this.ensureProjectDB(b.project_id);
    const pdb = this._requireProjectDB(b.project_id);
    const id = `B-${nanoid(8)}` as BriefingId;
    const briefing: Briefing = { ...b, id };

    pdb.prepare(`
      INSERT INTO briefings (id, project_id, snapshot_id, generated_at, body, confidence, source_findings, suggested_moves)
      VALUES (@id, @project_id, @snapshot_id, @generated_at, @body, @confidence, @source_findings, @suggested_moves)
    `).run({
      id,
      project_id: briefing.project_id,
      snapshot_id: briefing.snapshot_id,
      generated_at: briefing.generated_at,
      body: briefing.body,
      confidence: briefing.confidence,
      source_findings: JSON.stringify(briefing.source_findings),
      suggested_moves: JSON.stringify(briefing.suggested_moves),
    });

    return briefing;
  }

  // ─── IntelligenceKB: Findings ─────────────────────────────────────────

  async listOpenFindings(p: ProjectId): Promise<Finding[]> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const rows = pdb
      .prepare(
        `SELECT * FROM findings WHERE project_id = ? AND status = 'open'`,
      )
      .all(p) as FindingRow[];
    return rows.map(rowToFinding);
  }

  async writeFindings(
    snapshotId: SnapshotId,
    projectId: ProjectId,
    findings: Finding[],
  ): Promise<void> {
    await this.ensureProjectDB(projectId);
    const pdb = this._requireProjectDB(projectId);
    const insert = pdb.prepare(`
      INSERT INTO findings
        (id, project_id, snapshot_id, kind, severity, confidence, title, rationale,
         source_path, source_range_start, source_range_end, produced_by, produced_at, status,
         addressed_by_decision, dismissed_rationale)
      VALUES
        (@id, @project_id, @snapshot_id, @kind, @severity, @confidence, @title, @rationale,
         @source_path, @source_range_start, @source_range_end, @produced_by, @produced_at, @status,
         @addressed_by_decision, @dismissed_rationale)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        severity = excluded.severity,
        confidence = excluded.confidence,
        title = excluded.title,
        rationale = excluded.rationale,
        source_path = excluded.source_path,
        source_range_start = excluded.source_range_start,
        source_range_end = excluded.source_range_end,
        status = excluded.status
    `);

    const txn = pdb.transaction((fs: Finding[]) => {
      for (const f of fs) {
        insert.run({
          id: f.id,
          project_id: f.project_id,
          snapshot_id: snapshotId,
          kind: f.kind,
          severity: f.severity,
          confidence: f.confidence,
          title: f.title,
          rationale: f.rationale,
          source_path: f.source_path ?? null,
          source_range_start: f.source_range?.start ?? null,
          source_range_end: f.source_range?.end ?? null,
          produced_by: f.produced_by,
          produced_at: f.produced_at,
          status: f.status,
          addressed_by_decision: f.addressed_by_decision ?? null,
          dismissed_rationale: f.dismissed_rationale ?? null,
        });
      }
    });
    txn(findings);
  }

  async dismissFinding(findingId: FindingId, rationale?: string): Promise<Finding> {
    // Find which project owns this finding
    const pdb = await this._findProjectDBForFinding(findingId);
    const result = pdb.prepare(`
      UPDATE findings SET status = 'dismissed', dismissed_rationale = ?
      WHERE id = ? AND status = 'open'
    `).run(rationale ?? null, findingId);

    if (result.changes === 0) {
      const row = pdb
        .prepare('SELECT status FROM findings WHERE id = ?')
        .get(findingId) as { status: string } | undefined;
      if (!row) throw new NotFoundError('finding', findingId);
      throw new InvalidStateTransition(findingId, row.status, 'dismissed');
    }

    const row = pdb
      .prepare('SELECT * FROM findings WHERE id = ?')
      .get(findingId) as FindingRow;
    return rowToFinding(row);
  }

  // ─── IntelligenceKB: Snapshots ────────────────────────────────────────

  async beginSnapshot(snapshotId: SnapshotId, projectId: ProjectId): Promise<void> {
    await this.ensureProjectDB(projectId);
    const pdb = this._requireProjectDB(projectId);
    // Insert with sentinel taken_at to mark in-progress; commitSnapshot replaces this.
    // The schema requires TEXT NOT NULL for taken_at, so use a sentinel marker.
    const sentinel = 'IN_PROGRESS';
    pdb.prepare(`
      INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total, notes)
      VALUES (?, ?, ?, NULL, 0, 0, 'in-progress')
    `).run(snapshotId, projectId, sentinel);
  }

  async commitSnapshot(snapshotId: SnapshotId): Promise<void> {
    // Find which project owns this snapshot
    const { pdb, projectId } = await this._findProjectDBForSnapshot(snapshotId);
    const txn = pdb.transaction(() => {
      const now = new Date().toISOString();
      // Replace sentinel taken_at with real timestamp
      pdb.prepare(`
        UPDATE snapshots SET taken_at = ?
        WHERE id = ? AND (taken_at = 'IN_PROGRESS' OR taken_at IS NULL)
      `).run(now, snapshotId);

      // Update project's last_snapshot_id in the project DB
      pdb.prepare(`
        UPDATE projects SET last_snapshot_id = ?, last_activity_at = ? WHERE id = ?
      `).run(snapshotId, now, projectId);
    });
    txn();

    // Also update registry so getProject reflects the new last_snapshot_id
    const reg = this._requireRegistry();
    const now = new Date().toISOString();
    reg.prepare(`
      UPDATE projects SET last_snapshot_id = ?, last_activity_at = ? WHERE id = ?
    `).run(snapshotId, now, projectId);
  }

  async rollbackSnapshot(snapshotId: SnapshotId): Promise<void> {
    // Find which project owns this snapshot
    const { pdb } = await this._findProjectDBForSnapshot(snapshotId);
    const txn = pdb.transaction(() => {
      // Delete findings under this snapshot
      pdb.prepare('DELETE FROM findings WHERE snapshot_id = ?').run(snapshotId);
      // Delete the snapshot row itself
      pdb.prepare('DELETE FROM snapshots WHERE id = ?').run(snapshotId);
    });
    txn();
  }

  async writeSnapshot(s: Omit<Snapshot, 'id'>): Promise<Snapshot> {
    await this.ensureProjectDB(s.project_id);
    const pdb = this._requireProjectDB(s.project_id);
    const id = `S-${nanoid(8)}`;
    const snapshot: Snapshot = { ...s, id };

    pdb.prepare(`
      INSERT INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total, notes)
      VALUES (@id, @project_id, @taken_at, @git_sha, @files_scanned, @loc_total, @notes)
    `).run({
      id,
      project_id: s.project_id,
      taken_at: s.taken_at,
      git_sha: s.git_sha ?? null,
      files_scanned: s.files_scanned,
      loc_total: s.loc_total,
      notes: s.notes ?? null,
    });

    return snapshot;
  }

  // ─── IntelligenceKB: Meetings ─────────────────────────────────────────

  async listMeetings(p: ProjectId): Promise<Meeting[]> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const rows = pdb
      .prepare(
        // Stabilized at v1.49.637 ship-time: add rowid tiebreaker so meetings
        // created within the same millisecond (test-suite hot path) sort
        // deterministically by insertion order (most recent insertion first).
        `SELECT * FROM meetings WHERE project_id = ? ORDER BY started_at DESC, rowid DESC`,
      )
      .all(p) as MeetingRow[];
    return rows.map(rowToMeeting);
  }

  async startMeeting(p: ProjectId, snapshot: SnapshotId): Promise<Meeting> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const id = `M-${dateStr}-${nanoid(4)}` as MeetingId;

    const meeting: Meeting = {
      id,
      project_id: p,
      started_at: now,
      committed_at: null,
      status: 'in_session',
      kb_snapshot: snapshot,
      briefing_at_start: null,
    };

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
      briefing_at_start: null,
    });

    return meeting;
  }

  async parkMeeting(meetingId: MeetingId): Promise<Meeting> {
    const { pdb } = await this._findProjectDBForMeeting(meetingId);
    const result = pdb.prepare(`
      UPDATE meetings SET status = 'parked' WHERE id = ? AND status = 'in_session'
    `).run(meetingId);

    if (result.changes === 0) {
      const row = pdb
        .prepare('SELECT status FROM meetings WHERE id = ?')
        .get(meetingId) as { status: string } | undefined;
      if (!row) throw new NotFoundError('meeting', meetingId);
      throw new InvalidStateTransition(meetingId, row.status, 'parked');
    }

    return this._getMeetingOrThrow(pdb, meetingId);
  }

  // ─── IntelligenceKB: Decisions ────────────────────────────────────────

  async addDecision(
    meetingId: MeetingId,
    d: Omit<Decision, 'id' | 'meeting_id'>,
  ): Promise<Decision> {
    const { pdb } = await this._findProjectDBForMeeting(meetingId);
    const id = nanoid(12);
    const decision: Decision = {
      ...d,
      id,
      meeting_id: meetingId,
    };

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
      kind: d.kind,
      state: d.state,
      ai_draft_title: d.ai_draft?.title ?? null,
      ai_draft_body: d.ai_draft?.body ?? null,
      developer_modifications: JSON.stringify(d.developer_modifications),
      source_findings: JSON.stringify(d.source_findings),
      source_move_rank: d.source_move_rank ?? null,
      approved_at: d.approved_at,
      emitted_at: d.emitted_at,
      emission_path: d.emission_path,
    });

    return decision;
  }

  async promoteToSendNow(decisionId: DecisionId): Promise<Decision> {
    const { pdb } = await this._findProjectDBForDecision(decisionId);
    const result = pdb.prepare(`
      UPDATE decisions SET state = 'sent_now' WHERE id = ? AND state = 'pending'
    `).run(decisionId);

    if (result.changes === 0) {
      const row = pdb
        .prepare('SELECT state FROM decisions WHERE id = ?')
        .get(decisionId) as { state: string } | undefined;
      if (!row) throw new NotFoundError('decision', decisionId);
      throw new InvalidStateTransition(decisionId, row.state, 'sent_now');
    }

    return this._getDecisionOrThrow(pdb, decisionId);
  }

  async commitBundle(meetingId: MeetingId): Promise<Bundle> {
    const { pdb } = await this._findProjectDBForMeeting(meetingId);
    const now = new Date().toISOString();
    const bundleId = meetingId as BundleId;

    const txn = pdb.transaction((): Bundle => {
      // Assert meeting is in_session
      const mtgRow = pdb
        .prepare('SELECT status FROM meetings WHERE id = ?')
        .get(meetingId) as { status: string } | undefined;
      if (!mtgRow) throw new NotFoundError('meeting', meetingId);
      if (mtgRow.status !== 'in_session') {
        throw new InvalidStateTransition(meetingId, mtgRow.status, 'committed');
      }

      // Get all pending decisions
      const pendingRows = pdb
        .prepare(`SELECT * FROM decisions WHERE meeting_id = ? AND state = 'pending'`)
        .all(meetingId) as DecisionRow[];
      const pendingDecisions = pendingRows.map(rowToDecision);

      // Compute batch hints (simplified placeholder — full logic in MeetingStore C06)
      const batchHints: Bundle['batch_hints'] = {
        parallelizable: pendingDecisions.map((d) => [d.id]),
        shared_context: [],
        suggested_order: pendingDecisions.map((d) => d.id),
      };

      // Insert bundle row
      const manifestPath = `.planning/bundles/${bundleId}/manifest.json`;
      pdb.prepare(`
        INSERT INTO bundles (id, meeting_id, emitted_at, manifest_path, batch_hints)
        VALUES (?, ?, ?, ?, ?)
      `).run(bundleId, meetingId, now, manifestPath, JSON.stringify(batchHints));

      // Insert bundle_decisions rows
      const insertBD = pdb.prepare(
        'INSERT INTO bundle_decisions (bundle_id, decision_id) VALUES (?, ?)',
      );
      for (const d of pendingDecisions) {
        insertBD.run(bundleId, d.id);
      }

      // Transition all pending → bundled
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
        decisions: pendingDecisions.map((d) => d.id),
        manifest_path: manifestPath,
        batch_hints: batchHints,
      };
    });

    return txn();
  }

  // ─── Phase 827 / C01 — editDecision, withdrawDecision, previewBundle ──

  /**
   * T1: Append entries to the `developer_modifications` JSON array column.
   * Modifications are append-only (existing entries preserved).
   * Emits `intelligence:findings_updated` via the optional event bus.
   */
  async editDecision(
    decisionId: DecisionId,
    modifications: string[],
  ): Promise<Decision> {
    await this.ensureRegistry();
    const { pdb, projectId } = await this._findProjectDBForDecision(decisionId);

    const txn = pdb.transaction(() => {
      const row = pdb
        .prepare('SELECT * FROM decisions WHERE id = ?')
        .get(decisionId) as DecisionRow | undefined;
      if (!row) throw new Error(`Decision ${decisionId} not found`);

      const existing: string[] = JSON.parse(row.developer_modifications || '[]');
      const merged = [...existing, ...modifications];

      pdb
        .prepare('UPDATE decisions SET developer_modifications = ? WHERE id = ?')
        .run(JSON.stringify(merged), decisionId);

      return pdb
        .prepare('SELECT * FROM decisions WHERE id = ?')
        .get(decisionId) as DecisionRow;
    });

    const updated = txn();
    const decision = rowToDecision(updated);

    // Bus.publish failures must NOT roll back the KB write (KB integrity > event delivery).
    try {
      this._eventBus?.publish({
        type: 'intelligence:findings_updated',
        payload: { project_id: projectId, added: [], removed: [], at: new Date().toISOString() },
      });
    } catch (err) {
      console.error('[KBStore] editDecision: event bus publish failed (ignored):', err);
    }

    return decision;
  }

  /**
   * T4/T5: Transition `state` column to `'withdrawn'`.
   * Idempotent: calling on an already-withdrawn decision returns the row, no error, no double-emit.
   */
  async withdrawDecision(decisionId: DecisionId): Promise<Decision> {
    await this.ensureRegistry();
    const { pdb, projectId } = await this._findProjectDBForDecision(decisionId);

    let wasAlreadyWithdrawn = false;

    const txn = pdb.transaction(() => {
      const row = pdb
        .prepare('SELECT * FROM decisions WHERE id = ?')
        .get(decisionId) as DecisionRow | undefined;
      if (!row) throw new Error(`Decision ${decisionId} not found`);

      if (row.state === 'withdrawn') {
        wasAlreadyWithdrawn = true;
        return row; // idempotent — no UPDATE, no emit
      }

      pdb
        .prepare('UPDATE decisions SET state = ? WHERE id = ?')
        .run('withdrawn', decisionId);
      return pdb
        .prepare('SELECT * FROM decisions WHERE id = ?')
        .get(decisionId) as DecisionRow;
    });

    const updated = txn();
    const decision = rowToDecision(updated);

    // Only emit on the real state transition, not on no-op idempotent retries.
    if (!wasAlreadyWithdrawn) {
      try {
        this._eventBus?.publish({
          type: 'intelligence:findings_updated',
          payload: { project_id: projectId, added: [], removed: [], at: new Date().toISOString() },
        });
      } catch (err) {
        console.error('[KBStore] withdrawDecision: event bus publish failed (ignored):', err);
      }
    }

    return decision;
  }

  /**
   * T6/T7: Read-only query of pending decisions for the meeting.
   * No event emission (preview is a read).
   */
  async previewBundle(meetingId: MeetingId): Promise<BundlePreview> {
    await this.ensureRegistry();
    const { pdb } = await this._findProjectDBForMeeting(meetingId);

    const rows = pdb
      .prepare('SELECT * FROM decisions WHERE meeting_id = ? AND state = ?')
      .all(meetingId, 'pending') as DecisionRow[];

    return {
      meeting_id: meetingId,
      decision_count: rows.length,
      decisions: rows.map(rowToDecision),
    };
  }

  // ─── IntelligenceKB: In-flight work ──────────────────────────────────

  async listInFlightWork(
    p: ProjectId,
  ): Promise<{ bundles: Bundle[]; decisions: Decision[] }> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);

    // Bundles for this project (via meeting_id → project_id)
    const bundleRows = pdb
      .prepare(`
        SELECT b.* FROM bundles b
        JOIN meetings m ON m.id = b.meeting_id
        WHERE m.project_id = ?
        ORDER BY b.emitted_at DESC, b.id DESC
      `)
      .all(p) as BundleRow[];

    const bundles: Bundle[] = bundleRows.map((br) => {
      const decisionIds = (
        pdb
          .prepare('SELECT decision_id FROM bundle_decisions WHERE bundle_id = ?')
          .all(br.id) as Array<{ decision_id: string }>
      ).map((r) => r.decision_id);
      return rowToBundle(br, decisionIds);
    });

    // Active (non-terminal) decisions
    const decisionRows = pdb
      .prepare(`
        SELECT d.* FROM decisions d
        JOIN meetings m ON m.id = d.meeting_id
        WHERE m.project_id = ? AND d.state NOT IN ('bundled', 'withdrawn')
      `)
      .all(p) as DecisionRow[];

    return { bundles, decisions: decisionRows.map(rowToDecision) };
  }

  // ─── Meeting log ──────────────────────────────────────────────────────

  async writeMeetingLog(
    meetingId: MeetingId,
    kind: 'utterance' | 'event' | 'note',
    body: string,
  ): Promise<void> {
    const { pdb } = await this._findProjectDBForMeeting(meetingId);
    pdb.prepare(`
      INSERT INTO meeting_log (meeting_id, recorded_at, kind, body)
      VALUES (?, ?, ?, ?)
    `).run(meetingId, new Date().toISOString(), kind, body);
  }

  async getMeetingLog(
    meetingId: MeetingId,
  ): Promise<Array<{ id: number; meeting_id: MeetingId; recorded_at: string; kind: string; body: string }>> {
    const { pdb } = await this._findProjectDBForMeeting(meetingId);
    return pdb
      .prepare(
        `SELECT * FROM meeting_log WHERE meeting_id = ? ORDER BY recorded_at ASC, id ASC`,
      )
      .all(meetingId) as Array<{ id: number; meeting_id: MeetingId; recorded_at: string; kind: string; body: string }>;
  }

  // ─── Mission links ────────────────────────────────────────────────────

  async addMissionLink(
    decisionId: DecisionId,
    kind: string,
    ref: string,
  ): Promise<void> {
    const { pdb } = await this._findProjectDBForDecision(decisionId);
    pdb.prepare(`
      INSERT INTO mission_links (decision_id, artifact_kind, artifact_ref, recorded_at)
      VALUES (?, ?, ?, ?)
    `).run(decisionId, kind, ref, new Date().toISOString());
  }

  // ─── Snapshot reads (used by SnapshotManager C05) ────────────────────

  async listSnapshotsForProject(p: ProjectId): Promise<Snapshot[]> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const rows = pdb
      .prepare(
        // Stabilized at v1.49.638 W1C C5 Stage 3: add rowid tiebreaker so
        // snapshots taken within the same millisecond sort deterministically
        // by insertion order. Mirrors listMeetings rowid fix at fcaacf057.
        // Test exposure: snapshot-manager.test.ts T2 listSnapshots DESC order.
        `SELECT * FROM snapshots WHERE project_id = ?
        AND taken_at IS NOT NULL AND taken_at != 'IN_PROGRESS'
        ORDER BY taken_at DESC, rowid DESC`,
      )
      .all(p) as SnapshotRow[];
    return rows.map(rowToSnapshot);
  }

  async listFindingsAt(snapshotId: SnapshotId): Promise<Finding[]> {
    // Try to find which project DB has this snapshot
    // We need to iterate registered projects (used by SnapshotManager)
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;

    for (const { id: projectId } of projects) {
      try {
        await this.ensureProjectDB(projectId);
        const pdb = this._requireProjectDB(projectId);
        const row = pdb
          .prepare('SELECT id FROM snapshots WHERE id = ?')
          .get(snapshotId) as { id: string } | undefined;
        if (row) {
          const rows = pdb
            .prepare('SELECT * FROM findings WHERE snapshot_id = ?')
            .all(snapshotId) as FindingRow[];
          return rows.map(rowToFinding);
        }
      } catch {
        // Continue searching
      }
    }
    return [];
  }

  async listFindingsAtForProject(
    projectId: ProjectId,
    snapshotId: SnapshotId,
  ): Promise<Finding[]> {
    await this.ensureProjectDB(projectId);
    const pdb = this._requireProjectDB(projectId);
    const rows = pdb
      .prepare('SELECT * FROM findings WHERE snapshot_id = ?')
      .all(snapshotId) as FindingRow[];
    return rows.map(rowToFinding);
  }

  async getFinding(findingId: FindingId): Promise<Finding | null> {
    // Try all open project DBs first, then scan registry
    for (const pdb of this._projectDBs.values()) {
      const row = pdb
        .prepare('SELECT * FROM findings WHERE id = ?')
        .get(findingId) as FindingRow | undefined;
      if (row) return rowToFinding(row);
    }
    return null;
  }

  async getProjectForSnapshot(
    snapshotId: SnapshotId,
  ): Promise<ProjectId | null> {
    for (const [projectId, pdb] of this._projectDBs.entries()) {
      const row = pdb
        .prepare('SELECT project_id FROM snapshots WHERE id = ?')
        .get(snapshotId) as { project_id: string } | undefined;
      if (row) return row.project_id as ProjectId;
    }
    // Try from registry-listed projects
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;
    for (const { id } of projects) {
      try {
        await this.ensureProjectDB(id);
        const pdb = this._requireProjectDB(id);
        const row = pdb
          .prepare('SELECT project_id FROM snapshots WHERE id = ?')
          .get(snapshotId) as { project_id: string } | undefined;
        if (row) return row.project_id as ProjectId;
      } catch {
        // Continue
      }
    }
    return null;
  }

  // ─── Snapshot diff cache helpers (used by SnapshotManager C05) ────────

  async getSnapshotDiffCache(
    from: SnapshotId,
    to: SnapshotId,
  ): Promise<{ payload_json: string } | null> {
    // snapshot_diffs is in the project DB; find it via snapshot lookup
    for (const pdb of this._projectDBs.values()) {
      try {
        const row = pdb
          .prepare(
            'SELECT payload_json FROM snapshot_diffs WHERE from_snapshot = ? AND to_snapshot = ?',
          )
          .get(from, to) as { payload_json: string } | undefined;
        if (row) return row;
      } catch {
        // Table may not exist yet (before migration 002)
      }
    }
    return null;
  }

  async setSnapshotDiffCache(
    from: SnapshotId,
    to: SnapshotId,
    projectId: ProjectId,
    payloadJson: string,
  ): Promise<void> {
    await this.ensureProjectDB(projectId);
    const pdb = this._requireProjectDB(projectId);
    try {
      pdb.prepare(`
        INSERT OR REPLACE INTO snapshot_diffs (from_snapshot, to_snapshot, computed_at, payload_json)
        VALUES (?, ?, ?, ?)
      `).run(from, to, new Date().toISOString(), payloadJson);
    } catch {
      // Table may not exist yet if migration 002 not applied — silently skip
    }
  }

  // ─── File metrics helpers (used by SnapshotManager C05) ──────────────

  async getFileMetrics(
    snapshotId: SnapshotId,
    filePath: string,
  ): Promise<{ exports_json: string; imports_json: string; signatures_json: string } | null> {
    for (const pdb of this._projectDBs.values()) {
      try {
        const row = pdb
          .prepare(
            'SELECT exports_json, imports_json, signatures_json FROM file_metrics WHERE snapshot_id = ? AND file_path = ?',
          )
          .get(snapshotId, filePath) as
          | { exports_json: string; imports_json: string; signatures_json: string }
          | undefined;
        if (row) return row;
      } catch {
        // Table may not exist yet
      }
    }
    return null;
  }

  async writeFileMetrics(
    snapshotId: SnapshotId,
    projectId: ProjectId,
    filePath: string,
    exports: string[],
    imports: string[],
    signatures: string[],
  ): Promise<void> {
    await this.ensureProjectDB(projectId);
    const pdb = this._requireProjectDB(projectId);
    try {
      pdb.prepare(`
        INSERT OR REPLACE INTO file_metrics (snapshot_id, file_path, exports_json, imports_json, signatures_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        snapshotId,
        filePath,
        JSON.stringify(exports),
        JSON.stringify(imports),
        JSON.stringify(signatures),
      );
    } catch {
      // Table may not exist yet — silently skip
    }
  }

  // ─── Meeting/decision state queries (used by MeetingStore C06) ────────

  async getMeeting(meetingId: MeetingId): Promise<Meeting | null> {
    for (const pdb of this._projectDBs.values()) {
      const row = pdb
        .prepare('SELECT * FROM meetings WHERE id = ?')
        .get(meetingId) as MeetingRow | undefined;
      if (row) return rowToMeeting(row);
    }
    return null;
  }

  async getDecision(decisionId: DecisionId): Promise<Decision | null> {
    for (const pdb of this._projectDBs.values()) {
      const row = pdb
        .prepare('SELECT * FROM decisions WHERE id = ?')
        .get(decisionId) as DecisionRow | undefined;
      if (row) return rowToDecision(row);
    }
    return null;
  }

  async getActiveMeeting(p: ProjectId): Promise<Meeting | null> {
    await this.ensureProjectDB(p);
    const pdb = this._requireProjectDB(p);
    const row = pdb
      .prepare(`
        SELECT * FROM meetings WHERE project_id = ? AND status IN ('in_session', 'parked')
        ORDER BY started_at DESC LIMIT 1
      `)
      .get(p) as MeetingRow | undefined;
    return row ? rowToMeeting(row) : null;
  }

  async updateMeetingStatus(
    pdb: Database.Database,
    meetingId: MeetingId,
    fromStatus: string,
    toStatus: string,
    extra?: { committed_at?: string },
  ): Promise<Meeting> {
    const result = pdb.prepare(`
      UPDATE meetings SET status = @toStatus ${extra?.committed_at ? ', committed_at = @committed_at' : ''}
      WHERE id = @id AND status = @fromStatus
    `).run({
      id: meetingId,
      fromStatus,
      toStatus,
      committed_at: extra?.committed_at,
    });

    if (result.changes === 0) {
      const row = pdb
        .prepare('SELECT status FROM meetings WHERE id = ?')
        .get(meetingId) as { status: string } | undefined;
      if (!row) throw new NotFoundError('meeting', meetingId);
      throw new InvalidStateTransition(meetingId, row.status, toStatus);
    }

    return this._getMeetingOrThrow(pdb, meetingId);
  }

  async updateDecisionState(
    pdb: Database.Database,
    decisionId: DecisionId,
    fromState: string,
    toState: string,
  ): Promise<Decision> {
    const result = pdb.prepare(`
      UPDATE decisions SET state = ? WHERE id = ? AND state = ?
    `).run(toState, decisionId, fromState);

    if (result.changes === 0) {
      const row = pdb
        .prepare('SELECT state FROM decisions WHERE id = ?')
        .get(decisionId) as { state: string } | undefined;
      if (!row) throw new NotFoundError('decision', decisionId);
      throw new InvalidStateTransition(decisionId, row.state, toState);
    }

    return this._getDecisionOrThrow(pdb, decisionId);
  }

  /** Get the raw better-sqlite3 Database for a project (used by MeetingStore). */
  async getProjectRawDB(projectId: ProjectId): Promise<Database.Database> {
    await this.ensureProjectDB(projectId);
    return this._requireProjectDB(projectId);
  }

  // ─── Atlas KB accessors (connection-caching layer, F3) ────────────────

  /**
   * Return a cached SymbolsKB for the given project. The instance is
   * constructed once per project per KBStore lifetime and reused on every
   * subsequent call, so the prepared-statement cache inside SymbolsKB
   * accumulates across the 4-6 sequential Sankey atlas calls instead of
   * being thrown away each time.
   *
   * Invalidation: call clearAtlasKBCache(projectId) after an
   * atlasIndexingCompleted event so the next caller gets a fresh instance
   * backed by the newly-written DB rows.
   */
  async getAtlasSymbolsKB(projectId: ProjectId): Promise<SymbolsKB> {
    const cached = this._symbolsKBs.get(projectId);
    if (cached) return cached;
    await this.ensureProjectDB(projectId);
    const db = this._requireProjectDB(projectId);
    const kb = new SymbolsKB(db);
    this._symbolsKBs.set(projectId, kb);
    return kb;
  }

  /**
   * Return a cached ProvenanceKB for the given project. Same lifecycle as
   * getAtlasSymbolsKB.
   */
  async getAtlasProvenanceKB(projectId: ProjectId): Promise<ProvenanceKB> {
    const cached = this._provenanceKBs.get(projectId);
    if (cached) return cached;
    await this.ensureProjectDB(projectId);
    const db = this._requireProjectDB(projectId);
    const kb = new ProvenanceKB(db);
    this._provenanceKBs.set(projectId, kb);
    return kb;
  }

  /**
   * Invalidate the atlas KB cache for a single project (or all projects when
   * projectId is omitted). Call after an atlasIndexingCompleted event to force
   * re-open on the next accessor call.
   */
  clearAtlasKBCache(projectId?: ProjectId): void {
    if (projectId === undefined) {
      this._symbolsKBs.clear();
      this._provenanceKBs.clear();
    } else {
      this._symbolsKBs.delete(projectId);
      this._provenanceKBs.delete(projectId);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private _configureConnection(db: Database.Database): void {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma(`busy_timeout = ${this._busyTimeoutMs}`);
  }

  private _requireRegistry(): Database.Database {
    if (!this._registry) {
      throw new Error(
        'KBStore: registry not open. Call ensureRegistry() first.',
      );
    }
    return this._registry;
  }

  private _requireProjectDB(projectId: ProjectId): Database.Database {
    const db = this._projectDBs.get(projectId);
    if (!db) {
      throw new Error(
        `KBStore: project DB for "${projectId}" not open. Call ensureProjectDB() first.`,
      );
    }
    return db;
  }

  private async _findProjectDBForFinding(
    findingId: FindingId,
  ): Promise<Database.Database> {
    // Search open DBs first
    for (const pdb of this._projectDBs.values()) {
      const row = pdb
        .prepare('SELECT id FROM findings WHERE id = ?')
        .get(findingId) as { id: string } | undefined;
      if (row) return pdb;
    }
    // Try from registry
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;
    for (const { id } of projects) {
      await this.ensureProjectDB(id);
      const pdb = this._requireProjectDB(id);
      const row = pdb
        .prepare('SELECT id FROM findings WHERE id = ?')
        .get(findingId) as { id: string } | undefined;
      if (row) return pdb;
    }
    throw new NotFoundError('finding', findingId);
  }

  private async _findProjectDBForSnapshot(
    snapshotId: SnapshotId,
  ): Promise<{ pdb: Database.Database; projectId: string }> {
    for (const [pid, pdb] of this._projectDBs.entries()) {
      const row = pdb
        .prepare('SELECT project_id FROM snapshots WHERE id = ?')
        .get(snapshotId) as { project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    // Try registry
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;
    for (const { id } of projects) {
      await this.ensureProjectDB(id);
      const pdb = this._requireProjectDB(id);
      const row = pdb
        .prepare('SELECT project_id FROM snapshots WHERE id = ?')
        .get(snapshotId) as { project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    throw new NotFoundError('snapshot', snapshotId);
  }

  private async _findProjectDBForMeeting(
    meetingId: MeetingId,
  ): Promise<{ pdb: Database.Database; projectId: string }> {
    for (const [pid, pdb] of this._projectDBs.entries()) {
      const row = pdb
        .prepare('SELECT project_id FROM meetings WHERE id = ?')
        .get(meetingId) as { project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;
    for (const { id } of projects) {
      await this.ensureProjectDB(id);
      const pdb = this._requireProjectDB(id);
      const row = pdb
        .prepare('SELECT project_id FROM meetings WHERE id = ?')
        .get(meetingId) as { project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    throw new NotFoundError('meeting', meetingId);
  }

  private async _findProjectDBForDecision(
    decisionId: DecisionId,
  ): Promise<{ pdb: Database.Database; projectId: string }> {
    for (const [pid, pdb] of this._projectDBs.entries()) {
      const row = pdb
        .prepare('SELECT d.id, m.project_id FROM decisions d JOIN meetings m ON m.id = d.meeting_id WHERE d.id = ?')
        .get(decisionId) as { id: string; project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    const reg = this._requireRegistry();
    const projects = reg.prepare('SELECT id FROM projects').all() as Array<{ id: string }>;
    for (const { id } of projects) {
      await this.ensureProjectDB(id);
      const pdb = this._requireProjectDB(id);
      const row = pdb
        .prepare('SELECT d.id, m.project_id FROM decisions d JOIN meetings m ON m.id = d.meeting_id WHERE d.id = ?')
        .get(decisionId) as { id: string; project_id: string } | undefined;
      if (row) return { pdb, projectId: row.project_id };
    }
    throw new NotFoundError('decision', decisionId);
  }

  private _getMeetingOrThrow(
    pdb: Database.Database,
    meetingId: MeetingId,
  ): Meeting {
    const row = pdb
      .prepare('SELECT * FROM meetings WHERE id = ?')
      .get(meetingId) as MeetingRow | undefined;
    if (!row) throw new NotFoundError('meeting', meetingId);
    return rowToMeeting(row);
  }

  private _getDecisionOrThrow(
    pdb: Database.Database,
    decisionId: DecisionId,
  ): Decision {
    const row = pdb
      .prepare('SELECT * FROM decisions WHERE id = ?')
      .get(decisionId) as DecisionRow | undefined;
    if (!row) throw new NotFoundError('decision', decisionId);
    return rowToDecision(row);
  }
}
