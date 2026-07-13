/**
 * RevertResolver — the git-aware layer for the 'reverted-commit' correction
 * signal. It walks real git history, finds `git revert` commits (and, opt-in,
 * INFORMAL same-session undos — byte-exact content round-trips with no revert
 * marker), and resolves each into `RevertedCommitSignal[]` facts that the PURE
 * CorrectionDetector consumes (the detector never touches git itself — see
 * correction-detector.ts).
 *
 * IMPORTANT (chokepoint): this module imports NO `child_process` and NO `fs`.
 * All git access is INJECTED as a `GitExec`. Production wires that seam through
 * VersionManager, whose exec is already ProcessContext-gated; unit tests inject
 * a fake. A `ProcessContextDenied` from the injected runner is load-bearing
 * (#10427) and propagates unswallowed; ordinary git failures degrade to [].
 */

import { ProcessContextDenied } from '../security/process-context.js';
import type { RevertedCommitSignal } from '../types/learning.js';

/** Injected git command runner returning stdout (the ProcessContext-gated seam). */
export type GitExec = (command: string) => Promise<string>;

export interface ResolveRevertsOptions {
  /** How many commits to scan back from HEAD (default 50). */
  maxCommits?: number;
  /**
   * Opt-in: also detect INFORMAL same-session undos — a later commit whose net
   * effect on a file is a byte-exact round-trip that restores the file to its
   * pre-image before an earlier commit changed it, even with no `git revert`
   * marker. Default false (heuristic, more false-positive-prone than the exact
   * revert marker). See resolveRevertsFromGit.
   */
  detectInformalUndo?: boolean;
  /**
   * Bound the scan to `<sinceCommit>..HEAD` instead of the `maxCommits` window.
   * Lets a caller pin the window to a session boundary (e.g. the retro
   * `started_commit`). When set, `maxCommits` is ignored.
   */
  sinceCommit?: string;
}

const DEFAULT_MAX_COMMITS = 50;

// ASCII placeholders only (no literal control bytes in the command string): git
// substitutes the real 0x1f / 0x1e bytes into its output, which we split on.
const FIELD = '\x1f';
const RECORD = '\x1e';
export const REVERT_LOG_FORMAT = '%H%x1f%s%x1f%b%x1e';

/** Git's default revert body: `This reverts commit <hash>.` */
const REVERTS_RE = /this reverts commit ([0-9a-f]{7,40})\./i;

export interface CommitRecord {
  hash: string;
  subject: string;
  body: string;
}

/** Parse `git log --format=REVERT_LOG_FORMAT` output into commit records. */
export function parseCommitLog(raw: string): CommitRecord[] {
  const records: CommitRecord[] = [];
  for (const chunk of raw.split(RECORD)) {
    const rec = chunk.replace(/^\s+/, '');
    if (!rec.includes(FIELD)) continue;
    const [hash, subject, ...bodyParts] = rec.split(FIELD);
    if (!hash) continue;
    records.push({
      hash: hash.trim(),
      subject: subject ?? '',
      body: bodyParts.join(FIELD),
    });
  }
  return records;
}

/** The reverted (mistake) commit hash referenced by a revert body, or null. */
export function parseRevertReference(body: string): string | null {
  const m = body.match(REVERTS_RE);
  return m ? m[1] : null;
}

/** `git show <rev>:<file>`, mapping any absence (added/deleted file) to ''. */
async function showFile(git: GitExec, rev: string, file: string): Promise<string> {
  try {
    return await git(`git show "${rev}:${file}"`);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
    return '';
  }
}

/** Dedup key for an emitted signal — one signal per (revert commit, file). */
function revertKey(revertCommitHash: string, filePath: string): string {
  return `${revertCommitHash}\x00${filePath}`;
}

