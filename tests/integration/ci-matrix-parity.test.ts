/**
 * CI cross-platform matrix — parity + staged-non-blocking drift-guard
 * (milestone v1.49.923; supersedes the v1.49.920 two-file ci-macos-parity guard).
 *
 * History: v1.49.920 stood up a SEPARATE `.github/workflows/ci-macos.yml` lane,
 * decoupled from the ship gate, guarded by a two-file parity test. v1.49.923
 * folded `macos-latest` into `ci.yml`'s `test` job as a `strategy.matrix` over
 * `os` and RETIRED `ci-macos.yml` (the documented promotion path), but did so in
 * the STAGED form: the macOS leg carries `continue-on-error` so it runs on every
 * push for signal WITHOUT yet being load-bearing for the ship gate.
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
 *   STAGED / NON-BLOCKING — the macOS leg MUST keep `continue-on-error` gated on
 *     `matrix.os == 'macos-latest'`. The pre-tag-gate ci-gate reads the run-level
 *     conclusion; `continue-on-error` keeps a macOS-only failure out of it, so the
 *     ship is never blocked by the (still-unproven) macOS lane. Flipping macOS to
 *     load-bearing — deleting that `continue-on-error` line once N consecutive
 *     green macOS pushes accumulate — is a DELIBERATE act that must also update
 *     this test. If someone removes it silently, this guard forces the conversation.
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

describe('CI cross-platform matrix — parity + staged-non-blocking drift-guard', () => {
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

  it('STAGED — the macOS leg is NON-BLOCKING via continue-on-error gated on macos-latest', () => {
    // Load-bearing: removing/altering this is the deliberate "flip to blocking"
    // act and MUST update this test. A silent removal fails here.
    expect(testJob).toMatch(
      /continue-on-error:\s*\$\{\{\s*matrix\.os\s*==\s*'macos-latest'\s*\}\}/,
    );
  });

  it('STAGED — exactly ONE continue-on-error in the job (no step-level masking on the ubuntu leg)', () => {
    // The only continue-on-error must be the job-level matrix-gated one. A
    // second occurrence would be a step-level continue-on-error, which masks
    // that step on BOTH legs — including the load-bearing ubuntu leg. Forbid it.
    const count = (testJob.match(/continue-on-error:/g) || []).length;
    expect(count).toBe(1);
  });

  it('STAGED — fail-fast is disabled so a macOS failure cannot cancel the ubuntu leg', () => {
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
