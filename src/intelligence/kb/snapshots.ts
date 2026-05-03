/**
 * Intelligence KB — SnapshotManager.
 *
 * Snapshot lifecycle (newest, previous, list, prune) plus structural diff
 * between two snapshots. Diffs cached in `snapshot_diffs` table (migration v2).
 *
 * Phase 823 / C05 (D-23-13 .. D-23-15, D-23-25).
 */

import type {
  IntelligenceKB,
  ProjectId,
  SnapshotId,
  Finding,
  Snapshot,
} from '../types.js';
import type { KBStore } from './store.js';

// ─── Public interfaces ───────────────────────────────────────────────────────

export interface SnapshotDiff {
  fromSnapshot: SnapshotId;
  toSnapshot: SnapshotId;

  // File-level changes
  filesAdded: string[];
  filesDeleted: string[];
  filesModified: string[];

  // Finding-level changes
  findingsAdded: Finding[];
  findingsResolved: Finding[];
  findingsChanged: Array<{ fromFinding: Finding; toFinding: Finding }>;

  // Aggregate signals
  netCouplingChange: number;
  netComplexityChange: number;
  newHotSpots: string[];

  computedAt: string;
  durationMs: number;
}

export interface StructuralChangeSet {
  exportsAdded: string[];
  exportsRemoved: string[];
  importsAdded: string[];
  importsRemoved: string[];
  signaturesChanged: string[];
}

// ─── SnapshotManager ────────────────────────────────────────────────────────

export class SnapshotManager {
  private readonly _kb: KBStore;

  constructor(deps: { kb: IntelligenceKB }) {
    // We need the full KBStore surface (beyond IntelligenceKB interface)
    this._kb = deps.kb as KBStore;
  }

  // ─── Snapshot lifecycle ───────────────────────────────────────────────

  async newestSnapshot(p: ProjectId): Promise<SnapshotId | null> {
    const snapshots = await this._kb.listSnapshotsForProject(p);
    if (snapshots.length === 0) return null;
    return snapshots[0].id; // already sorted DESC
  }

  async previousSnapshot(
    p: ProjectId,
    before: SnapshotId,
  ): Promise<SnapshotId | null> {
    const snapshots = await this._kb.listSnapshotsForProject(p);
    const idx = snapshots.findIndex((s) => s.id === before);
    if (idx < 0 || idx + 1 >= snapshots.length) return null;
    return snapshots[idx + 1].id;
  }

  async listSnapshots(p: ProjectId, limit?: number): Promise<Snapshot[]> {
    const snapshots = await this._kb.listSnapshotsForProject(p);
    return limit !== undefined ? snapshots.slice(0, limit) : snapshots;
  }

  async pruneOlderThan(p: ProjectId, days: number): Promise<number> {
    const snapshots = await this._kb.listSnapshotsForProject(p);
    if (snapshots.length <= 1) return 0; // Never delete the only snapshot

    // Strategy: keep the 7 most recent regardless of date; delete the rest.
    // D-23-15: "keep the 7 most recent snapshots regardless of date; latest snapshot is never deleted"
    const keepCount = Math.min(7, snapshots.length);
    const toKeep = new Set(snapshots.slice(0, keepCount).map((s) => s.id));

    let pruned = 0;
    const pdb = await this._kb.getProjectRawDB(p);

    for (const s of snapshots) {
      if (!toKeep.has(s.id)) {
        // Delete findings under this snapshot, then the snapshot itself
        pdb.prepare('DELETE FROM findings WHERE snapshot_id = ?').run(s.id);
        pdb.prepare('DELETE FROM snapshot_diffs WHERE from_snapshot = ? OR to_snapshot = ?').run(s.id, s.id);
        pdb.prepare('DELETE FROM snapshots WHERE id = ?').run(s.id);
        pruned++;
      }
    }

    return pruned;
  }

  // ─── Diff ────────────────────────────────────────────────────────────

  async diff(from: SnapshotId, to: SnapshotId): Promise<SnapshotDiff> {
    // Check cache first
    const cached = await this._kb.getSnapshotDiffCache(from, to);
    if (cached) {
      return JSON.parse(cached.payload_json) as SnapshotDiff;
    }

    const start = Date.now();

    // Load findings for each snapshot
    // Try to find the project for this snapshot pair
    const projectId = await this._kb.getProjectForSnapshot(from);

    let fromFindings: Finding[];
    let toFindings: Finding[];

    if (projectId) {
      fromFindings = await this._kb.listFindingsAtForProject(projectId, from);
      toFindings = await this._kb.listFindingsAtForProject(projectId, to);
    } else {
      fromFindings = await this._kb.listFindingsAt(from);
      toFindings = await this._kb.listFindingsAt(to);
    }

    const diff = this._computeDiff(from, to, fromFindings, toFindings, start);

    // Cache the result
    if (projectId) {
      await this._kb.setSnapshotDiffCache(from, to, projectId, JSON.stringify(diff));
    }

    return diff;
  }

  async diffSinceLast(p: ProjectId): Promise<SnapshotDiff | null> {
    const newest = await this.newestSnapshot(p);
    if (!newest) return null;
    const previous = await this.previousSnapshot(p, newest);
    if (!previous) return null;
    return this.diff(previous, newest);
  }

