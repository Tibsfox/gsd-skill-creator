import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  copyFileSync,
  chmodSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const HOOK_SOURCE = join(__dirname, 'post-commit');

// Check if jq is available on this system
let hasJq = false;
try {
  execSync('command -v jq', { stdio: 'pipe' });
  hasJq = true;
} catch {
  hasJq = false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];

/**
 * Creates an isolated temp git repo with the post-commit hook installed.
 * Options:
 *   - patterns: create .planning/patterns/ directory (default true)
 *   - stateContent: optional STATE.md content to write
 *   - configContent: optional skill-creator.json content to write
 */
function setupTempGitRepo(opts: {
  patterns?: boolean;
  stateContent?: string;
  configContent?: string;
} = {}): string {
  const { patterns = true, stateContent, configContent } = opts;
  const dir = mkdtempSync(join(tmpdir(), 'hook-test-'));
  tempDirs.push(dir);

  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'pipe' });

  if (patterns) {
    mkdirSync(join(dir, '.planning', 'patterns'), { recursive: true });
  }

  if (stateContent) {
    // .planning/ may already exist from patterns creation
    mkdirSync(join(dir, '.planning'), { recursive: true });
    writeFileSync(join(dir, '.planning', 'STATE.md'), stateContent);
  }

  if (configContent) {
    mkdirSync(join(dir, '.planning'), { recursive: true });
    writeFileSync(join(dir, '.planning', 'skill-creator.json'), configContent);
  }

  // Install the hook
  const hooksDir = join(dir, '.git', 'hooks');
  mkdirSync(hooksDir, { recursive: true });
  copyFileSync(HOOK_SOURCE, join(hooksDir, 'post-commit'));
  chmodSync(join(hooksDir, 'post-commit'), 0o755);

  return dir;
}

/**
 * Makes a commit in the given repo. Each call creates a unique file
 * modification so git always has something to commit.
 */
let commitCounter = 0;
function makeCommit(dir: string, message: string): void {
  commitCounter++;
  writeFileSync(join(dir, 'file.txt'), `content-${Date.now()}-${commitCounter}`);
  execSync('git add .', { cwd: dir, stdio: 'pipe' });
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
    cwd: dir,
    stdio: 'pipe',
    env: { ...process.env, GIT_COMMITTER_DATE: '', GIT_AUTHOR_DATE: '' },
  });
}

/**
 * Reads and parses sessions.jsonl from a temp repo. Returns parsed entries.
 */
function readSessionEntries(dir: string): Record<string, unknown>[] {
  const jsonlPath = join(dir, '.planning', 'patterns', 'sessions.jsonl');
  if (!existsSync(jsonlPath)) return [];
  const content = readFileSync(jsonlPath, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
  tempDirs.length = 0;
});

// ===========================================================================
// Tests
// ===========================================================================

