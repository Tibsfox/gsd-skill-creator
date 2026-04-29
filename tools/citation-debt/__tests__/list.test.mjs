// CF-C14 — citation-debt/list.mjs unit tests.
//
// Spec: .planning/missions/v1-49-585-concerns-cleanup/components/14-citation-debt-tool.md
//
// These tests live outside the current vitest include glob (which is src/**),
// matching the pattern of tools/release-history/__tests__/*.test.mjs. They are
// runnable via `node --test tools/citation-debt/__tests__/list.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const CLI = join(REPO_ROOT, 'tools', 'citation-debt', 'list.mjs');
const LEDGER = join(REPO_ROOT, '.planning', 'citation-debt.json');

function runCli(args, opts = {}) {
  try {
    const out = execFileSync('node', [CLI, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return {
      code: e.status ?? 1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
    };
  }
}

test('CF-C14-03 --help exits 0 and prints usage', () => {
  const r = runCli(['--help']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Options:/);
  assert.match(r.stdout, /--status/);
  assert.match(r.stdout, /--json/);
  assert.match(r.stdout, /Examples:/);
});

test('CF-C14-01 --status DEFERRED returns 1 entry (V-8)', () => {
  if (!existsSync(LEDGER)) return;
  const r = runCli(['--status', 'DEFERRED', '--json', '--no-color']);
  assert.equal(r.code, 0);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].v_flag_id, 'V-8');
});

test('CF-C14-02 --json produces parseable JSON array', () => {
  if (!existsSync(LEDGER)) return;
  const r = runCli(['--json']);
  assert.equal(r.code, 0);
  const parsed = JSON.parse(r.stdout);
  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.length >= 9);
});

test('--mission v1.49.584 returns the v1.49.584-origin entries', () => {
  if (!existsSync(LEDGER)) return;
  const r = runCli(['--mission', 'v1.49.584', '--json', '--no-color']);
  assert.equal(r.code, 0);
  const parsed = JSON.parse(r.stdout);
  assert.ok(parsed.length >= 1);
  for (const e of parsed) {
    assert.match(e.mission_origin, /v1\.49\.584/);
  }
});

test('--status with bogus value exits 3 (CLI arg error)', () => {
  const r = runCli(['--status', 'NOPE']);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /--status must be one of/);
});

test('missing ledger exits 1', () => {
  if (!existsSync(LEDGER)) return; // requires real ledger to swap aside
  const tmp = LEDGER + '.bak.' + Date.now();
  renameSync(LEDGER, tmp);
  try {
    const r = runCli(['--json']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /ledger not found/);
  } finally {
    renameSync(tmp, LEDGER);
  }
});

test('no-match filter exits 2', () => {
  if (!existsSync(LEDGER)) return;
  const r = runCli(['--mission', 'definitely-not-a-real-mission-xyz', '--json']);
  assert.equal(r.code, 2);
});

test('default human-readable output renders header and separator', () => {
  if (!existsSync(LEDGER)) return;
  const r = runCli(['--no-color']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /V-Flag/);
  assert.match(r.stdout, /Status/);
  assert.match(r.stdout, /Citation Target/);
  assert.match(r.stdout, /─/);
});
