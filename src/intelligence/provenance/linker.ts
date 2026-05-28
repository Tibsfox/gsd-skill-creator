/**
 * Provenance linker (v1.49.607 W1 Track B).
 *
 * Walks a project's git history, joins it against the existing
 * `mission_links` table, and writes:
 *
 *   1. `files_changed`      — one row per (mission, commit, file) with
 *                             change_kind + numstat lines.
 *   2. `mission_provenance` — one row per (snapshot, file, line, mission)
 *                             scored by `mission-attribution.ts`.
 *
 * Git invocation is via `child_process.spawnSync`; this is allowed —
 * the linker runs inside the indexer pipeline, NOT in atlas Tauri IPC,
 * so it does not violate the "no spawn in atlas commands" rule.
 *
 * Performance: per-file blame is the dominant cost. Mission attribution
 * scoring is O(blame_lines) and runs in-process.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { parseBlamePorcelain } from './blame-parser.js';
import {
  attributeFile,
  buildShaToMissionIndex,
} from './mission-attribution.js';
import {
  ensureProcessAllowed,
  type ProcessContext,
} from '../../security/process-context.js';
import type {
  GitFileChange,
  LineAttribution,
  LinkerConfig,
  MissionCommitMap,
} from './types.js';

// ─── Git helpers ────────────────────────────────────────────────────────────

interface GitOk {
  ok: true;
  stdout: string;
}
interface GitErr {
  ok: false;
  status: number | null;
  stderr: string;
}
type GitResult = GitOk | GitErr;

function git(cwd: string, args: string[], ctx?: ProcessContext): GitResult {
  // Security: internal-helper pattern per #10433 — hoist the chokepoint
  // check at the single spawn site. ProcessContextDenied propagates;
  // no swallowing try/catch around the spawn.
  ensureProcessAllowed(ctx, 'intelligence/provenance/linker', 'spawn-sync', 'git', args);
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    return { ok: false, status: r.status, stderr: r.stderr ?? '' };
  }
  return { ok: true, stdout: r.stdout ?? '' };
}

// ─── git log --name-status --numstat parser ─────────────────────────────────

/**
 * Parse the output of `git log --pretty=format:%H --name-status --numstat`.
 * Each commit emits:
 *   <40-hex SHA>
 *   (numstat block: "<added>\t<removed>\t<path>")
 *   (name-status block: "M\t<path>" or "R100\t<old>\t<new>")
 * Numstat and name-status are interleaved on a per-file basis when both
 * flags are present.
 */
export function parseGitLogNameStatusNumstat(stdout: string): GitFileChange[] {
  const out: GitFileChange[] = [];
  if (!stdout) return out;
  const lines = stdout.split('\n');

  let currentSha: string | null = null;
  // Buffer numstats by path so the name-status pass can pick them up.
  const numstatByPath = new Map<string, { added: number; removed: number }>();

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (line === '') continue;

    if (/^[0-9a-f]{40}$/.test(line)) {
      currentSha = line;
      numstatByPath.clear();
      continue;
    }
    if (currentSha === null) continue;

    const cols = line.split('\t');

    // numstat row: <added>\t<removed>\t<path>  (numbers may be "-" for binary)
    if (cols.length === 3 && /^[\d-]+$/.test(cols[0]) && /^[\d-]+$/.test(cols[1])) {
      const added = cols[0] === '-' ? 0 : parseInt(cols[0], 10);
      const removed = cols[1] === '-' ? 0 : parseInt(cols[1], 10);
      // For renames, numstat may emit `old => new` or just the new path.
      // We key on the trailing path token regardless.
      const path = cols[2];
      numstatByPath.set(path, { added, removed });
      continue;
    }

    // name-status row.
    // Forms: "M\t<path>" | "A\t<path>" | "D\t<path>" | "R<score>\t<old>\t<new>"
    const status = cols[0];
    if (status === 'M' || status === 'A' || status === 'D') {
      if (cols.length < 2) continue;
      const file_path = cols[1];
      const num = numstatByPath.get(file_path) ?? { added: 0, removed: 0 };
      out.push({
        commit_sha: currentSha,
        file_path,
        change_kind: status,
        rename_from: null,
        added_lines: num.added,
        removed_lines: num.removed,
      });
    } else if (status.startsWith('R') && cols.length >= 3) {
      const rename_from = cols[1];
      const file_path = cols[2];
      const num =
        numstatByPath.get(file_path) ??
        numstatByPath.get(`${rename_from} => ${file_path}`) ??
        { added: 0, removed: 0 };
      out.push({
        commit_sha: currentSha,
        file_path,
        change_kind: 'R',
        rename_from,
        added_lines: num.added,
        removed_lines: num.removed,
      });
    }
  }

  return out;
}

