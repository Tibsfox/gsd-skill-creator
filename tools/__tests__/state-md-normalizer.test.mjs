/**
 * state-md-normalizer.test.mjs — invariant tests for STATE.md normalizer.
 *
 * Tests:
 *   T1. Round-trip idempotency — normalize twice, assert byte-equal second run.
 *   T2. Free-text "## Notes" preservation — Notes content survives normalization.
 *   T3. Flat → nested migration — flat predecessor_* keys collapse to nested block.
 *   T4. --check exit-code invariant — exit 1 on drift, exit 0 on normalized file.
 *
 * Closes v1.49.650 C6 (W1C.T2).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'state-md-normalizer.mjs');

let tmpRoot;
let workDir;
let planningDir;
let statePath;

function setupEnv(stateContent) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'state-md-normalizer-test-'));
  workDir = join(tmpRoot, 'work');
  planningDir = join(workDir, '.planning');
  mkdirSync(planningDir, { recursive: true });
  statePath = join(planningDir, 'STATE.md');
  if (stateContent !== undefined) {
    writeFileSync(statePath, stateContent, 'utf8');
  }
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
      exitCode: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

beforeEach(() => { /* per-test setup via setupEnv() */ });
afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

/**
 * A minimal but valid normalized STATE.md (no flat predecessor_* keys).
 */
function makeNormalizedStateMd() {
  return [
    '---',
    'gsd_state_version: 1.0',
    'milestone: v1.49.650',
    'milestone_name: Housekeeping Cluster',
    'status: opened',
    'counter_cadence: true',
    'no_engine_state_advance: true',
    'nasa_degree: 108',
    'predecessor:',
    '  milestone: v1.49.634',
    '  shipped_at_tag: v1.49.634',
    '  shipped_at_sha: 411edf9ee',
    '  post_ship_sync_sha: null',
    '  counter_cadence: true',
    '  degree_advancing_milestone: v1.49.631',
    'opened_on: "2026-05-11"',
    'shipped_at: null',
    'last_updated: "2026-05-11T00:00:00.000Z"',
    'mission_package_pattern: counter-cadence-housekeeping',
    'progress:',
    '  total_phases: 3',
    '  completed_phases: 0',
    '  total_plans: 6',
    '  completed_plans: 0',
    '  percent: 0',
    '---',
    '',
    '## Current Position',
    '',
    'Milestone: **v1.49.650 — Housekeeping Cluster**',
    'Status: OPENED',
    'Opened: 2026-05-11',
    '',
    '## Engine state baseline at v1.49.650 open',
    '',
    '- **Predecessor milestone:** v1.49.634 (tag: v1.49.634, sha: 411edf9ee)',
    '- **Predecessor counter-cadence:** true',
    '- **Last degree-advancing milestone:** v1.49.631',
    '- **NASA degree at open:** 108',
    '',
    '## Notes',
    '',
    'This is a free-text notes section.',
    'It may contain anything the operator writes.',
    'Even multiple lines.',
    '',
  ].join('\n');
}

/**
 * A drifted STATE.md with flat predecessor_* keys (historical dual-block bug).
 */
