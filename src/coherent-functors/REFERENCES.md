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

*Placeholder — to be populated in Wave 3 (JP-015, Phase 845).*

### arXiv:2601.12944 — Tsallis Entropy

Will document the Tsallis entropy citation and optional `tsallis.ts` utility when JP-015 lands.

---

## Cross-references

- `src/mathematical-foundations/discrete-vector-bundles.md` — full discrete bundle formalism + mapping notes (JP-013).
- `src/mathematical-foundations/lean-toolchain.md` — pinned Lean 4 toolchain (JP-001); required for formal holonomy proofs.
- `src/branches/` — COW fork/explore/commit as discrete-bundle round-trip (cross-link documented in `discrete-vector-bundles.md`).
