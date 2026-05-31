/**
 * CI cross-platform matrix — parity + load-bearing drift-guard
 * (milestone v1.49.923; supersedes the v1.49.920 two-file ci-macos-parity guard).
 *
 * History: v1.49.920 stood up a SEPARATE `.github/workflows/ci-macos.yml` lane,
 * decoupled from the ship gate, guarded by a two-file parity test. v1.49.923
 * folded `macos-latest` into `ci.yml`'s `test` job as a `strategy.matrix` over
 * `os` and RETIRED `ci-macos.yml` (the documented promotion path), in the STAGED
 * form: the macOS leg carried `continue-on-error` so it ran on every push for
 * signal WITHOUT yet being load-bearing for the ship gate. v1.49.928 FLIPPED it to
 * load-bearing — the readiness gate (`tools/ci/macos-flip-readiness.mjs`) reached
 * 3/3 organic-churn greens, so the `continue-on-error` line was deleted and the
 * macOS leg now blocks a ship exactly like the ubuntu leg.
 *
 * This guard pins three load-bearing invariants (cross-ref #10461 gate-enforce-
 * every-runnable-surface + drift-guard pairing; two-layer-closure-discipline):
 *
 *   PARITY — because both OSes are legs of ONE job definition, they run the exact
 *     same steps by construction (no two-file drift is possible anymore). We still
 *     assert the matrix includes BOTH ubuntu-latest and macos-latest and that the
 *     job runs the full test-command set, so a future edit that drops an OS or a
 *     test invocation is caught.
 *
 *   LOAD-BEARING — the macOS leg MUST NOT carry `continue-on-error` (the v1.49.928
 *     flip deleted it). The pre-tag-gate ci-gate reads the run-level conclusion, and
 *     with nothing masking the macOS leg, a macOS-only failure now blocks a ship
 *     exactly like an ubuntu failure. REVERTING to non-blocking — re-adding a
 *     `continue-on-error` gated on `matrix.os == 'macos-latest'`, or a step-level one
 *     that masks BOTH legs — is a DELIBERATE act that must also update this test. If
 *     someone re-stages it silently, this guard forces the conversation. The flip was
 *     driven by a deterministic readiness verdict (`node tools/ci/macos-flip-
 *     readiness.mjs` -> READY 3/3 across organic churn; release/docs ships do not count).
 *
 *   RETIREMENT — `ci-macos.yml` must NOT exist. A re-created separate lane would
 *     re-introduce the `.[0]` run-selection ambiguity the v1.49.922 ci-gate pin
 *     fixed, and would duplicate the macOS coverage now living in the matrix.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');

// Isolate the `test` job: from its header up to the NEXT top-level (2-space
// indented) job key — NOT to EOF. `test` happens to be the last job today, but
// bounding to the next job header means a future job appended after `test:`
// cannot leak into this view and cause a false pass/fail of the asserts below.
const testJobIdx = ci.indexOf('\n  test:\n');
const afterHeader = testJobIdx >= 0 ? ci.slice(testJobIdx + 1) : '';
const nextJobRel = afterHeader.search(/\n {2}[A-Za-z0-9_-]+:\n/);
const testJob = nextJobRel >= 0 ? afterHeader.slice(0, nextJobRel) : afterHeader;

// Extract the matrix `os:` list, e.g. `os: [ubuntu-latest, macos-latest]`.
const osListMatch = testJob.match(/os:\s*\[([^\]]*)\]/);
const osList = osListMatch ? osListMatch[1] : '';

describe('CI cross-platform matrix — parity + load-bearing drift-guard', () => {
  it('RETIREMENT — the separate ci-macos.yml lane no longer exists', () => {
    expect(existsSync(join(REPO_ROOT, '.github/workflows/ci-macos.yml'))).toBe(false);
  });

  it('ci.yml is push-triggered on main + dev (so the macOS leg gets per-push signal)', () => {
    expect(ci).toMatch(/^on:\n\s+push:\n\s+branches:\s*\[main, dev\]/m);
  });

  it('PARITY — the test job was located and is matrixed over the OS', () => {
    expect(testJob.length).toBeGreaterThan(0);
    expect(testJob).toMatch(/runs-on:\s*\$\{\{\s*matrix\.os\s*\}\}/);
    expect(testJob).toMatch(/strategy:/);
    expect(testJob).toMatch(/matrix:/);
  });

  it('PARITY — the matrix includes BOTH ubuntu-latest and macos-latest', () => {
    expect(osList).toContain('ubuntu-latest');
    expect(osList).toContain('macos-latest');
  });

  it('LOAD-BEARING — the macOS leg is ship-blocking (the staged continue-on-error is GONE)', () => {
    // v1.49.928 flip: the macOS-gated `continue-on-error` line was deleted, so the
    // macOS leg now contributes to the run-level conclusion the ship gate reads.
    // Re-adding it (reverting macOS to non-blocking) is the deliberate reverse act
    // and MUST update this test. A silent re-stage fails here.
    expect(testJob).not.toMatch(
      /continue-on-error:\s*\$\{\{\s*matrix\.os\s*==\s*'macos-latest'\s*\}\}/,
    );
  });

  it('LOAD-BEARING — ZERO continue-on-error in the test job (neither leg is masked)', () => {
    // Both legs are load-bearing now. ANY continue-on-error — job-level (re-staging
    // the macOS leg) or step-level (which masks a step on BOTH legs, including the
    // ubuntu leg) — would silently weaken the gate. Forbid all of them.
    const count = (testJob.match(/continue-on-error:/g) || []).length;
    expect(count).toBe(0);
  });

  it('LOAD-BEARING — fail-fast is disabled so neither leg cancels the other', () => {
    expect(testJob).toMatch(/fail-fast:\s*false/);
  });

  it('PARITY — the test job still runs the full test-command set', () => {
    // The three load-bearing test invocations mirrored from the pre-matrix job.
    expect(testJob).toContain('npx vitest run');
    expect(testJob).toContain('npx vitest run --config vitest.tools.config.mjs');
    expect(testJob).toContain('node tools/check-tools-test-coverage.mjs --run-node-test');
  });

  it('PARITY — the Grove arena fixture-gen prelude is present in the test job', () => {
    expect(testJob).toMatch(/import-filesystem-skills\.ts/);
  });
});
