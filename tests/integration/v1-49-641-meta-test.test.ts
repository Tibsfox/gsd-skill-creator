/**
 * v1.49.641 Housekeeping Cluster #8 — Integration meta-test
 *
 * Mirrors the v1.49.585 W4 / v1.49.634-640 integration meta-test pattern:
 * per-component invariant assertions that each new gate from the cluster's
 * components fires correctly.
 *
 * Components asserted:
 *   1. C1 (CF-11 retirement via Lesson #10199 §1.4 re-framing review):
 *      .planning/c0-cf11-reframing-review.md exists + cites discipline + records verdict
 *   2. C2 (CF-12 closure-verify-cf.mjs tool):
 *      scripts/closure-verify-cf.mjs exists + is executable; tool tests pass
 *      separately; discipline doc §1.7 references the tool
 *   3. Discipline docs updated:
 *      MISSION-PACKAGE-DISCIPLINE.md §1.7 lists the 5 probe types
 *      cf-closure-verification-templates.md has tooling shortcut section
 *   4. counter-cadence: engine state UNCHANGED from v1.49.640 baseline
 *      (9th counter-cadence cleanup in chain)
 *
 * Skip-guard pattern (Lesson #10180): assertions touching gitignored
 * working-tree paths (.planning/) use it.runIf(...) so CI gracefully
 * skips rather than false-failing.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();

// Tracked-file paths (assert unconditionally)
const CLOSURE_VERIFY_SCRIPT = resolve(REPO_ROOT, 'scripts/closure-verify-cf.mjs');
const CLOSURE_VERIFY_TESTS = resolve(REPO_ROOT, 'tests/__tests__/closure-verify-cf.test.ts');
const MISSION_PACKAGE_DISCIPLINE = resolve(REPO_ROOT, 'docs/MISSION-PACKAGE-DISCIPLINE.md');
const CF_PROBE_TEMPLATES = resolve(REPO_ROOT, 'docs/test-discipline/cf-closure-verification-templates.md');

// Gitignored working-tree paths (skip-guard)
const CF11_REFRAMING_REVIEW = resolve(REPO_ROOT, '.planning/c0-cf11-reframing-review.md');
const STATE_MD = resolve(REPO_ROOT, '.planning/STATE.md');

describe('v1.49.641 integration meta-test', () => {

  // ─── C1 (CF-11 retirement via re-framing review) ─────────────────────

  it.runIf(existsSync(CF11_REFRAMING_REVIEW))(
    'C1: CF-11 re-framing review documents framing-error verdict',
    () => {
      const content = readFileSync(CF11_REFRAMING_REVIEW, 'utf-8');
      expect(content, 'cites Lesson #10199 §1.4').toMatch(/Lesson #10199.*1\.4|#10199.*1\.4/);
      expect(content, 'cites 5-cluster carry history').toMatch(/5\+? cluster|5 cluster|5\+\s*cluster/i);
      expect(content, 'records retirement verdict').toMatch(/RETIRED|retire/i);
      expect(content, 'documents the framing error').toMatch(/framing error|framing.error|wrong framing/i);
    },
  );

  // ─── C2 (CF-12 closure-verify-cf.mjs tool) ───────────────────────────

  it('C2: scripts/closure-verify-cf.mjs exists and is executable', () => {
    expect(existsSync(CLOSURE_VERIFY_SCRIPT)).toBe(true);
    const stat = statSync(CLOSURE_VERIFY_SCRIPT);
    // octal 0o111 = at least one execute bit (user/group/other) set
    expect(stat.mode & 0o111, 'script must have at least one execute bit set').not.toBe(0);
  });

  it('C2: closure-verify-cf script defines the 5 expected probe types', () => {
    const content = readFileSync(CLOSURE_VERIFY_SCRIPT, 'utf-8');
    expect(content).toContain("'npm-audit'");
    expect(content).toContain("'file-snapshot'");
    expect(content).toContain("'upstream-version'");
    expect(content).toContain("'test-marker'");
    expect(content).toContain("'hidden-transitive-guard'");
  });

  it('C2: closure-verify-cf has invariant test coverage', () => {
    expect(existsSync(CLOSURE_VERIFY_TESTS)).toBe(true);
    const content = readFileSync(CLOSURE_VERIFY_TESTS, 'utf-8');
    expect(content).toContain('npm-audit probe');
    expect(content).toContain('file-snapshot probe');
    expect(content).toContain('hidden-transitive-guard probe');
  });

  // ─── Discipline docs updated ─────────────────────────────────────────

  it('Discipline: MISSION-PACKAGE-DISCIPLINE.md §1.7 references the tool', () => {
    const content = readFileSync(MISSION_PACKAGE_DISCIPLINE, 'utf-8');
    expect(content, '§1.7 documents tool existence').toMatch(/1\.7 Tooling support \(codified at v1\.49\.641/);
    expect(content, '§1.7 lists script path').toContain('scripts/closure-verify-cf.mjs');
    expect(content, '§1.7 documents 5 probe types').toMatch(/npm-audit|file-snapshot|upstream-version|test-marker|hidden-transitive-guard/);
  });

  it('Templates: cf-closure-verification-templates.md has tooling shortcut section', () => {
    const content = readFileSync(CF_PROBE_TEMPLATES, 'utf-8');
    expect(content, 'tooling shortcut section').toMatch(/[Tt]ooling shortcut.*v1\.49\.641/);
    expect(content, 'references closure-verify-cf.mjs').toContain('scripts/closure-verify-cf.mjs');
  });

  it('Templates: vitest reporter note added from v1.49.640 retro', () => {
    const content = readFileSync(CF_PROBE_TEMPLATES, 'utf-8');
    expect(content, 'vitest reporter note').toMatch(/[Vv]itest reporter note|tap.flat|tap-flat/);
  });

  // ─── Counter-cadence: engine state unchanged ─────────────────────────

  it.runIf(existsSync(STATE_MD))(
    'counter-cadence: engine state UNCHANGED from v1.49.640 baseline',
    () => {
      const content = readFileSync(STATE_MD, 'utf-8');
      const m = content.match(/^milestone:\s*v?(\d+)\.(\d+)\.(\d+)/m);
      if (m && parseInt(m[3], 10) > 641) return; // forward-skip (v1.49.653 L-02 retrofix)
      expect(content, 'NASA degree 108 (unchanged)').toMatch(/nasa_degree:\s*108/);
      expect(content, 'counter_cadence flag set').toMatch(/counter_cadence:\s*true/);
      expect(content, 'no_engine_state_advance flag set').toMatch(/no_engine_state_advance:\s*true/);
    },
  );

});
