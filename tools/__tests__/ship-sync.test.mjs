/**
 * ship-sync.sh — invariant tests for the dev/main FF wrapper.
 *
 * Hermetic setup: each test gets a tmpdir with a bare "origin" repo and
 * a working clone. The working clone is configured with main + dev
 * branches in known states; the script is invoked with cwd=workDir so
 * `git rev-parse --show-toplevel` resolves there.
 *
 * Authored 2026-05-02 in the post-v1.49.596 CLAUDE.md compaction phase
 * (Tier 2 — promote dev/main sync prose to a tested wrapper script).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'ship-sync.sh');

let tmpRoot;
let workDir;

function git(args, opts = {}) {
  return execSync(`git ${args}`, { cwd: workDir, encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
}

function commit(file, content, message) {
  writeFileSync(join(workDir, file), content);
  git(`add "${file}"`);
  git(`commit -m "${message}"`);
}

function setupRepo() {
  tmpRoot = mkdtempSync(join(tmpdir(), 'ship-sync-test-'));
  const bareDir = join(tmpRoot, 'origin.git');
  workDir = join(tmpRoot, 'work');
  mkdirSync(workDir, { recursive: true });

  execSync(`git init --bare "${bareDir}"`, { stdio: 'pipe' });
  execSync(`git init -b main "${workDir}"`, { stdio: 'pipe' });
  git(`remote add origin "${bareDir}"`);
  git(`config user.email "test@example.com"`);
  git(`config user.name "Test"`);
  git(`config commit.gpgsign false`);

  commit('README', 'init\n', 'initial');
  git('push -u origin main');
  git('checkout -b dev');
  git('push -u origin dev');
}

beforeEach(() => { setupRepo(); });
afterEach(() => { try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {} });

function runScript() {
  try {
    const stdout = execSync(`bash "${SCRIPT_PATH}"`, {
      cwd: workDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

describe('ship-sync.sh', () => {
  it('idempotent: exit 0 with "already in sync" when dev == main', () => {
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('already in sync');
  });

  it('fast-forwards dev to main when main has merge commits dev lacks', () => {
    git('checkout dev');
    commit('feature', 'work\n', 'feature');
    git('push origin dev');
    git('checkout main');
    git('merge --no-ff dev -m "merge dev"');
    git('push origin main');

    expect(git('rev-list --count dev..main')).toBe('1');

    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('1 commit(s) behind main');
    expect(r.stdout).toContain('synced with main');

    expect(git('rev-list --count dev..main')).toBe('0');

    const remoteDevTip = execSync(`git ls-remote origin refs/heads/dev`, {
      cwd: workDir, encoding: 'utf8',
    }).split(/\s+/)[0];
    const localDevTip = git('rev-parse dev');
    expect(remoteDevTip).toBe(localDevTip);
  });

  it('exits 2 when fast-forward is refused (dev has divergent commits)', () => {
    git('checkout dev');
    commit('dev-only', 'dev work\n', 'dev divergent');
    git('checkout main');
    commit('main-only', 'main work\n', 'main divergent');

    expect(git('rev-list --count dev..main')).toBe('1');

    const r = runScript();
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('fast-forward refused');
  });

  it('restores the original branch on early exit', () => {
    git('checkout dev');
    commit('feature', 'work\n', 'feature');
    git('checkout main');
    commit('also-on-main', 'm\n', 'main commit');

    runScript();
    const branchAfter = git('rev-parse --abbrev-ref HEAD');
    expect(branchAfter).toBe('main');
  });
});