// ─── mission_links → MissionCommitMap[] resolution ──────────────────────────

/**
 * Walk the existing `mission_links` table and convert each row whose
 * `artifact_kind` is one of the recognized commit-range kinds into a
 * MissionCommitMap. Recognized kinds:
 *
 *   'commit_sha'        →  artifact_ref is a single 40-hex SHA
 *   'commit_range'      →  artifact_ref is "<sha-from>..<sha-to>"
 *   'commit_range_incl' →  artifact_ref is "<sha-from>...<sha-to>"
 *   'milestone_tag'     →  artifact_ref is a tag name; resolved via git
 *
 * For commit_range entries we shell out to git to expand the range. The
 * decision_id becomes the mission_id.
 */
export function resolveMissionCommits(
  db: Database.Database,
  project_dir: string,
  ctx?: ProcessContext,
): MissionCommitMap[] {
  let rows: Array<{ decision_id: string; artifact_kind: string; artifact_ref: string }>;
  try {
    rows = db
      .prepare(
        'SELECT decision_id, artifact_kind, artifact_ref FROM mission_links',
      )
      .all() as typeof rows;
  } catch {
    // mission_links table missing — treat as empty.
    return [];
  }

  const byMission = new Map<string, Set<string>>();
  const add = (mission_id: string, sha: string) => {
    if (!/^[0-9a-f]{40}$/.test(sha)) return;
    let set = byMission.get(mission_id);
    if (!set) {
      set = new Set<string>();
      byMission.set(mission_id, set);
    }
    set.add(sha);
  };

  for (const row of rows) {
    const mission_id = row.decision_id;
    const ref = row.artifact_ref;

    if (row.artifact_kind === 'commit_sha') {
      add(mission_id, ref);
      continue;
    }
    if (
      row.artifact_kind === 'commit_range' ||
      row.artifact_kind === 'commit_range_incl' ||
      row.artifact_kind === 'milestone_tag'
    ) {
      const r = git(project_dir, [
        'rev-list',
        '--no-walk',
        ...(ref.includes('..') ? [ref] : [ref]),
      ], ctx);
      if (r.ok) {
        for (const sha of r.stdout.split('\n').map((s) => s.trim()).filter(Boolean)) {
          add(mission_id, sha);
        }
      }
    }
  }

  return [...byMission.entries()].map(([mission_id, set]) => ({
    mission_id,
    commit_shas: [...set].sort(),
  }));
}

// ─── Linker entrypoint ──────────────────────────────────────────────────────

export interface LinkerResult {
  files_changed_inserted: number;
  provenance_inserted: number;
  files_blamed: number;
  missions_seen: number;
}

export class ProvenanceLinker {
  private readonly _db: Database.Database;

  constructor(db: Database.Database) {
    this._db = db;
  }

  /**
   * Delete all `mission_provenance` rows for the given snapshot_id and all
   * `files_changed` rows whose mission_id matches any mission linked to that
   * snapshot via `mission_links`. Idempotent — calling twice does not error.
   *
   * Use this before `run()` when strict re-run idempotency is required (the
   * 'replace' mode wrapper below does this automatically).
   */
  clearSnapshotProvenance(snapshot_id: string): void {
    this._db.transaction(() => {
      this._db
        .prepare('DELETE FROM mission_provenance WHERE snapshot_id = ?')
        .run(snapshot_id);
      // files_changed is keyed by mission_id (not snapshot_id). Clear every
      // mission_id that is referenced by a mission_provenance row that was
      // (or would have been) written for this snapshot. Because we already
      // deleted those rows above, we derive the set from mission_links
      // (same source resolveMissionCommits uses) and clear unconditionally.
      let missionIds: string[];
      try {
        missionIds = (
          this._db
            .prepare('SELECT DISTINCT decision_id FROM mission_links')
            .all() as Array<{ decision_id: string }>
        ).map((r) => r.decision_id);
      } catch {
        missionIds = [];
      }
      if (missionIds.length > 0) {
        const placeholders = missionIds.map(() => '?').join(',');
        this._db
          .prepare(`DELETE FROM files_changed WHERE mission_id IN (${placeholders})`)
          .run(...missionIds);
      }
    })();
  }

