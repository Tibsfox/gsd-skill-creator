import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import {
  detectState,
  assertState,
  assertClean,
  isValidTransition,
} from '../../../src/git/core/state-machine.js';

// --- Helpers ---

const tempDirs: string[] = [];

function createTempRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-test-'));
  tempDirs.push(dir);
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

function createTempRepoWithCommit(): string {
  const dir = createTempRepo();
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test\n');
  execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
  execSync('git commit -m "initial commit"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

// --- C-01: CLEAN detection ---

describe('detectState', () => {
  it('C-01: detects CLEAN state on a committed repo', async () => {
    const dir = createTempRepoWithCommit();
    const report = await detectState(dir);
    expect(report.state).toBe('CLEAN');
    expect(report.branch).toMatch(/^(main|master)$/);
    expect(report.staged).toEqual([]);
    expect(report.unstaged).toEqual([]);
    expect(report.untracked).toEqual([]);
  });

  // --- C-02: DIRTY detection ---

  it('C-02: detects DIRTY state when a tracked file is modified', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'README.md'), '# Modified\n');
    const report = await detectState(dir);
    expect(report.state).toBe('DIRTY');
    expect(report.unstaged.length).toBeGreaterThan(0);
  });

  // --- C-03: MERGING detection ---

  it('C-03: detects MERGING state when MERGE_HEAD exists', async () => {
    const dir = createTempRepoWithCommit();
    // Get current HEAD SHA
    const sha = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim();
    // Create MERGE_HEAD file to simulate mid-merge
    fs.writeFileSync(path.join(dir, '.git', 'MERGE_HEAD'), sha + '\n');
    const report = await detectState(dir);
    expect(['MERGING', 'CONFLICT']).toContain(report.state);
  });

  // --- C-04: REBASING detection ---

  it('C-04: detects REBASING state when rebase-merge dir exists', async () => {
    const dir = createTempRepoWithCommit();
    // Create rebase-merge directory to simulate mid-rebase
    fs.mkdirSync(path.join(dir, '.git', 'rebase-merge'), { recursive: true });
    const report = await detectState(dir);
    expect(report.state).toBe('REBASING');
  });

  // --- C-05: DETACHED detection ---

  it('C-05: detects DETACHED state after checking out a commit SHA', async () => {
    const dir = createTempRepoWithCommit();
    const sha = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim();
    execSync(`git checkout ${sha}`, { cwd: dir, stdio: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
    const report = await detectState(dir);
    expect(report.state).toBe('DETACHED');
    expect(report.branch).toBeNull();
  });

  // --- C-06: CONFLICT detection ---

  it('C-06: detects CONFLICT state with merge conflicts', async () => {
    const dir = createTempRepoWithCommit();

    // Create a branch with conflicting changes
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    fs.writeFileSync(path.join(dir, 'README.md'), '# Feature\n');
    execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "feature change"', { cwd: dir, stdio: 'pipe' });

    // Go back to default branch and create conflicting change
    const defaultBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf-8' }).trim();
    // The default branch is the one we started on, not feature
    execSync('git checkout -', { cwd: dir, stdio: 'pipe' });
    fs.writeFileSync(path.join(dir, 'README.md'), '# Main change\n');
    execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "main change"', { cwd: dir, stdio: 'pipe' });

    // Attempt merge which will conflict
    try {
      execSync('git merge feature', { cwd: dir, stdio: 'pipe' });
    } catch {
      // Expected — merge conflicts cause non-zero exit
    }

    const report = await detectState(dir);
    expect(report.state).toBe('CONFLICT');
  });

  // --- Ahead/behind tracking ---

  it('reports ahead=0 and behind=0 when no upstream is set', async () => {
    const dir = createTempRepoWithCommit();
    const report = await detectState(dir);
    expect(report.ahead).toBe(0);
    expect(report.behind).toBe(0);
  });

  // --- Remotes ---

  it('reports remotes as an array', async () => {
    const dir = createTempRepoWithCommit();
    const report = await detectState(dir);
    expect(report.remotes).toBeInstanceOf(Array);
  });

  // --- Untracked files ---

  it('lists untracked files in DIRTY state', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'newfile.txt'), 'hello\n');
    const report = await detectState(dir);
    expect(report.state).toBe('DIRTY');
    expect(report.untracked).toContain('newfile.txt');
  });

  // --- Staged files ---

  it('lists staged files correctly', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'staged.txt'), 'staged content\n');
    execSync('git add staged.txt', { cwd: dir, stdio: 'pipe' });
    const report = await detectState(dir);
    expect(report.state).toBe('DIRTY');
    expect(report.staged).toContain('staged.txt');
  });

  // --- Not a git repo ---

  it('throws when path is not a git repository', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-notrepo-'));
    tempDirs.push(dir);
    await expect(detectState(dir)).rejects.toThrow(/[Nn]ot a git repository/);
  });
});

