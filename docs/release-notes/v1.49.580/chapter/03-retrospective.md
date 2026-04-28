# v1.49.580 -- BAYES-SEQUENTIAL-MV -- Retrospective

**Reads:** v1.49.579 BAYES-SEQUENTIAL (univariate Bayesian sequential A/B; closing commit on main `95c05ccea`).
**Carries from:** v1.49.577 JULIA-PARAMETER (`wasserstein-boed.ts` skeleton) -> v1.49.578 substantiation (IPM-BOED data-generating-model DEFER) -> v1.49.579 (univariate close + multivariate gap as the last open bullet).

## Carryover Lessons Applied at v1.49.580

### From v1.49.579 -- Function-name-and-body honesty

v1.49.579's contribution to the harness was philosophical as much as algorithmic: it built `src/bayes-ab/` as the actual home of the Bayesian sequential A/B framework, so that `wasserstein-boed.ts` could honestly delegate rather than shadow-implement. v1.49.580 inherits that discipline: the multivariate code lives in `src/bayes-ab/` next to the univariate code (`mv-types.ts`, `dirichlet.ts`, `sliced-wasserstein.ts`, `ipm-boed-mv.ts`, `coordinator-mv.ts`) -- not stuffed back into `wasserstein-boed.ts` to keep the multivariate gap "in the same file." The function-name-and-body honesty rule is now the architectural floor: every named function in `src/ab-harness/wasserstein-boed.ts` either delegates to a real implementation in `src/bayes-ab/` or is removed.

### From v1.49.579 -- Conjugate-by-construction architectural floor

v1.49.579 established that the architectural floor for `src/bayes-ab/` is conjugate-by-construction: closed-form posterior updates, no Monte-Carlo for the update itself. v1.49.580 extends that floor cleanly -- Dirichlet-Multinomial is the natural conjugate extension of Beta-Bernoulli; the posterior update `alpha' = alpha + counts` is closed-form. The DEFERs documented in `01-vision-doc.md` (multivariate Normal / Inverse-Wishart priors; approximate-posterior methods for non-conjugate priors) are explicit boundary markers: when a real continuous-multivariate use case arrives, that work lands as a separate milestone, not a smuggled-in extension.

### From v1.49.579 -- Paired-theta variance-reduction

v1.49.579's `selectIpmBoedDesign` used a paired-theta variance-reduction trick (pre-sample theta_j once, re-use across designs) to make the IPM-BOED objective rankable with low variance even at modest sample budgets. v1.49.580's `selectIpmBoedDesignMv` applies the same trick verbatim: the multivariate prior samples are pre-drawn once, then re-used across all candidate designs in the design-ranking loop. The trick generalises directly to higher dimensions because it is a sampling-discipline rather than a 1-D-specific algorithm.

### From v1.49.579 -- 2x-scaling fix on the posterior-shift metric

v1.49.579's anytime-stop metric had a sign-vs-scale mismatch in early iteration that resolved at the v1.49.579 close as `2 * |posteriorMean - priorMean|` (the factor of 2 mirrors the Beta-mean sensitivity range; without it the metric was systematically below-threshold and the gate never fired). v1.49.580 carries the 2x scaling forward as `2 * sum_K |posteriorMean_K - priorMean_K| / K`, clipped to [-1, 1]. The K-average flatten the per-coordinate sensitivity to a single scalar that the JP-002 e-process can consume; the 2x preserves the Beta-mean-equivalent threshold calibration in the K=2 special case.

### From v1.49.578 -- IPM-BOED data-generating-model DEFER closure

v1.49.578 substantiation pass DEFERed the IPM-BOED replacement of the placeholder body in `wasserstein-boed.ts`: the missing piece was a concrete `p(y|d, theta)` data-generating model, which the harness shape required as a callback but no caller provided. v1.49.579 closed that for the 1-D case by introducing `modelSamples: (design, theta) => number` as the runtime callback that callers provide. v1.49.580 generalises to `mvModelSamples: (design, theta) => number[]` returning a multivariate observation block. The DEFER from v1.49.578 is now substantively closed across both dimensionalities.

### From v1.49.577 -- Citation-anchored at design time

The JP-002 anytime-valid e-process gate (arXiv:2604.21851) and the sliced-Wasserstein primitive (Rabin et al. 2011 / Kolouri et al. 2019) were citation-anchored before code was written. The v1.49.580 milestone vision-doc reads as a thin layer over the citations: the algorithm-level decisions ("Dirichlet for the multivariate prior", "sliced-W for the multivariate IPM", "paired-theta variance-reduction", "JP-002 gate on a multivariate posterior-shift metric") are direct readouts from the cited literature. No exploratory algorithmic decisions were made during execution; the milestone was a translation pass from cited algorithm to typed implementation. This is the citation-anchored-design-first discipline established at v1.49.577 in operation.

