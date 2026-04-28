# v1.49.579 — BAYES-SEQUENTIAL — Engine Context (Snapshot)

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes — drift remediation)

## Engine state (post-v1.49.579)

| Metric | Value |
|---|---|
| Milestone | v1.49.579 |
| Theme | BAYES-SEQUENTIAL (univariate Bayesian sequential A/B testing) |
| Profile | Solo (one Opus session) |
| Pipeline speed | Fast (Vision + Mission, no separate research stage) |
| Archetype | Infrastructure Component |
| Test count (close) | 28,555 passing |
| Test delta over v1.49.578 baseline | +45 (target was ≥+15) |
| Regressions | 0 |
| New subsystem | `src/bayes-ab/` |
| Substantive commits | 8 (e8b7dfbed..ac35d7808) |
| Closing dev tip | `ac35d7808` |
| Closing main merge | `95c05ccea` |
| Tag | `v1.49.579` (annotated, pushed) |
| GitHub release | published |
| npm | `gsd-skill-creator@1.49.579` |
| FTP sync | [unavailable — backfill 2026-04-27; not in commit history; software milestone, not a degree release] |

## Commit ladder

```
ac35d7808  W6  chore(release): bump npm + cargo + tauri to 1.49.579
292ad2cf7  W6  chore(inventory): regenerate INVENTORY-MANIFEST.json for src/bayes-ab/
f2fb73dea  W5  feat(bayes-ab): paper benchmark + integration + paired-θ + 2× metric scaling
47551ad0e  W4  refactor(ab-harness): wasserstein-boed.ts delegates to real IPM-BOED algorithm
a65a773b4  W3  feat(bayes-ab): sequential runBayesAB loop with JP-002 anytime stop
575634583  W2  feat(bayes-ab): real IPM-BOED design selector consuming Beta posterior
64f3d2ad8  W1  feat(bayes-ab): conjugate Beta-Bernoulli update with reference tests
e8b7dfbed  W0  feat(bayes-ab): add types module + barrel
```

## Subsystem state

| Subsystem | State at v1.49.579 |
|---|---|
| `src/bayes-ab/` | NEW at v1.49.579 — 5 source files (types.ts, conjugate.ts, ipm-boed.ts, coordinator.ts, index.ts) + 4 test files |
| `src/ab-harness/` | REFACTORED — `wasserstein-boed.ts` honest delegation; `wasserstein1d` primitive unchanged; constants `MAX_SHIFT_STDS` and `VAR_SHRINK` deleted |
| `src/anytime-valid/` | UNCHANGED — JP-002 e-process consumed by `src/bayes-ab/coordinator.ts` |
| `src/orchestration/anytime-gate.ts` | UNCHANGED — gate surface consumed by `runBayesAB` |
| `INVENTORY-MANIFEST.json` | REGENERATED — registers `src/bayes-ab/` files |

## Test-count trajectory

