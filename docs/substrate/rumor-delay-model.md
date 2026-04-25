# Rumor Delay Model — UIP-22 T3b

> Phase 774, v1.49.573 Upstream Intelligence Pack v1.44.
> Strictly optional T3b module. Reference implementation only — no calls from
> production code paths.

`src/rumor-delay-model/` implements a **stochastic-delayed-dynamics (SDDE)
model** for upstream-intelligence-pack signal-vs-hype separation, applied to the
SENTINEL/ANALYST pipeline for structured misinformation handling.

## Antecedent paper

**Alyami, Hamadouche, Hussain.** "Stochastic Delayed Dynamics of Rumor
Propagation with Awareness and Fact-Checking." arXiv:2604.17368, 2026. math.DS.
Cross-listed in the 17–23 April 2026 arXiv eess window (M7 Safety/Verification/
Pedagogy module, UIP-22).

This module is the Phase 774 T3b implementation of the SDDE framework named in:
- `module_7.tex` §7.2 (Stochastic Rumor Propagation Flagship)
- `m7-capcom-revision.tex` §4 (SENTINEL/ANALYST Misinfo Handling)

## Mathematical model

The paper models a population of N individuals partitioned into four compartments:
S(t) susceptible, R(t) rumorists, A(t) aware-but-not-checking, F(t) fact-checkers.

The dynamics are governed by the SDDE (arXiv:2604.17368 §2):

```
dS = [-β·S(t-τ)·R(t) + μ·(N-S)] dt + σ₁·S dW₁
dR = [β·S(t-τ)·R(t) - (γ+δ)·R] dt + σ₂·R dW₂
dA = [δ·R - α·A] dt
dF = [α·A - μ·F] dt
```

where:
- τ > 0 — fact-checking delay (the central SDDE parameter)
- β — transmission rate
- γ — rumor-cessation rate
- δ — awareness rate
- α — fact-checking rate
- μ — population turnover rate
- W₁, W₂ — independent Wiener processes (Brownian motion)

Basic reproduction number: **R₀ = β / (γ + δ)**

Stability (arXiv:2604.17368 Theorem 2.1):
- R₀ < 1: rumor-free equilibrium almost-surely exponentially stable
- R₀ > 1: rumor persists with positive probability
- The delay τ does not alter the stability threshold but governs the **transient
  peak height**: larger τ → higher peak spreader population before fact-checking
  takes effect

## SENTINEL/ANALYST pipeline mapping

Per m7-capcom-revision.tex §4:

| SDDE parameter | SENTINEL/ANALYST mapping |
|---------------|--------------------------|
| τ (delay) | Claim-age threshold: claims older than τ (default 24h) are quarantined pending explicit fact-check before ANALYST admission |
| R₀ analogue | Claim influence score ρ: claims with ρ > ρ* (default 1.0) enter expedited verification queue |
| σ₁, σ₂ (noise) | SENTINEL sensor noise tolerance: widens the ρ* band by ±2σ |

## Module structure

```
src/rumor-delay-model/
├── types.ts                   # SDDEParameters, Rumor, PropagationNetwork,
│                              # PropagationTrajectory, SignalObservation,
│                              # SignalClassification, TrajectoryStep
├── settings.ts                # Opt-in flag reader (fail-closed, default false)
├── sdde-solver.ts             # Euler-Maruyama SDDE solver + Box-Muller PRNG
├── sentinel-analyst-hook.ts   # Read-only SENTINEL/ANALYST integration hook
├── index.ts                   # Public API: simulatePropagation + analyzeSignalVsHype
└── __tests__/
    ├── sdde-solver.test.ts            # SDDE trajectory shape + noise + awareness tests
    ├── recovery-from-rumor.test.ts    # Monotonic τ → peak relationship
    ├── sentinel-analyst-hook.test.ts  # Flag-off passthrough + gate tests
    └── integration.test.ts            # End-to-end public API tests
```

## Opt-in mechanism

Default-off. Opt in via `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "rumor-delay-model": { "enabled": true }
    }
  }
}
```

With the flag off (or missing):
- `analyzeSignalVsHype` returns `{ classification: 'unknown', disabled: true }`
- `classifyClaimStream` returns all claims with `verdict: 'pass-through'`
- Existing SENTINEL behavior is byte-identical to pre-774 baseline

`simulatePropagation` always runs (pure compute; not gated by flag).

## Public API

```typescript
import {
  simulatePropagation,      // run SDDE solver for a rumor
  analyzeSignalVsHype,      // classify observation stream
  classifyClaimStream,      // SENTINEL/ANALYST hook (flag-gated)
  computeR0,                // R₀ = β/(γ+δ)
} from 'src/rumor-delay-model/index.js';
```

### `simulatePropagation(rumor, network, factCheckingDelay, seed?)`

Runs the Euler-Maruyama SDDE solver. `factCheckingDelay` maps directly to τ.
Returns `PropagationTrajectory` with full step-by-step S/R/A/F time series.

