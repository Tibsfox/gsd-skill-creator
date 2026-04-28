# v1.49.580 -- BAYES-SEQUENTIAL-MV: Multivariate IPM-BOED via Sliced-Wasserstein -- Summary

**Released:** 2026-04-26
**Backfilled:** 2026-04-27
**Milestone:** BAYES-SEQUENTIAL-MV
**Closing commit on dev:** `46c912891` (CI fix: `as const` on integration-mv fixtures)
**Closing commit on main:** `925596fcf` (merge commit)
**Test count:** 28555 -> 28603 (+48; target >=+20)
**Regressions:** 0

## One-Line

v1.49.580 is the multivariate extension of v1.49.579 BAYES-SEQUENTIAL: the same Bayesian sequential A/B harness that v1.49.579 built around Beta-Bernoulli + 1-D Wasserstein-IPM-BOED + an anytime-valid early-stop gate is now flanked by a strict-generalisation multivariate triple -- Dirichlet-Multinomial conjugate update + sliced-Wasserstein primitive (Rabin 2011 / Kolouri 2019) + `selectIpmBoedDesignMv` + `runBayesABMv` -- and the "Limitations -- multivariate gap" footnote on `src/ab-harness/wasserstein-boed.ts` (carried since v1.49.577) is now closed and rewritten as a pointer to the new modules. The 1-D case is the K=2 specialisation of the new code path; the two surfaces are deliberately parallel rather than auto-dispatching.

## Why this milestone exists

v1.49.577 JULIA-PARAMETER landed the Wasserstein-IPM-BOED citation (arXiv:2604.21851 e-process anytime gate, anchored at Anchor 4) and a `wasserstein-boed.ts` skeleton that exposed the function name but had a placeholder body. v1.49.578 substantiation pass closed peripheral open loops but explicitly DEFERed the IPM-BOED implementation -- the data-generating model `p(y|d, theta)` was missing. v1.49.579 BAYES-SEQUENTIAL closed the function-name-vs-body gap by building the actual home: a `src/bayes-ab/` directory with conjugate Beta-Bernoulli updates, a real 1-D IPM-BOED selector, a `runBayesAB` sequential coordinator, and an integration test that demonstrates end-to-end planted-truth recovery under the JP-002 anytime gate. The `wasserstein-boed.ts` Limitations block was rewritten at v1.49.579 to point to the new home, but it carried one final bullet: *"Univariate parameter only. Multivariate IPM-BOED via sliced-Wasserstein is a separate algorithm."* That bullet is the v1.49.580 scope.

A user with a 3-arm A/B test (or 5-rubric skill scoring, or any K-way categorical experiment) was locked out of the Bayesian sequential harness at v1.49.579 -- the harness was K=2 only. After v1.49.580 close, the same user calls `selectIpmBoedDesignMv(prior: DirichletPrior, designs, mvModelSamples)` and `runBayesABMv(...)` and gets the same shape of design recommendation + sequential-stop decision back. The 1-D case continues to work unchanged (Beta is conjugate to Bernoulli; Dirichlet of dimension 2 is conjugate to Categorical-with-2-classes; the math reduces).

## Algorithmic spine

The 1-D and multivariate cases share an algorithmic spine. The IPM-BOED objective is unchanged:

```
U_W(d) = E_{y ~ p(y | d, theta), theta ~ p(theta)} [IPM(p(theta | y, d), p(theta))]
```

What changes between dimensionalities is (a) the IPM and (b) the prior family. The conjugate-update structure stays closed-form in both:

| Dimensionality | Prior | Likelihood | IPM | Posterior update |
|---|---|---|---|---|
| 1-D (v1.49.579) | Beta(a, b) | Bernoulli(p) | wasserstein1d | a' = a + successes; b' = b + failures |
| Multivariate (v1.49.580) | Dirichlet(alpha) | Multinomial(n, theta) | slicedWasserstein | alpha' = alpha + counts |

The architectural decision to ship parallel surfaces (rather than an auto-dispatching unified surface) is explicit in the milestone spec: the two surfaces are deliberately parallel; tests verify they agree numerically when the inputs are equivalent, but no runtime branching is taken on dimensionality.

## Wave-by-wave deliverables

### W0 -- Multivariate types (`6dacd1966`)

`src/bayes-ab/mv-types.ts` adds the type triple that the rest of the milestone consumes:

- `DirichletPrior { alphas: number[] }` -- the Dirichlet shape parameter vector. Length K = number of classes.
- `MultinomialOutcome { counts: number[] }` -- one observation block, one entry per class.
- `MvExperimentDesign<P>` -- the multivariate analog of the 1-D `ExperimentDesign<P>`, parameterised on the design payload type `P`.

Type-shape only; no behaviour at this wave. Barrel update in `src/bayes-ab/index.ts`.

### W1 -- Dirichlet conjugate update (`22e3a1fdc`)

`src/bayes-ab/dirichlet.ts`:

- `posteriorDirichlet(prior, outcome) -> { alphas }` -- closed-form `alphas[i] + counts[i]` per coordinate, length-checked.
- `dirichletMean({ alphas }) -> number[]` -- `alphas[i] / sum(alphas)`.
- `sampleDirichlet({ alphas }, rng) -> number[]` -- independent Gamma draws per coordinate, normalised to the simplex.
- `summariseMultinomial(samples)` -- helper that tallies one-hot vectors or class-index streams into a `MultinomialOutcome`.

>=3 reference-value tests against `scipy.stats.dirichlet` (mean, samples) + property test (alpha + count conservation across composition).

### W2 -- Sliced-Wasserstein primitive (`f87a70c31`)

`src/bayes-ab/sliced-wasserstein.ts`:

- `slicedWasserstein(P, Q, { projections, rng })`:
  1. Sample M = `projections` random unit vectors from S^(d-1) (standard-normal draws + L2 normalisation).
  2. For each direction `theta`, project `P -> P_theta` and `Q -> Q_theta` (1-D scalar arrays).
  3. Compute `wasserstein1d(P_theta, Q_theta)` per projection.
  4. Return mean across projections.

>=4 tests: identical -> 0; symmetric; matches `wasserstein1d` in d=1 within MC tolerance; monotone in mean separation (translating Q's centre away from P's increases SW); validates `P` and `Q` have same dimensionality.

The randomness threads through the same `SeedableRng` interface used in v1.49.579. No global `Math.random` in the algorithm path.

### W3 -- Multivariate IPM-BOED design selector (`122a2bca6`)

`src/bayes-ab/ipm-boed-mv.ts::selectIpmBoedDesignMv(prior, designs, mvModelSamples, opts)`:

- Pre-samples `theta_j` from the prior once (paired-theta variance-reduction trick, same as the 1-D version at v1.49.579).
- For each candidate design `d_k`, samples `y_jk ~ p(y | d_k, theta_j)` via `mvModelSamples`.
- Updates posterior via `posteriorDirichlet`.
- Computes `slicedWasserstein(posteriorSamples_jk, priorSamples_j)`.
- Averages across `j`, ranks designs by expected-IPM, returns the argmax design.

>=3 tests: determinism under fixed seed + ranking sanity (high-info designs rank higher) + corner case (constant outcome -> SW ~= 0).

### W4 -- Multivariate sequential coordinator (`028683bb2`)

`src/bayes-ab/coordinator-mv.ts::runBayesABMv(initialPrior, designs, observe, opts)`:

- Iterates `selectIpmBoedDesignMv` -> `observe(design)` -> `posteriorDirichlet(prior, outcome)`.
- After each step, computes the multivariate posterior-shift metric `2 * sum_K |posteriorMean_K - priorMean_K| / K`, clipped to [-1, 1], and feeds it into the JP-002 anytime-valid e-process gate.
- Stops when the gate signals (or the maximum-step budget is exhausted).
- Returns the same shape of result as `runBayesAB`: `{ posterior, history, stoppedReason }`.

>=2 tests: stop path (gate fires before budget) + continue path (budget exhausted before gate fires).

### W4b -- wasserstein-boed.ts Limitations close (`7eff922b6`)

`src/ab-harness/wasserstein-boed.ts`'s `## Limitations` block is rewritten. The carried-since-v1.49.577 multivariate-gap bullet is removed; the block now points readers to `src/bayes-ab/{ipm-boed-mv, sliced-wasserstein, coordinator-mv}` for >1-D callers. The function name and body honesty established at v1.49.579 is preserved -- `wasserstein-boed.ts` continues to delegate to the real implementation; the only change is documentation.

### W5 -- Paper benchmark + integration (`ba2bfcc5a`)

