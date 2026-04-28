# v1.49.579 — BAYES-SEQUENTIAL — Retrospective

**Reads:** v1.49.578 JULIA-PARAMETER Substantiation + Closure (closing dev tip `520419af8`, closing main `2100e5391`)
**Process note:** This retrospective is **backfilled 2026-04-27, one day after the original 2026-04-26 ship**, as part of the release-notes drift remediation pass. The original ship did not author release-notes at the time. The fast 4-milestone-in-1-day cadence (v1.49.577–v1.49.580 all closed 2026-04-26) was the proximate cause of the drift; the lessons-forward chapter (`04-lessons.md`) carries the process retrospective on that explicitly.

---

## Carryover lessons applied at v1.49.579

### From v1.49.578 — JP-022 honesty discipline (the load-bearing carry)

v1.49.578 closed every footnote in the v1.49.577 JULIA-PARAMETER aftermath EXCEPT one: `src/ab-harness/wasserstein-boed.ts` shipped an "illustrative IPM-aware heuristic" with hand-picked constants `MAX_SHIFT_STDS = 1.5` and `VAR_SHRINK = 0.8` that were explicitly NOT from arXiv:2604.21849. The v1.49.578 self-review pass classified this as **MEDIUM**, named it JP-022, and the resolution at v1.49.578 was *honesty in place* — add a `## Limitations` section, document that the constants are made up, document that the function signature can't reason about the data because no model is named.

v1.49.579 inherits that honesty footnote and converts it to a structural fix. The W4 commit (`47551ad0e`) is the boundary: before, `MAX_SHIFT_STDS` and `VAR_SHRINK` exist as `const` declarations in the source; after, they don't, and `wassersteinExpectedUtility` is a thin adapter that delegates to `selectIpmBoedDesign` in the new `src/bayes-ab/` subsystem. **Forward operational rule applied:** *honesty-in-place is a stable resting state, but only if the next milestone has a structural plan to convert it.* Without the v1.49.578 plan-of-record naming JP-022 explicitly, this milestone would not have had a clear scope boundary.

### From v1.49.578 — JP-002 e-process is the canonical anytime-gate surface

v1.49.578 wired the JP-002 anytime-valid e-process into the existing `src/ab-harness/cli.ts` as the first real caller. v1.49.579 extends that pattern: `src/bayes-ab/coordinator.ts` consumes `src/orchestration/anytime-gate.ts` directly rather than reimplementing a martingale inside the new subsystem. **The Bayesian sequential loop and the frequentist sign-test loop now share the same Type-I-error-bounded stopping mechanism** — they differ only in *what statistic gets fed into the gate*. Forward rule: every new sequential-decision module reuses `src/orchestration/anytime-gate.ts`; e-process duplication is a code smell.

### From v1.49.578 — DEFER list discipline pays for itself

v1.49.578 closed with a single-item open list (the JP-022 substantiation). v1.49.579 closed with a single-item open list (multivariate IPM-BOED via sliced-Wasserstein). The discipline is: **document the DEFER up-front in the mission spec; do not surface as new at close.** This milestone's vision-doc and milestone-spec both list the multivariate DEFER explicitly in the "Out of scope" table. When v1.49.579 closed, the open-items list was a copy of the documented DEFER, not a discovered gap.

### From v1.49.578 — `closes JP-NNN` commit-message hygiene

v1.49.578 used `closes JP-NNN` references in commit subjects/bodies for traceability. v1.49.579 uses the same convention — the closing commit `ac35d7808` references JP-022 by name, the W4 refactor `47551ad0e` says explicitly "Closes the v1.49.578 footnote 'wasserstein-boed.ts ships an illustrative IPM-aware heuristic with hand-picked constants.'" Forward rule: keep using JP-NNN references for footnote-to-substantiation traceability across milestones.

### From v1.49.578 — Solo profile is the right shape for substantiation milestones

v1.49.578 was Solo (one Opus session). v1.49.579 stayed Solo. Both milestones are *substantiation* in character — converting honesty-in-place footnotes to structural fixes — and the substantiation pattern is well-served by a single agent holding the full algorithmic context across all six waves. Forward rule: substantiation milestones default to Solo; fleet dispatch is reserved for parallel research / multi-track build patterns.

## What went well at v1.49.579

### W2 algorithm landed clean on the first attempt

The IPM-BOED algorithm at `src/bayes-ab/ipm-boed.ts` is the BLOCK deliverable. It landed clean — no rework after first commit — because the vision-doc had already specified the exact contract (`selectIpmBoedDesign({ prior, designs, modelSamples, draws?, rng? })`) and named the citation anchor (arXiv:2604.21849 §3) before any code was written. The tests were authored alongside the algorithm in the same commit (9 tests in `__tests__/ipm-boed.test.ts`), and the first run was green.

### W4 honesty rewrite was a true delete-then-replace