Qualitative behavior (per arXiv:2604.17368 §3):
- Longer τ → higher peak rumorist population
- Longer τ → later peak (longer recovery time)
- Both relationships are monotonic (verified by `recovery-from-rumor.test.ts`)

### `analyzeSignalVsHype(observations, settingsPath?)`

Classifies a stream of `SignalObservation[]` as `'signal'` (R₀ < 1 trajectory,
decaying) or `'hype'` (R₀ > 1 trajectory, sustained). Returns `'unknown'` when
the flag is off or observations are insufficient.

### `classifyClaimStream(rumors, observations?, evaluationMs?, tauMs?, settingsPath?)`

SENTINEL/ANALYST hook. Applies the Claim Age Gate (τ) and Influence Threshold
Gate (ρ*) per m7-capcom-revision.tex §4. Returns `StreamClassificationResult`
with per-claim assessments and an aggregate signal-vs-hype classification.

**Flag-off guarantee**: with the flag off, every claim verdict is `'pass-through'`
and aggregate classification is `'unknown'`. No existing pipeline behavior is
altered.

## Implementation: Euler-Maruyama SDDE solver

The solver in `sdde-solver.ts` implements the Euler-Maruyama discretisation with:

**Delay buffer:** A circular buffer of length `⌈τ/dt⌉` stores past S(t) values.
S(t-τ) is approximated by the oldest entry. Standard constant prehistory
assumption for SDDE IVPs.

**Box-Muller normal sampling:** Gaussian noise increments (dW ~ N(0, dt) =
√dt · N(0,1)) generated via the Box-Muller transform. No external SDE library
required (zero new dependencies).

**LCG PRNG:** Linear-congruential generator (Knuth constants a=1664525,
c=1013904223, m=2³²) provides seedable, reproducible randomness. Different seeds
produce statistically independent trajectories.

**Non-negativity clamping:** All compartment values are clamped to [0, N] after
each step to prevent negative-population artifacts from large noise steps.

## Integration target

The integration target is the **SENTINEL/ANALYST pipeline**
(`src/sentinel/` / `src/analyst/`) for upstream-intelligence-pack
signal-vs-hype separation. The `classifyClaimStream` function provides a
flag-gated hook that applies the claim-age gate (τ) and influence-threshold
gate (ρ*) to any incoming claim stream. With the flag off, every claim
verdict is `'pass-through'` — the existing SENTINEL behavior is
byte-identical to the pre-774 baseline.

```typescript
import { classifyClaimStream, simulatePropagation } from 'src/rumor-delay-model/index.js';

// Simulate propagation for a given rumor (always runs, flag-independent).
const trajectory = simulatePropagation(rumor, network, 24 /* τ=24h */, 42);

// Flag-gated SENTINEL/ANALYST hook: classify a stream of incoming claims.
const result = classifyClaimStream(
  claims,
  observations,
  Date.now(),
  24 * 60 * 60 * 1000, // τ in ms
);
// result.aggregate — 'signal' | 'hype' | 'unknown'
// result.claims    — per-claim assessments with verdicts
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.17368** — Alyami, Hamadouche, Hussain, *Stochastic Delayed
  Dynamics of Rumor Propagation with Awareness and Fact-Checking*, 2026

## CAPCOM preservation (G14)

This module strictly observes CAPCOM composition gate G14:

- Does NOT import from `src/orchestration/`, `src/capcom/`, or `src/dacp/`
- Does NOT alter CAPCOM-gate authority surfaces
- Does NOT modify any existing pipeline behavior with flag off
- Reference implementation only — no calls from production code paths

Verified by: `grep -rE "src/(orchestration|dacp|capcom)" src/rumor-delay-model/`
(returns 0 matches).

## Test coverage

All required coverage from Phase 774 specification:

| Requirement | Test file | Test name |
|-------------|-----------|-----------|
| SDDE trajectory shape (peak → decay) | `sdde-solver.test.ts` | "peak then decay: rumorist population is lower at end than at peak" |
| Recovery: longer τ → higher peak | `recovery-from-rumor.test.ts` | "peak rumorist count increases monotonically with τ" |
| Recovery: longer τ → later peak | `recovery-from-rumor.test.ts` | "peak step index increases with τ" |
| SENTINEL/ANALYST hook: flag off passthrough | `sentinel-analyst-hook.test.ts` | "flag off (missing config): every claim verdict is pass-through" |
| Default-off: `{ disabled: true, classification: 'unknown' }` | `integration.test.ts` | "flag off → { classification: unknown, disabled: true }" |
| Round-trip PropagationTrajectory JSON | `integration.test.ts` | "trajectory JSON round-trip preserves shape" |
| SDE noise: different seeds → different trajectories | `sdde-solver.test.ts` | "different seeds produce different trajectories when σ > 0" |
| Awareness-effect: higher δ → reduced peak | `sdde-solver.test.ts` | "higher awareness rate δ reduces the peak rumorist population" |