| Milestone | Close-of-milestone test count | Delta |
|---|---|---|
| v1.49.577 (JULIA-PARAMETER) | 28,345 | (baseline for v1.49.578) |
| v1.49.578 (JP substantiation) | 28,510 | +165 (delta over v1.49.577 was +18 net new from this milestone's 6 waves; baseline-aware target was ≥+10) |
| **v1.49.579 (this milestone)** | **28,555** | **+45 (target was ≥+15)** |
| v1.49.580 (BAYES-SEQUENTIAL-MV) | [unavailable — backfill 2026-04-27; reported in v1.49.580 release-notes] | (multivariate extension, same-day ship) |

Note on the v1.49.578 figure: STATE.md `v1_49_578_legacy_block` reports `final_test_count: 28510` and `test_delta_over_published_baseline: 18`. The +165 figure here reflects the cumulative delta from v1.49.577's published `final_test_count: 28345`; the +18 figure is the substantive test delta of v1.49.578's own waves over its W1 carryforward baseline.

## Citation anchors active at v1.49.579

| Citation | Module | Wave |
|---|---|---|
| arXiv:2604.21849 §3 | `src/bayes-ab/ipm-boed.ts` (algorithm anchor) | W2 |
| arXiv:2604.21849 §3 | `src/ab-harness/wasserstein-boed.ts` (delegation anchor) | W4 |
| Berger & Wolpert 1988 — *The Likelihood Principle* | `src/bayes-ab/coordinator.ts` (Bayesian sequential framing) | W3 |
| Bernardo & Smith 1994 — *Bayesian Theory* | `src/bayes-ab/conjugate.ts` (conjugate-family update mechanics) | W1 |
| Kass & Raftery 1995 — *Bayes Factors*, JASA 90:773 | `src/bayes-ab/coordinator.ts` (posterior-probability decision-theoretic framing) | W3 |
| Marsaglia & Tsang 2000 (Gamma sampler) | `src/bayes-ab/ipm-boed.ts::sampleBeta` | W2 |
| Best 1978 (shape-boost transform) | `src/bayes-ab/ipm-boed.ts::sampleBeta` (shape < 1 path) | W2 |
| JP-002 (anytime-valid e-process) | `src/orchestration/anytime-gate.ts` (consumed by `src/bayes-ab/coordinator.ts`) | W3 |

## §JP-NNN substantiation register

| ID | Origin | State at v1.49.579 |
|---|---|---|
| JP-001 | v1.49.577 (Mathlib lean-toolchain pin) | Carried — placeholder pin remains, substitution procedure documented |
| JP-002 | v1.49.577 (anytime-valid e-process) | Active — consumed by `src/bayes-ab/coordinator.ts` and `src/ab-harness/cli.ts` |
| JP-005 | v1.49.577 (skill-promotion ROI gate) | Carried — Wave 2 gate in place |
| JP-010a | v1.49.577 (`runAB` first real caller) | Active — extended by v1.49.578 W5 |
| JP-022 | v1.49.578 (`wasserstein-boed.ts` heuristic) | **CLOSED at v1.49.579 W4** — constants deleted, function delegates to real algorithm |
| JP-040 | v1.49.578 (NASA citations on-tree) | Active — `docs/research/nasa-citations.md` |

## Open items after v1.49.579

| Item | Category | Target |
|---|---|---|
| Multivariate IPM-BOED via sliced-Wasserstein | Documented DEFER (separate-paper category) | v1.49.580 BAYES-SEQUENTIAL-MV (same-day successor) |
| Beyond Beta-Bernoulli conjugacy | Documented DEFER | Future milestone when caller surfaces |
| `runBayesAB` ↔ `runAB` wiring | Documented DEFER (different problem shapes) | Future milestone when caller prefers Bayesian semantics |
| `wasserstein1d` linear-scan → binary search | Documented DEFER (perf, not correctness) | Future milestone when production usage exposes gap |

## Release-notes drift state

v1.49.579 shipped 2026-04-26 without release-notes authored at ship time. This 5-file release-notes set is backfilled 2026-04-27. The drift was caused by the 4-milestone-in-1-day cadence (v1.49.577–580 all 2026-04-26) lacking a release-notes step in the closing-wave checklist. The v1.49.582 release-notes ship explicitly captured this lesson as a forward operational rule (Lesson 12 in v1.49.582/chapter/04-lessons.md).

| Milestone | Release-notes state |
|---|---|
| v1.49.577 | [unavailable — backfill 2026-04-27; ship did not author release-notes] |
| v1.49.578 | [unavailable — backfill 2026-04-27; ship did not author release-notes] |
| **v1.49.579 (this)** | **Backfilled 2026-04-27 — 5 files in `docs/release-notes/v1.49.579/`** |
| v1.49.580 | [unavailable — backfill 2026-04-27; ship did not author release-notes] |
| v1.49.581 | Authored at ship time (2026-04-27) |
| v1.49.582 | Authored at ship time (2026-04-27) |

## Versions bumped at v1.49.579

| Manifest | Version |
|---|---|
| `package.json` | 1.49.579 |
| `package-lock.json` | 1.49.579 |
| `src-tauri/Cargo.toml` | 1.49.579 |
| `src-tauri/tauri.conf.json` | 1.49.579 |
| `INVENTORY-MANIFEST.json` | regenerated to register `src/bayes-ab/` |

## Mission-package retention

| Path | State |
|---|---|
| `.planning/missions/v1-49-579-bayes-sequential/` | retained for history per STATE.md `v1_49_579_archived.retained_for_history: true` |
| `.planning/STATE.md` `v1_49_579_archived` block | `status: ready_for_review` / `closing_commit_on_main: 95c05ccea` |

## Test breakdown (final)

| Wave | New tests | File |
|---|---|---|
| W0 (types + barrel) | 0 (type-shape only) | n/a |
| W1 (conjugate update) | 18 | `src/bayes-ab/__tests__/conjugate.test.ts` |
| W2 (IPM-BOED selector) | 9 | `src/bayes-ab/__tests__/ipm-boed.test.ts` |
| W3 (sequential coordinator) | 6 | `src/bayes-ab/__tests__/coordinator.test.ts` |
| W4 (honesty rewrite — net) | 4 net (kept 3 wasserstein1d + replaced 4 heuristic-fixture + added 4 honesty-audit + 1 honest-delegation) | `src/ab-harness/__tests__/wasserstein-boed.test.ts` |
| W5 (paper benchmark + integration) | 14 (paper benchmark + e2e integration + paired-θ + scaling) | `src/bayes-ab/__tests__/` (additional) |
| **Total** | **+45** | |

---

*v1.49.579 / BAYES-SEQUENTIAL / 2026-04-26 / backfilled 2026-04-27*
