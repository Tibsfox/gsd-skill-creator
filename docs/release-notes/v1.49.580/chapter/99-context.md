# v1.49.580 -- BAYES-SEQUENTIAL-MV -- Engine Context (Snapshot)

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)

## Engine State (post-v1.49.580)

| Metric | Value |
|---|---|
| Milestone | BAYES-SEQUENTIAL-MV |
| Profile | Solo (one-developer Opus session) |
| Archetype | Infrastructure Component (extends `src/bayes-ab/` from v1.49.579) |
| Closing commit on dev | `46c912891` (CI fix: drop `as const` on integration-mv test fixtures) |
| Closing commit on main | `925596fcf` (merge: v1.49.580 BAYES-SEQUENTIAL-MV from dev) |
| Tag | v1.49.580 (annotated, pushed at `46c912891`) |
| Test count | 28603 |
| Test delta over v1.49.579 baseline | +48 (target was >=+20) |
| Test delta over v1.49.578 final | +93 |
| Regressions | 0 |
| Commits on dev between v1.49.579 close and v1.49.580 close | 10 |

## Commit Sequence (dev)

| Commit | Wave | Subject |
|---|---|---|
| `6dacd1966` | W0 | feat(bayes-ab): add multivariate types (DirichletPrior, MultinomialOutcome) |
| `22e3a1fdc` | W1 | feat(bayes-ab): Dirichlet conjugate update + reference tests |
| `f87a70c31` | W2 | feat(bayes-ab): sliced-Wasserstein primitive for multivariate IPM |
| `122a2bca6` | W3 | feat(bayes-ab): multivariate IPM-BOED design selector |
| `028683bb2` | W4 | feat(bayes-ab): multivariate runBayesABMv loop with JP-002 anytime stop |
| `ba2bfcc5a` | W5 | test(bayes-ab): multivariate paper benchmark + end-to-end integration |
| `7eff922b6` | W4b | refactor(ab-harness): wasserstein-boed.ts Limitations -- multivariate gap closed |
| `37121e283` | -- | chore(inventory): regenerate INVENTORY-MANIFEST.json for new mv files |
| `d51e44975` | -- | chore(release): bump npm package + cargo + tauri to 1.49.580 |
| `46c912891` | (close) | fix(bayes-ab): drop `as const` on integration-mv test fixtures -- unblock CI |

## `src/bayes-ab/` Module Inventory After v1.49.580

| Module | Purpose | Origin |
|---|---|---|
| `types.ts` | BetaPrior, BernoulliOutcome, ExperimentDesign | v1.49.579 |
| `conjugate.ts` | posteriorBeta (closed-form Beta-Bernoulli update) | v1.49.579 |
| `ipm-boed.ts` | selectIpmBoedDesign (1-D Wasserstein-IPM-BOED selector) | v1.49.579 |
| `coordinator.ts` | runBayesAB (1-D sequential loop with JP-002 anytime stop) | v1.49.579 |
| `mv-types.ts` | DirichletPrior, MultinomialOutcome, MvExperimentDesign | **v1.49.580 (NEW)** |
| `dirichlet.ts` | posteriorDirichlet, dirichletMean, sampleDirichlet, summariseMultinomial | **v1.49.580 (NEW)** |
| `sliced-wasserstein.ts` | slicedWasserstein (multivariate IPM via 1-D projection averaging) | **v1.49.580 (NEW)** |
| `ipm-boed-mv.ts` | selectIpmBoedDesignMv (multivariate Wasserstein-IPM-BOED selector) | **v1.49.580 (NEW)** |
| `coordinator-mv.ts` | runBayesABMv (multivariate sequential loop with JP-002 anytime stop) | **v1.49.580 (NEW)** |
| `index.ts` | barrel | extended at v1.49.580 |

## `src/ab-harness/wasserstein-boed.ts` Status

| Aspect | State |
|---|---|
| Skeleton origin | v1.49.577 JULIA-PARAMETER (citation-anchored at arXiv:2604.21851) |
| Function-name-and-body honesty | v1.49.579 (delegates to `src/bayes-ab/` real implementations) |
| Multivariate gap | **CLOSED at v1.49.580** -- `## Limitations` block rewritten as a pointer to `src/bayes-ab/{ipm-boed-mv, sliced-wasserstein, coordinator-mv}` |
| Open items remaining | 0 (the wasserstein-boed.ts subseries reaches its natural close at v1.49.580) |

## Mission Package

`.planning/missions/v1-49-580-multivariate-boed/`

- `README.md`
- `01-vision-doc.md`
- `03-milestone-spec.md`
- `04-wave-execution-plan.md`
- `05-test-plan.md`
- `components/00-shared-context.md`
- `components/01-mv-types.md` (W0)
- `components/02-dirichlet.md` (W1)
- `components/03-sliced-wasserstein.md` (W2)
- `components/04-mv-selector.md` (W3)
- `components/05-mv-coordinator.md` (W4)
- `components/06-tests.md` (W5)
- `components/07-closing-wave.md` (W6)

