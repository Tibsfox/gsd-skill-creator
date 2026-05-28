/**
 * v1.49.869 Integration Meta-Test
 *
 * Pre-tag-gate integration ship for the cross-audit tool. Promotes the
 * continuous-verification mode codified at v1.49.868 (refinement of
 * Lesson #10443) from operator-invoked to a deterministic pre-tag-gate
 * step.
 *
 * Gates exercised:
 *   C1 — pre-tag-gate.sh step 18/18 KNOWN_UNWIRED stale-entry cross-audit
 *        (codifies the per-ship workflow validated across v858-v867 10
 *        consecutive applications + v867 first-real-world-bug fix).
 *
 * C2 — Final summary updated to "all 18 checks PASS" (was "all 17
 *      checks PASS" pre-v869).
 *
 * The new step BLOCKS by default. Override:
 *   SC_PRE_TAG_GATE_BYPASS=stale-known-unwired
 *
 * The step invokes `node tools/security/check-stale-known-unwired.mjs`
 * (the v857 tool, refined at v868 codify). Exit 0 = clean; any non-zero
 * = stale entry surfaced, ship blocked.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');

describe('v1.49.869 integration meta-test (pre-tag-gate cross-audit integration)', () => {
  // ==========================================================================
  // C1 — pre-tag-gate.sh step 18/18 KNOWN_UNWIRED stale-entry cross-audit
  // ==========================================================================
  it('C1 — pre-tag-gate.sh exposes step 18/18 KNOWN_UNWIRED stale-entry cross-audit', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');

    // The new step exists with the documented label
    expect(gate).toMatch(/step 18\/18: KNOWN_UNWIRED stale-entry cross-audit/);

    // The step invokes the v857 cross-audit tool
    expect(gate).toMatch(/node "\$REPO_ROOT\/tools\/security\/check-stale-known-unwired\.mjs"/);

    // The step is gateable via SC_PRE_TAG_GATE_BYPASS=stale-known-unwired
    expect(gate).toMatch(/gate_bypassed "stale-known-unwired"/);

    // The step's FAIL path exits with a documented exit code (20)
    expect(gate).toMatch(/exit 20/);

    // The step's FAIL path references the correct diagnose command
    expect(gate).toMatch(/Diagnose: node tools\/security\/check-stale-known-unwired\.mjs/);
  });

  // ==========================================================================
  // C2 — Final summary updated to "all 18 checks PASS"
  // ==========================================================================
  it('C2 — final summary reports 18 checks (was 17 pre-v869)', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');

    // The final summary message reports the new total
    expect(gate).toMatch(/all 18 checks PASS/);

    // The pre-v869 "all 17 checks PASS" summary is gone
    expect(gate).not.toMatch(/all 17 checks PASS/);
  });

  // ==========================================================================
  // C3 — Step ordering: cross-audit runs AFTER PROJECT.md drift check
  // ==========================================================================
  it('C3 — step 18 cross-audit appears after step 17 PROJECT.md drift check', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');

    const step17Pos = gate.indexOf('step 17/17: PROJECT.md drift check');
    const step18Pos = gate.indexOf('step 18/18: KNOWN_UNWIRED stale-entry cross-audit');
    expect(step17Pos).toBeGreaterThan(-1);
    expect(step18Pos).toBeGreaterThan(-1);
    expect(step18Pos).toBeGreaterThan(step17Pos);

    // The final summary appears after both
    const finalSummaryPos = gate.indexOf('all 18 checks PASS');
    expect(finalSummaryPos).toBeGreaterThan(step18Pos);
  });
});
