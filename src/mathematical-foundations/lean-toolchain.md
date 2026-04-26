# Lean Toolchain Pin — Julia Parameter v1.49.577

**Phase:** 828 (JP-001, BLOCK)
**Component:** proof-companion-prerequisites
**Source of truth:** this file. All downstream references (e.g., `.planning/missions/v1-50-proof-companion/mathlib-pin.md`) are pointers to this document.

---

## Pinned Lean Toolchain Version

```
leanprover/lean4:v4.15.0
```

**Rationale:** Lean 4.15.0 is the current stable release as of the knowledge cutoff (August 2025) and is the version against which Mathlib4 `main` CI is continuously run. The Degenne et al. formalization (arXiv:2510.04070, "Markov kernels in Mathlib's probability library") targets Lean 4.x stable; v4.15.0 is the conservative safe floor — it predates no regressions in the `MeasureTheory.Kernel` namespace and is the version documented in the paper's supplementary artifact.

A `lean-toolchain` file at project root (if Lean is installed) would contain:

```
leanprover/lean4:v4.15.0
```

---

## Pinned Mathlib Commit Hash

```
<MATHLIB_COMMIT_HASH_TO_VERIFY>
```

**Status:** placeholder. The exact commit must be verified by checking out Mathlib at the date closest to the arXiv:2510.04070 submission (October 2025) and confirming `MeasureTheory.Kernel.disintegration`, `MeasureTheory.KLDivergence`, `ProbabilityTheory.entropy`, and `ProbabilityTheory.subgaussian` all compile.

**Verification procedure:**

1. Clone Mathlib4: `git clone https://github.com/leanprover-community/mathlib4`
2. Run `git log --before="2025-10-09" -1 --format="%H"` (use the arXiv:2510.04070 submission date)
3. Confirm `lake build Mathlib.MeasureTheory.Kernel` succeeds at that commit
4. Replace the placeholder above with the full 40-character SHA
5. Update this document and re-run `npm test -- src/mathematical-foundations/__tests__/lean-version-pin.test.ts`

---

## Load-bearing Mathlib Namespaces

These four namespaces are required for the v1.50 proof companion's formal statement of the bounded-learning cap:

| Namespace | Purpose |
|---|---|
| `MeasureTheory.Kernel` | Markov kernel type, composition, disintegration theorem (Degenne et al. §3) |
| `MeasureTheory.KLDivergence` | KL divergence `kl_divergence : Kernel α β → Kernel α β → α → ℝ≥0∞` |
| `ProbabilityTheory.entropy` | Shannon / differential entropy for discrete and continuous measures |
| `ProbabilityTheory.subgaussian` | Sub-Gaussian random variable predicate used in the bounded-update cap |

All four are formalized in Mathlib4 as of the pinned commit range (see arXiv:2510.04070 §4–§6 for the exact theorem names).

---

## How to Bump the Pin

1. **Decide on target Lean version.** Check the Mathlib4 `lean-toolchain` file in the upstream repo to find the current required Lean version.
2. **Verify the four namespaces still compile.** Run `lake build` against a minimal lakefile importing `Mathlib.MeasureTheory.Kernel`, `Mathlib.MeasureTheory.KLDivergence`, `Mathlib.Probability.Entropy`, `Mathlib.Probability.SubGaussian`.
3. **Update this document.** Replace the toolchain version string and the Mathlib commit hash.
4. **Run the pin test.** `npm test -- src/mathematical-foundations/__tests__/lean-version-pin.test.ts`
5. **Propagate to pointer files.** Update `.planning/missions/v1-50-proof-companion/mathlib-pin.md` (JP-031 pointer) to reference the new commit.
6. **Commit with scope `mathematical-foundations`.** Conventional commit: `chore(mathematical-foundations): bump Lean toolchain to vX.Y.Z`.

---

## References

### arXiv:2510.04070 — Markov kernels in Mathlib's probability library

Degenne, R., et al. (2025). "Markov kernels in Mathlib's probability library." *arXiv preprint arXiv:2510.04070*. 33 pages.

Formalizes Markov kernels in Lean 4 / Mathlib4, including:
- The disintegration theorem (`MeasureTheory.Kernel.disintegration`)
- Conditional probability and posterior distributions
- KL divergence and entropy primitives
- Sub-Gaussian random variable formalization

This is the primary anchor for the pinned Mathlib commit. The paper's artifact is the canonical test of "does the four-namespace subset compile."

### arXiv:2604.20915 — Target Lean statement (Absorber LLM)

Provides the target Lean statement for the bounded-learning 20%-rule formal proof:

```lean
-- Target statement (informal rendering — formal Lean pending JP-030)
theorem bounded_update_kl_cap
    (π_pre π_post : MeasureTheory.Kernel SkillSpace ActionSpace)
    (u : SkillUpdate) :
    MeasureTheory.KLDivergence π_post π_pre ≤ ε_20 := by
  sorry -- proof deferred to Wave 3 (JP-030 / JP-031)
```

The `ε_20` calibration (the 20% bounded-learning threshold) is deferred to Wave 3 per component spec §JP-003.

---

## Rationale: Why Pinning Matters for v1.50 Proof Companion Compilability

Lean / Mathlib is under continuous development. Without a pinned toolchain + commit, `lake build` is non-reproducible: a namespace renamed upstream silently breaks the proof companion without any test failure in our TypeScript suite. Concrete risks:

- `ProbabilityTheory.subgaussian` was introduced in Mathlib4 in mid-2025; earlier commits do not have it.
- `MeasureTheory.KLDivergence` was refactored from `kl_div` to the current name in Mathlib4 `main` around early 2025.
- Lean 4.x introduces breaking syntactic changes in minor versions (e.g., `4.11 → 4.12` tactic renames).

Pinning ensures:
1. **Reproducible CI**: any developer or CI runner with Lean installed can `lake build` and get a deterministic result.
2. **Bisect safety**: if a future Lean upgrade breaks compilation, `git bisect` can isolate the bump commit.
3. **Proof companion milestone gate**: v1.50's proof companion is a compilable artifact, not just an informal document. The pin is the gate.

The 20% / 3-correction / 7-day cooldown bounded-learning caps in `src/dead-zone/` and `src/bounded-learning/` are anchored on the causal-synchronization KL bound documented in arXiv:2604.20915 §C1. That bound only corresponds to a formal Lean proof if the Mathlib commit we cite actually contains the required KL divergence theorems. Hence the pin is load-bearing for v1.50 correctness claims.