**Naming note:** the on-disk directory is `v1-49-580-multivariate-boed/` (early framing as a Bayesian-Optimal-Experimental-Design extension). The shipped milestone name in `.planning/STATE.md` is `BAYES-SEQUENTIAL-MV` (post-v1.49.579 framing as the multivariate extension of v1.49.579 BAYES-SEQUENTIAL). Both names refer to the same shipped work; the directory was not renamed at the framing shift.

## STATE.md Block at v1.49.580 Close

```yaml
v1_49_580_archived:
  status: ready_for_review
  closing_commit_on_main: "925596fcf"
  scope: "BAYES-SEQUENTIAL-MV (multivariate Bayesian sequential A/B testing)"
  retained_for_history: true
```

## Mathematical Anchors

| Anchor | Citation | Used in |
|---|---|---|
| Sliced-Wasserstein | Rabin et al. 2011 | `sliced-wasserstein.ts` |
| Sliced-W computational survey | Kolouri et al. 2019 | `sliced-wasserstein.ts` |
| Bayesian Optimal Experimental Design | Lindley 1956 *Annals of Math Stats* | `ipm-boed-mv.ts` |
| BOED survey | Chaloner & Verdinelli 1995 *Statistical Science* | `ipm-boed-mv.ts` |
| Anytime-valid e-process | arXiv:2604.21851 (JP-002) | `coordinator-mv.ts` |
| Dirichlet-Multinomial conjugacy | textbook (Bishop *PRML* §2.2.1) | `dirichlet.ts` |

## DEFER Table (Carried Forward to v1.49.581+)

| Item | Why deferred | Forward-citation slot |
|---|---|---|
| Multivariate Normal / Inverse-Wishart priors | Different conjugate family; lands when a real continuous-multivariate use case demands it | open |
| Approximate-posterior methods (variational / MCMC) for non-conjugate priors | Different category of work; outside the conjugate-by-construction architectural floor of `src/bayes-ab/` | open (would land in `src/bayes-ab-approx/`) |
| Sliced-Wasserstein with deterministic-Sobol projections | Variance-reduction refinement; current Monte-Carlo SW is correct, just noisier | open |
| GPU-accelerated SW | Not needed at current scale (R^3 to R^10 fits comfortably in CPU MC) | open |

## 4-Milestone Single-Day Sprint Context (2026-04-26)

| Milestone | Closing commit on dev | Closing commit on main | Test count |
|---|---|---|---|
| v1.49.577 JULIA-PARAMETER | `1b9eedb9b` | -- | 28345 |
| v1.49.578 JP substantiation | `520419af8` | `2100e5391` | 28510 |
| v1.49.579 BAYES-SEQUENTIAL univariate | `ac35d7808` | `95c05ccea` | ~28555 |
| **v1.49.580 BAYES-SEQUENTIAL-MV** | **`46c912891`** | **`925596fcf`** | **28603** |

All four shipped 2026-04-26 in a single-day sprint. None authored release-notes at ship time. Drift caught at v1.49.581 ship; remediated by 1-day-late backfill. v1.49.581 + v1.49.582 introduced the canonical 5-file release-notes structure as a normative ship gate (see chapter/04-lessons.md item #1).

## Versions Bumped at v1.49.580

- `package.json` -> 1.49.580
- `package-lock.json` -> 1.49.580
- `src-tauri/Cargo.toml` -> 1.49.580
- `src-tauri/tauri.conf.json` -> 1.49.580

## Open Items After v1.49.580

| Open item | Status |
|---|---|
| `wasserstein-boed.ts` multivariate gap | CLOSED at v1.49.580 |
| IPM-BOED data-generating-model DEFER (from v1.49.578) | CLOSED across both 1-D and multivariate (mvModelSamples callback in `coordinator-mv.ts`) |
| Continuous-multivariate priors (Normal / Inverse-Wishart) | Carried forward as DEFER |
| Approximate-posterior (variational / MCMC) | Carried forward as DEFER |
| Release-notes drift across v1.49.577-580 | Backfill in progress 2026-04-27 (this set is one of four) |

## Backfill Audit Trail

This release-notes set was authored 2026-04-27, one day after the v1.49.580 ship of 2026-04-26. The original ship pipeline (commits `6dacd1966` through `46c912891` on dev, merge `925596fcf` to main) did not include release-notes authoring. The backfill is part of a coordinated remediation pass covering v1.49.577 + v1.49.578 + v1.49.579 + v1.49.580 (the four milestones in the 2026-04-26 single-day sprint). The structural fix going forward (per chapter/04-lessons.md item #1) is to make the release-notes 5-file structure a HARD ship gate that blocks tag creation if any of the 5 files is missing.

[unavailable -- backfill 2026-04-27]: precise UTC timestamp of v1.49.580 tag-push (the closing commit `46c912891` is dated `Sun Apr 26 06:33:04 2026 -0700`, but the tag-push timestamp itself is not retained in the local git metadata available at backfill time).

---

*v1.49.580 / BAYES-SEQUENTIAL-MV / Multivariate IPM-BOED via Sliced-Wasserstein / shipped 2026-04-26 / release-notes backfilled 2026-04-27*
