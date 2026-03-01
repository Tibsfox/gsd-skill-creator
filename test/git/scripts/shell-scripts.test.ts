import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const SCRIPTS_DIR = path.resolve(__dirname, '../../../src/git/scripts');
const SAFE_MERGE = path.join(SCRIPTS_DIR, 'safe-merge.sh');
const PR_BUNDLE = path.join(SCRIPTS_DIR, 'pr-bundle.sh');
const WORKTREE_SETUP = path.join(SCRIPTS_DIR, 'worktree-setup.sh');

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

/**
 * Create a repo with a feature branch that has one non-conflicting commit.
 * Returns { repoPath, mainBranch, featureBranch }.
 */
function createRepoWithBranches(): { repoPath: string; mainBranch: string; featureBranch: string } {
  const repo = createTempRepo();
  const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: repo,
    encoding: 'utf-8',
  }).trim();

  execSync('git checkout -b feature', { cwd: repo, stdio: 'pipe' });
  fs.writeFileSync(path.join(repo, 'feature.txt'), 'feature content\n');
  execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
  execSync('git commit -m "Add feature"', { cwd: repo, stdio: 'pipe' });

  // Go back to main
  execSync(`git checkout ${mainBranch}`, { cwd: repo, stdio: 'pipe' });

  return { repoPath: repo, mainBranch, featureBranch: 'feature' };
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      // Remove any worktrees first
      try {
        execSync('git worktree list --porcelain', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' })
          .split('\n')
          .filter((l) => l.startsWith('worktree '))
          .map((l) => l.replace('worktree ', ''))
          .filter((p) => p !== dir)
          .forEach((wtPath) => {
            try {
              execSync(`git worktree remove "${wtPath}" --force`, { cwd: dir, stdio: 'pipe' });
            } catch {
              // Ignore
            }
          });
      } catch {
        // Ignore worktree cleanup errors
      }
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures
    }
  }
  tempDirs.length = 0;
});

// --- safe-merge.sh tests (SCRIPT-02) ---