  /**
   * Run the full linker pipeline:
   *   1. Resolve `mission_links` → MissionCommitMap[]
   *   2. Walk `git log --name-status --numstat` for the union of all
   *      mission commit SHAs and write `files_changed` rows.
   *   3. For each tracked file, run `git blame -CCC --line-porcelain`
   *      and write `mission_provenance` rows scored by the attribution
   *      layer.
   *
   * Idempotency: writes are wrapped in a single transaction. Re-running
   * with the same snapshot_id appends new rows (the schema does not
   * deduplicate). Pass `mode: 'replace'` to clear rows for the snapshot
   * before writing, producing a deterministic final state regardless of
   * how many times the linker is invoked.
   */
  run(
    cfg: LinkerConfig,
    opts?: { mode?: 'append' | 'replace' },
    ctx?: ProcessContext,
  ): LinkerResult {
    if (opts?.mode === 'replace') {
      this.clearSnapshotProvenance(cfg.snapshot_id);
    }
    const missionMaps = resolveMissionCommits(this._db, cfg.project_dir, ctx);
    const idx = buildShaToMissionIndex(missionMaps);

    // ── 1. files_changed ─────────────────────────────────────────────
    const allShas = [...idx.keys()];
    let fileChanges: GitFileChange[] = [];
    if (allShas.length > 0) {
      const r = git(cfg.project_dir, [
        'log',
        '--no-merges',
        '--pretty=format:%H',
        '--name-status',
        '--numstat',
        ...allShas,
      ], ctx);
      if (r.ok) fileChanges = parseGitLogNameStatusNumstat(r.stdout);
    }

    // Filter: only rows whose commit_sha is actually attributed to a
    // mission (the rev-list union covers ancestors that aren't mission
    // commits when a range was given).
    const missionShaSet = new Set(allShas);
    fileChanges = fileChanges.filter((f) => missionShaSet.has(f.commit_sha));

    // ── 2. blame target files ───────────────────────────────────────
    let targetFiles: string[];
    if (cfg.file_paths && cfg.file_paths.length > 0) {
      targetFiles = [...cfg.file_paths];
    } else {
      // Default target set: every file that ever appeared in a mission
      // commit and still exists in the working tree.
      const set = new Set<string>();
      for (const fc of fileChanges) {
        if (fc.change_kind !== 'D') set.add(fc.file_path);
      }
      // Filter to files git currently tracks.
      const lsfiles = git(cfg.project_dir, ['ls-files'], ctx);
      if (lsfiles.ok) {
        const tracked = new Set(
          lsfiles.stdout.split('\n').map((s) => s.trim()).filter(Boolean),
        );
        targetFiles = [...set].filter((f) => tracked.has(f));
      } else {
        targetFiles = [...set];
      }
    }

    const detectRenames = cfg.detect_renames !== false;
    const allAttributions: LineAttribution[] = [];
    let filesBlamed = 0;
    for (const f of targetFiles) {
      const args = [
        'blame',
        '--line-porcelain',
        ...(detectRenames ? ['-CCC'] : []),
        'HEAD',
        '--',
        f,
      ];
      const r = git(cfg.project_dir, args, ctx);
      if (!r.ok) continue;
      filesBlamed++;
      const parsed = parseBlamePorcelain(r.stdout);
      const rows = attributeFile(f, parsed, idx);
      for (const a of rows) allAttributions.push(a);
    }

    // ── 3. write everything in one transaction ──────────────────────
    const insertFC = this._db.prepare(
      `INSERT INTO files_changed
         (id, mission_id, commit_sha, file_path, change_kind,
          rename_from, added_lines, removed_lines)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertProv = this._db.prepare(
      `INSERT INTO mission_provenance
         (id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const txn = this._db.transaction(() => {
      let fc = 0;
      let pv = 0;
      for (const change of fileChanges) {
        for (const m of idx.get(change.commit_sha) ?? []) {
          insertFC.run(
            randomUUID(),
            m,
            change.commit_sha,
            change.file_path,
            change.change_kind,
            change.rename_from,
            change.added_lines,
            change.removed_lines,
          );
          fc++;
        }
      }
      for (const a of allAttributions) {
        insertProv.run(
          randomUUID(),
          cfg.snapshot_id,
          a.file_path,
          a.line_no,
          a.mission_id,
          a.commit_sha,
          a.weight,
        );
        pv++;
      }
      return { fc, pv };
    });

    const counts = txn();

    return {
      files_changed_inserted: counts.fc,
      provenance_inserted: counts.pv,
      files_blamed: filesBlamed,
      missions_seen: missionMaps.length,
    };
  }
}
