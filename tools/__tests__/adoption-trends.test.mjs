/**
 * Tests for tools/adoption-trends.mjs — multi-snapshot trend report.
 *
 * Strategy: vitest spawnSync (per #10417) against a tmpdir fixture seeded
 * with synthetic ADOPTION-BASELINE-v*.json snapshots. Tests verify:
 *   - Status changes are detected across the timeline.
 *   - Persistent shelfware threshold honors SC_ADOPTION_STALE_SHIPS.
 *   - New-module watch window honors SC_NEW_MODULE_WATCH_SHIPS.
 *   - --check exits 1 on drift, 0 on no drift.
 *   - --since filters snapshots correctly.
 *   - Output is byte-identical across runs (idempotency).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TOOL = resolve(__dirname, '..', 'adoption-trends.mjs');

let cwd;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'adoption-trends-'));
  mkdirSync(join(cwd, 'docs'));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function snap(modules) {
  return JSON.stringify(modules);
}

function mod(name, status, opts = {}) {
  return {
    module: name,
    selfFiles: opts.selfFiles ?? 1,
    selfImporters: opts.selfImporters ?? 0,
    testImporters: opts.testImporters ?? [],
    cliImporters: opts.cliImporters ?? [],
    internalImporters: opts.internalImporters ?? [],
    externalImporters: opts.externalImporters ?? [],
    realCallerCount: opts.realCallerCount ?? 0,
    testCount: opts.testCount ?? 0,
    status,
    allowlisted: !!opts.allowlisted,
    allowlistReason: opts.allowlistReason ?? null,
  };
}

function run(args = [], env = {}) {
  return spawnSync('node', [TOOL, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

describe('adoption-trends', () => {
  it('detects test-only → living transition', () => {
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.800.json'), snap([mod('foo', 'test-only')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.801.json'), snap([mod('foo', 'living')]));
    const result = run(['--write']);
    expect(result.status).toBe(0);
    const report = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    expect(report).toContain('| `foo` | test-only → living | v1.49.801 | ✓ adoption |');
  });

  it('flags persistent shelfware honoring SC_ADOPTION_STALE_SHIPS=3', () => {
    for (let p = 0; p < 4; p++) {
      writeFileSync(
        join(cwd, `docs/ADOPTION-BASELINE-v1.49.${800 + p}.json`),
        snap([mod('shelf', 'test-only'), mod('live', 'living')]),
      );
    }
    const result = run(['--write'], { SC_ADOPTION_STALE_SHIPS: '3' });
    expect(result.status).toBe(0);
    const report = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    // The slice is the last 3 (v801, v802, v803); firstNonLivingSince = v801.
    expect(report).toContain('| `shelf` | 3 | test-only | v1.49.801 |');
    expect(report).not.toMatch(/\| `live` \| \d+/);
  });

  it('skips allowlisted modules from shelfware', () => {
    for (let p = 0; p < 4; p++) {
      writeFileSync(
        join(cwd, `docs/ADOPTION-BASELINE-v1.49.${800 + p}.json`),
        snap([mod('shelf-allowed', 'test-only', { allowlisted: true })]),
      );
    }
    const result = run(['--write'], { SC_ADOPTION_STALE_SHIPS: '3' });
    expect(result.status).toBe(0);
    const report = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    expect(report).toContain('_No modules have been non-living for ≥3 consecutive snapshots._');
  });

  it('lists new-module watch with shipsSinceFirstObserved counter', () => {
    // `old` first observed at v750 — outside the 2-snapshot window so excluded.
    // `new` first observed at v801 — inside the window so included.
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.750.json'), snap([mod('old', 'living')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.800.json'), snap([mod('old', 'living')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.801.json'), snap([mod('old', 'living'), mod('new', 'test-only')]));
    const result = run(['--write'], { SC_NEW_MODULE_WATCH_SHIPS: '2' });
    expect(result.status).toBe(0);
    const report = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    expect(report).toContain('| `new` | v1.49.801 | 1 | test-only | 0 |');
    expect(report).not.toMatch(/\| `old` \| v1\.49\.\d+/);
  });

  it('--check exits 0 on no drift, 1 on drift', () => {
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.800.json'), snap([mod('foo', 'living')]));
    run(['--write']);
    const noDrift = run(['--check']);
    expect(noDrift.status).toBe(0);
    // Mutate the JSON
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.801.json'), snap([mod('foo', 'test-only')]));
    const drift = run(['--check']);
    expect(drift.status).toBe(1);
    expect(drift.stderr).toContain('drift detected');
  });

  it('--since filters out older snapshots', () => {
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.700.json'), snap([mod('foo', 'test-only')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.800.json'), snap([mod('foo', 'living')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.801.json'), snap([mod('foo', 'living')]));
    const result = run(['--write', '--since=1.49.800']);
    expect(result.status).toBe(0);
    const report = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    // The test-only → living transition at v1.49.800 should be excluded
    // because the v1.49.700 snapshot is filtered out.
    expect(report).toContain('_No status changes across observed snapshots._');
    expect(report).toContain('Snapshots considered:** 2 (`v1.49.800` → `v1.49.801`)');
  });

  it('is idempotent across re-runs', () => {
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.800.json'), snap([mod('foo', 'living')]));
    writeFileSync(join(cwd, 'docs/ADOPTION-BASELINE-v1.49.801.json'), snap([mod('foo', 'living')]));
    run(['--write']);
    const first = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    run(['--write']);
    const second = readFileSync(join(cwd, 'docs/ADOPTION-TRENDS.md'), 'utf8');
    expect(second).toBe(first);
  });

  it('exits 1 when no baselines exist', () => {
    const result = run(['--write']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no ADOPTION-BASELINE-v*.json files');
  });
});
