# v1.49.580 -- BAYES-SEQUENTIAL-MV: Multivariate IPM-BOED via Sliced-Wasserstein

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)
**Milestone:** BAYES-SEQUENTIAL-MV (multivariate Bayesian sequential A/B testing)
**Profile:** Solo (one-developer Opus session)
**Archetype:** Infrastructure Component (extends `src/bayes-ab/` from v1.49.579 to multivariate parameters)
**Closing commit on dev:** `46c912891` (CI fix)
**Closing commit on main:** `925596fcf` (merge commit)

**Through-line:** *Close the last DEFER. v1.49.578 closed the open loops by extending; v1.49.579 closed the function-name-vs-body honesty gap by building the home; v1.49.580 closes the dimensionality DEFER by extending that home to >1-D.*

---

## What shipped

v1.49.580 extends the Bayesian sequential A/B harness in `src/bayes-ab/` (built at v1.49.579 as the univariate scaffold) to multivariate parameters. The univariate Beta-Bernoulli + 1-D Wasserstein-IPM-BOED + `runBayesAB` triple shipped at v1.49.579 is now flanked by a strict-generalisation multivariate triple: Dirichlet-Multinomial conjugate update + sliced-Wasserstein primitive + `selectIpmBoedDesignMv` + `runBayesABMv`. The 1-D case is the K=2 specialisation of the new code path (Beta = Dirichlet of dimension 2; `wasserstein1d` = `slicedWasserstein` in d=1); the two surfaces are deliberately parallel rather than auto-dispatching, with a numerical-equivalence test verifying agreement.

The "Limitations -- multivariate gap" footnote in `src/ab-harness/wasserstein-boed.ts` (carried since v1.49.577) is now closed and rewritten as a pointer to the new modules. Test count moves 28555 -> 28603 (+48 over v1.49.579 baseline; target was >=+20). Zero regressions on `npx vitest run`.

## Mission package

- **Mission directory:** `.planning/missions/v1-49-580-multivariate-boed/` (README + 01-vision-doc + 03-milestone-spec + 04-wave-execution-plan + 05-test-plan + components/00-07)
- **Naming note:** the on-disk mission directory is `v1-49-580-multivariate-boed/`, reflecting an early framing as a Bayesian-Optimal-Experimental-Design extension (the "MV-BOED" working title). The shipped milestone name in `STATE.md` is `BAYES-SEQUENTIAL-MV` -- the IPM-BOED selector is the multivariate piece, but the milestone scope as a whole is "extend the v1.49.579 Bayesian sequential A/B framework to multivariate parameters." Both names refer to the same shipped work.

## Deliverables

| ID | Component | Wave | Commit |
|---|---|---|---|
| D1 | `src/bayes-ab/mv-types.ts` (DirichletPrior, MultinomialOutcome, MvExperimentDesign) | W0 | `6dacd1966` |
| D2 | `src/bayes-ab/dirichlet.ts` (posteriorDirichlet, dirichletMean, sampleDirichlet) | W1 | `22e3a1fdc` |
| D3 | `src/bayes-ab/sliced-wasserstein.ts` (slicedWasserstein) | W2 | `f87a70c31` |
| D4 | `src/bayes-ab/ipm-boed-mv.ts` (selectIpmBoedDesignMv) | W3 | `122a2bca6` |
| D5 | `src/bayes-ab/coordinator-mv.ts` (runBayesABMv with JP-002 anytime stop) | W4 | `028683bb2` |
| D6 | Multivariate paper benchmark + e2e integration tests | W5 | `ba2bfcc5a` |
| D7 | `wasserstein-boed.ts` Limitations update -- multivariate gap closed | W4b | `7eff922b6` |
| -- | Inventory regenerate for new mv files | -- | `37121e283` |
| -- | npm + cargo + tauri version bump to 1.49.580 | -- | `d51e44975` |
| -- | CI fix: drop `as const` on integration-mv test fixtures | (close) | `46c912891` |

10 commits total on dev between `ac35d7808` (v1.49.579 close) and `46c912891` (v1.49.580 close).

## Mathematical anchors

- **Dirichlet conjugacy:** Beta-Bernoulli is the K=2 Dirichlet-Multinomial. Posterior `alpha' = alpha + counts` is closed-form; no Monte-Carlo for the update itself. Reference values verified against `scipy.stats.dirichlet`.
- **Sliced-Wasserstein:** Rabin et al. 2011 (introduces sliced-Wasserstein as a tractable IPM on R^d via 1-D projection averaging); Kolouri et al. 2019 (sliced-W theory + computational survey). True metric on multivariate distributions; `wasserstein1d` per projection, mean across M random unit-direction projections from S^(d-1).
- **IPM-BOED:** Lindley 1956 (info-theoretic experimental design); the IPM-BOED objective `U_W(d) = E[IPM(p(theta|y,d), p(theta))]` is unchanged from the 1-D case -- only the IPM (W1 -> sliced-W) and the prior family (Beta -> Dirichlet) change.
- **Anytime-valid stop:** JP-002 e-process gate (carried from v1.49.577; arXiv:2604.21851) on a multivariate posterior-shift metric `2 * sum_K |posteriorMean_K - priorMean_K| / K`, clipped to [-1, 1], mirroring the 1-D scaling fix from v1.49.579.

## CI fix at the close

The final commit on dev (`46c912891`) is a one-line CI fix: the W5 `integration-mv.test.ts` fixture used `as const`, which made `alphas` a readonly tuple `[1, 1, 1]`. `DirichletPrior.alphas` expects mutable `number[]`; `tsc` strict mode rejected the assignment in CI on the `chore(release)` build (run `24957761986`), but `vitest` was looser locally and missed it. Replaced with explicit type annotations. Local `npm run build` green after the fix; tag pushed at `46c912891`. The fix is itself the reason this milestone shipped on the same day as v1.49.577 + v1.49.578 + v1.49.579 (the 4-milestone single-day sprint), and is the proximate cause of the release-notes drift that this backfill remediates.

## Files

- See `chapter/00-summary.md` for the long-form milestone summary
- See `chapter/03-retrospective.md` for the v1.49.579 -> v1.49.580 carryover retrospective
- See `chapter/04-lessons.md` for lessons emitted forward to v1.49.581+
- See `chapter/99-context.md` for engine-state context after v1.49.580 close

---

*v1.49.580 / BAYES-SEQUENTIAL-MV / Multivariate IPM-BOED via Sliced-Wasserstein / shipped 2026-04-26 / release-notes backfilled 2026-04-27*