// --- C-07: Transition validation ---

describe('isValidTransition', () => {
  it('C-07: allows valid transitions', () => {
    expect(isValidTransition('CLEAN', 'DIRTY', 'edit')).toBe(true);
    expect(isValidTransition('CLEAN', 'MERGING', 'merge')).toBe(true);
    expect(isValidTransition('CLEAN', 'REBASING', 'rebase')).toBe(true);
    expect(isValidTransition('CLEAN', 'DETACHED', 'checkout')).toBe(true);
    expect(isValidTransition('CONFLICT', 'CLEAN', 'resolve')).toBe(true);
    expect(isValidTransition('DIRTY', 'CLEAN', 'commit')).toBe(true);
  });

  it('C-07: rejects invalid transitions', () => {
    expect(isValidTransition('DIRTY', 'MERGING', 'merge')).toBe(false);
    expect(isValidTransition('MERGING', 'REBASING', 'rebase')).toBe(false);
    expect(isValidTransition('CONFLICT', 'MERGING', 'merge')).toBe(false);
  });

  it('allows MERGING to CONFLICT', () => {
    expect(isValidTransition('MERGING', 'CONFLICT', 'merge-conflict')).toBe(true);
  });

  it('allows REBASING to CONFLICT', () => {
    expect(isValidTransition('REBASING', 'CONFLICT', 'rebase-conflict')).toBe(true);
  });

  it('allows DETACHED to CLEAN', () => {
    expect(isValidTransition('DETACHED', 'CLEAN', 'checkout-branch')).toBe(true);
  });

  it('allows DETACHED to DIRTY', () => {
    expect(isValidTransition('DETACHED', 'DIRTY', 'edit-detached')).toBe(true);
  });

  it('allows DIRTY to DIRTY', () => {
    expect(isValidTransition('DIRTY', 'DIRTY', 'more-edits')).toBe(true);
  });
});

// --- assertState ---

describe('assertState', () => {
  it('does not throw when state matches', async () => {
    const dir = createTempRepoWithCommit();
    await expect(assertState(dir, 'CLEAN')).resolves.toBeUndefined();
  });

  it('throws when state does not match', async () => {
    const dir = createTempRepoWithCommit();
    await expect(assertState(dir, 'DIRTY')).rejects.toThrow(/expected.*DIRTY.*got.*CLEAN/i);
  });
});

// --- assertClean ---

describe('assertClean', () => {
  it('does not throw on clean repo', async () => {
    const dir = createTempRepoWithCommit();
    await expect(assertClean(dir)).resolves.toBeUndefined();
  });

  it('throws on dirty repo (unstaged changes)', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'README.md'), '# Modified\n');
    await expect(assertClean(dir)).rejects.toThrow();
  });

  it('throws on repo with untracked files', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'newfile.txt'), 'hello\n');
    await expect(assertClean(dir)).rejects.toThrow();
  });

  it('throws on repo with staged files', async () => {
    const dir = createTempRepoWithCommit();
    fs.writeFileSync(path.join(dir, 'staged.txt'), 'staged\n');
    execSync('git add staged.txt', { cwd: dir, stdio: 'pipe' });
    await expect(assertClean(dir)).rejects.toThrow();
  });
});
