# v1.49.793 — Shelfware Verdicts 5 + 6: Math Foundations Refresh Cluster CLOSED

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 7/N (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.792 — Shelfware Verdict 4: WIRE `koopman-memory`
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** T1.2 ship 6 — cluster closure via parallel WIRE verdicts

## Summary

Closes the Math Foundations Refresh (v1.49.572) shelfware cluster at 100% (6/6 modules verdicted) by WIRING the final two open candidates in a single ship: `coherent-functors` via a new `skill-creator coherent-check`/`cc` CLI, and `hourglass-persistence` via a new `skill-creator hourglass-check`/`hc` CLI. Final cluster distribution: 4 WIRED + 2 ALLOWLISTED.

Operator chose WIRE-both over the ALLOWLIST-both alternative because both modules have rich advisory-only APIs whose CLI wraps follow the v789/v792 template exactly — no new architectural surface needed. The verdict ledger gains 2 rows, the open-candidate roster goes from 2 to 0, and the cluster is closed.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `src/cli/commands/coherent-check.ts` | NEW | ~190 lines — top-level `coherent-check`/`cc` command. Constructs an identity functor over a simple integer-object category, runs all 4 coherence predicates (naturality, identity, composition, direct-sum), reports per-predicate PASS/FAIL + aggregate `checkCoherence` verdict. Three-tier output. |
| `src/cli/commands/coherent-check.test.ts` | NEW | 17 tests covering args (7), all-pass (4), failure path (3), opt-in (2), advisory-only invariant (1) |
| `src/cli/commands/hourglass-check.ts` | NEW | ~210 lines — top-level `hourglass-check`/`hc` command. Three canonical DAG fixtures (hourglass, chain, empty); runs `detectHoles` + `computeContractionIndices` + `detectWaists` + `aggregateContractionIndex` + `emitFinding`; reports waist/hole/healthy verdict. Three-tier output. |
| `src/cli/commands/hourglass-check.test.ts` | NEW | 20 tests covering args (9), healthy path (3), waist path (3), hole-only path (1), opt-in (2), advisory-only invariant (2) |
| `src/cli/dispatch.ts` | MODIFIED | +10 lines: 2 imports + 2 dispatcher entries |
| `src/cli/help.ts` | MODIFIED | +2 lines: coherent-check + hourglass-check entries |
| `docs/SHELFWARE-VERDICTS.md` | MODIFIED | +2 verdict rows (WIRED × 2); roster section rewritten — cluster CLOSED |
| `.planning/PROJECT.md` | MODIFIED | Active milestone + Latest shipped release + Last updated advanced |

## What changed

- **`coherent-functors` flips test-only → living.** Status: `living`, realCallerCount: 1, cliImporters: `['src/cli/commands/coherent-check.ts']`.
- **`hourglass-persistence` flips test-only → living.** Status: `living`, realCallerCount: 1, cliImporters: `['src/cli/commands/hourglass-check.ts']`.
- **All 4 substrate modules at 1 real-caller each.** `semantic-channel` (v789) + `koopman-memory` (v792) + `coherent-functors` (v793) + `hourglass-persistence` (v793). The 2 ALLOWLISTED modules (`tonnetz`, `wasserstein-hebbian` from v791) have 0 real callers + `allowlisted: true` annotation.
- **Verdict ledger: 4 rows → 6 rows.** Final cluster distribution: 4 WIRED + 2 ALLOWLISTED + 0 RETIRED.
- **Open-candidate roster section rewritten.** The cluster-specific bullet list is replaced with a one-paragraph "fully closed" note + forward-looking guidance for future non-cluster candidates.

## Verification

- `npx vitest run src/cli/commands/coherent-check.test.ts src/cli/commands/hourglass-check.test.ts` → 37/37 PASS (17 + 20)
- `node tools/adoption-scan.mjs --json` → both modules `living` with 1 CLI importer each
- `node tools/adoption-scan.mjs --shelfware-threshold 1` → neither flagged as shelfware
- `node tools/project-md-normalizer.mjs --check` → no drift
- `bash tools/pre-tag-gate.sh` → TO-FILL after gate run

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v793 is forward-cadence audit-driven.

## Audit roadmap status

**T1.2 series COMPLETE in two senses:** the trilogy (scanner + dashboard/automation/allowlist + verdict pattern) closed at v789 with the first WIRED verdict; the original 6-module Math Foundations Refresh cluster closes at v793 with 100% verdict coverage. From v793 onward, T1.2 is dormant unless a future ship surfaces new shelfware candidates.

**Remaining Tier 1:** T1.1 (bounded-learning calibration loop, 4-6 ships); T1.3 (College of Knowledge consumer engine, 3-5 ships).

**Remaining Strengthening Levers:** S3 (codify meta-cadence); S4 (public surface separation); S6 (self-evidence loop for security disciplines); S7 (counter-cadence cadence).

## Verdict-pattern statistics (cluster lifecycle close)

| Phase | Ships | Open candidates start | Open candidates end | Cluster closure |
|---|---|---|---|---|
| Scanner | v786 | n/a | 6 | 0% |
| Dashboard + allowlist | v787 | 6 | 6 | 0% |
| First WIRE | v789 | 6 | 5 | 17% |
| Codification | v790 | 5 | 5 | 17% |
| Verdicts 2+3 | v791 | 5 | 3 | 50% |
| Verdict 4 | v792 | 3 | 2 | 67% |
| **Verdicts 5+6** | **v793** | **2** | **0** | **100%** |

The cluster closed in 6 verdict ships across v789-v793 — ~6 ships of substrate-shelfware closure work after the 2-ship scanner/dashboard buildout. Final pattern: 4 WIRED via lightweight CLI wraps + 2 ALLOWLISTED for substrate-not-API.
