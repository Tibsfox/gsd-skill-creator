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
  readFileSync,
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

// ─── --write mode (v1.49.954) ─────────────────────────────────────────────────

const EM = '—'; // em-dash

/** A richer fixture with both a Latest-shipped and a Predecessor line. */
function makeProjectMdWithPredecessor(latestV, latestName, predV, predName, date = '2026-06-01') {
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
    `**Latest shipped release (on dev = main, 0-commit drift):** **v${latestV} ${EM} ${latestName}** (shipped ${date}; tag \`v${latestV}\`).`,
    `**Predecessor (last shipped before this):** v${predV} ${EM} ${predName}.`,
    '',
    'HAND-AUTHORED PROSE that must be preserved verbatim across --write.',
    '',
    '## Tech Stack',
    'TS + Rust.',
    '',
    '## Architecture Gaps',
    '',
    '| ID | Gap | Priority | Status |',
    '|----|-----|----------|--------|',
    '| GAP-1 | Sample gap | Critical | CLOSED (test citation) |',
    '',
    `**Last updated:** ${date} ${EM} test fixture.`,
    '',
  ].join('\n');
}

describe('project-md-normalizer --write', () => {
  it('W1: rotates latest->predecessor, sets new latest, refreshes date', () => {
    const fixture = makeProjectMdWithPredecessor('1.49.952', 'Old Milestone', '1.49.951', 'Older Milestone');
    setupEnv({ projectContent: fixture, packageVersion: '1.49.953' });
    const r = runScript('--write --version v1.49.953 --name New_Milestone --date 2026-06-02');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('latest-shipped now v1.49.953');

    const written = readFileSync(projectPath, 'utf8');
    expect(written).toContain(`**v1.49.953 ${EM} New_Milestone** (shipped 2026-06-02; tag \`v1.49.953\`).`);
    // The old latest (v952) rotated into Predecessor.
    expect(written).toContain(`**Predecessor (last shipped before this):** v1.49.952 ${EM} Old Milestone.`);
    expect(written).toContain('**Last updated:** 2026-06-02');
  });

  it('W2: preserves hand-authored prose and the GAP table verbatim', () => {
    const fixture = makeProjectMdWithPredecessor('1.49.952', 'Old', '1.49.951', 'Older');
    setupEnv({ projectContent: fixture, packageVersion: '1.49.953' });
    runScript('--write --version 1.49.953 --name X --date 2026-06-02');
    const written = readFileSync(projectPath, 'utf8');
    expect(written).toContain('HAND-AUTHORED PROSE that must be preserved verbatim across --write.');
    expect(written).toContain('| GAP-1 | Sample gap | Critical | CLOSED (test citation) |');
    expect(written).toContain('## Tech Stack');
  });

  it('W3: is idempotent — re-running at the same version does not clobber the predecessor', () => {
    const fixture = makeProjectMdWithPredecessor('1.49.953', 'Current', '1.49.952', 'Prev');
    setupEnv({ projectContent: fixture, packageVersion: '1.49.953' });
    const r = runScript('--write --version 1.49.953 --name Current --date 2026-06-02');
    expect(r.exitCode).toBe(0);
    const written = readFileSync(projectPath, 'utf8');
    // Predecessor stays v952 (NOT rotated to v953).
    expect(written).toContain(`**Predecessor (last shipped before this):** v1.49.952 ${EM} Prev.`);
    expect(written).toContain(`**v1.49.953 ${EM} Current**`);
  });

  it('W4: --write without --version or --name exits 2', () => {
    const fixture = makeProjectMdWithPredecessor('1.49.952', 'Old', '1.49.951', 'Older');
    setupEnv({ projectContent: fixture, packageVersion: '1.49.953' });
    expect(runScript('--write --version v1.49.953').exitCode).toBe(2);
    expect(runScript('--write --name OnlyName').exitCode).toBe(2);
  });

  it('W5: after --write, --check passes against the bumped package.json (two-layer pairing)', () => {
    const fixture = makeProjectMdWithPredecessor('1.49.952', 'Old', '1.49.951', 'Older');
    setupEnv({ projectContent: fixture, packageVersion: '1.49.953' });
    // Omit --date so Last-updated defaults to today -> the staleness check never
    // trips (this test asserts a fully-clean --check).
    runScript('--write --version 1.49.953 --name New');
    const check = runScript('--check');
    expect(check.exitCode).toBe(0);
    expect(check.stdout).toContain('no drift');
  });
});
