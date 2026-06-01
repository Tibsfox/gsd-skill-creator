---
title: "v1.49.934 — CF3: integration-test proofs for the 3 dormant substrates (temperature/langevin/eligibility)"
version: v1.49.934
date: 2026-06-01
summary: >
  CF3 of the v929 carry-forward campaign: #10438 verify-axis integration proofs
  for three dormant substrates that had ZERO non-test importers — MD-4 temperature
  schedule, MD-3 Langevin noise injection, and MA-1 eligibility traces. Each test
  drives the real substrate at its designed boundary with REAL data (not mocks):
  the temperature schedule into the real softmax + real Langevin consumers; the
  Langevin bridge driven by a real temperature eta_0 through the SC-DARK floor and
  MB-2 simplex projection; and real MA-6 emitters through an on-disk JSONL log,
  replayed and decayed via the consumer read API. 17 tests, mutation-proven,
  zero production change.
tags: [tests, cf3, verify-axis, "#10438", temperature, langevin, eligibility, substrate-boundary]
---

# v1.49.934 — CF3: integration-test proofs for the 3 dormant substrates

**Shipped:** 2026-06-01

One-line: three #10438 verify-axis integration tests that prove the MD-4 temperature,
MD-3 Langevin, and MA-1 eligibility substrates at their designed boundaries with real
cross-substrate data — closing the consume/verify gap for three modules that had no
production callers.

## Why this ship

The v929 carry-forward CF3 named three substrates — `src/temperature` (MD-4),
`src/langevin` (MD-3), `src/eligibility` (MA-1) — each of which has **zero non-test
importers**. Their unit tests prove the internal math thoroughly, but nothing
exercises the substrate's *designed boundary*: the value it hands to a consumer, or
the real data path it sits on. A substrate awaiting a consumer is exactly where the
verify-axis discipline (#10438) applies — the `tests/integration/` proof *is* the
consume-axis closure (the v929 "composition-root N/A" pattern: prove the boundary
composes correctly with the real consumer code, without a production rewire).

## Audit-first recon

Because the v1.49.931 red CI came from a wrong-shape fixture, each test was scoped by
a parallel recon that read the modules' *actual* exported signatures and existing
unit tests, then probe-confirmed the exact fixture shapes and assertion values against
the real modules before any test was written. Every assertion's discriminating value
was observed from real module output first.

## What shipped (3 test files, zero production change)

- **`tests/integration/temperature-schedule-consumer-wire.integration.test.ts`** (6) —
  a real `TemperatureApi` is driven over a cooling-session trajectory; its boundary
  outputs feed the REAL `softmax` (MA-3: the distribution is flatter when hot, sharper
  when cool) and the REAL `injectLangevinNoise` (MD-3: η_0 = T_session × ETA0_SCALE
  produces larger L2 perturbation when hot). Plus the warmRestart, disabled-sentinel
  (SC-MD4-01), and coin-flip-vs-tractable tempering boundaries.

- **`tests/integration/langevin-temperature-noise-wire.integration.test.ts`** (6) — a
  real temperature η_0 drives `applyLangevinUpdate` (resolve scale → seeded Gaussian
  noise → SC-DARK floor guard → MB-2 `projectToSimplex`): schedule-modulation,
  seed reproducibility, the dark-room floor reverting to the pre-noise vector,
  the simplex invariant on every projected output, SC-MD3-01 flag-off byte-identity,
  and tractability-gain attenuation.

- **`tests/integration/eligibility-reinforcement-replay-wire.integration.test.ts`** (5) —
  real MA-6 emitters → `writeReinforcementEvents` (real JSONL on disk) →
  `replayReinforcementLog` → `EligibilityReader.getAllTracesAt`: a single spike
  round-trips to activation 1.0 and decays geometrically (e⁻¹ at +τ, e⁻² at +2τ);
  accumulation matches the closed-form TD(λ) recurrence e = δ·e + (1−δ)·r; distinct
  channels decay at distinct τ; a multi-skill multi-channel log yields one independent
  trace per (skill, channel).

## Verification

- 17 tests pass (6 + 6 + 5); all three type-clean (tsc with the tests included, exit 0).
- **Mutation-proven**: mutating the eligibility decay kernel (`τ → 2τ`) reds exactly the
  three decay-dependent assertions and leaves the two structural ones green; `git
  checkout` restores 5/5. The verify-axis tests have teeth.
- pre-tag-gate green (step 2.8 now also runs these three under the integration project).

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward
verify-axis work). Manifest **150** (no new lesson — three #10438 instances). Fifth
shipped item of the v929 carry-forward campaign (CF3). Remaining: CF4a (staged cargo CI
lane), CF4b (coprocessor skill-consumer example), CF4c (algebrus.eigen
intentionally-CPU-only verdict, folded into CF4b's docs).
