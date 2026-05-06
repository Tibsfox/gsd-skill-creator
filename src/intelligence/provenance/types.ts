/**
 * Internal types for the provenance linker (v1.49.607 W1 Track B).
 * Public Atlas types live in `../types.ts` — these are the working
 * shapes the linker uses while walking git history.
 */

/** A parsed line from `git blame --porcelain` output. */
export interface BlameLine {
  /** 1-based line number in the current (blamed) file. */
  line_no: number;
  /** 40-char hex commit SHA that last touched the line. */
  commit_sha: string;
  /** 1-based line number in the source commit. */
  original_line_no: number;
  /** Original file path at the source commit. -CCC may rename here. */
  original_file_path: string;
}

/** A row from the existing `mission_links` table, narrowed to the
 *  fields the attribution layer needs. */
export interface MissionLinkRef {
  decision_id: string;
  artifact_kind: string;
  artifact_ref: string;
}

/** The mission-to-commit mapping the linker resolves before scoring.
 *  Each row says "this commit_sha belongs to this mission_id". */
export interface MissionCommitMap {
  /** Stable mission identifier — typically the decision_id from
   *  mission_links, or an extracted milestone tag. */
  mission_id: string;
  /** Concrete commit SHAs the mission touched. */
  commit_shas: string[];
}

/** A scored line attribution: the mission attributed to a (file, line)
 *  along with the weight assigned by the attribution layer. */
export interface LineAttribution {
  file_path: string;
  line_no: number;
  mission_id: string;
  commit_sha: string;
  weight: number;
}

/** A `git log --name-status --numstat` row, parsed. */
export interface GitFileChange {
  commit_sha: string;
  file_path: string;
  change_kind: 'A' | 'M' | 'D' | 'R';
  rename_from: string | null;
  added_lines: number;
  removed_lines: number;
}

/** Configuration envelope for a single linker run. */
export interface LinkerConfig {
  /** Absolute project directory (must contain a .git folder). */
  project_dir: string;
  /** Snapshot the resulting attributions should be tagged with. */
  snapshot_id: string;
  /** Optional file-path filter — when present, only blame these files. */
  file_paths?: string[];
  /** When true, run `git blame -CCC` so cross-file copies/moves are
   *  attributed to the original author commit. Default: true. */
  detect_renames?: boolean;
}
