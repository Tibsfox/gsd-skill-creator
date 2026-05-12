/**
 * v1.49.642 Housekeeping Cluster #9 — Integration meta-test
 *
 * Mirrors the v1.49.585 W4 / v1.49.634-641 integration meta-test pattern.
 *
 * Components asserted:
 *   1. C1 (CF-14): per-CF probe spec format
 *      - scripts/closure-verify-cf.mjs has 'auto' in PROBES map
 *      - script imports parseYaml from 'yaml'
 *      - usage text mentions auto subcommand
 *      - extended test suite present (14 tests; was 9)
 *   2. Discipline docs updated:
 *      - MISSION-PACKAGE-DISCIPLINE.md §1.7 references auto subcommand
 *      - cf-closure-verification-templates.md auto-dispatch section
 *   3. counter-cadence: engine state UNCHANGED from v1.49.641 baseline
 *      (10th counter-cadence cleanup in chain)
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();

const CLOSURE_VERIFY_SCRIPT = resolve(REPO_ROOT, 'scripts/closure-verify-cf.mjs');
const CLOSURE_VERIFY_TESTS = resolve(REPO_ROOT, 'tests/__tests__/closure-verify-cf.test.ts');
const MISSION_PACKAGE_DISCIPLINE = resolve(REPO_ROOT, 'docs/MISSION-PACKAGE-DISCIPLINE.md');
const CF_PROBE_TEMPLATES = resolve(REPO_ROOT, 'docs/test-discipline/cf-closure-verification-templates.md');

const CF14_DESIGN_REVIEW = resolve(REPO_ROOT, '.planning/c0-cf14-design-review.md');
const STATE_MD = resolve(REPO_ROOT, '.planning/STATE.md');

describe('v1.49.642 integration meta-test', () => {

  // ─── C1 (CF-14): per-CF probe spec format ────────────────────────────

  it.runIf(existsSync(CF14_DESIGN_REVIEW))(
    'C1: CF-14 design review documents §1.3 validation',
    () => {
      const content = readFileSync(CF14_DESIGN_REVIEW, 'utf-8');
      expect(content, 'cites Lesson #10199 §1.3').toMatch(/Lesson #10199.*1\.3|#10199.*1\.3/);
      expect(content, 'PROCEED verdict').toMatch(/PROCEED to C1|PROCEED/);
      expect(content, 'covers YAML schema').toMatch(/yaml|YAML/i);
    },
  );

  it('C1: closure-verify-cf script imports yaml parser', () => {
    const content = readFileSync(CLOSURE_VERIFY_SCRIPT, 'utf-8');
    expect(content, "imports yaml's parse function").toMatch(/import\s+{[^}]*parse[^}]*}\s+from\s+['"]yaml['"]/);
  });

  it('C1: closure-verify-cf has auto in PROBES map', () => {
    const content = readFileSync(CLOSURE_VERIFY_SCRIPT, 'utf-8');
    expect(content, "auto in PROBES map").toMatch(/'auto':\s*probeAuto/);
  });

  it('C1: usage text documents auto subcommand', () => {
    const content = readFileSync(CLOSURE_VERIFY_SCRIPT, 'utf-8');
    expect(content, 'usage includes auto').toMatch(/auto\s+<CF-id>/);
    expect(content, 'usage shows YAML schema').toMatch(/Probe spec YAML schema/);
  });

  it('C1: closure-verify-cf tests cover 14+ invariants', () => {
    expect(existsSync(CLOSURE_VERIFY_TESTS)).toBe(true);
    const content = readFileSync(CLOSURE_VERIFY_TESTS, 'utf-8');
    expect(content, "auto probe test block").toMatch(/auto probe \(v1\.49\.642/);
    // 5 new tests under auto: missing-spec, required-field-validation,
    // file-snapshot dispatch, invalid probe_type, recursion prevention
    const itBlocks = content.match(/\bit\s*\(\s*['"]/g) ?? [];
    expect(itBlocks.length, 'at least 14 it() blocks').toBeGreaterThanOrEqual(14);
  });

  // ─── Discipline docs updated ─────────────────────────────────────────

  it('Discipline: MISSION-PACKAGE-DISCIPLINE.md §1.7 references auto subcommand', () => {
    const content = readFileSync(MISSION_PACKAGE_DISCIPLINE, 'utf-8');
    expect(content, '§1.7 mentions auto-dispatch').toMatch(/auto-dispatch.*v1\.49\.642|auto.*subcommand|auto.*CF-id/i);
    expect(content, 'references YAML schema').toMatch(/\.planning\/cf-probes/);
    expect(content, 'documents 6 probe types').toMatch(/auto\s+`?<CF-id>`?/);
  });

  it('Templates: cf-closure-verification-templates.md auto-dispatch section', () => {
    const content = readFileSync(CF_PROBE_TEMPLATES, 'utf-8');
    expect(content, 'auto-dispatch section').toMatch(/[Pp]er-CF probe spec auto-dispatch.*v1\.49\.642/);
    expect(content, 'shows auto invocation').toContain('closure-verify-cf.mjs auto');
    expect(content, 'shows YAML schema').toMatch(/probe_type:|routing_rules:/);
  });

  // ─── Counter-cadence: engine state unchanged ─────────────────────────

  it.runIf(existsSync(STATE_MD))(
    'counter-cadence: engine state UNCHANGED from v1.49.641 baseline',
    () => {
      const content = readFileSync(STATE_MD, 'utf-8');
      expect(content, 'NASA degree 108 (unchanged)').toMatch(/nasa_degree:\s*108/);
      expect(content, 'counter_cadence flag set').toMatch(/counter_cadence:\s*true/);
      expect(content, 'no_engine_state_advance flag set').toMatch(/no_engine_state_advance:\s*true/);
    },
  );

});