describe('safe-merge.sh', () => {
  it('performs successful --no-ff merge', () => {
    const { repoPath, mainBranch, featureBranch } = createRepoWithBranches();
    tempDirs.push(repoPath);

    const output = execSync(`bash "${SAFE_MERGE}" "${repoPath}" "${featureBranch}" "${mainBranch}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const result = JSON.parse(output.trim());
    expect(result.success).toBe(true);
    expect(result.mergeCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(typeof result.filesChanged).toBe('number');
    expect(result.filesChanged).toBeGreaterThan(0);
  });

  it('aborts on conflict and reports conflicting files', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo,
      encoding: 'utf-8',
    }).trim();

    // Create conflicting branch
    execSync('git checkout -b conflict-branch', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Conflict branch\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "conflict change"', { cwd: repo, stdio: 'pipe' });

    execSync(`git checkout ${mainBranch}`, { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Main branch\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "main change"', { cwd: repo, stdio: 'pipe' });

    // safe-merge should exit 1 and return JSON
    try {
      execSync(`bash "${SAFE_MERGE}" "${repo}" "conflict-branch" "${mainBranch}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // Should not reach here
      expect.unreachable('Expected merge to fail');
    } catch (err: unknown) {
      const error = err as { stdout: string; status: number };
      const result = JSON.parse(error.stdout.trim());
      expect(result.success).toBe(false);
      expect(result.reason).toBe('conflict');
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    }

    // Verify repo is clean after abort
    const status = execSync('git status --porcelain', { cwd: repo, encoding: 'utf-8' }).trim();
    expect(status).toBe('');
  });

  it('rejects merge when repo is dirty', () => {
    const { repoPath, mainBranch, featureBranch } = createRepoWithBranches();
    tempDirs.push(repoPath);

    // Make repo dirty
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Dirty\n');

    try {
      execSync(`bash "${SAFE_MERGE}" "${repoPath}" "${featureBranch}" "${mainBranch}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect.unreachable('Expected dirty state rejection');
    } catch (err: unknown) {
      const error = err as { stdout: string; status: number };
      const result = JSON.parse(error.stdout.trim());
      expect(result.success).toBe(false);
      expect(result.reason).toContain('dirty');
    }
  });
});

// --- pr-bundle.sh tests (SCRIPT-03) ---

describe('pr-bundle.sh', () => {
  it('generates diff summary with commits and stats', () => {
    const { repoPath, mainBranch } = createRepoWithBranches();
    tempDirs.push(repoPath);

    // Switch to feature branch for the bundle
    execSync('git checkout feature', { cwd: repoPath, stdio: 'pipe' });

    const output = execSync(`bash "${PR_BUNDLE}" "${repoPath}" "${mainBranch}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const result = JSON.parse(output.trim());
    expect(Array.isArray(result.commits)).toBe(true);
    expect(result.commits.length).toBeGreaterThan(0);
    expect(result.commits[0]).toHaveProperty('sha');
    expect(result.commits[0]).toHaveProperty('message');

    expect(typeof result.stats.filesChanged).toBe('number');
    expect(typeof result.stats.insertions).toBe('number');
    expect(typeof result.stats.deletions).toBe('number');

    expect(Array.isArray(result.files)).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files[0]).toHaveProperty('path');
    expect(result.files[0]).toHaveProperty('status');
  });

  it('handles empty diff (no commits ahead)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo,
      encoding: 'utf-8',
    }).trim();

    const output = execSync(`bash "${PR_BUNDLE}" "${repo}" "${mainBranch}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const result = JSON.parse(output.trim());
    expect(result.commits).toEqual([]);
    expect(result.stats.filesChanged).toBe(0);
    expect(result.stats.insertions).toBe(0);
    expect(result.stats.deletions).toBe(0);
    expect(result.files).toEqual([]);
  });
});

// --- worktree-setup.sh tests (SCRIPT-04) ---

describe('worktree-setup.sh', () => {
  it('creates a worktree with branch tracking', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    const worktreePath = path.join(os.tmpdir(), `sc-wt-${Date.now()}`);
    tempDirs.push(worktreePath);

    const output = execSync(
      `bash "${WORKTREE_SETUP}" "${repo}" "feature-test" "${worktreePath}"`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    const result = JSON.parse(output.trim());
    expect(result.success).toBe(true);
    expect(result.path).toBe(worktreePath);
    expect(result.branch).toBe('feature-test');

    // Verify worktree directory exists
    expect(fs.existsSync(worktreePath)).toBe(true);

    // Verify branch exists
    const branches = execSync('git branch', { cwd: repo, encoding: 'utf-8' });
    expect(branches).toContain('feature-test');
  });

  it('worktree is functional (git status works)', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    const worktreePath = path.join(os.tmpdir(), `sc-wt-func-${Date.now()}`);
    tempDirs.push(worktreePath);

    execSync(`bash "${WORKTREE_SETUP}" "${repo}" "wt-func" "${worktreePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // git status should succeed in the worktree
    const status = execSync('git status --porcelain', {
      cwd: worktreePath,
      encoding: 'utf-8',
    });
    expect(typeof status).toBe('string');
  });

  it('configures push remote when origin exists', () => {
    const repo = createTempRepo();
    tempDirs.push(repo);

    // Add an origin remote
    execSync('git remote add origin /tmp/fake-origin', { cwd: repo, stdio: 'pipe' });

    const worktreePath = path.join(os.tmpdir(), `sc-wt-remote-${Date.now()}`);
    tempDirs.push(worktreePath);

    execSync(`bash "${WORKTREE_SETUP}" "${repo}" "tracked-branch" "${worktreePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Check that pushRemote is configured
    const pushRemote = execSync('git config branch.tracked-branch.pushRemote', {
      cwd: repo,
      encoding: 'utf-8',
    }).trim();
    expect(pushRemote).toBe('origin');
  });
});

// --- shellcheck tests (SCRIPT-05) ---

describe('shellcheck (SCRIPT-05)', () => {
  const hasShellcheck = (() => {
    try {
      execSync('npx shellcheck --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  })();

  // Fix: batch shellcheck into single invocation to avoid repeated npx overhead + timeout on CI
  // Credit: jacoblewisau (https://github.com/Tibsfox/gsd-skill-creator/pull/21)
  it.skipIf(!hasShellcheck)('all scripts pass shellcheck', { timeout: 30000 }, () => {
    const scripts = fs.readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.sh'));
    expect(scripts.length).toBeGreaterThanOrEqual(4);

    // Single shellcheck invocation with all scripts to avoid repeated npx overhead
    const scriptPaths = scripts.map((s) => `"${path.join(SCRIPTS_DIR, s)}"`).join(' ');
    const result = execSync(`npx shellcheck ${scriptPaths} 2>&1`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // shellcheck returns empty string on success
    expect(result.trim()).toBe('');
  });
});

// --- No --force safety check (S-07) ---

describe('safety checks', () => {
  it('no script contains --force', () => {
    // This test only checks if scripts directory has .sh files and none have --force
    if (!fs.existsSync(SCRIPTS_DIR)) {
      throw new Error('Scripts directory does not exist');
    }

    const scripts = fs.readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.sh'));
    expect(scripts.length).toBeGreaterThanOrEqual(4);

    for (const script of scripts) {
      const content = fs.readFileSync(path.join(SCRIPTS_DIR, script), 'utf-8');
      expect(content).not.toContain('--force');
    }
  });
});
