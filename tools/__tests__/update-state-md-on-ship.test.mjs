/**
 * update-state-md-on-ship.mjs — invariant tests for the STATE.md auto-update.
 *
 * Hermetic setup: each test gets a tmpdir with a minimal git repo, a
 * .planning/STATE.md fixture, and optional milestone tags applied. The
 * script is invoked with cwd=workDir.
 *
 * Closes IC-613-3 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'update-state-md-on-ship.mjs');

let tmpRoot;
let workDir;
let statePath;

function git(args, opts = {}) {
  return execSync(`git ${args}`, { cwd: workDir, encoding: 'utf8', stdio: 'pipe', ...opts }).trim();
}

function makeStateMd(opts = {}) {
  const milestone = opts.milestone ?? 'v1.49.613';
  const status = opts.status ?? 'planning';
  const extraFields = opts.extraFields ?? '';
  return [
    '---',
    'gsd_state_version: 1.0',
    `milestone: ${milestone}`,
    'milestone_name: Test Milestone',
    `status: ${status}`,
    'last_updated: "2026-05-07T00:00:00.000Z"',
    'opened_on: "2026-05-07"',
    extraFields,
    '---',
    '',
    '## Body',
    'preserved verbatim',
    '',
  ].filter(Boolean).join('\n');
}

function setupRepo(stateOpts = {}) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'update-state-md-test-'));
  workDir = join(tmpRoot, 'work');
  mkdirSync(join(workDir, '.planning'), { recursive: true });

  execSync(`git init -b main "${workDir}"`, { stdio: 'pipe' });
  git(`config user.email "test@example.com"`);
  git(`config user.name "Test"`);
  git(`config commit.gpgsign false`);

  writeFileSync(join(workDir, 'README'), 'init\n');
  git(`add README`);
  git(`commit -m "initial"`);

  statePath = join(workDir, '.planning', 'STATE.md');
  writeFileSync(statePath, makeStateMd(stateOpts));
}

function tagMilestone(milestone = 'v1.49.613') {
  git(`tag ${milestone}`);
}

function runScript(args = '') {
  try {
    const stdout = execSync(`node "${SCRIPT_PATH}" ${args}`, {
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

beforeEach(() => { setupRepo(); });
afterEach(() => { try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {} });

describe('update-state-md-on-ship.mjs', () => {
  it('no-op when STATE.md does not exist', () => {
    rmSync(statePath);
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('no STATE.md');
  });

  it('no-op when milestone tag does not exist (not shipped yet)', () => {
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('milestone not shipped yet');
    // STATE.md unchanged
    expect(readFileSync(statePath, 'utf8')).toContain('status: planning');
  });

  it('no-op when status is already shipped (idempotent)', () => {
    setupRepo({ status: 'shipped' });
    tagMilestone();
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('already at status=shipped');
  });

  it('updates status: planning → shipped when tag exists', () => {
    tagMilestone();
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('UPDATED');
    const updated = readFileSync(statePath, 'utf8');
    expect(updated).toContain('status: shipped');
    expect(updated).not.toContain('status: planning');
  });

  it('adds shipped_at + shipped_at_sha fields after update', () => {
    tagMilestone();
    runScript();
    const updated = readFileSync(statePath, 'utf8');
    expect(updated).toMatch(/shipped_at:\s*"\d{4}-\d{2}-\d{2}T/);
    expect(updated).toMatch(/shipped_at_sha:\s*"[a-f0-9]{9}"/);
  });

  it('refreshes last_updated to current ISO timestamp', () => {
    tagMilestone();
    const before = readFileSync(statePath, 'utf8');
    expect(before).toContain('last_updated: "2026-05-07T00:00:00.000Z"');
    runScript();
    const after = readFileSync(statePath, 'utf8');
    expect(after).not.toContain('last_updated: "2026-05-07T00:00:00.000Z"');
    expect(after).toMatch(/last_updated:\s*"\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves body content verbatim', () => {
    tagMilestone();
    runScript();
    const updated = readFileSync(statePath, 'utf8');
    expect(updated).toContain('## Body');
    expect(updated).toContain('preserved verbatim');
  });

  it('preserves untouched frontmatter fields', () => {
    tagMilestone();
    runScript();
    const updated = readFileSync(statePath, 'utf8');
    expect(updated).toContain('milestone: v1.49.613');
    expect(updated).toContain('milestone_name: Test Milestone');
    expect(updated).toContain('opened_on: "2026-05-07"');
    expect(updated).toContain('gsd_state_version: 1.0');
  });

  it('--check reports without writing', () => {
    tagMilestone();
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('WOULD UPDATE');
    // Verify STATE.md was NOT written
    expect(readFileSync(statePath, 'utf8')).toContain('status: planning');
  });

  it('exits 1 when STATE.md is missing milestone field', () => {
    writeFileSync(statePath, '---\ngsd_state_version: 1.0\nstatus: planning\n---\nbody\n');
    const r = runScript();
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('missing `milestone` field');
  });

  it('exits 1 when STATE.md has no frontmatter', () => {
    writeFileSync(statePath, 'no frontmatter here\njust body\n');
    const r = runScript();
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('missing YAML frontmatter');
  });

  it('idempotent when run twice consecutively (no-op on second invocation)', () => {
    tagMilestone();
    const r1 = runScript();
    expect(r1.stdout).toContain('UPDATED');
    const r2 = runScript();
    expect(r2.stdout).toContain('already at status=shipped');
  });

  // -------------------------------------------------------------------------
  // Stale-stuck advancement (post-v1.49.621 fix).
  //
  // Reproduces the v1.49.616-620 scenario: STATE.md anchored on an older
  // tagged milestone with status=shipped, but newer milestone tags exist.
  // The original implementation no-op'd in this case (read its own stale
  // state and never advanced); the fix advances to the latest tag.
  // -------------------------------------------------------------------------
  describe('stale-stuck advancement', () => {
    function commitAndTag(label, tag) {
      writeFileSync(join(workDir, label), `${label}\n`);
      git(`add ${label}`);
      git(`commit -m "${label}"`);
      git(`tag ${tag}`);
    }

    it('advances STATE.md when stuck on an older shipped milestone with a newer tag present', () => {
      // STATE.md says v1.49.613 shipped; tags v1.49.613 and v1.49.621 exist.
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('newer1', 'v1.49.620');
      commitAndTag('newer2', 'v1.49.621');

      const r = runScript();
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('ADVANCED');
      expect(r.stdout).toContain('v1.49.613');
      expect(r.stdout).toContain('v1.49.621');

      const updated = readFileSync(statePath, 'utf8');
      expect(updated).toContain('milestone: v1.49.621');
      expect(updated).not.toContain('milestone: v1.49.613');
      expect(updated).toContain('status: shipped');
      expect(updated).toMatch(/shipped_at_tag:\s*"v1\.49\.621"/);
    });

    it('emits warning about predecessor_* fields when advancing', () => {
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('newer', 'v1.49.620');

      const r = runScript();
      expect(r.stdout).toContain('WARNING');
      expect(r.stdout).toContain('predecessor_*');
    });

    it('idempotent after advancement (second run is a no-op)', () => {
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('newer', 'v1.49.620');

      const r1 = runScript();
      expect(r1.stdout).toContain('ADVANCED');
      const r2 = runScript();
      expect(r2.stdout).toContain('already at status=shipped for v1.49.620');
    });

    it('--check reports WOULD ADVANCE without writing', () => {
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('newer', 'v1.49.620');

      const r = runScript('--check');
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('WOULD ADVANCE');
      // STATE.md unchanged
      expect(readFileSync(statePath, 'utf8')).toContain('milestone: v1.49.613');
    });

    it('does NOT advance when STATE.md milestone has no tag (newly-opened milestone)', () => {
      // Operator just opened v1.49.622 (no tag yet), but earlier tag v1.49.621 exists.
      setupRepo({ milestone: 'v1.49.622', status: 'planning' });
      commitAndTag('earlier', 'v1.49.621');

      const r = runScript();
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('milestone not shipped yet');
      // STATE.md unchanged — must NOT regress to v1.49.621
      const after = readFileSync(statePath, 'utf8');
      expect(after).toContain('milestone: v1.49.622');
      expect(after).toContain('status: planning');
    });

    it('adds shipped_at_tag field when advancing if missing', () => {
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('newer', 'v1.49.620');

      runScript();
      const updated = readFileSync(statePath, 'utf8');
      expect(updated).toMatch(/shipped_at_tag:\s*"v1\.49\.620"/);
    });

    it('ignores tags on disconnected branches (e.g. paused v1.50.x branch)', () => {
      // Reproduces the gsd-skill-creator real-world scenario: dev/main at
      // v1.49.621, but v1.50.43 tag exists on a separate paused branch.
      // The script must filter via `git tag --merged HEAD` and stay on dev's
      // history line.
      setupRepo({ milestone: 'v1.49.613', status: 'shipped' });
      tagMilestone('v1.49.613');
      commitAndTag('dev-newer', 'v1.49.620');

      // Branch off and add a higher version tag NOT reachable from main.
      git(`checkout -b v1.50-experiment`);
      writeFileSync(join(workDir, 'experimental'), 'experimental\n');
      git(`add experimental`);
      git(`commit -m "experimental"`);
      git(`tag v1.50.43`);
      git(`checkout main`); // back to the active branch

      const r = runScript();
      expect(r.exitCode).toBe(0);
      // Must advance to v1.49.620 (reachable), NOT v1.50.43 (disconnected).
      expect(r.stdout).toContain('v1.49.620');
      expect(r.stdout).not.toContain('v1.50.43');
      const updated = readFileSync(statePath, 'utf8');
      expect(updated).toContain('milestone: v1.49.620');
      expect(updated).not.toContain('milestone: v1.50.43');
    });
  });
});
