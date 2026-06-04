/**
 * Tests for tools/adoption-baseline-freshness.mjs — adoption-baseline freshness gate.
 *
 * Strategy: vitest spawnSync (per #10417) against a tmpdir fixture seeded with a
 * package.json (the "current" version) and synthetic ADOPTION-BASELINE-v*.json
 * files (only the FILENAME version matters — the tool never reads their content).
 *
 * The load-bearing assertions are the FRESH (exit 0) / STALE (exit 1) pair: the
 * STALE case is the negative-test fixture the audit (T1.3) requires so the gate
 * is proven to actually fire on a deliberately-stale baseline, not just pass.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TOOL = resolve(__dirname, '..', 'adoption-baseline-freshness.mjs');

let cwd;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'adoption-freshness-'));
  mkdirSync(join(cwd, 'docs'));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function pkg(version) {
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 't', version }));
}

function baseline(version) {
  writeFileSync(join(cwd, `docs/ADOPTION-BASELINE-v${version}.json`), '[]\n');
}

function run(args = [], env = {}) {
  return spawnSync('node', [TOOL, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

describe('adoption-baseline-freshness', () => {
  it('FRESH (exit 0) when the baseline matches the current version', () => {
    pkg('1.49.965');
    baseline('1.49.965');
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('FRESH');
    expect(r.stdout).toContain('0 ship(s) behind');
  });

  it('FRESH (exit 0) when the baseline trails within max-drift', () => {
    pkg('1.49.965');
    baseline('1.49.945'); // 20 ships behind, default max-drift 30
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('20 ship(s) behind');
  });

  it('STALE (exit 1) when the baseline trails beyond max-drift — the negative fixture', () => {
    pkg('1.49.965');
    baseline('1.49.801'); // 164 ships behind — the real v801 freeze the audit flagged
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('STALE');
    expect(r.stderr).toContain('164 ship(s) behind');
    expect(r.stderr).toContain('adoption-refresh.mjs');
  });

  it('STALE (exit 1) when no baseline exists at all', () => {
    pkg('1.49.965');
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('no docs/ADOPTION-BASELINE');
  });

  it('honors --max-drift (10 → a 20-ship trail is now stale)', () => {
    pkg('1.49.965');
    baseline('1.49.945'); // 20 behind
    expect(run(['--max-drift', '10']).status).toBe(1);
    expect(run(['--max-drift', '25']).status).toBe(0);
  });

  it('honors SC_ADOPTION_BASELINE_MAX_DRIFT env override', () => {
    pkg('1.49.965');
    baseline('1.49.945'); // 20 behind
    expect(run([], { SC_ADOPTION_BASELINE_MAX_DRIFT: '5' }).status).toBe(1);
    expect(run([], { SC_ADOPTION_BASELINE_MAX_DRIFT: '50' }).status).toBe(0);
  });

  it('picks the NEWEST baseline when several are present', () => {
    pkg('1.49.965');
    baseline('1.49.801');
    baseline('1.49.960'); // newest, 5 behind → fresh
    baseline('1.49.900');
    const r = run(['--json']);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.newestBaseline).toBe('1.49.960');
    expect(out.driftShips).toBe(5);
    expect(out.fresh).toBe(true);
  });

  it('FRESH (exit 0, drift 0) when the baseline is AHEAD of current', () => {
    pkg('1.49.960');
    baseline('1.49.965'); // ahead — never negative drift
    const r = run(['--json']);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).driftShips).toBe(0);
  });

  it('STALE (exit 1) when the newest baseline is from an older release line', () => {
    pkg('1.50.3');
    baseline('1.49.964'); // different minor, older line → not a ship-count
    const r = run(['--json']);
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.driftShips).toBe(null);
    expect(out.fresh).toBe(false);
  });

  it('STALE (exit 1) when the newest baseline is from a NEWER minor on the same major', () => {
    // Review BLOCKER #1: a baseline AHEAD on a different line must not report FRESH.
    pkg('1.50.100');
    baseline('1.51.0');
    const r = run(['--json']);
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.driftShips).toBe(null);
    expect(out.fresh).toBe(false);
  });

  it('STALE (exit 1) when a future-MAJOR baseline is present (cannot mask staleness)', () => {
    pkg('1.50.100');
    baseline('999.0.0'); // a stray future-major file must never forever-report FRESH
    const r = run(['--json']);
    expect(r.status).toBe(1);
    expect(JSON.parse(r.stdout).fresh).toBe(false);
  });

  it('FRESH at the EXACT boundary (drift == max-drift), STALE one past', () => {
    pkg('1.49.965');
    baseline('1.49.935'); // exactly 30 behind
    expect(run(['--max-drift', '30']).status).toBe(0); // boundary is inclusive (<=)
    expect(run(['--max-drift', '29']).status).toBe(1); // one past → stale
  });

  it('--max-drift flag takes precedence over the env var', () => {
    pkg('1.49.965');
    baseline('1.49.935'); // 30 behind
    expect(run(['--max-drift', '10'], { SC_ADOPTION_BASELINE_MAX_DRIFT: '50' }).status).toBe(1); // flag 10 wins → stale
    expect(run(['--max-drift', '50'], { SC_ADOPTION_BASELINE_MAX_DRIFT: '10' }).status).toBe(0); // flag 50 wins → fresh
  });

  it('honors --version to override the current version', () => {
    pkg('1.49.801'); // ignored
    baseline('1.49.801');
    expect(run(['--version', '1.49.965']).status).toBe(1); // 164 behind vs the override
    expect(run(['--version', '1.49.805']).status).toBe(0); // 4 behind
  });

  it('--json emits the structured payload', () => {
    pkg('1.49.965');
    baseline('1.49.950');
    const r = run(['--json']);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out).toMatchObject({
      current: '1.49.965',
      newestBaseline: '1.49.950',
      driftShips: 15,
      maxDrift: 30,
      fresh: true,
    });
  });

  it('FATAL (exit 2) when package.json is absent and no --version given', () => {
    baseline('1.49.965');
    const r = run();
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('no package.json');
  });

  it('FATAL (exit 2) on an unparseable package.json version', () => {
    pkg('not-a-version');
    baseline('1.49.965');
    const r = run();
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('not a valid semver');
  });
});
