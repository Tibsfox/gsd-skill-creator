/**
 * RevertResolver — the git-aware layer for the 'reverted-commit' correction
 * signal. It walks real git history, finds `git revert` commits, and resolves
 * each into `RevertedCommitSignal[]` facts that the PURE CorrectionDetector
 * consumes (the detector never touches git itself — see correction-detector.ts).
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

  let rawLog: string;
  try {
    rawLog = await git(`git log -n ${max} --no-merges --format="${REVERT_LOG_FORMAT}"`);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
    return [];
  }

  const signals: RevertedCommitSignal[] = [];

  for (const commit of parseCommitLog(rawLog)) {
    const revertedHash = parseRevertReference(commit.body);
    if (!revertedHash) continue;

    let filesRaw: string;
    try {
      filesRaw = await git(`git show --name-only --format= ${commit.hash}`);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      continue;
    }

    const files = filesRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

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
    }
  }

  return signals;
}