## What went well

- **Wave atomicity held.** Each of W0-W5 + W4b + inventory + version-bump + CI-fix was a single atomic commit. No commit covered more than one wave's worth of work. This made the merge commit message (`925596fcf`) trivial to write and made the release notes backfill (this document) trivial to attribute.
- **Test floor over-shot target.** Mission spec called for >=+20 test delta over v1.49.579 baseline. Actual delta was +48. The over-shoot came from the explicit numerical-equivalence tests (the d=1 SW-vs-W1 verification, the K=2-Dirichlet-vs-Beta verification) -- tests that the spec did not require but that the parallel-surface architectural choice does.
- **DEFERs documented up-front, not after-the-fact.** The vision-doc's DEFER table (multivariate Normal priors, approximate-posterior methods, deterministic-Sobol projections, GPU SW) was authored before W0 commit. Each item has a reason. This is the discipline carried from v1.49.578's "explicit DEFER documented since v1.49.577" phrasing.
- **Zero regressions on full suite.** `npx vitest run` green at every wave-close commit. The CI fix at the end was a `tsc` strict-mode catch that vitest had missed locally, not a behavioural regression.

## What didn't go well

- **Release notes drift.** This is the dominant retro item. v1.49.580 shipped on the same day as v1.49.577 + v1.49.578 + v1.49.579 (4-milestone single-day sprint). None of the four authored a `docs/release-notes/v1.49.<N>/` directory at ship time. The drift was caught at v1.49.581 ship and is being remediated by this backfill (1 day late). The lesson is in the v1.49.582 forward-lessons document as item #12: every dev-line milestone ship MUST include the full 5-file release-notes structure under `docs/release-notes/<version>/` BEFORE tag-push. The 4-milestone-in-1-day cadence pressure was the proximate cause; the structural fix is to make the release-notes 5-file structure a hard ship gate that blocks tag creation if any of the 5 files is missing.
- **CI fix at the close, not before.** The W5 `as const` mistake should have been caught by the Wave-5 commit's local `npm run build` rather than by post-tag CI. The local-test-vs-CI-test divergence (vitest looser than tsc strict) is a known tooling gap -- W5 ran vitest, not the full build. The fix in `46c912891` is the right surface, but the structural fix is to gate every wave-close commit on `npm run build` (full tsc + vitest) locally before push, not just `npx vitest run`.
- **Mission directory naming drift.** The on-disk mission directory is `v1-49-580-multivariate-boed/` (early framing as a BOED extension). The shipped milestone name is `BAYES-SEQUENTIAL-MV` (post-v1.49.579 framing as the multivariate extension of v1.49.579). Both names are meaningful; the directory was not renamed when the framing shifted. This is a minor drift; documented here for traceability rather than retro-fixed.

## What we learned (carried forward as v1.49.581+ lessons)

- **The multivariate gap is structurally simpler than it appeared at v1.49.577.** When the v1.49.577 `wasserstein-boed.ts` skeleton landed with the multivariate-gap footnote, the gap was framed as "a separate-paper algorithmic extension." In execution, it turned out to be ~10 commits of citation-anchored translation work with no exploratory algorithmic decisions. The "separate-paper" framing was correct as a citation pointer (Rabin 2011 / Kolouri 2019 are separate papers from the 1-D Wasserstein literature) but overstated the implementation distance. The lesson: a citation-anchored algorithmic gap is often closer to a translation task than an exploration task -- estimate accordingly.
- **Parallel surfaces beat unified surfaces when the special-case math reduces.** The architectural choice to ship `selectIpmBoedDesign` (1-D) and `selectIpmBoedDesignMv` (>=1-D) as parallel surfaces, rather than as one unified surface that auto-dispatches on dimensionality, is verifiable by numerical-equivalence tests but not collapsed into runtime branching. This keeps the 1-D code path readable on its own (a Beta-Bernoulli IPM-BOED loop is more digestible than a "general-K-Dirichlet-Multinomial-degenerating-to-Beta-Bernoulli-when-K=2" loop) and makes future K>2-specific optimisations addable to the multivariate surface without touching the 1-D surface.
- **Conjugate-by-construction stays the architectural floor.** Every milestone in the `src/bayes-ab/` series so far (v1.49.579 + v1.49.580) has held the conjugate-by-construction floor. Future extensions (continuous-multivariate, hierarchical priors, time-varying priors) should hold it too. When a use case arrives that genuinely requires non-conjugate inference, that lands as a separate `src/bayes-ab-approx/` directory rather than diluting the conjugate floor.

---

*v1.49.580 retrospective. Reads v1.49.579. Emits to v1.49.581+ carryover.*
