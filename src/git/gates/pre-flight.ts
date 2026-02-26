/**
 * Pre-flight checks for HITL gates.
 *
 * Runs validation checks before each gate (merge-to-main and pr-to-upstream)
 * to detect blockers and warnings before presenting the gate to the human.
 * Pre-flight catches dirty state, empty merges, conflicts, and large files
 * BEFORE the human is asked to approve anything.
 */

import { execSync } from 'node:child_process';
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

function exec(command: string, cwd: string): string {
  return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function isClean(repoPath: string): boolean {
  const status = exec('git status --porcelain=v2', repoPath);
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

function buildDiffSummary(repoPath: string, range: string): DiffSummary {
  let statOutput = '';
  let nameStatusOutput = '';
  let numstatOutput = '';

  try {
    statOutput = exec(`git diff --stat ${range}`, repoPath);
  } catch { /* empty */ }

  try {
    nameStatusOutput = exec(`git diff --name-status ${range}`, repoPath);
  } catch { /* empty */ }

  try {
    numstatOutput = exec(`git diff --numstat ${range}`, repoPath);
  } catch { /* empty */ }

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

export async function preFlightMerge(repoPath: string): Promise<PreFlightResult> {
  const checks: PreFlightCheck[] = [];
  let summary: DiffSummary = { filesChanged: 0, insertions: 0, deletions: 0, files: [] };
  let commitLog: CommitEntry[] = [];

  // Check 1 (BLOCKING): Working tree clean
  const clean = isClean(repoPath);
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
    commitsAhead = parseInt(exec('git rev-list --count main..dev', repoPath), 10) || 0;
  } catch { /* empty */ }

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
    commitsBehind = parseInt(exec('git rev-list --count dev..upstream/main', repoPath), 10) || 0;
  } catch { /* empty */ }

  checks.push({
    name: 'behind-upstream',
    level: 'WARNING',
    passed: commitsBehind === 0,
    message: commitsBehind === 0
      ? 'Dev is up to date with upstream'
      : `Dev is ${commitsBehind} commit(s) behind upstream. Consider syncing first.`,
  });

  // Check 4 (BLOCKING): Generate DiffSummary
  summary = buildDiffSummary(repoPath, 'main..dev');
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
    const logOutput = exec("git log --format='%h|%s|%an|%aI' main..dev", repoPath);
    commitLog = parseCommitLog(logOutput);
  } catch { /* empty */ }

  // Check 5 (BLOCKING): Dry-run merge conflict detection
  let hasConflict = false;
  const originalBranch = exec('git rev-parse --abbrev-ref HEAD', repoPath);
  try {
    exec('git checkout main', repoPath);
    try {
      exec('git merge --no-commit --no-ff dev', repoPath);
    } catch {
      hasConflict = true;
    }
    // ALWAYS abort the dry-run merge
    try {
      exec('git merge --abort', repoPath);
    } catch { /* empty */ }
  } finally {
    // Switch back to original branch
    try {
      exec(`git checkout ${originalBranch}`, repoPath);
    } catch { /* empty */ }
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

export async function preFlightPR(repoPath: string): Promise<PreFlightResult> {
  const checks: PreFlightCheck[] = [];
  let summary: DiffSummary = { filesChanged: 0, insertions: 0, deletions: 0, files: [] };
  let commitLog: CommitEntry[] = [];

  // Check 1 (BLOCKING): Working tree clean
  const clean = isClean(repoPath);
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
    commitsAhead = parseInt(exec('git rev-list --count upstream/main..main', repoPath), 10) || 0;
  } catch { /* empty */ }

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
    const logOutput = exec("git log --format='%h|%s|%an|%aI' upstream/main..main", repoPath);
    commitLog = parseCommitLog(logOutput);
  } catch { /* empty */ }

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
  summary = buildDiffSummary(repoPath, 'upstream/main..main');
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
      const sizeStr = exec(`git cat-file -s HEAD:${file.path}`, repoPath);
      const size = parseInt(sizeStr, 10) || 0;
      if (size > 1_048_576) { // 1MB
        hasLargeFile = true;
        break;
      }
    } catch {
      // Binary files with - numstat are suspicious
      if (file.insertions === 0 && file.deletions === 0) {
        // Check numstat output for binary marker
        try {
          const numstat = exec(`git diff --numstat upstream/main..main -- ${file.path}`, repoPath);
          if (numstat.startsWith('-\t-\t')) {
            hasLargeFile = true;
            break;
          }
        } catch { /* empty */ }
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
