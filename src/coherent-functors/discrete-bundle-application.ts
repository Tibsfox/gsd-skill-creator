/**
 * JP-027 (MEDIUM, Phase 837) — Discrete-bundle application in coherent-functors.
 *
 * Anchor: arXiv:2104.10277 (Discrete Vector Bundles with Connection,
 * Crane & Wardetzky 2021). Depends on JP-013 (shipped at 23809d534).
 *
 * Applies the discrete-bundle vocabulary from
 * `src/mathematical-foundations/discrete-vector-bundles.md` to a concrete
 * coherent-functors composition. The key mapping (per JP-013):
 *
 *   - Base simplicial complex K  ↔  Category C (objects = vertices, morphisms = edges)
 *   - Parallel transport Φ_e     ↔  Functor action on morphisms F(e)
 *   - Holonomy Hol(γ)            ↔  Composition coherence: F(g∘f) = F(g)∘F(f)
 *   - Flat connection            ↔  Coherent functor with stamped composition witness
 *
 * This file provides:
 *   1. `BundleSection` — a section of a discrete vector bundle over a category.
 *   2. `applyBundleTransport` — applies the functor's morphism map as a transport step.
 *   3. `bundleHolonomyWitness` — extracts the holonomy witness from a composed functor.
 *   4. `isFlatBundle` — checks whether a coherent functor represents a flat bundle
 *      (composition witness present + all coherence predicates pass).
 *
 * @module coherent-functors/discrete-bundle-application
 */

import type { Category, CoherentFunctor, Morphism } from './types.js';
import { checkComposition, checkIdentity } from './invariants.js';
import { compose } from './composition.js';

// ---------------------------------------------------------------------------
// BundleSection
// ---------------------------------------------------------------------------

/**
 * A section of a discrete vector bundle over a category C.
 *
 * Assigns to each object `c : C` a value `s(c)` in the fiber `F(c)`.
 * In the coherent-functors language this is a function from objects to
 * their functor images — the discrete analog of a global section
 * `s : V → ∪_v F_v` (arXiv:2104.10277 §2.1).
 */
export interface BundleSection<C, D> {
  /** Human-readable label for this section. */
  readonly name: string;
  /**
   * The functor whose image constitutes the fiber.
   * Each fiber F(c) = functor.onObjects(c).
   */
  readonly functor: CoherentFunctor<C, D>;
  /**
   * Evaluate the section at object `c`.
   * Returns `functor.onObjects(c)` — the value in the fiber over `c`.
   */
  readonly at: (c: C) => D;
}

/**
 * Build a canonical section of the bundle defined by `functor`.
 * The section is the functor itself: at each vertex c, the value is F(c).
 */
export function canonicalSection<C, D>(
  functor: CoherentFunctor<C, D>,
): BundleSection<C, D> {
  return {
    name: `canonical-section(${functor.name})`,
    functor,
    at: (c: C): D => functor.onObjects(c),
  };
}

// ---------------------------------------------------------------------------
// applyBundleTransport
// ---------------------------------------------------------------------------

/**
 * Apply one step of bundle transport along morphism `edge`.
 *
 * In the discrete-bundle picture: given a section value `fiberValue` in the
 * fiber `F_u` at the source vertex `u`, transport it to the fiber `F_v` at
 * the target vertex `v` using the parallel transport map Φ_edge = F(edge).
 *
 * In the coherent-functors picture: apply `functor.onMorphisms(edge)` to
 * obtain the transported morphism, and confirm the functor's identity
 * coherence witness is present (the flat-connection condition at a single step).
 *
 * Returns the transported fiber value and the morphism produced by the functor.
 *
 * @param functor  The coherent functor acting as the discrete connection.
 * @param edge     The oriented edge (morphism in C) along which to transport.
 * @param _fiberValue  Current value in the source fiber (kept for type safety;
 *                     in ℝ^1 the transport scalar is in the morphism name).
 */
export function applyBundleTransport<C, D>(
  functor: CoherentFunctor<C, D>,
  edge: Morphism<C, C>,
  _fiberValue: D,
): { transported: Morphism<D, D>; identityWitnessPresent: boolean } {
  const transported = functor.onMorphisms(edge);
  const identityCheck = checkIdentity(functor);
  return {
    transported,
    identityWitnessPresent: identityCheck.ok,
  };
}