/** Files touched by a commit (`git show --name-only`). ProcessContextDenied propagates. */
async function filesTouched(git: GitExec, hash: string): Promise<string[]> {
  const raw = await git(`git show --name-only --format= ${hash}`);
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve `RevertedCommitSignal[]` from real git history via an injected runner.
 *
 * For each `git revert` commit R that reverts commit M, one signal per file R
 * restored: `original` = M's content (the mistake), `corrected` = R's content
 * (the undo). Files with no net change across the revert are dropped — they
 * carry no correction signal. Never throws on ordinary git failure (returns []).
 */
export async function resolveRevertsFromGit(
  git: GitExec,
  opts: ResolveRevertsOptions = {},
): Promise<RevertedCommitSignal[]> {
  const max = opts.maxCommits ?? DEFAULT_MAX_COMMITS;
  // Window shared by the top-level log AND the per-file history lookup so both
  // passes see the same commits. `sinceCommit` pins to a session boundary.
  const windowArgs = opts.sinceCommit ? `${opts.sinceCommit}..HEAD` : `-n ${max}`;

  let rawLog: string;
  try {
    rawLog = await git(`git log ${windowArgs} --no-merges --format="${REVERT_LOG_FORMAT}"`);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
    return [];
  }

  const records = parseCommitLog(rawLog);
  const signals: RevertedCommitSignal[] = [];
  // One signal per (revert commit, file). Seeded by the formal pass so the
  // informal pass never re-emits a pairing a `git revert` already produced.
  const emitted = new Set<string>();

  // ---- formal `git revert` pass (exact marker) ----
  for (const commit of records) {
    const revertedHash = parseRevertReference(commit.body);
    if (!revertedHash) continue;

    let files: string[];
    try {
      files = await filesTouched(git, commit.hash);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      continue;
    }

    for (const file of files) {
      const original = await showFile(git, revertedHash, file);
      const corrected = await showFile(git, commit.hash, file);
      if (original === corrected) continue;

      signals.push({
        filePath: file,
        original,
        corrected,
        revertedCommitHash: revertedHash,
        revertCommitHash: commit.hash,
        revertMessage: commit.subject,
      });
      emitted.add(revertKey(commit.hash, file));
    }
  }

  // ---- informal same-session undo pass (opt-in, heuristic) ----
  if (opts.detectInformalUndo) {
    const formalReverts = new Set(signals.map((s) => s.revertCommitHash));

    for (const commit of records) {
      // A formal revert of M is ALSO a byte-exact round-trip of M; skip it so it
      // is counted once (as the formal signal), never twice.
      if (formalReverts.has(commit.hash)) continue;

      let files: string[];
      try {
        files = await filesTouched(git, commit.hash);
      } catch (err) {
        if (err instanceof ProcessContextDenied) throw err;
        continue;
      }

      for (const file of files) {
        const key = revertKey(commit.hash, file);
        if (emitted.has(key)) continue;

        // C's net effect on the file. Parent-absence (root commit) maps to ''.
        const beforeC = await showFile(git, `${commit.hash}~1`, file);
        const afterC = await showFile(git, commit.hash, file);
        if (beforeC === afterC) continue; // no net change → nothing undone

        // Earlier commits that touched this file, within the same window.
        let histRaw: string;
        try {
          histRaw = await git(`git log ${windowArgs} --format=%H -- "${file}"`);
        } catch (err) {
          if (err instanceof ProcessContextDenied) throw err;
          continue;
        }
        const history = histRaw
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        // Only commits strictly OLDER than C (its ancestors in the file history).
        const cIdx = history.indexOf(commit.hash);
        const earlier = cIdx >= 0 ? history.slice(cIdx + 1) : [];

        for (const m of earlier) {
          const beforeM = await showFile(git, `${m}~1`, file);
          const afterM = await showFile(git, m, file);
          // Byte-EXACT round-trip: C restored the file to M's pre-image AND M's
          // post-image is what C undid. The sole v1 match rule — deterministic.
          if (afterC === beforeM && beforeC === afterM) {
            signals.push({
              filePath: file,
              original: afterM, // the mistake M introduced
              corrected: afterC, // the content C restored
              revertedCommitHash: m,
              revertCommitHash: commit.hash,
              revertMessage: commit.subject,
              informal: true,
            });
            emitted.add(key);
            break; // one signal per (C, file)
          }
        }
      }
    }
  }

  return signals;
}
