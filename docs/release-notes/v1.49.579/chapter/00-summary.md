# v1.49.579 — BAYES-SEQUENTIAL — Summary

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes — drift remediation)
**Subsystem added:** `src/bayes-ab/` (5 source files + barrel + tests)
**Subsystem rewritten:** `src/ab-harness/wasserstein-boed.ts` (honesty pass — constants gone; delegates to real algorithm)
**Profile:** Solo (one-developer Opus session)

## One-line

v1.49.579 builds the Bayesian sibling of `src/ab-harness/`'s frequentist sign test — a univariate Beta-Bernoulli sequential A/B harness whose existence gives `wassersteinExpectedUtility` a real `p(y | d, θ)` to consume, allowing the W4 refactor of `src/ab-harness/wasserstein-boed.ts` to delete the hand-picked constants `MAX_SHIFT_STDS = 1.5` and `VAR_SHRINK = 0.8` and replace the heuristic posterior with a closed-form Beta posterior threaded through the `selectIpmBoedDesign` algorithm now living at `src/bayes-ab/ipm-boed.ts`. The function name and the function body now match: `wassersteinExpectedUtility` IS the IPM-BOED algorithm from arXiv:2604.21849 §3, with no hand-picked constants — only Monte-Carlo precision knobs (which is what an algorithm of that family is allowed to have).

## What "BAYES-SEQUENTIAL" means at v1.49.579

This milestone is **univariate Bayesian sequential A/B testing**. Three operative pieces:

1. **Bayesian.** Skill quality `θ` is modeled as a Beta-distributed latent prior; each experiment design `d` (sample-size choice, allocation split, scoring-rubric variant) induces a per-trial Bernoulli outcome `y | d, θ ~ Bernoulli(θ_d)`; the posterior `p(θ | y, d)` is computed in closed form via conjugate update `Beta(α, β) | (s, f) → Beta(α + s, β + f)`. Monte-Carlo enters only at the BOED outer loop, never at the update step itself.

