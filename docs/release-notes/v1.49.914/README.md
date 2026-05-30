# v1.49.914 — Tools-Suite Cluster Closure: node:test Gate + CI-Enforcement + Layer-2 node:test Drift-Guard

**Released:** 2026-05-29

Counter-cadence gate-hardening ship (counter-cadence #15) — operator-selected (via AskUserQuestion) over the recommended NASA-1.179 default. This ship closes the two gaps the v1.49.913 tools-suite gate left open, completing the tools-test enforcement cluster. v913 wired the `vitest.tools.config.mjs` suite into the pre-tag-gate but (a) left it enforced only at tag-time, never in CI, and (b) left the two `tools/` `node:test` files (which vitest cannot execute) running in **no gate at all** — the drift-guard reported them but nothing ran them.

- **NEW gate step — `tools-node-test`** (`tools/pre-tag-gate.sh` step 2.7, exit 22, `SC_PRE_TAG_GATE_BYPASS=tools-node-test`, legacy `SC_SKIP_TOOLS_NODE_TEST=1`). Runs `node tools/check-tools-test-coverage.mjs --run-node-test`, which executes Node's built-in test runner over the **dynamically-discovered** `node:test` files under `tools/` + `scripts/`. No hardcoded file list — a new `node:test` file is auto-covered the moment it lands (Layer 1, the enforcement layer for the `node:test` side).
- **NEW runner modes on the Layer-2 drift-guard** — `tools/check-tools-test-coverage.mjs` gains `--run-node-test` (discover + run via `spawnSync(node, ['--test', …])`, exit with the child's status; empty set → notice + exit 0) and `--print-node-test` (print the discovered set, one path per line). Both reuse the existing runner classifier — single source of truth, no list duplication. The default (no-flag) drift-guard report is byte-identical.
- **CI-enforcement** — `.github/workflows/ci.yml` `test` job gains two steps after `npx vitest run`: `npx vitest run --config vitest.tools.config.mjs` and `node tools/check-tools-test-coverage.mjs --run-node-test`. The tools suite now runs on every dev/PR push, not just at tag-time (closes the v913 OPENED single-enforcement-point thread). The lazy `basic-ftp` import (v913) keeps it network-safe.
- **node:test-side Layer-2 drift-guard** — `tools/__tests__/tools-config-coverage.test.mjs` gains an exact-set assertion: `--print-node-test` must list EXACTLY the two known `node:test` files (`toEqual`, not `toContain`), so a newly-added `node:test` file forces explicit acknowledgement. Plus a `--run-node-test` exit-0/runner-actually-ran assertion and a default-behavior-unchanged regression pin.

Counter-cadence count: 14 → 15. Tools suite **660 → 663** tests (+3 drift-guard tests) and now **CI-enforced** as well as gate-enforced. The 2 `node:test` files (21 tests) are now run by both the new gate step and CI. Main suite **35,562 UNCHANGED** (no `src/` change). No manifest codification — candidate **#10461** advanced 1-instance → **2-instance** (below the 3-instance bar; stays a candidate). UNCODIFIED 0 / PARTIAL 0 UNCHANGED. KNOWN_UNWIRED Process/Egress/Loader UNCHANGED at 0/0/0. NASA degree UNCHANGED at 1.178 (**132 consecutive ships**).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons codified (none; #10461 advanced to 2-instance)
- [99-context.md](chapter/99-context.md) — provenance + forward path

## What this ship is

- A counter-cadence gate-hardening ship (#15), per the #10430 finer-grained ~5-ship maintenance cadence.
- The completion of the tools-test enforcement cluster opened at v913: gate-enforcement (v913) → CI-enforcement + node:test gate (v914).
- A second instance of the v913 #10461 pattern (gate-enforce every suite + pair with a drift-guard) — applied to the `node:test` side this time.

## What this ship is not

- Not a codify ship — no `tools/render-claude-md/disciplines.json` change, no new manifest lessons, CLAUDE.md unchanged. #10461 stays a candidate at 2 instances (3-instance bar not met).
- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0).
- Not a NASA degree advance (still 1.178; 132 consecutive ships at the margin record).
- Not a production-behavior change to any shipped tool: the new `check-tools-test-coverage.mjs` modes are additive; the default report path is byte-identical.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **132 consecutive ships**; pressure-margin record extended by 1).
**Counter-cadence count: 14 → 15** (+1).
**Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147** (UNCHANGED — no codification this ship).
**Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate executable step count: **19 → 20** (+1: the new `tools-node-test` step 2.7, exit 22).
Vitest main suite: **35,562** (UNCHANGED). Tools suite (`vitest.tools.config.mjs`): **660 → 663** (+3 drift-guard tests) and now CI-enforced; the 2 `node:test` files (21 tests) gate-enforced + CI-enforced.

## Files touched

- `tools/pre-tag-gate.sh` (UPDATED — NEW step 2.7 `tools-node-test`, exit 22, legend + step-name vocab ×3)
- `tools/check-tools-test-coverage.mjs` (UPDATED — `--run-node-test` + `--print-node-test` modes; default report unchanged)
- `.github/workflows/ci.yml` (UPDATED — +2 test-job steps: tools vitest config + node:test runner)
- `tools/__tests__/tools-config-coverage.test.mjs` (UPDATED — +3 tests: exact-set print, run exit-0, default-unchanged pin)
- `docs/release-notes/v1.49.914/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v914 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.913 → 1.49.914)
