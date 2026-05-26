/**
 * adoption-refresh.test.mjs — invariant tests for the adoption-refresh
 * orchestrator (scan + diff + baseline-write + dashboard-render).
 *
 * Added v1.49.787 (Tier 1 T1.2 ship 2/3).
 *
 * Tests:
 *   T1. First-run (no prior baseline) writes baseline.md + baseline.json + dashboard
 *   T2. --dry-run writes nothing
 *   T3. --no-dashboard skips dashboard render
 *   T4. Diff vs prior baseline surfaces status changes
 *   T5. Diff suppresses ±1 caller-count fluctuations
 *   T6. No-changes-since-prior reports "no changes"
 *   T7. New modules detected
 *   T8. Removed modules detected
 *   T9. Overwrite guard refuses when target JSON exists with different content
 *   T10. --force overrides the overwrite guard
 *   T11. Idempotent re-run (content unchanged) succeeds without --force
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  copyFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const REFRESH_PATH = join(HERE, '..', 'adoption-refresh.mjs');
const SCAN_PATH = join(HERE, '..', 'adoption-scan.mjs');
const RENDER_PATH = join(HERE, '..', 'render-adoption-dashboard.mjs');

let tmpRoot;
let workDir;

function setupFixture(layout, version = '1.49.787') {
  tmpRoot = mkdtempSync(join(tmpdir(), 'adoption-refresh-test-'));
  workDir = join(tmpRoot, 'work');
  mkdirSync(workDir, { recursive: true });
  mkdirSync(join(workDir, 'tools'), { recursive: true });
  // Copy adoption-scan + render-adoption-dashboard into the temp dir so the
  // refresh's dirname-based __dirname resolution finds them.
  copyFileSync(SCAN_PATH, join(workDir, 'tools', 'adoption-scan.mjs'));
  copyFileSync(RENDER_PATH, join(workDir, 'tools', 'render-adoption-dashboard.mjs'));
  // Write package.json with the target version
  writeFileSync(
    join(workDir, 'package.json'),
    JSON.stringify({ name: 'test', version }),
    'utf8',
  );
  for (const [relPath, content] of Object.entries(layout)) {
    const abs = join(workDir, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
}

function runRefresh(args = '') {
  const argv = args.length > 0 ? args.split(' ').filter(Boolean) : [];
  const result = spawnSync('node', [REFRESH_PATH, ...argv], {
    cwd: workDir,
    encoding: 'utf8',
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('adoption-refresh', () => {
  it('T1: first run writes baseline.md + baseline.json + dashboard', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
    });
    const r = runRefresh();
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toContain('no prior baseline found');
    expect(existsSync(join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.787.md'))).toBe(true);
    expect(existsSync(join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.787.json'))).toBe(true);
    expect(existsSync(join(workDir, 'dashboard', 'adoption.html'))).toBe(true);
  });

  it('T2: --dry-run writes nothing', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    });
    const r = runRefresh('--dry-run');
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toContain('DRY-RUN');
    expect(existsSync(join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.787.md'))).toBe(false);
    expect(existsSync(join(workDir, 'dashboard', 'adoption.html'))).toBe(false);
  });

  it('T3: --no-dashboard skips dashboard render', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    });
    const r = runRefresh('--no-dashboard');
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.787.md'))).toBe(true);
    expect(existsSync(join(workDir, 'dashboard', 'adoption.html'))).toBe(false);
  });

  it('T4: diff vs prior baseline surfaces status changes', () => {
    // First run: foo is isolated
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    }, '1.49.786');
    const r1 = runRefresh();
    expect(r1.exitCode).toBe(0);
    expect(existsSync(join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.786.json'))).toBe(true);

    // Bump package.json + add a caller → foo becomes living
    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.49.787' }), 'utf8');
    mkdirSync(join(workDir, 'src', 'bar'), { recursive: true });
    writeFileSync(
      join(workDir, 'src', 'bar', 'index.ts'),
      "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
      'utf8',
    );
    const r2 = runRefresh();
    expect(r2.exitCode).toBe(0);
    expect(r2.stderr).toContain('change(s) since prior baseline');
    expect(r2.stderr).toContain('foo: isolated → living');
    expect(r2.stderr).toContain('new modules');
    expect(r2.stderr).toContain('bar');
  });

  it('T5: ±1 caller-count fluctuations are suppressed', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
    }, '1.49.786');
    runRefresh();

    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.49.787' }), 'utf8');
    // Add a +1 caller (foo had 1 caller, now has 2 — fluctuation should be suppressed)
    mkdirSync(join(workDir, 'src', 'baz'), { recursive: true });
    writeFileSync(
      join(workDir, 'src', 'baz', 'index.ts'),
      "import { FOO } from '../foo/index.js';\nexport const BAZ = FOO;\n",
      'utf8',
    );
    const r2 = runRefresh();
    expect(r2.exitCode).toBe(0);
    // Should report new module baz, and suppressed +1-caller fluctuation
    expect(r2.stderr).toContain('new modules');
    // foo's caller count went 1→2 (delta=1), so should be in suppressed fluctuations
    expect(r2.stderr).toContain('suppressed');
  });

  it('T6: no-changes-since-prior reports cleanly', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
    }, '1.49.786');
    runRefresh();

    // Don't change anything; just bump version and re-run
    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.49.787' }), 'utf8');
    const r2 = runRefresh();
    expect(r2.exitCode).toBe(0);
    expect(r2.stderr).toContain('no changes since prior baseline');
  });

  it('T7: new modules detected', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    }, '1.49.786');
    runRefresh();

    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.49.787' }), 'utf8');
    mkdirSync(join(workDir, 'src', 'newmod'), { recursive: true });
    writeFileSync(join(workDir, 'src', 'newmod', 'index.ts'), "export const N = 'new';\n", 'utf8');
    const r2 = runRefresh();
    expect(r2.stderr).toContain('new modules');
    expect(r2.stderr).toContain('newmod');
  });

  it('T8: removed modules detected', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "export const BAR = 'bar';\n",
    }, '1.49.786');
    runRefresh();

    writeFileSync(join(workDir, 'package.json'), JSON.stringify({ name: 'test', version: '1.49.787' }), 'utf8');
    rmSync(join(workDir, 'src', 'bar'), { recursive: true });
    const r2 = runRefresh();
    expect(r2.stderr).toContain('removed modules');
    expect(r2.stderr).toContain('bar');
  });

  it('T9: overwrite guard refuses when target JSON exists with different content', () => {
    // First run at v1.49.786 writes baseline.
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    }, '1.49.786');
    const r1 = runRefresh();
    expect(r1.exitCode).toBe(0);
    const baselineJson = join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.786.json');
    expect(existsSync(baselineJson)).toBe(true);
    const committedContent = readFileSync(baselineJson, 'utf8');

    // Simulate "forgot to bump-version" — package.json stays at .786 while
    // src/ gains a new module. Re-running refresh would overwrite the
    // committed v1.49.786 baseline with different content.
    mkdirSync(join(workDir, 'src', 'newmod'), { recursive: true });
    writeFileSync(
      join(workDir, 'src', 'newmod', 'index.ts'),
      "export const NEW = 'new';\n",
      'utf8',
    );
    const r2 = runRefresh();
    expect(r2.exitCode).toBe(3);
    expect(r2.stderr).toContain('refusing to overwrite');
    expect(r2.stderr).toContain('forget to run');
    expect(r2.stderr).toContain('AFTER bump-version');
    // On-disk file is unchanged.
    expect(readFileSync(baselineJson, 'utf8')).toBe(committedContent);
  });

  it('T10: --force overrides the overwrite guard', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    }, '1.49.786');
    runRefresh();
    const baselineJson = join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.786.json');
    const beforeContent = readFileSync(baselineJson, 'utf8');

    mkdirSync(join(workDir, 'src', 'newmod'), { recursive: true });
    writeFileSync(
      join(workDir, 'src', 'newmod', 'index.ts'),
      "export const NEW = 'new';\n",
      'utf8',
    );
    const r2 = runRefresh('--force');
    expect(r2.exitCode).toBe(0);
    expect(r2.stderr).toContain('--force overriding');
    // On-disk file IS updated under --force.
    expect(readFileSync(baselineJson, 'utf8')).not.toBe(beforeContent);
  });

  it('T11: idempotent re-run (content unchanged) succeeds without --force', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
    }, '1.49.786');
    const r1 = runRefresh();
    expect(r1.exitCode).toBe(0);
    const baselineJson = join(workDir, 'docs', 'ADOPTION-BASELINE-v1.49.786.json');
    const firstContent = readFileSync(baselineJson, 'utf8');

    // Re-run at the same version with NO source changes.
    const r2 = runRefresh();
    expect(r2.exitCode).toBe(0);
    expect(r2.stderr).not.toContain('refusing to overwrite');
    expect(r2.stderr).not.toContain('--force overriding');
    // Content is byte-identical.
    expect(readFileSync(baselineJson, 'utf8')).toBe(firstContent);
  });
});
