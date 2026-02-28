import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import type { GitStateReport } from '../../../../src/tools/git/types.js';

const SCRIPT_PATH = path.resolve(__dirname, '../../../../src/tools/git/scripts/git-state-check.sh');

/** Create a temporary git repo with an initial commit. */
function createTempRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-test-'));
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test Repo\n');
  execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

/** Run git-state-check.sh on a repo and parse JSON output. */
function runStateCheck(repoPath: string): GitStateReport {
  const output = execSync(`bash "${SCRIPT_PATH}" "${repoPath}"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output.trim()) as GitStateReport;
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures
    }
  }
  tempDirs.length = 0;
});

describe('git-state-check.sh', () => {
  it('detects CLEAN state (C-01 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    const report = runStateCheck(repo);
    expect(report.state).toBe('CLEAN');
    expect(['master', 'main']).toContain(report.branch);
    expect(report.staged).toEqual([]);
    expect(report.unstaged).toEqual([]);
    expect(report.untracked).toEqual([]);
    expect(report.ahead).toBe(0);
    expect(report.behind).toBe(0);
  });

  it('detects DIRTY state (C-02 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    fs.writeFileSync(path.join(repo, 'README.md'), '# Modified\n');
    const report = runStateCheck(repo);
    expect(report.state).toBe('DIRTY');
    expect(report.unstaged).toContain('README.md');
  });

  it('detects MERGING state (C-03 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    // Simulate merge state by writing MERGE_HEAD
    const headSha = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    fs.writeFileSync(path.join(repo, '.git', 'MERGE_HEAD'), headSha + '\n');
    const report = runStateCheck(repo);
    expect(report.state).toBe('MERGING');
  });

  it('detects REBASING state (C-04 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    // Simulate rebase state by creating rebase-merge directory
    fs.mkdirSync(path.join(repo, '.git', 'rebase-merge'), { recursive: true });
    const report = runStateCheck(repo);
    expect(report.state).toBe('REBASING');
  });

  it('detects DETACHED state (C-05 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    const headSha = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    execSync(`git checkout ${headSha}`, { cwd: repo, stdio: 'pipe' });
    const report = runStateCheck(repo);
    expect(report.state).toBe('DETACHED');
    expect(report.branch).toBeNull();
  });

  it('detects CONFLICT state (C-06 via script)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    // Get default branch name
    const defaultBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo,
      encoding: 'utf-8',
    }).trim();

    // Create branch with conflicting changes
    execSync('git checkout -b conflict-branch', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Conflict branch version\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "conflict change"', { cwd: repo, stdio: 'pipe' });

    // Go back to main and make conflicting change
    execSync(`git checkout ${defaultBranch}`, { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Main branch version\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "main change"', { cwd: repo, stdio: 'pipe' });

    // Start merge that will conflict (do not abort)
    try {
      execSync('git merge conflict-branch', { cwd: repo, stdio: 'pipe' });
    } catch {
      // Merge fails due to conflict -- expected
    }

    const report = runStateCheck(repo);
    expect(report.state).toBe('CONFLICT');
  });

  it('outputs valid JSON with all required fields (SCRIPT-01)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    const report = runStateCheck(repo);

    // All required fields present
    expect(typeof report.state).toBe('string');
    expect(['CLEAN', 'DIRTY', 'MERGING', 'REBASING', 'DETACHED', 'CONFLICT']).toContain(
      report.state,
    );
    expect(report.branch === null || typeof report.branch === 'string').toBe(true);
    expect(Array.isArray(report.remotes)).toBe(true);
    expect(typeof report.ahead).toBe('number');
    expect(typeof report.behind).toBe('number');
    expect(Array.isArray(report.staged)).toBe(true);
    expect(Array.isArray(report.unstaged)).toBe(true);
    expect(Array.isArray(report.untracked)).toBe(true);
  });

  it('reports untracked files', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    fs.writeFileSync(path.join(repo, 'newfile.txt'), 'hello\n');
    const report = runStateCheck(repo);
    expect(report.untracked).toContain('newfile.txt');
  });

  it('reports staged files', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    fs.writeFileSync(path.join(repo, 'staged.txt'), 'staged content\n');
    execSync('git add staged.txt', { cwd: repo, stdio: 'pipe' });
    const report = runStateCheck(repo);
    expect(report.staged).toContain('staged.txt');
  });

  it('lists remotes', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);
    execSync('git remote add upstream /tmp/fake-upstream', { cwd: repo, stdio: 'pipe' });
    const report = runStateCheck(repo);
    expect(report.remotes.some((r) => r.name === 'upstream')).toBe(true);
  });
});
