# v1.49.579 -- BAYES-SEQUENTIAL

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes — drift remediation)
**Profile:** Solo (one-developer Opus session)
**Archetype:** Infrastructure Component — new `src/bayes-ab/` subsystem + honesty rewrite of `src/ab-harness/wasserstein-boed.ts`
**Closing dev tip:** `ac35d7808` (chore(release): bump npm + cargo + tauri to 1.49.579)
**Closing main merge:** `95c05ccea` (merge: v1.49.579 BAYES-SEQUENTIAL from dev)

---

## One-line scope

Univariate Bayesian sequential A/B testing — extends `src/ab-harness/` (built v1.49.577 JP-010a) with Bayesian sequential-testing primitives that operate on posterior-probability stopping rules under conjugate priors, sitting beside the existing frequentist sign test as a structurally-honest sibling. The milestone substantively closes the v1.49.578 JP-022 open item — `wasserstein-boed.ts` no longer ships hand-picked heuristic constants and the function name now matches the function body.

## Through-line

*When you can't substantiate the algorithm in its current home, build the home that actually has a place for it.* v1.49.578 closed open loops by extending; v1.49.579 closes the last one by giving the heuristic-shaped `wassersteinExpectedUtility` a real model to consume — making honest what was previously cosmetic.

## What shipped

A new `src/bayes-ab/` subsystem with five source files (types, conjugate, ipm-boed, coordinator, barrel) plus tests, and a refactor of `src/ab-harness/wasserstein-boed.ts` that deletes the `MAX_SHIFT_STDS` and `VAR_SHRINK` constants and delegates to the real IPM-BOED algorithm now living in the new subsystem. The `wasserstein1d` primitive in `src/ab-harness/` stays put — it was correct as authored and is now imported by the new `src/bayes-ab/ipm-boed.ts`.

| Component | Wave | Path |
|---|---|---|
| Types module + barrel | W0 | `src/bayes-ab/types.ts` + `src/bayes-ab/index.ts` |
| Conjugate Beta-Bernoulli update | W1 | `src/bayes-ab/conjugate.ts` |
| IPM-BOED design selector | W2 | `src/bayes-ab/ipm-boed.ts` |
| Sequential `runBayesAB` loop | W3 | `src/bayes-ab/coordinator.ts` |
| `wasserstein-boed.ts` honesty rewrite | W4 | `src/ab-harness/wasserstein-boed.ts` |
| Paper-benchmark + integration tests | W5 | `src/bayes-ab/__tests__/` + `src/ab-harness/__tests__/wasserstein-boed.test.ts` |
| Inventory regen + version bump | W6 | `INVENTORY-MANIFEST.json` + manifests |

## Citation anchors

- **Berger & Wolpert 1988** — *The Likelihood Principle* (the substrate Bayesian sequential testing inherits)
- **Bernardo & Smith 1994** — *Bayesian Theory* (conjugate-family update mechanics)
- **Kass & Raftery 1995** — *Bayes Factors*, JASA 90:773 (the posterior-probability decision-theoretic framing)
- **arXiv:2604.21849 §3** — IPM-BOED objective `U_W(d) = E_{θ∼prior, y∼p(y∣d,θ)} [ W1(p(θ∣y,d), p(θ)) ]` (the algorithm `selectIpmBoedDesign` implements)
- **JP-002 anytime-valid e-process** at `src/anytime-valid/` (consumed via `src/orchestration/anytime-gate.ts` for the sequential stopping rule — reused, not reimplemented)

## Test delta

| Metric | Value |
|---|---|
| Baseline (v1.49.578 close) | 28,510 passing |
| After v1.49.579 close | 28,555 passing |
| Net new tests | +45 |
| Target floor | ≥+15 |
| Regressions | 0 |

Test breakdown by wave: W1 conjugate update +18 (3 closed-form + 1 property over 12 random tuples + 4 mean + 4 variance + 2 RangeError + 4 summarise); W2 IPM-BOED selector +9 (4 Beta-sampler + 1 determinism + 2 ranking + 2 corner-case); W3 coordinator +6 (3 scaled-shift sanity + 1 stop + 1 continue + 1 no-gate); W4 honesty rewrite -2 net (kept 3 wasserstein1d + replaced 4 heuristic-fixture tests with 4 honest-delegation tests + added 4 honesty-audit assertions); W5 paper benchmark + integration +14.

## Profile

Solo Opus session. No fleet dispatch; no separate research stage (citation already on-tree from JP-022 audit). 8 substantive commits between baseline `520419af8` and closing `ac35d7808`:

```
ac35d7808 chore(release): bump npm package + cargo + tauri to 1.49.579
292ad2cf7 chore(inventory): regenerate INVENTORY-MANIFEST.json for src/bayes-ab/
f2fb73dea feat(bayes-ab): paper benchmark + integration + paired-θ + 2× metric scaling
47551ad0e refactor(ab-harness): wasserstein-boed.ts delegates to real IPM-BOED algorithm
a65a773b4 feat(bayes-ab): sequential runBayesAB loop with JP-002 anytime stop
575634583 feat(bayes-ab): real IPM-BOED design selector consuming Beta posterior
64f3d2ad8 feat(bayes-ab): conjugate Beta-Bernoulli update with reference tests
e8b7dfbed feat(bayes-ab): add types module + barrel
```

## What this milestone is NOT

- **Not multivariate.** The IPM-BOED implementation is 1-D Beta-Bernoulli only. Multivariate IPM-BOED via sliced-Wasserstein is the explicit DEFER, scoped to v1.49.580 BAYES-SEQUENTIAL-MV (which shipped same day). The `## Limitations` block in `wasserstein-boed.ts` was trimmed to multivariate-only as part of W4.
- **Not a replacement for `runAB`.** The frequentist sign test in `src/ab-harness/coordinator.ts` serves a different problem shape (two skill bodies, noisy effect size). `runBayesAB` is the Bayesian sibling for callers with a parametric model, not a successor.
- **Not a new e-process.** `src/bayes-ab/coordinator.ts` does not contain a martingale; it consumes the JP-002 anytime-valid e-process at `src/anytime-valid/` via `src/orchestration/anytime-gate.ts`.
- **Not an expansion of the conjugate family.** Beta-Bernoulli only at this milestone. Normal-Normal, Gamma-Poisson, etc. are out-of-scope DEFERs unblocked when a caller appears with that conjugate-pair shape.

## Open items after v1.49.579

- **Multivariate IPM-BOED via sliced-Wasserstein** — separate-paper DEFER, addressed by v1.49.580 BAYES-SEQUENTIAL-MV (same-day successor milestone). The univariate↔multivariate split was deliberate: this milestone closed the JP-022 honesty gap without claiming multivariate scope.

## Files

- See `chapter/00-summary.md` for the long-form release summary
- See `chapter/03-retrospective.md` for the v1.49.578 → v1.49.579 carryover retrospective
- See `chapter/04-lessons.md` for the lessons emitted forward to v1.49.580+
- See `chapter/99-context.md` for engine-state context after v1.49.579

---

*v1.49.579 / BAYES-SEQUENTIAL / 2026-04-26 / backfilled 2026-04-27*
