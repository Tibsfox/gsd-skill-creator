/**
 * Coherent Functors — type definitions.
 *
 * Types sketched in module_3.tex §13 (arXiv:2604.15100 / pugh2026coherent).
 * The goal is a small, well-typed primitive — not a framework.
 *
 * All types are pure data. No side effects, no I/O, no CAPCOM interaction.
 *
 * @module coherent-functors/types
 */

/** A morphism between two objects in some category. */
export interface Morphism<A, B> {
  readonly source: A;
  readonly target: B;
  /** Human-readable identifier for the morphism (used in coherence witnesses). */
  readonly name: string;
}

/**
 * Minimal categorical structure — just enough to host coherent functors.
 *
 * Identity, composition, and an optional direct-sum decomposition for the
 * fourth coherence condition (direct-sum compatibility).
 */
export interface Category<O> {
  readonly name: string;
  identity(o: O): Morphism<O, O>;
  compose<A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C>;
  /** Equality on objects. Structural, user-provided. */
  equalObjects(x: O, y: O): boolean;
  /** Optional direct-sum operation; presence enables the direct-sum coherence check. */
  readonly directSum?: (a: O, b: O) => O;
}

/**
 * Witnesses for the four coherence conditions (Gate G6 preservation predicates).
 *
 * Each field names an explicit witness string the implementation stamps into
 * the functor at construction time. checkCoherence inspects these.
 */
export interface CoherenceWitness<_C, _D> {
  /** Witness string for naturality of Present : Arch → F. */
  readonly naturality: string;
  /** Witness string for Present(id_A) = id_{Present(A)}. */
  readonly identity: string;
  /**
   * Witness string for Present(g ∘ f) = Present(g) ∘ Present(f). Empty on
   * freshly-factoried functors; populated by `compose`.
   */
  readonly composition: string;
  /**
   * Witness string for Present(A1 ⊕ A2) ≅ Present(A1) ⊕ Present(A2). Only
   * populated when the target category exposes `directSum`.
   */
  readonly directSum: string;
}

/**
 * A coherent functor between two categories.
 *
 * M3 §13 signature (1): the functor object itself.
 */
export interface CoherentFunctor<C, D> {
  readonly name: string;
  readonly source: Category<C>;
  readonly target: Category<D>;
  readonly onObjects: (c: C) => D;
  readonly onMorphisms: <A, B>(f: Morphism<A, B>) => Morphism<D, D>;
  readonly coherenceData: CoherenceWitness<C, D>;
}

/** A single layer spec for an architecture. */
export interface LayerSpec {
  readonly kind: string;
  readonly width?: number;
  readonly activation?: string;
}

/** A type signature on the input/output of an architecture. */
export interface TypeSignature {
  readonly shape: ReadonlyArray<number>;
  readonly dtype: 'f32' | 'f64' | 'i32' | 'i64' | 'u8' | 'opaque';
}

/** A neural-network architecture spec. M3 §13 signature (2) input. */
export interface Architecture {
  readonly name: string;
  readonly layers: ReadonlyArray<LayerSpec>;
  readonly inputType: TypeSignature;
  readonly outputType: TypeSignature;
}

/** Result of a single coherence predicate check. */
export interface PredicateResult {
  readonly ok: boolean;
  readonly witness: string;
  readonly detail?: string;
}

/**
 * Report produced by checkCoherence. M3 §13 signature (4) output.
 *
 * `ok === true` iff all four predicates pass.
 */
export interface CoherenceReport {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<{
    readonly kind: 'identity' | 'composition' | 'direct-sum' | 'naturality';
    readonly witness: string;
    readonly detail?: string;
  }>;
}

/** Result of input-shape validation. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<string>;
}
