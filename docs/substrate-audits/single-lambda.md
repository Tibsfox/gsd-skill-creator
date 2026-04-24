# Single-λ Orchestration Audit

**Phase:** 730 (v1.49.571 Heuristics-Free Skill Space, T1c)
**Status:** Report-only. No substrate behavior is modified by this document.
**Source:** Balestriero & LeCun 2025, *LeJEPA* (arXiv:2511.08544v3) — Single-λ Principle.
**Hard constraint:** CAPCOM gates, Safety Warden BLOCK authority, and the human-in-the-loop verdict at wave boundaries are **NOT** candidates for collapse. Audit explicitly lists what is preserved.

## Premise

LeJEPA reports that its single hyperparameter λ balancing the JEPA prediction loss against SIGReg is robust across a wide range — the sweet spot is broad, not knife-edge. Six tunable weights in DINO-WM collapse to one in LeWM. The underlying observation is that when a distributional target is stated explicitly, many engineering safeguards that previously required independent tuning collapse into one principled trade-off parameter.

This audit enumerates every tunable knob in the `gsd-skill-creator` pipeline, identifies the distributional property each knob is guarding, and proposes single-λ-like balance parameters where clusters can collapse — **without sacrificing the specific safety property each knob currently guards**.

## Enumeration

### Cluster A — Bounded-learning caps (v1.49.560 era)

| Knob | Location | Current value | Guarding property |
|------|----------|---------------|-------------------|
| Content-change cap | `src/bounded-learning/*` | 20% per correction | Bounded step size in substrate mutation space — prevents runaway self-modification within a single cycle |
| 3-correction minimum | `src/bounded-learning/*` | 3 independent corrections required before commit | Redundancy against single-point outliers in correction signal |
| 7-day cooldown | `src/bounded-learning/*` | 7 days between corrections on the same substrate node | Temporal de-correlation — prevents correlated errors from locking substrate into a bad equilibrium |

**Proposed collapse (Cluster A):** A single `λ_bounded-learning` parameter setting the aggressiveness of self-modification, with the three existing knobs derived from it:
- `content_change_cap = f_A(λ)`
- `correction_min = g_A(λ)`
- `cooldown_days = h_A(λ)`

where `λ → 0` reproduces the current ultra-conservative regime and `λ → 1` allows a single, unbounded, immediate correction.

**What the collapse preserves:** the union of bounded-step + redundancy + temporal de-correlation properties. What it loses: the independent adjustability of each property. The audit recommends the collapse only if all three properties can be shown to trade off monotonically against a single underlying risk.

### Cluster B — Suggest thresholds / auto-load confidence gates

