/**
 * verify-predecessor-engine-state.mjs — invariant tests for the
 * predecessor-engine-state audit gate.
 *
 * Hermetic setup: each test gets a tmpdir with a synthetic
 * MISSION-BRIEF.md + minimal www/tibsfox/com/Research/<TRACK>/<DEG>/index.html
 * fixtures.
 *
 * Closes IC-613-4 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'verify-predecessor-engine-state.mjs');

let tmpRoot;
let workDir;
let missionDir;

function setupRepo() {
  tmpRoot = mkdtempSync(join(tmpdir(), 'verify-predecessor-test-'));
  workDir = join(tmpRoot, 'work');
  missionDir = join(workDir, '.planning/missions/v1-49-613-test');
  mkdirSync(missionDir, { recursive: true });
}

function writeBrief(predecessorClause) {
  writeFileSync(
    join(missionDir, 'MISSION-BRIEF.md'),
    [
      '# v1.49.613 Test Mission',
      '',
      `**Predecessor (immediate + degree-advancing):** v1.49.612 — Test Mission (closed at tag \`v1.49.612\`; engine state at close: ${predecessorClause}).`,
      '',
    ].join('\n'),
  );
}

function writeIndex(track, degree, title) {
  const dir = join(workDir, 'www/tibsfox/com/Research', track, degree);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), `<html><head><title>${title}</title></head><body></body></html>`);
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

describe('verify-predecessor-engine-state.mjs', () => {
  it('exits 1 when MISSION-BRIEF missing', () => {
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('MISSION-BRIEF.md not found');
  });

  it('exits 1 when MISSION-BRIEF has no predecessor sentence', () => {
    writeFileSync(join(missionDir, 'MISSION-BRIEF.md'), '# brief without predecessor sentence\n');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('missing predecessor sentence');
  });

  it('PASS: all claims match on-disk titles', () => {
    writeBrief('NASA 1.89 / MUS 1.89 The Who *Quadrophenia* / ELC 1.89 OPEC oil embargo / SPS #86 Test Species');
    writeIndex('NASA', '1.89', 'NASA 1.89 — Mariner 10 First Mercury Flyby');
    writeIndex('MUS', '1.89', 'MUS 1.89 — The Who Quadrophenia');
    writeIndex('ELC', '1.89', 'ELC 1.89 — OPEC oil embargo and the energy crisis');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('PASS');
    expect(r.stdout).toContain('summary: 3 PASS');
  });

  it('FAIL: ELC claim "OPEC" mismatches actual title "Endangered Species Act" (the v613 bug)', () => {
    writeBrief('NASA 1.89 / MUS 1.89 The Who *Quadrophenia* / ELC 1.89 OPEC oil embargo / SPS #86 Test');
    writeIndex('NASA', '1.89', 'NASA 1.89 — Mariner 10');
    writeIndex('MUS', '1.89', 'MUS 1.89 — The Who Quadrophenia');
    writeIndex('ELC', '1.89', 'ELC 1.89 — Endangered Species Act of 1973');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(2);
    expect(r.stdout).toContain('FAIL');
    expect(r.stdout).toContain('ELC 1.89');
    expect(r.stdout).toContain('opec');
    expect(r.stderr).toContain('failed verification');
  });

  it('WARN: index.html missing for a claimed track-degree', () => {
    writeBrief('NASA 1.89 / MUS 1.89 The Who *Quadrophenia* / ELC 1.89 OPEC / SPS #86 Test');
    writeIndex('NASA', '1.89', 'NASA 1.89 — Mariner');
    writeIndex('MUS', '1.89', 'MUS 1.89 — Quadrophenia');
    // ELC missing on disk
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.stdout).toContain('WARN');
    expect(r.stdout).toContain('index.html missing');
  });

  it('SKIP: SPS uses slug-based subdirs; per-track verification deferred', () => {
    writeBrief('NASA 1.89 / MUS 1.89 Q / ELC 1.89 X / SPS #86 Northern Flying Squirrel');
    writeIndex('NASA', '1.89', 'NASA 1.89');
    writeIndex('MUS', '1.89', 'MUS 1.89 — Q');
    writeIndex('ELC', '1.89', 'ELC 1.89 — X here');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.stdout).toContain('SKIP');
    expect(r.stdout).toContain('SPS #86');
  });

  it('NASA degree marker check accepts "NASA 1.89" or "v1.89"', () => {
    writeBrief('NASA 1.89 / MUS 1.89 Q / ELC 1.89 X');
    writeIndex('NASA', '1.89', 'v1.89 — Mariner 10 — page title here');
    writeIndex('MUS', '1.89', 'MUS 1.89 — Q');
    writeIndex('ELC', '1.89', 'ELC 1.89 — X');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/NASA 1\.89.*PASS/s);
  });

  it('match ratio threshold: 50%+ keywords required for PASS', () => {
    writeBrief('NASA 1.89 / MUS 1.89 Foo Bar Baz Qux / ELC 1.89 X');
    writeIndex('NASA', '1.89', 'NASA 1.89');
    // Title has 2/4 significant tokens — exactly 50% threshold
    writeIndex('MUS', '1.89', 'MUS 1.89 — Foo Bar only here');
    writeIndex('ELC', '1.89', 'ELC 1.89 — X');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/MUS 1\.89.*PASS/s);
  });

  it('--auto finds latest mission package by mtime', () => {
    // Add an older mission package FIRST
    const olderDir = join(workDir, '.planning/missions/v1-49-612-older');
    mkdirSync(olderDir, { recursive: true });
    writeFileSync(join(olderDir, 'MISSION-BRIEF.md'), '# older\n');
    // Brief delay then write v1-49-613-test brief so it has later mtime
    execSync('sleep 0.05');
    writeBrief('NASA 1.89 / MUS 1.89 Q / ELC 1.89 X');
    // Re-touch the v1-49-613-test directory itself to ensure mtime ordering
    execSync(`touch "${missionDir}"`);
    writeIndex('NASA', '1.89', 'NASA 1.89');
    writeIndex('MUS', '1.89', 'MUS 1.89 — Q');
    writeIndex('ELC', '1.89', 'ELC 1.89 — X');
    const r = runScript('--auto');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('v1-49-613-test');
  });

  it('NASA-only claim with no pick text: PASS on degree marker alone', () => {
    writeBrief('NASA 1.89 / MUS 1.89 Q / ELC 1.89 X');
    writeIndex('NASA', '1.89', 'v1.89 — title');
    writeIndex('MUS', '1.89', 'MUS 1.89 — Q');
    writeIndex('ELC', '1.89', 'ELC 1.89 — X');
    const r = runScript('.planning/missions/v1-49-613-test');
    expect(r.exitCode).toBe(0);
  });
});
