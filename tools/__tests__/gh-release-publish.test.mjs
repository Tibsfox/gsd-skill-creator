/**
 * gh-release-publish.sh — invariant tests for the snap-confinement wrapper.
 *
 * Hermetic setup: each test gets a tmpdir with a minimal git repo and an
 * isolated $HOME. Tests run with GH_RELEASE_PUBLISH_DRY_RUN=1 so no real
 * `gh release create` is invoked.
 *
 * Authored 2026-05-02 in the post-v1.49.596 CLAUDE.md compaction phase
 * (Tier 2 — promote snap-confinement workaround prose to a wrapper).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'gh-release-publish.sh');

let tmpRoot;
let workDir;
let fakeHome;

function setupRepo() {
  tmpRoot = mkdtempSync(join(tmpdir(), 'gh-release-publish-test-'));
  workDir = join(tmpRoot, 'work');
  fakeHome = join(tmpRoot, 'home');
  mkdirSync(workDir, { recursive: true });
  mkdirSync(fakeHome, { recursive: true });

  execSync(`git init "${workDir}"`, { stdio: 'pipe' });
  execSync(`git -C "${workDir}" config user.email "test@example.com"`);
  execSync(`git -C "${workDir}" config user.name "Test"`);
  // Add an origin remote so the wrapper can parse OWNER/REPO for --repo flag
  // (IC-613-2 snap-confinement fix).
  execSync(
    `git -C "${workDir}" remote add origin https://github.com/Tibsfox/gsd-skill-creator.git`,
  );
}

function writeReleaseNotes(version, content = '# release\n') {
  const dir = join(workDir, 'docs', 'release-notes', `v${version}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), content);
}

function runScript(args, { dryRun = true, env = {} } = {}) {
  const command = `bash "${SCRIPT_PATH}" ${args}`;
  const fullEnv = {
    ...process.env,
    HOME: fakeHome,
    ...(dryRun ? { GH_RELEASE_PUBLISH_DRY_RUN: '1' } : {}),
    ...env,
  };
  try {
    const stdout = execSync(command, {
      cwd: workDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: fullEnv,
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

describe('gh-release-publish.sh', () => {
  it('dry-run: copies notes-file and prints the would-be gh invocation', () => {
    writeReleaseNotes('1.49.596', 'test release notes content\n');
    const r = runScript('1.49.596 "v1.49.596 — test"');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('DRY-RUN: notes-file copied to');
    expect(r.stdout).toMatch(/v1-49-596-rn\.md \(\d+ bytes\)/);
    expect(r.stdout).toContain('gh release create v1.49.596');
    expect(r.stdout).toContain('--title "v1.49.596 — test"');
    expect(r.stdout).toContain('--target main');
  });

  it('dry-run: defaults title to "v<version>" when title omitted', () => {
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('--title "v1.49.596"');
  });

  it('uses safe-version filename (dots → hyphens) to avoid shell-glob pitfalls', () => {
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.stdout).toContain('v1-49-596-rn.md');
    expect(r.stdout).not.toContain('v1.49.596-rn.md');
  });

  // snap-confinement (forcing the temp file into $HOME) is a Linux-packaging
  // concern; the exact $HOME path echo does not translate under Git Bash on
  // windows-latest (native vs MSYS path form), and snap does not exist there.
  it.skipIf(process.platform === 'win32')('places the temp file in $HOME (snap-confinement requirement)', () => {
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.stdout).toContain(`${fakeHome}/v1-49-596-rn.md`);
  });

  it('fails with exit 1 when release notes do not exist', () => {
    const r = runScript('9.99.999');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('release notes not found');
    expect(r.stderr).toContain('docs/release-notes/v9.99.999/README.md');
  });

  it('cleans up the temp file after run (trap rm)', () => {
    writeReleaseNotes('1.49.596');
    runScript('1.49.596');
    expect(existsSync(join(fakeHome, 'v1-49-596-rn.md'))).toBe(false);
  });

  it('fails with exit 1 with no version arg', () => {
    writeReleaseNotes('1.49.596');
    const r = runScript('');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('Usage');
  });

  it('IC-613-2: passes --repo OWNER/REPO flag in gh invocation (snap-confinement bypass)', () => {
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('--repo Tibsfox/gsd-skill-creator');
  });

  it('IC-613-2: parses owner/repo from https origin URL', () => {
    execSync(`git -C "${workDir}" remote set-url origin https://github.com/SomeOrg/some-repo.git`);
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('--repo SomeOrg/some-repo');
  });

  it('IC-613-2: parses owner/repo from ssh origin URL', () => {
    execSync(`git -C "${workDir}" remote set-url origin git@github.com:SomeOrg/some-repo.git`);
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('--repo SomeOrg/some-repo');
  });

  it('IC-613-2: fails with exit 1 when origin remote is missing', () => {
    execSync(`git -C "${workDir}" remote remove origin`);
    writeReleaseNotes('1.49.596');
    const r = runScript('1.49.596');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('could not parse OWNER/REPO');
  });
});
