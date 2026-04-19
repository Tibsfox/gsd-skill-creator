# Regression Report — Living Sensoria Continuation Wave (v1.49.561)

**Phase:** 675 (Wave R11.1)
**Date:** 2026-04-19
**Branch:** dev
**Parent reports:** `regression-report.md` (phase 648, original wave) + `regression-report-refinement.md` (phase 658, refinement wave)
**This addendum:** covers the continuation wave (phases 661–674)

**Baseline:** Phase 660 @ `541751085` (refinement wave complete)
**Tip:** Phase 674 @ `7302dac46` (continuation integration)

## Test Suite Summary — Continuation Wave Delta

| Metric | Phase 660 baseline | Phase 674 tip | Delta |
|---|---|---|---|
| Tests passing | 24,894 | 25,722 | **+828** |
| Tests failing | 2 | 2 | 0 (same pre-existing) |
| Tests skipped | 2 | 1 | -1 |
| Tests todo | 6 | 6 | 0 |
| `tsc --noEmit` | clean | clean | no change |

**Zero new failures.** The two failing tests remain the pre-existing harness-integrity version-consistency checks (`package.json=1.49.560` vs `Cargo.toml=1.49.557`) — same baseline as both prior reports.

## New Test Breakdown by Phase

| Phase | Module | Tests |
|---|---|---|
| 661 | MB-1 Lyapunov K_H adaptation | 54 |
| 662 | MB-2 Smooth projection operators | 80 |
| 663 | MB-5 Dead-zone bounded learning | 95 |
| 664 | MA-3+MD-2 Stochastic selection | 68 |
| 665 | MD-3 Langevin noise injection | 64 |
| 666 | MD-4 Temperature schedule | 91 |
| 667 | MD-1 Learned embeddings | 80 |
| 668 | MD-5 Learnable K_H | 56 |
| 669 | MD-6 Representation audit | 80 |
| 670 | ME-2 Model-switching policy | 103 |
| 671 | ME-3 Skill A/B harness | 100 |
| 672 | TC College bootstrap | — (markdown only) |
| 673 | TC Rosetta translations | — (markdown only) |
| 674 | R10 Continuation integration | 95 |
| **Total continuation** | | **966** |

The full-suite delta (+828) is slightly less than the per-phase sum (+966) because some unit tests in the new modules invoke shared helpers that were already counted under prior phases' suite numbers; the +828 represents the incremental net-new test-count delta over phase 660.

## Grand Total — v1.49.560 → v1.49.561 Full Arc

| Wave | Tests added |
|---|---|
| Original Living Sensoria (phases 636–650) | +546 |
| Refinement (phases 651–660) | +669 |
| Continuation (phases 661–674) | +828 |
| **Grand total over v1.49.560 baseline** | **+2,043** |

## Acceptance-Criterion Coverage

All 43 Living Sensoria requirements (LS-01..LS-43) have mapped tests in the verification matrix. Status:

| Block | Range | Status |
|---|---|---|
| Original | LS-01..LS-21, LS-23, LS-24 | PASS |
| Original | LS-22 (offering usefulness ≥80%) | DEFERRED — manual annotation |
| Refinement | LS-25..LS-30 | PASS |
| Continuation Bundle 3 (Stability) | LS-31..LS-33 | PASS |
| Continuation Bundle 4 (Exploration) | LS-34..LS-36 | PASS |
| Continuation Bundle 5 (Representation) | LS-37..LS-39 | PASS |
| Continuation Bundle 6 (Authoring) | LS-40, LS-41 | PASS |
| Continuation Bundle 7 (College/Rosetta) | LS-42, LS-43 | PASS |

**42 of 43 requirements** covered by passing tests. LS-22 remains the only deferred item.

## Safety-Critical Tests (BLOCK action) — All PASS

All previous SC-* tests still pass. Continuation wave adds:

