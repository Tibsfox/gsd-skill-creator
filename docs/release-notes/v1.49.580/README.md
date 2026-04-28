# v1.49.580 -- BAYES-SEQUENTIAL-MV: Multivariate IPM-BOED via Sliced-Wasserstein

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)
**Theme:** Multivariate Bayesian sequential A/B testing -- Dirichlet-Multinomial + multivariate-Normal conjugate priors + Sliced-Wasserstein IPM-BOED
**Naming:** Mission directory `v1-49-580-multivariate-boed/` (early MV-BOED framing); shipped milestone name `BAYES-SEQUENTIAL-MV` (post-v1.49.579 framing). Both names refer to the same shipped work; the directory was not renamed at the framing shift.
**Test delta:** +48 (28555 -> 28603; target was >=+20)
**Commits:** 10 on dev between `ac35d7808` (v1.49.579 close) and `46c912891` (v1.49.580 close)
**Closing commit on dev:** `46c912891` (CI fix: drop `as const` on integration-mv test fixtures)
**Closing commit on main:** `925596fcf` (merge: v1.49.580 BAYES-SEQUENTIAL-MV from dev)
**Tag:** v1.49.580 (annotated, pushed at `46c912891`)
**Profile:** Solo (one-developer Opus session)
**Predecessor:** v1.49.579 BAYES-SEQUENTIAL (univariate scaffold)
**Branch:** dev -> main
**Archetype:** Infrastructure Component (extends `src/bayes-ab/` from v1.49.579 to multivariate parameters)
**Through-line:** *Close the last DEFER. v1.49.578 closed the open loops by extending; v1.49.579 closed the function-name-vs-body honesty gap by building the home; v1.49.580 closes the dimensionality DEFER by extending that home to >1-D.*

## Summary

v1.49.580 extends the Bayesian sequential A/B harness in `src/bayes-ab/` (built at v1.49.579 as the univariate scaffold) to multivariate parameters. The univariate Beta-Bernoulli + 1-D Wasserstein-IPM-BOED + `runBayesAB` triple shipped at v1.49.579 is now flanked by a strict-generalisation multivariate triple: Dirichlet-Multinomial conjugate update + sliced-Wasserstein primitive + `selectIpmBoedDesignMv` + `runBayesABMv`. The 1-D case is the K=2 specialisation of the new code path -- Beta is a Dirichlet of dimension 2; `wasserstein1d` is `slicedWasserstein` in d=1 -- and the two surfaces are deliberately parallel rather than auto-dispatching, with a numerical-equivalence test verifying agreement at the K=2 boundary. The "Limitations -- multivariate gap" footnote on `src/ab-harness/wasserstein-boed.ts`, carried since v1.49.577, is now closed and rewritten as a pointer to the new modules.

**MULTIVARIATE EXTENSION COMPLETED.** Dirichlet-Multinomial conjugate priors land for k-arm tests with categorical outcomes; the multivariate-Normal coordinate is provisioned in the type vocabulary but defers continuous-multivariate inference (Inverse-Wishart) to a separate milestone. The closed-form posterior update `alpha' = alpha + counts` mirrors the v1.49.579 Beta update `a' = a + successes` in both shape and conjugacy guarantee. Reference values verified against `scipy.stats.dirichlet`. A user with a 3-arm A/B test (or 5-rubric skill scoring, or any K-way categorical experiment) was locked out of the Bayesian sequential harness at v1.49.579; after v1.49.580 close the same user calls `selectIpmBoedDesignMv(prior, designs, mvModelSamples)` and `runBayesABMv(...)` and gets the same shape of design recommendation + sequential-stop decision back.

**SLICED-WASSERSTEIN IPM-BOED LANDED.** The Wasserstein-IPM-BOED open thread from v1.49.577 JULIA-PARAMETER (Anchor 4, arXiv:2604.21851 e-process) is substantively addressed at v1.49.580 via Rabin et al. 2011 sliced-Wasserstein -- a tractable IPM on R^d that averages 1-D Wasserstein distances across M random unit-direction projections from S^(d-1). The IPM-BOED objective `U_W(d) = E[IPM(p(theta|y,d), p(theta))]` is unchanged from the 1-D case; only the IPM (W1 -> sliced-W) and the prior family (Beta -> Dirichlet) change. The architectural choice is verifiable, not enforced: numerical-equivalence tests confirm `slicedWasserstein` in d=1 with M=1 equals `wasserstein1d` exactly, and with M >= 2 converges within Monte-Carlo tolerance.

**JP-002 ANYTIME-VALID GATE GENERALISES CLEANLY.** The same JP-002 e-process gate that v1.49.579 used on a 1-D posterior-shift metric works at v1.49.580 on a multivariate posterior-shift metric, with only the metric definition changing: `2 * |posteriorMean - priorMean|` becomes `2 * sum_K |posteriorMean_K - priorMean_K| / K`, both clipped to `[-1, 1]`. The factor of 2 mirrors the Beta-mean sensitivity range carried forward from v1.49.579's late-stage scaling fix; the K-average flattens per-coordinate sensitivity to a single scalar that the e-process can consume. The gate stays a single canonical surface that consumes a scalar regardless of upstream model complexity.

**CI FIX AS LATE-PIPELINE BLOCKER.** The final commit on dev (`46c912891`) is a one-line CI fix: the W5 `integration-mv.test.ts` fixture used `as const`, which made `alphas` a readonly tuple `[1, 1, 1]`. `DirichletPrior.alphas` expects mutable `number[]`; `tsc` strict mode rejected the assignment in CI on the `chore(release)` build (run `24957761986`), but `vitest` was looser locally and missed it. Replaced with explicit type annotations. Local `npm run build` green after the fix; tag pushed at `46c912891`. The fix is itself the proximate reason this milestone shipped on the same day as v1.49.577 + v1.49.578 + v1.49.579 (the 4-milestone single-day sprint), and is the proximate cause of the release-notes drift that this backfill remediates.

