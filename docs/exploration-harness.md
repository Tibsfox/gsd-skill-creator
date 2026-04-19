# Exploration Harness — Living Sensoria (v1.49.561)

**Wave:** Continuation — Bundle 4 (phases 664–666)
**Parent:** Living Sensoria continuation wave — Bundle 3 (phases 661–663)
**Branch:** dev
**Date:** 2026-04-19
**Status:** shipped — MA-3+MD-2, MD-3, MD-4 committed and tested

---

## The Problem This Solves

The refinement wave's actor-critic loop (MA-2) and Bundle 3's stability rails give the adaptation system the ability to update safely. What they do not provide is a principled mechanism for *exploring* the skill-selection space before enough reinforcement signal has accumulated to justify confident exploitation. Without exploration, the selector converges early on whatever skill set performs best in the first few sessions and stops considering alternatives — a local-optimum trap familiar from any multi-armed bandit literature.

Classical ε-greedy exploration solves this crudely by inserting random perturbations with a fixed schedule. The exploration-harness bundle provides a more structured answer: a Langevin noise injection (MD-3) that adds variance-annealed gradient noise drawn from a Gaussian whose scale decreases with a temperature schedule (MD-4), paired with a stochastic softmax sampler (MA-3+MD-2) that converts M5's deterministic score-ranked selector output into a probability distribution before sampling. The result is exploration that naturally concentrates as signal accumulates — matching the posterior-sampling interpretation of Stochastic Gradient Langevin Dynamics (Welling & Teh 2011, ICML).

---

## Through-Line

```
MD-4 Temperature schedule reads M8 Quintessence snapshot:
  maps five-axis Quintessence signal to a base temperature T_base
  applies tractability tempering (coin-flip skills → higher T)
  publishes currentTemperature() + currentEta0()

MA-3+MD-2 Stochastic selector reads currentTemperature():
  applies softmax with temperature T to M5 score vector
  samples from the resulting categorical distribution (softmax-weighted)
  (tractability-scaled temperature via resolveTemperature)

MD-3 Langevin noise injection reads currentEta0() as step-size:
  generates Gaussian noise via gaussianSample() (Box-Muller)
  applies injectLangevinNoise() to M7 generative-model parameters
  guardDarkRoom() clamps post-noise parameters above SC-DARK floor
  MB-2 projection (Bundle 3) constrains the post-noise landing point
```

The three components share a single temperature state (the `defaultApi` singleton in `src/temperature/api.ts`), so MD-4 drives both downstream consumers from one schedule without synchronisation overhead.

---

## What Each Component Adds

**MA-3+MD-2 Stochastic selection** (`src/stochastic/`) replaces M5's argmax with a temperature-weighted softmax sample. `softmax` is a numerically-stable implementation (max-subtracted before exp, so logit values in the tens of thousands remain representable). `sampleByScore` draws a single index from the softmax distribution using a seeded `mulberry32` PRNG for reproducible test fixtures. `applyStochasticBridge` is the M5 adapter: when the flag is on, it receives the score vector from `selector.ts`, calls `resolveTemperature` (which reads `currentTemperature()` from MD-4 and applies a tractability-dependent scale), feeds the scaled temperature to `softmax`, and returns a sampled index. When the flag is off, the bridge short-circuits and returns the original score-ranked input reference unchanged (SC-MA3-01 byte-identical gate). Flag: `gsd-skill-creator.stochastic.enabled`.

**MD-3 Langevin noise injection** (`src/langevin/`) adds gradient noise to M7's generative-model parameters following the SGLD update rule of Welling & Teh 2011: θ_{t+1} = θ_t + ½·η_t·∇log p(θ_t|D) + ε_t where ε_t ~ N(0, η_t). In this module η_t = `currentEta0()` from MD-4 and ∇log p(θ_t|D) is read from M7's variational free-energy gradient. `resolveNoiseScale` applies a `TRACTABILITY_NOISE_GAIN` multiplier so coin-flip skills receive proportionally more noise (higher exploration), tractable skills less. `guardDarkRoom` enforces the SC-DARK floor by clamping any parameter that would drop below M7's `minimum-activity` threshold back to that floor. `applyLangevinUpdate` chains noise injection → dark-room guard → MB-2 projection in a single call. Flag: `gsd-skill-creator.langevin.enabled`.