| Knob | Location | Current value | Guarding property |
|------|----------|---------------|-------------------|
| Suggest activation threshold | `src/skill-creator/detect.ts` (equivalent) | varies per phase | False-positive rate on skill suggestion |
| Auto-load confidence gate | `src/skill-loader/*` | confidence ≥ 0.7 typical | False-load rate (activating a skill that wasn't wanted) |
| Cooldown between suggests | ephemeral | unset in many places | De-duplication of suggestions within a window |

**Proposed collapse (Cluster B):** A single `λ_suggestion_aggressiveness` balancing recall against precision in the skill-suggestion pipeline. The three knobs become derived.

**What the collapse preserves:** the precision/recall trade-off itself. What it loses: the ability to tune precision independently from cooldown.

### Cluster C — MB-1 Lyapunov stability bands (v1.49.561)

| Knob | Location | Current value | Guarding property |
|------|----------|---------------|-------------------|
| Lyapunov candidate V band | `src/lyapunov/*` | tight quadratic | Monotone-decrease certification of update rule |
| Update-magnitude gate | `src/lyapunov/*` | bounded per MB-1 spec | Ṽ ≤ 0 before each update |

**Proposed collapse (Cluster C):** Already effectively single-λ — MB-1's Lyapunov function is a derived quantity with no independent tunables. The audit recommends **no change** to this cluster.

### Cluster D — MB-5 dead-zone widths (v1.49.561)

| Knob | Location | Current value | Guarding property |
|------|----------|---------------|-------------------|
| Dead-zone noise-band width | `src/dead-zone/*` | per-signal | Suppresses updates when noise dominates signal |
| Dead-zone hysteresis | `src/dead-zone/*` | per-signal | Prevents chattering at band boundary |

**Proposed collapse (Cluster D):** A single `λ_dead_zone_snr` parameter capturing the minimum signal-to-noise ratio at which updates are allowed to fire. Width + hysteresis derive from it.

**What the collapse preserves:** the SNR-gated update discipline. What it loses: the ability to independently choose hysteresis style.

### Cluster E — v1.49.570 trust-tier + two-gate knobs

| Knob | Location | Current value | Guarding property |
|------|----------|---------------|-------------------|
| Tier promotion gate τ | `src/trust-tiers/gate.ts` | per-tier | Promotion requires τ-margin on capability |
| Capacity cap K[m] | `src/bounded-learning/two-gate/*` | per-episode | Oracle-inequality log bound |

**Proposed collapse (Cluster E):** **No change.** τ + K[m] are the Wang & Dorchen 2026 Two-Gate pair — they are already a single principled guardrail with two explicit heads, not a lattice. Collapsing them would lose the oracle-inequality structure.

## What This Audit Does NOT Propose

**The following knobs are explicitly preserved as independent surfaces:**

- **CAPCOM gates** — human-gate authority at every wave boundary. These are not distributional constraints. They are the human-in-the-loop decision surface. Collapsing them would be a category error.
- **Safety Warden BLOCK** — final pre-publication pass. Not a knob; a sign-off.
- **Chipset model-allocation split (30/60/10 Opus/Sonnet/Haiku)** — these are cost/quality allocations, not safety knobs.
- **Trust tier promotion decisions** — Wang & Dorchen Two-Gate is already single-λ-in-spirit.

## Audit Result

| Cluster | Proposal | Safety impact |
|---------|----------|---------------|
| A — Bounded-learning caps (3 knobs → 1 λ) | Collapse recommended **only** if monotone trade-off can be shown across all three in production telemetry | Requires Phase 733 Intrinsic Telemetry to ship first |
| B — Suggest thresholds (3 knobs → 1 λ) | Collapse recommended for precision/recall only; cooldown stays independent for anti-chatter reasons | Low |
| C — MB-1 Lyapunov | No change — already single-parameter by construction | N/A |
| D — MB-5 dead-zone (2 knobs → 1 λ_SNR) | Collapse recommended | Low |
| E — trust-tier + two-gate (τ, K[m]) | No change — already the minimal principled pair | N/A |

**Recommendation:** Ship this document as-is. Implementation of the proposed collapses is deferred past v1.49.571 — this phase delivers the audit, not the collapse.

The audit recommends a follow-on milestone that lands Cluster B (cheapest + lowest risk) first, then Cluster D after production telemetry has validated the SNR single-parameter model, and Cluster A last after Phase 733's Intrinsic Telemetry has produced correlation data across the three knobs.

## CAPCOM Preservation Statement

This audit is report-only. No substrate behavior is modified by this document. No CAPCOM gate is bypassed, short-circuited, or made advisory. The human-in-the-loop verdict at wave boundaries remains authoritative in every proposed collapse. Every recommendation above is explicitly gated on Intrinsic Telemetry evidence or independent cluster-specific validation before implementation.

## References

- Balestriero, R. & LeCun, Y. (2025). *LeJEPA*, arXiv:2511.08544v3 — Single-λ Principle.
- Wang, A. & Dorchen, J. (2026). Two-Gate Guardrail, arXiv:2510.04399 — τ + K[m] pair.
- v1.49.561 Living Sensoria — MB-1 Lyapunov, MB-5 dead-zone specs.
- v1.49.570 Convergent Substrate — trust-tiers + two-gate modules (CONV-13..15).
