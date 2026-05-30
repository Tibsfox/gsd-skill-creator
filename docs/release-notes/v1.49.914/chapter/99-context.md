# Context — v1.49.914

## Provenance

- **Predecessor:** v1.49.913 (Tools-Suite Gate Wiring + Silent-Rot Green-Up + Layer-2 Drift-Guard). Release `27f41ca4e`, post-ship rh `f60e5186d`.
- **Origin:** opened from the v1.49.913 handoff (`.planning/HANDOFF-2026-05-29-v1.49.913-tools-suite-gate.md`). The handoff offered four forward paths; the operator selected (via AskUserQuestion) **options 2 + 3 + 4** together — CI-enforce the tools suite, add a `node --test` runner step, and promote carry-forward lessons — over the recommended NASA-1.179 default. These three are one coherent cluster: options 2 and 3 close the gaps v913 explicitly opened, and they are themselves the second instance of #10461 that option 4 acts on.
- **Counter-cadence:** #15, per the #10430 finer-grained ~5-ship maintenance cadence (the steady-state complement to the ~30-ship batched cleanup).

## What v913 left open (and this ship closes)

v913's retrospective recorded two forward gaps:

1. **OPENED:** "the tools-suite is gate-enforced but NOT CI-enforced — `npx vitest run` (CI) still does not cover it." Closed here by two `ci.yml` steps in the `test` job.
2. **CARRY-FORWARD:** "the 2 `node:test` files under `tools/` (`citation-debt/list`, `phases-plans-extraction`) still have no `node --test` runner in any gate." Closed here by pre-tag-gate step 2.7 `tools-node-test` + the CI step, both via `check-tools-test-coverage.mjs --run-node-test`.

## Why a dynamically-discovered runner (no hardcoded list)

`tools/` holds exactly two `node:test` files today, but hardcoding them in both the gate and the CI step would create a second list to keep in sync with disk — the very drift class v913 fought. Instead `--run-node-test` reuses the drift-guard's existing runner classifier to discover node:test files at run time. The gate runs whatever exists; a new node:test file is auto-covered. The only residual drift risk — a node:test file appearing unnoticed — is caught by the exact-set `--print-node-test` test, which fails until the new file is acknowledged.

## Verification trail

- **Default drift-guard:** `node tools/check-tools-test-coverage.mjs` → PASS (exit 0), report byte-identical to v913.
- **`--print-node-test`:** lists exactly the 2 node:test files, exit 0.
- **`--run-node-test`:** runs Node's test runner over the 2 files → 21 tests, all pass, exit 0.
- **Tools suite:** `npx vitest run --config vitest.tools.config.mjs` → 663 passing (+3 new tests over v913's 660).
- **Main suite:** unchanged at 35,562 (no `src/` change).
- **Adversarial review:** a verify agent confirmed VERDICT `DEFAULT-MODE-FAIL-PATH-OK` — the entrypoint is a flag dispatcher (exit stays inside `main()`, never `process.exit(undefined)`); a live out-of-list vitest probe tripped exit 1; a live node:test probe was auto-discovered + correctly classified-and-excluded; the 3 new tests are non-vacuous (exact-set `toEqual`).
- **Full pre-tag-gate:** run to green before tagging (the new step 2.7 ran in-context against the live tree — the gate-wiring ship validating its own new gate step, mirroring v913's meta-test).

## Forward path (operator picks next session)

1. **NASA forward-cadence at 1.179** — the operator-recommended highest-leverage move; codify/gate debt remains zero and the tools-test enforcement cluster is now fully closed (gate + CI, both runners, both drift-guards). 132 consecutive ships at the 1.178 pressure-margin record.
2. **Promote #10461** when a 3rd instance of unenforced-surface-rot or enforced-set drift appears (now at 2 instances: v913 omission-drift + v914 silent-addition-drift).
3. **Flake-audit the atlas-deps-audit intermittent** surfaced this ship (passes in isolation; rare full-suite failure).
4. **Continue carry-forward promotion** of the v903–v909 sub-3-instance #10448 sub-variant candidates as they reach the bar.

## Known issues carried forward (unchanged this ship)

- Auto-regen drift on prior chapter retrospectives + dashboard/INDEX (DB-vs-filesystem, since pre-v896); hand-authored versions remain in HEAD, NOT committed.
- GH release queue paused since v886 / FTP sync NOT run (v903–v914). Git tags authoritative; batch-catchable via `npm run gh-release-publish <tag>`. Pre-flight `nc -zvw3 216.222.199.72 21` before any FTP sync.
- REQUIREMENTS.md + ROADMAP.md remain recovery stubs (local-only).
