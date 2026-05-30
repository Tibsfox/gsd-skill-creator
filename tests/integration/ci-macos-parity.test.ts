/**
 * CI macOS lane — parity + decoupling drift-guard (milestone v1.49.920 / audit T3.1).
 *
 * Pairs the new `.github/workflows/ci-macos.yml` lane with two load-bearing
 * invariants so it cannot silently rot (cross-ref #10461 gate-enforce-every-
 * runnable-surface + drift-guard pairing; two-layer-closure-discipline):
 *
 *   PARITY — the macOS job must run EVERY single-line `run:` command the Linux
 *     `test` job in ci.yml runs, plus the Grove fixture-gen prelude. If a future
 *     ship adds a test invocation to the Linux job (e.g. the v1.49.914 tools-
 *     suite addition) but forgets the macOS lane, the macOS check would silently
 *     test LESS than Linux. This guard derives the required set FROM ci.yml at
 *     test time, so it fails until both stay in lockstep.
 *
 *   DECOUPLING — ci-macos.yml must NOT carry a `push:` trigger. The pre-tag-gate
 *     ci-gate (tools/pre-tag-gate.sh step 4) selects the dev-tip headSha run from
 *     `gh run list --branch dev` and reads the run-level conclusion; a second
 *     push-triggered workflow on dev would both make macOS load-bearing for the
 *     ship gate AND make the gate's `.[0]` run-selection ambiguous. If someone
 *     adds `push:` here, this test forces the conversation.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const macos = readFileSync(join(REPO_ROOT, '.github/workflows/ci-macos.yml'), 'utf8');

// Isolate the Linux `test` job (the last job in ci.yml).
const testJobIdx = ci.indexOf('\n  test:\n');
const testJob = testJobIdx >= 0 ? ci.slice(testJobIdx) : '';

describe('CI macOS lane — parity + decoupling drift-guard', () => {
  it('ci-macos.yml exists and targets macos-latest', () => {
    expect(macos.length).toBeGreaterThan(0);
    expect(macos).toMatch(/runs-on:\s*macos-latest/);
  });

  it('DECOUPLING — ci-macos.yml carries NO push trigger (never enters the ci-gate dev-tip match)', () => {
    // A top-level (2-space-indented) `push:` key under `on:` would re-couple
    // the macOS lane to the ship-blocking ci-gate. Forbid it.
    expect(macos).not.toMatch(/^ {2}push:/m);
  });

  it('DECOUPLING — ci-macos.yml runs nightly + on demand (schedule + workflow_dispatch)', () => {
    expect(macos).toMatch(/^ {2}schedule:/m);
    expect(macos).toMatch(/cron:/);
    expect(macos).toMatch(/^ {2}workflow_dispatch:/m);
  });

  it('PARITY — the Linux test job was located in ci.yml', () => {
    expect(testJob.length).toBeGreaterThan(0);
    // sanity: the test job carries the bare full-suite run
    expect(testJob).toMatch(/npx vitest run/);
  });

  it('PARITY — every single-line `run:` command in the Linux test job is mirrored on macOS', () => {
    // Derive the required command set from ci.yml's test job, so a NEW Linux
    // test command automatically demands a macOS mirror (real drift-catching).
    const runCmds = [...testJob.matchAll(/^\s+- run:\s+(.+)$/gm)].map((m) => m[1].trim());
    expect(runCmds.length).toBeGreaterThanOrEqual(5);
    for (const cmd of runCmds) {
      expect(macos, `macOS lane is missing Linux test command: ${cmd}`).toContain(cmd);
    }
  });

  it('PARITY — the Grove arena fixture-gen prelude is mirrored on macOS', () => {
    // The fixture-gen lives in a `run: |` block (not a single-line run), so
    // assert its load-bearing tool invocation appears in both.
    expect(testJob).toMatch(/import-filesystem-skills\.ts/);
    expect(macos).toMatch(/import-filesystem-skills\.ts/);
  });
});
