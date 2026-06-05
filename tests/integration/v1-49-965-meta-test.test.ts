/**
 * v1.49.965 Integration Meta-Test — Ship 0.1 (audit-2026-06-03 item T1.3)
 *
 * Re-arms the adoption shelfware-telemetry alarm that silently froze at baseline
 * v1.49.801 for ~163 ships (the #10461 un-gated-runnable-surface class). Ship 0.1
 * is a two-layer closure (#10431/#10436):
 *   - DETECTOR: pre-tag-gate.sh step 20/20 (adoption-freshness), WARN-only first
 *     (#10463 staged promotion), escalatable to BLOCKER via SC_PRE_TAG_GATE_REQUIRE.
 *   - SOURCE ELIMINATOR: T14-SHIP-SEQUENCE.md step 2.7 (adoption-refresh post-bump).
 *
 * This file OWNED the absolute gate count ("all 20 checks PASS") from v965 until
 * v983 (Ship 5.3) added step 21 (trip-vocab) and took over as the count owner;
 * C2/C3 here were made count-agnostic at v983 per the single-count-owner
 * convention (the v983 meta-test now pins "all 21 checks PASS").
 *
 * Gates exercised:
 *   C1 — step 20/20 adoption-freshness invokes the freshness tool, is WARN-only by
 *        default, escalates to BLOCKER (exit 23) under gate_required, is gateable
 *        via SC_PRE_TAG_GATE_BYPASS=adoption-freshness, and names the fix.
 *   C2 — (count-agnostic since v983) step-20 adoption-freshness present; pre-v965 19-count gone.
 *   C3 — step 20 appears after step 19 and before the final summary.
 *   C4 — exit 23 is UNIQUE (no collision with tools-node-test's exit 22).
 *   C5 — step 20 captures the tool exit code without tripping set -e (the
 *        `$(...) && X=0 || X=$?` idiom; mirrors v961 C6).
 *   C6 — the freshness tool test is registered in the tools-suite include list
 *        (#10461 gate-enforce-every-runnable-surface).
 *   C7 — the SOURCE ELIMINATOR (adoption-refresh) is wired into T14-SHIP-SEQUENCE.md.
 *   C8 — SC_ADOPTION_BASELINE_MAX_DRIFT is documented in env-vars.json (operator knob).
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');
const TOOLS_CONFIG_PATH = join(REPO_ROOT, 'vitest.tools.config.mjs');
const T14_PATH = join(REPO_ROOT, 'docs/T14-SHIP-SEQUENCE.md');
const ENV_VARS_PATH = join(REPO_ROOT, 'tools/render-claude-md/env-vars.json');

describe('v1.49.965 integration meta-test (Ship 0.1 adoption-baseline freshness gate)', () => {
  it('C1 — step 20 adoption-freshness: WARN-only default, escalatable, gateable', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // Denominator-agnostic: per-step denominators are owned by
    // pre-tag-gate-self-consistency.test.ts (Ship 0.2). The ABSOLUTE count is
    // owned by the v983 meta-test ("all 21 checks PASS"); C2 here is count-agnostic.
    expect(gate).toMatch(/step 20\/\d+: adoption-baseline freshness/);
    // Invokes the freshness tool.
    expect(gate).toMatch(/node "\$REPO_ROOT\/tools\/adoption-baseline-freshness\.mjs"/);
    // WARN-only by default + escalation hook.
    expect(gate).toMatch(/gate_required "adoption-freshness"/);
    expect(gate).toMatch(/set SC_PRE_TAG_GATE_REQUIRE=adoption-freshness to block/);
    // Gateable via the named bypass token.
    expect(gate).toMatch(/gate_bypassed "adoption-freshness"/);
    // Names the one-command fix.
    expect(gate).toMatch(/Fix: node tools\/adoption-refresh\.mjs/);
    // The bypass token is in the operator-facing step-names vocabulary line.
    expect(gate).toMatch(/adoption-freshness\)"/);
  });

  it('C2 — the v965 adoption-freshness step landed; absolute count now owned by the v983 meta-test', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // COUNT-AGNOSTIC as of v983: the newest step-addition meta-test owns the
    // "all N checks PASS" count (single-count-owner convention; v983 took over
    // when step 21 trip-vocab landed). This test only pins that v965's step-20
    // addition is still present and the pre-v965 19-count is gone.
    expect(gate).toMatch(/step 20\/\d+: adoption-baseline freshness/);
    expect(gate).toMatch(/all \d+ checks PASS/);
    expect(gate).not.toMatch(/all 19 checks PASS/);
  });

  it('C3 — step 20 appears after step 19 and before the final summary', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    const step19Pos = gate.search(/step 19\/\d+: \S+ backup-file accumulation check/);
    const step20Pos = gate.search(/step 20\/\d+: adoption-baseline freshness/);
    const summaryPos = gate.search(/all \d+ checks PASS/);
    expect(step19Pos).toBeGreaterThan(-1);
    expect(step20Pos).toBeGreaterThan(step19Pos);
    expect(summaryPos).toBeGreaterThan(step20Pos);
  });

  it('C4 — the adoption-freshness BLOCKER exit code (23) is UNIQUE (no collision)', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // The escalation path uses exit 23.
    expect(gate).toMatch(/exit 23/);
    // 23 appears exactly once (one owner); the original draft reused 22 (the
    // tools-node-test code) — the review caught the collision, this pins the fix.
    const exit23 = (gate.match(/exit 23\b/g) || []).length;
    const exit22 = (gate.match(/exit 22\b/g) || []).length;
    expect(exit23).toBe(1);
    expect(exit22).toBe(1); // tools-node-test still owns 22, alone
  });

  it('C5 — step 20 captures the tool exit code without tripping set -e', () => {
    // Mirrors v961 C6: a bare `OUTPUT="$(...)"` under `set -euo pipefail` aborts on
    // a non-zero exit BEFORE the WARN/FAIL handling; the correct idiom preserves the
    // real code so the detector can branch on it.
    const gate = readFileSync(GATE_PATH, 'utf8');
    expect(gate).toMatch(/adoption-baseline-freshness\.mjs" 2>&1\)" && AF_EXIT=0 \|\| AF_EXIT=\$\?/);
  });

  it('C6 — the freshness tool test is registered in the tools-suite include list', () => {
    const cfg = readFileSync(TOOLS_CONFIG_PATH, 'utf8');
    expect(cfg).toMatch(/tools\/__tests__\/adoption-baseline-freshness\.test\.mjs/);
  });

  it('C7 — the source eliminator (adoption-refresh) is wired into T14-SHIP-SEQUENCE.md', () => {
    expect(existsSync(T14_PATH)).toBe(true);
    const t14 = readFileSync(T14_PATH, 'utf8');
    // A numbered step invokes adoption-refresh after bump-version.
    expect(t14).toMatch(/node tools\/adoption-refresh\.mjs/);
    expect(t14).toMatch(/2\.7\. adoption-baseline refresh/);
  });

  it('C8 — SC_ADOPTION_BASELINE_MAX_DRIFT is documented in env-vars.json', () => {
    const rows = JSON.parse(readFileSync(ENV_VARS_PATH, 'utf8')) as Array<{ name: string }>;
    expect(rows.some((r) => r.name === 'SC_ADOPTION_BASELINE_MAX_DRIFT')).toBe(true);
  });
});