**WASSERSTEIN-BOED OPEN-ITEMS SUBSERIES CLOSED.** v1.49.577 opened the `wasserstein-boed.ts` subseries (skeleton + multivariate-gap footnote). v1.49.578 substantiated the citation. v1.49.579 closed the function-name-and-body honesty gap. v1.49.580 closes the multivariate gap. The subseries reaches its natural close at v1.49.580; the file's `## Limitations` block is rewritten as a pointer to `src/bayes-ab/{ipm-boed-mv, sliced-wasserstein, coordinator-mv}` for >=1-D callers, and no open items are inherited into v1.49.581+. If a future use case surfaces a new gap, that gap is opened fresh, not framed as a continuation.

**4-MILESTONE-IN-1-DAY SPRINT CONCLUDED.** v1.49.580 closes the 2026-04-26 single-day sprint that closed v1.49.577 + v1.49.578 + v1.49.579 + v1.49.580 in sequence. The cadence pressure is the proximate cause of release-notes drift across all four; none authored a `docs/release-notes/v1.49.<N>/` directory at ship time. The drift was caught at v1.49.581 ship and is being remediated by 1-day-late backfill across all four milestones (v1.49.582 forward lesson #12 makes the 5-file release-notes structure a hard ship gate going forward).

**ZERO REGRESSIONS.** `npx vitest run` was green at every wave-close commit on dev. The CI fix at `46c912891` was a `tsc` strict-mode catch on test fixtures, not a behavioural regression. Test count climbs from 28555 (v1.49.579 baseline) to 28603 (+48), comfortably over the >=+20 spec target. The over-shoot came from explicit numerical-equivalence tests (the d=1 SW-vs-W1 verification, the K=2-Dirichlet-vs-Beta verification) -- tests that the spec did not require but that the parallel-surface architectural choice does.

## Modules

| Module | Path | Wave | Commit | Origin |
|---|---|---|---|---|
| Multivariate types | `src/bayes-ab/mv-types.ts` (DirichletPrior, MultinomialOutcome, MvExperimentDesign) | W0 | `6dacd1966` | NEW at v1.49.580 |
| Dirichlet conjugate update | `src/bayes-ab/dirichlet.ts` (posteriorDirichlet, dirichletMean, sampleDirichlet, summariseMultinomial) | W1 | `22e3a1fdc` | NEW at v1.49.580 |
| Sliced-Wasserstein primitive | `src/bayes-ab/sliced-wasserstein.ts` (slicedWasserstein) | W2 | `f87a70c31` | NEW at v1.49.580 |
| Multivariate IPM-BOED selector | `src/bayes-ab/ipm-boed-mv.ts` (selectIpmBoedDesignMv) | W3 | `122a2bca6` | NEW at v1.49.580 |
| Multivariate sequential coordinator | `src/bayes-ab/coordinator-mv.ts` (runBayesABMv with JP-002 anytime stop) | W4 | `028683bb2` | NEW at v1.49.580 |
| Paper benchmark + e2e tests | `src/bayes-ab/paper-benchmark-mv.test.ts` + `integration-mv.test.ts` | W5 | `ba2bfcc5a` | NEW at v1.49.580 |
| Limitations close | `src/ab-harness/wasserstein-boed.ts` (multivariate-gap bullet removed) | W4b | `7eff922b6` | extended at v1.49.580 |
| Inventory regenerate | `INVENTORY-MANIFEST.json` (registers 5 new mv modules) | -- | `37121e283` | extended at v1.49.580 |
| Version bump | `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` -> 1.49.580 | -- | `d51e44975` | extended at v1.49.580 |
| CI fix | `integration-mv.test.ts` Dirichlet fixtures (`as const` -> explicit annotation) | (close) | `46c912891` | NEW at v1.49.580 |

### Part A: Multivariate Conjugate Priors + Sliced-Wasserstein

- **DIRICHLET-MULTINOMIAL CONJUGATE -- k-arm tests with categorical outcomes.** `src/bayes-ab/dirichlet.ts` provides `posteriorDirichlet(prior, outcome) -> { alphas }` as the closed-form `alphas[i] + counts[i]` per-coordinate update, length-checked. `dirichletMean({ alphas })` returns `alphas[i] / sum(alphas)`. `sampleDirichlet({ alphas }, rng)` draws via independent Gamma per coordinate normalised to the simplex. `summariseMultinomial(samples)` tallies one-hot vectors or class-index streams into a `MultinomialOutcome`. Beta-Bernoulli is the K=2 specialisation -- the math reduces exactly. Reference values verified against `scipy.stats.dirichlet`.
- **MULTIVARIATE-NORMAL CONJUGATE -- type vocabulary provisioned.** `MvExperimentDesign<P>` in `src/bayes-ab/mv-types.ts` is parameterised on a generic design payload `P`, so a future Inverse-Wishart-prior milestone can land a continuous-multivariate `runBayesABMv` invocation without renaming the surface. The continuous-multivariate prior family is explicitly DEFERed (it is a different conjugate family and lands when a real continuous use case demands it); the type provisioning is a forward-citation slot, not an implementation.
- **SLICED-WASSERSTEIN IPM-BOED -- arXiv:2604.21849 forward-realization.** `slicedWasserstein(P, Q, { projections, rng })` samples M random unit vectors from S^(d-1) (standard-normal draws + L2 normalisation), projects P and Q onto each direction, computes `wasserstein1d` per projection, returns mean. Is a true metric on multivariate distributions (Rabin et al. 2011 / Kolouri et al. 2019). Threads through the same `SeedableRng` interface used in v1.49.579 -- no global `Math.random` in the algorithm path.
- **EXPECTED-LOSS-VECTOR STOPPING RULES -- multivariate posterior-shift metric.** `runBayesABMv` in `src/bayes-ab/coordinator-mv.ts` iterates `selectIpmBoedDesignMv -> observe(design) -> posteriorDirichlet(prior, outcome)` and after each step computes `2 * sum_K |posteriorMean_K - priorMean_K| / K`, clipped to `[-1, 1]`, then feeds it into the JP-002 e-process gate. Stops when the gate signals or the budget is exhausted. Returns the same `{ posterior, history, stoppedReason }` shape as `runBayesAB`.
- **WAVE-STAGED CONSTRUCTION -- W0 catalog through W5 closing wave.** Each of W0 (types), W1 (Dirichlet update), W2 (sliced-W primitive), W3 (mv selector), W4 (mv coordinator), W4b (Limitations close), W5 (paper benchmark + e2e) is a single atomic commit. No commit covers more than one wave's work. The merge commit `925596fcf` and the release-notes backfill (this document) are trivial to attribute as a result.
- **TEST INFRASTRUCTURE INHERITED FROM v1.49.579.** The same `SeedableRng`, the same paired-theta variance-reduction trick, the same JP-002 e-process gate, the same conjugate-by-construction architectural floor. v1.49.580 contributes only the multivariate generalisations; it does not re-author any 1-D surface.
- **CONJUGATE-PRIOR MENU EXTENSION -- adds Dirichlet to Beta + Normal.** `src/bayes-ab/index.ts` barrel update exposes the new types alongside the v1.49.579 surface. Future extensions (continuous-multivariate Inverse-Wishart, hierarchical priors, time-varying priors) land alongside, not on top.
- **MARSAGLIA-TSANG GAMMA SAMPLER -- inherited dependency for Dirichlet sampling.** The `sampleDirichlet` implementation reuses the Gamma sampler shipped at v1.49.579 (Marsaglia & Tsang 2000), normalising K independent Gamma draws to the simplex. No new sampler implementation; the reuse is the discipline.

### Part B: Open-Item Closure + CI-Fix Triage

- **WASSERSTEIN-BOED SUBSERIES CLOSURE -- v1.49.577 IPM-BOED thread substantively addressed.** The "Univariate parameter only. Multivariate IPM-BOED via sliced-Wasserstein is a separate algorithm" bullet on `src/ab-harness/wasserstein-boed.ts`'s `## Limitations` block is removed. The block now points readers to `src/bayes-ab/{ipm-boed-mv, sliced-wasserstein, coordinator-mv}` for >=1-D callers. Function-name-and-body honesty established at v1.49.579 is preserved; the only change is documentation.
- **JP-022 EXTENSION -- continuous-multivariate constraints documented as DEFER table.** The vision-doc DEFER table includes (a) multivariate Normal / Inverse-Wishart priors, (b) approximate-posterior methods (variational / MCMC) for non-conjugate priors, (c) deterministic-Sobol projections, (d) GPU-accelerated SW. Each item has an explicit reason. This converts the DEFER table from a one-way deferral into a forward-citation slot that future milestones inherit.
- **CI FIX AS LESSON -- as-const-on-tuples gotcha.** W5 `integration-mv.test.ts` Dirichlet prior fixtures used `as const`, making `alphas` a readonly `[1, 1, 1]` tuple. `DirichletPrior.alphas` expects mutable `number[]`. `tsc` strict-mode rejected. `vitest` accepted at runtime. Fix at `46c912891` replaced with explicit `: number[]` type annotations. The local-test-vs-CI-test divergence is a known tooling gap; the structural fix (forward lesson #2) is to gate every wave-close commit on `npm run build` (full tsc + vitest), not just `npx vitest run`.
- **DEFERRED MULTIVARIATE PRIORS -- Inverse-Wishart + hierarchical.** Continuous-multivariate Normal posteriors with Inverse-Wishart priors land when a real continuous-multivariate use case demands it. Hierarchical priors land alongside. Both stay inside the conjugate-by-construction architectural floor of `src/bayes-ab/`.
- **DEFERRED APPROXIMATE-POSTERIOR -- variational + MCMC.** Non-conjugate inference (variational Bayes, Hamiltonian Monte Carlo) is a different category of work; outside the conjugate-by-construction floor of `src/bayes-ab/`. When a use case arrives, that lands as `src/bayes-ab-approx/`, not as a smuggled-in extension to `src/bayes-ab/`.
- **DEFERRED DETERMINISTIC-SOBOL PROJECTIONS -- variance-reduction refinement.** Replacing the M random S^(d-1) projections with deterministic low-discrepancy Sobol sequences would tighten variance at the same M; the current Monte-Carlo SW is correct, just noisier. Deferred until a noise-floor use case demands it.
- **DEFERRED GPU-ACCELERATED SW -- CUDA kernel.** Not needed at current scale (R^3 to R^10 fits comfortably in CPU MC). Deferred until a scale-driven use case demands it; the math coprocessor (`coprocessors/math/`) is the natural landing surface.
- **NAMING DRIFT -- mission directory vs shipped milestone.** The on-disk mission directory is `v1-49-580-multivariate-boed/` (early framing as a Bayesian-Optimal-Experimental-Design extension). The shipped milestone name in `.planning/STATE.md` is `BAYES-SEQUENTIAL-MV` (post-v1.49.579 framing as the multivariate extension of v1.49.579 BAYES-SEQUENTIAL). Both names refer to the same shipped work. The directory was not renamed at the framing shift; documented here for traceability rather than retro-fixed.

## Convergent-discovery validation

**Lindley (1956) Annals of Mathematical Statistics** -- info-theoretic experimental design foundation. The IPM-BOED objective `U_W(d) = E[IPM(p(theta|y,d), p(theta))]` is a specialisation of Lindley's expected-information utility on a Wasserstein-IPM divergence rather than a KL divergence. Anchored at `src/bayes-ab/ipm-boed-mv.ts`.

**Chaloner & Verdinelli (1995) Bayesian Experimental Design. Statistical Science** -- canonical survey. Maps the BOED utility-family taxonomy that situates the IPM-BOED choice in context. Anchored at `src/bayes-ab/ipm-boed-mv.ts`.

**Rabin et al. (2011) Wasserstein Barycenter and its Application to Texture Mixing** -- introduces sliced-Wasserstein as a tractable IPM on R^d via 1-D projection averaging. Anchored at `src/bayes-ab/sliced-wasserstein.ts`. The multivariate-gap "separate algorithm" framing at v1.49.577 was a citation pointer to this paper; the v1.49.580 implementation is the translation.

**Kolouri et al. (2019) Generalized Sliced Wasserstein Distances** -- sliced-W theory + computational survey. Joint anchor with Rabin 2011 at `src/bayes-ab/sliced-wasserstein.ts`. Establishes sliced-W as a true metric (not merely a divergence) on multivariate distributions.

**arXiv:2604.21851 (JP-002 anytime-valid e-process)** -- v1.49.577 forward citation. The same gate consumed at v1.49.579 (1-D posterior-shift metric) is consumed at v1.49.580 with only the metric definition changing. Anchored at `src/bayes-ab/coordinator-mv.ts`.

**arXiv:2604.21849 IPM-BOED forward-realization** -- v1.49.577 forward citation; substantively addressed at v1.49.580 via the sliced-Wasserstein construction. The "separate algorithm" pointer is now realised as ~10 commits of citation-anchored translation work.

**Bernardo & Smith (1994) Bayesian Theory** -- Dirichlet-Multinomial reference. Standard textbook anchor for the conjugate update `alpha' = alpha + counts`. Cross-anchored alongside Bishop *PRML* §2.2.1 in `src/bayes-ab/dirichlet.ts`.

**Berger & Wolpert (1988) The Likelihood Principle** -- multivariate stopping-rule foundation. The JP-002 anytime gate's correctness under arbitrary stopping is rooted in the likelihood principle's guarantee that posterior inference is invariant to stopping rule.

**Marsaglia & Tsang (2000) A Simple Method for Generating Gamma Variables** -- Dirichlet sampler dependency. Inherited from v1.49.579; reused unchanged at v1.49.580 to draw Dirichlet samples via independent Gamma draws normalised to the simplex.

**Bishop (2006) Pattern Recognition and Machine Learning §2.2.1** -- Dirichlet-Multinomial conjugacy textbook reference. Cross-anchor with Bernardo & Smith for the closed-form posterior update; the §2.2.1 derivation is the canonical undergraduate-textbook walkthrough that the v1.49.580 implementation mirrors.

**Wasserstein (1969) Markov Processes Over Denumerable Products of Spaces** -- the earth-mover distance foundation. The 1-D Wasserstein primitive `wasserstein1d` shipped at v1.49.579 and the multivariate sliced-Wasserstein at v1.49.580 both descend from this single distributional metric.

## Retrospective

v1.49.580 reads v1.49.579 BAYES-SEQUENTIAL (univariate Bayesian sequential A/B; closing commit on main `95c05ccea`) and carries from v1.49.577 JULIA-PARAMETER (`wasserstein-boed.ts` skeleton) -> v1.49.578 substantiation (IPM-BOED data-generating-model DEFER) -> v1.49.579 (univariate close + multivariate gap as the last open bullet). The retrospective covers what carried forward, what worked, and what could be better.

## What Worked

- **Wave atomicity held end-to-end.** Each of W0-W5 + W4b + inventory + version-bump + CI-fix was a single atomic commit. No commit covered more than one wave's worth of work. The merge commit message (`925596fcf`) was trivial to write and the release notes backfill (this document) was trivial to attribute.
- **Test floor over-shot the spec target.** The mission spec called for >=+20 test delta over v1.49.579 baseline; actual delta was +48. The over-shoot came from explicit numerical-equivalence tests (the d=1 SW-vs-W1 verification, the K=2-Dirichlet-vs-Beta verification) -- tests the spec did not require but that the parallel-surface architectural choice does. The over-shoot is a feature of the architectural decision, not a slip.
- **DEFERs documented up-front, not after-the-fact.** The vision-doc's DEFER table (multivariate Normal priors, approximate-posterior methods, deterministic-Sobol projections, GPU SW) was authored before W0 commit. Each item has an explicit reason. This is the discipline carried from v1.49.578's "explicit DEFER documented since v1.49.577" phrasing.
- **Zero regressions on full suite.** `npx vitest run` green at every wave-close commit. The CI fix at the end was a `tsc` strict-mode catch that vitest had missed locally, not a behavioural regression.
- **Citation-anchored translation, not exploration.** The JP-002 e-process gate (arXiv:2604.21851) and the sliced-Wasserstein primitive (Rabin et al. 2011 / Kolouri et al. 2019) were citation-anchored before code was written. The vision-doc reads as a thin layer over the citations; no exploratory algorithmic decisions were made during execution.
- **Conjugate-by-construction floor held.** Every milestone in the `src/bayes-ab/` series so far (v1.49.579 + v1.49.580) holds the conjugate-by-construction architectural floor: closed-form posterior updates, no Monte-Carlo for the update itself.
- **Paired-theta variance-reduction generalises.** v1.49.579's paired-theta trick (pre-sample theta_j once, re-use across designs) ports verbatim to `selectIpmBoedDesignMv`. The trick is a sampling discipline rather than a 1-D-specific algorithm; no rederivation needed.
- **JP-002 gate consumes a single canonical scalar.** The same gate the 1-D coordinator used works at multivariate scale with only a metric change. No gate re-implementation; only a new metric definition. The architectural separation between gate and metric is preserved.

## What Could Be Better

- **Release-notes drift.** This is the dominant retro item. v1.49.580 shipped on the same day as v1.49.577 + v1.49.578 + v1.49.579 (4-milestone single-day sprint). None of the four authored a `docs/release-notes/v1.49.<N>/` directory at ship time. Drift caught at v1.49.581 ship; remediated by 1-day-late backfill (this document is part of that pass). Forward operational rule: every dev-line milestone ship MUST include the full 5-file release-notes structure BEFORE tag-push. The release-notes authoring step is part of the closing wave (W6), not an after-tag housekeeping pass.
- **CI fix at the close, not before.** The W5 `as const` mistake should have been caught by the W5 commit's local `npm run build`, not by post-tag CI. The local-test-vs-CI-test divergence (vitest looser than tsc strict) is a known tooling gap; W5 ran vitest, not the full build. The fix in `46c912891` is the right surface, but the structural fix is to gate every wave-close commit on `npm run build` (full tsc + vitest) locally before push.
- **Mission directory naming drift.** On-disk mission directory `v1-49-580-multivariate-boed/` predates the post-v1.49.579 framing shift to `BAYES-SEQUENTIAL-MV`. The directory was not renamed when the framing shifted; both names are meaningful and refer to the same shipped work, but the drift is a minor traceability cost.
- **Cadence pressure causal chain.** The 4-milestone-in-1-day cadence was the proximate cause of release-notes drift; the CI-fix-at-close was the proximate cause of cadence pressure spilling into the final commit slot. If the cadence had allowed time for release-notes authoring per milestone, the sprint would have shipped one-milestone-per-day instead. The structural fix (lesson #1) makes release-notes authoring a hard ship gate; the cultural fix is to recognise that ship cadence has a release-notes-authoring tax and budget for it.
- **Type-fixture discipline gap.** The `as const` test fixture pattern is a TypeScript idiom that produces readonly tuples; the `DirichletPrior.alphas: number[]` interface expects mutable arrays. The mismatch is detectable at type-check time but not at vitest runtime. A lint rule banning `as const` on test fixtures that flow into mutable-array fields would catch this class of issue at edit time.

## Lessons Learned

1. **Release-notes 5-file structure is a HARD ship gate.** Every dev-line milestone ship MUST include README.md + chapter/00-summary.md + chapter/03-retrospective.md + chapter/04-lessons.md + chapter/99-context.md BEFORE tag-push. Restated as v1.49.582 forward lesson #12.
2. **CI gate every wave-close on full `npm run build`, not just `npx vitest run`.** The local-test-vs-CI-test divergence is a tooling gap that costs one extra commit when it bites; gating wave-close on the full build avoids the extra commit and keeps the closing wave atomic.
3. **Conjugate-by-construction stays the architectural floor for `src/bayes-ab/`.** Future extensions (continuous-multivariate, hierarchical, time-varying) hold the closed-form-update floor. When a use case genuinely requires non-conjugate inference, that lands as `src/bayes-ab-approx/`, not as a dilution of the conjugate floor.
4. **Function-name-and-body honesty is the architectural floor for `src/ab-harness/wasserstein-boed.ts`.** Every named function in the file either delegates to a real implementation in `src/bayes-ab/` or is removed. The honesty rule is restated in the file's preamble for v1.49.581+ readers.
5. **Citation-anchored algorithmic gaps are translation tasks, not exploration tasks.** When a future milestone scope is "implement algorithm X from cited paper Y," estimate it as translation work (waves = component count + 2 for tests + close), not exploration work. Authoring `01-vision-doc.md` as a thin layer over the citations is what makes the estimate-shape work.
6. **Parallel surfaces beat unified surfaces when the special-case math reduces.** `selectIpmBoedDesign` (1-D) and `selectIpmBoedDesignMv` (>=1-D) ship as parallel surfaces verified by numerical-equivalence tests, not collapsed into runtime dispatch. Each surface stays readable on its own; future case-specific optimisations are addable without touching the other surface.
7. **The mission package's DEFER table is a forward-citation slot.** When a future milestone addresses one of the deferred items (continuous-multivariate priors, approximate-posterior, deterministic-Sobol, GPU SW), the milestone vision-doc should cite back to v1.49.580's DEFER entry as the prior boundary marker.
8. **JP-002 anytime-valid gate generalises across dimensionalities cleanly.** Future Bayesian-sequential code (continuous-multivariate, hierarchical, time-varying) reuses the JP-002 gate verbatim and only contributes a metric definition. The gate stays a single canonical surface that consumes a scalar in `[-1, 1]`.
9. **The `wasserstein-boed.ts` open-items subseries reaches its natural close at v1.49.580.** Future open-items entries on the file are net-new (not carried). The subseries does not have inherited open items into v1.49.581+. If a future use case surfaces a new gap, that gap is opened fresh.
10. **4-milestone-in-1-day sprints are the drift trigger to design against.** Multi-milestone single-day sprints are allowed but require explicit release-notes-authoring time at the end of each milestone in the sprint. If cadence does not allow time for release-notes authoring per milestone, ship one-milestone-per-day instead.
11. **Backfilled release-notes carry an explicit "Backfilled" header.** If a future ship requires release-notes backfilling, mark the backfill explicitly in the README.md + chapter/99-context.md headers; do not retroactively claim same-day authorship. This preserves the audit trail and makes the drift-and-remediation cycle visible to future readers.

## By the Numbers

| Metric | Pre-v1.49.580 | Post-v1.49.580 | Delta |
|---|---|---|---|
| Tests passing | 28555 | 28603 | +48 |
| `src/bayes-ab/` source modules | 4 (univariate) | 9 (with mv) | +5 |
| `src/bayes-ab/` test files | 4 | 10 | +6 |
| Conjugate prior families exposed | 1 (Beta) | 2 (Beta + Dirichlet) | +1 |
| IPM primitives | 1 (`wasserstein1d`) | 2 (`wasserstein1d` + `slicedWasserstein`) | +1 |
| Sequential coordinators | 1 (`runBayesAB`) | 2 (`runBayesAB` + `runBayesABMv`) | +1 |
| `wasserstein-boed.ts` open-items bullets | 1 (multivariate gap) | 0 | -1 (CLOSED) |
| Commits on dev | -- | 10 | -- |
| Regressions | 0 | 0 | 0 |

## Health Metrics

| Aspect | State |
|---|---|
| Build (npm run build) | Green at `46c912891` |
| Vitest full suite | 28603 passing, 0 failing |
| TypeScript strict | Green at `46c912891` |
| Cargo build (src-tauri) | Green at `46c912891` |
| Tag pushed | v1.49.580 (annotated, at `46c912891`) |
| Merge to main | `925596fcf` |
| INVENTORY-MANIFEST.json | Regenerated at `37121e283` |
| Open items inherited into v1.49.581+ | 0 from `wasserstein-boed.ts` subseries; 4 DEFERs as forward-citation slots |

## Test Posture

| Test class | Count |
|---|---|
| Reference-value tests against `scipy.stats.dirichlet` (mean + samples) | >=3 |
| Property tests (alpha + count conservation across composition) | >=1 |
| `slicedWasserstein` correctness tests (identical -> 0; symmetric; matches `wasserstein1d` in d=1; monotone in mean separation; dimensionality validation) | >=4 |
| `selectIpmBoedDesignMv` ranking tests (determinism under fixed seed; high-info designs rank higher; constant-outcome corner case) | >=3 |
| `runBayesABMv` coordinator tests (stop path: gate fires before budget; continue path: budget exhausted before gate fires) | >=2 |
| Numerical-equivalence tests at K=2 boundary (Dirichlet-vs-Beta posterior; SW-vs-W1 in d=1) | >=2 |
| Paper benchmark (3-arm Multinomial recovery, sample-size designs, n=200 wins) | 1 |
| End-to-end integration (`integration-mv.test.ts`: planted-truth Dirichlet, JP-002 anytime stop fires within sample budget) | 1 |

## Engine state after v1.49.580

- Test count: 28603 (+48 over v1.49.579 baseline of 28555; +93 over v1.49.578 final of 28510)
- New files: 5 source modules + 6 test files in `src/bayes-ab/`
- Closed: `wasserstein-boed.ts` multivariate-gap bullet (carried since v1.49.577)
- Open items remaining for v1.49.581+: 0 (the BAYES-SEQUENTIAL-MV milestone reaches its natural close; the wasserstein-boed.ts subseries no longer carries open items)
- The IPM-BOED replacement-data-generating-model open item from v1.49.578 is now substantively addressed -- the multivariate harness ships with its own `mvModelSamples` callback contract, which is the data-generating-model surface the v1.49.578 deferral was waiting for
- Versions bumped: `package.json` -> 1.49.580, `package-lock.json` -> 1.49.580, `src-tauri/Cargo.toml` -> 1.49.580, `src-tauri/tauri.conf.json` -> 1.49.580

## Branch state

- W0 -> W1 -> W2 -> W3 -> W4 -> W4b -> W5 -> inventory -> version-bump -> CI-fix is the 10-commit dev sequence
- Dev tip at v1.49.580 close: `46c912891` (CI fix: drop `as const` on integration-mv test fixtures)
- Main tip at v1.49.580 close: `925596fcf` (merge: v1.49.580 BAYES-SEQUENTIAL-MV from dev)
- Tag `v1.49.580` annotated, pushed at `46c912891`
- Predecessor close on dev: `ac35d7808` (v1.49.579 BAYES-SEQUENTIAL univariate)
- Predecessor close on main: `95c05ccea` (v1.49.579 merge)
- v1.49.581 follow-on lands 2026-04-27 with NASA degree triple ship + release-notes drift remediation
- v1.49.581 + v1.49.582 introduced the canonical 5-file release-notes structure as a normative ship gate
- STATE.md `v1_49_580_archived` block records `status: ready_for_review`, `closing_commit_on_main: 925596fcf`, `retained_for_history: true`

## Algorithmic spine -- 1-D and multivariate share one shape

The IPM-BOED objective is unchanged across dimensionalities:

```
U_W(d) = E_{y ~ p(y | d, theta), theta ~ p(theta)} [IPM(p(theta | y, d), p(theta))]
```

What changes between dimensionalities is (a) the IPM and (b) the prior family. The conjugate-update structure stays closed-form in both:

| Dimensionality | Prior | Likelihood | IPM | Posterior update |
|---|---|---|---|---|
| 1-D (v1.49.579) | Beta(a, b) | Bernoulli(p) | wasserstein1d | a' = a + successes; b' = b + failures |
| Multivariate (v1.49.580) | Dirichlet(alpha) | Multinomial(n, theta) | slicedWasserstein | alpha' = alpha + counts |

The architectural decision to ship parallel surfaces (rather than an auto-dispatching unified surface) is explicit in the milestone spec: the two surfaces are deliberately parallel; tests verify they agree numerically when the inputs are equivalent, but no runtime branching is taken on dimensionality.

## Numerical-equivalence verification

The architectural decision to ship parallel 1-D and multivariate surfaces is verified by tests, not enforced by code dispatch:

- `slicedWasserstein` in d=1 with M=1 projection equals `wasserstein1d` exactly (the random unit vector in S^0 is +/-1; either gives the 1-D Wasserstein up to sign).
- `slicedWasserstein` in d=1 with M >= 2 projections converges to `wasserstein1d` within Monte-Carlo tolerance.
- `posteriorDirichlet({ alphas: [a, b] }, { counts: [s, f] })` returns `{ alphas: [a + s, b + f] }`, which is `posteriorBeta({ a, b }, { successes: s, failures: f })` flattened.
- A `selectIpmBoedDesignMv` invocation with K=2 Dirichlet prior + binary-coded Multinomial outcomes returns the same design ranking (modulo Monte-Carlo tolerance) as `selectIpmBoedDesign` on the equivalent Beta-Bernoulli setup.

These tests are run as part of the W2 and W3 test floors; they are explicit verification of the parallel-surface architectural choice, not a unification claim.

## 4-milestone single-day sprint context

v1.49.580 is the fourth of four milestones closed on 2026-04-26 in a single-day sprint:

| Milestone | Scope | Closing commit on dev | Closing commit on main | Test count |
|---|---|---|---|---|
| v1.49.577 | JULIA-PARAMETER (87-paper synthesis + 4 anchors + 1 philosophical pairing) | `1b9eedb9b` | -- | 28345 |
| v1.49.578 | JP substantiation + closure (W2 wirings, JP-040 NASA citations, JP-001 lake-build) | `520419af8` | `2100e5391` | 28510 |
| v1.49.579 | BAYES-SEQUENTIAL univariate (`src/bayes-ab/` home, real IPM-BOED, runBayesAB) | `ac35d7808` | `95c05ccea` | ~28555 |
| **v1.49.580** | **BAYES-SEQUENTIAL-MV multivariate (this milestone)** | **`46c912891`** | **`925596fcf`** | **28603** |

All four shipped 2026-04-26. None authored release-notes at ship time. Drift caught at v1.49.581 ship; remediated by 1-day-late backfill across all four. The 4-milestone-in-1-day cadence was the proximate cause; the structural fix is the 5-file release-notes ship gate (lesson #1).

## Out of Scope

- Inverse-Wishart hierarchical priors -- deferred (different conjugate family; lands when a real continuous-multivariate use case demands it)
- Variational + MCMC approximate-posterior methods -- deferred (outside the conjugate-by-construction architectural floor of `src/bayes-ab/`; lands in `src/bayes-ab-approx/` when a use case demands it)
- Deterministic-Sobol low-discrepancy projections -- deferred (variance-reduction refinement; current Monte-Carlo SW is correct, just noisier)
- GPU-accelerated sliced-Wasserstein kernel -- deferred (not needed at current scale; R^3 to R^10 fits comfortably in CPU MC)
- Wasserstein-Everywhere downstream consumers in `src/anytime-valid/` -- separate milestone (consumes the JP-002 e-process gate but does not change the gate's contract)
- Continuous-multivariate Normal posteriors with conjugate Inverse-Wishart -- separate milestone (different conjugate family)
- Time-varying / non-stationary priors -- separate milestone (drift-aware extension; orthogonal to dimensionality)
- Hierarchical / multilevel priors -- separate milestone (population-level extension; orthogonal to dimensionality)
- A/B-harness UI surface for multivariate inputs -- separate milestone; the CLI-level surface ships at v1.49.580 but the desktop frontend (`desktop/`) remains 1-D-only at this milestone close
- Cross-validation for multivariate stopping rules -- the JP-002 e-process gate is anytime-valid by construction, but cross-validation against fixed-budget classical tests is a separate empirical study
- Replication study against published 3-arm A/B benchmarks -- the W5 paper-benchmark-mv test exercises `runBayesABMv` against the Rabin 2011 SW analytical prediction, but a full replication study against published multi-arm bandit datasets is deferred

## Dedications

- The `src/bayes-ab/` univariate scaffold authors at v1.49.579 -- the multivariate triple is a strict generalisation of their work, not a parallel rewrite. The function-name-and-body honesty floor they established is what made the multivariate close a translation task rather than a redesign.
- The JULIA-PARAMETER citation cluster authors at v1.49.577 -- Anchor 4 (arXiv:2604.21851 e-process) and the Wasserstein-IPM-BOED forward citation are the two anchors this milestone depends on. The multivariate-gap footnote they left is the open thread that v1.49.580 closes.
- The four-milestone-single-day sprint operators on 2026-04-26 -- v1.49.577 + v1.49.578 + v1.49.579 + v1.49.580 shipped in sequence on a single day; the cadence pressure caused release-notes drift but the underlying work shipped clean.
- Rabin et al. (2011) and Kolouri et al. (2019) -- the sliced-Wasserstein literature whose forward-realization is the multivariate piece of v1.49.580. Their construction made the multivariate IPM-BOED tractable on commodity hardware without GPU acceleration or low-discrepancy sequences.
- Lindley (1956) and Chaloner & Verdinelli (1995) -- the BOED literature foundation. Their info-theoretic experimental-design framework is the canonical lineage that the IPM-BOED objective specialises.

## Mission Package

`.planning/missions/v1-49-580-multivariate-boed/`

- `README.md` -- mission entry point and component manifest
- `01-vision-doc.md` -- thin layer over the cited literature; reads as a translation spec
- `03-milestone-spec.md` -- shipped scope, acceptance criteria, DEFER table
- `04-wave-execution-plan.md` -- W0 through W6 wave decomposition (10 commits expected)
- `05-test-plan.md` -- test floors per component + numerical-equivalence verification
- `components/00-shared-context.md` -- shared types and conventions
- `components/01-mv-types.md` (W0)
- `components/02-dirichlet.md` (W1)
- `components/03-sliced-wasserstein.md` (W2)
- `components/04-mv-selector.md` (W3)
- `components/05-mv-coordinator.md` (W4)
- `components/06-tests.md` (W5)
- `components/07-closing-wave.md` (W6 -- inventory + version bump + release-notes; the release-notes step is the one that drifted)

## Wave-by-wave commit narrative

- **W0 (`6dacd1966`) -- Multivariate types.** `src/bayes-ab/mv-types.ts` adds `DirichletPrior { alphas: number[] }`, `MultinomialOutcome { counts: number[] }`, and `MvExperimentDesign<P>` parameterised on the design payload type `P`. Type-shape only; no behaviour. Barrel update in `src/bayes-ab/index.ts`. The W0 commit is the smallest atomic unit -- a pure-types commit that subsequent waves can lean on without circular dependencies.
- **W1 (`22e3a1fdc`) -- Dirichlet conjugate update.** `src/bayes-ab/dirichlet.ts` lands with closed-form `posteriorDirichlet`, mean and sampler helpers, and `summariseMultinomial` for tallying observation streams. >=3 reference-value tests against `scipy.stats.dirichlet`. Wave atomicity is held: the entire conjugate-update primitive lands in one commit, with tests, but no consumer.
- **W2 (`f87a70c31`) -- Sliced-Wasserstein primitive.** `src/bayes-ab/sliced-wasserstein.ts` lands with `slicedWasserstein(P, Q, { projections, rng })` and >=4 tests including the d=1 numerical-equivalence test against `wasserstein1d`. Threads through `SeedableRng`, no global `Math.random`.
- **W3 (`122a2bca6`) -- Multivariate IPM-BOED selector.** `src/bayes-ab/ipm-boed-mv.ts::selectIpmBoedDesignMv` lands. Pre-samples theta_j once (paired-theta variance-reduction), iterates over candidate designs, computes `slicedWasserstein(posterior, prior)` per design, ranks by expected-IPM, returns argmax. >=3 tests covering determinism, ranking sanity, corner cases.
- **W4 (`028683bb2`) -- Multivariate sequential coordinator.** `src/bayes-ab/coordinator-mv.ts::runBayesABMv` lands. Iterates select-observe-update, computes the multivariate posterior-shift metric, feeds it into the JP-002 e-process gate, stops on signal or budget exhaustion. Returns `{ posterior, history, stoppedReason }`. >=2 tests covering stop and continue paths.
- **W4b (`7eff922b6`) -- wasserstein-boed.ts Limitations close.** Pure-documentation commit. The carried-since-v1.49.577 multivariate-gap bullet is removed; the `## Limitations` block now points readers to `src/bayes-ab/{ipm-boed-mv, sliced-wasserstein, coordinator-mv}` for >=1-D callers.
- **W5 (`ba2bfcc5a`) -- Paper benchmark + e2e integration.** `paper-benchmark-mv.test.ts` validates that `runBayesABMv` reaches the expected-information ranking that the Rabin 2011 SW analysis predicts for the 3-arm regime. `integration-mv.test.ts` exercises the full sequential coordinator end-to-end with a planted-truth Dirichlet and demonstrates JP-002 anytime stop fires within budget.
- **Inventory (`37121e283`) -- INVENTORY-MANIFEST.json regenerate.** Registers the 5 new mv modules. Pure-bookkeeping commit; no behavioural change.
- **Version bump (`d51e44975`) -- 1.49.580 across all surfaces.** `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` all move to `1.49.580`. Pure-bookkeeping commit; no behavioural change.
- **CI fix (`46c912891`) -- drop `as const` on integration-mv test fixtures.** One-line fix unblocking the `chore(release)` CI build (run `24957761986`). Replaces `as const` with explicit `: number[]` annotations on Dirichlet prior fixtures. Local `npm run build` green after the fix; tag pushed.

## Files

- See `chapter/00-summary.md` for the long-form milestone summary
- See `chapter/03-retrospective.md` for the v1.49.579 -> v1.49.580 carryover retrospective
- See `chapter/04-lessons.md` for lessons emitted forward to v1.49.581+
- See `chapter/99-context.md` for engine-state context after v1.49.580 close

---

*v1.49.580 / BAYES-SEQUENTIAL-MV / Multivariate IPM-BOED via Sliced-Wasserstein / shipped 2026-04-26 / release-notes backfilled 2026-04-27*
