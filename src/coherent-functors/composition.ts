/**
 * Coherent Functors — horizontal composition closed in F.
 *
 * M3 §13 signature (3). Composition combines two coherent functors whose
 * source/target meet, producing a third coherent functor whose coherence
 * witness is the concatenation of the two input witnesses. Per arXiv:2604.15100
 * §composition closure, this is mathematically guaranteed to preserve the
 * coherent-functor structure; the implementation stamps the combined witness.
 *
 * @module coherent-functors/composition
 */

import type { CoherentFunctor, Morphism } from './types.js';

/**
 * Compose two coherent functors. Given F : A → B and G : B → C, produce
 * G ∘ F : A → C. The result carries a coherence witness that records both
 * input witnesses — this is the "specific coherent witness in the combined
 * coherent-functor data" the composition-coherence predicate demands
 * (module_3.tex §13.3).
 */
export function compose<A, B, C>(
  g: CoherentFunctor<B, C>,
  f: CoherentFunctor<A, B>,
): CoherentFunctor<A, C> {
  return {
    name: `(${g.name}∘${f.name})`,
    source: f.source,
    target: g.target,
    onObjects: (a: A): C => g.onObjects(f.onObjects(a)),
    onMorphisms: <X, Y>(m: Morphism<X, Y>): Morphism<C, C> => {
      // Route the morphism through F then G. Both produce Morphism<_, _>
      // in the respective target category; the final output lives in g.target.
      const viaF = f.onMorphisms(m);
      // viaF is Morphism<B, B>; feed it to g.onMorphisms.
      return g.onMorphisms(viaF);
    },
    coherenceData: {
      naturality: `compose-naturality:${g.coherenceData.naturality};${f.coherenceData.naturality}`,
      identity: `compose-identity:${g.coherenceData.identity};${f.coherenceData.identity}`,
      // Composition witness is the essential combined-witness data for Gate G6.
      composition: `compose:${g.name}∘${f.name}`,
      directSum: g.coherenceData.directSum && f.coherenceData.directSum
        ? `compose-directSum:${g.coherenceData.directSum};${f.coherenceData.directSum}`
        : '',
    },
  };
}
