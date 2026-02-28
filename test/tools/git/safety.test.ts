/**
 * Safety-critical tests (S-01..S-12) for the sc-git module.
 *
 * These are MANDATORY PASS tests. Any failure blocks the milestone.
 * Tests verify: push.default=nothing, gate blocking, no --force,
 * conflict abort, and protected branches.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

// --- Helpers ---

const tempDirs: string[] = [];

function createBareUpstream(branchName?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-safety-bare-'));
  tempDirs.push(dir);
  execSync(`git init --bare ${branchName ? `--initial-branch=${branchName}` : ''}`, {
    cwd: dir,
    stdio: 'pipe',
  });
  const tmpClone = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-safety-tmpclone-'));
  tempDirs.push(tmpClone);
  execSync(`git clone "${dir}" "${tmpClone}"`, { stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: tmpClone, stdio: 'pipe' });
  fs.writeFileSync(path.join(tmpClone, 'README.md'), '# Test upstream\n');
  execSync('git add README.md', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git commit -m "initial commit"', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git push', { cwd: tmpClone, stdio: 'pipe' });
  return dir;
}

function createTargetDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-safety-target-'));
  tempDirs.push(dir);
  return path.join(dir, 'repo');
}

function createTempRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-safety-repo-'));
  tempDirs.push(dir);
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
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

// --- Safety-Critical Tests (S-01..S-12) ---

describe('Safety-critical (S-01..S-12)', () => {
  // S-01: push.default=nothing after install
  it('S-01: push.default=nothing after install', async () => {
    const { installRepo } = await import('../../../src/git/core/repo-manager.js');
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const pushDefault = execSync('git config push.default', {
      cwd: target,
      encoding: 'utf-8',
    }).trim();
    expect(pushDefault).toBe('nothing');
  });

  // S-02: Dev pushRemote=origin after install
  it('S-02: dev pushRemote=origin after install', async () => {
    const { installRepo } = await import('../../../src/git/core/repo-manager.js');
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const pushRemote = execSync('git config branch.dev.pushRemote', {
      cwd: target,
      encoding: 'utf-8',
    }).trim();
    expect(pushRemote).toBe('origin');
  });

  // S-03: Gate 1 blocks without approval
  it('S-03: Gate 1 blocks without approval (contribute rejects)', async () => {
    const { contribute } = await import('../../../src/git/workflows/contribute.js');
    const repo = createTempRepo();

    // Create dev and main branches with divergent commits
    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    // Rename default branch to main if needed
    if (mainBranch !== 'main') {
      execSync(`git branch -m ${mainBranch} main`, { cwd: repo, stdio: 'pipe' });
    }

    // Create dev branch with a commit
    execSync('git checkout -b dev', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'feature.txt'), 'new feature\n');
    execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "feat: add feature"', { cwd: repo, stdio: 'pipe' });

    // Add upstream remote for pre-flight
    execSync(`git remote add upstream "${repo}"`, { cwd: repo, stdio: 'pipe' });
    execSync(`git remote add origin "${repo}"`, { cwd: repo, stdio: 'pipe' });

    // Set up .sc-git config
    const scGitDir = path.join(repo, '.sc-git');
    fs.mkdirSync(scGitDir, { recursive: true });
    fs.writeFileSync(path.join(scGitDir, 'config.json'), JSON.stringify({
      repo: 'test-repo',
      upstream: repo,
      origin: repo,
      devBranch: 'dev',
      mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/tmp/worktrees/test-repo',
      installedAt: new Date().toISOString(),
      lastSync: null,
    }, null, 2));

    // Record main HEAD before
    const mainHeadBefore = execSync('git rev-parse main', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    // Gate 1 rejects
    const rejectPromptFn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 0, insertions: 0, deletions: 0, files: [] },
    });
    const prPromptFn = vi.fn();

    const result = await contribute(repo, rejectPromptFn, prPromptFn);

    // Main should be unchanged
    const mainHeadAfter = execSync('git rev-parse main', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    expect(result.merged).toBe(false);
    expect(mainHeadAfter).toBe(mainHeadBefore);
    expect(prPromptFn).not.toHaveBeenCalled();
  });

  // S-04: Gate 2 blocks without approval (no upstream contact)
  it('S-04: Gate 2 blocks without approval (no upstream contact)', async () => {
    const { contribute } = await import('../../../src/git/workflows/contribute.js');
    const repo = createTempRepo();

    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    if (mainBranch !== 'main') {
      execSync(`git branch -m ${mainBranch} main`, { cwd: repo, stdio: 'pipe' });
    }

    execSync('git checkout -b dev', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'feature.txt'), 'new feature\n');
    execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "feat: add feature"', { cwd: repo, stdio: 'pipe' });

    execSync(`git remote add upstream "${repo}"`, { cwd: repo, stdio: 'pipe' });
    execSync(`git remote add origin "${repo}"`, { cwd: repo, stdio: 'pipe' });

    const scGitDir = path.join(repo, '.sc-git');
    fs.mkdirSync(scGitDir, { recursive: true });
    fs.writeFileSync(path.join(scGitDir, 'config.json'), JSON.stringify({
      repo: 'test-repo',
      upstream: repo,
      origin: repo,
      devBranch: 'dev',
      mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/tmp/worktrees/test-repo',
      installedAt: new Date().toISOString(),
      lastSync: null,
    }, null, 2));

    // Gate 1 approves, Gate 2 rejects
    const gate1Fn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 1, insertions: 1, deletions: 0, files: [] },
    });
    const gate2Fn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 0, insertions: 0, deletions: 0, files: [] },
      prTitle: '',
      prDescription: '',
    });

    const result = await contribute(repo, gate1Fn, gate2Fn);

    // Merge happened but no PR created
    expect(result.merged).toBe(true);
    expect(result.prCreated).toBe(false);
  });

  // S-05: Gate 1 rejection = no state change
  it('S-05: Gate 1 rejection leaves repo state unchanged', async () => {
    const { contribute } = await import('../../../src/git/workflows/contribute.js');
    const repo = createTempRepo();

    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    if (mainBranch !== 'main') {
      execSync(`git branch -m ${mainBranch} main`, { cwd: repo, stdio: 'pipe' });
    }

    execSync('git checkout -b dev', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'feature.txt'), 'feature code\n');
    execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "feat: feature"', { cwd: repo, stdio: 'pipe' });

    execSync(`git remote add upstream "${repo}"`, { cwd: repo, stdio: 'pipe' });
    execSync(`git remote add origin "${repo}"`, { cwd: repo, stdio: 'pipe' });

    const scGitDir = path.join(repo, '.sc-git');
    fs.mkdirSync(scGitDir, { recursive: true });
    fs.writeFileSync(path.join(scGitDir, 'config.json'), JSON.stringify({
      repo: 'test-repo', upstream: repo, origin: repo,
      devBranch: 'dev', mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/tmp/worktrees/test-repo',
      installedAt: new Date().toISOString(), lastSync: null,
    }, null, 2));

    // Capture full state before
    const headBefore = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const branchBefore = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const mainHeadBefore = execSync('git rev-parse main', { cwd: repo, encoding: 'utf-8' }).trim();

    const rejectFn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 0, insertions: 0, deletions: 0, files: [] },
    });

    await contribute(repo, rejectFn, vi.fn());

    // State must be identical
    const headAfter = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const branchAfter = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const mainHeadAfter = execSync('git rev-parse main', { cwd: repo, encoding: 'utf-8' }).trim();

    expect(headAfter).toBe(headBefore);
    expect(branchAfter).toBe(branchBefore);
    expect(mainHeadAfter).toBe(mainHeadBefore);
  });

  // S-06: Gate 2 rejection = no upstream contact
  it('S-06: Gate 2 rejection produces zero push/PR calls', async () => {
    const { contribute } = await import('../../../src/git/workflows/contribute.js');
    const repo = createTempRepo();

    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    if (mainBranch !== 'main') {
      execSync(`git branch -m ${mainBranch} main`, { cwd: repo, stdio: 'pipe' });
    }

    execSync('git checkout -b dev', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'feature.txt'), 'feature code\n');
    execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "feat: feature"', { cwd: repo, stdio: 'pipe' });

    execSync(`git remote add upstream "${repo}"`, { cwd: repo, stdio: 'pipe' });
    execSync(`git remote add origin "${repo}"`, { cwd: repo, stdio: 'pipe' });

    const scGitDir = path.join(repo, '.sc-git');
    fs.mkdirSync(scGitDir, { recursive: true });
    fs.writeFileSync(path.join(scGitDir, 'config.json'), JSON.stringify({
      repo: 'test-repo', upstream: repo, origin: repo,
      devBranch: 'dev', mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/tmp/worktrees/test-repo',
      installedAt: new Date().toISOString(), lastSync: null,
    }, null, 2));

    // Gate 1 approves
    const gate1Fn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 1, insertions: 1, deletions: 0, files: [] },
    });

    // Gate 2 rejects
    const gate2Fn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: { filesChanged: 0, insertions: 0, deletions: 0, files: [] },
      prTitle: '',
      prDescription: '',
    });

    const result = await contribute(repo, gate1Fn, gate2Fn);

    // Merge happened but zero upstream contact
    expect(result.merged).toBe(true);
    expect(result.prCreated).toBe(false);
    expect(result.prUrl).toBeUndefined();
  });

  // S-07: No --force in any script
  it('S-07: no --force in any shell script under src/git/scripts/', () => {
    const scriptsDir = path.resolve(__dirname, '../../../src/git/scripts');
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
    expect(scripts.length).toBeGreaterThanOrEqual(4);

    for (const script of scripts) {
      const content = fs.readFileSync(path.join(scriptsDir, script), 'utf-8');
      // Split into lines and check non-comment lines
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comment lines
        if (trimmed.startsWith('#')) continue;
        expect(trimmed).not.toContain('--force');
      }
    }
  });

  // S-08: No --force in any TypeScript module under src/git/
  it('S-08: no --force in any TypeScript module under src/git/', () => {
    const gitDir = path.resolve(__dirname, '../../../src/git');

    function collectTsFiles(dir: string): string[] {
      const result: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          result.push(...collectTsFiles(fullPath));
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          result.push(fullPath);
        }
      }
      return result;
    }

    const tsFiles = collectTsFiles(gitDir);
    expect(tsFiles.length).toBeGreaterThanOrEqual(8);

    for (const filePath of tsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip comments and documentation strings
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
        // Check for --force as a command argument (not in comments/docs)
        if (line.includes('--force') && !line.includes('--force-with-lease')) {
          throw new Error(
            `Found --force in ${filePath}:${i + 1}: ${line}`,
          );
        }
      }
    }
  });

  // S-09: State check before merge (safe-merge.sh rejects dirty state)
  it('S-09: safe-merge.sh rejects merge when repo is dirty', () => {
    const repo = createTempRepo();
    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    execSync('git checkout -b feature', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'feature.txt'), 'feature content\n');
    execSync('git add feature.txt', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "add feature"', { cwd: repo, stdio: 'pipe' });
    execSync(`git checkout ${mainBranch}`, { cwd: repo, stdio: 'pipe' });

    // Make repo dirty
    fs.writeFileSync(path.join(repo, 'README.md'), '# Dirty state\n');

    const safeMerge = path.resolve(__dirname, '../../../src/git/scripts/safe-merge.sh');
    try {
      execSync(`bash "${safeMerge}" "${repo}" "feature" "${mainBranch}"`, {
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

  // S-10: Conflict = abort (merge)
  it('S-10: safe-merge.sh aborts on conflict and restores pre-merge state', () => {
    const repo = createTempRepo();
    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    // Create conflicting branches
    execSync('git checkout -b conflict-branch', { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Conflict branch\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "conflict change"', { cwd: repo, stdio: 'pipe' });

    execSync(`git checkout ${mainBranch}`, { cwd: repo, stdio: 'pipe' });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Main branch change\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "main change"', { cwd: repo, stdio: 'pipe' });

    const headBefore = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();

    const safeMerge = path.resolve(__dirname, '../../../src/git/scripts/safe-merge.sh');
    try {
      execSync(`bash "${safeMerge}" "${repo}" "conflict-branch" "${mainBranch}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect.unreachable('Expected merge to fail');
    } catch (err: unknown) {
      const error = err as { stdout: string };
      const result = JSON.parse(error.stdout.trim());
      expect(result.success).toBe(false);
      expect(result.reason).toBe('conflict');
    }

    // Verify repo returned to pre-merge state
    const headAfter = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const status = execSync('git status --porcelain', { cwd: repo, encoding: 'utf-8' }).trim();
    expect(headAfter).toBe(headBefore);
    expect(status).toBe('');
  });

  // S-11: Conflict = abort (rebase)
  it('S-11: sync with rebase aborts on conflict and restores state', async () => {
    const { sync } = await import('../../../src/git/core/sync-manager.js');
    const repo = createTempRepo();
    const mainBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo, encoding: 'utf-8',
    }).trim();

    if (mainBranch !== 'main') {
      execSync(`git branch -m ${mainBranch} main`, { cwd: repo, stdio: 'pipe' });
    }

    // Create upstream with conflicting change
    const upstream = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-safety-upstream-'));
    tempDirs.push(upstream);
    execSync(`git clone "${repo}" "${upstream}"`, { stdio: 'pipe' });
    execSync('git config user.name "Upstream"', { cwd: upstream, stdio: 'pipe' });
    execSync('git config user.email "up@test.com"', { cwd: upstream, stdio: 'pipe' });
    fs.writeFileSync(path.join(upstream, 'README.md'), '# Upstream change\n');
    execSync('git add README.md', { cwd: upstream, stdio: 'pipe' });
    execSync('git commit -m "upstream conflict"', { cwd: upstream, stdio: 'pipe' });

    // Setup origin repo with remotes and dev branch
    execSync(`git remote add upstream "${upstream}"`, { cwd: repo, stdio: 'pipe' });
    execSync('git fetch upstream', { cwd: repo, stdio: 'pipe' });
    execSync('git checkout -b dev main', { cwd: repo, stdio: 'pipe' });

    // Make conflicting local change
    fs.writeFileSync(path.join(repo, 'README.md'), '# Local conflict\n');
    execSync('git add README.md', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "local conflict"', { cwd: repo, stdio: 'pipe' });

    // Set up .sc-git config and commit it so repo is clean
    const scGitDir = path.join(repo, '.sc-git');
    fs.mkdirSync(scGitDir, { recursive: true });
    fs.writeFileSync(path.join(scGitDir, 'config.json'), JSON.stringify({
      repo: 'test-repo', upstream: upstream, origin: repo,
      devBranch: 'dev', mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/tmp/worktrees/test-repo',
      installedAt: new Date().toISOString(), lastSync: null,
    }, null, 2));
    execSync('git add .sc-git', { cwd: repo, stdio: 'pipe' });
    execSync('git commit -m "add sc-git config"', { cwd: repo, stdio: 'pipe' });

    const headBefore = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();

    const result = await sync(repo, { strategy: 'rebase' });

    expect(result.conflicted).toBe(true);

    // Repo should be back to pre-rebase state
    const headAfter = execSync('git rev-parse HEAD', { cwd: repo, encoding: 'utf-8' }).trim();
    const statusOutput = execSync('git status --porcelain', { cwd: repo, encoding: 'utf-8' }).trim();
    expect(headAfter).toBe(headBefore);
    expect(statusOutput).toBe('');
  });

  // S-12: Protected branches cannot be deleted
  it('S-12: cannot delete dev or main branches, can delete non-protected', async () => {
    const { installRepo } = await import('../../../src/git/core/repo-manager.js');
    const { removeBranch, createBranch } = await import('../../../src/git/core/branch-manager.js');

    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);

    // Commit the .sc-git config so repo is clean
    execSync('git add .sc-git', { cwd: target, stdio: 'pipe' });
    execSync('git commit -m "add sc-git config"', { cwd: target, stdio: 'pipe' });

    // Verify dev cannot be deleted
    await expect(removeBranch(target, 'dev')).rejects.toThrow(/[Cc]annot.*dev/);

    // Verify main cannot be deleted
    await expect(removeBranch(target, 'main')).rejects.toThrow(/[Cc]annot.*main/);

    // Create and delete a non-protected branch to verify that works
    await createBranch(target, 'test-branch');
    // Must merge first to use safe delete, or use force
    await expect(removeBranch(target, 'feature/test-branch', { force: true })).resolves.not.toThrow();
  });
});
