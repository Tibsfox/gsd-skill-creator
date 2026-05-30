# Summary — v1.49.914

- **Version:** `v1.49.914`
- **Shipped:** 2026-05-29
- **Branch:** dev → main
- **Type:** counter-cadence gate-hardening ship (counter-cadence #15)

## What shipped

This ship completes the tools-test enforcement cluster that v1.49.913 opened. v913 wired the `vitest.tools.config.mjs` suite into the pre-tag-gate (step 2.5 `tools-suite`) and added a Layer-2 drift-guard, but it explicitly left two gaps as forward candidates: the suite ran only at tag-time (never in CI), and the two `tools/` `node:test` files — which Node's built-in runner executes and vitest cannot — ran in no gate at all. The v913 drift-guard *reported* those two files but nothing *ran* them. This ship closes both gaps and, in doing so, produces a clean second instance of the v913 "gate-enforce-or-it-rots + drift-guard" pattern (candidate #10461).

## The node:test runner gate (Layer 1 for the node:test side)

`tools/check-tools-test-coverage.mjs` gains two additive modes that reuse its existing runner classifier (single source of truth — no second list to drift):

- `--run-node-test`: discovers the `node:test` files under `tools/` + `scripts/`, runs them with `spawnSync(process.execPath, ['--test', …files], { stdio: 'inherit' })`, and exits with the child's status. If zero files are discovered it prints a notice to stderr and exits 0 — an empty `node --test` invocation never runs.
- `--print-node-test`: prints the discovered `node:test` files, one path per line, exit 0.

A new pre-tag-gate step **2.7 `tools-node-test`** (exit 22, `SC_PRE_TAG_GATE_BYPASS=tools-node-test`) runs `--run-node-test`. Because discovery is dynamic, a new `node:test` file added later is automatically covered by the gate — there is no hardcoded runner list anywhere to forget to update.

## CI-enforcement (closes the v913 OPENED thread)

The `.github/workflows/ci.yml` `test` job gains two steps immediately after `- run: npx vitest run`: `npx vitest run --config vitest.tools.config.mjs` and `node tools/check-tools-test-coverage.mjs --run-node-test`. The tools suite + node:test files now run on every push to dev/main and every PR, not just at tag-time. The blast radius was the concern v913 flagged; the v913 lazy-import of `basic-ftp` (inside the `!dryRun` path) keeps the FTP tools' tests dependency-free and network-free, so CI runs them safely in dry-run with no socket access.

## The node:test-side Layer-2 drift-guard

`tools/__tests__/tools-config-coverage.test.mjs` gains three tests: (1) `--print-node-test` must list EXACTLY the two known `node:test` files via `toEqual` (exact-set equality, not `toContain`) — so a newly-added `node:test` file forces an explicit acknowledgement, the node:test analogue of the vitest include-list drift-guard; (2) `--run-node-test` exits 0 and its output proves the runner actually executed (TAP `# pass` / `tests N`), so the gate can't silently no-op; (3) the default no-flag report is byte-identical (pins the success line, guarding against the new flags altering the default path).

## Verification

The change was verified at three levels: the default drift-guard report (exit 0, unchanged), the two new modes (`--print-node-test` lists exactly the 2 files; `--run-node-test` runs 21 tests, exit 0), and an adversarial review with live drift probes. The adversarial pass confirmed the refactor did NOT break the default-mode FAIL path: a temporary out-of-list vitest file correctly tripped `DRIFT … exit 1`, a temporary `node:test` file was correctly auto-discovered + classified-and-excluded, and the entrypoint is a clean flag dispatcher (exit committed inside `main()`, never `process.exit(undefined)`). The tools suite is green at 663 passing (+3 new tests over v913's 660); the main suite is unchanged at 35,562.

## Engine state

NASA degree unchanged at **1.178** (132 consecutive ships). Counter-cadence count 14 → 15. No manifest codification; candidate #10461 advanced 1-instance → 2-instance (3-instance bar not met). UNCODIFIED 0 / PARTIAL 0 and KNOWN_UNWIRED 0/0/0 all unchanged. Pre-tag-gate grows by one executable step (19 → 20; new step 2.7, exit 22).