  // ─── Structural change detection ──────────────────────────────────────

  async structuralChange(
    filePath: string,
    from: SnapshotId,
    to: SnapshotId,
  ): Promise<StructuralChangeSet> {
    const fromMetrics = await this._kb.getFileMetrics(from, filePath);
    const toMetrics = await this._kb.getFileMetrics(to, filePath);

    const fromExports: string[] = fromMetrics ? JSON.parse(fromMetrics.exports_json) : [];
    const toExports: string[] = toMetrics ? JSON.parse(toMetrics.exports_json) : [];
    const fromImports: string[] = fromMetrics ? JSON.parse(fromMetrics.imports_json) : [];
    const toImports: string[] = toMetrics ? JSON.parse(toMetrics.imports_json) : [];
    const fromSigs: string[] = fromMetrics ? JSON.parse(fromMetrics.signatures_json) : [];
    const toSigs: string[] = toMetrics ? JSON.parse(toMetrics.signatures_json) : [];

    const fromExportSet = new Set(fromExports);
    const toExportSet = new Set(toExports);
    const fromImportSet = new Set(fromImports);
    const toImportSet = new Set(toImports);

    // Signature change: same function name (extract name before '(') but different full sig
    const fromSigMap = new Map<string, string>();
    const toSigMap = new Map<string, string>();
    for (const sig of fromSigs) {
      const name = sig.split('(')[0].trim();
      fromSigMap.set(name, sig);
    }
    for (const sig of toSigs) {
      const name = sig.split('(')[0].trim();
      toSigMap.set(name, sig);
    }

    const signaturesChanged = [...fromSigMap.keys()].filter(
      (name) => toSigMap.has(name) && toSigMap.get(name) !== fromSigMap.get(name),
    );

    return {
      exportsAdded: toExports.filter((e) => !fromExportSet.has(e)),
      exportsRemoved: fromExports.filter((e) => !toExportSet.has(e)),
      importsAdded: toImports.filter((i) => !fromImportSet.has(i)),
      importsRemoved: fromImports.filter((i) => !toImportSet.has(i)),
      signaturesChanged,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private _computeDiff(
    from: SnapshotId,
    to: SnapshotId,
    fromFindings: Finding[],
    toFindings: Finding[],
    startMs: number,
  ): SnapshotDiff {
    // File-set diff
    const fromFiles = new Set(
      fromFindings.map((f) => f.source_path).filter((p): p is string => Boolean(p)),
    );
    const toFiles = new Set(
      toFindings.map((f) => f.source_path).filter((p): p is string => Boolean(p)),
    );
    const filesAdded = [...toFiles].filter((f) => !fromFiles.has(f));
    const filesDeleted = [...fromFiles].filter((f) => !toFiles.has(f));

    // Finding-set diff using findingKey (D-23-13)
    const findingKey = (f: Finding): string =>
      `${f.source_path ?? ''}|${f.kind}|${f.source_range?.start ?? ''}`;

    const fromMap = new Map(fromFindings.map((f) => [findingKey(f), f]));
    const toMap = new Map(toFindings.map((f) => [findingKey(f), f]));

    const findingsAdded = [...toMap.values()].filter((f) => !fromMap.has(findingKey(f)));
    const findingsResolved = [...fromMap.values()].filter((f) => !toMap.has(findingKey(f)));
    const findingsChanged = [...toMap.values()]
      .filter((toF) => {
        const key = findingKey(toF);
        const fromF = fromMap.get(key);
        if (!fromF) return false;
        const confidenceDelta = Math.abs(fromF.confidence - toF.confidence);
        return fromF.severity !== toF.severity || confidenceDelta > 0.1;
      })
      .map((toF) => ({
        fromFinding: fromMap.get(findingKey(toF))!,
        toFinding: toF,
      }));

    // filesModified = files in (findingsAdded ∪ findingsChanged) − (filesAdded ∪ filesDeleted)
    const addedFiles = new Set(filesAdded);
    const deletedFiles = new Set(filesDeleted);
    const modifiedSet = new Set<string>();
    for (const f of findingsAdded) {
      if (f.source_path && !addedFiles.has(f.source_path) && !deletedFiles.has(f.source_path)) {
        modifiedSet.add(f.source_path);
      }
    }
    for (const { toFinding } of findingsChanged) {
      if (
        toFinding.source_path &&
        !addedFiles.has(toFinding.source_path) &&
        !deletedFiles.has(toFinding.source_path)
      ) {
        modifiedSet.add(toFinding.source_path);
      }
    }

    // New hot spots = added findings with kind hot_spot
    const newHotSpots = findingsAdded
      .filter((f) => f.kind === 'hot_spot' && f.source_path)
      .map((f) => f.source_path!);

    const durationMs = Date.now() - startMs;

    return {
      fromSnapshot: from,
      toSnapshot: to,
      filesAdded,
      filesDeleted,
      filesModified: [...modifiedSet],
      findingsAdded,
      findingsResolved,
      findingsChanged,
      netCouplingChange: 0, // derives from file_metrics; 0 until metrics populated
      netComplexityChange: 0,
      newHotSpots,
      computedAt: new Date().toISOString(),
      durationMs,
    };
  }
}
