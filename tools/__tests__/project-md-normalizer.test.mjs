/**
 * project-md-normalizer.test.mjs — invariant tests for PROJECT.md normalizer.
 *
 * Closes v1.49.785 W1.T2 (audit strengthening lever S5 — convert PROJECT.md
 * prose-drift social rule into deterministic gate).
 *
 * Tests:
 *   T1. Clean PROJECT.md passes (exit 0, no findings)
 *   T2. Missing required section → BLOCK + exit 1
 *   T3. "Latest shipped release" version drift → WARN (exit 0 non-strict)
 *   T4. --strict flag escalates WARN to exit 1
 *   T5. Malformed GAP id → WARN
 *   T6. Unknown GAP status → WARN
 *   T7. Missing PROJECT.md → exit 2
 *   T8. Empty GAP table → BLOCK
 *   T9. Allowed-status enum accepts ADDRESSED + Intentional design + Open
 *   T10. \Z-in-body strip safety (the Lesson #10416 pattern)
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'project-md-normalizer.mjs');

let tmpRoot;
let workDir;
let planningDir;
let projectPath;
let packagePath;

function setupEnv({ projectContent, packageVersion = '1.49.785' } = {}) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'project-md-normalizer-test-'));
  workDir = join(tmpRoot, 'work');
  planningDir = join(workDir, '.planning');
  mkdirSync(planningDir, { recursive: true });
  projectPath = join(planningDir, 'PROJECT.md');
  packagePath = join(workDir, 'package.json');
  writeFileSync(packagePath, JSON.stringify({ name: 'test', version: packageVersion }), 'utf8');
  if (projectContent !== undefined) {
    writeFileSync(projectPath, projectContent, 'utf8');
  }
}

function runScript(args = '') {
  // spawnSync captures stderr regardless of exit code (execSync only surfaces
  // stderr via the catch path).
  const argv = args.length > 0 ? args.split(' ').filter(Boolean) : [];
  const result = spawnSync('node', [SCRIPT_PATH, ...argv], {
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeCleanProjectMd(version = '1.49.785', updatedDate) {
  const today = updatedDate ?? new Date().toISOString().slice(0, 10);
  return [
    '# Test Project Overview',
    '',
    '## What This Is',
    'Test project description.',
    '',
    '## Core Value',
    'Test value.',
    '',
    '## Current State',
    '',
    `**Latest shipped release (on dev = main, 0-commit drift):** **v${version} — Test Milestone**`,
    '',
    '## Tech Stack',
    'TS + Rust.',
    '',
    '## Architecture Gaps (from test audit)',
    '',
    '| ID | Gap | Priority | Status |',
    '|----|-----|----------|--------|',
    '| GAP-1 | Sample gap | Critical | CLOSED (test citation) |',
    '| GAP-2 | Another gap | High | IN PROGRESS |',
    '| GAP-3 | Intentional gap | N/A | Intentional design |',
    '',
    `**Last updated:** ${today} — test fixture.`,
    '',
  ].join('\n');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('project-md-normalizer', () => {
  it('T1: clean PROJECT.md passes with exit 0 and no findings', () => {
    setupEnv({ projectContent: makeCleanProjectMd('1.49.785'), packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('no drift');
    expect(r.stderr).toBe('');
  });

  it('T2: missing required section → BLOCK + exit 1', () => {
    const broken = makeCleanProjectMd('1.49.785').replace('## Tech Stack\nTS + Rust.\n', '');
    setupEnv({ projectContent: broken, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('[BLOCK]');
    expect(r.stderr).toContain('missing-section');
  });

  it('T3a: stale "Latest shipped release" (many versions behind) → WARN, exit 0 non-strict', () => {
    setupEnv({ projectContent: makeCleanProjectMd('1.49.600'), packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stderr).toContain('[WARN]');
    expect(r.stderr).toContain('latest-shipped-version-drift');
  });

  it('T3b: "Latest shipped release" one patch behind package.json passes (predecessor case)', () => {
    // Mid-T14: package.json bumped to N, PROJECT.md still references N-1
    setupEnv({ projectContent: makeCleanProjectMd('1.49.784'), packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('no drift');
  });

  it('T3c: "Latest shipped release" equal to package.json passes (steady-state case)', () => {
    setupEnv({ projectContent: makeCleanProjectMd('1.49.785'), packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('no drift');
  });

  it('T4: --strict flag escalates WARN to exit 1', () => {
    setupEnv({ projectContent: makeCleanProjectMd('1.49.600'), packageVersion: '1.49.785' });
    const r = runScript('--check --strict');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('[WARN]');
  });

  it('T5: malformed GAP id → WARN', () => {
    const broken = makeCleanProjectMd('1.49.785').replace('| GAP-1 |', '| GAPID-1 |');
    setupEnv({ projectContent: broken, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.stderr).toContain('gap-id-malformed');
  });

  it('T6: unknown GAP status → WARN', () => {
    const broken = makeCleanProjectMd('1.49.785').replace(
      '| GAP-2 | Another gap | High | IN PROGRESS |',
      '| GAP-2 | Another gap | High | sorta-done-maybe |',
    );
    setupEnv({ projectContent: broken, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.stderr).toContain('gap-status-unknown');
  });

  it('T7: missing PROJECT.md → exit 2', () => {
    setupEnv({ packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('not found');
  });

  it('T8: empty GAP table → BLOCK', () => {
    const broken = makeCleanProjectMd('1.49.785').replace(
      /\| GAP-\d \|[^\n]*\n/g,
      '',
    );
    setupEnv({ projectContent: broken, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('gap-table-empty');
  });

  it('T9: allowed-status enum accepts ADDRESSED + Intentional design + Open', () => {
    const fixture = makeCleanProjectMd('1.49.785').replace(
      '| GAP-1 | Sample gap | Critical | CLOSED (test citation) |',
      '| GAP-1 | Sample gap | Critical | ADDRESSED |',
    ).replace(
      '| GAP-2 | Another gap | High | IN PROGRESS |',
      '| GAP-2 | Another gap | High | Open |',
    );
    setupEnv({ projectContent: fixture, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('no drift');
  });

  it('T10: section walker tolerates Z characters in body (Lesson #10416)', () => {
    // The stripSection helper must not treat literal Z as a section boundary.
    // Inject "Z" characters into prose between the GAP table and the next section.
    const fixture = makeCleanProjectMd('1.49.785').replace(
      '**Last updated:**',
      'Some prose with ZZZZZ literal Zs.\n\n**Last updated:**',
    );
    setupEnv({ projectContent: fixture, packageVersion: '1.49.785' });
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
  });
});
