# v1.49.975 — Summary

## The ship

Ship 2.3 of the 2026-06-03 audit plan gives the agent tier the adoption telemetry `src/` modules have had since v786, and dispositions the dormant agents. A new `tools/agent-adoption-scan.mjs` (the sibling of `adoption-scan.mjs`) classifies the 48 source-of-truth agents `living`/`test-only`/`dormant` by grepping scripted dispatch sites. The plan's "relocate gsd-orchestrator + 3 frozen agents to examples/" premise was **refuted** — all four are description-dispatched and load-bearing — so no agent is relocated. The 7 non-scripted agents are allowlisted with per-agent verdicts; the one true orphan (`gsd-intel-updater`) is parked with a dated triage gate. No runtime/src change.

## What shipped

- **`tools/agent-adoption-scan.mjs`** — agent-tier adoption scanner. 48 agents → **41 living · 0 test-only · 7 dormant**; flags mirror `adoption-scan.mjs` (`--json`, `--dormant-threshold`, `--allowlist`, `--no-allowlist`, `--root`, `--agents-dir`).
- **`tools/agent-adoption-scan.allowlist.json`** — 7 exemptions: 4 description-dispatched (`gsd-orchestrator`, `doc-linter`, `codebase-navigator`, `changelog-generator`), 2 script-twins (`pipeline-reconciler`, `quality-drift-watcher`), 1 dated-gate orphan (`gsd-intel-updater`, 2027-06-04).
- **`docs/AGENT-ADOPTION-VERDICTS.md`** (decision surface) + **`docs/AGENT-ADOPTION-BASELINE.json`** (snapshot).
- **`skill-creator agents adoption`** CLI subcommand (routed through the `ProcessContext` chokepoint).
- **Two drift-guards** (Layer-1 vitest, no new gate step): `tools/__tests__/agent-adoption-scan.test.mjs` (scan logic) + `tests/integration/agent-adoption-allowlist-parity.test.ts` (no-un-allowlisted-dormant invariant, baseline freshness, dated gate, verdict coverage).
- **No agent relocated** (refuted); the 9 UC-lab agents stay living-via-spawn (D1); the 3 `v1.50a-*` are out of SOT scope.

## Verification

- Scanner 0 un-allowlisted dormant; tool test 11/11; drift-guard 9/9; `tsc` clean; pre-tag-gate all 20 PASS.
- CI on dev caught the `ProcessContext` chokepoint trip (the CLI wrapper imports `child_process`) → fixed via `ensureProcessAllowed()`, amended.
- Adversarial pre-push review (6 agents, 5 lenses): **0 confirmed findings** (1 refuted: forward-dated version).

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (unchanged).
