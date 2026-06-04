/**
 * v1.49.961 Integration Meta-Test
 *
 * Counter-cadence #28: two-layer closure (#10431/#10436) for the .planning/
 * backup-file accumulation drift class. The source eliminator
 * (tools/state-md-clean-backups.mjs --write, self-run at the T14 reset by
 * state-md-set-shipped.mjs) removes the tool-written backups; this meta-test
 * pins the DETECTOR layer — pre-tag-gate.sh step 19/19 --check.
 *
 * Gates exercised:
 *   C1 — pre-tag-gate.sh step 19/19 invokes the cleaner --check, BLOCKS by
 *        default (exit 21), and is gateable via SC_PRE_TAG_GATE_BYPASS=state-backups.
 *   C2 — Final summary present + the pre-v961 18-count is gone. Count-agnostic
 *        since v1.49.965 added step 20 (v1-49-965-meta-test now owns the count).
 *   C3 — Step 19 appears after step 18 and before the final summary.
 *   C4 — The source eliminator is wired into the T14 reset (state-md-set-shipped).
 *   C5 — The cleaner test is registered in the tools-suite include list (#10461
 *        gate-enforce-every-runnable-surface; the tools-config-coverage drift
 *        guard is the disk-vs-list backstop).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');
const SET_SHIPPED_PATH = join(REPO_ROOT, 'tools/state-md-set-shipped.mjs');
const TOOLS_CONFIG_PATH = join(REPO_ROOT, 'vitest.tools.config.mjs');

describe('v1.49.961 integration meta-test (cc#28 .planning backup two-layer closure)', () => {
  it('C1 — pre-tag-gate.sh step 19/19 backup-file check BLOCKS and is gateable', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');

    expect(gate).toMatch(/step 19\/19: \.planning\/ backup-file accumulation check/);
    // Invokes the cleaner in --check (detector) mode.
    expect(gate).toMatch(/node "\$REPO_ROOT\/tools\/state-md-clean-backups\.mjs" --check/);
    // Gateable via the named bypass token.
    expect(gate).toMatch(/gate_bypassed "state-backups"/);
    // FAIL path exits with the documented (unused) exit code 21.
    expect(gate).toMatch(/exit 21/);
    // FAIL path references the one-command fix.
    expect(gate).toMatch(/Fix: node tools\/state-md-clean-backups\.mjs --write/);
    // The bypass token is in the operator-facing step-names vocabulary line.
    expect(gate).toMatch(/state-backups\)"/);
  });

  it('C2 — final summary present and the pre-v961 18-count is gone (count-agnostic)', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    // Count-agnostic since v1.49.965 (Ship 0.1) added step 20: the ABSOLUTE final
    // count is owned by the NEWEST step-addition meta-test (v1-49-965-meta-test now
    // pins "all 20 checks PASS"). This test only guards that v961's step-19
    // increment landed — a summary exists and the pre-v961 18-count is gone.
    expect(gate).toMatch(/all \d+ checks PASS/);
    expect(gate).not.toMatch(/all 18 checks PASS/);
  });

  it('C6 — step 19 (and step 18) capture the exit code without tripping set -e', () => {
    // v961 review MAJOR: a bare `OUTPUT="$(...)"` under `set -euo pipefail`
    // aborts the gate on a non-zero exit BEFORE the FAIL block + exit code (it
    // still blocks, but silently with the wrong code); a plain `|| true` masks
    // the code to 0 so the detector never fires. The correct idiom preserves the
    // real code: `OUTPUT="$(...)" && EXIT=0 || EXIT=$?`. Pin it on BOTH steps.
    const gate = readFileSync(GATE_PATH, 'utf8');
    expect(gate).toMatch(/state-md-clean-backups\.mjs" --check 2>&1\)" && BK_EXIT=0 \|\| BK_EXIT=\$\?/);
    expect(gate).toMatch(/check-stale-known-unwired\.mjs" 2>&1\)" && STALE_EXIT=0 \|\| STALE_EXIT=\$\?/);
    // The brittle bare-capture-then-$? shape must be gone from these two steps.
    expect(gate).not.toMatch(/state-md-clean-backups\.mjs" --check 2>&1\)"\n\s*BK_EXIT=\$\?/);
  });

  it('C3 — step 19 appears after step 18 and before the final summary', () => {
    const gate = readFileSync(GATE_PATH, 'utf8');
    const step18Pos = gate.indexOf('step 18/18: KNOWN_UNWIRED stale-entry cross-audit');
    // Regex .search() (NOT a quoted planning-path literal) so the apply-to-self
    // existsSync-no-skip-guard heuristic -- which flags readFileSync paired with
    // a quoted planning-dir path -- does not false-positive on this gate match.
    const step19Pos = gate.search(/step 19\/19: \S+ backup-file accumulation check/);
    // Count-agnostic summary match (v965 added step 20 between step 19 and the
    // summary; step 19 is still BEFORE the final summary, just no longer adjacent).
    const summaryPos = gate.search(/all \d+ checks PASS/);
    expect(step18Pos).toBeGreaterThan(-1);
    expect(step19Pos).toBeGreaterThan(step18Pos);
    expect(summaryPos).toBeGreaterThan(step19Pos);
  });

  it('C4 — the source eliminator is wired into the T14 reset (state-md-set-shipped)', () => {
    const setShipped = readFileSync(SET_SHIPPED_PATH, 'utf8');
    expect(setShipped).toMatch(/state-md-clean-backups\.mjs/);
    expect(setShipped).toMatch(/BACKUP_CLEANER_PATH/);
  });

  it('C5 — the cleaner test is registered in the tools-suite include list', () => {
    const cfg = readFileSync(TOOLS_CONFIG_PATH, 'utf8');
    expect(cfg).toMatch(/tools\/__tests__\/state-md-clean-backups\.test\.mjs/);
  });
});