**MD-4 Temperature schedule** (`src/temperature/`) provides the annealing schedule that drives both MA-3+MD-2 and MD-3. `computeTemperature` implements a cosine-decay schedule: T(t) = T_min + ½·(T_base − T_min)·(1 + cos(π·t/t_max)), with `t` as the session counter and `T_base` informed by the current M8 Quintessence signal (`mapQuintessenceToBaseTemp`). `computeTractTempering` applies a tractability-weighted floor/ceiling: tractable-majority skill mixes are clamped below `TRACT_TEMPERING_CEILING`; coin-flip-majority mixes are floored at `TRACT_TEMPERING_FLOOR` to ensure continued exploration even late in the schedule. `resetTemperature` returns a warm-restart value for when a new branch-context is opened. When the flag is off, `currentTemperature()` returns `SENTINEL_TEMPERATURE = 1.0` (the deterministic limit of softmax), so MD-4 disabled = no-op (SC-MD4-01). Flag: `gsd-skill-creator.temperature.enabled`.

---

## Grove-Posture Summary

All three exploration-harness components are NEW-LAYER. Zero REWRITEs were executed.

| Component | Grove decision | Parent modules unchanged |
|-----------|---------------|--------------------------|
| MA-3+MD-2 Stochastic | NEW-LAYER (`src/stochastic/`) + bridge to M5 selector | M5 orchestration untouched |
| MD-3 Langevin | NEW-LAYER (`src/langevin/`) + bridge to M7 umwelt | M7 umwelt untouched |
| MD-4 Temperature | NEW-LAYER (`src/temperature/`) + reads M8 Quintessence | M8 symbiosis untouched |

---

## Activation Sequence

All exploration flags default off. The recommended activation sequence:

1. **`gsd-skill-creator.temperature.enabled: true`** — enables MD-4. Run `skill-creator temperature --status` to inspect the current T_base and Quintessence-derived signal before enabling downstream consumers. Tune `T_min`, `T_max`, and `t_max` in `.claude/settings.json` under `gsd-skill-creator.temperature` if the default cosine schedule does not match your session cadence.
2. **`gsd-skill-creator.stochastic.enabled: true`** — enables MA-3+MD-2. The selector will now sample rather than argmax. Monitor `skill-creator stats --selection-entropy` over a 10-session window to confirm the distribution is not collapsing prematurely.
3. **`gsd-skill-creator.langevin.enabled: true`** — enables MD-3. Requires M7 (`gsd-skill-creator.umwelt.enabled: true`) and MB-2 projection (`gsd-skill-creator.projection.enabled: true`) to be active; otherwise `applyLangevinUpdate` falls through to a no-op and logs a `langevin.bridge.skipped` event.

```json
{
  "gsd-skill-creator": {
    "stochastic":  { "enabled": false },
    "langevin":    { "enabled": false },
    "temperature": { "enabled": false, "T_min": 0.1, "T_max": 2.0, "t_max": 200 }
  }
}
```

---

## Primary Sources

- Welling, M., & Teh, Y. W. (2011). "Bayesian Learning via Stochastic Gradient Langevin Dynamics." *Proceedings of the 28th International Conference on Machine Learning (ICML 2011)*, pp. 681–688. — Introduces the SGLD update rule that MD-3 directly implements: adding Gaussian noise with variance η_t to gradient descent steps produces a Markov chain that converges to the true posterior in the decreasing-step-size limit. MD-4's annealing schedule is the variance schedule that makes SGLD's convergence guarantee applicable.
- Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems." *IEEE Transactions on Systems, Man, and Cybernetics*, SMC-13(5):834–846. — The MA-3 stochastic selection role (Associative Search Element) is the Barto 1983 ASE component; MA-3+MD-2 replaces the threshold-noise ASE perturbation with a temperature-weighted softmax draw, which is the smooth softmax equivalent of Barto's stochastic binary selector.

---

## See Also

- `docs/stability-rails.md` — Bundle 3: MB-2 projection composes with MD-3 Langevin updates
- `docs/representation-frontier.md` — Bundle 5: MD-4 temperature schedule drives MD-1/MD-5 training heat
- `docs/refinement-wave.md` — MA-2 ACE is the actor-critic consumer whose signal is now explored stochastically
- `CHANGELOG.md` — `[v1.49.561]` → Continuation wave subsection
- `docs/release-notes/v1.49.561/README.md` — per-phase commit table (phases 664–666)
- `docs/release-notes/v1.49.561/regression-report-continuation.md` — test counts and acceptance-criterion coverage for LS-34..LS-36
