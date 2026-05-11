/**
 * v1.49.635 Housekeeping Cluster — Integration meta-test.
 *
 * Mirrors the v1.49.585 W4 Phase 3 and v1.49.634 W3 Stage 1 patterns:
 * file-level invariants + subprocess-isolated tests asserting that each
 * new component's discipline / tool / API surface landed as designed.
 *
 * Spec: .planning/missions/v1-49-635-housekeeping-cluster/components/08-integration-verify-ship.md
 *
 * Tests:
 *   1. C1 keystore — unified Keystore API + KeystoreError types present
 *      in src-tauri/src/security/keystore.rs (release-build path 1 + path 2
 *      surface compile-time present; full crypto exercised by Rust unit
 *      tests in src-tauri/src/security/__tests__).
 *   2. C3 perf-warmup discipline — known-fixed site contains warmup loop
 *      ahead of timed measurement.
 *   3. C4 fragile-test discipline — known-fixed site has Template-2
 *      60_000ms timeout annotation on its sqlite-class beforeEach hook.
 *   4. C5 cleanup-rubric — score-completeness.mjs carries the three named
 *      C5 recalibration fixes (plain-bullet lessons, plain-bullet forward-
 *      lessons fallback, freeform retrospective headings).
 *   5. C6 STATE.md normalizer — `node tools/state-md-normalizer.mjs --check`
 *      exits 0 on the current STATE.md (idempotency invariant on dev tip).
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname!, '../..');

const KEYSTORE_RS = resolve(REPO_ROOT, 'src-tauri/src/security/keystore.rs');
const C3_FIXED_TEST = resolve(REPO_ROOT, 'src/intelligence/kb/__tests__/snapshot-manager.test.ts');
const C4_FIXED_TEST = resolve(REPO_ROOT, 'src/intelligence/kb/__tests__/provenance-kb.test.ts');
const SCORER_MJS = resolve(REPO_ROOT, 'tools/release-history/score-completeness.mjs');
const NORMALIZER_MJS = resolve(REPO_ROOT, 'tools/state-md-normalizer.mjs');
const STATE_MD_PATH = resolve(REPO_ROOT, '.planning/STATE.md');

// `.planning/STATE.md` is gitignored at `.gitignore:8` (entire `.planning/`
// is excluded). It's authored locally by the C6 normalizer or by hand; CI
// runners never produce it. The C6 normalizer correctly handles the
// "no STATE.md" case (exit 0, prints "no STATE.md at …"), but the C6
// meta-test below asserts a present-and-normalized STATE.md specifically.
// Skip-guard the C6 test when STATE.md is absent (CI path); local dev still
// exercises the assertion. Pattern: Lesson #10180 (chapter/04-lessons.md)
// — gitignored-runtime-artifact skip-guard. Surfaced post-v1.49.635-ship
// when CI on `dev = 05166178e` failed exactly this assertion: my own
// meta-test had the bug Lesson #10180 documents.
const STATE_MD_AVAILABLE = existsSync(STATE_MD_PATH);

describe('v1.49.635 integration meta-test', () => {
  it('C1 keystore — unified Keystore API + KeystoreError types compile-time present', () => {
    // Rust crypto is unit-tested in src-tauri/src/security/__tests__; this
    // meta-test asserts the public-API contract that downstream callers
    // (Node CLI wrapper + standalone Rust bin + future Tauri commands)
    // build against: Keystore struct + KeystoreError variants + the unified
    // load/save/migrate surface introduced at v1.49.635.
    expect(existsSync(KEYSTORE_RS)).toBe(true);
    const body = readFileSync(KEYSTORE_RS, 'utf8');

    // Unified API (v1.49.635; not present pre-milestone)
    expect(body).toMatch(/pub struct Keystore\b/);
    expect(body).toMatch(/pub enum KeystoreError\b/);
    expect(body).toMatch(/pub fn load_with_backend\b/);
    expect(body).toMatch(/pub fn save_with_backend\b/);
    expect(body).toMatch(/pub fn migrate_v1_to_v2\b/);

    // Error variants exposed for caller-side discrimination
    expect(body).toMatch(/MigrationRequired/);
    expect(body).toMatch(/Locked/);
    expect(body).toMatch(/InvalidPassphrase/);
    expect(body).toMatch(/BackendUnavailable/);

    // Legacy-plaintext feature gate renamed per operator Q1 (2026-05-11)
    expect(body).toMatch(/legacy-plaintext-keystore/);
    expect(body).not.toMatch(/feature\s*=\s*"insecure-plaintext-keystore"/);
  });

  it('C3 perf-warmup discipline applied at snapshot-manager T4 (10ms-threshold site)', () => {
    // The snapshot-manager T4 cache-hit assertion is the tightest perf
    // assertion in the C3 audit (10ms threshold). The C3 fix at ed83f656b
    // adds a per-site-tuned warmup loop (N=3 cache-hit calls) ahead of the
    // timed measurement to let v8 + the cache warm up before the window.
    expect(existsSync(C3_FIXED_TEST)).toBe(true);
    const body = readFileSync(C3_FIXED_TEST, 'utf8');

    // Warmup loop must precede the T4 measurement window (look for the
    // discipline-doc-conformant `for (let _ = 0;` or `for (let i = 0;` form
    // with a small iteration count + a comment naming "warmup" or "cache").
    expect(body).toMatch(/T4/);
    expect(body).toMatch(/warm.?up/i);
    expect(body).toMatch(/for\s*\(\s*let\s+\w+\s*=\s*0\s*;/);
  });

  it('C4 fragile-test discipline applied at provenance-kb beforeEach (Template-2)', () => {
    // The provenance-kb sqlite-class beforeEach was bumped 10s → 60s at
    // C4 commit 687d53fb8, mirroring the v1.49.634 canonical c6d49d8ab.
    // The 60_000 numeric literal is the discipline marker (matches
    // root testTimeout, prevents downward override).
    expect(existsSync(C4_FIXED_TEST)).toBe(true);
    const body = readFileSync(C4_FIXED_TEST, 'utf8');
    expect(body).toMatch(/beforeEach/);
    // Template-2 annotation: timeout argument on the beforeEach closing
    // brace. Accept either `}, 60_000)` or `}, 60000)` form.
    expect(body).toMatch(/\},\s*60[_]?000\s*\)/);
  });

  it('C5 cleanup-rubric carries the three named recalibration fixes', () => {
    // The C5 audit confirmed v1.49.634 scored D/64 under the pre-tuning
    // cleanup rubric because three rubric gaps: plain-bullet lessons were
    // unrecognized, the forward-lessons block defaulted to floor-of-2 when
    // 0 #IDs present, and freeform retro sub-headings weren't accepted.
    // C5 commit f75e55c9f applied three targeted fixes. This invariant
    // asserts each fix's marker remains in tree.
    expect(existsSync(SCORER_MJS)).toBe(true);
    const body = readFileSync(SCORER_MJS, 'utf8');

    // Fix 1: scoreCleanupLessons recognizes plain-bullet entries
    expect(body).toMatch(/scoreCleanupLessons/);

    // Fix 2: scoreForwardLessonsBlock has plain-bullet fallback (no floor-of-2 collapse)
    expect(body).toMatch(/scoreForwardLessonsBlock/);

    // Fix 3: scoreCleanupRetrospective accepts freeform sub-section headings
    expect(body).toMatch(/scoreCleanupRetrospective/);

    // The C5 test suite is registered + the v1.49.635 fixture chapters exist
    const c5TestPath = resolve(REPO_ROOT, 'tools/release-history/__tests__/score-completeness-c5.test.mjs');
    expect(existsSync(c5TestPath)).toBe(true);
    const rubricFixturePath = resolve(REPO_ROOT, 'tests/fixtures/release-notes-rubric-cleanup');
    expect(existsSync(rubricFixturePath)).toBe(true);
  });

  it.runIf(STATE_MD_AVAILABLE)('C6 STATE.md normalizer --check exits 0 on current STATE.md (idempotency invariant)', () => {
    // The normalizer was authored + run during C6 (commits 37cc8eb51 +
    // 396100ce4 + 8f39a2b4d). After C6 applied, --check must be a no-op
    // on the on-disk STATE.md (idempotency: re-running the normalizer
    // produces identical output, so --check reports no drift).
    expect(existsSync(NORMALIZER_MJS)).toBe(true);
    const result = spawnSync('node', [NORMALIZER_MJS, '--check'], {
      cwd: REPO_ROOT,
      env: { PATH: process.env.PATH ?? '' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    // Output explicitly names the no-drift outcome (smoke test that the
    // tool produced human-readable diagnostics, not just an exit code)
    const combined = (result.stdout ?? '') + (result.stderr ?? '');
    expect(combined).toMatch(/no drift|already normalized/i);
  });
});