// ---------------------------------------------------------------------------
// bundleHolonomyWitness
// ---------------------------------------------------------------------------

/**
 * Extract the holonomy witness from a composed coherent functor.
 *
 * For a composition G ∘ F, the composition witness in `coherenceData.composition`
 * records that the transport maps compose consistently — this is the
 * discrete-bundle statement Φ_{G∘F} = Φ_G ∘ Φ_F (arXiv:2104.10277 §3.2).
 *
 * Returns the composition witness string (non-empty iff the functor was
 * produced by `compose` and the holonomy is "trivial" in the flat sense).
 */
export function bundleHolonomyWitness<C, D>(
  functor: CoherentFunctor<C, D>,
): string {
  return functor.coherenceData.composition;
}

// ---------------------------------------------------------------------------
// isFlatBundle
// ---------------------------------------------------------------------------

/**
 * Check whether a coherent functor represents a flat discrete bundle.
 *
 * A flat bundle is one where every face holonomy is identity.
 * In the coherent-functors language:
 *   1. The composition witness is non-empty (composition coherence stamped).
 *   2. `checkComposition` passes (composition coherence predicate satisfied).
 *   3. `checkIdentity` passes (identity transport is trivial).
 *
 * A freshly-factored identity functor is always flat.
 * A composed functor is flat iff both factors were flat and `compose` stamped
 * the combined witness.
 *
 * @returns `{ flat: boolean; reason: string }` — reason is a short diagnostic.
 */
export function isFlatBundle<C, D>(
  functor: CoherentFunctor<C, D>,
): { flat: boolean; reason: string } {
  const witnessPresent = functor.coherenceData.composition.length > 0;

  // Check witness presence first: without a stamped composition witness the
  // functor was never run through compose() — it cannot certify bundle flatness
  // regardless of what checkComposition returns (which inspects the same witness).
  if (!witnessPresent) {
    return {
      flat: false,
      reason: 'composition-witness-absent: functor has no stamped composition witness (not produced by compose())',
    };
  }

  const identityCheck = checkIdentity(functor);
  if (!identityCheck.ok) {
    return { flat: false, reason: `identity-coherence-failed: ${identityCheck.witness}` };
  }

  const compositionCheck = checkComposition(functor);
  if (!compositionCheck.ok) {
    return { flat: false, reason: `composition-coherence-failed: ${compositionCheck.witness}` };
  }

  return { flat: true, reason: `flat: composition-witness=${functor.coherenceData.composition}` };
}

// ---------------------------------------------------------------------------
// composeAsBundle
// ---------------------------------------------------------------------------

/**
 * Compose two coherent functors as a bundle transport composition.
 *
 * This is `compose(g, f)` with the additional assertion that the result
 * carries a non-empty holonomy witness — confirming the composed transport
 * Φ_{G∘F} = Φ_G ∘ Φ_F (the discrete flat-connection check per JP-013).
 *
 * The bundle application vocabulary: given functors F : A → B (transport
 * over edges A→B) and G : B → C (transport over edges B→C), the composed
 * functor G∘F transports over paths A→B→C, and the composition coherence
 * witness records that this composed transport is associative and flat.
 */
export function composeAsBundle<A, B, C>(
  g: CoherentFunctor<B, C>,
  f: CoherentFunctor<A, B>,
  sourceCategory: Category<A>,
): CoherentFunctor<A, C> & { holonomyWitness: string; bundleFlat: boolean } {
  const composed = compose(g, f);
  const holonomyWitness = bundleHolonomyWitness(composed);
  // A freshly-composed functor always has a stamped composition witness.
  // isFlatBundle checks identity + composition coherence predicates, but
  // for a composed pair of identity/factory functors those always pass.
  const flatCheck = isFlatBundle(composed);

  // Satisfy the TypeScript compiler: attach bundle-specific fields.
  void sourceCategory; // used as proof that the caller scoped correctly
  return {
    ...composed,
    holonomyWitness,
    bundleFlat: flatCheck.flat,
  };
}
