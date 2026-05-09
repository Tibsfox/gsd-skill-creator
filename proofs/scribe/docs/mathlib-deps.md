# Mathlib dependencies

This document lists the Mathlib lemmas and definitions the SCRIBE proof
companion depends on, organized by proof obligation.

## Mathlib commit pin

Per CLAUDE.md "External Citations" §JULIA-PARAMETER, the v1.50 proof
companion compiles against the Markov-kernel formalization upstreamed
by **Degenne et al. (arXiv:2510.04070)**. This package follows the same
pinning discipline.

The `lakefile.lean` declares:

```lean
require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @ "v4.15.0"
```

`v4.15.0` is the Lean toolchain version; Mathlib's tag-vs-commit story
is documented at <https://github.com/leanprover-community/mathlib4/releases>.
The first `lake update` in this directory resolves `v4.15.0` to a
concrete commit SHA which is then committed in `lake-manifest.json`
for reproducibility.

**Verification of the Markov-kernel formalization:** after `lake update`,
the operator should verify the Mathlib tree at the resolved commit
contains `Mathlib/Probability/Kernel/Basic.lean` (the entry point for
Degenne et al.'s formalization). If not, bump the pin to a commit that
includes it; document the bump in this file.

## Per-obligation Mathlib needs

### P1 (BinOp label roundtrip)

- `decide` tactic (built-in; works because `BinOp` has `DecidableEq`)
- alternatively `simp` + `rfl`

### P2 (node-count preservation)

- `Mathlib.Data.List.Basic` — `List.length_filterMap`, `List.length_append`,
  `List.length_map`
- `Mathlib.Data.List.Sort` — `List.length_mergeSort`
- `Mathlib.Data.Nat.Basic` — arithmetic identities

### P3 (child-edge arity)

- `Mathlib.Data.List.Count` — `List.countP_le_length`, `List.countP_eq_zero`,
  `List.countP_filter`
- `Mathlib.Data.List.Nodup` — uniqueness of post-order IDs

### P4 (sibling-order preservation)

- `Mathlib.Data.List.Sort` — `List.Sorted`, `List.Sorted.mergeSort_eq`
- `Mathlib.Data.List.Pairwise` — `List.Pairwise.imp`, `List.Pairwise.iff`
- `Mathlib.Data.List.Nodup` — for the strictly-ordered key

### P5 (round-trip identity)

- `Mathlib.Logic.Equiv.Basic` — `Equiv`, `Function.LeftInverse`,
  `Function.LeftInverse.injective`
- `Mathlib.Logic.Function.Basic` — `Function.LeftInverse`, `Function.RightInverse`
- `Mathlib.Init.Data.Option.Basic` — `Option.some.injEq`, `Option.bind_eq_some`

### P8 (Verilog semantic equivalence — toy subset)

- All of the above
- For any extension to probabilistic semantics:
  - `Mathlib.Probability.Kernel.Basic` (Degenne et al.) — Markov kernels
  - `Mathlib.Probability.Kernel.Composition` — kernel composition for
    multi-stage pipeline semantics
  - `Mathlib.Probability.IdentDistrib` — distributional equivalence
- For deterministic semantics:
  - `Mathlib.Logic.Function.Basic` for the equivalence relation
  - `Mathlib.Tactic.NormNum` for arithmetic decision procedure on
    closed-form expressions

### P9 (idempotency corollary)

- `Mathlib.Init.Data.Option.Basic` — `Option.some.inj`
- standard tactics; this is mostly bookkeeping after P5

## Why Mathlib (and not raw Lean)

Lean 4's standard library (`Std4`) covers basic data structures but is
deliberately small. The proof obligations here lean heavily on:

- **Sorting lemmas** for the sibling-order claim (`mergeSort` proofs are
  not in core Lean; they are in Mathlib)
- **Counting lemmas** (`List.countP_*`) for the arity claim
- **Equivalence-relation infrastructure** for the round-trip identity

All of these are in Mathlib but not Std4, hence the dependency.

## Citation chain

The Mathlib formalization of Markov kernels (used in v1.50's broader
proof companion; not strictly needed for the SCRIBE round-trip but
co-located by convention):

> Degenne R, et al. "Markov kernels in Lean Mathlib." arXiv:2510.04070,
> 2025. <https://arxiv.org/abs/2510.04070>

The substrate decision to pin against this formalization comes from:

> CLAUDE.md "External Citations (CS25–26 Sweep) — JULIA-PARAMETER additions
> (v1.49.577) — Formal probability substrate (arXiv:2510.04070)."

Composes with the round-trip thesis (Doc 06) via the C5 external-
verification-gate consequence of arXiv:2604.20874 (Root Theorem of
Context Engineering): formal verification is the high-assurance complement
to the empirical Doc 07 viewer test.
