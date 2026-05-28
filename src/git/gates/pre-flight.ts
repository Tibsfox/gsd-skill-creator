/**
 * Pre-flight checks for HITL gates.
 *
 * Runs validation checks before each gate (merge-to-main and pr-to-upstream)
 * to detect blockers and warnings before presenting the gate to the human.
 * Pre-flight catches dirty state, empty merges, conflicts, and large files
 * BEFORE the human is asked to approve anything.
 */

import { execSync } from 'node:child_process';
import {
  ensureProcessAllowed,
  ProcessContextDenied,
  type ProcessContext,
} from '../../security/process-context.js';
import type { DiffSummary, FileDiff } from '../types.js';

// === Types ===

export interface CommitEntry {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

export interface PreFlightCheck {
  name: string;
  level: 'BLOCKING' | 'WARNING';
  passed: boolean;
  message: string;
}

export interface PreFlightResult {
  checks: PreFlightCheck[];
  summary: DiffSummary;
  commitLog: CommitEntry[];
}

// === Helpers ===

function exec(command: string, cwd: string, ctx?: ProcessContext): string {
  // Security: hoisted ensureProcessAllowed at the single module-level helper
  // site (internal-helper pattern #10433). The shell-exec wraps the given
  // command; target='sh' argv=['-c', command]. ProcessContextDenied
  // propagates through every call site below (callers either re-throw from
  // their swallow-everything catches per #10427 or let the error bubble).
  ensureProcessAllowed(ctx, 'git/gates/pre-flight', 'exec-sync', 'sh', ['-c', command]);
  return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function isClean(repoPath: string, ctx?: ProcessContext): boolean {
  const status = exec('git status --porcelain=v2', repoPath, ctx);
  return status === '';
}

function parseDiffStat(output: string): { insertions: number; deletions: number } {
  let insertions = 0;
  let deletions = 0;

  // Parse the summary line: "N files changed, X insertions(+), Y deletions(-)"
  const summaryMatch = output.match(/(\d+) insertions?\(\+\)/);
  if (summaryMatch) insertions = parseInt(summaryMatch[1], 10);

  const delMatch = output.match(/(\d+) deletions?\(-\)/);
  if (delMatch) deletions = parseInt(delMatch[1], 10);

  return { insertions, deletions };
}

function parseNameStatus(output: string): FileDiff[] {
  if (!output.trim()) return [];
  const files: FileDiff[] = [];

  for (const line of output.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const rawStatus = parts[0].trim();
    const filePath = parts[parts.length - 1].trim();

    let status: FileDiff['status'];
    switch (rawStatus[0]) {
      case 'A': status = 'added'; break;
      case 'M': status = 'modified'; break;
      case 'D': status = 'deleted'; break;
      case 'R': status = 'renamed'; break;
      default: status = 'modified';
    }

    files.push({ path: filePath, status, insertions: 0, deletions: 0 });
  }

  return files;
}

function parseNumstat(output: string, files: FileDiff[]): void {
  if (!output.trim()) return;

  for (const line of output.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const ins = parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0;
    const del = parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0;
    const filePath = parts[2].trim();

    const file = files.find(f => f.path === filePath);
    if (file) {
      file.insertions = ins;
      file.deletions = del;
    }
  }
}

function parseCommitLog(output: string): CommitEntry[] {
  if (!output.trim()) return [];
  const entries: CommitEntry[] = [];

  for (const line of output.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('|');
    if (parts.length < 4) continue;

    entries.push({
      hash: parts[0].trim(),
      subject: parts[1].trim(),
      author: parts[2].trim(),
      date: parts[3].trim(),
    });
  }

  return entries;
}

function buildDiffSummary(repoPath: string, range: string, ctx?: ProcessContext): DiffSummary {
  let statOutput = '';
  let nameStatusOutput = '';
  let numstatOutput = '';

  try {
    statOutput = exec(`git diff --stat ${range}`, repoPath, ctx);
  } catch (err) {
    // #10427: security denial is load-bearing even from forensic-summary catches.
    if (err instanceof ProcessContextDenied) throw err;
  }

  try {
    nameStatusOutput = exec(`git diff --name-status ${range}`, repoPath, ctx);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  try {
    numstatOutput = exec(`git diff --numstat ${range}`, repoPath, ctx);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  const { insertions, deletions } = parseDiffStat(statOutput);
  const files = parseNameStatus(nameStatusOutput);
  parseNumstat(numstatOutput, files);

  return {
    filesChanged: files.length,
    insertions,
    deletions,
    files,
  };
}

// === Pre-flight: Merge (Gate 1) ===

export async function preFlightMerge(repoPath: string, ctx?: ProcessContext): Promise<PreFlightResult> {
  const checks: PreFlightCheck[] = [];
  let summary: DiffSummary = { filesChanged: 0, insertions: 0, deletions: 0, files: [] };
  let commitLog: CommitEntry[] = [];

  // Check 1 (BLOCKING): Working tree clean
  const clean = isClean(repoPath, ctx);
  checks.push({
    name: 'clean-tree',
    level: 'BLOCKING',
    passed: clean,
    message: clean ? 'Working tree is clean' : 'Working tree is not clean',
  });

  if (!clean) {
    return { checks, summary, commitLog };
  }

  // Check 2 (BLOCKING): Dev ahead of main
  let commitsAhead = 0;
  try {
    commitsAhead = parseInt(exec('git rev-list --count main..dev', repoPath, ctx), 10) || 0;
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  checks.push({
    name: 'commits-ahead',
    level: 'BLOCKING',
    passed: commitsAhead > 0,
    message: commitsAhead > 0
      ? `Dev is ${commitsAhead} commit(s) ahead of main`
      : 'No commits to merge (dev = main)',
  });

  if (commitsAhead === 0) {
    return { checks, summary, commitLog };
  }

  // Check 3 (WARNING): Dev not behind upstream
  let commitsBehind = 0;
  try {
    commitsBehind = parseInt(exec('git rev-list --count dev..upstream/main', repoPath, ctx), 10) || 0;
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  checks.push({
    name: 'behind-upstream',
    level: 'WARNING',
    passed: commitsBehind === 0,
    message: commitsBehind === 0
      ? 'Dev is up to date with upstream'
      : `Dev is ${commitsBehind} commit(s) behind upstream. Consider syncing first.`,
  });

  // Check 4 (BLOCKING): Generate DiffSummary
  summary = buildDiffSummary(repoPath, 'main..dev', ctx);
  checks.push({
    name: 'diff-summary',
    level: 'BLOCKING',
    passed: summary.filesChanged > 0,
    message: summary.filesChanged > 0
      ? `${summary.filesChanged} file(s) changed (+${summary.insertions}, -${summary.deletions})`
      : 'No file changes detected',
  });

  // Collect commit log
  try {
    const logOutput = exec("git log --format='%h|%s|%an|%aI' main..dev", repoPath, ctx);
    commitLog = parseCommitLog(logOutput);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  // Check 5 (BLOCKING): Dry-run merge conflict detection
  let hasConflict = false;
  const originalBranch = exec('git rev-parse --abbrev-ref HEAD', repoPath, ctx);
  try {
    exec('git checkout main', repoPath, ctx);
    try {
      exec('git merge --no-commit --no-ff dev', repoPath, ctx);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      hasConflict = true;
    }
    // ALWAYS abort the dry-run merge
    try {
      exec('git merge --abort', repoPath, ctx);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
    }
  } finally {
    // Switch back to original branch — security denial here would prevent
    // the catch-up, but at this point we MUST attempt to restore branch
    // state. ProcessContextDenied still propagates (load-bearing).
    try {
      exec(`git checkout ${originalBranch}`, repoPath, ctx);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
    }
  }

  checks.push({
    name: 'conflict-check',
    level: 'BLOCKING',
    passed: !hasConflict,
    message: hasConflict ? 'Merge would conflict' : 'No conflicts detected (dry-run clean)',
  });

  return { checks, summary, commitLog };
}

// === Pre-flight: PR (Gate 2) ===

export async function preFlightPR(repoPath: string, ctx?: ProcessContext): Promise<PreFlightResult> {
  const checks: PreFlightCheck[] = [];
  let summary: DiffSummary = { filesChanged: 0, insertions: 0, deletions: 0, files: [] };
  let commitLog: CommitEntry[] = [];

  // Check 1 (BLOCKING): Working tree clean
  const clean = isClean(repoPath, ctx);
  checks.push({
    name: 'clean-tree',
    level: 'BLOCKING',
    passed: clean,
    message: clean ? 'Working tree is clean' : 'Working tree is not clean',
  });

  if (!clean) {
    return { checks, summary, commitLog };
  }

  // Check 2 (BLOCKING): Main ahead of upstream/main
  let commitsAhead = 0;
  try {
    commitsAhead = parseInt(exec('git rev-list --count upstream/main..main', repoPath, ctx), 10) || 0;
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  checks.push({
    name: 'commits-ahead',
    level: 'BLOCKING',
    passed: commitsAhead > 0,
    message: commitsAhead > 0
      ? `Main is ${commitsAhead} commit(s) ahead of upstream`
      : 'No commits to push (main = upstream/main)',
  });

  if (commitsAhead === 0) {
    return { checks, summary, commitLog };
  }

  // Collect commit log
  try {
    const logOutput = exec("git log --format='%h|%s|%an|%aI' upstream/main..main", repoPath, ctx);
    commitLog = parseCommitLog(logOutput);
  } catch (err) {
    if (err instanceof ProcessContextDenied) throw err;
  }

  // Check 3 (WARNING): Commit message quality
  const badPatterns = ['WIP', 'fixup', 'squash', 'wip', 'fixup!', 'squash!'];
  const badCommits = commitLog.filter(c =>
    badPatterns.some(p => c.subject.toLowerCase().includes(p.toLowerCase())),
  );
  checks.push({
    name: 'commit-quality',
    level: 'WARNING',
    passed: badCommits.length === 0,
    message: badCommits.length === 0
      ? 'All commit messages look clean'
      : `${badCommits.length} commit(s) have WIP/fixup/squash messages. Consider squashing.`,
  });

  // Check 4 (BLOCKING): Generate DiffSummary
  summary = buildDiffSummary(repoPath, 'upstream/main..main', ctx);
  checks.push({
    name: 'diff-summary',
    level: 'BLOCKING',
    passed: summary.filesChanged > 0,
    message: summary.filesChanged > 0
      ? `${summary.filesChanged} file(s) changed (+${summary.insertions}, -${summary.deletions})`
      : 'No file changes detected',
  });

  // Check 5 (WARNING): Large binary detection
  let hasLargeFile = false;
  for (const file of summary.files) {
    try {
      const sizeStr = exec(`git cat-file -s HEAD:${file.path}`, repoPath, ctx);
      const size = parseInt(sizeStr, 10) || 0;
      if (size > 1_048_576) { // 1MB
        hasLargeFile = true;
        break;
      }
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      // Binary files with - numstat are suspicious
      if (file.insertions === 0 && file.deletions === 0) {
        // Check numstat output for binary marker
        try {
          const numstat = exec(`git diff --numstat upstream/main..main -- ${file.path}`, repoPath, ctx);
          if (numstat.startsWith('-\t-\t')) {
            hasLargeFile = true;
            break;
          }
        } catch (innerErr) {
          if (innerErr instanceof ProcessContextDenied) throw innerErr;
        }
      }
    }
  }

  checks.push({
    name: 'large-file',
    level: 'WARNING',
    passed: !hasLargeFile,
    message: hasLargeFile
      ? 'Large file detected (>1MB). Consider using Git LFS.'
      : 'No large files detected',
  });

  return { checks, summary, commitLog };
}