The W4 refactor genuinely removed `MAX_SHIFT_STDS` and `VAR_SHRINK` from the source (verified by 4 honesty-audit tests that grep the source string and assert absence). No deprecation period. No "soft-delete behind a flag." The constants are gone; the function name and the function body match. The 4 honesty-audit tests are themselves a forward-rule artifact — they will catch any future regression that tries to reintroduce a heuristic constant under the IPM-BOED algorithm's name.

### The conjugate-update primitive is genuinely reusable

`posteriorBeta`, `betaMean`, `betaVariance`, and `summariseOutcomes` at `src/bayes-ab/conjugate.ts` are useful beyond this milestone — any future caller that needs Beta-Bernoulli mechanics (calibration analysis, success-rate estimation, A/B variance bands) can consume them directly without depending on the BOED outer loop. The conjugate primitive is decoupled from the Monte-Carlo loop by design.

### Test floor exceeded by 3×

The mission spec required test delta ≥+15. Actual delta was +45 (3× the floor). The over-delivery is not "more is better" — it reflects the substantiation character of the milestone, where each new primitive earned its own dense unit-test coverage to prevent regression of the honesty pass.

## What was harder than expected

### W5 metric-scaling adjustment

The `scaledPosteriorShift` metric introduced in W3 was within the JP-002 e-process gate's noise floor at small round counts in the integration test. The fix at W5 was a 2× metric scaling — modest but genuinely needed. Lesson: when wiring a new statistic into an existing anytime-gate surface, do an early gate-sensitivity sanity check before authoring the integration test, not during. The mission spec did not anticipate this; v1.49.580 BAYES-SEQUENTIAL-MV does.

### Beta-sampler shape < 1 corner case

The Marsaglia-Tsang Gamma sampler that drives `sampleBeta` is fast and accurate for shape ≥ 1 but is not directly usable for shape < 1. The Best (1978) boost handles this by sampling shape+1 and applying a uniform-variate transform. This was known up-front but cost an extra ~30 minutes during W2 to verify the boost was numerically stable across the (0, 1) shape range. Worth it: the Beta(0.5, 0.5) reference test (variance = 0.125) exercises exactly this region.

## Process retrospective — backfill drift root cause

v1.49.577 through v1.49.580 all closed on 2026-04-26 within a single day. Of these four milestones, **only v1.49.581 and v1.49.582 (the next two NASA degree releases) authored release-notes at ship time**. v1.49.577–580 shipped without release-notes, requiring this 2026-04-27 backfill pass.

**Root cause:** the fast iteration cadence (substantiation + extension + univariate + multivariate, 4 milestones in 1 day) optimized for *closing the algorithmic loop* and treated release-notes as a downstream artifact. The closing-wave checklist did not include a release-notes authoring step.

**Forward rule (carried into v1.49.582 lessons-forward chapter as Lesson 12):** *every dev-line milestone ship MUST include the full 5-file release-notes structure under `docs/release-notes/<version>/`. Skipping this step creates RELEASE-HISTORY.md drift that requires manual backfill.* The v1.49.582 release-notes ship explicitly tagged this as a forward operational rule and mirrored the 5-file structure (README.md + chapter/00-summary.md + chapter/03-retrospective.md + chapter/04-lessons.md + chapter/99-context.md).

**This backfill is a structural correction, not a content fabrication.** Every claim in this release-notes set is sourced from: (a) the in-repo `.planning/missions/v1-49-579-bayes-sequential/` mission package, (b) `git show` of the 8 substantive commits between baseline `520419af8` and closing `ac35d7808`, (c) the closing main-merge commit `95c05ccea`, and (d) the `.planning/STATE.md` `v1_49_579_archived` block. No fabricated metrics; the +45 test delta is taken directly from the closing-commit body.

## Items NOT closed at v1.49.579 (carried to v1.49.580)

- **Multivariate IPM-BOED via sliced-Wasserstein** — addressed by the same-day successor v1.49.580 BAYES-SEQUENTIAL-MV (closing main `925596fcf`). The univariate↔multivariate split was deliberate and documented in the mission spec's "Out of scope" table.

## Items NOT closed at v1.49.579 (genuine open items, not yet scoped)

- **Beyond Beta-Bernoulli conjugacy.** Normal-Normal, Gamma-Poisson, Dirichlet-Multinomial conjugate pairs are not implemented. No caller currently requires them. Unblocks when a real consumer surfaces with a different conjugate-pair shape.
- **Wiring `runBayesAB` into existing `runAB` (frequentist) callers.** The two harnesses serve different problem shapes by design. Unblocks if a caller prefers Bayesian sequential semantics over the frequentist sign test.
- **Replacing `wasserstein1d`'s linear-scan CDF with binary search.** The current implementation is documented as "sufficient for small n in tests; replace with binary search for production-scale usage." Unblocks if production usage exposes the perf gap.

---

*v1.49.579 retrospective. Reads v1.49.578. Emits to v1.49.580+ carryover. Backfilled 2026-04-27.*