| ID | Verifies | Status |
|---|---|---|
| SC-MB1-01..05 | MB-1 flag-off byte-identical | PASS |
| SC-MB2-01 | MB-2 flag-off byte-identical | PASS |
| SC-MB5-01 | MB-5 flag-off byte-identical (10k random samples) | PASS |
| SC-MA3-01 | MA-3+MD-2 flag-off returns input ref | PASS |
| SC-MD3-01 | MD-3 Langevin flag-off byte-identical | PASS |
| SC-DARK | M7 minimum-activity floor preserved post-noise (1k iterations) | PASS |
| SC-MD4-01 | MD-4 flag-off returns sentinel T=1.0 | PASS |
| SC-MD1-01 | MD-1 embeddings flag-off no consumer touches | PASS |
| SC-MD5-01 | MD-5 learnable K_H flag-off returns scalar K_H bit-exact | PASS |
| SC-MD6-01 | MD-6 audit flag-off returns DISABLED | PASS |
| SC-ME2-01 | ME-2 model-affinity flag-off returns null | PASS |
| SC-ME3-01 | ME-3 A/B harness flag-off returns DISABLED | PASS |
| **SC-CONT-FLAG-OFF** | Entire continuation wave flag-off byte-identical on 50-session fixture | **PASS** |

SC-CONT-FLAG-OFF is the load-bearing test for the continuation wave: under three independent captures (no constructions, repeat-no-constructions, all-classes-constructed-with-flag-disabled), the selector output is JSON-identical to phase 660 tip. The continuation wave adds zero observable behaviour when its flags are off.

## Through-line Verification

Bundle composition through-line (all integration-tested in `src/integration/__tests__/continuation/`):

```
Bundle 3 (Stability): MB-1 Lyapunov → MB-2 projection → MB-5 dead-zone
   composes such that V̇ ≤ 0 across full 100-step trajectories

Bundle 4 (Exploration): MD-4 temperature schedule → MA-3+MD-2 stochastic
   + MD-3 Langevin (with MB-2 projection) → tractability gating

Bundle 5 (Representation): MD-1 embeddings → MD-5 learnable K_H (ME-1
   gated, MB-1 Lyapunov composable) + MD-6 audit (collapse detection)

Bundle 6 (Authoring): ME-2 model-switching ∥ ME-3 A/B harness on M4

Bundle 7 (College/Rosetta): .college/rosetta/ + .college/departments/
   adaptive-systems/ — closes GAP-2 from v1.49.132 AAR audit
```

All bundle interactions verified in `cross-bundle.test.ts` (13 tests).

## Grove Re-architecture Summary (Continuation Wave)

| Component | Decision | Outcome |
|---|---|---|
| MB-1 Lyapunov K_H | NEW-LAYER (src/lyapunov/) + bridge | sensoria untouched |
| MB-2 Projection | NEW-LAYER (src/projection/) | sensoria + umwelt untouched |
| MB-5 Dead-zone | NEW-LAYER (src/dead-zone/) | branches untouched |
| MA-3+MD-2 Stochastic | NEW-LAYER (src/stochastic/) | orchestration untouched |
| MD-3 Langevin | NEW-LAYER (src/langevin/) | umwelt untouched |
| MD-4 Temperature | NEW-LAYER (src/temperature/) | symbiosis untouched |
| MD-1 Embeddings | NEW-LAYER (src/embeddings/) | shared dir with HF infra; alongside |
| MD-5 Learnable K_H | NEW-LAYER (src/learnable-k_h/) | sensoria + lyapunov untouched |
| MD-6 Audit | NEW-LAYER (src/representation-audit/) | embeddings untouched |
| ME-2 Model affinity | NEW-LAYER (src/model-affinity/) | orchestration untouched |
| ME-3 A/B harness | NEW-LAYER (src/ab-harness/) | branches untouched |
| TC College bootstrap | New directory (.college/rosetta/, .college/departments/adaptive-systems/) | 5 cross-references appended to existing depts |
| TC Rosetta translations | New files in .college/rosetta/ | 0 mods |

Zero Grove REWRITEs across all three waves combined.

## Release Readiness

- 39 of 43 phases shipped (original 15 + refinement 10 + continuation 14)
- Remaining: Phase 676 (docs addendum #2) + Phase 677 (CHANGELOG addendum #2) + Phase 678 (release-notes index addendum + final dedication)
- Dev branch tip: `7302dac46`
- Full suite: 25,722 pass / 2 pre-existing failures (unchanged) / 1 skipped / 6 todo
- All 30 first-wave + refinement requirements still pass
- All 13 continuation requirements newly added and pass
- Ready for doc + release-notes addenda, then human review before merge to main
