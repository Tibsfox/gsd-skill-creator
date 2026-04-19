# Stability Rails — Living Sensoria (v1.49.561)

**Wave:** Continuation — Bundle 3 (phases 661–663)
**Parent:** Living Sensoria refinement wave (phases 651–660)
**Branch:** dev
**Date:** 2026-04-19
**Status:** shipped — MB-1, MB-2, MB-5 committed and tested

---

## The Problem This Solves

The refinement wave wires an actor-critic loop (MA-2) that updates M6's K_H receptor-affinity parameter based on reinforcement signal and tractability weighting. The wiring is correct structurally, but it leaves an open question: what prevents K_H from drifting outside the physiologically meaningful range during sustained adaptation? Classical gradient descent has no such guarantee. Under repeated low-tractability updates — each individually small — the parameter can accumulate drift that eventually moves the net-shift curve out of the Weber's-law log-linear regime, silently degrading the very response properties the Lanzara model is designed to preserve.

The stability-rails bundle answers this question by importing three complementary instruments from model-reference adaptive control (MRAC): a Lyapunov-stable adaptation law that certifies V̇ ≤ 0 before each update is applied (MB-1), a smooth projection operator that constrains every updated parameter to a defined admissible manifold (MB-2), and a dead-zone that suppresses updates entirely when the gradient signal is smaller than the estimated noise floor (MB-5). Together they give the adaptation loop a formal stability certificate drawn from Sastry & Bodson 1989 and Narendra & Annaswamy 1989 — the two canonical references for adaptive-control stability under bounded disturbance.

---

## Through-Line

```
MB-1 Lyapunov evaluates V̇ before each K_H update:
  if V̇ ≤ 0 → update is certified; proceed
  if V̇ > 0 → update is rejected; log DescentCertificate(ok: false)

MB-2 Smooth projection receives the candidate Δ K_H from MB-1:
  projects it onto the admissible manifold [K_H_min, K_H_max]
  (tractability-scaled bounds; coin-flip skills get a tighter range)

MB-5 Dead-zone gates both MB-1 and MB-2:
  computes |Δ K_H| against the noise-floor band (σ_noise)
  if |Δ K_H| ≤ σ_noise → suppress update (no Lyapunov check, no projection)
  if |Δ K_H| > σ_noise → pass through to MB-1 → MB-2 chain
```

The three components compose such that V̇ ≤ 0 holds across any 100-step trajectory on the integration fixture (`cross-bundle.test.ts` verifies this end-to-end).

---

## What Each Component Adds

**MB-1 Lyapunov-stable K_H adaptation** (`src/lyapunov/`) implements the adaptation law V(e) = ½ · e² where e = K_H − K_H* (error from the reference model), and verifies that the time-derivative V̇ = e · ė ≤ 0 before each update is committed. The `adaptKH` function builds a regressor from the current skill activation history, resolves a tractability-scaled gain `Γ` (TRACTABILITY_GAIN_TABLE maps `{tractable, unknown, coin-flip}` to `{1.0, 0.6, 0.3}`), and returns an `AdaptKHResult` with both the candidate update and the `DescentCertificate`. The `desensitisation-bridge.ts` adapter connects MB-1's output to M6's `netShift.ts` so the receptor substrate sees only Lyapunov-certified K_H values. Flag: `gsd-skill-creator.lyapunov.enabled`. Lineage: Sastry & Bodson 1989 §1.4 stability definitions, Narendra & Annaswamy 1989 Ch. 4 MRAS.

**MB-2 Smooth projection operators** (`src/projection/`) provides a family of projection primitives that keep every adapted parameter inside a closed admissible set. `smoothProject` implements the Calafiore & Chiani (2010) C¹ penalty-barrier blending that avoids the discontinuous gradient jump of hard-clamp projection: outside the admissible set the gradient is redirected inward with a smooth ramp over a configurable `epsilon` band. `projectToSimplex` handles the simplex-constrained case (M7 generative model rows). `projectKH` is the K_H adapter: it reads `parameter-bounds.ts` for the `[K_H_min, K_H_max]` bounds (with a tractability-dependent scale factor via `getTractabilityBoundScale`) and wraps `smoothProject`. MB-2 composes beneath MB-1: after the Lyapunov check certifies the direction, MB-2 ensures the landing point is admissible. Flag: `gsd-skill-creator.projection.enabled`.