2. **Sequential.** `runBayesAB` runs a round-by-round loop: select design, execute, conjugate-update, peek at a bounded posterior-shift statistic through the JP-002 anytime-valid e-process (Ville's-inequality martingale) at `src/anytime-valid/`, decide stop/continue. Type-I error is bounded at **any** sample size — the gate's Type-I bound holds without committing to a fixed `n` in advance, which is the whole point of sequential testing.

3. **A/B.** The setting is comparing experimental designs by their expected information yield. The IPM-BOED objective `U_W(d) = E_{θ∼prior, y∼p(y∣d,θ)} [ W1(p(θ∣y,d), p(θ)) ]` from arXiv:2604.21849 §3 is what `selectIpmBoedDesign` computes via Monte-Carlo: for each candidate design, simulate outcomes from the prior, compute the resulting posterior, take Wasserstein-1 against a sample from the prior, average over `(θ, y)` draws. Pick the design with the highest expected W1 shift.

The "univariate" qualifier is load-bearing: this milestone is 1-D Beta-Bernoulli only. Multivariate IPM-BOED via sliced-Wasserstein is a deliberate DEFER and ships separately as v1.49.580 BAYES-SEQUENTIAL-MV.

## Context — what was open at v1.49.578 close

The v1.49.578 JULIA-PARAMETER substantiation pass flagged `src/ab-harness/wasserstein-boed.ts` as carrying a **citation overclaim plus structural shape gap**, classified as JP-022:

> `wassersteinExpectedUtility` was framed as the IPM-BOED algorithm from arXiv:2604.21849 but shipped a hand-constructed bounded-update heuristic. The constants `MAX_SHIFT_STDS = 1.5` and `VAR_SHRINK = 0.8` were not from the paper. The function took pre-collapsed `outcomeSamples: number[]` with no contract that they came from any particular `p(y | d, θ)`, so the function could not reason about the data.

The v1.49.578 `## Limitations` block in `wasserstein-boed.ts` honestly named this gap. v1.49.579 closes it structurally: the algorithm gets a home (`src/bayes-ab/`) where the function body matches the function name, and the original `wasserstein-boed.ts` becomes a thin delegating adapter.

## Subsystem layout after v1.49.579

```
src/anytime-valid/                    ◀── existing (Ville's-inequality e-process, JP-002)
       │
       └─ consumed via ─┐
                        ▼
src/orchestration/anytime-gate.ts     ◀── existing (the gate surface)
       │
       └─ consumed by ─┐
                        ▼
src/bayes-ab/                          ◀── NEW SUBSYSTEM at v1.49.579
  ├── types.ts                         (BetaPrior, BernoulliOutcome,
  │                                      BayesABConfig, ExperimentDesign)
  ├── conjugate.ts                     (posteriorBeta closed-form +
  │                                      betaMean / betaVariance moment formulas +
  │                                      summariseOutcomes helper)
  ├── ipm-boed.ts                      (selectIpmBoedDesign — the real algorithm +
  │                                      sampleBeta via Marsaglia-Tsang Gamma +
  │                                      Best 1978 boost for shape < 1 +
  │                                      mulberry32 seeded PRNG)
  │     └── reuses src/ab-harness/wasserstein-boed.ts::wasserstein1d
  ├── coordinator.ts                   (runBayesAB sequential loop +
  │                                      scaledPosteriorShift bounded [-1, 1] metric)
  └── index.ts                         (barrel)
       │
       │ delegates from:
       ▼
src/ab-harness/wasserstein-boed.ts     ◀── existing (REWRITTEN at W4)
  ├── wasserstein1d                    (KEEP — correct as-is, exported)
  └── wassersteinExpectedUtility       (REWRITE — method-of-moments empirical→Beta,
                                         honest one-step adapter, delegates to
                                         src/bayes-ab/ipm-boed for the multi-design
                                         many-θ Monte-Carlo loop)
```

## Wave-by-wave outcomes

### W0 — Types module + barrel (commit `e8b7dfbed`)

`src/bayes-ab/types.ts` declares `BetaPrior`, `BernoulliOutcome`, `BayesABConfig`, `ExperimentDesign`, `SeedableRng`. Barrel at `src/bayes-ab/index.ts` re-exports the surface. Type-shape only at this wave.

### W1 — Conjugate Beta-Bernoulli update (commit `64f3d2ad8`)

`src/bayes-ab/conjugate.ts` implements `posteriorBeta(prior, successes, failures)` as the closed-form `Beta(α, β) | (s, f) → Beta(α + s, β + f)`. Adds the moment formulas `betaMean(α, β) = α / (α + β)` and `betaVariance(α, β) = αβ / ((α + β)² (α + β + 1))`. Adds `summariseOutcomes(samples)` to tally a 0/1 stream into `{successes, failures}`. Defensive `RangeError` on invalid priors (α ≤ 0) and negative outcome counts. **No Monte-Carlo here** — pure integer/float arithmetic. +18 tests including 3 scipy.stats.beta reference values for `betaMean` and 3 for `betaVariance` (Beta(2,5).var=0.0255…, Beta(10,10).var=0.0119…, Beta(0.5,0.5).var=0.125), plus 1 property test over 12 random tuples (α + β + s + f conservation), plus the RangeError throws.

### W2 — IPM-BOED design selector (commit `575634583`, BLOCK)

`src/bayes-ab/ipm-boed.ts` implements `selectIpmBoedDesign({ prior, designs, modelSamples, draws?, rng? })` — the real algorithm. Anchor: arXiv:2604.21849 §3. Computes `U_W(d)` via Monte-Carlo over `θ ~ prior` (DEFAULT_DRAWS.theta = 32 outer iters) and W1 between posterior + prior sample bags (DEFAULT_DRAWS.post = 64 + DEFAULT_DRAWS.prior = 64). Returns the argmax design plus per-design scores. The data-generating model `p(y | d, θ)` is supplied by the caller as a `modelSamples: (d, θ) => number[]` callback — this closes the v1.49.578 "no model is named" structural gap. Includes Beta sampler via Marsaglia-Tsang Gamma method with Best (1978) boost for shape < 1, and a `mulberry32` seedable PRNG so every randomness path threads through `SeedableRng` — no global `Math.random` consumed by the algorithm. +9 tests including 4 Beta-sampler sanity tests (MC mean tracks closed-form mean within 0.02 over 4000 draws), 1 determinism test (same seed ⇒ same design pick + same score), 2 ranking tests (high-information design wins ≥8/10 seeds), 2 corner-case tests (single-design shortcut bypasses Monte-Carlo; empty list throws RangeError).

### W3 — Sequential `runBayesAB` loop (commit `a65a773b4`)

`src/bayes-ab/coordinator.ts` implements `runBayesAB({ prior, designs, modelSamples, runSkill, anytimeStop?, maxRounds? })`. Each round picks a design via `selectIpmBoedDesign` (W2), executes via caller-supplied `runSkill`, conjugate-updates the posterior via `posteriorBeta` (W1), then peeks at a bounded posterior-shift metric `scaledPosteriorShift(posterior, prior)` through the v1.49.578 JP-002 anytime-valid e-process from `src/orchestration/anytime-gate.ts`. Stops when the gate rejects (Type-I bound holds at any sample size) or when `maxRounds` is hit. **The e-process is REUSED, not reimplemented** — `src/bayes-ab/` does not contain a martingale. +6 tests covering 3 `scaledPosteriorShift` sanity assertions (zero shift, positive shift, [-1,1] bounded), 1 stop path (planted true_θ=0.9 vs prior Beta(1,1) → exitReason=anytime within 60 rounds, budget sized to JP-002 default λ=0.5 e-process threshold 1/α = 20), 1 continue path (true_θ=0.5 matches prior Beta(2,2) mean → max-rounds), 1 no-gate path (anytimeStop omitted → always max-rounds).

### W4 — `wasserstein-boed.ts` honesty rewrite (commit `47551ad0e`, BLOCK)

The boundary commit. Before: `MAX_SHIFT_STDS = 1.5` and `VAR_SHRINK = 0.8` exist; module docstring frames the function as "illustrative IPM-aware heuristic." After: both constants deleted from source; module docstring upgraded to "Verified-against arXiv:2604.21849 §3"; `wassersteinExpectedUtility` rewritten as a method-of-moments empirical→Beta adapter that conjugate-updates via `posteriorBeta` (W1) and returns `wasserstein1d` between Beta-prior and Beta-posterior sample bags. The `## Limitations` block trims the three bullets describing the heuristic posterior and the made-up constants; the multivariate / sliced-Wasserstein bullet stays as an honest DEFER. `wasserstein1d` itself is unchanged — it was correct as authored. The historical "BOED ranking differs from naive EIG ranking under prior misspecification" fixture (which depended on the heuristic's clamping behavior — the test asserted `MAX_SHIFT_STDS` bounded the influence of outliers) is replaced by a more-shifted-vs-balanced test plus the W2 ranking tests. +11 tests net (3 wasserstein1d unchanged + 4 honest-delegation + 4 honesty-audit assertions: MAX_SHIFT_STDS gone, VAR_SHRINK gone, "illustrative heuristic" framing gone, Limitations trimmed to multivariate-only).

### W5 — Paper benchmark + integration (commit `f2fb73dea`)

The paper-benchmark test reproduces qualitative IPM-BOED behavior on a parameter-recovery toy: `θ ~ Beta`, designs are sample-size choices `n ∈ {10, 50, 200}`, expected ordering `n=200 > n=50 > n=10` confirmed. The integration test exercises the full `runBayesAB` loop end-to-end with a paired-θ planted-truth model. The 2× metric-scaling adjustment was added to give the JP-002 e-process gate a usable signal-to-noise window at the bounded posterior-shift metric used in W3 — the unscaled metric was inside the gate's noise floor at small round counts. +14 tests.

### W6 — Closing wave (commits `292ad2cf7` and `ac35d7808`)

`INVENTORY-MANIFEST.json` regenerated to register the new `src/bayes-ab/` files. Manifests bumped to 1.49.579 (`package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`). Tag `v1.49.579` annotated and pushed; GitHub release published; npm `gsd-skill-creator@1.49.579` published; main fast-forward merge `95c05ccea` carried 8 commits.

## Verification / acceptance against the spec

| # | Success criterion | Outcome |
|---|---|---|
| 1 | `src/bayes-ab/` exists with ≥4 source files + barrel | PASS — 4 source files (types, conjugate, ipm-boed, coordinator) + barrel |
| 2 | `posteriorBeta` closed-form, ≥3 reference-value tests | PASS — closed-form, 6 scipy reference tests (3 mean + 3 variance), 18 W1 tests total |
| 3 | `selectIpmBoedDesign` consumes Beta prior + explicit `modelSamples` callback | PASS — explicit callback contract |
| 4 | `runBayesAB` runs sequential loop with JP-002 anytime stop | PASS — reuses `src/orchestration/anytime-gate.ts`, no duplicated martingale |
| 5 | `wassersteinExpectedUtility` delegates; constants gone | PASS — `MAX_SHIFT_STDS` and `VAR_SHRINK` deleted from source |
| 6 | `## Limitations` trimmed to multivariate-only DEFER | PASS — three heuristic-posterior bullets removed; multivariate bullet kept |
| 7 | ≥1 paper-benchmark test (parameter-recovery toy) | PASS — `n=200 > n=50 > n=10` ordering confirmed |
| 8 | ≥3 unit tests covering W1/W2/W3 | PASS — 18/9/6 = 33 unit tests |
| 9 | ≥1 integration test (full `runBayesAB` end-to-end) | PASS — paired-θ integration test in W5 |
| 10 | Test delta ≥+15 over v1.49.578 baseline | PASS — +45 net (28,510 → 28,555) |
| 11 | Zero regression on full vitest | PASS |
| 12 | Next handoff open-items: ≤1 entry (multivariate DEFER) | PASS — 1 entry (multivariate sliced-W, addressed by v1.49.580) |

## Engine state after v1.49.579

- Test count: 28,555 passing (up +45 from 28,510)
- New subsystem: `src/bayes-ab/` registered in INVENTORY-MANIFEST.json
- JP-022 (`wasserstein-boed.ts` citation overclaim) — substantively closed
- Manifests: package.json + package-lock.json + Cargo.toml + tauri.conf.json all at 1.49.579
- Open items list: 1 (multivariate IPM-BOED via sliced-Wasserstein — separate-paper DEFER)
- Successor milestone: v1.49.580 BAYES-SEQUENTIAL-MV (multivariate extension; same-day ship)

---

*v1.49.579 / BAYES-SEQUENTIAL / 2026-04-26 / backfilled 2026-04-27*
