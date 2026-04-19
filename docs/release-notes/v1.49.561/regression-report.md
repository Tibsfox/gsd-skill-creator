# Regression Report — Living Sensoria (v1.49.561)

**Phase:** 648 (Wave 3.1)
**Date:** 2026-04-18
**Branch:** dev
**Baseline:** v1.49.560 @ `236487081`
**Tip:** `a60120685`

## Test Suite Summary

| Metric | v1.49.560 baseline | v1.49.561 candidate | Delta |
|---|---|---|---|
| Test files | 1,283 | 1,328 | +45 |
| Tests passing | 23,679 | 24,363 | **+684** |
| Tests failing | 2 | 2 | 0 (same) |
| Tests skipped | 1 | 2 | +1 |
| Tests todo | 5 | 6 | +1 (IT-08 doc-regen deferred) |
| `tsc --noEmit` | clean | clean | no change |

**Zero new failures.** The two failing tests are both in `src/chipset/harness-integrity.test.ts` — pre-existing version-consistency checks (`package.json=1.49.560` vs `Cargo.toml=1.49.557`) flagged as known baseline in the mission brief.

## New Test Breakdown by Module

| Module | Phase | Tests | File |
|---|---|---|---|
| M6 Sensoria | 639 | 58 | `src/sensoria/__tests__/` (5 files) |
| M7 Umwelt | 640 | 45 | `src/umwelt/__tests__/` (5 files) |
| M8 Symbiosis | 641 | 113 | `src/symbiosis/__tests__/` (5 files) |
| M1 Graph | 642 | 47 | `src/graph/__tests__/` (6 files) |
| M2 Hybrid Memory | 643 | 54 | `src/memory/__tests__/m2-*.test.ts` (5 files) |
| M3 Trace Ledger | 644 | 91 | `src/traces/__tests__/` (5 files) |
| M4 Branch-Context | 645 | 61 | `src/branches/__tests__/` (6 files) |
| M5 Orchestration | 646 | 45 | `src/orchestration/__tests__/`, `src/cache/__tests__/` (6 files) |
| Wave 2 integration | 647 | 32 | `src/integration/__tests__/living-sensoria/` (1 file + fixture) |
| **Total new** | | **546** | |

The delta from baseline (+684) exceeds the sum of per-module new tests (+546) because some existing test files gained additional coverage via the integration wiring in Phase 647 (notably existing integration and application-layer suites that re-ran with the new adapters loaded).

## Acceptance-Criterion Coverage

All 24 Living Sensoria requirements map to test IDs in the mission's §5.6 Verification Matrix. Current status:

| Req | Tests | Status |
|---|---|---|
| LS-01 | SC-REG, SC-FLAG-OFF, IT-11 | PASS |
| LS-02 | CF-M1-01 | PASS |
| LS-03 | CF-M1-02 | PASS |
| LS-04 | CF-M2-02 | PASS |
| LS-05 | CF-M2-03 | PASS |
| LS-06 | CF-M3-02, SC-M3-APPEND | PASS |
| LS-07 | CF-M3-03 | PASS |
| LS-08 | CF-M4-01 | PASS |
| LS-09 | CF-M4-02 | PASS |
| LS-10 | CF-M5-01 | PASS |
| LS-11 | CF-M5-02 | PASS |
| LS-12 | CF-M5-04 | PASS |
| LS-13 | SC-REG + IT-11 | PASS |
| LS-14 | CF-M6-01, SC-M6-CONS | PASS |
| LS-15 | CF-M6-03 | PASS |
| LS-16 | CF-M6-02 | PASS |
| LS-17 | SC-M7-IND, CF-M7-01 | PASS |
| LS-18 | CF-M7-03 | PASS |
| LS-19 | CF-M7-04 | PASS |
| LS-20 | CF-M7-05 | PASS |
| LS-21 | CF-M8-01, CF-M8-03 | PASS |
| LS-22 | CF-M8-05 | **DEFERRED** — manual-annotation pass |
| LS-23 | CF-M8-06..09, IT-07 | PASS |
| LS-24 | IT-04 | PASS |

**Two deferred items:**
- **LS-22 (offering usefulness ≥80%)** — requires manual annotation on a 50-offering calibration sample. Scaffolding is in place (`CF-M8-05` test exists as `.todo`); the sample will be produced and annotated in a post-release calibration pass.
- **IT-08 (attribution preservation through doc regeneration)** — doc-regen tooling is out of v1.49.561 scope. Marked `.todo` in the integration suite.

Neither deferred item blocks release.

## Safety-Critical Tests (BLOCK action) — All PASS

| ID | Verifies | Status |
|---|---|---|
| SC-REG | Full regression vs baseline | PASS (zero new failures) |
| SC-EXT-FLAG-OFF | All flags off = v1.49.560 byte-identical | PASS (IT-11) |
| SC-PARASOC | M8 language constraints | PASS (100 offerings, 0 hits) |
| SC-EXT-DARK | M7 dark-room guard | PASS |
| SC-EXT-ATTR | Attribution correctness across docs | PASS (Lanzara/Friston/Kirchhoff/Foxglove/Traag cited in `docs/foundations/theoretical-audit.md`) |
| SC-EXT-CONSENT | M8 opt-in default | PASS |
| SC-EXT-SCOPE | No metaphysical claims | PASS (grep `alive|conscious|understands|feels` outside "what we do not claim" context returns 0) |
| SC-M6-CONS | Receptor conservation to 10⁻⁹ | PASS |
| SC-M7-IND | Markov blanket conditional independence (type + runtime) | PASS |
| SC-M3-APPEND | Trace ledger append-only | PASS |
| SC-REFINE-BOUND | M4 20% diff bound | PASS |
| SC-COOLDOWN | 7-day cooldown invariant | PASS |
| SC-GROVE-COMPAT | All existing Grove tests green after EXTEND decisions | PASS (638 mesh + 53 grove-format tests all green) |

## Grove Re-architecture Summary

| Module | Decision | Outcome |
|---|---|---|
| M1 | NEW-LAYER over grove-format | grove-format.ts untouched; 53 existing tests green |
| M2 | EXTEND tiered stores | ram-cache / chroma-store / pg-store untouched; M2 is a policy layer on top |
| M3 | EXTEND mesh/event-log.ts | `logDecisionTrace` + `readDecisionTraces` added; 638 mesh tests green |
| M4 | NEW-LAYER adapter | `BranchLifecycleResolver` consumes existing lifecycle-resolver.ts without modification |
| M5 | NEW-LAYER | src/orchestration/, src/cache/ — strictly additive |
| M6/M7/M8 | NEW-LAYER | src/sensoria/, src/umwelt/, src/symbiosis/ — strictly additive |

Zero Grove REWRITEs executed. All four ARCH open questions (OQ-1..OQ-4) resolved in favour of non-invasive paths.

## Release Readiness

- 12/15 phases shipped; 3 publication phases remaining (648 this report, 649 documentation, 650 release notes)
- Dev branch tip: `a60120685`
- Ready for merge to main after user review per branch policy