- `paper-benchmark-mv.test.ts` -- 3-arm Multinomial recovery, sample-size designs, n=200 wins. Validates that `runBayesABMv` reaches the same expected-information ranking that the Rabin 2011 SW analysis predicts for the 3-arm regime.
- `integration-mv.test.ts` -- end-to-end `runBayesABMv` with planted-truth Dirichlet, demonstrates JP-002 anytime stop fires within the expected sample budget.

### Inventory + version + CI fix (`37121e283`, `d51e44975`, `46c912891`)

- `INVENTORY-MANIFEST.json` regenerated to register the new `src/bayes-ab/{mv-types, dirichlet, sliced-wasserstein, ipm-boed-mv, coordinator-mv}.ts` files.
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` bumped to 1.49.580.
- CI fix: `integration-mv.test.ts` had `as const` on Dirichlet prior fixtures, making `alphas` a readonly tuple. `tsc` strict-mode rejected; `vitest` accepted locally. Replaced with explicit type annotations. Build green after the fix; tag pushed at `46c912891`.

## Numerical-equivalence verification

The architectural decision to ship parallel 1-D and multivariate surfaces is verified by tests, not enforced by code dispatch:

- `slicedWasserstein` in d=1 with M=1 projection equals `wasserstein1d` exactly (the random unit vector in S^0 is +/-1; either gives the 1-D Wasserstein up to sign).
- `slicedWasserstein` in d=1 with M >= 2 projections converges to `wasserstein1d` within MC tolerance.
- `posteriorDirichlet({ alphas: [a, b] }, { counts: [s, f] })` returns `{ alphas: [a + s, b + f] }`, which is `posteriorBeta({ a, b }, { successes: s, failures: f })` flattened.
- A `selectIpmBoedDesignMv` invocation with K=2 Dirichlet prior + binary-coded Multinomial outcomes returns the same design ranking (modulo MC tolerance) as `selectIpmBoedDesign` on the equivalent Beta-Bernoulli setup.

These tests are run as part of the W2 and W3 test floors; they are explicit verification of the parallel-surface architectural choice, not a unification claim.

## Engine state after v1.49.580

- Test count: 28603 (+48 over v1.49.579 baseline of 28555; +93 over v1.49.578 final of 28510)
- New files: 5 source modules + 6 test files in `src/bayes-ab/`
- Closed: `wasserstein-boed.ts` multivariate-gap bullet (carried since v1.49.577)
- Open items remaining for v1.49.581+: 0 (the BAYES-SEQUENTIAL-MV milestone reaches its natural close; the wasserstein-boed.ts subseries no longer carries open items)
- The IPM-BOED replacement-data-generating-model open item from v1.49.578 is now substantively addressed -- the multivariate harness ships with its own `mvModelSamples` callback contract, which is the data-generating-model surface the v1.49.578 deferral was waiting for.

## 4-milestone single-day sprint context

v1.49.580 is the second of four milestones closed on 2026-04-26 in a single-day sprint:

| Milestone | Scope | Closed (UTC) |
|---|---|---|
| v1.49.577 | JULIA-PARAMETER (87-paper synthesis + 4 anchors + 1 philosophical pairing) | 2026-04-26 |
| v1.49.578 | JP substantiation + closure (W2 wirings, JP-040 NASA citations, JP-001 lake-build) | 2026-04-26 |
| v1.49.579 | BAYES-SEQUENTIAL univariate (`src/bayes-ab/` home, real IPM-BOED, runBayesAB) | 2026-04-26 |
| **v1.49.580** | **BAYES-SEQUENTIAL-MV multivariate (this milestone)** | **2026-04-26** |

The cadence pressure is the proximate cause of release-notes drift: none of the four shipped with the canonical `docs/release-notes/v1.49.<N>/` 5-file structure at the time of close. The drift was caught at v1.49.581 ship and remediated by backfilling all four. v1.49.581 + v1.49.582 introduced the canonical 5-file release-notes structure as a normative ship gate (lesson #12 in v1.49.582's forward lessons: *"every dev-line milestone ship MUST include the full 5-file release-notes structure under docs/release-notes/<version>/"*).

---

*v1.49.580 / BAYES-SEQUENTIAL-MV / Multivariate IPM-BOED via Sliced-Wasserstein / shipped 2026-04-26 / release-notes backfilled 2026-04-27*
