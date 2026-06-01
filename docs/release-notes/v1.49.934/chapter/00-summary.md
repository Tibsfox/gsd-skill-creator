# v1.49.934 — Summary

## The ship

CF3 of the v929 carry-forward campaign: three `tests/integration/*.integration.test.ts`
proofs (#10438 verify-axis) for the three dormant substrates that had **zero non-test
importers** — MD-4 temperature schedule, MD-3 Langevin noise injection, and MA-1
eligibility traces. Each drives the real substrate at its designed boundary with real
data, not mocks. Zero production code changed.

## What each proves

1. **temperature** — a real `TemperatureApi` cooling trajectory feeds the REAL MA-3
   `softmax` (flatter when hot, sharper when cool) and the REAL MD-3 Langevin noise
   scale η_0 = T_session × ETA0_SCALE (larger perturbation when hot). The schedule's
   entire reason-for-existence — to feed a selection temperature and a noise scale —
   is exercised against the real consumer code for the first time.

2. **langevin** — that η_0 (from a real temperature schedule) drives the full
   `applyLangevinUpdate` bridge: scale resolution → seeded Gaussian noise → SC-DARK
   floor guard (reverting to the pre-noise vector on collapse) → MB-2 simplex
   projection. Modulation, reproducibility, flag-off byte-identity, and tractability
   attenuation are all proven at the bridge boundary.

3. **eligibility** — real MA-6 emitters → a real on-disk JSONL log →
   `replayReinforcementLog` → the MA-2 consumer read API (`EligibilityReader`): a spike
   round-trips to 1.0 and decays e⁻¹/e⁻², accumulation matches the closed-form TD(λ)
   recurrence, channels decay at distinct τ, and a multi-channel log keeps independent
   traces.

## Why verify-axis here

A substrate with no production consumers is the textbook verify-axis case (#10438):
the integration test is the consume-axis closure (the v929 "composition-root N/A"
pattern). The proof is that the boundary value composes correctly with the real
consumer/data path — no production rewire required, because the consumers carry their
own resolvers and aren't yet wired to these substrates.

## The teeth

These are verify-axis tests, so they're only worth their cost if they catch
regressions. Demonstrated by mutation: changing the eligibility decay kernel
(`τ → 2τ`) reds exactly the three decay-dependent assertions and leaves the two
structural ones green; `git checkout` restores 5/5. Each assertion's mutation was
identified during recon and the discriminating values were probe-confirmed against
real module output before the test was authored.

## Scope discipline

Three new test files, zero production change, no new substrate, no new manifest lesson.
Counter-cadence unchanged at 20; NASA degree unchanged at 1.178.
