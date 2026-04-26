# References — Coherent Functors

**Module:** `src/coherent-functors/`
**Phase:** 745 (MATH-13, T1a) + 834 (JP-013, discrete vector bundles mapping)

---

## Primary Anchor

### arXiv:2604.15100 — Coherent Functors via NN Presentation (Pugh, Grundy, Cirstea, Harris 2026)

Foundation for the module. Defines coherent functors as a categorical framework for neural-network presentation, with four coherence conditions (naturality, identity, composition, direct-sum). §13 gives the TypeScript-level signatures implemented in `types.ts`, `factory.ts`, `composition.ts`, and `invariants.ts`.

---

## JP-013 Mapping — Discrete Vector Bundles (arXiv:2104.10277)

**Added:** Phase 834 (JP-013, HIGH). See `src/mathematical-foundations/discrete-vector-bundles.md` for the full mapping.

### arXiv:2104.10277 — Discrete Vector Bundles with Connection (Crane & Wardetzky 2021)

Maps onto `src/coherent-functors/` as follows:

| Bundle concept | Coherent-functors construct |
|---|---|
| Base simplicial complex `K` | Category `C` (objects = vertices, morphisms = edges/paths) |
| Fiber `F_v` at vertex `v` | Functor image `F(v)` |
| Parallel transport `Φ_e` | Functor action on morphisms `F(e)` |
| Global section `s` | Natural transformation `s : id_C ⇒ F` |
| Holonomy `Hol(γ)` | Composition coherence: `F(g ∘ f) = F(g) ∘ F(f)` |
| Flat connection | Coherent functor with stamped composition witness |

The `checkComposition` predicate in `invariants.ts` is the discrete flat-connection check. The `compose(g, f)` function in `composition.ts` stamps the composition witness — confirming transport maps compose consistently (holonomy = identity for every path triangle).

**Integration test:** `__tests__/discrete-bundles-integration.test.ts` — holonomy-around-trivial-loop asserts identity.

---

## JP-015 — Tsallis Entropy Citation (arXiv:2601.12944)

**Added:** Phase 845 (JP-015, MEDIUM).

### arXiv:2601.12944 — Tsallis Entropy and Non-Extensive Statistical Mechanics

Tsallis entropy generalizes Shannon entropy via a deformation parameter `q`:

```
S_q(p) = (1 / (q - 1)) * (1 - Σ_i p_i^q)
```

At `q → 1`, `S_q` recovers standard Shannon entropy. For `q ≠ 1`, `S_q` is non-additive (non-extensive): `S_q(A ∪ B) ≠ S_q(A) + S_q(B)` for independent systems, which makes it appropriate for systems with long-range correlations, fractal phase spaces, or power-law behavior.

arXiv:2601.12944 establishes the connection between Tsallis entropy and the geometry of statistical manifolds, specifically:

- The `q`-exponential family as the natural model class under Tsallis entropy.
- Deformed KL divergence (`q`-divergence) as the Bregman divergence for `S_q`.
- The `q`-Fisher information metric, which generalizes the classical Fisher information.

### Relevance to src/coherent-functors/

The coherent-functor framework operates over a category `C` whose morphism spaces carry vector-space structure (direct sums, scalar multiples — see §13 of arXiv:2604.15100). When the functor image `F(v)` is interpreted as a probability distribution over skill activation outcomes, the entropy of that distribution characterizes *how much information the functor preserves*.

Tsallis entropy is the natural choice over Shannon here because:

1. Skill activation distributions are empirically heavy-tailed (power-law: a few skills activate very frequently, many rarely). The `q > 1` regime of `S_q` is better calibrated for heavy-tailed distributions than Shannon entropy.
2. The composition coherence condition (`F(g ∘ f) = F(g) ∘ F(f)`) implies a non-additive information structure: the information in a composed morphism is not the sum of the parts. The non-extensivity of `S_q` matches this algebraic structure.
3. The `q`-Fisher metric on the functor image space provides a principled distance for comparing skill-activation distributions across community boundaries (Leiden clusters in `src/graph/`).

### TODO-anchor — what an implementation would compute

<!-- TODO(JP-015): tsallis.ts implementation
     If implemented, this module would export:
       - tsallisEntropy(probs: Float64Array, q: number): number
         → Computes S_q(p) = (1/(q-1)) * (1 - sum(p_i^q))
         → q=1 limit handled via L'Hôpital / limit formula → Shannon entropy
       - qDivergence(p: Float64Array, r: Float64Array, q: number): number
         → Bregman divergence for S_q; collapses to KL at q=1
       - qFisherMetric(p: Float64Array, q: number): Float64Array
         → Diagonal of the q-Fisher information matrix (per-coordinate weights p_i^(q-2))
     Location: src/coherent-functors/tsallis.ts
     Gated by: the deferral note in the component spec — ship only if a concrete
     caller in src/graph/ or src/stochastic/ is ready to consume the output.
     Test: src/coherent-functors/__tests__/tsallis.test.ts
       → tsallisEntropy([0.5, 0.5], 1) ≈ ln(2) (Shannon limit)
       → tsallisEntropy([1.0], q) = 0 for all q (certainty → zero entropy)
       → qDivergence(p, p, q) = 0 (reflexivity)
-->

---

## Cross-references

- `src/mathematical-foundations/discrete-vector-bundles.md` — full discrete bundle formalism + mapping notes (JP-013).
- `src/mathematical-foundations/lean-toolchain.md` — pinned Lean 4 toolchain (JP-001); required for formal holonomy proofs.
- `src/branches/` — COW fork/explore/commit as discrete-bundle round-trip (cross-link documented in `discrete-vector-bundles.md`).
