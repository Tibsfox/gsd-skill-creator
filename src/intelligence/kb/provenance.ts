/**
 * Atlas KB — provenance-side query layer (v1.49.607 W1 Track B).
 *
 * Implements the provenance-side methods of the `AtlasKB` query surface
 * declared in `src/intelligence/types.ts`. Operates against the per-project
 * intelligence DB after migration `003_atlas_symbols.sql` has been applied.
 *
 * The queries here back the mission archeology Sankey UI; the < 300ms
 * render budget translates to a per-query budget of ~10ms, which is met
 * via the (snapshot_id, file_path, line_no) and (mission_id) indexes
 * declared in 003_atlas_symbols.sql.
 */

import type Database from 'better-sqlite3';
import type {
  AtlasFilesChanged,
  AtlasMissionProvenance,
  SnapshotId,
} from '../types.js';
import { rowToAtlasFilesChanged, rowToAtlasMissionProvenance } from './atlas-rows.js';
import type { FilesChangedRow, MissionProvenanceRow } from './atlas-rows.js';

// ─── ProvenanceKB ───────────────────────────────────────────────────────────

export class ProvenanceKB {
  private readonly _db: Database.Database;

  private _stmtFilesByMission?: Database.Statement;
  private _stmtMissionsForFile?: Database.Statement;
  private _stmtProvenanceForLine?: Database.Statement;

  constructor(db: Database.Database) {
    this._db = db;
  }

  /**
   * List every file delta recorded for a mission. Backs the "what files
   * did this mission touch" view in the archeology UI.
   */
  listFilesChangedByMission(mission_id: string): AtlasFilesChanged[] {
    if (!this._stmtFilesByMission) {
      this._stmtFilesByMission = this._db.prepare(
        `SELECT * FROM files_changed
         WHERE mission_id = ?
         ORDER BY commit_sha ASC, file_path ASC`,
      );
    }
    const rows = this._stmtFilesByMission.all(mission_id) as FilesChangedRow[];
    return rows.map(rowToAtlasFilesChanged);
  }

  /**
   * Aggregate per-mission attribution for a file at a given snapshot.
   * Returns one row per mission that has any line in this file, with the
   * total weight (sum) and line_count (count) under that mission.
   *
   * The Sankey renderer feeds this into its left-column buckets; the
   * `weight` is a float summed across rows so the renderer scales the
   * mission ribbons correctly even when lines are split-attributed.
   */
  listMissionsForFile(
    snapshot: SnapshotId,
    file_path: string,
  ): { mission_id: string; weight: number; line_count: number }[] {
    if (!this._stmtMissionsForFile) {
      this._stmtMissionsForFile = this._db.prepare(
        `SELECT mission_id, SUM(weight) AS weight, COUNT(*) AS line_count
         FROM mission_provenance
         WHERE snapshot_id = ? AND file_path = ?
         GROUP BY mission_id
         ORDER BY weight DESC, mission_id ASC`,
      );
    }
    const rows = this._stmtMissionsForFile.all(snapshot, file_path) as Array<{
      mission_id: string;
      weight: number;
      line_count: number;
    }>;
    return rows.map((r) => ({
      mission_id: r.mission_id,
      weight: r.weight,
      line_count: r.line_count,
    }));
  }

  /**
   * Return every provenance row attributing the given (file, line) at a
   * snapshot. May return multiple rows when a line was touched by more
   * than one mission across history.
   */
  listProvenanceForLine(
    snapshot: SnapshotId,
    file_path: string,
    line_no: number,
  ): AtlasMissionProvenance[] {
    if (!this._stmtProvenanceForLine) {
      this._stmtProvenanceForLine = this._db.prepare(
        `SELECT * FROM mission_provenance
         WHERE snapshot_id = ? AND file_path = ? AND line_no = ?
         ORDER BY weight DESC, mission_id ASC`,
      );
    }
    const rows = this._stmtProvenanceForLine.all(
      snapshot,
      file_path,
      line_no,
    ) as MissionProvenanceRow[];
    return rows.map(rowToAtlasMissionProvenance);
  }

  // ─── Test helpers (not part of AtlasKB surface) ──────────────────────

  preparedStatementCount(): number {
    let n = 0;
    if (this._stmtFilesByMission) n++;
    if (this._stmtMissionsForFile) n++;
    if (this._stmtProvenanceForLine) n++;
    return n;
  }
}
