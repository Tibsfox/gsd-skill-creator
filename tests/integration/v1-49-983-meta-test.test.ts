/**
 * v1.49.983 Integration Meta-Test — Ship 5.3 (GAP-7 content-filter trip-vocab).
 *
 * Closes GAP-7, the last open architecture gap (PROJECT.md GAP table). The NASA
 * sub-agent dispatch trip-vocab pattern (Lessons #10401/#10402/#10407) was the
 * direct evidence; the only artifact pre-v983 was a manual `grep` checklist in
 * docs/MISSION-PACKAGE-DISCIPLINE.md §3.3 (an #10461 un-gated runnable surface).
 * Ship 5.3 ships a deterministic checker (tools/trip-vocab-check.mjs — pure regex
 * counting, no LLM) + a negative-test fixture + pre-tag-gate step 21 (WARN-first,
 * #10463 staged promotion).
 *
 * This file owned the absolute gate count ("all 21 checks PASS") from v983 until
 * v1.49.1029 added step 22 (ship-review-attestation); the absolute count is now
 * owned by pre-tag-gate-self-consistency.test.ts (which derives denominator ==
 * summary count dynamically), and C2 here is count-agnostic per the
 * single-count-owner convention.
 *
 * PROMOTED at v1.49.1029 (audit-2026-06-09 ship 3): the staged WARN-only rung
 * served its #10463 purpose (degrees 1.161–1.217 all clean under the regime,
 * K=30); the step now BLOCKs (exit 25) on a TRIP-RISK verdict (tool exit 1) by
 * default, while tool malfunction (exit 2) stays WARN — a broken tool is not a
 * content verdict. C1/C4 updated accordingly; the gate_required escalation
 * branch is gone (meaningless once the default is BLOCK).
 *
 * Gates exercised (committed surfaces only — the gate scans gitignored www/ +
 * .planning/ at runtime, but those are absent in clean CI, so this meta-test
 * pins the COMMITTED gate/tool/doc surfaces, never disk state):
 *   C1 — step 21 trip-vocab invokes the checker, BLOCKs (exit 25) on the
 *        TRIP-RISK verdict by default (PROMOTION-MARKER recorded), keeps the
 *        exit-2 malfunction path WARN, is gateable via
 *        SC_PRE_TAG_GATE_BYPASS=trip-vocab, and names the pre-dispatch fix.
 *   C2 — (count-agnostic since v1029) step-21 present; pre-v983 20-count gone.
 *   C3 — step 21 appears after step 20 and before the final summary.
 *   C4 — the trip-vocab BLOCKER exit code (25) is UNIQUE (no collision).
 *   C5 — step 21 captures the tool exit code without tripping set -e
 *        (the `$(...) && TV_EXIT=0 || TV_EXIT=$?` idiom; mirrors v965 C5).
 *   C6 — the checker's test is registered in the tools-suite include list
 *        (#10461 gate-enforce-every-runnable-surface).
 *   C7 — the checker exists and docs/MISSION-PACKAGE-DISCIPLINE.md §3.3 routes to it.
 *   C8 — trip-vocab is in the SC_PRE_TAG_GATE_BYPASS vocabulary in env-vars.json.
 *
 * Layer-1 enforcement: this is tests/integration/*.test.ts (NOT *.integration.test.ts),
 * so the `root` vitest project runs it on every bare `npx vitest run` — pre-tag-gate
 * step 2 + CI's test job — every ship.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');
const TOOLS_CONFIG_PATH = join(REPO_ROOT, 'vitest.tools.config.mjs');
const MPD_PATH = join(REPO_ROOT, 'docs/MISSION-PACKAGE-DISCIPLINE.md');
const ENV_VARS_PATH = join(REPO_ROOT, 'tools/render-claude-md/env-vars.json');
const TOOL_PATH = join(REPO_ROOT, 'tools/trip-vocab-check.mjs');

describe('v1.49.983 integration meta-test (Ship 5.3 GAP-7 trip-vocab budget gate)', () => {
  it('C1 — step 21 trip-vocab: default-BLOCK on trip-risk verdict, WARN on malfunction, gateable', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // Denominator-agnostic for the step body; the ABSOLUTE count is owned by
    // pre-tag-gate-self-consistency.test.ts since v1029.
    expect(gate).toMatch(/step 21\/\d+: trip-vocab budget/);
    // Invokes the deterministic checker.
    expect(gate).toMatch(/node "\$REPO_ROOT\/tools\/trip-vocab-check\.mjs"/);
    // PROMOTED (v1.49.1029): TRIP-RISK verdict blocks by default; the promotion
    // is recorded in a machine-readable marker (the readiness reporter greps it).
    expect(gate).toMatch(/PROMOTION-MARKER: trip-vocab default-BLOCK since v1\.49\.1029/);
    expect(gate).not.toMatch(/gate_required "trip-vocab"/); // escalation branch gone
    // The exit-2 malfunction path stays WARN (a broken tool is not a verdict).
    expect(gate).toMatch(/trip-vocab (tool error|check could not run)/);
    // Gateable via the named bypass token.
    expect(gate).toMatch(/gate_bypassed "trip-vocab"/);
    // Names the on-demand pre-dispatch invocation.
    expect(gate).toMatch(/Pre-dispatch: node tools\/trip-vocab-check\.mjs/);
    // The bypass token is in the operator-facing step-names vocabulary line.
    expect(gate).toMatch(/trip-vocab\)"/);
  });

  it('C2 — the v983 trip-vocab step landed; absolute count owned by self-consistency since v1029', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // COUNT-AGNOSTIC as of v1029: pre-tag-gate-self-consistency.test.ts derives
    // denominator == summary count dynamically (single-count-owner convention;
    // ownership transferred when step 22 ship-review-attestation landed).
    expect(gate).toMatch(/step 21\/\d+: trip-vocab budget/);
    expect(gate).toMatch(/all \d+ checks PASS/);
    // The pre-v983 20-count summary is gone (the step-21 addition landed).
    expect(gate).not.toMatch(/all 20 checks PASS/);
  });

  it('C3 — step 21 appears after step 20 and before the final summary', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    const step20Pos = gate.search(/step 20\/\d+: adoption-baseline freshness/);
    const step21Pos = gate.search(/step 21\/\d+: trip-vocab budget/);
    const summaryPos = gate.search(/all \d+ checks PASS/);
    expect(step20Pos).toBeGreaterThan(-1);
    expect(step21Pos).toBeGreaterThan(step20Pos);
    expect(summaryPos).toBeGreaterThan(step21Pos);
  });

  it('C4 — the trip-vocab BLOCKER exit code (25) is UNIQUE (no collision)', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // The verdict-BLOCK path uses exit 25 (next free after 24=state-backups; 23=adoption).
    expect(gate).toMatch(/exit 25/);
    // Line-anchored (the post-v966 idiom, mirroring the self-consistency test):
    // comment mentions like "(exit 25)" in the promoted step's prose are not
    // exit statements and must not count.
    const exit25 = (gate.match(/^\s*exit 25\b/gm) || []).length;
    expect(exit25).toBe(1); // one owner
  });

  it('C5 — step 21 captures the tool exit code without tripping set -e', () => {
    // Mirrors v965 C5: a bare `OUTPUT="$(...)"` under `set -euo pipefail` aborts on
    // a non-zero exit BEFORE the WARN/FAIL handling; the correct idiom preserves the
    // real code so the detector can branch on it (TRIP-RISK exit 1 vs FATAL exit 2).
    const gate = readFileSync(GATE_PATH, 'utf8');
    expect(gate).toMatch(/trip-vocab-check\.mjs" "\$TV_PAGE" --mode page 2>&1\)" && TV_EXIT=0 \|\| TV_EXIT=\$\?/);
  });

  it('C6 — the trip-vocab-check test is registered in the tools-suite include list', () => {
    const cfg = readFileSync(TOOLS_CONFIG_PATH, 'utf8');
    expect(cfg).toMatch(/tools\/__tests__\/trip-vocab-check\.test\.mjs/);
  });

  it('C7 — the checker exists and §3.3 of the discipline doc routes to it', () => {
    expect(existsSync(TOOL_PATH)).toBe(true);
    const mpd = readFileSync(MPD_PATH, 'utf8');
    // §3.3 replaced the manual grep checklist with the tool invocation.
    expect(mpd).toMatch(/node tools\/trip-vocab-check\.mjs/);
  });

  it('C8 — trip-vocab is in the SC_PRE_TAG_GATE_BYPASS vocabulary (env-vars.json)', () => {
    const rows = JSON.parse(readFileSync(ENV_VARS_PATH, 'utf8')) as Array<{
      name: string;
      override_behavior: string;
    }>;
    const row = rows.find((r) => r.name === 'SC_PRE_TAG_GATE_BYPASS');
    expect(row).toBeDefined();
    expect(row!.override_behavior).toMatch(/\btrip-vocab\b/);
  });
});