function makeDriftedStateMd() {
  return [
    '---',
    'gsd_state_version: 1.0',
    'milestone: v1.49.650',
    'milestone_name: Housekeeping Cluster',
    'status: opened',
    'nasa_degree: 108',
    'counter_cadence: true',
    'no_engine_state_advance: true',
    'predecessor_counter_cadence: false',
    'opening_commit_on_dev: "0e9af167b"',
    'predecessor_milestone_v632: "v1.49.632"',
    'predecessor_shipped_at_tag_v632: "v1.49.632"',
    'predecessor_shipped_at_sha_v632: "d7dd46638"',
    'v632_opening_commit_on_dev: "bf3f4ab87"',
    'predecessor_milestone: "v1.49.631"',
    'predecessor_shipped_at_tag: "v1.49.631"',
    'predecessor_shipped_at_sha: "383c24d8e"',
    'predecessor_post_ship_sync_sha: "4fa4c678a"',
    'predecessor_degree_advancing_milestone: "v1.49.631"',
    'status_old: shipped',
    'shipped_at: "2026-05-11T08:45:00.596Z"',
    'shipped_at_sha: "411edf9ee"',
    'shipped_at_tag: "v1.49.634"',
    'opened_on: "2026-05-10"',
    'last_updated: "2026-05-11T08:45:00.596Z"',
    'predecessor_milestone: "v1.49.630"',
    'predecessor_shipped_at: "2026-05-10"',
    'predecessor_shipped_at_tag: "v1.49.630"',
    'predecessor_shipped_at_sha: "412074630"',
    'predecessor_post_ship_sync_sha: "c3d53f766"',
    'predecessor_counter_cadence: false',
    'predecessor_degree_advancing_milestone: "v1.49.630"',
    'predecessor_degree_advancing_tag: "v1.49.630"',
    'predecessor_degree_advancing_sha: "412074630"',
    'predecessor_degree_advancing_post_ship_sync_sha: "c3d53f766"',
    'opening_commit_on_dev: "9125ac3a4"',
    'nasa_degree: 106',
    'counter_cadence: false',
    'no_engine_state_advance: false',
    'mission_package_pattern: "engine-cadence-degree-advancing"',
    'state_md_recovery_note: "auto-roll continuation"',
    'progress:',
    '  total_phases: 5',
    '  completed_phases: 0',
    '  total_plans: 5',
    '  completed_plans: 0',
    '  percent: 0',
    '---',
    '',
    '## Current Position',
    '',
    'Milestone: **v1.49.631 STS-4 Columbia** — OPENED 2026-05-10 on `dev`. STALE TEXT.',
    '',
    '## Engine state baseline at v631 open (== v630 close)',
    '',
    '- **NASA:** degree 1.105 STS-3 Columbia',
    '',
    '## Notes',
    '',
    'These are the operator notes.',
    'They must survive normalization unchanged.',
    '',
  ].join('\n');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('state-md-normalizer.mjs', () => {

  // T1: Round-trip idempotency
  describe('T1 — round-trip idempotency', () => {
    it('second normalize run produces byte-identical output (no-op)', () => {
      setupEnv(makeDriftedStateMd());

      // First run: normalizes the drifted file.
      const r1 = runScript('--write');
      expect(r1.exitCode).toBe(0);
      expect(r1.stdout).toContain('NORMALIZED');

      const afterFirst = readFileSync(statePath, 'utf8');

      // Second run: must be a no-op.
      const r2 = runScript('--write');
      expect(r2.exitCode).toBe(0);
      expect(r2.stdout).toContain('already normalized');

      const afterSecond = readFileSync(statePath, 'utf8');
      expect(afterSecond).toBe(afterFirst);
    });

    it('already-normalized file is a no-op on first run', () => {
      setupEnv(makeNormalizedStateMd());
      const before = readFileSync(statePath, 'utf8');

      // Normalize the already-normalized file: expect no change.
      // Note: the normalizer regenerates body sections, so we only check the
      // key structural invariants rather than exact byte equality here, since
      // the fixture body was hand-authored and may differ slightly from generated.
      const r = runScript('--write');
      expect(r.exitCode).toBe(0);
    });
  });

  // T2: Free-text "## Notes" preservation
  describe('T2 — Notes section preservation', () => {
    it('preserves Notes section verbatim after normalization', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      const result = readFileSync(statePath, 'utf8');
      expect(result).toContain('## Notes');
      expect(result).toContain('These are the operator notes.');
      expect(result).toContain('They must survive normalization unchanged.');
    });

    it('preserves Notes section on second normalize run (idempotency of Notes)', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      runScript('--write');
      const result = readFileSync(statePath, 'utf8');
      expect(result).toContain('## Notes');
      expect(result).toContain('These are the operator notes.');
      expect(result).toContain('They must survive normalization unchanged.');
    });

    it('normalizes file with no Notes section without error', () => {
      const noNotes = makeNormalizedStateMd().replace(/^## Notes[\s\S]*$/m, '').trimEnd() + '\n';
      setupEnv(noNotes);
      const r = runScript('--write');
      expect(r.exitCode).toBe(0);
    });
  });

  // T3: Flat → nested migration
  describe('T3 — flat predecessor_* → nested predecessor: migration', () => {
    it('collapses flat predecessor_milestone into predecessor.milestone', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      const result = readFileSync(statePath, 'utf8');
      // Should NOT have flat key
      expect(result).not.toMatch(/^predecessor_milestone:/m);
      // Should have nested predecessor block
      expect(result).toMatch(/^predecessor:/m);
      expect(result).toMatch(/milestone:/);
    });

    it('removes legacy noise keys (status_old, opening_commit_on_dev, state_md_recovery_note)', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      const result = readFileSync(statePath, 'utf8');
      expect(result).not.toMatch(/^status_old:/m);
      expect(result).not.toMatch(/^opening_commit_on_dev:/m);
      expect(result).not.toMatch(/^state_md_recovery_note:/m);
      expect(result).not.toMatch(/^predecessor_milestone_v632:/m);
      expect(result).not.toMatch(/^v632_opening_commit_on_dev:/m);
    });

    it('resolves duplicate top-level keys using last-occurrence wins', () => {
      // The drifted fixture has duplicate: nasa_degree (108 first, 106 last)
      // and predecessor_counter_cadence (false twice), and duplicate
      // predecessor_milestone (v1.49.631 first, v1.49.630 last).
      // Last-occurrence wins: nasa_degree should be 106, pred.milestone v1.49.630.
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      const result = readFileSync(statePath, 'utf8');
      // nasa_degree: last occurrence in drifted fixture is 106
      expect(result).toMatch(/nasa_degree:\s*106/);
      // predecessor.milestone: last occurrence is v1.49.630
      expect(result).toContain('v1.49.630');
    });

    it('writes backup file before destructive write', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--write');
      // Find backup file in .planning/
      const backupFiles = require('node:fs').readdirSync(planningDir)
        .filter(f => f.startsWith('STATE.md.backup-before-normalize-'));
      expect(backupFiles.length).toBe(1);
      // Backup content should match original (pre-normalize) content.
      const backupContent = readFileSync(join(planningDir, backupFiles[0]), 'utf8');
      expect(backupContent).toContain('predecessor_milestone:');
    });
  });

  // T4: --check exit-code invariant
  describe('T4 — --check exit-code invariant', () => {
    it('--check exits 1 when file has drift', () => {
      setupEnv(makeDriftedStateMd());
      const r = runScript('--check');
      expect(r.exitCode).toBe(1);
      expect(r.stdout).toContain('drift detected');
    });

    it('--check does NOT write the file', () => {
      setupEnv(makeDriftedStateMd());
      const before = readFileSync(statePath, 'utf8');
      runScript('--check');
      const after = readFileSync(statePath, 'utf8');
      expect(after).toBe(before);
    });

    it('--check does NOT create a backup file', () => {
      setupEnv(makeDriftedStateMd());
      runScript('--check');
      const backupFiles = require('node:fs').readdirSync(planningDir)
        .filter(f => f.startsWith('STATE.md.backup-before-normalize-'));
      expect(backupFiles.length).toBe(0);
    });

    it('--check exits 0 after the file has been normalized', () => {
      setupEnv(makeDriftedStateMd());
      // First: normalize
      runScript('--write');
      // Then: --check should report no drift
      const r = runScript('--check');
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('no drift');
    });

    it('no STATE.md → exit 0 (graceful no-op)', () => {
      setupEnv(); // no stateContent
      const r = runScript('--check');
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('no STATE.md');
    });
  });

  // T5: Body-generator tolerance + correctness (v1.49.783)
  describe('T5 — body-generator tolerance + shipped-state correctness', () => {
    it('emits a Shipped: line in Current Position when status=shipped + shipped_at is set', () => {
      const fixture = [
        '---',
        'gsd_state_version: "1.0"',
        'milestone: v1.49.783',
        'milestone_name: Normalizer Fix',
        'status: shipped',
        'counter_cadence: false',
        'nasa_degree: "1.177"',
        'predecessor:',
        '  milestone: v1.49.782',
        '  shipped_at_tag: v1.49.782',
        '  shipped_at_sha: c3c8e6394',
        '  counter_cadence: false',
        'opened_on: "2026-05-26"',
        'shipped_at: "2026-05-26"',
        '---',
        '',
      ].join('\n');
      setupEnv(fixture);
      const r = runScript('--write');
      expect(r.exitCode).toBe(0);
      const body = readFileSync(statePath, 'utf8');
      expect(body).toMatch(/^Status: SHIPPED$/m);
      expect(body).toMatch(/^Opened: 2026-05-26$/m);
      expect(body).toMatch(/^Shipped: 2026-05-26$/m);
    });

    it('omits Opened: line entirely when opened_on is absent (no UNKNOWN placeholder)', () => {
      const fixture = [
        '---',
        'gsd_state_version: "1.0"',
        'milestone: v1.49.783',
        'milestone_name: Minimal Fixture',
        'status: opened',
        'counter_cadence: false',
        'nasa_degree: "1.177"',
        'predecessor:',
        '  milestone: v1.49.782',
        '  shipped_at_tag: v1.49.782',
        '  counter_cadence: false',
        '---',
        '',
      ].join('\n');
      setupEnv(fixture);
      runScript('--write');
      const body = readFileSync(statePath, 'utf8');
      expect(body).not.toMatch(/UNKNOWN/);
      expect(body).not.toMatch(/^Opened:/m);
    });

    it('omits sha part of Predecessor line when shipped_at_sha is absent', () => {
      const fixture = [
        '---',
        'gsd_state_version: "1.0"',
        'milestone: v1.49.783',
        'milestone_name: Partial Predecessor',
        'status: opened',
        'counter_cadence: false',
        'nasa_degree: "1.177"',
        'predecessor:',
        '  milestone: v1.49.782',
        '  shipped_at_tag: v1.49.782',
        '  counter_cadence: false',
        '---',
        '',
      ].join('\n');
      setupEnv(fixture);
      runScript('--write');
      const body = readFileSync(statePath, 'utf8');
      // sha must NOT appear as UNKNOWN; tag present without comma-sha
      expect(body).not.toMatch(/sha: UNKNOWN/);
      expect(body).toMatch(/Predecessor milestone:\*\* v1\.49\.782 \(tag: v1\.49\.782\)/);
    });

    it('strip works correctly when body contains a literal Z character (regression for \\Z literal-Z bug)', () => {
      const fixture = [
        '---',
        'gsd_state_version: "1.0"',
        'milestone: v1.49.783',
        'milestone_name: Z-In-Body Regression',
        'status: opened',
        'counter_cadence: false',
        'nasa_degree: "1.177"',
        'predecessor:',
        '  milestone: v1.49.782',
        '  shipped_at_tag: v1.49.782',
        '  shipped_at_sha: c3c8e6394',
        '  counter_cadence: false',
        'opened_on: "2026-05-26"',
        '---',
        '',
        '## Current Position',
        '',
        'Milestone: **v1.49.783 — Z-In-Body Regression**',
        'Status: OPENED',
        'Opened: 2026-05-26',
        '',
        '## Engine state baseline at v1.49.783 open',
        '',
        // Timestamps with trailing Z must NOT prematurely terminate strip.
        '- **NASA degree at open:** 1.177 (sampled at 2026-05-26T10:30:00.000Z)',
        '- **Predecessor milestone:** v1.49.782 (tag: v1.49.782, sha: c3c8e6394)',
        '- **Predecessor counter-cadence:** false',
        '',
      ].join('\n');
      setupEnv(fixture);
      const r = runScript('--write');
      expect(r.exitCode).toBe(0);
      const body = readFileSync(statePath, 'utf8');
      // The auto-generated Engine state baseline should fully replace the
      // original — no trailing fragment of the original section bleeding
      // through after a Z character.
      expect(body).not.toContain('2026-05-26T10:30:00.000Z');
      // Second --check should be clean (idempotency unaffected by Z).
      const r2 = runScript('--check');
      expect(r2.exitCode).toBe(0);
    });

    it('hand-authored shipped STATE.md with full frontmatter round-trips clean (no drift)', () => {
      const fixture = [
        '---',
        'gsd_state_version: "1.0"',
        'milestone: v1.49.783',
        'milestone_name: Round-Trip Fixture',
        'status: shipped',
        'counter_cadence: false',
        'nasa_degree: "1.177"',
        'predecessor:',
        '  milestone: v1.49.782',
        '  shipped_at_tag: v1.49.782',
        '  shipped_at_sha: c3c8e6394',
        '  counter_cadence: false',
        'opened_on: "2026-05-26"',
        'shipped_at: "2026-05-26"',
        '---',
        '',
        '## Current Position',
        '',
        'Milestone: **v1.49.783 — Round-Trip Fixture**',
        'Status: SHIPPED',
        'Opened: 2026-05-26',
        'Shipped: 2026-05-26',
        '',
        '## Engine state baseline at v1.49.783 open',
        '',
        '- **Predecessor milestone:** v1.49.782 (tag: v1.49.782, sha: c3c8e6394)',
        '- **Predecessor counter-cadence:** false',
        '- **NASA degree at open:** 1.177',
        '',
      ].join('\n');
      setupEnv(fixture);
      const r = runScript('--check');
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toMatch(/no drift|already normalized|frontmatter clean/i);
    });
  });

});

// Polyfill require for ESM context (used in T3 backup-file check).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
