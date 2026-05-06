/**
 * Mission attribution scoring (v1.49.607 W1 Track B).
 *
 * Given a (file, line, commit_sha) triple plus a mapping commit_sha →
 * mission_id[], this module produces zero or more `LineAttribution` rows.
 *
 * Default scoring rule:
 *   weight = 1.0 / N   where N is the number of distinct missions that
 *                      claim the commit_sha.
 *
 * Edge cases:
 *   - N = 0   →  no attribution row emitted
 *   - N = 1   →  one row, weight = 1.0
 *   - N > 1   →  N rows, each weight = 1/N (sums to 1.0)
 *
 * The function is pure: it never touches the database or the filesystem.
 * The linker calls it per blame line and writes the resulting rows in
 * a single transaction.
 */

import type { BlameLine, LineAttribution, MissionCommitMap } from './types.js';

/**
 * Build the inverted index `commit_sha → mission_id[]` from a list of
 * MissionCommitMap rows. The same commit_sha may appear under several
 * missions (carry-over commits, cherry-picks, etc.) — we de-duplicate
 * within a single (commit, mission) pair so the divisor in the weight
 * rule reflects distinct missions only.
 */
export function buildShaToMissionIndex(
  maps: MissionCommitMap[],
): Map<string, string[]> {
  const idx = new Map<string, Set<string>>();
  for (const m of maps) {
    for (const sha of m.commit_shas) {
      let bucket = idx.get(sha);
      if (!bucket) {
        bucket = new Set<string>();
        idx.set(sha, bucket);
      }
      bucket.add(m.mission_id);
    }
  }
  // Materialize the Sets as arrays for stable iteration order downstream.
  const out = new Map<string, string[]>();
  for (const [sha, set] of idx.entries()) {
    out.set(sha, [...set].sort());
  }
  return out;
}

/**
 * Score a single blame line against the mission index. Returns 0..N
 * `LineAttribution` rows; the caller writes them as `mission_provenance`
 * rows.
 *
 * Behaviour matrix:
 *   - blame.commit_sha not present in idx           →  []
 *   - exactly one mission claims the sha            →  [{ weight: 1.0 }]
 *   - N missions claim the sha (N > 1)              →  N rows of 1/N
 */
export function attributeBlameLine(
  file_path: string,
  blame: BlameLine,
  idx: Map<string, string[]>,
): LineAttribution[] {
  const missions = idx.get(blame.commit_sha);
  if (!missions || missions.length === 0) return [];

  const w = 1.0 / missions.length;
  return missions.map((mission_id) => ({
    file_path,
    line_no: blame.line_no,
    mission_id,
    commit_sha: blame.commit_sha,
    weight: w,
  }));
}

/**
 * Convenience wrapper: score every line of a parsed blame output for a
 * single file. Returned rows are in line-order, with deterministic
 * mission ordering inside split-attribution rows (alphabetical).
 */
export function attributeFile(
  file_path: string,
  blame: BlameLine[],
  idx: Map<string, string[]>,
): LineAttribution[] {
  const out: LineAttribution[] = [];
  for (const b of blame) {
    const rows = attributeBlameLine(file_path, b, idx);
    for (const r of rows) out.push(r);
  }
  return out;
}