**MB-5 Dead-zone bounded learning** (`src/dead-zone/`) implements a noise-band suppressor drawn from robust adaptive control (Ioannou & Sun 1996 dead-zone modification). `deadZone` computes whether the absolute update magnitude |Δ| falls within the estimated noise floor `bw` (bandwidth parameter); if so, it returns `{active: false, scale: 0}` and the caller skips both Lyapunov check and projection. `hardDeadZone` is the byte-identical fallback path used when the flag is off — it enforces M4's existing 20%-diff bound and 7-day cooldown, so SC-MB5-01 passes on 10,000 random samples. `lyapunov-composer.ts` in this module verifies that MB-1 and MB-5 compose without compounding error: under dead-zone suppression V̇ is trivially zero; outside it MB-1's certificate still holds. Flag: `gsd-skill-creator.lyapunov.dead_zone.enabled`.

---

## Grove-Posture Summary

All three stability-rails components are NEW-LAYER. Zero REWRITEs were executed.

| Component | Grove decision | Parent modules unchanged |
|-----------|---------------|--------------------------|
| MB-1 Lyapunov K_H | NEW-LAYER (`src/lyapunov/`) + bridge to M6 | M6 sensoria untouched |
| MB-2 Smooth projection | NEW-LAYER (`src/projection/`) | M6 sensoria + M7 umwelt untouched |
| MB-5 Dead-zone | NEW-LAYER (`src/dead-zone/`) | M4 branches untouched |

---

## Activation Sequence

All stability-rail flags default off. The recommended activation sequence:

1. **`gsd-skill-creator.lyapunov.enabled: true`** — enables MB-1 Lyapunov evaluation. Run `skill-creator lyapunov --audit` to review the descent-certificate log over a historical session fixture before enabling in production.
2. **`gsd-skill-creator.projection.enabled: true`** — enables MB-2. Review `getBounds()` output for each parameter type; adjust `K_H_min` / `K_H_max` in `.claude/settings.json` under `gsd-skill-creator.projection` if the default bounds differ from your deployment's receptor calibration.
3. **`gsd-skill-creator.lyapunov.dead_zone.enabled: true`** — enables MB-5. Tune the `bw` (bandwidth) parameter against your noise floor estimate; the default `bw = 0.05` is calibrated to the reference-fixture noise level.

When all three flags are off, the adaptation path falls through to M4's existing hard-bound + cooldown behaviour, byte-identically (SC-MB1-01..05, SC-MB2-01, SC-MB5-01 all PASS with flags off).

```json
{
  "gsd-skill-creator": {
    "lyapunov":   { "enabled": false, "dead_zone": { "enabled": false } },
    "projection": { "enabled": false }
  }
}
```

---

## Primary Sources

- Sastry, S., & Bodson, M. (1989). *Adaptive Control: Stability, Convergence, and Robustness*. Prentice Hall. — Lyapunov-stability framework for parameter adaptation; §1.4 stability definitions; §2.3 projection-operator posture on parameter updates. The formal vocabulary for what "convergence" means in the K_H adaptation context.
- Narendra, K. S., & Annaswamy, A. M. (1989). *Stable Adaptive Systems*. Prentice Hall. — Model-reference adaptive system (MRAS) programme; Ch. 4 Lyapunov analysis of MRAS under bounded disturbances. MB-1's gain table and descent-certificate logic trace to this lineage.
- Ioannou, P. A., & Sun, J. (1996). *Robust Adaptive Control*. Prentice Hall. — Dead-zone modification for robust MRAC (§4.3); the noise-band suppression logic in MB-5 is a scalar simplification of Ioannou & Sun's vector formulation.

---

## See Also

- `docs/exploration-harness.md` — Bundle 4: how MB-2 projection composes with MD-3 Langevin noise
- `docs/representation-frontier.md` — Bundle 5: how MB-1 Lyapunov composes with MD-5 learnable K_H
- `docs/refinement-wave.md` — original six refinement components; MA-2 ACE is the actor-critic consumer of stable K_H values
- `CHANGELOG.md` — `[v1.49.561]` → Continuation wave subsection
- `docs/release-notes/v1.49.561/README.md` — per-phase commit table (phases 661–663)
- `docs/release-notes/v1.49.561/regression-report-continuation.md` — test counts and acceptance-criterion coverage for LS-31..LS-33
