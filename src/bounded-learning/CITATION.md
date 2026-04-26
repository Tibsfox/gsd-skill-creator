# 20%-Rule Citation Pin — Julia Parameter v1.49.577

**Phase:** 830 (JP-003, BLOCK)
**Component:** proof-companion-prerequisites
**Last updated:** 2026-04-25
**Linked back to:** `.planning/missions/julia-parameter-implementation/03-component-specs/proof-companion-prerequisites.md` §JP-003

---

## The Published Anchor

### arXiv:2604.20915 — Absorber LLM: Harnessing Causal Synchronization for Test-Time Training

The causal-synchronization KL bound from this paper is the published statistical statement that underpins the bounded-learning 20%-rule:

> A contextless model after a parameter update should match the original model's full-context behavior on future generations. The KL divergence between the updated model's output distribution (operating without privileged context) and the pre-update model's output distribution (operating with full context) bounds the degree to which the update "drifts" from the model's prior behavior. Formally, the synchronization gap `syncGap(π_post, π_pre)` must remain bounded for the contextless post-update model to remain a faithful absorber of the pre-update full-context model.

The 20% bounded-learning threshold operationalizes this bound: a parameter update whose scope exceeds 20% of the skill's byte-representation is taken as evidence that the synchronization gap may exceed a safe ε, triggering the dead-zone rejection or cooldown.

**Citation:** *Absorber LLM: Harnessing Causal Synchronization for Test-Time Training.* arXiv:2604.20915. (2026).

---

## Mathlib Formalization Target

### arXiv:2510.04070 — Markov Kernels in Mathlib's Probability Library

Degenne et al. (2025) formalize Markov kernels in Lean 4 / Mathlib4, including:

- `MeasureTheory.Kernel` — Markov kernel type, composition, disintegration theorem
- `MeasureTheory.KLDivergence` — KL divergence as a kernel-valued measurable function
- `ProbabilityTheory.entropy` — Shannon / differential entropy for discrete and continuous measures

These namespaces are the formal substrate for the `syncGap` bound. Any Lean proof of the bounded-learning cap must compile against these definitions.

**Pinned Lean toolchain + Mathlib commit:** see `src/mathematical-foundations/lean-toolchain.md` (JP-001, shipped at commit `c1f73f0cb`). That document is the authoritative source of truth for the toolchain version string and the Mathlib commit hash. Do not duplicate the pin here.

---

## Lean Target Statement

The formal Lean statement to be proved in Wave 3 (JP-030):

> ```lean
> -- Target statement (informal rendering — formal Lean pending JP-030)
> theorem bounded_update_kl_cap
>     (π_pre π_post : MeasureTheory.Kernel SkillSpace ActionSpace)
>     (u : SkillUpdate) :
>     syncGap π_post π_pre ≤ ε_20 := by
>   sorry -- proof deferred to Wave 3 (JP-030 / JP-031)
> ```

Equivalent declaration using the notation from the component spec:

```
∀ skill update u, syncGap(π_post, π_pre) ≤ ε_20
```

**ε_20 calibration is deferred to Wave 3.** The exact numeric value of ε_20 (and its mapping to the 20% byte-diff threshold) is propagated into the proof-companion mission at JP-030. This document records only the structural shape of the bound.

---

## Compose-With Note

This citation does **NOT** replace the existing `src/dead-zone/diff-bound-adapter.ts` byte-diff cap.

Per FINDINGS §6 Q1 the default is **compose**, not replace:

| Layer | Kind | Statement |
|---|---|---|
| `src/dead-zone/diff-bound-adapter.ts` | Operational, byte-level | A commit whose byte-diff magnitude exceeds `diffThreshold` (default 0.20) is rejected or smoothly suppressed by `adaptationScale`. |
| This citation (arXiv:2604.20915) | Formal, distributional | The KL divergence `syncGap(π_post, π_pre)` between the post-update and pre-update output distributions must remain ≤ ε_20. |

These are **complementary statements of the same 20% intuition** operating at different abstraction levels:

- The byte-diff cap is an efficient operational proxy measurable at commit time without model inference.
- The causal-synchronization KL bound is the distributional correctness criterion the byte-diff cap approximates.

Composing both layers means:
1. The byte-diff gate catches out-of-bounds updates cheaply at skill-commit time.
2. The KL bound provides the formal justification that the byte-diff gate is not arbitrary — it is an operational proxy for a distributional guarantee.

**Do not migrate to KL tracking in Part B.** The byte-diff cap in `src/dead-zone/diff-bound-adapter.ts` remains the active enforcement mechanism. The KL formal proof is a Wave 3 artifact (JP-030).

---

## References

- **arXiv:2604.20915** — *Absorber LLM: Harnessing Causal Synchronization for Test-Time Training.* (2026). Source of the causal-synchronization KL bound and target Lean statement.
- **arXiv:2510.04070** — Degenne, R., et al. (2025). *Markov kernels in Mathlib's probability library.* Lean 4 / Mathlib4 formalization of `MeasureTheory.Kernel`, `MeasureTheory.KLDivergence`, `ProbabilityTheory.entropy`.
- **`src/mathematical-foundations/lean-toolchain.md`** — JP-001 deliverable. Pinned Lean toolchain version + Mathlib commit hash. Source of truth for the Lean build environment.
- **`src/dead-zone/diff-bound-adapter.ts`** — MB-5 operational byte-diff cap. Default threshold 0.20 (the 20% bound). Lyapunov-composed with MB-1; smooth saturation via sigmoid dead-zone.
- **Component spec:** `.planning/missions/julia-parameter-implementation/03-component-specs/proof-companion-prerequisites.md` §JP-003.
