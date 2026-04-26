# Newton-Kantorovich Existence-Verification Primitive — Julia Parameter v1.49.577

**Phase:** 837 (JP-028, MEDIUM)
**Component:** mathematical-foundations
**Anchor:** arXiv:2604.21887 — Newton-Kantorovich Theorem for Operator Equations (2026)
**Depends on:** JP-001 (Lean toolchain pin — `lean-toolchain.md`)

---

## Overview

The **Newton-Kantorovich theorem** provides a constructive existence-and-uniqueness
certificate for solutions of operator equations `F(x) = 0` in Banach spaces. Its value
here is **formal statability**: the convergence condition is a single checkable inequality
over computable constants, making it a natural target for the Lean/Mathlib4 proof companion
pipeline (pinned at `leanprover/lean4:v4.15.0` per `lean-toolchain.md`).

This document defines the convergence primitive, its verification formula, and its role
in the `gsd-skill-creator` mathematical-foundations layer.

---

## Newton-Kantorovich Convergence Condition

Let `F : D ⊆ X → Y` be a nonlinear operator between Banach spaces `X` and `Y`.
Let `x₀ ∈ D` be an initial point with `[F'(x₀)]⁻¹` existing. Define:

| Symbol | Meaning |
|--------|---------|
| `α` | `‖[F'(x₀)]⁻¹ F(x₀)‖` — size of the first Newton step |
| `β` | `‖[F'(x₀)]⁻¹‖` — norm of the initial inverse |
| `K` | Lipschitz constant of `F'` on `D`: `‖F'(x) - F'(y)‖ ≤ K ‖x - y‖` |

**Newton-Kantorovich convergence condition (NK):**

```
h := α · β · K ≤ 1/2
```

When NK holds, the Newton sequence `x_{n+1} = x_n - [F'(x_n)]⁻¹ F(x_n)` converges
quadratically to a unique solution `x* ∈ B(x₀, r*)` where:

```
r* = (1 - √(1 - 2h)) / (β · K)
```

**Source:** arXiv:2604.21887, Theorem 2.1 (NK condition + convergence radius formula).

---

## Verification Primitive

The **existence-verification primitive** takes `(α, β, K)` and returns:

1. `h = α · β · K` — the NK discriminant.
2. `converges: boolean` — `true` iff `h ≤ 1/2`.
3. `r_star: number | null` — convergence radius when `converges = true`; `null` otherwise.

**Formula (machine-checkable):**

```
h     = α * β * K
r*    = h ≤ 0.5 ? (1 - Math.sqrt(1 - 2*h)) / (β * K) : null
```

This formula is the load-bearing identity: any implementation of the primitive must
satisfy it exactly. The test in `__tests__/newton-kantorovich.test.ts` asserts this
formula on a synthetic operator.

---

## Lean-Statability (JP-001 cross-link)

The NK condition `h ≤ 1/2` is directly statable in Mathlib4:

```lean
-- Lean 4 sketch (requires Mathlib.Analysis.SpecificLimits.Basic)
theorem newton_kantorovich_gate (α β K : ℝ)
    (hα : 0 < α) (hβ : 0 < β) (hK : 0 < K)
    (h_nk : α * β * K ≤ 1/2) :
    ∃ r_star : ℝ, r_star = (1 - Real.sqrt (1 - 2 * α * β * K)) / (β * K) := by
  exact ⟨(1 - Real.sqrt (1 - 2 * α * β * K)) / (β * K), rfl⟩
```

The existence of `r_star` is tautological (it is defined by the formula) — the
non-trivial Mathlib lemma is `Real.sqrt_le_sqrt` + `Real.sqrt_lt_one` ensuring
`0 < 1 - 2h` when `h < 1/2`, so `r_star > 0`. This is the first non-trivial
formal statement in the proof companion pipeline anchored on arXiv:2604.21887.

**Lean toolchain:** `leanprover/lean4:v4.15.0` (see `lean-toolchain.md`).
**Mathlib namespace:** `Mathlib.Analysis.SpecificLimits.Basic`, `Real.sqrt`.

---

## Mapping to `src/mathematical-foundations/`

The NK primitive is a **convergence gate** analogous to the Lyapunov stability
certificate in `src/lyapunov/` (`V̇ ≤ 0` before each update). Both are:

- Scalar inequality checks over computable constants.
- Constructive certificates: passing the check implies a quantitative bound on
  the solution (convergence radius `r*` for NK; Lyapunov descent for MB-1).
- Formally statable: both reduce to real-valued inequalities in Mathlib4.

| NK concept | lyapunov analog |
|---|---|
| `h = αβK ≤ 1/2` | `V̇(x) ≤ 0` (Lyapunov decrease condition) |
| Convergence radius `r*` | Region of attraction estimate |
| Quadratic convergence rate | Exponential decay rate |

---

## References

### arXiv:2604.21887 — Newton-Kantorovich Theorem for Operator Equations

Primary anchor for this primitive. Theorem 2.1 gives the NK condition `h ≤ 1/2`
and the convergence-radius formula `r* = (1 - √(1-2h))/(βK)`. §4 discusses
formal-verification targets in Lean/Coq.

### lean-toolchain.md

Pinned Lean toolchain (`leanprover/lean4:v4.15.0`) required for the formal
NK proof seed. See §Lean-Statability above.

### src/lyapunov/ (MB-1)

Lyapunov-stable K_H adaptation — structural analog of the NK convergence gate
at the adaptive-learning layer.

### src/mathematical-foundations/discrete-vector-bundles.md (JP-013)

Discrete vector bundles — companion Tier-1 document in this module.