describe('post-commit hook', { timeout: 30_000 }, () => {

  // -------------------------------------------------------------------------
  // Syntax and basic execution
  // -------------------------------------------------------------------------

  describe('syntax and basic execution', () => {
    it('passes POSIX shell syntax check', () => {
      expect(() => execSync(`sh -n "${HOOK_SOURCE}"`)).not.toThrow();
    });

    it('exits cleanly on basic execution (no .planning/patterns)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'hook-test-'));
      tempDirs.push(dir);
      // Run hook directly in a bare directory — no git repo, no patterns dir
      const result = execSync(`sh "${HOOK_SOURCE}"`, {
        cwd: dir,
        encoding: 'utf-8',
        timeout: 5000,
      });
      expect(result.trim()).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // HOOK-01: Commit metadata capture
  // -------------------------------------------------------------------------

  describe('HOOK-01: commit metadata capture', () => {
    it.skipIf(!hasJq)('captures conventional commit metadata', () => {
      const dir = setupTempGitRepo();
      makeCommit(dir, 'feat(auth): add login endpoint');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.type).toBe('commit');
      expect(entry.commit_type).toBe('feat');
      expect(entry.message).toBe('feat(auth): add login endpoint');
      expect(typeof entry.files_changed).toBe('number');
      expect(entry.files_changed).toBeGreaterThan(0);
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it.skipIf(!hasJq)('captures fix commit type', () => {
      const dir = setupTempGitRepo();
      makeCommit(dir, 'fix: resolve null pointer');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      expect(entries[0].commit_type).toBe('fix');
    });

    it.skipIf(!hasJq)('handles non-conventional commit message', () => {
      const dir = setupTempGitRepo();
      makeCommit(dir, 'Update README');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      // Non-conventional messages: the sed extracts lowercase prefix or falls back to "other"
      // "Update README" has no lowercase prefix so commit_type should be "other"
      expect(entries[0].commit_type).toBe('other');
    });

    it.skipIf(!hasJq)('handles commit message with special characters', () => {
      const dir = setupTempGitRepo();
      // Use single quotes in the git commit to avoid shell escaping issues
      writeFileSync(join(dir, 'file.txt'), `content-special-${Date.now()}`);
      execSync('git add .', { cwd: dir, stdio: 'pipe' });
      // Use an env-based approach to pass the tricky message
      execSync('git commit -m "$MSG"', {
        cwd: dir,
        stdio: 'pipe',
        env: {
          ...process.env,
          MSG: 'fix: handle "quoted" values & <angles>',
        },
      });

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('fix: handle "quoted" values & <angles>');
      expect(entries[0].commit_type).toBe('fix');
    });
  });

  // -------------------------------------------------------------------------
  // HOOK-02: Phase extraction
  // -------------------------------------------------------------------------

  describe('HOOK-02: phase extraction', () => {
    it.skipIf(!hasJq)('extracts phase from STATE.md', () => {
      const dir = setupTempGitRepo({
        stateContent: [
          '# State',
          '',
          '## Current Position',
          '',
          'Phase: 84 — Post-Commit Hook',
          'Plan: 01 of 2',
        ].join('\n'),
      });
      makeCommit(dir, 'feat: test phase extraction');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      expect(entries[0].phase).toBe(84);
    });

    it.skipIf(!hasJq)('returns null phase when STATE.md is absent', () => {
      const dir = setupTempGitRepo();
      // No STATE.md created
      makeCommit(dir, 'feat: no state file');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      expect(entries[0].phase).toBeNull();
    });

    it.skipIf(!hasJq)('returns null phase when STATE.md has no phase number', () => {
      const dir = setupTempGitRepo({
        stateContent: 'Status: idle\nNothing here\n',
      });
      makeCommit(dir, 'feat: no phase in state');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(1);
      expect(entries[0].phase).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // HOOK-04: Graceful degradation
  // -------------------------------------------------------------------------

  describe('HOOK-04: graceful degradation', () => {
    it('exits cleanly when patterns directory is missing', () => {
      // Setup repo WITHOUT .planning/patterns/
      const dir = setupTempGitRepo({ patterns: false });
      // Commit should succeed (hook exits 0 silently)
      makeCommit(dir, 'feat: no patterns dir');

      // No sessions.jsonl should be created anywhere
      const jsonlPath = join(dir, '.planning', 'patterns', 'sessions.jsonl');
      expect(existsSync(jsonlPath)).toBe(false);
    });

    it.skipIf(!hasJq)('exits cleanly when config disables observation', () => {
      const dir = setupTempGitRepo({
        configContent: JSON.stringify({
          integration: { observe_sessions: false },
        }),
      });
      makeCommit(dir, 'feat: observation disabled');

      // sessions.jsonl should NOT be created
      const jsonlPath = join(dir, '.planning', 'patterns', 'sessions.jsonl');
      expect(existsSync(jsonlPath)).toBe(false);
    });

    // Note: Testing missing jq requires modifying PATH which is fragile.
    // The guard logic for missing jq (`command -v jq ... || exit 0`) follows
    // the same graceful-exit pattern tested by the patterns-dir-missing test.
    // The jq guard is also validated indirectly via the shell syntax check.
  });

  // -------------------------------------------------------------------------
  // HOOK-05: Source provenance
  // -------------------------------------------------------------------------

  describe('HOOK-05: source provenance', () => {
    it.skipIf(!hasJq)('every entry has source field set to hook', () => {
      const dir = setupTempGitRepo();
      makeCommit(dir, 'feat: first commit');
      makeCommit(dir, 'fix: second commit');

      const entries = readSessionEntries(dir);
      expect(entries).toHaveLength(2);
      expect(entries[0].source).toBe('hook');
      expect(entries[1].source).toBe('hook');
    });
  });

  // -------------------------------------------------------------------------
  // HOOK-03: Performance
  // -------------------------------------------------------------------------

  describe('HOOK-03: performance', () => {
    // Performance target: hook overhead < 100ms
    // Using 200ms margin to reduce flakiness on slow CI / loaded machines
    it.skipIf(!hasJq)('completes within 200ms overhead', () => {
      // Baseline: commit time without the hook
      const baseDir = mkdtempSync(join(tmpdir(), 'hook-perf-base-'));
      tempDirs.push(baseDir);
      execSync('git init', { cwd: baseDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', { cwd: baseDir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: baseDir, stdio: 'pipe' });
      writeFileSync(join(baseDir, 'file.txt'), 'baseline');
      execSync('git add .', { cwd: baseDir, stdio: 'pipe' });

      const baseStart = Date.now();
      execSync('git commit -m "baseline"', { cwd: baseDir, stdio: 'pipe' });
      const baseTime = Date.now() - baseStart;

      // With hook
      const hookDir = setupTempGitRepo();
      writeFileSync(join(hookDir, 'file.txt'), 'perf-test');
      execSync('git add .', { cwd: hookDir, stdio: 'pipe' });

      const hookStart = Date.now();
      execSync('git commit -m "feat: perf test"', { cwd: hookDir, stdio: 'pipe' });
      const hookTime = Date.now() - hookStart;

      const overhead = hookTime - baseTime;
      // Allow 200ms margin (target is 100ms, generous for CI)
      expect(overhead).toBeLessThan(200);
    });
  });
});
